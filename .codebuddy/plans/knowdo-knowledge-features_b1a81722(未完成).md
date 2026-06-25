---
name: knowdo-knowledge-features
overview: 参考 MaxKB 知识库操作，完善 KnowDo 企业级 AI 知识平台的前端功能，包括：知识库类型管理、文档上传与分段配置、知识库管理操作（同步/向量化/生成问题/导出等）、批量操作、以及知识详情页完善
design:
  architecture:
    framework: react
  styleKeywords:
    - Modern
    - Clean
    - Ant Design
    - Professional
  fontSystem:
    fontFamily: PingFang SC, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
    heading:
      size: 24px
      weight: 600
    subheading:
      size: 16px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#1a56db"
      - "#3b82f6"
    background:
      - "#f9fafb"
      - "#ffffff"
    text:
      - "#1f2937"
      - "#6b7280"
    functional:
      - "#10b981"
      - "#ef4444"
      - "#f59e0b"
      - "#3b82f6"
todos:
  - id: add-dataset-types
    content: 在 types/index.ts 中新增 Dataset、DatasetDocument、DocumentChunk、ChunkStrategy 等相关接口定义
    status: pending
  - id: add-mock-datasets
    content: 在 mock/data.ts 中新增 DATASETS 和 VECTOR_MODELS 模拟数据
    status: pending
    dependencies:
      - add-dataset-types
  - id: add-dataset-store
    content: 在 store/index.ts 中新增 datasets state 和所有 Dataset 相关 actions
    status: pending
    dependencies:
      - add-dataset-types
  - id: create-dataset-list-page
    content: 创建 Dataset/index.tsx 知识库列表页，包含文件夹树和知识库卡片列表
    status: pending
    dependencies:
      - add-dataset-store
  - id: create-dataset-create-page
    content: 创建 DatasetCreate/index.tsx 知识库创建页，分步骤引导创建（选择类型、填写信息、上传文档）
    status: pending
    dependencies:
      - add-dataset-store
  - id: create-dataset-detail-page
    content: 创建 DatasetDetail/index.tsx 知识库详情页，包含文档列表和 10 类管理操作
    status: pending
    dependencies:
      - add-dataset-store
  - id: modify-knowledge-browse
    content: 修改 KnowledgeBrowse/index.tsx，新增批量选择和批量操作功能
    status: pending
    dependencies:
      - add-dataset-store
  - id: modify-knowledge-create
    content: 修改 KnowledgeCreate/index.tsx，新增上传附件步骤
    status: pending
  - id: add-notfound-page
    content: 创建 NotFound/index.tsx 404 页面组件
    status: pending
  - id: update-app-routes
    content: 修改 App.tsx，新增知识库相关路由和 404 路由
    status: pending
    dependencies:
      - create-dataset-list-page
      - create-dataset-create-page
      - create-dataset-detail-page
      - add-notfound-page
---

## 产品概述

参考 MaxKB 知识库操作文档（https://maxkb.cn/docs/v2/user_manual/dataset/dataset/），完善 KnowDo 企业级 AI 知识平台的前端知识库操作功能。MaxKB 支持通用型、Web站点、飞书知识库、工作流知识库四种类型，具备完整的文档上传解析、分段规则配置、知识库管理操作和批量操作能力。KnowDo 当前已有知识创建（6种类型）、浏览、详情、草稿、审核、版本、回收站、模型配置、收藏夹等基础功能，但缺少文档上传解析、分段配置、知识库级管理操作、批量操作等核心功能。

## 核心功能

### 一、知识库创建流程完善（参考 MaxKB 四种类型）

- **通用型知识库创建**：输入知识库名称、描述，选择对应向量模型
- **文档上传支持**：创建完成后可上传离线文档，支持格式包括：文本类（Markdown、TXT、PDF、DOCX、HTML）、表格类（XLS、XLSX、CSV）、QA问答对（XLS、XLSX、CSV）、压缩包（ZIP，支持"Markdown+图片""XLS/XLSX+图片"两种打包格式）。上传限制：默认单次最多传50个文件，单个文件≤100MB
- **文档分段规则（上传时配置）**：
- 智能分段：按Markdown格式逐级下钻分段（最多支持6级标题），每段最大4096字符
- 高级分段：支持自定义分段标识符、分段长度（50-4096字符）、自动清洗
- 额外配置：可勾选"导入时添加分段标题为关联问题"
- 支持分段预览、手动编辑/删除不合理分段
- **导入后处理**：点击"开始导入"后系统自动完成分段→存储→向量化，完成后文件状态显示为"完成"

### 二、知识库管理操作（参考 MaxKB 10类操作）

1. **同步Web知识库**：仅适用于Web站点类型知识库，支持两种同步模式（同步替换/整体同步）
2. **重新向量化**：若修改了知识库配置的向量模型，触发重新向量化
3. **生成问题**：通过AI模型根据文档内容自动生成关联问题
4. **资源授权**：可将知识库授权给指定用户
5. **查看关联资源**：可查看该知识库的依赖资源和被依赖资源
6. **转移到**：可将知识库移动到同一工作空间下的其他文件夹中
7. **设置知识库**：可修改知识库基础信息和上传规则
8. **导出文档（Excel/ZIP）**：可将知识库所有分段内容导出
9. **导出知识库**：可导出知识库全部元数据及所有关联关系
10. **删除知识库**：删除后数据无法恢复

### 三、批量操作

- 点击知识库列表的"批量选择"，可批量选中多个知识库
- 执行批量移动、批量删除操作

### 四、Web站点知识库（X-Pack）

- 创建配置项：需输入知识库名称、描述，选择向量模型，填写Web根地址、可选配置选择器
- 后续管理：创建完成后自动跳转到文档列表，系统后台自动爬取内容并完成向量化

### 五、原有功能完善

- 修复收藏夹页面筛选逻辑（按 selectedFolder 过滤）
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

新增以下接口：

```typescript
// 知识库（Dataset）
export type DatasetType = 'general' | 'web' | 'feishu' | 'workflow';
export type DatasetStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Dataset {
  id: string;
  name: string;
  description: string;
  type: DatasetType;
  vectorModel: string;
  webUrl?: string;
  webSelector?: string;
  status: DatasetStatus;
  documents: DatasetDocument[];
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

// 知识库文档
export interface DatasetDocument {
  id: string;
  datasetId: string;
  name: string;
  size: string;
  type: string;
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

在 `AppState` 中新增：

```typescript
// 知识库
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
exportDatasetAsZip: (datasetId: string) => void;
exportFullDataset: (datasetId: string) => void;
setCurrentDataset: (id: string | null) => void;
```

### 2. Mock 数据扩展（`src/mock/data.ts`）

新增 `DATASETS: Dataset[]` 数组，包含 3-5 条模拟知识库数据（覆盖 general 和 web 两种类型）。每条数据包含 2-3 个模拟文档，每个文档包含 2-3 个模拟分段。

新增 `VECTOR_MODELS` 数组，模拟可选向量模型列表。

### 3. Store 实现（`src/store/index.ts`）

在现有 `useAppStore` 中新增上述 `Dataset` 相关 state 和 actions。

关键 action 实现逻辑：

- `addDataset`：生成 id，设置 createdAt/updatedAt，status 默认 'pending'，将 documents 存入
- `addDatasetDocuments`：模拟异步处理，每个文档 status 从 'pending' → 'processing'（延迟 1.5s）→ 'completed'，同时生成模拟 chunks
- `reEmbedDataset`：遍历所有文档的 chunks，模拟重新向量化（延迟 2s）
- `syncWebDataset`：模拟爬取过程，更新文档列表
- `exportDatasetAsExcel`/`exportDatasetAsZip`/`exportFullDataset`：模拟下载（创建 a 标签触发）

### 4. 页面规划

共需新增/修改以下页面：

```
src/pages/
├── Dataset/                     [NEW] 知识库列表页
│   └── index.tsx
├── DatasetCreate/              [NEW] 知识库创建页
│   └── index.tsx
├── DatasetDetail/             [NEW] 知识库详情/文档列表页
│   └── index.tsx
├── KnowledgeBrowse/           [MODIFY] 知识浏览页，新增"批量操作"工具栏
│   └── index.tsx
├── KnowledgeCreate/          [MODIFY] 知识创建页，新增"文档上传"步骤
│   └── index.tsx
└── ModelConfig/             [MODIFY] 模型配置页，与现有功能合并
    └── index.tsx
```

### 5. 各页面实现细节

#### 5.1 知识库列表页 `Dataset/index.tsx`

- 布局：左侧文件夹树 + 右侧知识库卡片列表
- 文件夹支持三级，右键菜单支持新增/重命名/删除
- 每个知识库卡片显示：名称、类型图标、状态、文档数量、更新时间、操作按钮
- 顶部：搜索框 + "创建知识库"按钮
- 支持批量选择（Checkbox）+ 批量操作（批量移动、批量删除）

#### 5.2 知识库创建页 `DatasetCreate/index.tsx`

分步骤引导创建（Stepper，共 3 步）：

**Step 1：选择知识库类型**

- 四个卡片：通用型、Web 站点、飞书知识库（X-Pack 标签）、工作流知识库（X-Pack 标签）
- X-Pack 功能点击时提示"此为 X-Pack 企业版专属功能"

**Step 2：填写基本信息**

- 知识库名称（必填）
- 描述（选填）
- 向量模型（Select，从 VECTOR_MODELS 选择）

若选择 Web 站点类型，额外显示：

- Web 根地址（Input，必填）
- 选择器（Input，选填）

**Step 3：上传文档（仅通用型）**

- 使用 Ant Design `Upload.Dragger` 组件
- 支持格式提示
- 上传限制提示
- "开始导入"按钮：点击后模拟导入过程，完成后跳转至知识库详情页

#### 5.3 知识库详情/文档列表页 `DatasetDetail/index.tsx`

- 顶部：面包屑 + 知识库名称 + 状态标签
- 操作按钮组：

1. 同步 Web 知识库（仅 web 类型可见）
2. 重新向量化
3. 生成问题
4. 资源授权
5. 查看关联资源
6. 转移到
7. 设置
8. 导出文档（Excel/ZIP）
9. 导出知识库
10. 删除

- 文档列表表格
- "导入文档"按钮（仅 general 类型）

#### 5.4 知识浏览页修改 `KnowledgeBrowse/index.tsx`

- 新增"批量选择"模式
- 进入批量模式后，每个知识卡片左上角显示 Checkbox
- 底部固定操作栏：显示已选中数量 + 操作按钮

#### 5.5 知识创建页修改 `KnowledgeCreate/index.tsx`

- 在"选择类型"之后、"填写信息"之前，新增"上传附件"步骤
- 使用 Upload.Dragger 支持多文件上传

## 目录结构

```
knowdo-frontend/src/
├── pages/
│   ├── Dataset/                         [NEW] 知识库列表页
│   │   └── index.tsx
│   ├── DatasetCreate/                   [NEW] 知识库创建页
│   │   └── index.tsx
│   ├── DatasetDetail/                  [NEW] 知识库详情/文档列表页
│   │   └── index.tsx
│   ├── KnowledgeBrowse/               [MODIFY] 新增批量操作
│   │   └── index.tsx
│   ├── KnowledgeCreate/              [MODIFY] 新增上传附件步骤
│   │   └── index.tsx
│   └── NotFound/                    [NEW] 404页面组件
│       └── index.tsx
├── store/
│   └── index.ts                      [MODIFY] 新增 Dataset state + actions
├── types/
│   └── index.ts                      [MODIFY] 新增 Dataset 相关接口
├── mock/
│   └── data.ts                      [MODIFY] 新增 DATASETS + VECTOR_MODELS
└── App.tsx                          [MODIFY] 新增路由
```

## 设计风格

沿用项目现有的现代简洁风格，保持 Ant Design 6 的设计语言，与现有页面视觉一致。

## 页面设计

### 1. 知识库列表页

- 采用左右布局：左侧文件夹树（宽度 260px），右侧知识库卡片列表
- 知识库卡片：白色背景、圆角 8px、阴影、hover 效果
- 每个卡片显示：知识库名称（18px 600）、类型标签、状态标签（在线-绿色/离线-灰色/处理中-蓝色）、文档数量、更新时间、操作按钮组
- 顶部操作栏：搜索框（宽度 300px）、"创建知识库"按钮（primary 类型）
- 批量操作模式：顶部显示已选中数量 + 批量移动/批量删除按钮

### 2. 知识库创建页

- 分步骤引导（Steps 组件，方向水平）
- Step 1 - 选择类型：4 个卡片网格布局（2×2），每个卡片包含图标（48px）、类型名称（16px 600）、描述（13px，secondary 颜色）
- 选中状态：边框高亮（蓝色 2px）、背景浅蓝
- X-Pack 功能：卡片右上角显示"X-Pack"标签（紫色背景）
- Step 2 - 填写信息：表单垂直布局，Label 在上方
- 知识库名称：Input，必填，最大长度 50 字符
- 描述：TextArea，选填，最大长度 200 字符
- 向量模型：Select，必填
- Web 根地址（仅 web 类型）：Input，必填，placeholder 显示示例
- 选择器（仅 web 类型）：Input，选填
- Step 3 - 上传文档：Dragger 上传区域，虚线边框、图标 48px、提示文字 14px
- 支持格式列表：灰色背景块，内嵌图标+格式名
- 上传限制提示：13px，secondary 颜色
- 已上传文件列表：显示文件名、大小、删除按钮
- "开始导入"按钮：宽度为 200px，居中

### 3. 知识库详情/文档列表页

- 顶部区域：
- 面包屑：首页 > 知识库 > [名称]
- 知识库名称：24px 600
- 状态标签：展示当前状态
- 操作按钮组：每行 5 个按钮，换行显示
- 文档列表：Table 组件
- 列：名称（带文件类型图标）、类型、大小、分段数、状态、创建时间、操作
- 状态列：使用 Badge 组件显示（completed-绿色/success、processing-蓝色/processing、failed-红色/error）
- 操作列：查看分段、删除（红色文字）
- "导入文档"按钮：位于表格上方右侧
- 分段查看：Drawer 组件（宽度 600px），内部显示分段列表（可折叠）
- 设置抽屉：Form 表单，包含名称、描述、向量模型、上传规则（两个 InputNumber）

### 4. 知识浏览页批量操作

- "批量选择"按钮：Toggle 类型，点击后进入批量模式
- 批量模式：每个知识卡片左上角叠加 Checkbox（绝对定位）
- 底部固定操作栏：
- 背景：白色、阴影（向上）、高度 56px、fixed 定位（bottom: 0）
- 左侧：已选中 N 个知识
- 右侧："批量移动"按钮、"批量删除"按钮（danger 类型）
- 批量移动 Modal：Select 选择目标分类

### 5. 404 页面

- 使用 Ant Design Result 组件
- 状态：404
- 标题："页面未找到"
- 副标题："抱歉，您访问的页面不存在"
- 操作按钮："返回首页"（链接至 `/`）

## Agent Extensions

当前上下文中没有提供需要扩展的 Skills、MCP、SubAgent 或 Integration，因此不需要使用扩展。