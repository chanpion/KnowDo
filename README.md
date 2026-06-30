# 知行 · KnowDo

> 知以致用，行而致远 — 企业级 AI 知识库平台

**KnowDo**（KnowDo = **K**nowledge **N**avigation & **O**rganization with **W**isdom, **D**iscovery and **O**peration）是一站式企业知识管理平台，覆盖知识的**创建 → 审核 → 发布 → 检索 → 互动 → 更新 → 归档**全生命周期。

---

## 技术栈
### 前端

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | React | 19 |
| 语言 | TypeScript | 6.0 |
| 构建 | Vite | 8 |
| UI 组件 | Ant Design | 6 |
| 样式 | Tailwind CSS | 4 |
| 路由 | React Router | 7 |
| 状态管理 | Zustand | 5 |
| 富文本编辑器 | TipTap | 3 |
| 二维码 | qrcode.react | 4 |

---

## 项目结构

```
KnowDo/
├── knowdo-frontend/              # 前端应用
│   ├── src/
│   │   ├── main.tsx              # 应用入口
│   │   ├── App.tsx               # 路由配置
│   │   ├── pages/                # 页面组件（14个页面）
│   │   │   ├── Home/             # 首页仪表盘
│   │   │   ├── KnowledgeBrowse/  # 知识浏览与检索
│   │   │   ├── KnowledgeCreate/  # 知识创建/编辑
│   │   │   ├── KnowledgeDetail/  # 知识详情
│   │   │   ├── Drafts/           # 草稿箱
│   │   │   ├── Review/           # 审核管理
│   │   │   ├── Recycle/          # 回收站
│   │   │   ├── Favorites/        # 我的收藏
│   │   │   ├── Tags/             # 标签管理
│   │   │   ├── Dataset/          # 数据集列表
│   │   │   ├── DatasetCreate/    # 数据集创建
│   │   │   ├── DatasetDetail/    # 数据集详情
│   │   │   ├── ModelConfig/      # 模型配置
│   │   │   └── NotFound/         # 404 页面
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   └── TiptapEditor.tsx   # 富文本编辑器封装
│   │   │   └── layout/
│   │   │       └── AppLayout.tsx      # 全局布局（顶部导航 + 用户菜单）
│   │   ├── store/
│   │   │   └── index.ts          # Zustand 全局状态管理（726行）
│   │   ├── types/
│   │   │   └── index.ts          # TypeScript 类型定义（290行）
│   │   ├── mock/
│   │   │   └── data.ts           # Mock 数据层
│   │   └── styles/
│   │       └── global.css        # 全局样式
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── prototypes/                   # 原型设计文件
├── 企业级AI知识平台.md            # 产品需求文档（PRD）
├── AI实验室V4.docx               # 需求参考文档
└── README.md
```

---

## 功能模块

### 已实现功能

| 模块 | 功能点 | 说明 |
|------|--------|------|
| 知识创建 | 6种类型创建 | 文档/图片/视频/音频/链接/问答 |
| 知识创建 | 富文本编辑 | TipTap 全功能编辑器，支持表格/代码块/图片 |
| 知识创建 | 草稿自动保存 | 每30秒自动保存至 localStorage，草稿箱管理 |
| 知识创建 | AI 辅助创作 | 排版优化/摘要生成/翻译/校对 |
| 审核发布 | 审核流程 | 通过/驳回/退回修改，AI 质量评估参考 |
| 审核发布 | 自动发布 | 审核通过自动发布，版本号递增 |
| 审核发布 | 发布通知 | 站内消息通知模板 |
| 分类标签 | 多级分类 | 三级树形分类，支持增删改 + 拖拽排序 |
| 分类标签 | 标签管理 | 标签库增删改，颜色分组，使用次数统计 |
| 版本管理 | 版本历史 | 历史版本查看，支持回滚操作 |
| 检索浏览 | 多维度检索 | 关键词/分类/标签/类型/时间范围筛选 |
| 检索浏览 | 关键词高亮 | 搜索结果标题/摘要高亮匹配词 |
| 检索浏览 | 悬停预览 | 鼠标悬停显示正文前200字 |
| 检索浏览 | 搜索历史 | 最近搜索记录，localStorage 持久化 |
| 互动 | 评论点赞 | 评论发布/删除，@提及高亮，点赞/取消 |
| 互动 | 二维码分享 | 链接复制 + 二维码生成分享 |
| 互动 | 收藏夹 | 创建/重命名/删除收藏夹，知识移动 |
| 生命周期 | 知识编辑 | 已发布知识发起更新，内容回填 |
| 生命周期 | 有效期管理 | 到期提醒横幅，过期自动过滤 |
| 生命周期 | 知识归档 | 归档/解除归档，归档后前台隐藏 |
| 生命周期 | 回收站 | 30天保留，恢复/永久删除，倒计时提醒 |

### 待实现功能

| 功能 | 说明 |
|------|------|
| 用户认证与 SSO | OAuth 2.0/SAML 2.0 单点登录集成 |
| 权限管理 | SSO 角色映射 + 细粒度权限控制 |
| 后端 API 集成 | 当前为前端 Mock 阶段，`services/` 待建设 |
| 向量化与语义检索 | Embedding + Milvus + Reranker |
| 多模型管理 | LLM/Embedding/Reranker 模型配置与切换 |

---

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装与运行

```bash
# 进入前端目录
cd knowdo-frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

开发服务器默认运行在 `http://localhost:5173`。

### 路由一览

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 知识库仪表盘 |
| `/browse` | 知识浏览 | 分类浏览 + 多维度检索 |
| `/create` | 知识创建 | 4步向导创建（支持 `?edit=id` 编辑模式） |
| `/detail/:id` | 知识详情 | 版本历史/评论/分享 |
| `/drafts` | 草稿箱 | 自动保存的草稿管理 |
| `/review` | 审核管理 | 左右布局审核操作区 |
| `/recycle` | 回收站 | 30天倒计时恢复/删除 |
| `/favorites` | 我的收藏 | 收藏夹分类管理 |
| `/tags` | 标签管理 | 标签库增删改 |
| `/model` | 模型配置 | AI 模型参数管理 |
| `/dataset` | 数据集 | 数据集列表 |
| `/dataset/create` | 创建数据集 | 数据集创建向导 |
| `/dataset/:id` | 数据集详情 | 数据集详情查看 |

---

## 开发说明

### 当前开发阶段

项目处于 **前端原型 / Mock 阶段**，所有数据通过 `src/mock/data.ts` 和 Zustand Store 在内存中模拟运行。`services/` 和 `hooks/` 目录待后端 API 就绪后建设。

### 数据流

```
用户操作 → Page Component → Store Action → State Update → UI 重渲染
```

所有数据操作统一通过 `useAppStore` 管理，预留了真实 API 切换点，后续只需将 Store actions 中的内存操作替换为 HTTP 请求即可。
