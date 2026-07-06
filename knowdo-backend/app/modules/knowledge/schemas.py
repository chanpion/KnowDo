from typing import Optional
from pydantic import BaseModel


class KnowledgeCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    type: str = "general"
    folder_id: Optional[str] = None
    icon: Optional[str] = None


class KnowledgeUpdateRequest(BaseModel):
    id: str
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    icon: Optional[str] = None
    folder_id: Optional[str] = None
    embedding_model: Optional[str] = None
    chunk_mode: Optional[str] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None
    search_mode: Optional[str] = None
    top_k: Optional[int] = None
    score_threshold: Optional[float] = None


class KnowledgeDetailRequest(BaseModel):
    id: str


class KnowledgeDeleteRequest(BaseModel):
    id: str


class KnowledgeListRequest(BaseModel):
    folder_id: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None


class DocListRequest(BaseModel):
    knowledge_id: str


class DocDetailRequest(BaseModel):
    knowledge_id: str
    doc_id: str


class DocDeleteRequest(BaseModel):
    knowledge_id: str
    doc_id: str


class DocChunksRequest(BaseModel):
    knowledge_id: str
    doc_id: str


class DocRechunkRequest(BaseModel):
    knowledge_id: str
    doc_id: str
    chunk_mode: Optional[str] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None


class RecallTestRequest(BaseModel):
    knowledge_id: str
    query: str
    top_k: int = 5
    search_mode: str = "vector"  # vector / keyword / hybrid


class FolderCreateRequest(BaseModel):
    name: str
    parent_id: Optional[str] = None


class FolderRenameRequest(BaseModel):
    id: str
    name: str


class FolderDeleteRequest(BaseModel):
    id: str


class FolderMoveRequest(BaseModel):
    id: str
    target_parent_id: Optional[str] = None


class AuthCreateRequest(BaseModel):
    knowledge_id: str
    target_type: str  # user / department
    target_id: str
    target_name: str
    permission: str = "view"  # view / use / maintain


class AuthDeleteRequest(BaseModel):
    id: str


class AuthListRequest(BaseModel):
    knowledge_id: str
