import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import init_db


@pytest.fixture
def client():
    """同步 HTTP 客户端"""
    init_db()
    return TestClient(app)


def test_create_knowledge(client):
    resp = client.post("/api/knowledge", json={
        "action": "create", "name": "Test KB", "type": "general",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["code"] == 0
    assert data["data"]["name"] == "Test KB"


def test_list_knowledge(client):
    client.post("/api/knowledge", json={
        "action": "create", "name": "KB1", "type": "general"
    })
    resp = client.post("/api/knowledge", json={"action": "list"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["code"] == 0
    assert data["data"]["total"] >= 1


def test_get_knowledge_not_found(client):
    resp = client.post("/api/knowledge", json={
        "action": "detail", "id": "nonexistent",
    })
    data = resp.json()
    assert data["code"] == 404


def test_delete_knowledge(client):
    create_resp = client.post("/api/knowledge", json={
        "action": "create", "name": "ToDelete", "type": "general",
    })
    kb_id = create_resp.json()["data"]["id"]
    resp = client.post("/api/knowledge", json={
        "action": "delete", "id": kb_id,
    })
    assert resp.json()["code"] == 0
    # verify deleted
    resp2 = client.post("/api/knowledge", json={
        "action": "detail", "id": kb_id,
    })
    assert resp2.json()["code"] == 404


def test_update_knowledge(client):
    create_resp = client.post("/api/knowledge", json={
        "action": "create", "name": "Original", "type": "general",
    })
    kb_id = create_resp.json()["data"]["id"]
    resp = client.post("/api/knowledge", json={
        "action": "update", "id": kb_id, "name": "Updated",
    })
    data = resp.json()
    assert data["code"] == 0
    assert data["data"]["name"] == "Updated"


def test_recall_test_empty(client):
    kb_resp = client.post("/api/knowledge", json={
        "action": "create", "name": "Recall KB", "type": "general",
    })
    kb_id = kb_resp.json()["data"]["id"]
    resp = client.post("/api/knowledge", json={
        "action": "recall_test",
        "knowledge_id": kb_id,
        "query": "test",
        "top_k": 5,
        "search_mode": "keyword",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["code"] == 0
    assert isinstance(data["data"], list)


def test_doc_list(client):
    kb_resp = client.post("/api/knowledge", json={
        "action": "create", "name": "KB", "type": "general",
    })
    kb_id = kb_resp.json()["data"]["id"]
    resp = client.post("/api/knowledge", json={
        "action": "doc_list", "knowledge_id": kb_id,
    })
    data = resp.json()
    assert data["code"] == 0
    assert isinstance(data["data"], list)
    assert len(data["data"]) == 0


def test_doc_upload_and_list(client):
    kb_resp = client.post("/api/knowledge", json={
        "action": "create", "name": "KB", "type": "general",
    })
    kb_id = kb_resp.json()["data"]["id"]

    # Upload document using multipart form
    upload_resp = client.post("/api/knowledge/upload", data={
        "knowledge_id": kb_id,
    }, files={
        "file": ("test.txt", b"hello world"),
    })
    assert upload_resp.status_code == 200
    data = upload_resp.json()
    assert data["code"] == 0

    # List documents
    resp = client.post("/api/knowledge", json={
        "action": "doc_list", "knowledge_id": kb_id,
    })
    data = resp.json()
    assert data["code"] == 0
    assert len(data["data"]) == 1
    assert data["data"][0]["name"] == "test.txt"


def test_doc_detail(client):
    kb_resp = client.post("/api/knowledge", json={
        "action": "create", "name": "KB", "type": "general",
    })
    kb_id = kb_resp.json()["data"]["id"]

    upload_resp = client.post("/api/knowledge/upload", data={
        "knowledge_id": kb_id,
    }, files={
        "file": ("test.txt", b"hello world"),
    })
    doc_id = upload_resp.json()["data"]["id"]

    resp = client.post("/api/knowledge", json={
        "action": "doc_detail", "knowledge_id": kb_id, "doc_id": doc_id,
    })
    data = resp.json()
    assert data["code"] == 0
    assert data["data"]["name"] == "test.txt"


def test_doc_delete(client):
    kb_resp = client.post("/api/knowledge", json={
        "action": "create", "name": "KB", "type": "general",
    })
    kb_id = kb_resp.json()["data"]["id"]

    upload_resp = client.post("/api/knowledge/upload", data={
        "knowledge_id": kb_id,
    }, files={
        "file": ("test.txt", b"hello world"),
    })
    doc_id = upload_resp.json()["data"]["id"]

    resp = client.post("/api/knowledge", json={
        "action": "doc_delete", "knowledge_id": kb_id, "doc_id": doc_id,
    })
    assert resp.json()["code"] == 0


def test_doc_chunks(client):
    kb_resp = client.post("/api/knowledge", json={
        "action": "create", "name": "KB", "type": "general",
    })
    kb_id = kb_resp.json()["data"]["id"]

    upload_resp = client.post("/api/knowledge/upload", data={
        "knowledge_id": kb_id,
    }, files={
        "file": ("test.txt", b"hello world"),
    })
    doc_id = upload_resp.json()["data"]["id"]

    resp = client.post("/api/knowledge", json={
        "action": "doc_chunks", "knowledge_id": kb_id, "doc_id": doc_id,
    })
    data = resp.json()
    assert data["code"] == 0
    assert isinstance(data["data"], list)
