# 知识库详情页 UI 优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 优化知识库详情页（`/detail/:id`）的 UI/UX，包括头部紧凑布局、文档卡片增强、分段策略配置、召回测试界面精简。

**Architecture:** 保持现有两栏布局（侧边栏 + 内容区），在现有组件函数内优化，不拆分文件。涉及 3 个文件：`KnowledgeDetail/index.tsx`、`global.css`、`store/index.ts`。

**Tech Stack:** React 19 / TypeScript 6 / Ant Design 6 / Tailwind CSS 4

---

### Task 1: 头部区域重构（紧凑布局 + 统计条）

**Files:**
- Modify: `src/pages/KnowledgeDetail/index.tsx:385-422`
- Modify: `src/styles/global.css`（新增统计条样式）

- [ ] **Step 1: 更新 CSS - 新增统计条和头部紧凑样式**

在 `src/styles/global.css` 的 `.detail-header-gradient` 区块后追加：

```css
/* 头部统计条 */
.detail-header-stats {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}
.detail-header-stat-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.detail-header-stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}
.detail-header-stat-label {
  font-size: 12px;
  color: var(--text-muted);
}
.detail-header-stat-divider {
  width: 1px;
  height: 20px;
  background: #e2e8f0;
}
```

- [ ] **Step 2: 重构 KnowledgeDetail 的 Header 部分**

将 `index.tsx:387-422` 的头部 JSX 替换为紧凑布局：

```tsx
{/* Header */}
<div className="detail-header-gradient">
  <div className="detail-header-top" style={{ marginBottom: 0 }}>
    <Button type="text" size="small" onClick={() => navigate('/browse')} style={{ marginRight: 4 }}>← 返回</Button>
    <span className="detail-header-title">{dataset.name}</span>
    <Tag color={isWebType ? 'green' : isFeishuType ? 'purple' : 'blue'} style={{ marginRight: 4 }}>
      {isWebType ? 'Web 站点' : isFeishuType ? '飞书文档' : '通用型'}
    </Tag>
    <Tag color={dataset.status === 'completed' ? 'success' : dataset.status === 'processing' ? 'processing' : 'default'}>
      {statusLabel[dataset.status]}
    </Tag>
    <div className="flex-1" />
    <Space size="small">
      <Button size="small" icon={<TeamOutlined />} onClick={() => setAuthModalVisible(true)}>资源授权</Button>
      <Button size="small" icon={<LinkOutlined />} onClick={() => setRelatedModalVisible(true)}>关联资源</Button>
    </Space>
  </div>
  <div className="detail-header-desc" style={{ marginTop: 8 }}>{dataset.description}</div>
  {/* 统计条 */}
  <div className="detail-header-stats">
    <div className="detail-header-stat-item">
      <span className="detail-header-stat-value">{articleCount}</span>
      <span className="detail-header-stat-label">知识文章</span>
    </div>
    <div className="detail-header-stat-divider" />
    <div className="detail-header-stat-item">
      <span className="detail-header-stat-value">{dataset.documents.length}</span>
      <span className="detail-header-stat-label">文档</span>
    </div>
    <div className="detail-header-stat-divider" />
    <div className="detail-header-stat-item">
      <span className="detail-header-stat-value">{chunkCount}</span>
      <span className="detail-header-stat-label">分段</span>
    </div>
    <div className="detail-header-stat-divider" />
    <div className="detail-header-stat-item">
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>更新于 {dataset.updatedAt}</span>
    </div>
  </div>
</div>
```

需要从 store 获取统计数据：
- `articleCount` = `knowledgeList.filter(k => k.datasetId === dataset.id).length`
- `chunkCount` = `dataset.documents.reduce((sum, d) => sum + d.chunks.length, 0)`

在 `KnowledgeDetail` 组件函数内（`index.tsx:360` 附近）添加：
```tsx
const knowledgeList = useAppStore((s) => s.knowledgeList);
const articleCount = useMemo(() => knowledgeList.filter(k => k.datasetId === dataset.id).length, [knowledgeList, dataset?.id]);
const chunkCount = useMemo(() => (dataset?.documents || []).reduce((sum, d) => sum + d.chunks.length, 0), [dataset?.documents]);
```

同时删除原有 `detail-header-desc` 和 `detail-header-meta-row` 引用（第 403-421 行，特别是 tags、webUrl、feishuAppId 展示部分）。

- [ ] **Step 3: 验证**

运行 `npm run lint`，访问 `/detail/1` 确认：
- 名称、类型标签、状态徽标在一行
- 资源授权/关联资源按钮在右侧
- 描述文字在第二行
- 底部有统计条（文章数、文档数、分段数、更新时间）

---

### Task 2: 文档卡片增强

**Files:**
- Modify: `src/pages/KnowledgeDetail/index.tsx:30-123`（ArticleListPanel）
- Modify: `src/styles/global.css`（卡片交互样式）

- [ ] **Step 1: 更新 CSS - 卡片操作菜单和交互样式**

在 `global.css` 的 `.kc-meta-right` 样式后追加：

```css
/* 知识卡片增强 */
.knowledge-card {
  position: relative;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.knowledge-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  border-color: var(--primary-light);
}
.kc-card-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 2;
}
.knowledge-card:hover .kc-card-actions {
  opacity: 1;
}
.kc-card-action-btn {
  background: var(--bg-white);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 2px 8px;
  cursor: pointer;
  font-size: 16px;
  color: var(--text-muted);
  transition: all 0.15s;
  line-height: 1.6;
}
.kc-card-action-btn:hover {
  background: #f1f5f9;
  color: var(--text-primary);
  border-color: #cbd5e1;
}
.kc-card-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.kc-card-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  background: #eff6ff;
  color: #2563eb;
}
.kc-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-muted);
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
}
.kc-card-footer-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.kc-card-footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

- [ ] **Step 2: 重构文章卡片 JSX**

将 `index.tsx:91-117` 的卡片内容替换为：

```tsx
{articles.map((item) => (
  <div key={item.id} className="knowledge-card" onClick={() => navigate(`/article/${item.id}`)}>
    <span className={`kc-type-badge ${item.type}`}>
      {TYPE_ICONS[item.type] || '📄'} {item.typeLabel}
    </span>
    <div className="kc-card-actions">
      <Dropdown
        menu={{
          items: [
            { key: 'edit', icon: <EditOutlined />, label: '编辑', onClick: (e) => { e.domEvent.stopPropagation(); navigate(`/create?edit=${item.id}`); } },
            { key: 'archive', icon: <FolderOutlined />, label: '归档', onClick: (e) => { e.domEvent.stopPropagation(); archiveKnowledge(item.id); message.success('已归档'); } },
            { key: 'copy', icon: <LinkOutlined />, label: '复制链接', onClick: (e) => { e.domEvent.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/article/${item.id}`); message.success('链接已复制'); } },
            { type: 'divider' as const },
            { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true, onClick: (e) => { e.domEvent.stopPropagation(); deleteKnowledge(item.id); message.success('已删除'); } },
          ],
        }}
        trigger={['click']}
        placement="bottomRight"
      >
        <span className="kc-card-action-btn" onClick={(e) => e.stopPropagation()}>⋮</span>
      </Dropdown>
    </div>
    <div className="kc-title">{item.title}</div>
    <div className="kc-summary">{item.summary}</div>
    {(item.tags || []).slice(0, 3).length > 0 && (
      <div className="kc-card-tags">
        {(item.tags || []).slice(0, 3).map((tag) => (
          <span key={tag} className="kc-card-tag">{tag}</span>
        ))}
      </div>
    )}
    <div className="kc-card-footer">
      <div className="kc-card-footer-left">
        <span>👤 {item.author}</span>
        <span>{formatTime(item.publishTime)}</span>
      </div>
      <div className="kc-card-footer-right">
        <span>👁 {formatCount(item.viewCount)}</span>
        <span>💬 {item.commentCount}</span>
      </div>
    </div>
  </div>
))}
```

同时更新 import 添加所需图标和 Dropdown：
```tsx
import { Button, message, Typography, Tag, Space, Input, Segmented, Select, Slider, Form, Popconfirm, Dropdown } from 'antd';
import {
  SearchOutlined, AppstoreOutlined, UnorderedListOutlined,
  PlusOutlined, DeleteOutlined, FileTextOutlined,
  DatabaseOutlined, TeamOutlined, LinkOutlined, SettingOutlined,
  ThunderboltOutlined, DownloadOutlined, ExportOutlined,
  GlobalOutlined, EditOutlined, FolderOutlined,
} from '@ant-design/icons';
```

在 `ArticleListPanel` 内添加 store actions：
```tsx
const archiveKnowledge = useAppStore((s) => s.archiveKnowledge);
const deleteKnowledge = useAppStore((s) => s.deleteKnowledge);
```

- [ ] **Step 3: 验证**

运行 `npm run lint`，访问 `/detail/1` 确认：
- hover 卡片有上浮效果
- 右上角显示 ⋮ 按钮，点击弹出操作菜单
- 卡片底部显示作者、时间、阅读量
- 编辑/归档/复制链接/删除功能可触发

---

### Task 3: 召回测试界面精简

**Files:**
- Modify: `src/pages/KnowledgeDetail/index.tsx:126-228`（RecallTestPanel）

- [ ] **Step 1: 精简召回测试面板 JSX**

将 `index.tsx:149-227` 替换为：

```tsx
return (
  <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden" style={{ padding: 24 }}>
    {/* 输入行 */}
    <div className="flex gap-2 mb-3">
      <Input
        placeholder="输入测试查询语句..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onPressEnter={handleTest}
        style={{ flex: 1 }}
      />
      <Button type="primary" icon={<SearchOutlined />} onClick={handleTest}>测试</Button>
    </div>
    {/* 参数行 */}
    <div className="flex items-center gap-4 px-3 py-2 bg-white rounded-lg mb-4" style={{ border: '1px solid #f1f5f9' }}>
      <div className="flex items-center gap-2">
        <Text style={{ fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>TopK</Text>
        <Select
          value={topK}
          onChange={setTopK}
          size="small"
          style={{ width: 64 }}
          options={[1,3,5,10,15,20].map(v => ({ value: v, label: String(v) }))}
        />
      </div>
      <div style={{ width: 1, height: 16, background: '#e2e8f0' }} />
      <div className="flex items-center gap-2">
        <Text style={{ fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>检索模式</Text>
        <Select
          value={searchMode}
          onChange={setSearchMode}
          size="small"
          style={{ width: 110 }}
          options={[
            { value: 'vector', label: '向量检索' },
            { value: 'keyword', label: '关键词检索' },
            { value: 'hybrid', label: '混合检索' },
          ]}
        />
      </div>
      {tested && (
        <>
          <div style={{ width: 1, height: 16, background: '#e2e8f0' }} />
          <Text style={{ fontSize: 12, color: '#94a3b8' }}>找到 {results.length} 条相关结果</Text>
        </>
      )}
    </div>

    {/* 结果区 */}
    {tested ? (
      <div className="flex-1 overflow-auto" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {results.map((r, i) => (
          <div key={i} className="bg-white rounded-lg" style={{ padding: 14, border: '1px solid #f1f5f9' }}>
            <div className="flex items-center gap-2 mb-2">
              <span style={{ fontWeight: 500, fontSize: 13 }}>{r.source}</span>
              {r.score > 0.8 ? (
                <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                  {(r.score * 100).toFixed(0)}%
                </span>
              ) : r.score > 0.6 ? (
                <span style={{ background: '#fef3c7', color: '#d97706', padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                  {(r.score * 100).toFixed(0)}%
                </span>
              ) : (
                <span style={{ background: '#f1f5f9', color: '#475569', padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                  {(r.score * 100).toFixed(0)}%
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ width: 4, borderRadius: 2, background: r.score > 0.8 ? '#22c55e' : r.score > 0.6 ? '#f59e0b' : '#94a3b8', flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{r.content}</div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <SearchOutlined style={{ fontSize: 32 }} />
          <p className="mt-2 text-sm">输入查询语句并点击"测试"开始召回测试</p>
        </div>
      </div>
    )}
  </div>
);
```

删除 `index.tsx` 中的 `Paragraph` 引用（第 212 行）。

- [ ] **Step 2: 验证**

访问 `/detail/1`，切换到「召回测试」面板：
- 输入框 + 测试按钮 在一行
- 参数行紧凑排列（TopK Select + 检索模式 Select）
- 测试后结果展示有分数颜色编码和内容摘要
- 空状态有引导提示

---

### Task 4: 设置面板 - 分段策略配置

**Files:**
- Modify: `src/pages/KnowledgeDetail/index.tsx:231-353`（SettingsPanel）
- Modify: `src/styles/global.css`（分段策略配置样式）

- [ ] **Step 1: 更新 CSS - 分段策略样式**

追加到 `global.css`：

```css
/* 分段策略配置 */
.chunk-strategy-panel {
  background: var(--bg-white);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
}
.chunk-mode-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}
.chunk-mode-option {
  flex: 1;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 12px 16px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}
.chunk-mode-option:hover {
  border-color: var(--primary-light);
  background: #f8fafc;
}
.chunk-mode-option.active {
  border-color: var(--primary);
  background: #eff6ff;
  box-shadow: 0 0 0 1px var(--primary);
}
.chunk-mode-option-label {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 2px;
}
.chunk-mode-option-desc {
  font-size: 11px;
  color: var(--text-muted);
}
.chunk-param-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.chunk-param-label {
  font-size: 12px;
  color: var(--text-secondary);
}
.chunk-param-value {
  font-size: 12px;
  color: var(--primary);
  font-weight: 600;
}
.chunk-slider {
  margin-bottom: 16px;
}
.chunk-preview {
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 16px;
  background: #f8fafc;
}
.chunk-preview-title {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
}
.chunk-preview-item {
  padding: 8px 0;
  border-bottom: 1px dashed #e2e8f0;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}
.chunk-preview-item:last-child {
  border-bottom: none;
}
.chunk-preview-index {
  color: var(--primary);
  font-weight: 500;
}
```

- [ ] **Step 2: 在 SettingsPanel 中添加分段策略配置区域**

在 `index.tsx` 的 SettingsPanel 中，`知识库信息` 卡片和 `操作` 卡片之间（第 336 行之后）插入：

```tsx
{/* 分段策略配置 */}
<div className="bg-white rounded-lg p-6 shadow-sm mb-4">
  <Text strong className="block text-base mb-4">分段策略</Text>
  
  {/* 模式选择 */}
  <div className="chunk-mode-selector">
    {[
      { key: 'smart', label: '🤖 智能分段', desc: '自动优化分段参数' },
      { key: 'advanced', label: '🔧 高级分段', desc: '自定义分段参数' },
      { key: 'qa', label: '💬 QA 问答对', desc: '问答模式分段' },
    ].map((mode) => (
      <div
        key={mode.key}
        className={`chunk-mode-option ${chunkMode === mode.key ? 'active' : ''}`}
        onClick={() => setChunkMode(mode.key as ChunkMode)}
      >
        <div className="chunk-mode-option-label">{mode.label}</div>
        <div className="chunk-mode-option-desc">{mode.desc}</div>
      </div>
    ))}
  </div>

  {/* 参数区 */}
  {chunkMode === 'smart' && (
    <>
      <div className="chunk-param-row">
        <span className="chunk-param-label">最大分段字符数</span>
        <span className="chunk-param-value">{maxChars}</span>
      </div>
      <Slider className="chunk-slider" min={256} max={2048} step={128} value={maxChars} onChange={setMaxChars} />
      <div className="chunk-param-row">
        <span className="chunk-param-label">分段重叠字符数</span>
        <span className="chunk-param-value">{overlap}</span>
      </div>
      <Slider className="chunk-slider" min={0} max={512} step={64} value={overlap} onChange={setOverlap} />
    </>
  )}

  {/* 预览区域 */}
  {dataset.documents.length > 0 && (
    <div className="chunk-preview">
      <div className="chunk-preview-title">分段预览（前 3 段）</div>
      {dataset.documents.slice(0, 1).map(doc => (
        doc.chunks.slice(0, 3).map(chunk => (
          <div key={chunk.id} className="chunk-preview-item">
            <span className="chunk-preview-index">分段 {chunk.index}</span> {chunk.content.substring(0, 60)}...
          </div>
        ))
      ))}
    </div>
  )}
</div>
```

在 SettingsPanel 函数顶部添加 state：
```tsx
const datasetChunkStrategy = dataset.chunkStrategy;
const [chunkMode, setChunkMode] = useState<ChunkMode>(datasetChunkStrategy?.mode || 'smart');
const [maxChars, setMaxChars] = useState(datasetChunkStrategy?.maxCharsPerChunk || 1024);
const [overlap, setOverlap] = useState(datasetChunkStrategy?.overlap || 256);
```

添加 import 更新：不需要额外 import。

- [ ] **Step 3: 保存策略配置**

在 `handleSave` 中添加 chunk 策略保存（在 `index.tsx:251` 的 `updateDataset` 调用中加）：

```tsx
const handleSave = () => {
  if (!name.trim()) { message.warning('名称不能为空'); return; }
  updateDataset(dataset.id, {
    name: name.trim(),
    description: description.trim(),
    chunkStrategy: { mode: chunkMode, maxCharsPerChunk: maxChars, overlap },
  });
  message.success('设置已保存');
  setEditing(false);
};
```

- [ ] **Step 4: 验证**

访问 `/detail/1`，切换到「设置」面板：
- 显示「分段策略」配置卡片
- 三种模式可切换（智能/高级/QA）
- 智能模式下显示滑块参数
- 预览区域显示文档分段摘录
- 保存时策略配置被更新

---

### 验证总结

1. `cd knowdo-frontend && npm run lint` — 无新错误
2. 访问 `/detail/1` — 头部紧凑布局 + 统计条
3. 切换侧边栏「文档」— 卡片 hover 上浮 + ⋮ 操作菜单
4. 切换侧边栏「召回测试」— 输入+按钮一行，参数行紧凑
5. 切换侧边栏「设置」— 分段策略配置区域
6. 浏览器控制台无 React 告警
