from fastapi import APIRouter, Depends, Request
from sqlmodel import Session
from app.core.database import get_session
from app.modules.model.schemas import (
    ModelCreateRequest, ModelUpdateRequest, ModelDetailRequest,
    ModelDeleteRequest, ModelTestRequest, ModelListRequest,
)
from app.modules.model.service import ModelService

router = APIRouter()


def get_service(session: Session = Depends(get_session)) -> ModelService:
    return ModelService(session)


@router.post("/api/model")
async def model_handler(request: Request, service: ModelService = Depends(get_service)):
    body = await request.json()
    action = body.get("action")

    if action == "list":
        req = ModelListRequest(**body)
        return {"code": 0, "data": service.list_models(req.model_dump(exclude_none=True)), "message": "ok"}

    elif action == "create":
        req = ModelCreateRequest(**body)
        return {"code": 0, "data": service.create_model(req.model_dump()), "message": "ok"}

    elif action == "detail":
        req = ModelDetailRequest(**body)
        return {"code": 0, "data": service.get_model(req.id), "message": "ok"}

    elif action == "update":
        req = ModelUpdateRequest(**body)
        return {"code": 0, "data": service.update_model(req.model_dump(exclude_none=True)), "message": "ok"}

    elif action == "delete":
        req = ModelDeleteRequest(**body)
        service.delete_model(req.id)
        return {"code": 0, "data": None, "message": "ok"}

    elif action == "test":
        req = ModelTestRequest(**body)
        return {"code": 0, "data": service.test_model(req.id), "message": "ok"}

    return {"code": 400, "data": None, "message": f"Unknown action: {action}"}
