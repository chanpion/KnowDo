import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Select, Button, Segmented, Popover, Dropdown, Modal, message } from 'antd';
import { SearchOutlined, AppstoreOutlined, UnorderedListOutlined, MoreOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store';
import { formatCount, formatTime } from '@/mock/data';
import type { Knowledge, CategoryNode } from '@/types';

type ViewMode = 'grid' | 'list';
type SortBy = 'time' | 'views' | 'likes';

const TYPE_ICONS: Record<string, string> = { doc: '📄', image: '🖼️', video: '🎬', audio: '🎵', link: '🔗', qa: '❓' };

// 关键词高亮组件
function HighlightText({ text, keyword }: { text: string; keyword: string }) {
  if (!keyword.trim()) return <>{text}</>;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === keyword.toLowerCase()
          ? <mark key={i} style={{ background: '#fde68a', padding: '0 2px', borderRadius: 2 }}>{part}</mark>
          : part
      )}
    </>
  );
}

// 搜索历史管理
function getSearchHistory(): string[] {
  return JSON.parse(localStorage.getItem('knowdo_search_history') || '[]');
}
function addSearchHistory(term: string) {
  const history = getSearchHistory().filter(h => h !== term);
  history.unshift(term);
  localStorage.setItem('knowdo_search_history', JSON.stringify(history.slice(0, 50)));
}
function clearSearchHistory() {
  localStorage.removeItem('knowdo_search_history');
}

function CategoryTreeItem({ node, selectedId, onSelect, depth = 0, onAdd, onEdit, onDelete, isAdmin }: {
  node: CategoryNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
  depth?: number;
  onAdd: (parentId: string) => void;
  onEdit: (id: string, currentName: string) => void;
  onDelete: (id: string, name: string) => void;
  isAdmin: boolean;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = node.children && node.children.length > 0;

  const menuItems = [
    ...(depth < 2 ? [{ key: 'add', label: '添加子分类', icon: <PlusOutlined /> }] : []),
    { key: 'edit', label: '编辑名称', icon: <EditOutlined /> },
    { key: 'delete', label: '删除分类', icon: <DeleteOutlined />, danger: true },
  ];

  return (
    <div className="tree-node">
      <div
        className={`node-label ${selectedId === node.id ? 'active' : ''}`}
        style={{ paddingLeft: 10 + depth * 18 }}
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          onSelect(node.id);
        }}
      >
        {hasChildren && (
          <span className={`expand-icon ${expanded ? 'expanded' : ''}`}>▶</span>
        )}
        {!hasChildren && <span style={{ width: 14 }} />}
        {node.icon && <span className="node-icon">{node.icon}</span>}
        <span style={{ flex: 1 }}>{node.name}</span>
        {isAdmin && (
          <Dropdown
            menu={{
              items: menuItems,
              onClick: ({ key, domEvent }) => {
                domEvent.stopPropagation();
                if (key === 'add') onAdd(node.id);
                if (key === 'edit') onEdit(node.id, node.name);
                if (key === 'delete') onDelete(node.id, node.name);
              },
            }}
            trigger={['click']}
          >
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              onClick={e => e.stopPropagation()}
              style={{ visibility: 'visible', opacity: 0.4, marginLeft: 'auto' }}
            />
          </Dropdown>
        )}
      </div>
      {hasChildren && expanded && node.children!.map(child => (
        <CategoryTreeItem
          key={child.id}
          node={child}
          selectedId={selectedId}
          onSelect={onSelect}
          depth={depth + 1}
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
}

function KnowledgeCard({ item, viewMode, searchKeyword, onLike, onFavorite }: {
  item: Knowledge;
  viewMode: ViewMode;
  searchKeyword: string;
  onLike: (id: string) => void;
  onFavorite: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => setShowPreview(true), 800);
  };
  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowPreview(false);
  };

  if (viewMode === 'list') {
    return (
      <div className="knowledge-card list-view" onClick={() => navigate(`/detail/${item.id}`)}>
        <span className={`kc-type-badge ${item.type}`}>
          {TYPE_ICONS[item.type] || '📄'} {item.typeLabel}
        </span>
        <div className="kc-content">
          <div className="kc-title" style={{ WebkitLineClamp: 1 }}>
            <HighlightText text={item.title} keyword={searchKeyword} />
          </div>
          <div className="kc-summary" style={{ WebkitLineClamp: 1 }}>
            <HighlightText text={item.summary} keyword={searchKeyword} />
          </div>
          <div className="kc-tags">
            {(item.tags || []).slice(0, 3).map(tag => (
              <span key={tag} className="tag tag-blue">{tag}</span>
            ))}
          </div>
        </div>
        <div className="kc-meta" onClick={e => e.stopPropagation()}>
          <span style={{ marginRight: 12 }}>👤 {item.author}</span>
          <span style={{ marginRight: 12 }}>{formatTime(item.publishTime)}</span>
          <span className="kc-stat" onClick={() => onLike(item.id)}>
            {item.isLiked ? '❤️' : '🤍'} {formatCount(item.likeCount)}
          </span>
          <span className="kc-stat">👁 {formatCount(item.viewCount)}</span>
          <span className="kc-stat" onClick={() => onFavorite(item.id)}>
            {item.isFavorited ? '⭐' : '☆'} {formatCount(item.favoriteCount)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <Popover
      content={
        <div style={{ maxWidth: 360 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{item.title}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {item.content.substring(0, 200)}{item.content.length > 200 && '...'}
          </div>
        </div>
      }
      title={null}
      trigger="hover"
      mouseEnterDelay={0.8}
    >
      <div className="knowledge-card" onClick={() => navigate(`/detail/${item.id}`)}>
        <span className={`kc-type-badge ${item.type}`}>
          {TYPE_ICONS[item.type] || '📄'} {item.typeLabel}
        </span>
        <div className="kc-title">
          <HighlightText text={item.title} keyword={searchKeyword} />
        </div>
        <div className="kc-summary">
          <HighlightText text={item.summary} keyword={searchKeyword} />
        </div>
        <div className="kc-tags">
          {(item.tags || []).slice(0, 3).map(tag => (
            <span key={tag} className="tag tag-blue">{tag}</span>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>📂 {item.category}</div>
        <div className="kc-meta" onClick={e => e.stopPropagation()}>
          <div className="kc-meta-left">
            <span>👤 {item.author}</span>
            <span>{formatTime(item.publishTime)}</span>
          </div>
          <div className="kc-meta-right">
            <span className="kc-stat" onClick={() => onLike(item.id)}>
              {item.isLiked ? '❤️' : '🤍'} {formatCount(item.likeCount)}
            </span>
            <span className="kc-stat">👁 {formatCount(item.viewCount)}</span>
            <span className="kc-stat" onClick={() => onFavorite(item.id)}>
              {item.isFavorited ? '⭐' : '☆'} {formatCount(item.favoriteCount)}
            </span>
          </div>
        </div>
      </div>
    </Popover>
  );
}

export default function KnowledgeBrowse() {
  const navigate = useNavigate();
  const { knowledgeList, categoryTree, toggleLike, toggleFavorite, addCategory, updateCategory, deleteCategory, user } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('time');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(getSearchHistory());

  // 分类管理弹窗
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [categoryFormParentId, setCategoryFormParentId] = useState<string | null>(null);
  const [categoryFormId, setCategoryFormId] = useState<string>('');
  const [categoryFormName, setCategoryFormName] = useState('');

  const isAdmin = user.role === 'admin';

  const handleSearch = (value: string) => {
    setSearch(value);
    if (value.trim()) {
      addSearchHistory(value.trim());
      setSearchHistory(getSearchHistory());
    }
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setSearchHistory([]);
    message.success('搜索历史已清空');
  };

  // 分类管理操作
  const handleAddCategory = (parentId: string | null) => {
    setCategoryFormParentId(parentId);
    setCategoryFormName('');
    setAddModalVisible(true);
  };

  const handleEditCategory = (id: string, currentName: string) => {
    setCategoryFormId(id);
    setCategoryFormName(currentName);
    setEditModalVisible(true);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    const ok = deleteCategory(id);
    if (!ok) {
      message.warning(`"${name}" 下存在子分类或关联知识，无法删除`);
    } else {
      message.success('分类已删除');
    }
  };

  const confirmAddCategory = () => {
    if (!categoryFormName.trim()) return;
    addCategory(categoryFormParentId, categoryFormName.trim());
    message.success('分类已添加');
    setAddModalVisible(false);
  };

  const confirmEditCategory = () => {
    if (!categoryFormName.trim()) return;
    updateCategory(categoryFormId, categoryFormName.trim());
    message.success('分类名称已更新');
    setEditModalVisible(false);
  };

  const filteredList = useMemo(() => {
    let list = knowledgeList.filter(k =>
      k.status === 'published' // 只显示已发布的知识，排除草稿/已过期/已归档
    );

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(k =>
        k.title.toLowerCase().includes(s) ||
        k.summary.toLowerCase().includes(s) ||
        k.tags.some(t => t.toLowerCase().includes(s))
      );
    }

    if (selectedCategory) {
      list = list.filter(k => k.categoryId === selectedCategory || k.categoryId.startsWith(selectedCategory));
    }

    if (selectedType) {
      list = list.filter(k => k.type === selectedType);
    }

    if (sortBy === 'time') {
      list.sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime());
    } else if (sortBy === 'views') {
      list.sort((a, b) => b.viewCount - a.viewCount);
    } else if (sortBy === 'likes') {
      list.sort((a, b) => b.likeCount - a.likeCount);
    }

    return list;
  }, [knowledgeList, search, selectedCategory, sortBy, selectedType]);

  return (
    <div className="page-container">
      <div className="breadcrumb">
        <a href="/">首页</a>
        <span className="separator">›</span>
        <span>知识库</span>
      </div>
      <h1 className="page-title">📚 知识库</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 }}>
        {/* 左侧分类 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="category-tree">
            <div style={{ padding: '8px 10px', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📂 知识分类</span>
              {isAdmin && (
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => handleAddCategory(null)}
                  title="添加一级分类"
                />
              )}
            </div>
            {categoryTree.map(node => (
              <CategoryTreeItem
                key={node.id}
                node={node}
                selectedId={selectedCategory}
                onSelect={(id) => setSelectedCategory(selectedCategory === id ? null : id)}
                onAdd={handleAddCategory}
                onEdit={handleEditCategory}
                onDelete={handleDeleteCategory}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </div>

        {/* 右侧内容 */}
        <div>
          {/* 搜索和筛选 */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <Popover
              open={showSearchHistory && searchHistory.length > 0 && !search}
              onOpenChange={setShowSearchHistory}
              content={
                <div style={{ width: 260 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>搜索历史</span>
                    <Button type="link" size="small" onClick={handleClearHistory}>清空</Button>
                  </div>
                  {searchHistory.slice(0, 8).map((term, i) => (
                    <div
                      key={i}
                      style={{ padding: '4px 0', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}
                      onClick={() => { setSearch(term); handleSearch(term); setShowSearchHistory(false); }}
                    >
                      🕐 {term}
                    </div>
                  ))}
                </div>
              }
              trigger="focus"
            >
              <Input
                prefix={<SearchOutlined />}
                placeholder="搜索知识标题、内容、标签..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onPressEnter={() => handleSearch(search)}
                onFocus={() => { setSearchHistory(getSearchHistory()); if (searchHistory.length > 0) setShowSearchHistory(true); }}
                style={{ flex: 1, minWidth: 200 }}
                allowClear
                suffix={
                  search ? (
                    <SearchOutlined style={{ cursor: 'pointer', color: 'var(--primary)' }} onClick={() => handleSearch(search)} />
                  ) : null
                }
              />
            </Popover>
            <Select
              value={selectedType}
              onChange={setSelectedType}
              placeholder="知识类型"
              allowClear
              style={{ width: 130 }}
              options={[
                { value: 'doc', label: '📄 文档' },
                { value: 'image', label: '🖼️ 图片' },
                { value: 'video', label: '🎬 视频' },
                { value: 'audio', label: '🎵 音频' },
                { value: 'link', label: '🔗 链接' },
                { value: 'qa', label: '❓ 问答' },
              ]}
            />
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: 130 }}
              options={[
                { value: 'time', label: '🕐 最新发布' },
                { value: 'views', label: '👁 最多浏览' },
                { value: 'likes', label: '❤️ 最多点赞' },
              ]}
            />
            <Segmented
              value={viewMode}
              onChange={(v) => setViewMode(v as ViewMode)}
              options={[
                { value: 'grid', icon: <AppstoreOutlined /> },
                { value: 'list', icon: <UnorderedListOutlined /> },
              ]}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/create')}>
              创建知识
            </Button>
          </div>

          {/* 结果统计 */}
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            共 {filteredList.length} 条知识
            {selectedCategory && ' · 已筛选分类'}
            {search && ` · 搜索"${search}"`}
          </div>

          {/* 知识列表 */}
          {filteredList.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-text">暂无匹配的知识内容</div>
            </div>
          ) : (
            <div style={{
              display: viewMode === 'grid' ? 'grid' : 'block',
              gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(360px, 1fr))' : undefined,
              gap: 16,
            }}>
              {filteredList.map(item => (
                <KnowledgeCard
                  key={item.id}
                  item={item}
                  viewMode={viewMode}
                  searchKeyword={search}
                  onLike={toggleLike}
                  onFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 添加分类 Modal */}
      <Modal
        title="添加分类"
        open={addModalVisible}
        onOk={confirmAddCategory}
        onCancel={() => setAddModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>分类名称</label>
          <Input
            value={categoryFormName}
            onChange={e => setCategoryFormName(e.target.value)}
            onPressEnter={confirmAddCategory}
            placeholder="请输入分类名称"
          />
        </div>
      </Modal>

      {/* 编辑分类 Modal */}
      <Modal
        title="编辑分类名称"
        open={editModalVisible}
        onOk={confirmEditCategory}
        onCancel={() => setEditModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>新名称</label>
          <Input
            value={categoryFormName}
            onChange={e => setCategoryFormName(e.target.value)}
            onPressEnter={confirmEditCategory}
            placeholder="请输入新的分类名称"
          />
        </div>
      </Modal>
    </div>
  );
}
