from __future__ import annotations
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict


# Document schemas
class DocumentBase(BaseModel):
    original_filename: str
    file_type: str
    template_type: str = "generic"


class DocumentCreate(DocumentBase):
    filename: str
    file_size: int


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    template_type: str
    status: str
    raw_text: Optional[str] = None
    extracted_data: Optional[dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class DocumentListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[DocumentResponse]


# Template schemas
class TemplateFieldDefinition(BaseModel):
    name: str
    description: str = ""
    required: bool = False


class TemplateBase(BaseModel):
    name: str
    type: str
    fields: list[TemplateFieldDefinition] = []


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    fields: Optional[list[TemplateFieldDefinition]] = None


class TemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    type: str
    fields: list[dict]
    created_at: datetime
    updated_at: datetime


# Batch schemas
class BatchProcessRequest(BaseModel):
    document_ids: list[str]


class BatchStatusItem(BaseModel):
    document_id: str
    status: str
    error_message: Optional[str] = None


class BatchStatusResponse(BaseModel):
    batch_id: str
    total: int
    completed: int
    failed: int
    pending: int
    items: list[BatchStatusItem]
