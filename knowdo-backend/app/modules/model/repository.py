from typing import Optional
from sqlmodel import Session, select
from app.core.exceptions import NotFoundException
from app.modules.model.models import ModelConfig


class ModelRepository:
    def __init__(self, session: Session):
        self.session = session

    def list(self, provider: Optional[str] = None, type_: Optional[str] = None,
             status: Optional[str] = None, offset: int = 0, limit: int = 20) -> list[ModelConfig]:
        stmt = select(ModelConfig)
        if provider:
            stmt = stmt.where(ModelConfig.provider == provider)
        if type_:
            stmt = stmt.where(ModelConfig.type == type_)
        if status:
            stmt = stmt.where(ModelConfig.status == status)
        stmt = stmt.offset(offset).limit(limit)
        return list(self.session.exec(stmt).all())

    def count(self, provider: Optional[str] = None, type_: Optional[str] = None,
              status: Optional[str] = None) -> int:
        stmt = select(ModelConfig)
        if provider:
            stmt = stmt.where(ModelConfig.provider == provider)
        if type_:
            stmt = stmt.where(ModelConfig.type == type_)
        if status:
            stmt = stmt.where(ModelConfig.status == status)
        return len(list(self.session.exec(stmt).all()))

    def get_by_id(self, id: str) -> ModelConfig:
        model = self.session.get(ModelConfig, id)
        if model is None:
            raise NotFoundException(f"模型配置不存在: {id}")
        return model

    def create(self, model: ModelConfig) -> ModelConfig:
        self.session.add(model)
        self.session.commit()
        self.session.refresh(model)
        return model

    def update(self, id: str, **kwargs) -> ModelConfig:
        model = self.get_by_id(id)
        for key, value in kwargs.items():
            if value is not None and hasattr(model, key):
                setattr(model, key, value)
        self.session.add(model)
        self.session.commit()
        self.session.refresh(model)
        return model

    def delete(self, id: str) -> None:
        model = self.get_by_id(id)
        self.session.delete(model)
        self.session.commit()
