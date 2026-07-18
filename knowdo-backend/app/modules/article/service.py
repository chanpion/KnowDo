import uuid
import json
from datetime import datetime
from typing import Any, Optional
from sqlmodel import Session, select, func
from app.core.exceptions import ValidationException, ServiceException
from app.modules.article.models import (
    Article, ArticleComment, ArticleVersion, ArticleLike,
    FavoriteFolder, FavoriteFolderArticle,
)
from app.modules.article.repository import ArticleRepository

DEFAULT_USER = "default"
TYPE_LABELS = {
    "doc": "文档",
    "link": "链接",
    "image": "图片",
    "video": "视频",
    "audio": "音频",
    "qa": "问答",
}


class ArticleService:
    def __init__(self, session: Session):
        self.repo = ArticleRepository(session)
        self.session = session

    # ---- List / Detail ----

    def list_articles(self, params: dict) -> dict:
        page = params.get("page", 1)
        size = params.get("size", 20)
        offset = (page - 1) * size
        items = self.repo.list(
            category_id=params.get("category_id"),
            status=params.get("status"),
            type_=params.get("type"),
            keyword=params.get("keyword"),
            offset=offset, limit=size,
        )
        total = self.repo.count(
            category_id=params.get("category_id"),
            status=params.get("status"),
            type_=params.get("type"),
            keyword=params.get("keyword"),
        )
        return {
            "items": [self._to_dict(a) for a in items],
            "total": total,
            "page": page,
            "size": size,
        }

    def get_detail(self, id: str) -> dict:
        art = self.repo.get_by_id(id)
        result = self._to_dict(art)
        result["comments"] = [self._comment_to_dict(c) for c in self.repo.list_comments(id)]
        result["versions"] = [self._version_to_dict(v) for v in self.repo.list_versions(id)]
        return result

    def create_article(self, data: dict) -> dict:
        now = datetime.now().isoformat()
        art = Article(
            id=str(uuid.uuid4()),
            title=data["title"],
            type=data.get("type", "doc"),
            content=data.get("content", ""),
            summary=data.get("summary"),
            category_id=data.get("category_id"),
            category_name=data.get("category_name"),
            tags=json.dumps(data.get("tags") or [], ensure_ascii=False),
            author=data.get("author"),
            author_dept=data.get("author_dept"),
            status=data.get("status") or "draft",
            publish_scope=data.get("publish_scope"),
            valid_period=data.get("valid_period"),
            valid_start=data.get("valid_start"),
            valid_end=data.get("valid_end"),
            knowledge_base_id=data.get("knowledge_base_id"),
            folder_id=data.get("folder_id"),
            attachments=json.dumps(data.get("attachments") or [], ensure_ascii=False),
            version="V1.0",
            created_at=now,
            updated_at=now,
        )
        created = self.repo.create(art)
        return self._to_dict(created)

    def update_article(self, data: dict) -> dict:
        id = data.pop("id")
        art = self.repo.get_raw(id)
        version_number = self.repo.next_version_number(id)
        now = datetime.now().isoformat()
        snapshot = ArticleVersion(
            id=str(uuid.uuid4()),
            article_id=id,
            version_number=art.version,
            content=art.content,
            content_snapshot=art.content,
            modified_by=data.get("author") or art.author or DEFAULT_USER,
            modified_at=now,
            change_notes="编辑更新",
        )
        self.repo.create_version(snapshot)

        data["updated_at"] = now
        updated = self.repo.update(id, **{k: v for k, v in data.items() if v is not None})
        return self._to_dict(updated)

    def delete_article(self, id: str) -> None:
        self.repo.hard_delete(id)

    def soft_delete(self, id: str) -> dict:
        now = datetime.now().isoformat()
        updated = self.repo.update(id, deleted_at=now, updated_at=now)
        return self._to_dict(updated)

    def restore(self, id: str) -> dict:
        now = datetime.now().isoformat()
        updated = self.repo.update(id, deleted_at=None, updated_at=now)
        return self._to_dict(updated)

    def archive(self, id: str) -> dict:
        now = datetime.now().isoformat()
        updated = self.repo.update(id, status="archived", updated_at=now)
        return self._to_dict(updated)

    def unarchive(self, id: str) -> dict:
        now = datetime.now().isoformat()
        updated = self.repo.update(id, status="published", updated_at=now)
        return self._to_dict(updated)

    # ---- Like ----

    def toggle_like(self, id: str, user_id: str = DEFAULT_USER) -> dict:
        art = self.repo.get_raw(id)
        existing = self.repo.get_like(id, user_id)
        now = datetime.now().isoformat()
        if existing:
            self.repo.remove_like(existing)
            liked = False
        else:
            self.repo.add_like(ArticleLike(
                id=str(uuid.uuid4()),
                article_id=id,
                user_id=user_id,
                created_at=now,
            ))
            liked = True
        like_count = self.repo.count_likes(id)
        self.repo.update(id, like_count=like_count, updated_at=now)
        result = self._to_dict(art)
        result["isLiked"] = liked
        result["likeCount"] = like_count
        return result

    # ---- Comment ----

    def add_comment(self, id: str, author: str, content: str,
                    author_dept: str = "", reply_to: Optional[str] = None) -> dict:
        art = self.repo.get_raw(id)
        now = datetime.now().isoformat()
        comment = ArticleComment(
            id=str(uuid.uuid4()),
            article_id=id,
            author=author,
            author_dept=author_dept,
            content=content,
            reply_to=reply_to,
            time=now,
        )
        self.repo.create_comment(comment)
        comment_count = self.repo.count_comments(id)
        self.repo.update(id, comment_count=comment_count, updated_at=now)
        result = self._to_dict(art)
        result["commentCount"] = comment_count
        result["comments"] = [self._comment_to_dict(c) for c in self.repo.list_comments(id)]
        return result

    def delete_comment(self, id: str, comment_id: str) -> dict:
        art = self.repo.get_raw(id)
        self.repo.delete_comment(comment_id)
        comment_count = self.repo.count_comments(id)
        self.repo.update(id, comment_count=comment_count, updated_at=datetime.now().isoformat())
        result = self._to_dict(art)
        result["commentCount"] = comment_count
        result["comments"] = [self._comment_to_dict(c) for c in self.repo.list_comments(id)]
        return result

    # ---- Review ----

    def submit_review(self, id: str) -> dict:
        now = datetime.now().isoformat()
        updated = self.repo.update(id, status="pending_review", updated_at=now)
        return self._to_dict(updated)

    def approve(self, id: str) -> dict:
        now = datetime.now().isoformat()
        updated = self.repo.update(id, status="published", updated_at=now)
        return self._to_dict(updated)

    def reject(self, id: str, reason: str) -> dict:
        now = datetime.now().isoformat()
        updated = self.repo.update(id, status="rejected", reject_reason=reason, updated_at=now)
        return self._to_dict(updated)

    def return_for_edit(self, id: str, feedback: str = "") -> dict:
        now = datetime.now().isoformat()
        updated = self.repo.update(id, status="draft", review_feedback=feedback, updated_at=now)
        return self._to_dict(updated)

    def review_queue(self) -> list:
        items = self.repo.list(status="pending_review", include_deleted=False, limit=1000)
        return [self._to_dict(a) for a in items]

    # ---- Version ----

    def list_versions(self, id: str) -> list:
        versions = self.repo.list_versions(id)
        return [self._version_to_dict(v) for v in versions]

    def rollback(self, id: str, version_id: str) -> dict:
        art = self.repo.get_raw(id)
        version = self.repo.get_version(version_id)
        now = datetime.now().isoformat()
        snapshot = ArticleVersion(
            id=str(uuid.uuid4()),
            article_id=id,
            version_number=art.version,
            content=art.content,
            content_snapshot=art.content,
            modified_by=DEFAULT_USER,
            modified_at=now,
            change_notes=f"回滚到 {version.version_number}",
        )
        self.repo.create_version(snapshot)
        updated = self.repo.update(
            id, content=version.content, version=version.version_number, updated_at=now
        )
        return self._to_dict(updated)

    # ---- Hot / Latest ----

    def hot(self, limit: int = 10) -> list:
        items = self.repo.list(include_deleted=False, limit=1000)
        items.sort(key=lambda a: (a.like_count + a.view_count), reverse=True)
        return [self._to_dict(a) for a in items[:limit]]

    def latest(self, limit: int = 10) -> list:
        items = self.repo.list(include_deleted=False, limit=limit)
        return [self._to_dict(a) for a in items]

    # ---- Favorite Folder ----

    def list_favorite_folders(self) -> list:
        folders = self.repo.list_folders()
        result = []
        for f in folders:
            result.append({
                "id": f.id,
                "name": f.name,
                "articleIds": self._folder_article_ids(f.id),
                "count": self.repo.count_articles_in_folder(f.id),
                "created_at": f.created_at,
            })
        return result

    def create_favorite_folder(self, name: str) -> dict:
        f = FavoriteFolder(
            id=str(uuid.uuid4()),
            name=name,
            created_at=datetime.now().isoformat(),
        )
        created = self.repo.create_folder(f)
        return {"id": created.id, "name": created.name, "articleIds": [], "count": 0, "created_at": created.created_at}

    def rename_favorite_folder(self, folder_id: str, name: str) -> dict:
        f = self.repo.rename_folder(folder_id, name)
        return {"id": f.id, "name": f.name, "articleIds": self._folder_article_ids(f.id), "count": self.repo.count_articles_in_folder(f.id)}

    def delete_favorite_folder(self, folder_id: str) -> None:
        self.repo.delete_folder(folder_id)

    def move_to_folder(self, article_id: str, folder_id: str) -> dict:
        self.repo.get_by_id(article_id)
        self.repo.get_folder(folder_id)
        existing = self.repo.get_relation(folder_id, article_id)
        if existing is None:
            self.repo.add_relation(FavoriteFolderArticle(
                id=str(uuid.uuid4()),
                folder_id=folder_id,
                article_id=article_id,
                created_at=datetime.now().isoformat(),
            ))
        favorite_count = self.repo.count_favorites(article_id)
        self.repo.update(article_id, favorite_count=favorite_count, updated_at=datetime.now().isoformat())
        return {"article_id": article_id, "folder_id": folder_id}

    def list_deleted(self, page: int = 1, size: int = 20) -> dict:
        offset = (page - 1) * size
        stmt = select(Article).where(Article.deleted_at.isnot(None)).order_by(
            Article.deleted_at.desc()
        ).offset(offset).limit(size)
        items = list(self.session.exec(stmt).all())
        total_stmt = select(func.count(Article.id)).where(Article.deleted_at.isnot(None))
        total = self.session.exec(total_stmt).first() or 0
        return {
            "items": [self._to_dict(a) for a in items],
            "total": total,
            "page": page,
            "size": size,
        }

    def list_favorite_folder_articles(self, folder_id: str, page: int = 1, size: int = 20) -> dict:
        offset = (page - 1) * size
        items = self.repo.list_articles_in_folder(folder_id, offset=offset, limit=size)
        total = self.repo.count_articles_in_folder(folder_id)
        return {
            "items": [self._to_dict(a) for a in items],
            "total": total,
            "page": page,
            "size": size,
        }

    # ---- Private ----

    def _folder_article_ids(self, folder_id: str) -> list:
        relations = self.session.exec(
            select(FavoriteFolderArticle).where(
                FavoriteFolderArticle.folder_id == folder_id
            )
        ).all()
        return [r.article_id for r in relations]

    def _to_dict(self, a: Article) -> dict:
        try:
            tags = json.loads(a.tags) if a.tags else []
        except Exception:
            tags = []
        try:
            attachments = json.loads(a.attachments) if a.attachments else []
        except Exception:
            attachments = []
        liked = False
        favorited = False
        try:
            liked = self.repo.get_like(a.id, DEFAULT_USER) is not None
        except Exception:
            liked = False
        try:
            favorited = self.repo.is_in_any_folder(a.id)
        except Exception:
            favorited = False
        return {
            "id": a.id,
            "title": a.title,
            "type": a.type,
            "typeLabel": TYPE_LABELS.get(a.type, a.type),
            "content": a.content,
            "summary": a.summary,
            "category": a.category_name or "",
            "categoryId": a.category_id or "",
            "tags": tags,
            "author": a.author,
            "authorDept": a.author_dept,
            "publishTime": a.created_at,
            "updateTime": a.updated_at,
            "version": a.version,
            "status": a.status,
            "viewCount": a.view_count,
            "likeCount": a.like_count,
            "commentCount": a.comment_count,
            "favoriteCount": a.favorite_count,
            "isLiked": liked,
            "isFavorited": favorited,
            "publishScope": a.publish_scope,
            "validPeriod": a.valid_period,
            "validStart": a.valid_start,
            "validEnd": a.valid_end,
            "attachments": attachments,
            "comments": [],
            "versions": [],
            "deletedAt": a.deleted_at,
            "folderId": a.folder_id,
            "knowledgeBaseId": a.knowledge_base_id or "",
            "rejectReason": a.reject_reason,
            "reviewFeedback": a.review_feedback,
        }

    def _comment_to_dict(self, c: ArticleComment) -> dict:
        return {
            "id": c.id,
            "author": c.author,
            "authorDept": c.author_dept,
            "content": c.content,
            "time": c.time,
            "isAuthor": False,
            "replyTo": c.reply_to,
        }

    def _version_to_dict(self, v: ArticleVersion) -> dict:
        return {
            "id": v.id,
            "versionNumber": v.version_number,
            "content": v.content,
            "contentSnapshot": v.content_snapshot,
            "modifiedBy": v.modified_by,
            "modifiedAt": v.modified_at,
            "changeNotes": v.change_notes,
        }
