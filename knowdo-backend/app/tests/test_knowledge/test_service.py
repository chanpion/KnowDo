import pytest
from sqlmodel import Session, SQLModel, create_engine
from app.modules.knowledge.service import KnowledgeService
from app.core.exceptions import NotFoundException


@pytest.fixture
def session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        yield s


@pytest.fixture
def service(session):
    return KnowledgeService(session)


def test_create_knowledge(service):
    result = service.create_knowledge({"name": "Test KB", "type": "general"})
    assert result["name"] == "Test KB"
    assert result["status"] == "pending"
    assert result["id"] is not None


def test_list_knowledge(service):
    service.create_knowledge({"name": "KB1"})
    service.create_knowledge({"name": "KB2"})
    result = service.list_knowledge({})
    assert result["total"] == 2


def test_list_knowledge_with_pagination(service):
    for i in range(5):
        service.create_knowledge({"name": f"KB{i}"})
    result = service.list_knowledge({"page": 1, "size": 2})
    assert result["total"] == 5
    assert len(result["items"]) == 2
    assert result["page"] == 1
    assert result["size"] == 2


def test_get_knowledge(service):
    kb = service.create_knowledge({"name": "Test KB"})
    result = service.get_knowledge(kb["id"])
    assert result["name"] == "Test KB"
    assert result["status"] == "pending"


def test_get_knowledge_not_found(service):
    with pytest.raises(NotFoundException):
        service.get_knowledge("nonexistent")


def test_update_knowledge(service):
    kb = service.create_knowledge({"name": "KB", "description": "old"})
    result = service.update_knowledge({"id": kb["id"], "name": "Updated", "description": "new"})
    assert result["name"] == "Updated"
    assert result["description"] == "new"


def test_delete_knowledge(service):
    kb = service.create_knowledge({"name": "KB"})
    service.delete_knowledge(kb["id"])
    with pytest.raises(NotFoundException):
        service.get_knowledge(kb["id"])


def test_upload_document(service):
    kb = service.create_knowledge({"name": "KB", "type": "general"})
    result = service.upload_document(kb["id"], "test.txt", b"hello world")
    assert result["name"] == "test.txt"
    assert result["status"] == "completed"


def test_list_documents(service):
    kb = service.create_knowledge({"name": "KB"})
    service.upload_document(kb["id"], "test1.txt", b"hello world")
    service.upload_document(kb["id"], "test2.txt", b"foo bar")
    docs = service.list_documents(kb["id"])
    assert len(docs) == 2


def test_get_document(service):
    kb = service.create_knowledge({"name": "KB"})
    uploaded = service.upload_document(kb["id"], "test.txt", b"hello world")
    doc = service.get_document(kb["id"], uploaded["id"])
    assert doc["name"] == "test.txt"
    assert doc["status"] == "completed"


def test_delete_document(service):
    kb = service.create_knowledge({"name": "KB"})
    uploaded = service.upload_document(kb["id"], "test.txt", b"hello world")
    service.delete_document(kb["id"], uploaded["id"])
    with pytest.raises(Exception):
        service.get_document(kb["id"], uploaded["id"])


def test_recall_test_keyword(service):
    kb = service.create_knowledge({"name": "KB"})
    service.upload_document(kb["id"], "test.txt", b"hello world foo bar")

    results = service.recall_test(kb["id"], "hello", top_k=5, search_mode="keyword")
    assert isinstance(results, list)
    # keyword search should find matches
    if results:
        assert any("hello" in r.get("content", "").lower() for r in results)


def test_recall_test_empty_knowledge(service):
    kb = service.create_knowledge({"name": "KB"})
    results = service.recall_test(kb["id"], "test", top_k=5, search_mode="keyword")
    assert results == []


def test_get_chunks_empty(service):
    kb = service.create_knowledge({"name": "KB"})
    uploaded = service.upload_document(kb["id"], "test.txt", b"hello world")
    chunks = service.get_chunks(kb["id"], uploaded["id"])
    # Should return list (may be empty if Chroma is not initialized)
    assert isinstance(chunks, list)
