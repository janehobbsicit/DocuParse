from __future__ import annotations
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.extractors import get_extractor
from app.models import Document
from app.routers.documents import _extract_text, UPLOAD_DIR
from app.schemas import BatchProcessRequest, BatchStatusItem, BatchStatusResponse

router = APIRouter()

# In-memory batch registry (sufficient for single-process deployments)
_batch_registry: dict[str, dict] = {}


@router.post("/process", response_model=BatchStatusResponse)
async def process_batch(payload: BatchProcessRequest, db: AsyncSession = Depends(get_db)):
    batch_id = str(uuid.uuid4())
    items: list[BatchStatusItem] = []

    for doc_id in payload.document_ids:
        result = await db.execute(select(Document).where(Document.id == doc_id))
        doc = result.scalar_one_or_none()
        if not doc:
            items.append(BatchStatusItem(document_id=doc_id, status="failed", error_message="Document not found."))
            continue

        try:
            doc.status = "processing"
            await db.flush()

            import os
            file_path = os.path.join(UPLOAD_DIR, doc.filename)
            raw_text = await _extract_text(file_path, doc.file_type)
            doc.raw_text = raw_text

            extractor = get_extractor(doc.template_type)
            doc.extracted_data = extractor._safe_extract(raw_text)
            doc.status = "completed"
            await db.flush()
            items.append(BatchStatusItem(document_id=doc_id, status="completed"))
        except Exception as e:
            doc.status = "failed"
            doc.error_message = str(e)[:1000]
            await db.flush()
            items.append(BatchStatusItem(document_id=doc_id, status="failed", error_message=str(e)[:500]))

    await db.commit()

    completed = sum(1 for i in items if i.status == "completed")
    failed = sum(1 for i in items if i.status == "failed")
    pending = sum(1 for i in items if i.status == "pending")

    batch_result = BatchStatusResponse(
        batch_id=batch_id,
        total=len(items),
        completed=completed,
        failed=failed,
        pending=pending,
        items=items,
    )
    _batch_registry[batch_id] = batch_result.model_dump()
    return batch_result


@router.get("/status/{batch_id}", response_model=BatchStatusResponse)
async def get_batch_status(batch_id: str):
    if batch_id not in _batch_registry:
        raise HTTPException(status_code=404, detail="Batch not found.")
    return BatchStatusResponse(**_batch_registry[batch_id])
