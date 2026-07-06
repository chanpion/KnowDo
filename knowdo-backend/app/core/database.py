from sqlmodel import SQLModel, create_engine, Session
import chromadb
from app.core.config import DATABASE_URL, CHROMA_PATH

engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})

_chroma_client = None


def get_chroma_client() -> chromadb.PersistentClient:
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
    return _chroma_client


def init_db():
    """创建所有 SQLModel 表"""
    SQLModel.metadata.create_all(engine)


def get_session():
    """获取数据库会话（用于依赖注入）"""
    with Session(engine) as session:
        yield session
