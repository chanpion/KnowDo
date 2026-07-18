from fastapi import APIRouter, Depends, Request
from sqlmodel import Session
from app.core.database import get_session
from app.modules.article.schemas import (
    ArticleListRequest, ArticleCreateRequest, ArticleUpdateRequest,
    ArticleToggleLikeRequest, ArticleAddCommentRequest, ArticleDeleteCommentRequest,
    ArticleRejectRequest, ArticleReturnRequest, ArticleRollbackRequest,
    ArticleHotRequest, ArticleLatestRequest,
    FavoriteFolderCreateRequest, FavoriteFolderRenameRequest,
    FavoriteFolderDeleteRequest, MoveToFolderRequest,
    RecycleListRequest, FavoriteFolderArticlesRequest,
)
from app.modules.article.service import ArticleService

router = APIRouter()


def get_service(session: Session = Depends(get_session)) -> ArticleService:
    return ArticleService(session)


@router.post("/api/article")
async def article_handler(request: Request, service: ArticleService = Depends(get_service)):
    body = await request.json()
    action = body.get("action")

    if action == "list":
        req = ArticleListRequest(**body)
        return {"code": 0, "data": service.list_articles(req.model_dump()), "message": "ok"}

    elif action == "create":
        req = ArticleCreateRequest(**body)
        return {"code": 0, "data": service.create_article(req.model_dump(exclude_none=True)), "message": "ok"}

    elif action == "detail":
        return {"code": 0, "data": service.get_detail(body["id"]), "message": "ok"}

    elif action == "update":
        req = ArticleUpdateRequest(**body)
        return {"code": 0, "data": service.update_article(req.model_dump(exclude_none=True)), "message": "ok"}

    elif action == "delete":
        service.delete_article(body["id"])
        return {"code": 0, "data": None, "message": "ok"}

    elif action == "soft_delete":
        return {"code": 0, "data": service.soft_delete(body["id"]), "message": "ok"}

    elif action == "restore":
        return {"code": 0, "data": service.restore(body["id"]), "message": "ok"}

    elif action == "archive":
        return {"code": 0, "data": service.archive(body["id"]), "message": "ok"}

    elif action == "unarchive":
        return {"code": 0, "data": service.unarchive(body["id"]), "message": "ok"}

    elif action == "toggle_like":
        req = ArticleToggleLikeRequest(**body)
        return {"code": 0, "data": service.toggle_like(req.id, req.user_id), "message": "ok"}

    elif action == "add_comment":
        req = ArticleAddCommentRequest(**body)
        return {"code": 0, "data": service.add_comment(req.id, req.author, req.content, req.author_dept, req.reply_to), "message": "ok"}

    elif action == "delete_comment":
        req = ArticleDeleteCommentRequest(**body)
        return {"code": 0, "data": service.delete_comment(req.id, req.comment_id), "message": "ok"}

    elif action == "submit_review":
        return {"code": 0, "data": service.submit_review(body["id"]), "message": "ok"}

    elif action == "approve":
        return {"code": 0, "data": service.approve(body["id"]), "message": "ok"}

    elif action == "reject":
        req = ArticleRejectRequest(**body)
        return {"code": 0, "data": service.reject(req.id, req.reason), "message": "ok"}

    elif action == "return_for_edit":
        req = ArticleReturnRequest(**body)
        return {"code": 0, "data": service.return_for_edit(req.id, req.feedback), "message": "ok"}

    elif action == "review_queue":
        return {"code": 0, "data": service.review_queue(), "message": "ok"}

    elif action == "list_versions":
        return {"code": 0, "data": service.list_versions(body["id"]), "message": "ok"}

    elif action == "rollback":
        req = ArticleRollbackRequest(**body)
        return {"code": 0, "data": service.rollback(req.id, req.version_id), "message": "ok"}

    elif action == "hot":
        req = ArticleHotRequest(**body)
        return {"code": 0, "data": service.hot(req.limit), "message": "ok"}

    elif action == "latest":
        req = ArticleLatestRequest(**body)
        return {"code": 0, "data": service.latest(req.limit), "message": "ok"}

    elif action == "favorite_folder_list":
        return {"code": 0, "data": service.list_favorite_folders(), "message": "ok"}

    elif action == "favorite_folder_create":
        req = FavoriteFolderCreateRequest(**body)
        return {"code": 0, "data": service.create_favorite_folder(req.name), "message": "ok"}

    elif action == "favorite_folder_rename":
        req = FavoriteFolderRenameRequest(**body)
        return {"code": 0, "data": service.rename_favorite_folder(req.id, req.name), "message": "ok"}

    elif action == "favorite_folder_delete":
        req = FavoriteFolderDeleteRequest(**body)
        service.delete_favorite_folder(req.id)
        return {"code": 0, "data": None, "message": "ok"}

    elif action == "move_to_folder":
        req = MoveToFolderRequest(**body)
        return {"code": 0, "data": service.move_to_folder(req.id, req.folder_id), "message": "ok"}

    elif action == "recycle_list":
        req = RecycleListRequest(**body)
        return {"code": 0, "data": service.list_deleted(req.page, req.size), "message": "ok"}

    elif action == "favorite_folder_articles":
        req = FavoriteFolderArticlesRequest(**body)
        return {"code": 0, "data": service.list_favorite_folder_articles(req.folder_id, req.page, req.size), "message": "ok"}

    return {"code": 400, "data": None, "message": f"Unknown action: {action}"}
