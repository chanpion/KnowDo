import uuid
from datetime import datetime
from typing import Optional, Any
from sqlmodel import Session
from app.core.exceptions import ValidationException, ServiceException
from app.modules.model.models import ModelConfig
from app.modules.model.repository import ModelRepository


class ModelService:
    def __init__(self, session: Session):
        self.repo = ModelRepository(session)
        self.session = session

    def list_models(self, params: dict[str, Any]) -> dict[str, Any]:
        page = params.get("page", 1)
        size = params.get("size", 20)
        offset = (page - 1) * size
        provider = params.get("provider")
        type_ = params.get("type")
        status = params.get("status")
        items = self.repo.list(provider=provider, type_=type_, status=status,
                               offset=offset, limit=size)
        total = self.repo.count(provider=provider, type_=type_, status=status)
        return {
            "items": [_model_to_dict(m) for m in items],
            "total": total,
            "page": page,
            "size": size,
        }

    def create_model(self, data: dict[str, Any]) -> dict[str, Any]:
        now = datetime.now().isoformat()
        model = ModelConfig(
            id=str(uuid.uuid4()),
            name=data["name"],
            provider=data["provider"],
            type=data["type"],
            api_url=data["api_url"],
            api_key=data["api_key"],
            model_name=data["model_name"],
            max_tokens=data.get("max_tokens"),
            concurrency=data.get("concurrency"),
            timeout=data.get("timeout"),
            retry=data.get("retry"),
            status="offline",
            created_at=now,
            updated_at=now,
        )
        created = self.repo.create(model)
        return _model_to_dict(created)

    def get_model(self, id: str) -> dict[str, Any]:
        return _model_to_dict(self.repo.get_by_id(id))

    def update_model(self, data: dict[str, Any]) -> dict[str, Any]:
        id = data.pop("id")
        data["updated_at"] = datetime.now().isoformat()
        updated = self.repo.update(id, **data)
        return _model_to_dict(updated)

    def delete_model(self, id: str) -> None:
        self.repo.delete(id)

    def test_model(self, id: str) -> dict[str, Any]:
        model = self.repo.get_by_id(id)
        now = datetime.now().isoformat()
        try:
            from agno.models.openai import OpenAIChat

            agno_model = OpenAIChat(
                id=model.model_name,
                api_key=model.api_key,
                base_url=model.api_url,
            )
            start = datetime.now()
            agno_model.response("ping")
            elapsed = (datetime.now() - start).total_seconds()
            latency = f"{elapsed:.2f}s"

            self.repo.update(id, status="online", last_test=now,
                             test_success=True, test_latency=latency,
                             updated_at=now)
            return {"success": True, "latency": latency, "error": None}
        except Exception as e:
            error_msg = str(e)
            self.repo.update(id, status="offline", last_test=now,
                             test_success=False, test_latency=None,
                             updated_at=now)
            return {"success": False, "latency": None, "error": error_msg}


def _model_to_dict(m: ModelConfig) -> dict[str, Any]:
    return {
        "id": m.id,
        "name": m.name,
        "provider": m.provider,
        "type": m.type,
        "api_url": m.api_url,
        "api_key": m.api_key,
        "model_name": m.model_name,
        "max_tokens": m.max_tokens,
        "concurrency": m.concurrency,
        "timeout": m.timeout,
        "retry": m.retry,
        "status": m.status,
        "last_test": m.last_test,
        "test_success": m.test_success,
        "test_latency": m.test_latency,
        "created_at": m.created_at,
        "updated_at": m.updated_at,
    }
