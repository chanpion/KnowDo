# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# 开发
cd knowdo-frontend && npm run dev

# 构建
cd knowdo-frontend && npm run build

# 代码检查
cd knowdo-frontend && npm run lint

# 预览构建产物
cd knowdo-frontend && npm run preview
```

## 技术栈

- **框架**: React 19 + TypeScript 6
- **构建**: Vite 8 (with `@vitejs/plugin-react`)
- **UI**: Ant Design 6 (中文 locale, 蓝色主题 `#1a56db`)
- **样式**: Tailwind CSS 4 (Vite plugin 模式) + 全局 CSS
- **路由**: React Router 7 (BrowserRouter)
- **状态管理**: Zustand 5 (单一 store)
- **富文本编辑器**: TipTap 3 (TiptapEditor 组件封装)
- **静态检查**: oxlint (配置在 `.oxlintrc.json`)

## 路径别名

`@` → `src/`（vite.config.ts 配置）

## 项目架构

```
knowdo-frontend/src/
├── main.tsx            # 入口
├── App.tsx             # 路由配置 + Ant Design ConfigProvider
├── pages/              # 页面组件
│   ├── Home/           # 首页仪表盘
│   ├── KnowledgeBrowse/ # 知识浏览与检索
│   ├── KnowledgeCreate/ # 知识创建/编辑（4步向导 + 草稿自动保存）
│   ├── KnowledgeDetail/ # 知识详情（版本历史/评论/分享）
│   ├── ArticleDetail/   # 文章详情（独立文章页）
│   ├── Drafts/         # 草稿箱
│   ├── Review/         # 审核管理（左右布局）
│   ├── Recycle/        # 回收站（30天倒计时）
│   ├── Favorites/      # 收藏夹管理
│   ├── Tags/           # 标签管理
│   ├── ModelConfig/    # AI 模型配置
│   ├── Dataset/        # 知识库列表
│   ├── DatasetCreate/   # 知识库创建（3步向导：类型选择→配置→分段策略）
│   ├── DatasetDetail/   # 知识库详情（文档管理 + 分段查看）
│   └── NotFound/       # 404
├── components/
│   ├── layout/
│   │   └── AppLayout.tsx   # 全局布局：顶部导航 + 用户菜单 + 通知
│   ├── common/
│   │   └── TiptapEditor.tsx # 富文本编辑器封装
│   └── dataset/
│       ├── AuthorizationModal.tsx      # 知识库授权弹窗
│       ├── FolderTree.tsx              # 三级文件夹树
│       ├── ImportModal.tsx             # 导入弹窗
│       └── RelatedResourcesModal.tsx   # 关联资源弹窗
├── store/index.ts      # Zustand 单一 store（~870行）
├── types/index.ts      # 所有 TypeScript 类型定义（~340行）
├── mock/data.ts        # Mock 数据层（~590行）
└── styles/global.css   # 全局样式（含 Tailwind import）
```

## 数据流

```
页面操作 → Page Component → useAppStore Action → State 更新 → UI 重渲染
```

所有状态统一在 `store/index.ts` 的 `useAppStore` 中管理。store 内直接操作内存数据（修改 `knowledgeList`、`datasets` 等），为未来替换为真实 API 请求预留了接口。

## 关键设计约定

1. **单一数据源**: 所有页面通过 `useAppStore` 读写数据，不维护页面级状态；从 store 中导出的函数（如 `getHotKnowledge`）在 `mock/data.ts` 中定义，也基于 store 数据计算。
2. **纯前端 Mock**: 当前无后端，数据在内存中模拟运行。`services/` 和 `hooks/` 目录预留待建设。
3. **类型优先**: 所有实体类型定义在 `types/index.ts`，组件和 store 都引用类型而非直接定义。
4. **组件风格**: 使用 Ant Design 组件 + Tailwind 原子类 + 内联样式组合。页面组件直接在 `pages/XXX/index.tsx` 中实现，不拆分子目录。
5. **知识（Knowledge）vs 知识库（Dataset）**: Knowledge 是知识条目（文章），Dataset 是知识库容器（包含文档 Document）。一个知识条目通过 `datasetId` 关联到知识库。

