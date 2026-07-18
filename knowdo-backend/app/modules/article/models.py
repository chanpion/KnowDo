from sqlmodel import SQLModel, Field
from typing import Optional


class Article(SQLModel, table=True):
    __tablename__ = "article"

    id: str = Field(primary_key=True)
    title: str
    type: str = Field(default="doc")  # doc / link / image / video / audio / qa
    content: str = Field(default="")
    summary: Optional[str] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    tags: str = Field(default="[]")  # JSON 字符串
    author: Optional[str] = None
    author_dept: Optional[str] = None
    status: str = Field(default="draft")  # draft / pending_review / published / rejected / archived
    publish_scope: Optional[str] = None
    valid_period: Optional[str] = None
    valid_start: Optional[str] = None
    valid_end: Optional[str] = None
    knowledge_base_id: Optional[str] = None
    folder_id: Optional[str] = None
    attachments: str = Field(default="[]")  # JSON 字符串
    version: str = Field(default="V1.0")
    reject_reason: Optional[str] = None
    review_feedback: Optional[str] = None
    view_count: int = Field(default=0)
    like_count: int = Field(default=0)
    comment_count: int = Field(default=0)
    favorite_count: int = Field(default=0)
    deleted_at: Optional[str] = None
    created_at: str
    updated_at: str


class ArticleComment(SQLModel, table=True):
    __tablename__ = "article_comment"

    id: str = Field(primary_key=True)
    article_id: str = Field(foreign_key="article.id")
    author: str
    author_dept: Optional[str] = None
    content: str
    reply_to: Optional[str] = None
    time: str


class ArticleVersion(SQLModel, table=True):
    __tablename__ = "article_version"

    id: str = Field(primary_key=True)
    article_id: str = Field(foreign_key="article.id")
    version_number: str
    content: str
    content_snapshot: str = Field(default="")
    modified_by: Optional[str] = None
    modified_at: str
    change_notes: Optional[str] = None


class ArticleLike(SQLModel, table=True):
    __tablename__ = "article_like"

    id: str = Field(primary_key=True)
    article_id: str = Field(foreign_key="article.id")
    user_id: str
    created_at: str


class FavoriteFolder(SQLModel, table=True):
    __tablename__ = "favorite_folder"

    id: str = Field(primary_key=True)
    name: str
    created_at: str


class FavoriteFolderArticle(SQLModel, table=True):
    __tablename__ = "favorite_folder_article"

    id: str = Field(primary_key=True)
    folder_id: str = Field(foreign_key="favorite_folder.id")
    article_id: str = Field(foreign_key="article.id")
    created_at: str
