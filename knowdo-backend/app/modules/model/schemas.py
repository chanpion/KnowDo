from typing import Optional
from pydantic import BaseModel


class ModelCreateRequest(BaseModel):
    name: str
    provider: str
    type: str  # LLM / Embedding / Reranker
    api_url: str
    api_key: str
    model_name: str
    max_tokens: Optional[int] = None
    concurrency: Optional[int] = None
    timeout: Optional[int] = None
    retry: Optional[int] = None


class ModelUpdateRequest(BaseModel):
    id: str
    name: Optional[str] = None
    provider: Optional[str] = None
    type: Optional[str] = None
    api_url: Optional[str] = None
    api_key: Optional[str] = None
    model_name: Optional[str] = None
    max_tokens: Optional[int] = None
    concurrency: Optional[int] = None
    timeout: Optional[int] = None
    retry: Optional[int] = None


class ModelDetailRequest(BaseModel):
    id: str


class ModelDeleteRequest(BaseModel):
    id: str


class ModelTestRequest(BaseModel):
    id: str


class ModelListRequest(BaseModel):
    provider: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None


class ModelConfigResponse(BaseModel):
    id: str
    name: str
    provider: str
    type: str
    api_url: str
    api_key: str
    model_name: str
    max_tokens: Optional[int] = None
    concurrency: Optional[int] = None
    timeout: Optional[int] = None
    retry: Optional[int] = None
    status: str
    last_test: Optional[str] = None
    test_success: Optional[bool] = None
    test_latency: Optional[str] = None
    created_at: str
    updated_at: str


class ModelTestResponse(BaseModel):
    success: bool
    latency: Optional[str] = None
    error: Optional[str] = None
