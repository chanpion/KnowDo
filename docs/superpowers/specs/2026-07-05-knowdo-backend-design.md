# KnowDo 后端设计文档 — 模型管理与知识库模块

> 2026-07-05 | 基于 Agno 框架混动架构

## 范围

实现 PRD 中的模型管理（模块九核心功能）和知识库管理（Dataset 容器 + 文档管理）。前端已有对应页面（`ModelConfig/`、`Dataset/`、`DatasetCreate/`、`DatasetDetail/`），后端提供 API 替换当前前端 Mock 数据。

本期范围：
- **模型管理**: 配置 CRUD + 连接测试
- **知识库管理**: CRUD + 文档上传/解析/分段/向量化 + 召回测试 + 设置配置

**本期不包含**：向量化异步流水线、多模态向量、多模型接入、Reranker 重排序、模型切换降级。

---

## 技术栈

| 层 | 技术 | 说明 |
|:---|:---|:---|
| Web 框架 | FastAPI | 业务 API 路由 |
| AI SDK | Agno | Embedding 调用、模型连接测试 |
| 业务数据库 | SQLite | 模型配置、知识库、文档元信息 |
| 向量数据库 | ChromaDB | 分段文本 + 向量存储与检索 |
| ORM | SQLModel | 基于 SQLAlchemy + Pydantic，与 FastAPI 原生集成 |
| 文档解析 | PyPDF2 / python-docx / markdown | 按文件类型选择解析器 |
| 测试 | pytest + httpx | 单元 + 集成测试 |

---

## 项目结构

```
knowdo-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 入口
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py           # 配置管理（环境变量）
│   │   ├── database.py         # SQLite + ChromaDB 客户端
│   │   └── exceptions.py       # 全局异常定义
│   ├── modules/
│   │   ├── knowledge/
│   │   │   ├── __init__.py
│   │   │   ├── api.py          # 路由层
│   │   │   ├── models.py       # SQLModel 表定义
│   │   │   ├── schemas.py      # 请求/响应 Schema
│   │   │   ├── service.py      # 业务逻辑 + 分段/向量化
│   │   │   └── repository.py   # 数据访问
│   │   └── model/
│   │       ├── __init__.py
│   │       ├── api.py          # 路由层
│   │       ├── models.py       # SQLModel 表定义
│   │       ├── schemas.py      # 请求/响应 Schema
│   │       ├── service.py      # 业务逻辑 + Agno 调用
│   │       └── repository.py   # 数据访问
│   └── tests/
│       ├── test_knowledge/
│       │   ├── test_api.py
│       │   ├── test_service.py
│       │   └── test_repository.py
│       └── test_model/
│           ├── test_api.py
│           ├── test_service.py
│           └── test_repository.py
├── requirements.txt
├── .env.example
└── README.md
```

**分层关系**：
```
api.py  →  service.py  →  repository.py  →  SQLModel (core/database.py)
  ↑                          ↑
schemas.py              models.py
```

---

## API 设计

所有接口统一 `POST`，路径不带版本号和资源 ID，action 和参数放入请求体。

**统一响应格式**：
```json
{ "code": 0, "data": { ... }, "message": "ok" }
```

### 模型管理 `/api/model`

| action | body | 说明 |
|:---|:---|:---|
| `list` | `{provider?, type?, status?}` | 列表，分页参数走 query string `?page=&size=` |
| `create` | `{name, provider, type, api_url, api_key, model_name, max_tokens?, concurrency?, timeout?, retry?}` | 新增 |
| `detail` | `{id}` | 详情 |
| `update` | `{id, ...}` | 更新配置 |
| `delete` | `{id}` | 删除 |
| `test` | `{id}` | 连接测试 → Agno 实例化 + 测试请求 |

### 知识库 `/api/knowledge`

| action | body | 说明 |
|:---|:---|:---|
| `list` | `{folder_id?, type?, status?}` | 列表 |
| `create` | `{name, description?, type, folder_id?, icon?}` | 创建 |
| `detail` | `{id}` | 详情（含文档数/分段数/字符数统计） |
| `update` | `{id, name?, description?, chunk_mode?, chunk_size?, chunk_overlap?, search_mode?, top_k?, score_threshold?, embedding_model?, ...}` | 更新设置 |
| `delete` | `{id}` | 删除 |

### 文档管理 `/api/knowledge`

| action | body | 说明 |
|:---|:---|:---|
| `doc_list` | `{knowledge_id}` | 文档列表 |
| `doc_upload` | multipart: file + body: `{knowledge_id}` | 上传 → 解析 → 分段 → 向量化 → 入库 |
| `doc_detail` | `{knowledge_id, doc_id}` | 文档详情 |
| `doc_delete` | `{knowledge_id, doc_id}` | 删除文档（同时清理 ChromaDB 分段） |
| `doc_chunks` | `{knowledge_id, doc_id}` | 分段预览列表 |
| `doc_rechunk` | `{knowledge_id, doc_id, strategy}` | 按新策略重新分段+向量化 |

### 召回测试 `/api/knowledge`

| action | body | 说明 |
|:---|:---|:---|
| `recall_test` | `{knowledge_id, query, top_k, search_mode}` | 召回测试（search_mode: vector/keyword/hybrid） |

---

## 数据模型

使用 SQLModel（SQLAlchemy + Pydantic）定义，每个模块 `models.py` 中维护。

### model 模块 — `modules/model/models.py`

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
    api_key: str  # 加密存储
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

### knowledge 模块 — `modules/knowledge/models.py`

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
    embedding_model: Optional[str] = None  # → model_config.id
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

### ChromaDB Collection

| Collection | 用途 | 内容 |
|:---|:---|:---|
| `kb_{knowledge_id}_chunks` | 每知识库一个 Collection | 分段向量 + metadata: `{doc_id, chunk_index, content, knowledge_id}` |

---

## Agno 集成点

### 1. 模型连接测试

`POST /api/model { action: "test", id: "xxx" }`

```
读取 model_config → Agno 动态实例化 Model → 发送测试请求 → 更新 last_test / test_success / test_latency
```

LLM 类型发 `response("ping")`，Embedding 类型发送文本验证返回向量维度。

### 2. 文档上传 → 分段 → 向量化

`POST /api/knowledge { action: "doc_upload" }`

```
文件接收 → 格式校验 → 解析器提取文本 → chunker 分段
  → 读取 knowledge_base.embedding_model → 查询 model_config 获取 api_url/api_key/model_name
  → Agno Embedder 实例化 → 逐段生成向量
  → 文档元信息写入 SQLite knowledge_document
  → 分段+向量+metadata 写入 ChromaDB kb_{knowledge_id}_chunks
  → 更新 knowledge_base 状态为 completed
```

文档解析器按扩展名路由：`md/txt` 直接读取、`pdf` PyPDF2、`docx` python-docx、`html` BeautifulSoup。

### 3. 召回测试

`POST /api/knowledge { action: "recall_test", query, top_k, search_mode }`

```
读取知识库 embedding_model → Agno Embedder 生成 query 向量
  → vector: ChromaDB 向量相似度检索
  → keyword: SQLite LIKE 匹配文档内容
  → hybrid: 向量(权重0.7) + 关键词(0.3) 加权合并
  → 返回 [{doc_name, chunk_index, score, content}]
```

---

## 错误处理

**异常体系**（`core/exceptions.py`）：

```python
class AppException(Exception):
    code: int
    message: str

class NotFoundException(AppException):    # 资源不存在
class ValidationException(AppException):  # 参数校验失败
class ServiceException(AppException):     # 业务处理/外部调用异常
```

FastAPI 全局异常处理器统一捕获，返回 `{code, message, data: null}`。

**各层职责**：
- `api.py` — 不写 try，异常直抛
- `service.py` — 业务规则校验抛 `ValidationException`，外部调用失败（文件解析/Agno）抛 `ServiceException`
- `repository.py` — 数据不存在抛 `NotFoundException`

---

## 测试策略

| 层级 | 工具 | 范围 |
|:---|:---|:---|
| 单元测试 | pytest | service 业务逻辑 + repository 数据访问（SQLite 内存库） |
| 集成测试 | pytest + httpx | api 完整链路，ChromaDB 用临时 Collection |
| Agno 相关 | mock | 模型连接测试和 Embedding 调用统一 mock |

每个模块 `tests/` 下按 `test_api.py` / `test_service.py` / `test_repository.py` 组织。
