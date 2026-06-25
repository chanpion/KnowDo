---
name: frontend-implementation-plan
overview: 基于现有HTML原型，采用React 18 + TypeScript + Ant Design 5 + Vite技术栈，实现知行KnowDo企业级AI知识平台的前端代码，涵盖首页、知识浏览、知识创建、知识详情、模型配置5个核心页面。
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - Enterprise
    - Professional
    - Clean
    - Blue Tone
    - Card Layout
  fontSystem:
    fontFamily: PingFang SC, Microsoft YaHei, system-ui
    heading:
      size: 24px
      weight: 700
    subheading:
      size: 18px
      weight: 600
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#1a56db"
      - "#1e40af"
      - "#dbeafe"
    background:
      - "#f0f2f5"
      - "#ffffff"
      - "#0f172a"
    text:
      - "#1e293b"
      - "#64748b"
      - "#94a3b8"
      - "#ffffff"
    functional:
      - "#10b981"
      - "#f59e0b"
      - "#ef4444"
      - "#8b5cf6"
todos:
  - id: init-project
    content: 初始化 Vite + React + TypeScript 工程，配置 Tailwind CSS、shadcn/ui、React Router、Zustand，建立目录结构
    status: pending
  - id: mock-data-types
    content: 从 common.js 迁移 Mock 数据到 TypeScript 模块，定义所有核心类型接口（Knowledge, Category, Tag, Model, Comment, User 等）
    status: pending
    dependencies:
      - init-project
  - id: layout-components
    content: 实现全局布局组件（AppLayout, Header, Breadcrumb）和基础 UI 组件（Button, Card, Modal, Toast, Tag, Badge）
    status: pending
    dependencies:
      - init-project
  - id: home-page
    content: 实现首页：StatCard 统计卡片、QuickEntry 快捷入口、HotKnowledgeList 热门列表、LatestTimeline 时间线
    status: pending
    dependencies:
      - layout-components
      - mock-data-types
  - id: browse-page
    content: 实现知识浏览页：CategoryTree 分类树（含 ... 操作菜单）、SearchBar 搜索、FilterBar 筛选栏、KnowledgeCard 卡片、网格/列表视图切换、HoverPreview 悬停预览
    status: pending
    dependencies:
      - layout-components
      - mock-data-types
  - id: detail-page
    content: 实现知识详情页：ArticleHeader、ArticleContent（Markdown 渲染）、AttachmentList、CommentSection、ShareModal、RecommendPanel
    status: pending
    dependencies:
      - layout-components
      - mock-data-types
  - id: create-page
    content: 实现知识创建页：StepIndicator 步骤条、TypeSelector 类型选择、InfoForm 信息表单（级联分类+标签+范围+有效期）、RichEditor 富文本编辑器（Tiptap）、ReviewSubmit 确认提交
    status: pending
    dependencies:
      - layout-components
      - mock-data-types
  - id: model-config-page
    content: 实现模型配置页：ProviderNav 供应商导航、ModelTabs 标签页切换、ModelTable 模型表格、ConnectionTest 连接测试、VectorizationConfig 向量化策略
    status: pending
    dependencies:
      - layout-components
      - mock-data-types
  - id: integration-test
    content: 全局联调：验证页面间路由导航、Zustand 状态同步、Toast 通知、空状态/错误状态展示
    status: pending
    dependencies:
      - home-page
      - browse-page
      - detail-page
      - create-page
      - model-config-page
---

## 用户需求

在当前 workspace 中，将现有的 5 个静态 HTML 原型页面工程化为可运行的前端应用。要求先制定技术栈和实现方案，再基于方案逐步实现。

## 产品概述

知行 KnowDo 是企业级 AI 知识库平台，覆盖知识创建、审核、存储、检索、互动、更新、归档全生命周期。前端需实现 5 个核心页面：平台首页、知识浏览、知识创建、知识详情、模型配置。

## 核心功能

- **平台首页**：统计卡片、快捷入口、热门知识 Top10、最新发布时间线、通知中心
- **知识浏览**：三级分类树管理、搜索框、多维筛选（类型/标签/时间/排序）、知识卡片网格/列表视图切换、悬停预览浮窗
- **知识创建**：四步向导（选择类型 → 填写信息 → 编辑内容 → 提交审核）、富文本编辑器、分类级联选择、标签管理、草稿保存
- **知识详情**：AI 摘要展示、正文渲染、附件下载、评论/点赞/收藏交互、分享弹窗、推荐列表
- **模型配置**：供应商侧边导航、三类模型标签页（LLM / Embedding / Reranker）、模型列表表格、连接测试、向量化策略配置

## 技术栈选型

| 类别 | 技术 | 选型理由 |
| --- | --- | --- |
| 框架 | React 18 + TypeScript | 企业级标准、组件化复用、类型安全 |
| 构建工具 | Vite 5 | 秒级冷启动、HMR 热更新、ESM 原生支持 |
| UI 样式 | Tailwind CSS 3 + shadcn/ui | 与原型一致的设计体系、原子化样式、可定制组件 |
| 路由 | React Router v6 | 声明式路由、嵌套布局、懒加载 |
| 状态管理 | Zustand | 轻量无 boilerplate、与 React 天然集成 |
| 图标 | Lucide React | 现代图标库、与 shadcn/ui 配合无缝 |
| 富文本 | Tiptap | 基于 ProseMirror、可扩展、TypeScript 友好 |
| 表单验证 | React Hook Form + Zod | 性能优秀、类型安全的 schema 校验 |
| HTTP | 原生 fetch + 封装层（预留 API 接口） | V1 阶段使用本地 Mock 数据，架构预留真实 API 切换点 |


## 实现策略

### 整体思路

采用 **分层逐页迁移** 策略：

1. 先搭建项目骨架（工程配置、路由、布局、主题 token、Mock 数据层）
2. 从最简单页面开始（首页），逐页迁移原型 UI 和交互到 React 组件
3. 每完成一页即通过 TypeScript 类型约束和数据 State 管理确保可运行
4. 最终全局联调，确保页面间导航和状态一致性

### 架构分层

```
┌────────────────────────────────────┐
│  Pages (路由页面)                    │
│  Home / Browse / Create / Detail    │
│  / ModelConfig                      │
├────────────────────────────────────┤
│  Components (UI 组件)                │
│  ui/ (基础组件) shared/ (业务组件)    │
│  layout/ (布局组件)                   │
├────────────────────────────────────┤
│  Stores (Zustand 状态)              │
│  useKnowledgeStore / useModelStore  │
│  useCategoryStore / useUserStore    │
├────────────────────────────────────┤
│  Lib (工具与数据层)                  │
│  mock-data / api / utils / types    │
└────────────────────────────────────┘
```

### 组件映射关系（原型 → React）

| 原型文件 | React 页面组件 | 拆分的子组件 |
| --- | --- | --- |
| `index.html` | `pages/HomePage.tsx` | StatCard, QuickEntry, HotKnowledgeList, LatestTimeline |
| `knowledge-browse.html` | `pages/BrowsePage.tsx` | CategoryTree, SearchBar, FilterBar, KnowledgeCard, KnowledgeGrid, HoverPreview |
| `knowledge-create.html` | `pages/CreatePage.tsx` | StepIndicator, TypeSelector, InfoForm, RichEditor, ReviewSubmit |
| `knowledge-detail.html` | `pages/DetailPage.tsx` | ArticleHeader, ArticleContent, AttachmentList, CommentSection, ShareModal, RecommendPanel |
| `model-config.html` | `pages/ModelConfigPage.tsx` | ProviderNav, ModelTabs, ModelTable, ConnectionTest, VectorizationConfig |


### 数据流设计

- **Mock 数据层**：从 `common.js` 迁移 `KNOWLEDGE_LIST`、`CATEGORY_TREE`、`TAG_LIBRARY`、`MODEL_LIST` 等为 TypeScript 模块
- **状态管理**：Zustand store 封装知识、分类、模型数据的增删改查操作
- **API 预留**：定义 `api/` 目录下的接口函数，V1 版本内部调用 mock 数据并模拟异步延迟，后续替换为真实 fetch 即可

## 执行注意事项

### 性能

- 知识列表使用 `useMemo` 缓存筛选/排序结果，避免重复计算
- CategoryTree 递归渲染时使用 `React.memo` 防止不必要重渲染
- 知识卡片悬停预览使用 `onMouseEnter/Leave` + 绝对定位，避免全局 mousemove 监听

### 类型安全

- 从 mock 数据中提取所有接口类型（Knowledge, Category, Tag, Model, Comment 等）
- 组件 Props 严格类型化，store actions 返回 Promise 类型

### 兼容性

- 保持与原型的视觉一致性：颜色、间距、圆角、阴影沿用原型 CSS 变量
- Tailwind 配置中映射原型的 `--primary: #1a56db` 等设计 token

## 设计风格

沿用原型的 **企业级专业风格**，深蓝顶部导航 + 浅灰页面底色 + 白色卡片布局。整体干净利落、信息密度适中、视觉层次清晰。采用 shadcn/ui 组件库保证交互一致性，Tailwind CSS 原子化样式保持与原型的视觉连续性。

## 页面设计

### 全局布局（共享）

- **顶部导航栏**：深蓝底色 `#0f172a`，高度 56px，固定顶部。左侧 Logo「知 KnowDo」+ 导航菜单（首页/知识库/模型管理），右侧搜索框 + 通知铃铛 + 用户头像
- **面包屑**：页面顶部灰色文字导航路径
- **内容区**：最大宽度 1400px，水平居中，内边距 24px

### 1. 平台首页

- **统计卡片区**：4 列网格，每张卡片含图标、数值、标签、趋势箭头，浅色背景圆角卡片
- **快捷入口**：4 个图标按钮（创建知识/我的草稿/待审核/我的收藏），hover 背景变色
- **两栏布局**：左侧热门知识 Top10（排名数字渐变色），右侧最新发布时间线列表

### 2. 知识浏览页

- **搜索框**：全宽输入框，右侧搜索图标，placeholder 引导文字
- **筛选栏**：下拉选择器横排（类型/标签/时间/排序），右侧网格/列表视图切换按钮
- **左侧分类树**：固定 280px 侧栏，树形展开折叠，当前选中高亮，每项右侧 ... 操作按钮
- **右侧卡片区**：3 列网格，每张卡片含类型角标、标题、摘要、标签、元数据行（作者/时间/浏览/点赞/收藏）

### 3. 知识创建页

- **步骤条**：4 步横向进度条（选择类型→填写信息→编辑内容→提交审核），已完成步骤打勾
- **类型选择**：6 张类型卡片 3x2 网格，选中高亮蓝边框
- **信息表单**：标题输入框 + 三级分类级联选择器 + 标签多选（含 AI 推荐标签）+ 发布范围单选 + 有效期日期选择
- **富文本编辑器**：顶部工具栏（加粗/斜体/下划线/对齐/列表/插入图片链接代码块），下方可编辑区域，底部附件拖拽上传区

### 4. 知识详情页

- **内容区**：类型标签 + 状态徽章 + 版本号 + 标题 + 作者信息行 + 分类路径 + 标签列表
- **AI 摘要**：蓝色背景提示框，含「AI 生成」标识
- **正文区**：Markdown 渲染的富文本内容
- **附件列表**：文件卡片（图标+文件名+大小+下载按钮）
- **评论互动区**：评论列表 + 发表评论输入框，支持作者标识和 @ 提及
- **右侧面板**：操作按钮（编辑/分享/收藏/点赞）+ 「猜你喜欢」推荐列表

### 5. 模型配置页

- **左侧供应商导航**：竖排供应商列表，点击筛选右侧模型
- **右侧标签页**：LLM / Embedding / Reranker 三标签切换，含数量 badge
- **模型表格**：8 列表格（名称/供应商/标识/API地址/状态/Token/并发/操作），状态列在线绿点离线灰点
- **连接测试**：点击测试按钮触发 loading 动画，显示延迟结果
- **向量化策略**：可折叠配置区（分块方式/分块大小/重叠窗口/检索权重滑块）

## Agent Extensions

### SubAgent

- **code-explorer**
- 用途：在工程初始化阶段探索 `prototypes/` 目录下的所有 HTML 文件、CSS 样式表和 JS 脚本，提取完整的组件结构、样式 token 和交互逻辑
- 预期结果：输出每个页面的组件分解清单、CSS 变量映射表、数据流依赖图，确保迁移不漏任何 UI 细节和交互行为