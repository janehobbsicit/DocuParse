from __future__ import annotations
import csv
import io
import json
import os
import uuid
from typing import Optional

import aiofiles
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.extractors import get_extractor
from app.models import Document
from app.schemas import DocumentListResponse, DocumentResponse

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 10485760))
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".gif"}


def _get_file_type(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    if ext == ".pdf":
        return "pdf"
    return "image"


async def _extract_text(file_path: str, file_type: str) -> str:
    if file_type == "pdf":
        try:
            from pypdf import PdfReader
            reader = PdfReader(file_path)
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            return "\n".join(text_parts)
        except Exception as e:
            raise ValueError(f"PDF text extraction failed: {e}")
    else:
        try:
            import pytesseract
            from PIL import Image
            img = Image.open(file_path)
            return pytesseract.image_to_string(img)
        except ImportError:
            return "[OCR not available - pytesseract/tesseract not installed]"
        except Exception as e:
            raise ValueError(f"OCR extraction failed: {e}")


async def _process_document(doc: Document, db: AsyncSession) -> None:
    try:
        doc.status = "processing"
        await db.flush()

        file_path = os.path.join(UPLOAD_DIR, doc.filename)
        raw_text = await _extract_text(file_path, doc.file_type)
        doc.raw_text = raw_text

        extractor = get_extractor(doc.template_type)
        doc.extracted_data = extractor.safe_extract(raw_text)
        doc.status = "completed"
    except Exception as e:
        doc.status = "failed"
        doc.error_message = str(e)[:1000]


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    template_type: str = Form(default="generic"),
    db: AsyncSession = Depends(get_db),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type '{ext}' not allowed.")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large.")

    saved_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, saved_filename)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    doc = Document(
        filename=saved_filename,
        original_filename=file.filename or saved_filename,
        file_type=_get_file_type(file.filename or ""),
        file_size=len(content),
        template_type=template_type,
        status="pending",
    )
    db.add(doc)
    await db.flush()

    await _process_document(doc, db)
    await db.commit()
    await db.refresh(doc)
    return doc


@router.post("/batch-upload", status_code=201)
async def batch_upload_documents(
    files: list[UploadFile] = File(...),
    template_type: str = Form(default="generic"),
    db: AsyncSession = Depends(get_db),
):
    results = []
    for file in files:
        try:
            ext = os.path.splitext(file.filename or "")[1].lower()
            if ext not in ALLOWED_EXTENSIONS:
                results.append({"filename": file.filename, "error": f"File type '{ext}' not allowed."})
                continue

            content = await file.read()
            if len(content) > MAX_FILE_SIZE:
                results.append({"filename": file.filename, "error": "File too large."})
                continue

            saved_filename = f"{uuid.uuid4()}{ext}"
            file_path = os.path.join(UPLOAD_DIR, saved_filename)

            async with aiofiles.open(file_path, "wb") as f:
                await f.write(content)

            doc = Document(
                filename=saved_filename,
                original_filename=file.filename or saved_filename,
                file_type=_get_file_type(file.filename or ""),
                file_size=len(content),
                template_type=template_type,
                status="pending",
            )
            db.add(doc)
            await db.flush()

            await _process_document(doc, db)
            await db.commit()
            await db.refresh(doc)
            results.append({"filename": file.filename, "document_id": doc.id, "status": doc.status})
        except Exception as e:
            results.append({"filename": file.filename, "error": f"Processing failed: {e}"})

    return {"results": results, "total": len(results)}


@router.get("/", response_model=DocumentListResponse)
async def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Document)
    count_query = select(func.count()).select_from(Document)

    if status:
        query = query.where(Document.status == status)
        count_query = count_query.where(Document.status == status)

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.order_by(Document.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    documents = result.scalars().all()

    return DocumentListResponse(total=total, page=page, page_size=page_size, items=list(documents))


@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return doc


@router.delete("/{doc_id}", status_code=204)
async def delete_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    file_path = os.path.join(UPLOAD_DIR, doc.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    await db.delete(doc)
    await db.commit()


@router.get("/{doc_id}/export/json")
async def export_json(doc_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    if not doc.extracted_data:
        raise HTTPException(status_code=404, detail="No extracted data available.")

    return JSONResponse(
        content=doc.extracted_data,
        headers={"Content-Disposition": f'attachment; filename="{doc_id}_extraction.json"'},
    )


@router.get("/{doc_id}/export/csv")
async def export_csv(doc_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    if not doc.extracted_data:
        raise HTTPException(status_code=404, detail="No extracted data available.")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["key", "value"])

    for key, value in doc.extracted_data.items():
        if isinstance(value, list):
            flat_value = "; ".join(
                json.dumps(v) if isinstance(v, dict) else str(v) for v in value
            )
        else:
            flat_value = str(value)
        writer.writerow([key, flat_value])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{doc_id}_extraction.csv"'},
    )
