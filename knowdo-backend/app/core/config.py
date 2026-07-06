import os


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./knowdo.db")
CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_data")

# ChromaDB Embedding function name（内置轻量嵌入模型）
CHROMA_EMBEDDING_FN = "all-MiniLM-L6-v2"
