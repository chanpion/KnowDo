# KnowDo 后端实现计划 — 模型管理与知识库模块

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建 KnowDo 后端服务，实现模型配置管理（CRUD + 连接测试）和知识库管理（CRUD + 文档上传/分段/向量化 + 召回测试）。

**Architecture:** FastAPI 为主体框架，SQLModel 做 ORM，ChromaDB 存向量，Agno SDK 在 AI 调用点（连接测试、Embedding、向量检索）介入。按业务模块分包（model/knowledge），每模块自含 api → service → repository → models 四层。

**Tech Stack:** Python 3.12+ / FastAPI / SQLModel (SQLAlchemy + Pydantic) / ChromaDB / Agno / pytest + httpx

---

## 文件结构

```
knowdo-backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   └── exceptions.py
│   ├── modules/
│   │   ├── __init__.py
│   │   ├── model/
│   │   │   ├── __init__.py
│   │   │   ├── models.py
│   │   │   ├── schemas.py
│   │   │   ├── repository.py
│   │   │   ├── service.py
│   │   │   └── api.py
│   │   └── knowledge/
│   │       ├── __init__.py
│   │       ├── models.py
│   │       ├── schemas.py
│   │       ├── repository.py
│   │       ├── chunker.py
│   │       ├── parser.py
│   │       ├── service.py
│   │       └── api.py
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py
│       ├── test_model/
│       │   ├── __init__.py
│       │   ├── test_api.py
│       │   └── test_service.py
│       └── test_knowledge/
│           ├── __init__.py
│           ├── test_api.py
│           └── test_service.py
├── requirements.txt
├── .env.example
└── README.md
```

---

### Task 1: 项目脚手架

**Files:**
- Create: `knowdo-backend/requirements.txt`
- Create: `knowdo-backend/.env.example`
- Create: `knowdo-backend/README.md`
- Create: `knowdo-backend/app/__init__.py`
- Create: `knowdo-backend/app/core/__init__.py`
- Create: `knowdo-backend/app/modules/__init__.py`
- Create: `knowdo-backend/app/modules/model/__init__.py`
- Create: `knowdo-backend/app/modules/knowledge/__init__.py`
- Create: `knowdo-backend/app/tests/__init__.py`
- Create: `knowdo-backend/app/tests/test_model/__init__.py`
- Create: `knowdo-backend/app/tests/test_knowledge/__init__.py`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p knowdo-backend/app/core
mkdir -p knowdo-backend/app/modules/model
mkdir -p knowdo-backend/app/modules/knowledge
mkdir -p knowdo-backend/app/tests/test_model
mkdir -p knowdo-backend/app/tests/test_knowledge
touch knowdo-backend/app/__init__.py
touch knowdo-backend/app/core/__init__.py
touch knowdo-backend/app/modules/__init__.py
touch knowdo-backend/app/modules/model/__init__.py
touch knowdo-backend/app/modules/knowledge/__init__.py
touch knowdo-backend/app/tests/__init__.py
touch knowdo-backend/app/tests/test_model/__init__.py
touch knowdo-backend/app/tests/test_knowledge/__init__.py
```

- [ ] **Step 2: 创建 requirements.txt**

`knowdo-backend/requirements.txt`:
```
fastapi>=0.115.0
uvicorn[standard]>=0.32.0
sqlmodel>=0.0.22
chromadb>=0.5.0
agno>=2.6.0
PyPDF2>=3.0.0
python-docx>=1.1.0
beautifulsoup4>=4.12.0
markdown>=3.7
python-multipart>=0.0.12
pytest>=8.3.0
httpx>=0.28.0
```

- [ ] **Step 3: 创建 .env.example**

`knowdo-backend/.env.example`:
```
DATABASE_URL=sqlite:///./knowdo.db
CHROMA_PATH=./chroma_data
```

- [ ] **Step 4: 创建 README.md**

`knowdo-backend/README.md`:
```markdown
# KnowDo Backend

企业级AI知识库平台后端服务。

## 启动

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```
```

- [ ] **Step 5: 安装依赖并验证**

```bash
cd knowdo-backend && pip install -r requirements.txt
```

验证:
```bash
python -c "import fastapi; import sqlmodel; import chromadb; import agno; print('OK')"
```
Expected: `OK`

- [ ] **Step 6: Commit**

```bash
cd knowdo-backend && git init && git add -A && git commit -m "chore: project scaffolding"
```

---

### Task 2: Core — 配置管理

**Files:**
- Create: `knowdo-backend/app/core/config.py`
- Create: `knowdo-backend/app/tests/conftest.py`

- [ ] **Step 1: 编写 config.py 测试**

Create `knowdo-backend/app/tests/conftest.py`:
```python
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
```

- [ ] **Step 2: 创建 config.py**

Create `knowdo-backend/app/core/config.py`:
```python
import os


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./knowdo.db")
CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_data")

# ChromaDB Embedding function name（内置轻量嵌入模型）
CHROMA_EMBEDDING_FN = "all-MiniLM-L6-v2"
```

- [ ] **Step 3: 验证**

```bash
cd knowdo-backend && DATABASE_URL=sqlite:///test.db CHROMA_PATH=/tmp/chroma python -c "
from app.core.config import DATABASE_URL, CHROMA_PATH
assert DATABASE_URL == 'sqlite:///test.db'
assert CHROMA_PATH == '/tmp/chroma'
print('OK')
"
```
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
cd knowdo-backend && git add -A && git commit -m "feat: core config with env-based settings"
```

---

### Task 3: Core — 数据库连接

**Files:**
- Create: `knowdo-backend/app/core/database.py`

- [ ] **Step 1: 创建 database.py**

Create `knowdo-backend/app/core/database.py`:
```python
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
```

- [ ] **Step 2: 验证**

```bash
cd knowdo-backend && python -c "
from app.core.database import engine, get_chroma_client
# SQLModel engine 创建成功
assert engine is not None
# ChromaDB 客户端创建成功
client = get_chroma_client()
assert client is not None
print('OK')
"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
cd knowdo-backend && git add -A && git commit -m "feat: core database with SQLModel and ChromaDB"
```

---

### Task 4: Core — 异常体系

**Files:**
- Create: `knowdo-backend/app/core/exceptions.py`

- [ ] **Step 1: 创建 exceptions.py**

Create `knowdo-backend/app/core/exceptions.py`:
```python
from typing import Any


class AppException(Exception):
    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message


class NotFoundException(AppException):
    def __init__(self, message: str = "资源不存在"):
        super().__init__(code=404, message=message)


class ValidationException(AppException):
    def __init__(self, message: str = "参数校验失败"):
        super().__init__(code=400, message=message)


class ServiceException(AppException):
    def __init__(self, message: str = "服务处理异常"):
        super().__init__(code=500, message=message)


def error_response(code: int, message: str) -> dict[str, Any]:
    return {"code": code, "data": None, "message": message}
```

- [ ] **Step 2: 验证**

```bash
cd knowdo-backend && python -c "
from app.core.exceptions import NotFoundException, ValidationException, ServiceException

e = NotFoundException('知识库不存在')
assert e.code == 404
assert e.message == '知识库不存在'

e = ValidationException()
assert e.code == 400

e = ServiceException()
assert e.code == 500
print('OK')
"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
cd knowdo-backend && git add -A && git commit -m "feat: core exception hierarchy"
```

---

### Task 5: FastAPI 入口

**Files:**
- Create: `knowdo-backend/app/main.py`

- [ ] **Step 1: 创建 main.py**

Create `knowdo-backend/app/main.py`:
```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.database import init_db
from app.core.exceptions import AppException, error_response

app = FastAPI(title="KnowDo API")


@app.on_event("startup")
def on_startup():
    init_db()


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(status_code=200, content=error_response(exc.code, exc.message))


@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 2: 启动验证**

```bash
cd knowdo-backend && timeout 3 uvicorn app.main:app --port 9999 2>&1 || true
# 应该看到 "Uvicorn running on http://..."
```

- [ ] **Step 3: 健康检查**

```bash
cd knowdo-backend && uvicorn app.main:app --port 9999 &
sleep 2
curl -s http://localhost:9999/health
kill %1 2>/dev/null
```
Expected: `{"status":"ok"}`

- [ ] **Step 4: Commit**

```bash
cd knowdo-backend && git add -A && git commit -m "feat: FastAPI entry point with global exception handler"
```

---

### Task 6: Model 模块 — 数据模型与 Schema

**Files:**
- Create: `knowdo-backend/app/modules/model/models.py`
- Create: `knowdo-backend/app/modules/model/schemas.py`

- [ ] **Step 1: 创建 models.py**

Create `knowdo-backend/app/modules/model/models.py`:
```python
from sqlmodel import SQLModel, Field
from typing import Optional


class ModelConfig(SQLModel, table=True):
    __tablename__ = "model_config"

    id: str = Field(primary_key=True)
    name: str
    provider: str
    type: str  # LLM / Embedding / Reranker
    api_url: str
    api_key: str
    model_name: str
    max_tokens: Optional[int] = None
    concurrency: Optional[int] = None
    timeout: Optional[int] = None
    retry: Optional[int] = None
    status: str = Field(default="offline")  # online / offline / testing
    last_test: Optional[str] = None
    test_success: Optional[bool] = None
    test_latency: Optional[str] = None
    created_at: str
    updated_at: str
```

- [ ] **Step 2: 创建 schemas.py**

Create `knowdo-backend/app/modules/model/schemas.py`:
```python
from typing import Optional
from pydantic import BaseModel


class ModelCreateRequest(BaseModel):
    name: str
    provider: str
    type: str  # LLM / Embedding / Reranker
    api_url: str
    api_key: str
    model_name: str
    max_tokens: Optional[int] = None
    concurrency: Optional[int] = None
    timeout: Optional[int] = None
    retry: Optional[int] = None


class ModelUpdateRequest(BaseModel):
    id: str
    name: Optional[str] = None
    provider: Optional[str] = None
    type: Optional[str] = None
    api_url: Optional[str] = None
    api_key: Optional[str] = None
    model_name: Optional[str] = None
    max_tokens: Optional[int] = None
    concurrency: Optional[int] = None
    timeout: Optional[int] = None
    retry: Optional[int] = None


class ModelDetailRequest(BaseModel):
    id: str


class ModelDeleteRequest(BaseModel):
    id: str


class ModelTestRequest(BaseModel):
    id: str


class ModelListRequest(BaseModel):
    provider: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None


class ModelConfigResponse(BaseModel):
    id: str
    name: str
    provider: str
    type: str
    api_url: str
    api_key: str
    model_name: str
    max_tokens: Optional[int] = None
    concurrency: Optional[int] = None
    timeout: Optional[int] = None
    retry: Optional[int] = None
    status: str
    last_test: Optional[str] = None
    test_success: Optional[bool] = None
    test_latency: Optional[str] = None
    created_at: str
    updated_at: str


class ModelTestResponse(BaseModel):
    success: bool
    latency: Optional[str] = None
    error: Optional[str] = None
```

- [ ] **Step 3: 验证 models 建表**

```bash
cd knowdo-backend && python -c "
from app.core.database import engine, init_db
from app.modules.model.models import ModelConfig
init_db()
# 验证表已创建
import sqlite3
conn = sqlite3.connect('knowdo.db')
tables = conn.execute(\"SELECT name FROM sqlite_master WHERE type='table'\").fetchall()
print([t[0] for t in tables])
conn.close()
"
```
Expected: `['model_config']`

- [ ] **Step 4: Commit**

```bash
cd knowdo-backend && git add -A && git commit -m "feat: model module - SQLModel and Pydantic schemas"
```

---

### Task 7: Model 模块 — Repository

**Files:**
- Create: `knowdo-backend/app/modules/model/repository.py`

- [ ] **Step 1: 创建 repository.py**

Create `knowdo-backend/app/modules/model/repository.py`:
```python
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
```

- [ ] **Step 2: 验证**

```bash
cd knowdo-backend && python -c "
from app.core.database import engine, init_db, get_session
from app.modules.model.repository import ModelRepository
from app.modules.model.models import ModelConfig
import uuid
from datetime import datetime

init_db()

session = next(get_session())
repo = ModelRepository(session)

# create
m = ModelConfig(
    id=str(uuid.uuid4()),
    name='test-model',
    provider='openai',
    type='LLM',
    api_url='https://api.openai.com/v1',
    api_key='sk-xxx',
    model_name='gpt-4',
    status='offline',
    created_at=datetime.now().isoformat(),
    updated_at=datetime.now().isoformat(),
)
created = repo.create(m)
assert created.id == m.id
print(f'Created: {created.id}')

# get
found = repo.get_by_id(m.id)
assert found.name == 'test-model'
print('Get: OK')

# list
items = repo.list()
assert len(items) == 1
print('List: OK')

# update
updated = repo.update(m.id, name='updated-model')
assert updated.name == 'updated-model'
print('Update: OK')

# delete
repo.delete(m.id)
try:
    repo.get_by_id(m.id)
    assert False, 'should raise'
except Exception as e:
    print(f'Delete: OK - {e.message}')

print('All OK')
"
```
Expected: All OK

- [ ] **Step 3: Commit**

```bash
cd knowdo-backend && git add -A && git commit -m "feat: model repository with CRUD operations"
```

---

### Task 8: Model 模块 — Service 与 API

**Files:**
- Create: `knowdo-backend/app/modules/model/service.py`
- Create: `knowdo-backend/app/modules/model/api.py`

- [ ] **Step 1: 创建 service.py**

Create `knowdo-backend/app/modules/model/service.py`:
```python
import uuid
from datetime import datetime
from typing import Optional, Any
from sqlmodel import Session
from app.core.exceptions import ValidationException, ServiceException
from app.modules.model.models import ModelConfig
from app.modules.model.repository import ModelRepository


class ModelService:
    def __init__(self, session: Session):
        self.repo = ModelRepository(session)
        self.session = session

    def list_models(self, params: dict[str, Any]) -> dict[str, Any]:
        page = params.get("page", 1)
        size = params.get("size", 20)
        offset = (page - 1) * size
        provider = params.get("provider")
        type_ = params.get("type")
        status = params.get("status")
        items = self.repo.list(provider=provider, type_=type_, status=status,
                               offset=offset, limit=size)
        total = self.repo.count(provider=provider, type_=type_, status=status)
        return {
            "items": [_model_to_dict(m) for m in items],
            "total": total,
            "page": page,
            "size": size,
        }

    def create_model(self, data: dict[str, Any]) -> dict[str, Any]:
        now = datetime.now().isoformat()
        model = ModelConfig(
            id=str(uuid.uuid4()),
            name=data["name"],
            provider=data["provider"],
            type=data["type"],
            api_url=data["api_url"],
            api_key=data["api_key"],
            model_name=data["model_name"],
            max_tokens=data.get("max_tokens"),
            concurrency=data.get("concurrency"),
            timeout=data.get("timeout"),
            retry=data.get("retry"),
            status="offline",
            created_at=now,
            updated_at=now,
        )
        created = self.repo.create(model)
        return _model_to_dict(created)

    def get_model(self, id: str) -> dict[str, Any]:
        return _model_to_dict(self.repo.get_by_id(id))

    def update_model(self, data: dict[str, Any]) -> dict[str, Any]:
        id = data.pop("id")
        data["updated_at"] = datetime.now().isoformat()
        updated = self.repo.update(id, **data)
        return _model_to_dict(updated)

    def delete_model(self, id: str) -> None:
        self.repo.delete(id)

    def test_model(self, id: str) -> dict[str, Any]:
        model = self.repo.get_by_id(id)
        now = datetime.now().isoformat()
        try:
            from agno.models.openai import OpenAIChat

            agno_model = OpenAIChat(
                id=model.model_name,
                api_key=model.api_key,
                base_url=model.api_url,
            )
            start = datetime.now()
            agno_model.response("ping")
            elapsed = (datetime.now() - start).total_seconds()
            latency = f"{elapsed:.2f}s"

            self.repo.update(id, status="online", last_test=now,
                             test_success=True, test_latency=latency,
                             updated_at=now)
            return {"success": True, "latency": latency, "error": None}
        except Exception as e:
            error_msg = str(e)
            self.repo.update(id, status="offline", last_test=now,
                             test_success=False, test_latency=None,
                             updated_at=now)
            return {"success": False, "latency": None, "error": error_msg}


def _model_to_dict(m: ModelConfig) -> dict[str, Any]:
    return {
        "id": m.id,
        "name": m.name,
        "provider": m.provider,
        "type": m.type,
        "api_url": m.api_url,
        "api_key": m.api_key,
        "model_name": m.model_name,
        "max_tokens": m.max_tokens,
        "concurrency": m.concurrency,
        "timeout": m.timeout,
        "retry": m.retry,
        "status": m.status,
        "last_test": m.last_test,
        "test_success": m.test_success,
        "test_latency": m.test_latency,
        "created_at": m.created_at,
        "updated_at": m.updated_at,
    }
```

- [ ] **Step 2: 创建 api.py**

Create `knowdo-backend/app/modules/model/api.py`:
```python
from fastapi import APIRouter, Depends, Request
from sqlmodel import Session
from app.core.database import get_session
from app.modules.model.schemas import (
    ModelCreateRequest, ModelUpdateRequest, ModelDetailRequest,
    ModelDeleteRequest, ModelTestRequest, ModelListRequest,
)
from app.modules.model.service import ModelService

router = APIRouter()


def get_service(session: Session = Depends(get_session)) -> ModelService:
    return ModelService(session)


@router.post("/api/model")
async def model_handler(request: Request, service: ModelService = Depends(get_service)):
    body = await request.json()
    action = body.get("action")

    if action == "list":
        req = ModelListRequest(**body)
        return {"code": 0, "data": service.list_models(req.model_dump(exclude_none=True)), "message": "ok"}

    elif action == "create":
        req = ModelCreateRequest(**body)
        return {"code": 0, "data": service.create_model(req.model_dump()), "message": "ok"}

    elif action == "detail":
        req = ModelDetailRequest(**body)
        return {"code": 0, "data": service.get_model(req.id), "message": "ok"}

    elif action == "update":
        req = ModelUpdateRequest(**body)
        return {"code": 0, "data": service.update_model(req.model_dump(exclude_none=True)), "message": "ok"}

    elif action == "delete":
        req = ModelDeleteRequest(**body)
        service.delete_model(req.id)
        return {"code": 0, "data": None, "message": "ok"}

    elif action == "test":
        req = ModelTestRequest(**body)
        return {"code": 0, "data": service.test_model(req.id), "message": "ok"}

    return {"code": 400, "data": None, "message": f"Unknown action: {action}"}
```

- [ ] **Step 3: 注册路由到 main.py**

在 `knowdo-backend/app/main.py` 中，`from app.core.exceptions import AppException, error_response` 之后添加：

```python
from app.modules.model.api import router as model_router
app.include_router(model_router)
```

- [ ] **Step 4: 验证 API**

```bash
cd knowdo-backend && uvicorn app.main:app --port 9999 &
sleep 2

# create
curl -s -X POST http://localhost:9999/api/model \
  -H "Content-Type: application/json" \
  -d '{"action":"create","name":"GPT-4","provider":"openai","type":"LLM","api_url":"https://api.openai.com/v1","api_key":"sk-xxx","model_name":"gpt-4"}'
echo ""

# list
curl -s -X POST http://localhost:9999/api/model \
  -H "Content-Type: application/json" \
  -d '{"action":"list"}'
echo ""

kill %1 2>/dev/null
```
Expected: create 返回模型对象，list 返回含 1 项的列表。

- [ ] **Step 5: Commit**

```bash
cd knowdo-backend && git add -A && git commit -m "feat: model service and API with Agno connection test"
```

---

### Task 9: Model 模块 — 测试

**Files:**
- Create: `knowdo-backend/app/tests/test_model/test_service.py`
- Create: `knowdo-backend/app/tests/test_model/test_api.py`

- [ ] **Step 1: 创建 service 测试**

Create `knowdo-backend/app/tests/test_model/test_service.py`:
```python
import uuid
from datetime import datetime
from sqlmodel import Session, SQLModel, create_engine
from app.modules.model.models import ModelConfig
from app.modules.model.repository import ModelRepository
from app.modules.model.service import ModelService
from app.core.exceptions import NotFoundException


@pytest.fixture
def session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        yield s


@pytest.fixture
def service(session):
    return ModelService(session)


def test_create_model(service):
    result = service.create_model({
        "name": "GPT-4",
        "provider": "openai",
        "type": "LLM",
        "api_url": "https://api.openai.com/v1",
        "api_key": "sk-xxx",
        "model_name": "gpt-4",
    })
    assert result["name"] == "GPT-4"
    assert result["status"] == "offline"
    assert result["id"] is not None


def test_list_models(service):
    service.create_model({
        "name": "A", "provider": "openai", "type": "LLM",
        "api_url": "https://x.com", "api_key": "k", "model_name": "m",
    })
    service.create_model({
        "name": "B", "provider": "anthropic", "type": "LLM",
        "api_url": "https://x.com", "api_key": "k", "model_name": "m",
    })
    result = service.list_models({"page": 1, "size": 10})
    assert result["total"] == 2
    assert len(result["items"]) == 2


def test_list_models_filter_by_provider(service):
    service.create_model({
        "name": "A", "provider": "openai", "type": "LLM",
        "api_url": "https://x.com", "api_key": "k", "model_name": "m",
    })
    service.create_model({
        "name": "B", "provider": "anthropic", "type": "LLM",
        "api_url": "https://x.com", "api_key": "k", "model_name": "m",
    })
    result = service.list_models({"provider": "openai"})
    assert result["total"] == 1
    assert result["items"][0]["name"] == "A"


def test_get_model(service):
    created = service.create_model({
        "name": "GPT-4", "provider": "openai", "type": "LLM",
        "api_url": "https://x.com", "api_key": "k", "model_name": "m",
    })
    result = service.get_model(created["id"])
    assert result["name"] == "GPT-4"


def test_get_model_not_found(service):
    with pytest.raises(NotFoundException):
        service.get_model("nonexistent")


def test_update_model(service):
    created = service.create_model({
        "name": "GPT-4", "provider": "openai", "type": "LLM",
        "api_url": "https://x.com", "api_key": "k", "model_name": "m",
    })
    result = service.update_model({"id": created["id"], "name": "GPT-4o"})
    assert result["name"] == "GPT-4o"


def test_delete_model(service):
    created = service.create_model({
        "name": "GPT-4", "provider": "openai", "type": "LLM",
        "api_url": "https://x.com", "api_key": "k", "model_name": "m",
    })
    service.delete_model(created["id"])
    with pytest.raises(NotFoundException):
        service.get_model(created["id"])
```

- [ ] **Step 2: 创建 API 测试**

Create `knowdo-backend/app/tests/test_model/test_api.py`:
```python
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture
async def client():
    from app.core.database import engine, init_db
    init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_create_model(client):
    resp = await client.post("/api/model", json={
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


@pytest.mark.asyncio
async def test_list_models(client):
    await client.post("/api/model", json={
        "action": "create", "name": "A", "provider": "x", "type": "LLM",
        "api_url": "https://x.com", "api_key": "k", "model_name": "m",
    })
    resp = await client.post("/api/model", json={"action": "list"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["code"] == 0
    assert data["data"]["total"] >= 1


@pytest.mark.asyncio
async def test_get_model_not_found(client):
    resp = await client.post("/api/model", json={"action": "detail", "id": "nonexistent"})
    data = resp.json()
    assert data["code"] == 404


@pytest.mark.asyncio
async def test_delete_model(client):
    create_resp = await client.post("/api/model", json={
        "action": "create", "name": "D", "provider": "x", "type": "LLM",
        "api_url": "https://x.com", "api_key": "k", "model_name": "m",
    })
    model_id = create_resp.json()["data"]["id"]
    resp = await client.post("/api/model", json={"action": "delete", "id": model_id})
    assert resp.json()["code"] == 0
    # verify deleted
    resp2 = await client.post("/api/model", json={"action": "detail", "id": model_id})
    assert resp2.json()["code"] == 404
```

- [ ] **Step 3: 运行测试**

```bash
cd knowdo-backend && python -m pytest app/tests/test_model/ -v
```
Expected: 所有测试 PASS

- [ ] **Step 4: Commit**

```bash
cd knowdo-backend && git add -A && git commit -m "test: model module service and API tests"
```

---

### Task 10: Knowledge 模块 — 数据模型与 Schema

**Files:**
- Create: `knowdo-backend/app/modules/knowledge/models.py`
- Create: `knowdo-backend/app/modules/knowledge/schemas.py`

- [ ] **Step 1: 创建 models.py**

Create `knowdo-backend/app/modules/knowledge/models.py`:
```python
from sqlmodel import SQLModel, Field
from typing import Optional


class KnowledgeBase(SQLModel, table=True):
    __tablename__ = "knowledge_base"

    id: str = Field(primary_key=True)
    name: str
    description: Optional[str] = None
    type: str  # general / web / feishu
    status: str = Field(default="pending")  # pending / processing / completed / failed
    icon: Optional[str] = None
    folder_id: Optional[str] = None
    vector_model: Optional[str] = None
    embedding_model: Optional[str] = None  # -> model_config.id
    chunk_mode: str = Field(default="smart")  # smart / advanced / qa
    chunk_size: int = Field(default=1024)
    chunk_overlap: int = Field(default=256)
    search_mode: str = Field(default="vector")  # vector / keyword / hybrid
    top_k: int = Field(default=5)
    score_threshold: float = Field(default=0.5)
    enable_rerank: bool = Field(default=False)
    rerank_model: Optional[str] = None
    created_at: str
    updated_at: str


class KnowledgeDocument(SQLModel, table=True):
    __tablename__ = "knowledge_document"

    id: str = Field(primary_key=True)
    knowledge_id: str = Field(foreign_key="knowledge_base.id")
    name: str
    type: str  # md / txt / pdf / docx / html / xls / xlsx / csv
    size: Optional[str] = None
    status: str = Field(default="pending")  # pending / processing / completed / failed
    content: Optional[str] = None
    error: Optional[str] = None
    created_at: str
```

- [ ] **Step 2: 创建 schemas.py**

Create `knowdo-backend/app/modules/knowledge/schemas.py`:
```python
from typing import Optional
from pydantic import BaseModel


class KnowledgeCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    type: str = "general"
    folder_id: Optional[str] = None
    icon: Optional[str] = None


class KnowledgeUpdateRequest(BaseModel):
    id: str
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    icon: Optional[str] = None
    folder_id: Optional[str] = None
    embedding_model: Optional[str] = None
    chunk_mode: Optional[str] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None
    search_mode: Optional[str] = None
    top_k: Optional[int] = None
    score_threshold: Optional[float] = None


class KnowledgeDetailRequest(BaseModel):
    id: str


class KnowledgeDeleteRequest(BaseModel):
    id: str


class KnowledgeListRequest(BaseModel):
    folder_id: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None


class DocListRequest(BaseModel):
    knowledge_id: str


class DocDetailRequest(BaseModel):
    knowledge_id: str
    doc_id: str


class DocDeleteRequest(BaseModel):
    knowledge_id: str
    doc_id: str


class DocChunksRequest(BaseModel):
    knowledge_id: str
    doc_id: str


class DocRechunkRequest(BaseModel):
    knowledge_id: str
    doc_id: str
    chunk_mode: Optional[str] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None


class RecallTestRequest(BaseModel):
    knowledge_id: str
    query: str
    top_k: int = 5
    search_mode: str = "vector"  # vector / keyword / hybrid
```

- [ ] **Step 3: 验证 models 建表**

```bash
cd knowdo-backend && python -c "
from app.core.database import engine, init_db
from app.modules.knowledge.models import KnowledgeBase, KnowledgeDocument
init_db()
import sqlite3
conn = sqlite3.connect('knowdo.db')
tables = conn.execute(\"SELECT name FROM sqlite_master WHERE type='table'\").fetchall()
print([t[0] for t in tables])
conn.close()
"
```
Expected: `['model_config', 'knowledge_base', 'knowledge_document']`

- [ ] **Step 4: Commit**

```bash
cd knowdo-backend && git add -A && git commit -m "feat: knowledge module - SQLModel and Pydantic schemas"
```

---

### Task 11: Knowledge 模块 — Repository

**Files:**
- Create: `knowdo-backend/app/modules/knowledge/repository.py`

- [ ] **Step 1: 创建 repository.py**

Create `knowdo-backend/app/modules/knowledge/repository.py`:
```python
from typing import Optional
from sqlmodel import Session, select
from app.core.exceptions import NotFoundException
from app.modules.knowledge.models import KnowledgeBase, KnowledgeDocument


class KnowledgeRepository:
    def __init__(self, session: Session):
        self.session = session

    def list(self, folder_id: Optional[str] = None, type_: Optional[str] = None,
             status: Optional[str] = None, offset: int = 0, limit: int = 20) -> list[KnowledgeBase]:
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

    def list_documents(self, knowledge_id: str) -> list[KnowledgeDocument]:
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
```

- [ ] **Step 2: 验证 Repository 基本操作**

```bash
cd knowdo-backend && python -c "
from app.core.database import engine, init_db, get_session
from app.modules.knowledge.repository import KnowledgeRepository
from app.modules.knowledge.models import KnowledgeBase
import uuid
from datetime import datetime

init_db()
session = next(get_session())
repo = KnowledgeRepository(session)

kb = KnowledgeBase(
    id=str(uuid.uuid4()),
    name='test-kb',
    type='general',
    status='pending',
    created_at=datetime.now().isoformat(),
    updated_at=datetime.now().isoformat(),
)
created = repo.create(kb)
assert created.name == 'test-kb'

found = repo.get_by_id(kb.id)
assert found.id == kb.id

repo.delete(kb.id)
try:
    repo.get_by_id(kb.id)
    assert False
except Exception as e:
    print(f'Delete OK: {e.message}')

print('All OK')
"
```
Expected: All OK

- [ ] **Step 3: Commit**

```bash
cd knowdo-backend && git add -A && git commit -m "feat: knowledge repository with CRUD and document operations"
```

---

### Task 12: Knowledge 模块 — 分段工具

**Files:**
- Create: `knowdo-backend/app/modules/knowledge/chunker.py`

- [ ] **Step 1: 创建 chunker.py**

Create `knowdo-backend/app/modules/knowledge/chunker.py`:
```python
from typing import Optional


def chunk_text(
    text: str,
    chunk_size: int = 1024,
    chunk_overlap: int = 256,
    separators: Optional[list[str]] = None,
) -> list[dict]:
    """将文本按字符数和分隔符切分为分段列表。

    返回: [{"index": 0, "content": "...", "length": 1024}, ...]
    """
    if separators is None:
        separators = ["\n\n", "\n", "。", ".", " "]

    chunks = []
    current_pos = 0
    idx = 0

    while current_pos < len(text):
        end_pos = min(current_pos + chunk_size, len(text))

        if end_pos < len(text):
            # 尝试在分隔符处断开
            best_end = end_pos
            for sep in separators:
                search_start = max(current_pos + chunk_size // 2, current_pos)
                pos = text.rfind(sep, search_start, end_pos)
                if pos > search_start:
                    best_end = pos + len(sep)
                    break
            end_pos = best_end

        chunk_content = text[current_pos:end_pos]
        chunks.append({
            "index": idx,
            "content": chunk_content.strip(),
            "length": len(chunk_content),
        })

        idx += 1
        next_pos = end_pos - chunk_overlap
        if next_pos <= current_pos:
            next_pos = end_pos
        current_pos = next_pos

    return chunks
```

- [ ] **Step 2: 验证分段逻辑**

```bash
cd knowdo-backend && python -c "
from app.modules.knowledge.chunker import chunk_text

text = 'Hello World. ' * 500  # ~6000 chars
chunks = chunk_text(text, chunk_size=1024, chunk_overlap=256)
assert len(chunks) > 1
assert all(c['index'] == i for i, c in enumerate(chunks))
assert all(c['length'] <= 1100 for c in chunks)  # tolerance for separator

# 短文本
short = 'hello'
chunks = chunk_text(short)
assert len(chunks) == 1
assert chunks[0]['content'] == 'hello'

print('All OK')
"
```
Expected: All OK

- [ ] **Step 3: Commit**

```bash
cd knowdo-backend && git add -A && git commit -m "feat: knowledge chunker utility"
```

---

### Task 13: Knowledge 模块 — 文档解析器

**Files:**
- Create: `knowdo-backend/app/modules/knowledge/parser.py`

- [ ] **Step 1: 创建 parser.py**

Create `knowdo-backend/app/modules/knowledge/parser.py`:
```python
import io
from app.core.exceptions import ServiceException


def parse_document(filename: str, content: bytes) -> str:
    """根据文件扩展名选择解析器提取文本。"""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext in ("md", "txt"):
        return content.decode("utf-8", errors="replace")

    elif ext == "pdf":
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(io.BytesIO(content))
            return "\n".join(
                page.extract_text() or "" for page in reader.pages
            )
        except ImportError:
            raise ServiceException("PDF 解析依赖未安装: pip install PyPDF2")

    elif ext == "docx":
        try:
            from docx import Document
            doc = Document(io.BytesIO(content))
            return "\n".join(p.text for p in doc.paragraphs)
        except ImportError:
            raise ServiceException("DOCX 解析依赖未安装: pip install python-docx")

    elif ext in ("html", "htm"):
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(content, "html.parser")
            return soup.get_text(separator="\n")
        except ImportError:
            raise ServiceException("HTML 解析依赖未安装: pip install beautifulsoup4")

    elif ext == "csv":
        return content.decode("utf-8", errors="replace")

    else:
        raise ServiceException(f"不支持的文件格式: .{ext}")
```

- [ ] **Step 2: 验证解析**

```bash
cd knowdo-backend && python -c "
from app.modules.knowledge.parser import parse_document

# txt
text = parse_document('test.txt', b'hello world')
assert text == 'hello world'

# md
text = parse_document('readme.md', '# Title\ncontent'.encode())
assert 'Title' in text

# csv
text = parse_document('data.csv', b'col1,col2\nv1,v2')
assert 'col1' in text

print('All OK')
"
```
Expected: All OK

- [ ] **Step 3: Commit**

```bash
cd knowdo-backend && git add -A && git commit -m "feat: knowledge document parser (txt/md/pdf/docx/html/csv)"
```

---

### Task 14: Knowledge 模块 — Service（知识库 CRUD）

**Files:**
- Create: `knowdo-backend/app/modules/knowledge/service.py`

- [ ] **Step 1: 创建 service.py（知识库 CRUD 部分）**

Create `knowdo-backend/app/modules/knowledge/service.py`:
```python
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
        # 删除 ChromaDB collection
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

        # 解析文件类型
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        size = str(len(content))

        # 创建文档记录
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
            # 解析文本
            text = parse_document(filename, content)
            doc = self.repo.update_document(doc.id, content=text)

            # 分段
            chunks = chunk_text(
                text,
                chunk_size=kb.chunk_size,
                chunk_overlap=kb.chunk_overlap,
            )

            # 向量化 + 写入 ChromaDB
            self._index_chunks(knowledge_id, doc.id, chunks, kb)

            # 更新状态
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

        # 从 ChromaDB 删除对应分段
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

        # 删除旧分段
        self._delete_chunks(knowledge_id, doc_id)

        # 重新分段
        chunks = chunk_text(doc.content, chunk_size=size, chunk_overlap=overlap)
        # 重新向量化
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
                    embeddings.append([0.0] * 384)  # fallback
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
        """获取 Agno Embedder 实例。"""
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
```

- [ ] **Step 2: 验证知识库 CRUD**

```bash
cd knowdo-backend && python -c "
from app.core.database import engine, init_db, get_session
from app.modules.knowledge.service import KnowledgeService
import uuid

init_db()
session = next(get_session())
svc = KnowledgeService(session)

# create
kb = svc.create_knowledge({'name': '测试知识库', 'type': 'general'})
assert kb['name'] == '测试知识库'
print(f'Created: {kb[\"id\"]}')

# get
detail = svc.get_knowledge(kb['id'])
assert detail['document_count'] == 0
print('Get: OK')

# list
result = svc.list_knowledge({})
assert result['total'] == 1
print('List: OK')

# update
updated = svc.update_knowledge({'id': kb['id'], 'name': '更新后的知识库'})
assert updated['name'] == '更新后的知识库'
print('Update: OK')

# delete
svc.delete_knowledge(kb['id'])
result = svc.list_knowledge({})
assert result['total'] == 0
print('Delete: OK')

print('All OK')
"
```
Expected: All OK

- [ ] **Step 3: Commit**

```bash
cd knowdo-backend && git add -A && git commit -m "feat: knowledge service with CRUD, upload, chunk, recall"
```

---

### Task 15: Knowledge 模块 — API

**Files:**
- Create: `knowdo-backend/app/modules/knowledge/api.py`

- [ ] **Step 1: 创建 api.py**

Create `knowdo-backend/app/modules/knowledge/api.py`:
```python
from fastapi import APIRouter, Depends, Request, UploadFile, File, Form
from sqlmodel import Session
from app.core.database import get_session
from app.modules.knowledge.schemas import (
    KnowledgeCreateRequest, KnowledgeUpdateRequest, KnowledgeDetailRequest,
    KnowledgeDeleteRequest, KnowledgeListRequest,
    DocListRequest, DocDetailRequest, DocDeleteRequest,
    DocChunksRequest, DocRechunkRequest, RecallTestRequest,
)
from app.modules.knowledge.service import KnowledgeService

router = APIRouter()


def get_service(session: Session = Depends(get_session)) -> KnowledgeService:
    return KnowledgeService(session)


@router.post("/api/knowledge")
async def knowledge_handler(request: Request, service: KnowledgeService = Depends(get_service)):
    body = await request.json()
    action = body.get("action")

    if action == "list":
        req = KnowledgeListRequest(**body)
        return {"code": 0, "data": service.list_knowledge(req.model_dump(exclude_none=True)), "message": "ok"}

    elif action == "create":
        req = KnowledgeCreateRequest(**body)
        return {"code": 0, "data": service.create_knowledge(req.model_dump()), "message": "ok"}

    elif action == "detail":
        req = KnowledgeDetailRequest(**body)
        return {"code": 0, "data": service.get_knowledge(req.id), "message": "ok"}

    elif action == "update":
        req = KnowledgeUpdateRequest(**body)
        return {"code": 0, "data": service.update_knowledge(req.model_dump(exclude_none=True)), "message": "ok"}

    elif action == "delete":
        req = KnowledgeDeleteRequest(**body)
        service.delete_knowledge(req.id)
        return {"code": 0, "data": None, "message": "ok"}

    elif action == "doc_list":
        req = DocListRequest(**body)
        return {"code": 0, "data": service.list_documents(req.knowledge_id), "message": "ok"}

    elif action == "doc_detail":
        req = DocDetailRequest(**body)
        return {"code": 0, "data": service.get_document(req.knowledge_id, req.doc_id), "message": "ok"}

    elif action == "doc_delete":
        req = DocDeleteRequest(**body)
        service.delete_document(req.knowledge_id, req.doc_id)
        return {"code": 0, "data": None, "message": "ok"}

    elif action == "doc_chunks":
        req = DocChunksRequest(**body)
        return {"code": 0, "data": service.get_chunks(req.knowledge_id, req.doc_id), "message": "ok"}

    elif action == "doc_rechunk":
        req = DocRechunkRequest(**body)
        return {"code": 0, "data": service.rechunk_document(
            req.knowledge_id, req.doc_id,
            chunk_mode=req.chunk_mode,
            chunk_size=req.chunk_size,
            chunk_overlap=req.chunk_overlap,
        ), "message": "ok"}

    elif action == "recall_test":
        req = RecallTestRequest(**body)
        return {"code": 0, "data": service.recall_test(
            req.knowledge_id, req.query, req.top_k, req.search_mode,
        ), "message": "ok"}

    elif action == "doc_upload":
        return {"code": 400, "data": None, "message": "doc_upload must use multipart form"}

    return {"code": 400, "data": None, "message": f"Unknown action: {action}"}


@router.post("/api/knowledge/upload")
async def knowledge_upload(
    knowledge_id: str = Form(...),
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    service = KnowledgeService(session)
    content = await file.read()
    result = service.upload_document(knowledge_id, file.filename or "unknown", content)
    return {"code": 0, "data": result, "message": "ok"}
```

- [ ] **Step 2: 注册路由到 main.py**

在 `knowdo-backend/app/main.py` 中，在 model router 之后添加：

```python
from app.modules.knowledge.api import router as knowledge_router
app.include_router(knowledge_router)
```

- [ ] **Step 3: 验证 API**

```bash
cd knowdo-backend && uvicorn app.main:app --port 9999 &
sleep 2

# 创建知识库
KB_ID=$(curl -s -X POST http://localhost:9999/api/knowledge \
  -H "Content-Type: application/json" \
  -d '{"action":"create","name":"测试知识库","type":"general"}' | python -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
echo "KB_ID=$KB_ID"

# 上传文档
curl -s -X POST http://localhost:9999/api/knowledge/upload \
  -F "knowledge_id=$KB_ID" \
  -F "file=@/etc/hosts"
echo ""

# 文档列表
curl -s -X POST http://localhost:9999/api/knowledge \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"doc_list\",\"knowledge_id\":\"$KB_ID\"}"
echo ""

# 召回测试
curl -s -X POST http://localhost:9999/api/knowledge \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"recall_test\",\"knowledge_id\":\"$KB_ID\",\"query\":\"localhost\",\"top_k\":3,\"search_mode\":\"keyword\"}"
echo ""

kill %1 2>/dev/null
```
Expected: doc_list 返回上传的文档，recall_test 返回匹配结果。

- [ ] **Step 4: Commit**

```bash
cd knowdo-backend && git add -A && git commit -m "feat: knowledge API with upload and recall endpoints"
```

---

### Task 16: Knowledge 模块 — 测试

**Files:**
- Create: `knowdo-backend/app/tests/test_knowledge/test_service.py`
- Create: `knowdo-backend/app/tests/test_knowledge/test_api.py`

- [ ] **Step 1: 创建 service 测试**

Create `knowdo-backend/app/tests/test_knowledge/test_service.py`:
```python
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


def test_get_knowledge_not_found(service):
    with pytest.raises(NotFoundException):
        service.get_knowledge("nonexistent")


def test_update_knowledge(service):
    kb = service.create_knowledge({"name": "KB"})
    result = service.update_knowledge({"id": kb["id"], "name": "Updated"})
    assert result["name"] == "Updated"


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

    # 验证文档列表
    docs = service.list_documents(kb["id"])
    assert len(docs) == 1


def test_recall_test_keyword(service):
    kb = service.create_knowledge({"name": "KB"})
    service.upload_document(kb["id"], "test.txt", b"hello world foo bar")

    results = service.recall_test(kb["id"], "hello", top_k=5, search_mode="keyword")
    assert len(results) >= 1
    assert any("hello" in r["content"] for r in results)
```

- [ ] **Step 2: 创建 API 测试**

Create `knowdo-backend/app/tests/test_knowledge/test_api.py`:
```python
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture
async def client():
    from app.core.database import engine, init_db
    init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_create_knowledge(client):
    resp = await client.post("/api/knowledge", json={
        "action": "create", "name": "Test KB", "type": "general",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["code"] == 0
    assert data["data"]["name"] == "Test KB"


@pytest.mark.asyncio
async def test_list_knowledge(client):
    resp = await client.post("/api/knowledge", json={"action": "list"})
    assert resp.status_code == 200
    assert resp.json()["code"] == 0


@pytest.mark.asyncio
async def test_get_knowledge_not_found(client):
    resp = await client.post("/api/knowledge", json={
        "action": "detail", "id": "nonexistent",
    })
    assert resp.json()["code"] == 404


@pytest.mark.asyncio
async def test_delete_knowledge(client):
    create_resp = await client.post("/api/knowledge", json={
        "action": "create", "name": "ToDelete",
    })
    kb_id = create_resp.json()["data"]["id"]
    resp = await client.post("/api/knowledge", json={
        "action": "delete", "id": kb_id,
    })
    assert resp.json()["code"] == 0


@pytest.mark.asyncio
async def test_recall_test_empty(client):
    kb_resp = await client.post("/api/knowledge", json={
        "action": "create", "name": "Recall KB",
    })
    kb_id = kb_resp.json()["data"]["id"]
    resp = await client.post("/api/knowledge", json={
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
```

- [ ] **Step 3: 运行所有测试**

```bash
cd knowdo-backend && python -m pytest app/tests/ -v
```
Expected: 所有测试 PASS（~15-20 个测试）

- [ ] **Step 4: Commit**

```bash
cd knowdo-backend && git add -A && git commit -m "test: knowledge module service and API tests"
```

---

### 验证总结

```bash
cd knowdo-backend
python -m pytest app/tests/ -v          # 所有测试通过
uvicorn app.main:app --reload           # 服务正常启动

# API 验证
curl -s http://localhost:8000/health    # {"status":"ok"}
```

---

### 依赖关系

```
Task 1 (scaffold) → Task 2 (config) → Task 3 (database) → Task 4 (exceptions)
                                                                    ↓
Task 5 (main.py) ← Task 4

Task 6 (model models+schemas) → Task 7 (model repo) → Task 8 (model service+api) → Task 9 (model tests)

Task 10 (knowledge models+schemas) → Task 11 (knowledge repo)
                                          ↓
Task 12 (chunker) + Task 13 (parser) → Task 14 (knowledge service) → Task 15 (knowledge api) → Task 16 (knowledge tests)
```
