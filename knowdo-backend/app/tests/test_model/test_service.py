import pytest
from sqlmodel import Session, SQLModel, create_engine
from app.modules.model.service import ModelService
from app.core.exceptions import NotFoundException


@pytest.fixture
def session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        yield s


@pytest.fixture
def service(session):
    return ModelService(session)


def test_create_model(service):
    result = service.create_model({
        "name": "GPT-4",
        "provider": "openai",
        "type": "LLM",
        "api_url": "https://api.openai.com/v1",
        "api_key": "sk-xxx",
        "model_name": "gpt-4",
    })
    assert result["name"] == "GPT-4"
    assert result["status"] == "offline"
    assert result["id"] is not None


def test_list_models(service):
    service.create_model({
        "name": "A", "provider": "openai", "type": "LLM",
        "api_url": "https://x.com", "api_key": "k", "model_name": "m",
    })
    service.create_model({
        "name": "B", "provider": "anthropic", "type": "LLM",
        "api_url": "https://x.com", "api_key": "k", "model_name": "m",
    })
    result = service.list_models({"page": 1, "size": 10})
    assert result["total"] == 2
    assert len(result["items"]) == 2


def test_list_models_filter_by_provider(service):
    service.create_model({
        "name": "A", "provider": "openai", "type": "LLM",
        "api_url": "https://x.com", "api_key": "k", "model_name": "m",
    })
    service.create_model({
        "name": "B", "provider": "anthropic", "type": "LLM",
        "api_url": "https://x.com", "api_key": "k", "model_name": "m",
    })
    result = service.list_models({"provider": "openai"})
    assert result["total"] == 1
    assert result["items"][0]["name"] == "A"


def test_get_model(service):
    created = service.create_model({
        "name": "GPT-4", "provider": "openai", "type": "LLM",
        "api_url": "https://x.com", "api_key": "k", "model_name": "m",
    })
    result = service.get_model(created["id"])
    assert result["name"] == "GPT-4"


def test_get_model_not_found(service):
    with pytest.raises(NotFoundException):
        service.get_model("nonexistent")


def test_update_model(service):
    created = service.create_model({
        "name": "GPT-4", "provider": "openai", "type": "LLM",
        "api_url": "https://x.com", "api_key": "k", "model_name": "m",
    })
    result = service.update_model({"id": created["id"], "name": "GPT-4o"})
    assert result["name"] == "GPT-4o"


def test_delete_model(service):
    created = service.create_model({
        "name": "GPT-4", "provider": "openai", "type": "LLM",
        "api_url": "https://x.com", "api_key": "k", "model_name": "m",
    })
    service.delete_model(created["id"])
    with pytest.raises(NotFoundException):
        service.get_model(created["id"])
