---
name: knowdo-knowledge-features-v2
overview: 参考 MaxKB 知识库操作，完善 KnowDo 前端功能。仅支持通用型和 Web 站点两种知识库类型，支持多文件上传（不含 ZIP），实现知识库管理操作和批量操作
todos:
  - id: add-dataset-types
    content: 在 types/index.ts 中新增 Dataset、DatasetDocument、DocumentChunk、ChunkStrategy 等接口定义（DatasetType 仅含 'general' | 'web'）
    status: pending
  - id: add-mock-datasets
    content: 在 mock/data.ts 中新增 DATASETS（不含 ZIP 格式）和 VECTOR_MODELS 模拟数据
    status: pending
    dependencies:
      - add-dataset-types
  - id: add-dataset-store
    content: 在 store/index.ts 中新增 datasets state 和所有 Dataset 相关 actions（支持多文件）
    status: pending
    dependencies:
      - add-dataset-types
  - id: create-dataset-list-page
    content: 创建 Dataset/index.tsx 知识库列表页，包含文件夹树和知识库卡片列表
    status: pending
    dependencies:
      - add-dataset-store
  - id: create-dataset-create-page
    content: 创建 DatasetCreate/index.tsx 知识库创建页，仅保留通用型和 Web 站点两种类型，通用型支持多文件上传（不含 ZIP）
    status: pending
    dependencies:
      - add-dataset-store
  - id: create-dataset-detail-page
    content: 创建 DatasetDetail/index.tsx 知识库详情页，包含文档列表（支持多文件管理）和 10 类管理操作
    status: pending
    dependencies:
      - add-dataset-store
  - id: modify-knowledge-browse
    content: 修改 KnowledgeBrowse/index.tsx，新增批量选择和批量操作功能
    status: pending
    dependencies:
      - add-dataset-store
  - id: modify-knowledge-create
    content: 修改 KnowledgeCreate/index.tsx，新增上传附件步骤（不含 ZIP，支持多文件）
    status: pending
  - id: add-notfound-page
    content: 创建 NotFound/index.tsx 404 页面组件
    status: pending
  - id: update-app-routes
    content: 修改 App.tsx，新增知识库相关路由（不含飞书/工作流）和 404 路由
    status: pending
    dependencies:
      - create-dataset-list-page
      - create-dataset-create-page
      - create-dataset-detail-page
      - add-notfound-page
---

## 产品概述

参考 MaxKB 知识库操作文档（https://maxkb.cn/docs/v2/user_manual/dataset/dataset/），完善 KnowDo 企业级 AI 知识平台的前端知识库操作功能。根据用户的明确约束，仅保留**通用型**和 **Web 站点**两种知识库类型，文档上传不支持 ZIP 打包格式，每个知识库支持多个文件（documents 为数组）。

## 核心功能

### 一、知识库类型（仅保留两种）

- **通用型知识库**：输入知识库名称、描述，选择对应向量模型；支持上传离线文档，格式包括：文本类（Markdown、TXT、PDF、DOCX、HTML）、表格类（XLS、XLSX、CSV）；不支持 ZIP 打包上传；一个知识库可包含多个文件
- **Web 站点知识库**：输入知识库名称、描述，选择向量模型，填写 Web 根地址和可选选择器；创建后自动爬取内容并向量化

### 二、文档上传与分段（仅通用型）

- 支持格式：Markdown、TXT、PDF、DOCX、HTML、XLS、XLSX、CSV
- 不支持 ZIP 压缩包上传
- 一个知识库可包含多个文件，页面支持多文件上传和管理
- 文档分段规则：
- 智能分段：按 Markdown 格式逐级下钻分段（最多6级标题），每段最大 4096 字符
- 高级分段：支持自定义分段标识符、分段长度（50-4096字符）、自动清洗
- 额外配置：可勾选"导入时添加分段标题为关联问题"
- 支持分段预览、手动编辑/删除不合理分段
- 导入后处理：点击"开始导入"后系统自动完成分段→存储→向量化

### 三、知识库管理操作（10 类）

1. **同步 Web 知识库**：仅适用于 Web 站点类型，支持同步替换/整体同步两种模式
2. **重新向量化**：修改向量模型后触发重新向量化
3. **生成问题**：通过 AI 模型根据文档内容自动生成关联问题
4. **资源授权**：将知识库授权给指定用户
5. **查看关联资源**：查看依赖资源和被依赖资源
6. **转移到**：将知识库移动到其他文件夹
7. **设置知识库**：修改基础信息和上传规则
8. **导出文档（Excel/CSV）**：将分段内容导出
9. **导出知识库**：导出全部元数据及关联关系
10. **删除知识库**：删除后数据无法恢复

### 四、批量操作

- 批量选择知识库，执行批量移动、批量删除

### 五、原有功能完善

- 修复收藏夹页面筛选逻辑
- 实现移动至收藏夹功能
- 完善 AI 工具栏按钮模拟交互
- 创建 404 页面并添加到路由

## 技术栈

- 前端框架：React 19 + TypeScript
- UI 组件库：Ant Design 6
- 状态管理：Zustand
- 样式方案：Tailwind CSS 4 + CSS 变量
- 构建工具：Vite 8
- 文件上传：Ant Design Upload 组件
- 模拟数据：在 `@/mock/data.ts` 中扩展

## 实现方案

### 1. 数据模型扩展（`src/types/index.ts`）

新增接口（根据用户约束调整）：

```typescript
// 知识库类型（仅保留 general 和 web）
export type DatasetType = 'general' | 'web';
export type DatasetStatus = 'pending' | 'processing' | 'completed' | 'failed';

// 知识库（一个知识库包含多个文档）
export interface Dataset {
  id: string;
  name: string;
  description: string;
  type: DatasetType;
  vectorModel: string;
  webUrl?: string;
  webSelector?: string;
  status: DatasetStatus;
  documents: DatasetDocument[];  // 多个文件
  folderId: string;
  createdAt: string;
  updatedAt: string;
  chunkStrategy?: ChunkStrategy;
  maxFilesPerUpload?: number;
  maxFileSizeMB?: number;
}

// 文档分段策略
export interface ChunkStrategy {
  mode: 'smart' | 'advanced';
  maxCharsPerChunk?: number;
  separators?: string[];
  chunkSize?: number;
  overlap?: number;
  autoClean?: boolean;
  autoAddTitleAsQuestion?: boolean;
}

// 知识库文档（支持多种格式，不含 ZIP）
export interface DatasetDocument {
  id: string;
  datasetId: string;
  name: string;
  size: string;
  type: 'md' | 'txt' | 'pdf' | 'docx' | 'html' | 'xls' | 'xlsx' | 'csv';
  status: DatasetStatus;
  chunks: DocumentChunk[];
  createdAt: string;
  error?: string;
}

// 文档分段
export interface DocumentChunk {
  id: string;
  index: number;
  content: string;
  length: number;
  question?: string;
}
```

在 `AppState` 中新增 state 和 actions：

```typescript
// 知识库 state
datasets: Dataset[];
currentDatasetId: string | null;

// 知识库 Actions
addDataset: (dataset: Omit<Dataset, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { documents?: DatasetDocument[] }) => void;
updateDataset: (id: string, data: Partial<Dataset>) => void;
deleteDataset: (id: string) => void;
addDatasetDocuments: (datasetId: string, documents: Omit<DatasetDocument, 'id' | 'createdAt' | 'status'>[]) => void;
updateDatasetDocument: (datasetId: string, docId: string, data: Partial<DatasetDocument>) => void;
deleteDatasetDocument: (datasetId: string, docId: string) => void;
regenerateQuestions: (datasetId: string, docId: string) => void;
reEmbedDataset: (datasetId: string) => void;
syncWebDataset: (datasetId: string, mode: 'replace' | 'full') => void;
transferDataset: (datasetId: string, targetFolderId: string) => void;
exportDatasetAsExcel: (datasetId: string) => void;
exportFullDataset: (datasetId: string) => void;
setCurrentDataset: (id: string | null) => void;
```

### 2. Mock 数据扩展（`src/mock/data.ts`）

新增 `DATASETS: Dataset[]` 数组，包含 3-5 条模拟知识库数据（仅覆盖 general 和 web 两种类型）。每条数据的 documents 数组包含 2-3 个模拟文档（格式不含 ZIP），每个文档包含 2-3 个模拟分段。

新增 `VECTOR_MODELS` 数组，模拟可选向量模型列表。

### 3. Store 实现（`src/store/index.ts`）

在现有 `useAppStore` 中新增上述 Dataset 相关 state 和 actions。

关键 action 实现逻辑：

- `addDataset`：生成 id，设置 createdAt/updatedAt，status 默认 'pending'，将 documents 数组存入
- `addDatasetDocuments`：支持一次添加多个文档；模拟异步处理，每个文档 status 从 'pending' → 'processing'（延迟 1.5s）→ 'completed'，同时生成模拟 chunks
- `reEmbedDataset`：遍历所有文档的 chunks，模拟重新向量化（延迟 2s）
- `syncWebDataset`：模拟爬取过程，更新文档列表
- `exportDatasetAsExcel`/`exportFullDataset`：模拟下载（创建 a 标签触发）

### 4. 页面规划

共需新增/修改以下页面：

```
src/pages/
├── Dataset/                     [NEW] 知识库列表页
│   └── index.tsx
├── DatasetCreate/              [NEW] 知识库创建页（仅通用型、Web 站点）
│   └── index.tsx
├── DatasetDetail/             [NEW] 知识库详情/文档列表页（支持多文件管理）
│   └── index.tsx
├── KnowledgeBrowse/           [MODIFY] 知识浏览页，新增批量操作工具栏
│   └── index.tsx
├── KnowledgeCreate/          [MODIFY] 知识创建页，新增文档上传步骤（不含 ZIP）
│   └── index.tsx
└── NotFound/                [NEW] 404 页面组件
    └── index.tsx
```

### 5. 各页面实现细节

#### 5.1 知识库列表页 `Dataset/index.tsx`

- 布局：左侧文件夹树（宽度 260px）+ 右侧知识库卡片列表
- 文件夹支持三级，右键菜单支持新增/重命名/删除
- 每个知识库卡片显示：名称、类型图标（通用型/Web 站点）、状态标签、文档数量、更新时间、操作按钮
- 顶部：搜索框 + "创建知识库"按钮
- 支持批量选择（Checkbox）+ 批量操作（批量移动、批量删除）

#### 5.2 知识库创建页 `DatasetCreate/index.tsx`

分步骤引导创建（Stepper，共 3 步）：

**Step 1：选择知识库类型**

- 两个卡片：通用型、Web 站点（移除飞书和工作流）
- 选中状态：边框高亮（蓝色 2px）、背景浅蓝

**Step 2：填写基本信息**

- 知识库名称（必填）
- 描述（选填）
- 向量模型（Select，从 VECTOR_MODELS 选择）
- 若选择 Web 站点类型，额外显示：Web 根地址（必填）、选择器（选填）

**Step 3：上传文档（仅通用型）**

- 使用 Ant Design `Upload.Dragger` 组件
- 支持格式提示（不含 ZIP）
- 支持多文件上传（一个知识库多个文件）
- 上传限制提示
- "开始导入"按钮：点击后模拟导入过程，完成后跳转至知识库详情页

#### 5.3 知识库详情/文档列表页 `DatasetDetail/index.tsx`

- 顶部：面包屑 + 知识库名称 + 状态标签
- 操作按钮组（10 类操作）：

1. 同步 Web 知识库（仅 web 类型可见）
2. 重新向量化
3. 生成问题
4. 资源授权
5. 查看关联资源
6. 转移到
7. 设置
8. 导出文档（Excel/CSV）
9. 导出知识库
10. 删除

- 文档列表表格（支持多文件管理）
- "导入文档"按钮（仅 general 类型，支持多文件）

#### 5.4 知识浏览页修改 `KnowledgeBrowse/index.tsx`

- 新增"批量选择"模式
- 进入批量模式后，每个知识卡片左上角显示 Checkbox
- 底部固定操作栏：显示已选中数量 + 操作按钮

#### 5.5 知识创建页修改 `KnowledgeCreate/index.tsx`

- 在"选择类型"之后、"填写信息"之前，新增"上传附件"步骤
- 使用 Upload.Dragger 支持多文件上传（不含 ZIP）

## 目录结构

```
knowdo-frontend/src/
├── pages/
│   ├── Dataset/                         [NEW] 知识库列表页
│   │   └── index.tsx
│   ├── DatasetCreate/                   [NEW] 知识库创建页（仅通用型、Web 站点）
│   │   └── index.tsx
│   ├── DatasetDetail/                  [NEW] 知识库详情/文档列表页（多文件管理）
│   │   └── index.tsx
│   ├── KnowledgeBrowse/               [MODIFY] 新增批量操作
│   │   └── index.tsx
│   ├── KnowledgeCreate/              [MODIFY] 新增上传附件步骤（不含 ZIP）
│   │   └── index.tsx
│   └── NotFound/                    [NEW] 404 页面组件
│       └── index.tsx
├── store/
│   └── index.ts                      [MODIFY] 新增 Dataset state + actions
├── types/
│   └── index.ts                      [MODIFY] 新增 Dataset 相关接口（不含飞书/工作流）
├── mock/
│   └── data.ts                      [MODIFY] 新增 DATASETS + VECTOR_MODELS（不含 ZIP）
└── App.tsx                          [MODIFY] 新增路由（不含飞书/工作流）
```