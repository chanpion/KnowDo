import uuid
from datetime import datetime
from typing import Any, Optional
from sqlmodel import Session
from app.core.database import get_chroma_client
from app.core.exceptions import ValidationException, ServiceException
from app.modules.knowledge.models import KnowledgeBase, KnowledgeDocument
from app.modules.knowledge.repository import KnowledgeRepository
from app.modules.knowledge.chunker import chunk_text
from app.modules.knowledge.parser import parse_document


class KnowledgeService:
    def __init__(self, session: Session):
        self.repo = KnowledgeRepository(session)
        self.session = session

    # ---- Knowledge Base CRUD ----

    def list_knowledge(self, params: dict[str, Any]) -> dict[str, Any]:
        page = params.get("page", 1)
        size = params.get("size", 20)
        offset = (page - 1) * size
        items = self.repo.list(
            folder_id=params.get("folder_id"),
            type_=params.get("type"),
            status=params.get("status"),
            offset=offset, limit=size,
        )
        total = self.repo.count(
            folder_id=params.get("folder_id"),
            type_=params.get("type"),
            status=params.get("status"),
        )
        return {
            "items": [_kb_to_dict(kb) for kb in items],
            "total": total,
            "page": page,
            "size": size,
        }

    def create_knowledge(self, data: dict[str, Any]) -> dict[str, Any]:
        now = datetime.now().isoformat()
        kb = KnowledgeBase(
            id=str(uuid.uuid4()),
            name=data["name"],
            description=data.get("description"),
            type=data.get("type", "general"),
            icon=data.get("icon"),
            folder_id=data.get("folder_id"),
            status="pending",
            created_at=now,
            updated_at=now,
        )
        created = self.repo.create(kb)
        return _kb_to_dict(created)

    def get_knowledge(self, id: str) -> dict[str, Any]:
        kb = self.repo.get_by_id(id)
        result = _kb_to_dict(kb)
        result["document_count"] = self.repo.count_documents(id)
        result["chunk_count"] = self._count_chunks_in_chroma(id)
        return result

    def update_knowledge(self, data: dict[str, Any]) -> dict[str, Any]:
        id = data.pop("id")
        data["updated_at"] = datetime.now().isoformat()
        updated = self.repo.update(id, **data)
        return _kb_to_dict(updated)

    def delete_knowledge(self, id: str) -> None:
        client = get_chroma_client()
        collection_name = f"kb_{id}_chunks"
        try:
            client.delete_collection(collection_name)
        except Exception:
            pass
        self.repo.delete(id)

    # ---- Document Management ----

    def list_documents(self, knowledge_id: str) -> list[dict]:
        docs = self.repo.list_documents(knowledge_id)
        return [_doc_to_dict(d) for d in docs]

    def get_document(self, knowledge_id: str, doc_id: str) -> dict[str, Any]:
        doc = self.repo.get_document(doc_id)
        if doc.knowledge_id != knowledge_id:
            raise ValidationException("文档不属于该知识库")
        return _doc_to_dict(doc)

    def upload_document(self, knowledge_id: str, filename: str, content: bytes) -> dict[str, Any]:
        kb = self.repo.get_by_id(knowledge_id)

        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        size = str(len(content))

        now = datetime.now().isoformat()
        doc = KnowledgeDocument(
            id=str(uuid.uuid4()),
            knowledge_id=knowledge_id,
            name=filename,
            type=ext,
            size=size,
            status="processing",
            created_at=now,
        )
        doc = self.repo.create_document(doc)

        try:
            text = parse_document(filename, content)
            doc = self.repo.update_document(doc.id, content=text)

            chunks = chunk_text(
                text,
                chunk_size=kb.chunk_size,
                chunk_overlap=kb.chunk_overlap,
            )

            self._index_chunks(knowledge_id, doc.id, chunks, kb)

            self.repo.update_document(doc.id, status="completed")
            self.repo.update(knowledge_id, status="completed", updated_at=datetime.now().isoformat())

        except Exception as e:
            self.repo.update_document(doc.id, status="failed", error=str(e))
            raise ServiceException(f"文档处理失败: {e}")

        return _doc_to_dict(self.repo.get_document(doc.id))

    def delete_document(self, knowledge_id: str, doc_id: str) -> None:
        doc = self.repo.get_document(doc_id)
        if doc.knowledge_id != knowledge_id:
            raise ValidationException("文档不属于该知识库")

        self._delete_chunks(knowledge_id, doc_id)
        self.repo.delete_document(doc_id)

    def get_chunks(self, knowledge_id: str, doc_id: str) -> list[dict]:
        doc = self.repo.get_document(doc_id)
        if doc.knowledge_id != knowledge_id:
            raise ValidationException("文档不属于该知识库")

        client = get_chroma_client()
        collection_name = f"kb_{knowledge_id}_chunks"
        try:
            collection = client.get_collection(collection_name)
            result = collection.get(where={"doc_id": doc_id})
            chunks = []
            if result["ids"]:
                for i, chunk_id in enumerate(result["ids"]):
                    chunks.append({
                        "id": chunk_id,
                        "index": result["metadatas"][i].get("chunk_index", i),
                        "content": result["documents"][i],
                        "length": len(result["documents"][i]),
                    })
            return sorted(chunks, key=lambda c: c["index"])
        except Exception:
            return []

    def rechunk_document(self, knowledge_id: str, doc_id: str,
                         chunk_mode: Optional[str] = None,
                         chunk_size: Optional[int] = None,
                         chunk_overlap: Optional[int] = None) -> list[dict]:
        doc = self.repo.get_document(doc_id)
        if doc.knowledge_id != knowledge_id:
            raise ValidationException("文档不属于该知识库")
        if not doc.content:
            raise ValidationException("文档无可解析内容")

        kb = self.repo.get_by_id(knowledge_id)
        size = chunk_size or kb.chunk_size
        overlap = chunk_overlap or kb.chunk_overlap

        self._delete_chunks(knowledge_id, doc_id)

        chunks = chunk_text(doc.content, chunk_size=size, chunk_overlap=overlap)
        self._index_chunks(knowledge_id, doc_id, chunks, kb)

        return chunks

    # ---- Recall Test ----

    def recall_test(self, knowledge_id: str, query: str, top_k: int = 5,
                    search_mode: str = "vector") -> list[dict]:
        kb = self.repo.get_by_id(knowledge_id)
        client = get_chroma_client()
        collection_name = f"kb_{knowledge_id}_chunks"

        try:
            collection = client.get_collection(collection_name)
        except Exception:
            return []

        if search_mode == "keyword":
            return self._keyword_search(knowledge_id, query, top_k)
        elif search_mode == "hybrid":
            vector_results = self._vector_search(collection, kb, query, top_k * 2)
            keyword_results = self._keyword_search(knowledge_id, query, top_k * 2)
            return self._merge_hybrid_results(vector_results, keyword_results, top_k)
        else:
            return self._vector_search(collection, kb, query, top_k)

    # ---- Private Helpers ----

    def _index_chunks(self, knowledge_id: str, doc_id: str, chunks: list[dict],
                      kb: KnowledgeBase) -> None:
        if not chunks:
            return

        client = get_chroma_client()
        collection_name = f"kb_{knowledge_id}_chunks"

        try:
            collection = client.get_collection(collection_name)
        except Exception:
            collection = client.create_collection(collection_name)

        ids = []
        embeddings = []
        documents = []
        metadatas = []

        embedder = self._get_embedder(kb)

        for chunk in chunks:
            chunk_id = f"{doc_id}_{chunk['index']}"
            ids.append(chunk_id)
            documents.append(chunk["content"])
            metadatas.append({
                "doc_id": doc_id,
                "chunk_index": chunk["index"],
                "content": chunk["content"][:200],
                "knowledge_id": knowledge_id,
            })

            if embedder:
                try:
                    emb = embedder.embed(chunk["content"])
                    embeddings.append(emb)
                except Exception:
                    embeddings.append([0.0] * 384)
            else:
                embeddings.append([0.0] * 384)

        collection.add(ids=ids, embeddings=embeddings, documents=documents,
                       metadatas=metadatas)

    def _delete_chunks(self, knowledge_id: str, doc_id: str) -> None:
        client = get_chroma_client()
        collection_name = f"kb_{knowledge_id}_chunks"
        try:
            collection = client.get_collection(collection_name)
            collection.delete(where={"doc_id": doc_id})
        except Exception:
            pass

    def _get_embedder(self, kb: KnowledgeBase):
        if not kb.embedding_model:
            return None
        try:
            from app.modules.model.repository import ModelRepository
            model_repo = ModelRepository(self.session)
            model = model_repo.get_by_id(kb.embedding_model)
            from agno.models.openai import OpenAIEmbedder
            return OpenAIEmbedder(
                id=model.model_name,
                api_key=model.api_key,
                base_url=model.api_url,
            )
        except Exception:
            return None

    def _vector_search(self, collection, kb: KnowledgeBase, query: str,
                       top_k: int) -> list[dict]:
        embedder = self._get_embedder(kb)
        if embedder:
            query_embedding = embedder.embed(query)
            result = collection.query(
                query_embeddings=[query_embedding],
                n_results=min(top_k, collection.count()),
            )
        else:
            result = collection.query(
                query_texts=[query],
                n_results=min(top_k, collection.count()),
            )

        return self._format_results(result)

    def _keyword_search(self, knowledge_id: str, query: str, top_k: int) -> list[dict]:
        from sqlmodel import select
        docs = self.repo.list_documents(knowledge_id)
        results = []
        keywords = query.split()

        for doc in docs:
            if not doc.content:
                continue
            for kw in keywords:
                content_lower = doc.content.lower()
                idx = content_lower.find(kw.lower())
                if idx >= 0:
                    start = max(0, idx - 50)
                    end = min(len(doc.content), idx + 200)
                    snippet = doc.content[start:end]
                    score = 0.5
                    results.append({
                        "doc_name": doc.name,
                        "chunk_index": 0,
                        "score": score,
                        "content": snippet.strip(),
                    })
                    break

        results.sort(key=lambda r: r["score"], reverse=True)
        return results[:top_k]

    def _merge_hybrid_results(self, vector_results: list[dict],
                               keyword_results: list[dict], top_k: int) -> list[dict]:
        VECTOR_WEIGHT = 0.7
        merged = {}

        for r in vector_results:
            key = f"{r['doc_name']}_{r['chunk_index']}"
            merged[key] = {"score": r["score"] * VECTOR_WEIGHT, **r}

        for r in keyword_results:
            key = f"{r['doc_name']}_{r['chunk_index']}"
            if key in merged:
                merged[key]["score"] += r["score"] * (1 - VECTOR_WEIGHT)
            else:
                merged[key] = {"score": r["score"] * (1 - VECTOR_WEIGHT), **r}

        results = sorted(merged.values(), key=lambda r: r["score"], reverse=True)
        return results[:top_k]

    def _format_results(self, chroma_result) -> list[dict]:
        results = []
        if not chroma_result or not chroma_result.get("ids") or not chroma_result["ids"][0]:
            return results

        ids = chroma_result["ids"][0]
        distances = chroma_result.get("distances", [[]])[0]
        metadatas = chroma_result.get("metadatas", [[]])[0]

        for i, chunk_id in enumerate(ids):
            distance = distances[i] if i < len(distances) else 1.0
            score = max(0.0, 1.0 - distance / 2.0)
            meta = metadatas[i] if i < len(metadatas) else {}
            results.append({
                "chunk_id": chunk_id,
                "doc_name": self._get_doc_name(meta.get("doc_id", "")),
                "chunk_index": meta.get("chunk_index", 0),
                "score": round(score, 4),
                "content": meta.get("content", ""),
            })

        return results

    def _get_doc_name(self, doc_id: str) -> str:
        try:
            doc = self.repo.get_document(doc_id)
            return doc.name
        except Exception:
            return "unknown"

    def _count_chunks_in_chroma(self, knowledge_id: str) -> int:
        try:
            client = get_chroma_client()
            collection = client.get_collection(f"kb_{knowledge_id}_chunks")
            return collection.count()
        except Exception:
            return 0


def _kb_to_dict(kb: KnowledgeBase) -> dict[str, Any]:
    return {
        "id": kb.id,
        "name": kb.name,
        "description": kb.description,
        "type": kb.type,
        "status": kb.status,
        "icon": kb.icon,
        "folder_id": kb.folder_id,
        "vector_model": kb.vector_model,
        "embedding_model": kb.embedding_model,
        "chunk_mode": kb.chunk_mode,
        "chunk_size": kb.chunk_size,
        "chunk_overlap": kb.chunk_overlap,
        "search_mode": kb.search_mode,
        "top_k": kb.top_k,
        "score_threshold": kb.score_threshold,
        "enable_rerank": kb.enable_rerank,
        "rerank_model": kb.rerank_model,
        "created_at": kb.created_at,
        "updated_at": kb.updated_at,
    }


def _doc_to_dict(doc: KnowledgeDocument) -> dict[str, Any]:
    return {
        "id": doc.id,
        "knowledge_id": doc.knowledge_id,
        "name": doc.name,
        "type": doc.type,
        "size": doc.size,
        "status": doc.status,
        "content": doc.content[:500] if doc.content else None,
        "error": doc.error,
        "created_at": doc.created_at,
    }
