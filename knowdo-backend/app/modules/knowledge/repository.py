from typing import Optional, List
from sqlmodel import Session, select
from app.core.exceptions import NotFoundException
from app.modules.knowledge.models import KnowledgeBase, KnowledgeDocument, KnowledgeFolder, KnowledgeAuthorization


class KnowledgeRepository:
    def __init__(self, session: Session):
        self.session = session

    def list(self, folder_id: Optional[str] = None, type_: Optional[str] = None,
             status: Optional[str] = None, offset: int = 0, limit: int = 20) -> List[KnowledgeBase]:
        stmt = select(KnowledgeBase)
        if folder_id:
            stmt = stmt.where(KnowledgeBase.folder_id == folder_id)
        if type_:
            stmt = stmt.where(KnowledgeBase.type == type_)
        if status:
            stmt = stmt.where(KnowledgeBase.status == status)
        stmt = stmt.offset(offset).limit(limit)
        return list(self.session.exec(stmt).all())

    def count(self, folder_id: Optional[str] = None, type_: Optional[str] = None,
              status: Optional[str] = None) -> int:
        stmt = select(KnowledgeBase)
        if folder_id:
            stmt = stmt.where(KnowledgeBase.folder_id == folder_id)
        if type_:
            stmt = stmt.where(KnowledgeBase.type == type_)
        if status:
            stmt = stmt.where(KnowledgeBase.status == status)
        return len(list(self.session.exec(stmt).all()))

    def get_by_id(self, id: str) -> KnowledgeBase:
        kb = self.session.get(KnowledgeBase, id)
        if kb is None:
            raise NotFoundException(f"知识库不存在: {id}")
        return kb

    def create(self, kb: KnowledgeBase) -> KnowledgeBase:
        self.session.add(kb)
        self.session.commit()
        self.session.refresh(kb)
        return kb

    def update(self, id: str, **kwargs) -> KnowledgeBase:
        kb = self.get_by_id(id)
        for key, value in kwargs.items():
            if value is not None and hasattr(kb, key):
                setattr(kb, key, value)
        self.session.add(kb)
        self.session.commit()
        self.session.refresh(kb)
        return kb

    def delete(self, id: str) -> None:
        kb = self.get_by_id(id)
        self.session.delete(kb)
        self.session.commit()

    # --- Document ---

    def list_documents(self, knowledge_id: str) -> List[KnowledgeDocument]:
        stmt = select(KnowledgeDocument).where(
            KnowledgeDocument.knowledge_id == knowledge_id
        )
        return list(self.session.exec(stmt).all())

    def get_document(self, doc_id: str) -> KnowledgeDocument:
        doc = self.session.get(KnowledgeDocument, doc_id)
        if doc is None:
            raise NotFoundException(f"文档不存在: {doc_id}")
        return doc

    def create_document(self, doc: KnowledgeDocument) -> KnowledgeDocument:
        self.session.add(doc)
        self.session.commit()
        self.session.refresh(doc)
        return doc

    def update_document(self, doc_id: str, **kwargs) -> KnowledgeDocument:
        doc = self.get_document(doc_id)
        for key, value in kwargs.items():
            if value is not None and hasattr(doc, key):
                setattr(doc, key, value)
        self.session.add(doc)
        self.session.commit()
        self.session.refresh(doc)
        return doc

    def delete_document(self, doc_id: str) -> None:
        doc = self.get_document(doc_id)
        self.session.delete(doc)
        self.session.commit()

    def count_documents(self, knowledge_id: str) -> int:
        stmt = select(KnowledgeDocument).where(
            KnowledgeDocument.knowledge_id == knowledge_id
        )
        return len(list(self.session.exec(stmt).all()))

    # --- Folder ---

    def list_folders(self) -> List[KnowledgeFolder]:
        return list(self.session.exec(select(KnowledgeFolder)).all())

    def get_folder(self, folder_id: str) -> KnowledgeFolder:
        folder = self.session.get(KnowledgeFolder, folder_id)
        if folder is None:
            raise NotFoundException(f"文件夹不存在: {folder_id}")
        return folder

    def create_folder(self, folder: KnowledgeFolder) -> KnowledgeFolder:
        self.session.add(folder)
        self.session.commit()
        self.session.refresh(folder)
        return folder

    def rename_folder(self, folder_id: str, name: str) -> KnowledgeFolder:
        folder = self.get_folder(folder_id)
        folder.name = name
        self.session.add(folder)
        self.session.commit()
        self.session.refresh(folder)
        return folder

    def delete_folder(self, folder_id: str) -> None:
        folder = self.get_folder(folder_id)
        # 检查是否有子文件夹
        children = self.session.exec(
            select(KnowledgeFolder).where(KnowledgeFolder.parent_id == folder_id)
        ).all()
        if children:
            from app.core.exceptions import ValidationException
            raise ValidationException("文件夹下有子文件夹，无法删除")
        self.session.delete(folder)
        self.session.commit()

    def move_folder(self, folder_id: str, target_parent_id: Optional[str]) -> KnowledgeFolder:
        folder = self.get_folder(folder_id)
        folder.parent_id = target_parent_id
        self.session.add(folder)
        self.session.commit()
        self.session.refresh(folder)
        return folder

    def _count_kb_in_folder(self, folder_id: str) -> int:
        stmt = select(KnowledgeBase).where(KnowledgeBase.folder_id == folder_id)
        return len(list(self.session.exec(stmt).all()))

    # --- Authorization ---

    def list_authorizations(self, knowledge_id: str) -> List[KnowledgeAuthorization]:
        stmt = select(KnowledgeAuthorization).where(
            KnowledgeAuthorization.knowledge_id == knowledge_id
        )
        return list(self.session.exec(stmt).all())

    def create_authorization(self, auth: KnowledgeAuthorization) -> KnowledgeAuthorization:
        self.session.add(auth)
        self.session.commit()
        self.session.refresh(auth)
        return auth

    def delete_authorization(self, auth_id: str) -> None:
        auth = self.session.get(KnowledgeAuthorization, auth_id)
        if auth is None:
            raise NotFoundException(f"授权不存在: {auth_id}")
        self.session.delete(auth)
        self.session.commit()
