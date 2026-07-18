from typing import Any, Optional
from pydantic import BaseModel, Field


class ArticleListRequest(BaseModel):
    category_id: Optional[str] = Field(default=None, alias="categoryId")
    status: Optional[str] = None
    type: Optional[str] = None
    keyword: Optional[str] = None
    page: int = 1
    size: int = 20

    model_config = {"populate_by_name": True}


class ArticleCreateRequest(BaseModel):
    title: str
    type: str = "doc"
    typeLabel: Optional[str] = None  # noqa
    content: str = ""
    summary: Optional[str] = None
    category_id: Optional[str] = Field(default=None, alias="categoryId")
    category_name: Optional[str] = Field(default=None, alias="category")
    tags: Any = None  # list
    author: Optional[str] = None
    author_dept: Optional[str] = Field(default=None, alias="authorDept")
    publish_scope: Optional[str] = Field(default=None, alias="publishScope")
    valid_period: Optional[str] = Field(default=None, alias="validPeriod")
    valid_start: Optional[str] = None
    valid_end: Optional[str] = None
    knowledge_base_id: Optional[str] = Field(default=None, alias="knowledgeBaseId")
    folder_id: Optional[str] = Field(default=None, alias="folderId")
    attachments: Any = None  # list
    status: Optional[str] = None

    model_config = {"populate_by_name": True}


class ArticleUpdateRequest(BaseModel):
    id: str
    title: Optional[str] = None
    type: Optional[str] = None
    typeLabel: Optional[str] = None  # noqa
    content: Optional[str] = None
    summary: Optional[str] = None
    category_id: Optional[str] = Field(default=None, alias="categoryId")
    category_name: Optional[str] = Field(default=None, alias="category")
    tags: Any = None
    author: Optional[str] = None
    author_dept: Optional[str] = Field(default=None, alias="authorDept")
    publish_scope: Optional[str] = Field(default=None, alias="publishScope")
    valid_period: Optional[str] = Field(default=None, alias="validPeriod")
    valid_start: Optional[str] = None
    valid_end: Optional[str] = None
    knowledge_base_id: Optional[str] = Field(default=None, alias="knowledgeBaseId")
    folder_id: Optional[str] = Field(default=None, alias="folderId")
    attachments: Any = None
    status: Optional[str] = None

    model_config = {"populate_by_name": True}


class ArticleIdRequest(BaseModel):
    id: str


class ArticleToggleLikeRequest(BaseModel):
    id: str
    user_id: str = Field(default="default", alias="userId")

    model_config = {"populate_by_name": True}


class ArticleAddCommentRequest(BaseModel):
    id: str
    author: str
    author_dept: Optional[str] = Field(default="", alias="authorDept")
    content: str
    reply_to: Optional[str] = Field(default=None, alias="replyTo")

    model_config = {"populate_by_name": True}


class ArticleDeleteCommentRequest(BaseModel):
    id: str
    comment_id: str = Field(alias="commentId")

    model_config = {"populate_by_name": True}


class ArticleRejectRequest(BaseModel):
    id: str
    reason: str


class ArticleReturnRequest(BaseModel):
    id: str
    feedback: Optional[str] = ""


class ArticleListVersionsRequest(BaseModel):
    id: str


class ArticleRollbackRequest(BaseModel):
    id: str
    version_id: str


class ArticleHotRequest(BaseModel):
    limit: int = 10


class ArticleLatestRequest(BaseModel):
    limit: int = 10


class FavoriteFolderCreateRequest(BaseModel):
    name: str


class FavoriteFolderRenameRequest(BaseModel):
    id: str
    name: str


class FavoriteFolderDeleteRequest(BaseModel):
    id: str


class MoveToFolderRequest(BaseModel):
    id: str
    folder_id: str


class RecycleListRequest(BaseModel):
    page: int = 1
    size: int = 20


class FavoriteFolderArticlesRequest(BaseModel):
    folder_id: str
    page: int = 1
    size: int = 20
