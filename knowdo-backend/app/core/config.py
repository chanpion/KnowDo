import os


DB_TYPE = os.getenv("DB_TYPE", "sqlite")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./knowdo.db")
CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_data")

# ChromaDB Embedding function name（内置轻量嵌入模型）
CHROMA_EMBEDDING_FN = "all-MiniLM-L6-v2"

# MySQL/PostgreSQL 参数
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "")
DB_USER = os.getenv("DB_USER", "")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "knowdo")
