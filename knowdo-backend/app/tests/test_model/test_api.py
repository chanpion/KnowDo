import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import init_db


@pytest.fixture
def client():
    """同步 HTTP 客户端"""
    init_db()
    return TestClient(app)


def test_create_model(client):
    resp = client.post("/api/model", json={
        "action": "create",
        "name": "GPT-4",
        "provider": "openai",
        "type": "LLM",
        "api_url": "https://api.openai.com/v1",
        "api_key": "sk-xxx",
        "model_name": "gpt-4",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["code"] == 0
    assert data["data"]["name"] == "GPT-4"


def test_list_models(client):
    client.post("/api/model", json={
        "action": "create", "name": "A", "provider": "x", "type": "LLM",
        "api_url": "https://x.com", "api_key": "k", "model_name": "m",
    })
    resp = client.post("/api/model", json={"action": "list"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["code"] == 0
    assert data["data"]["total"] >= 1


def test_get_model_not_found(client):
    resp = client.post("/api/model", json={"action": "detail", "id": "nonexistent"})
    data = resp.json()
    assert data["code"] == 404


def test_delete_model(client):
    create_resp = client.post("/api/model", json={
        "action": "create", "name": "D", "provider": "x", "type": "LLM",
        "api_url": "https://x.com", "api_key": "k", "model_name": "m",
    })
    model_id = create_resp.json()["data"]["id"]
    resp = client.post("/api/model", json={"action": "delete", "id": model_id})
    assert resp.json()["code"] == 0
    # verify deleted
    resp2 = client.post("/api/model", json={"action": "detail", "id": model_id})
    assert resp2.json()["code"] == 404


