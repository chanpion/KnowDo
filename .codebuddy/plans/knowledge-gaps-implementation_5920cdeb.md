---
name: knowledge-gaps-implementation
overview: 基于PRD文档，实现当前前端代码中缺失的知识库核心功能：知识审核与发布、分类标签管理、版本管理、知识更新与归档、回收站、草稿自动保存、搜索历史、悬停预览、评论持久化、收藏夹管理、二维码分享、有效期管理等。（排除权限管理、AI增强、用户认证模块）
design:
  architecture:
    framework: react
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
      - "#f1f5f9"
      - "#ffffff"
      - "#0f172a"
    text:
      - "#1e293b"
      - "#64748b"
      - "#94a3b8"
    functional:
      - "#10b981"
      - "#f59e0b"
      - "#ef4444"
todos:
  - id: install-qrcode
    content: 安装 qrcode.react 依赖（npm install qrcode.react）
    status: completed
  - id: extend-types-store
    content: 扩展类型定义（KnowledgeVersion/DraftItem/FavoriteFolder/DeletedKnowledge）、mock数据（版本历史/回收站数据）、Store（新增15+个actions和state）
    status: completed
    dependencies:
      - install-qrcode
  - id: f01-f05-drafts
    content: 实现音频类型（F-01）和草稿自动保存（F-05）：TYPE_OPTIONS新增audio、KnowledgeCreate添加30秒localStorage自动保存、新建DraftsPage草稿箱页面、路由注册/drafts
    status: completed
    dependencies:
      - extend-types-store
  - id: f06-f09-review
    content: 实现审核发布流程（F-06~F-09）：新建ReviewPage审核页面（左右布局，左侧队列列表+右侧审核操作区）、审核通过/驳回/退回修改逻辑、自动发布状态变更、站内通知模板
    status: completed
    dependencies:
      - extend-types-store
  - id: f11-f12-admin
    content: 实现分类标签管理（F-11~F-12）：新建CategoriesPage（Tree拖拽排序增删改）、TagsPage（Table增删改标签+颜色分组）、路由注册/categories和/tags、导航栏添加入口
    status: completed
    dependencies:
      - extend-types-store
  - id: f13-version
    content: 实现版本管理（F-13）：KnowledgeDetail增加版本历史Tab、历史版本内容查看Modal、回滚操作（二次确认生成新版本号）
    status: completed
    dependencies:
      - extend-types-store
  - id: f14-f15-f17-search
    content: 实现检索增强（F-14/F-15/F-17）：新建HighlightText组件实现关键词高亮、KnowledgeCard添加HoverPreview悬停预览Popover、搜索框搜索历史（localStorage+最近5条下拉）
    status: completed
    dependencies:
      - extend-types-store
  - id: f18-f20-interaction
    content: 实现互动增强（F-18~F-20）：ShareModal二维码分享弹窗、评论持久化+@提及检测高亮+管理员删除、FavoritesPage收藏夹管理页面
    status: completed
    dependencies:
      - extend-types-store
      - f13-version
  - id: f22-f25-lifecycle
    content: 实现知识生命周期管理（F-22~F-25）：KnowledgeCreate编辑模式回填、有效期提醒横幅+过期过滤、归档/解除归档按钮、RecyclePage回收站页面
    status: completed
    dependencies:
      - extend-types-store
      - f06-f09-review
  - id: global-integration
    content: 全局联调：AppLayout导航菜单增加审核/草稿/回收站入口、路由完整性验证、Store状态同步、CSS样式补充、空状态/错误状态覆盖
    status: completed
    dependencies:
      - f01-f05-drafts
      - f06-f09-review
      - f11-f12-admin
      - f13-version
      - f14-f15-f17-search
      - f18-f20-interaction
      - f22-f25-lifecycle
---

## 用户需求

在现有 knowdo-frontend 代码基础上，完成需求文档中**除权限管理、AI增强、用户认证之外**的所有未实现功能，共 18 个功能点，涉及 6 个新页面和 8 个文件修改。

## 产品概述

知行 KnowDo 企业级 AI 知识库平台，需补齐知识创建增强、审核发布流程、分类标签管理、版本管理、检索增强、互动增强、知识生命周期管理六大模块。

## 核心功能

### 模块一：知识创建增强

- **F-01 添加音频类型**：TYPE_OPTIONS 新增 "音频"（audio），知识浏览页筛选器补齐，使用 SoundOutlined 图标
- **F-05 草稿自动保存与草稿箱**：编辑器内 useEffect 每30秒自动保存到 localStorage，新建 `/drafts` 草稿箱页面，支持恢复编辑和删除

### 模块二：审核发布流程

- **F-06/F-07 审核页面**：新建 `/review` 页面，左侧待审核列表（REVIEW_QUEUE），右侧审核操作界面（知识预览 + AI评估结果 + 通过/驳回/退回修改按钮 + 审批意见输入）
- **F-08 自动发布**：审核通过后 status 变更为 published，生成通知，版本号递增
- **F-09 通知模板**：站内消息格式化（标题+分类+摘要前100字+跳转链接）

### 模块三：分类标签版本管理

- **F-11 分类管理**：新建 `/categories` 页面，antd Tree 三级树形展示，支持新增子节点、编辑名称、删除（校验无子节点/关联知识）、拖拽排序
- **F-12 标签管理**：新建 `/tags` 页面，Table 展示标签库，支持新增（名称+颜色选择+分组）、编辑、删除、使用次数统计
- **F-13 版本管理**：知识详情页增加版本历史 Tab，展示版本列表，支持查看历史内容和回滚操作

### 模块四：检索增强

- **F-14 关键词高亮**：搜索结果 title/summary 中匹配关键词用 <mark> 标签高亮
- **F-15 悬停预览**：KnowledgeCard 添加 onMouseEnter/Leave 事件，Popover 浮窗显示正文前200字
- **F-17 搜索历史**：搜索框 focus 时显示最近5条记录（localStorage），点击复用，支持删除和清空

### 模块五：互动增强

- **F-18 二维码分享**：详情页分享 Modal，Tab 切换链接/二维码，qrcode.react 生成二维码
- **F-19 评论持久化**：评论发布时更新 store 中 knowledge.comments，@提及检测与高亮，管理员删除评论
- **F-20 收藏夹管理**：新建 `/favorites` 页面，支持创建/重命名/删除收藏夹，知识加入收藏夹

### 模块六：知识生命周期管理

- **F-22 编辑流程**：KnowledgeCreate 处理 `?edit=id`，回填原内容，修改后重新提交审核
- **F-23 有效期管理**：详情页到期提醒横幅，浏览页过滤已过期/归档知识，自动过期检查
- **F-24 知识归档**：详情页归档/解除归档按钮，归档后前台隐藏
- **F-25 回收站**：新建 `/recycle` 页面，30天倒计时，支持恢复和永久删除

## 技术栈

- 框架：React 19 + TypeScript 6.0
- 构建：Vite 6
- UI：Ant Design 6 + @ant-design/icons
- 样式：Tailwind CSS 4 + 现有 CSS 变量体系
- 路由：React Router 7
- 状态：Zustand 5（扩展现有 useAppStore）
- 富文本：TipTap 3（已有完整工具栏扩展）
- 二维码：qrcode.react（需安装）
- 数据：localStorage + 现有 mock 数据层

## 实现策略

### 总体思路

采用 **最小侵入式增量开发** 策略：

1. Store 层先行扩展（新增 state/actions），确保所有新页面和功能的数据通路畅通
2. 每个模块独立实现，优先完成依赖少的模块，逐步推进
3. 新页面遵循现有页面组件模式和 CSS 变量约定
4. 所有 mock 数据操作通过 store actions 统一管理，预留真实 API 切换点

### 关键设计决策

- **草稿保存**：使用 localStorage 而非 store，支持跨会话持久化，格式 `drafts:[{id,title,type,data,updatedAt}]`
- **审核流程**：新建独立 `/review` 页面，审核操作通过 `updateKnowledge` action 更新状态
- **版本管理**：知识对象新增 `versions: KnowledgeVersion[]` 数组字段，存储历史版本快照
- **回收站**：软删除标记 `deletedAt` 字段，回收站页面按时间倒序展示，30天后物理移除
- **搜索历史**：localStorage key `search_history`，数组格式，最多保存50条
- **有效期检查**：页面加载时 `useMemo` 遍历过滤已过期和已归档知识

### 架构分层

```
App (路由层)
├── /drafts         → DraftsPage (新)
├── /review         → ReviewPage (新)
├── /categories     → CategoriesPage (新)
├── /tags           → TagsPage (新)
├── /favorites      → FavoritesPage (新)
├── /recycle        → RecyclePage (新)
├── /create?edit=id → KnowledgeCreate (改造)
├── /detail/:id     → KnowledgeDetail (改造)
├── /browse         → KnowledgeBrowse (改造)
└── /               → Home (不改)

Store (状态层)
└── useAppStore (扩展)
    ├── reviewQueue, drafts (新增状态)
    ├── favoriteFolders, deletedKnowledge (新增状态)
    ├── addComment, deleteComment (新增动作)
    ├── archiveKnowledge, restoreFromRecycle (新增动作)
    └── updateCategory, addTag, rollbackVersion (新增动作)

Components (组件层)
├── common/
│   ├── HighlightText (新) - 关键词高亮
│   ├── HoverPreview (新) - 悬停预览浮窗
│   └── ShareModal (新) - 分享弹窗
└── layout/
    └── AppLayout (改造) - 导航栏增加审核/回收站入口
```

### 数据流

```
用户操作 → Page Component → Store Action → State Update → Re-render

示例: 审核通过
ReviewPage "通过"按钮 → updateKnowledge(id, {status:'published'}) 
→ store 更新 knowledgeList → 通知组件监测到 status 变更 → 自动生成通知
```

## 实现注意事项

### 性能

- 知识列表过滤/排序继续使用 `useMemo` 缓存
- CategoryTree `React.memo` 防止不必要重渲染
- 悬停预览使用 `onMouseEnter/Leave` + 绝对定位，避免全局 mousemove
- 搜索高亮使用正则替换，仅在渲染时执行，不修改原数据

### Store 扩展原则

- 所有新增 state 和 actions 在现有 useAppStore 中追加，不创建新 store
- 保持现有 action 签名不变，确保已有页面不受影响
- `updateKnowledge` 扩充为通用知识状态管理入口

### 类型安全

- 新增类型：`KnowledgeVersion`、`DraftItem`、`FavoriteFolder`、`DeletedKnowledge`
- `Knowledge` 接口新增 `versions?: KnowledgeVersion[]`、`deletedAt?: string`、`folderId?: string`
- 所有新组件 Props 严格类型化

### 依赖安装

- 需要安装 `qrcode.react` 用于二维码生成（`npm install qrcode.react`）

## 设计风格

沿用现有企业级专业风格：深蓝顶部导航 + 浅灰页面底色 + 白色卡片布局。新增页面严格遵循现有的 CSS 变量体系（--primary、--bg-page、--text-primary 等），使用 Ant Design 6 组件保持交互一致性。

## 新增页面设计

### 1. 审核页面（/review）

- 左右布局：左侧 320px 审核队列列表，右侧审核操作区
- 队列列表：卡片式，显示标题、作者、部门、提交时间、AI评分
- 审核操作区：上方知识预览（标题/正文/附件），下方 AI 评估结果面板（得分 + 问题列表），底部操作栏（通过绿色/驳回红色/退回橙色 + 审批意见 TextArea）

### 2. 草稿箱（/drafts）

- 卡片列表展示，每张卡显示标题、创建时间、知识类型标签
- 操作按钮：继续编辑（跳转 /create?edit=id&draft=true）、删除（二次确认）
- 空状态显示 "暂无草稿"

### 3. 分类管理（/categories）

- antd Tree 组件展示三级分类，每项右侧悬浮操作按钮（+添加子分类/编辑/删除）
- 顶部 "添加一级分类" 按钮
- 拖拽排序使用 antd Tree 的 draggable + onDrop 属性

### 4. 标签管理（/tags）

- antd Table 展示标签列表（名称、颜色、分组、使用次数、操作）
- 新增标签 Modal 包含：名称 Input、颜色 Select（5色预设）、分组 Input
- 颜色列用 Colored Tag 组件展示

### 5. 回收站（/recycle）

- 表格展示（知识标题、类型、删除时间、剩余天数、操作）
- 剩余天数用倒计时格式（如 "剩余 12 天"），临近3天红色高亮
- 操作列：恢复按钮、永久删除按钮（红色 + 二次确认）

### 6. 收藏夹（/favorites）

- 顶部 Select 切换收藏夹 + "新建收藏夹" 按钮
- 下方知识卡片网格（复用 KnowledgeCard 组件）
- 每张卡片额外显示所在收藏夹名称