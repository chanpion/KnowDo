from fastapi import APIRouter, Depends, Request, UploadFile, File, Form
from sqlmodel import Session
from app.core.database import get_session
from app.modules.knowledge.schemas import (
    KnowledgeCreateRequest, KnowledgeUpdateRequest, KnowledgeDetailRequest,
    KnowledgeDeleteRequest, KnowledgeListRequest,
    DocListRequest, DocDetailRequest, DocDeleteRequest,
    DocChunksRequest, DocRechunkRequest, RecallTestRequest,
    FolderCreateRequest, FolderRenameRequest, FolderDeleteRequest, FolderMoveRequest,
    AuthCreateRequest, AuthDeleteRequest, AuthListRequest,
)
from app.modules.knowledge.service import KnowledgeService

router = APIRouter()


def get_service(session: Session = Depends(get_session)) -> KnowledgeService:
    return KnowledgeService(session)


@router.post("/api/knowledge")
async def knowledge_handler(request: Request, service: KnowledgeService = Depends(get_service)):
    body = await request.json()
    action = body.get("action")

    if action == "list":
        req = KnowledgeListRequest(**body)
        return {"code": 0, "data": service.list_knowledge(req.model_dump(exclude_none=True)), "message": "ok"}

    elif action == "create":
        req = KnowledgeCreateRequest(**body)
        return {"code": 0, "data": service.create_knowledge(req.model_dump()), "message": "ok"}

    elif action == "detail":
        req = KnowledgeDetailRequest(**body)
        return {"code": 0, "data": service.get_knowledge(req.id), "message": "ok"}

    elif action == "update":
        req = KnowledgeUpdateRequest(**body)
        return {"code": 0, "data": service.update_knowledge(req.model_dump(exclude_none=True)), "message": "ok"}

    elif action == "delete":
        req = KnowledgeDeleteRequest(**body)
        service.delete_knowledge(req.id)
        return {"code": 0, "data": None, "message": "ok"}

    elif action == "doc_list":
        req = DocListRequest(**body)
        return {"code": 0, "data": service.list_documents(req.knowledge_id), "message": "ok"}

    elif action == "doc_detail":
        req = DocDetailRequest(**body)
        return {"code": 0, "data": service.get_document(req.knowledge_id, req.doc_id), "message": "ok"}

    elif action == "doc_delete":
        req = DocDeleteRequest(**body)
        service.delete_document(req.knowledge_id, req.doc_id)
        return {"code": 0, "data": None, "message": "ok"}

    elif action == "doc_chunks":
        req = DocChunksRequest(**body)
        return {"code": 0, "data": service.get_chunks(req.knowledge_id, req.doc_id), "message": "ok"}

    elif action == "doc_rechunk":
        req = DocRechunkRequest(**body)
        return {"code": 0, "data": service.rechunk_document(
            req.knowledge_id, req.doc_id,
            chunk_mode=req.chunk_mode,
            chunk_size=req.chunk_size,
            chunk_overlap=req.chunk_overlap,
        ), "message": "ok"}

    elif action == "recall_test":
        req = RecallTestRequest(**body)
        return {"code": 0, "data": service.recall_test(
            req.knowledge_id, req.query, req.top_k, req.search_mode,
        ), "message": "ok"}

    elif action == "doc_upload":
        return {"code": 400, "data": None, "message": "doc_upload must use multipart form"}

    elif action == "folder_list":
        return {"code": 0, "data": service.list_folders(), "message": "ok"}

    elif action == "folder_create":
        req = FolderCreateRequest(**body)
        return {"code": 0, "data": service.create_folder(req.name, req.parent_id), "message": "ok"}

    elif action == "folder_rename":
        req = FolderRenameRequest(**body)
        return {"code": 0, "data": service.rename_folder(req.id, req.name), "message": "ok"}

    elif action == "folder_delete":
        req = FolderDeleteRequest(**body)
        service.delete_folder(req.id)
        return {"code": 0, "data": None, "message": "ok"}

    elif action == "folder_move":
        req = FolderMoveRequest(**body)
        return {"code": 0, "data": service.move_folder(req.id, req.target_parent_id), "message": "ok"}

    elif action == "auth_list":
        req = AuthListRequest(**body)
        return {"code": 0, "data": service.list_authorizations(req.knowledge_id), "message": "ok"}

    elif action == "auth_create":
        req = AuthCreateRequest(**body)
        return {"code": 0, "data": service.create_authorization(req.model_dump()), "message": "ok"}

    elif action == "auth_delete":
        req = AuthDeleteRequest(**body)
        service.delete_authorization(req.id)
        return {"code": 0, "data": None, "message": "ok"}

    return {"code": 400, "data": None, "message": f"Unknown action: {action}"}


@router.post("/api/knowledge/upload")
async def knowledge_upload(
    knowledge_id: str = Form(...),
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    service = KnowledgeService(session)
    content = await file.read()
    result = service.upload_document(knowledge_id, file.filename or "unknown", content)
    return {"code": 0, "data": result, "message": "ok"}
