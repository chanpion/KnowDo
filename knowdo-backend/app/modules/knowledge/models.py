from sqlmodel import SQLModel, Field
from typing import Optional


class KnowledgeBase(SQLModel, table=True):
    __tablename__ = "knowledge_base"

    id: str = Field(primary_key=True)
    name: str
    description: Optional[str] = None
    type: str  # general / web / feishu
    status: str = Field(default="pending")  # pending / processing / completed / failed
    icon: Optional[str] = None
    folder_id: Optional[str] = None
    vector_model: Optional[str] = None
    embedding_model: Optional[str] = None  # -> model_config.id
    chunk_mode: str = Field(default="smart")  # smart / advanced / qa
    chunk_size: int = Field(default=1024)
    chunk_overlap: int = Field(default=256)
    search_mode: str = Field(default="vector")  # vector / keyword / hybrid
    top_k: int = Field(default=5)
    score_threshold: float = Field(default=0.5)
    enable_rerank: bool = Field(default=False)
    rerank_model: Optional[str] = None
    created_at: str
    updated_at: str


class KnowledgeDocument(SQLModel, table=True):
    __tablename__ = "knowledge_document"

    id: str = Field(primary_key=True)
    knowledge_id: str = Field(foreign_key="knowledge_base.id")
    name: str
    type: str  # md / txt / pdf / docx / html / xls / xlsx / csv
    size: Optional[str] = None
    status: str = Field(default="pending")  # pending / processing / completed / failed
    content: Optional[str] = None
    error: Optional[str] = None
    created_at: str


class KnowledgeFolder(SQLModel, table=True):
    __tablename__ = "knowledge_folder"

    id: str = Field(primary_key=True)
    name: str
    parent_id: Optional[str] = Field(default=None, foreign_key="knowledge_folder.id")
    created_at: str


class KnowledgeAuthorization(SQLModel, table=True):
    __tablename__ = "knowledge_authorization"

    id: str = Field(primary_key=True)
    knowledge_id: str = Field(foreign_key="knowledge_base.id")
    target_type: str  # user / department
    target_id: str
    target_name: str
    permission: str  # view / use / maintain
    created_at: str
