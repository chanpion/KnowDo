from sqlmodel import SQLModel, Field
from typing import Optional


class ModelConfig(SQLModel, table=True):
    __tablename__ = "model_config"

    id: str = Field(primary_key=True)
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
    status: str = Field(default="offline")  # online / offline / testing
    last_test: Optional[str] = None
    test_success: Optional[bool] = None
    test_latency: Optional[str] = None
    created_at: str
    updated_at: str
