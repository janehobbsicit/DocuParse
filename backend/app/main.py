import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.routers import documents, templates, batch  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
    os.makedirs(upload_dir, exist_ok=True)
    yield


app = FastAPI(
    title="DocuParse AI",
    description="AI-powered document parsing and data extraction SaaS platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(templates.router, prefix="/api/templates", tags=["templates"])
app.include_router(batch.router, prefix="/api/batch", tags=["batch"])


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok"}
