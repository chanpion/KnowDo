import json
from typing import Optional, List
from sqlmodel import Session, select, func
from app.core.exceptions import NotFoundException
from app.modules.article.models import (
    Article, ArticleComment, ArticleVersion, ArticleLike,
    FavoriteFolder, FavoriteFolderArticle,
)


class ArticleRepository:
    def __init__(self, session: Session):
        self.session = session

    # ---- Article ----

    def list(self, category_id=None, status=None, type_=None, keyword=None,
             include_deleted=False, offset=0, limit=20) -> List[Article]:
        stmt = select(Article)
        if not include_deleted:
            stmt = stmt.where(Article.deleted_at.is_(None))
        if category_id:
            stmt = stmt.where(Article.category_id == category_id)
        if status:
            stmt = stmt.where(Article.status == status)
        if type_:
            stmt = stmt.where(Article.type == type_)
        if keyword:
            stmt = stmt.where(
                (Article.title.contains(keyword)) | (Article.content.contains(keyword))
            )
        stmt = stmt.order_by(Article.created_at.desc()).offset(offset).limit(limit)
        return list(self.session.exec(stmt).all())

    def count(self, category_id=None, status=None, type_=None, keyword=None,
              include_deleted=False) -> int:
        stmt = select(func.count(Article.id))
        if not include_deleted:
            stmt = stmt.where(Article.deleted_at.is_(None))
        if category_id:
            stmt = stmt.where(Article.category_id == category_id)
        if status:
            stmt = stmt.where(Article.status == status)
        if type_:
            stmt = stmt.where(Article.type == type_)
        if keyword:
            stmt = stmt.where(
                (Article.title.contains(keyword)) | (Article.content.contains(keyword))
            )
        return self.session.exec(stmt).first() or 0

    def get_by_id(self, id: str, include_deleted=False) -> Article:
        stmt = select(Article).where(Article.id == id)
        if not include_deleted:
            stmt = stmt.where(Article.deleted_at.is_(None))
        art = self.session.exec(stmt).first()
        if art is None:
            raise NotFoundException(f"文章不存在: {id}")
        return art

    def get_raw(self, id: str) -> Article:
        art = self.session.get(Article, id)
        if art is None:
            raise NotFoundException(f"文章不存在: {id}")
        return art

    def create(self, art: Article) -> Article:
        self.session.add(art)
        self.session.commit()
        self.session.refresh(art)
        return art

    def update(self, id: str, **kwargs) -> Article:
        art = self.get_raw(id)
        for key, value in kwargs.items():
            if value is not None and hasattr(art, key):
                setattr(art, key, value)
        self.session.add(art)
        self.session.commit()
        self.session.refresh(art)
        return art

    def hard_delete(self, id: str) -> None:
        art = self.get_raw(id)
        self.session.delete(art)
        self.session.commit()

    # ---- Comment ----

    def list_comments(self, article_id: str) -> List[ArticleComment]:
        stmt = select(ArticleComment).where(
            ArticleComment.article_id == article_id
        ).order_by(ArticleComment.time.asc())
        return list(self.session.exec(stmt).all())

    def get_comment(self, comment_id: str) -> ArticleComment:
        c = self.session.get(ArticleComment, comment_id)
        if c is None:
            raise NotFoundException(f"评论不存在: {comment_id}")
        return c

    def create_comment(self, c: ArticleComment) -> ArticleComment:
        self.session.add(c)
        self.session.commit()
        self.session.refresh(c)
        return c

    def delete_comment(self, comment_id: str) -> None:
        c = self.get_comment(comment_id)
        self.session.delete(c)
        self.session.commit()

    def count_comments(self, article_id: str) -> int:
        stmt = select(func.count(ArticleComment.id)).where(
            ArticleComment.article_id == article_id
        )
        return self.session.exec(stmt).first() or 0

    # ---- Version ----

    def list_versions(self, article_id: str) -> List[ArticleVersion]:
        stmt = select(ArticleVersion).where(
            ArticleVersion.article_id == article_id
        ).order_by(ArticleVersion.modified_at.desc())
        return list(self.session.exec(stmt).all())

    def create_version(self, v: ArticleVersion) -> ArticleVersion:
        self.session.add(v)
        self.session.commit()
        self.session.refresh(v)
        return v

    def get_version(self, version_id: str) -> ArticleVersion:
        v = self.session.get(ArticleVersion, version_id)
        if v is None:
            raise NotFoundException(f"版本不存在: {version_id}")
        return v

    def next_version_number(self, article_id: str) -> str:
        count = self.session.exec(
            select(func.count(ArticleVersion.id)).where(
                ArticleVersion.article_id == article_id
            )
        ).first() or 0
        return f"V{count + 1}.0"

    # ---- Like ----

    def get_like(self, article_id: str, user_id: str) -> Optional[ArticleLike]:
        return self.session.exec(
            select(ArticleLike).where(
                ArticleLike.article_id == article_id,
                ArticleLike.user_id == user_id,
            )
        ).first()

    def add_like(self, like: ArticleLike) -> ArticleLike:
        self.session.add(like)
        self.session.commit()
        return like

    def remove_like(self, like: ArticleLike) -> None:
        self.session.delete(like)
        self.session.commit()

    def count_likes(self, article_id: str) -> int:
        stmt = select(func.count(ArticleLike.id)).where(
            ArticleLike.article_id == article_id
        )
        return self.session.exec(stmt).first() or 0

    # ---- Favorite Folder ----

    def list_folders(self) -> List[FavoriteFolder]:
        return list(self.session.exec(
            select(FavoriteFolder).order_by(FavoriteFolder.created_at.asc())
        ).all())

    def get_folder(self, folder_id: str) -> FavoriteFolder:
        f = self.session.get(FavoriteFolder, folder_id)
        if f is None:
            raise NotFoundException(f"收藏夹不存在: {folder_id}")
        return f

    def create_folder(self, f: FavoriteFolder) -> FavoriteFolder:
        self.session.add(f)
        self.session.commit()
        self.session.refresh(f)
        return f

    def rename_folder(self, folder_id: str, name: str) -> FavoriteFolder:
        f = self.get_folder(folder_id)
        f.name = name
        self.session.add(f)
        self.session.commit()
        self.session.refresh(f)
        return f

    def delete_folder(self, folder_id: str) -> None:
        f = self.get_folder(folder_id)
        # 删除关联关系
        relations = self.session.exec(
            select(FavoriteFolderArticle).where(
                FavoriteFolderArticle.folder_id == folder_id
            )
        ).all()
        for r in relations:
            self.session.delete(r)
        self.session.delete(f)
        self.session.commit()

    def get_relation(self, folder_id: str, article_id: str) -> Optional[FavoriteFolderArticle]:
        return self.session.exec(
            select(FavoriteFolderArticle).where(
                FavoriteFolderArticle.folder_id == folder_id,
                FavoriteFolderArticle.article_id == article_id,
            )
        ).first()

    def add_relation(self, r: FavoriteFolderArticle) -> FavoriteFolderArticle:
        self.session.add(r)
        self.session.commit()
        return r

    def remove_relation(self, r: FavoriteFolderArticle) -> None:
        self.session.delete(r)
        self.session.commit()

    def list_articles_in_folder(self, folder_id: str, offset=0, limit=20) -> List[Article]:
        stmt = (
            select(Article)
            .join(FavoriteFolderArticle, FavoriteFolderArticle.article_id == Article.id)
            .where(FavoriteFolderArticle.folder_id == folder_id)
            .where(Article.deleted_at.is_(None))
            .order_by(Article.created_at.desc())
            .offset(offset).limit(limit)
        )
        return list(self.session.exec(stmt).all())

    def count_articles_in_folder(self, folder_id: str) -> int:
        stmt = (
            select(func.count(FavoriteFolderArticle.id))
            .join(Article, Article.id == FavoriteFolderArticle.article_id)
            .where(FavoriteFolderArticle.folder_id == folder_id)
            .where(Article.deleted_at.is_(None))
        )
        return self.session.exec(stmt).first() or 0

    def is_in_any_folder(self, article_id: str) -> bool:
        r = self.session.exec(
            select(FavoriteFolderArticle).where(
                FavoriteFolderArticle.article_id == article_id
            )
        ).first()
        return r is not None

    def count_favorites(self, article_id: str) -> int:
        stmt = select(func.count(FavoriteFolderArticle.id)).where(
            FavoriteFolderArticle.article_id == article_id
        )
        return self.session.exec(stmt).first() or 0
