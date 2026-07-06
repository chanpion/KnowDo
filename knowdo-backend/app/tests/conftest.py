import os
import pytest


@pytest.fixture(autouse=True)
def clean_env():
    """每个测试前清除环境变量，避免测试间干扰"""
    original = os.environ.copy()
    for key in ("DATABASE_URL", "CHROMA_PATH"):
        os.environ.pop(key, None)
    yield
    os.environ.clear()
    os.environ.update(original)

