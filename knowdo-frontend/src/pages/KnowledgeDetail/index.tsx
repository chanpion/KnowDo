import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, message, Typography, Tag, Space, Input, Segmented, Select, Slider, Form, Popconfirm } from 'antd';
import {
  SearchOutlined, AppstoreOutlined, UnorderedListOutlined,
  PlusOutlined, DeleteOutlined, FileTextOutlined,
  DatabaseOutlined, TeamOutlined, LinkOutlined, SettingOutlined,
  ThunderboltOutlined, DownloadOutlined, ExportOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store';
import { formatCount, formatTime } from '@/mock/data';
import AuthorizationModal from '@/components/dataset/AuthorizationModal';
import RelatedResourcesModal from '@/components/dataset/RelatedResourcesModal';

const { Text, Paragraph } = Typography;

const TYPE_ICONS: Record<string, string> = { doc: '📄', image: '🖼️', video: '🎬', audio: '🎵', link: '🔗', qa: '❓' };

const statusLabel: Record<string, string> = {
  pending: '待处理', processing: '处理中', completed: '已完成', failed: '失败',
};

const SIDEBAR_MENUS = [
  { key: 'articles', label: '文档', icon: '📄' },
  { key: 'recall', label: '召回测试', icon: '🧪' },
  { key: 'settings', label: '设置', icon: '⚙️' },
];

function ArticleListPanel({ datasetId }: { datasetId: string }) {
  const navigate = useNavigate();
  const knowledgeList = useAppStore((s) => s.knowledgeList);
  const datasets = useAppStore((s) => s.datasets);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const dataset = datasets.find((ds) => ds.id === datasetId);

  const articles = useMemo(() => {
    let list = knowledgeList.filter((k) => k.datasetId === datasetId);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((k) =>
        k.title.toLowerCase().includes(s) ||
        k.summary.toLowerCase().includes(s) ||
        k.tags.some((t) => t.toLowerCase().includes(s))
      );
    }
    return list;
  }, [knowledgeList, datasetId, search]);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <Input
          prefix={<SearchOutlined className="text-gray-400" />}
          placeholder="搜索知识标题、内容、标签..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          className="max-w-[200px]"
        />
        <div className="flex-1" />
        <Text type="secondary" className="text-sm">共 {articles.length} 篇知识</Text>
        <Segmented
          value={viewMode}
          onChange={(v) => setViewMode(v as 'grid' | 'list')}
          options={[
            { value: 'grid', icon: <AppstoreOutlined /> },
            { value: 'list', icon: <UnorderedListOutlined /> },
          ]}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`/create/article?dataset=${datasetId}`)}>
          添加
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FileTextOutlined style={{ fontSize: 48 }} />
            <Text type="secondary" className="mt-4">该知识库暂无知识</Text>
            <Button type="primary" className="mt-4" onClick={() => navigate(`/create/article?dataset=${datasetId}`)}>
              添加第一篇知识
            </Button>
          </div>
        ) : (
          <div style={{
            display: viewMode === 'grid' ? 'grid' : 'block',
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(360px, 1fr))' : undefined,
            gap: 16,
          }}>
            {articles.map((item) => (
              <div key={item.id} className="knowledge-card" onClick={() => navigate(`/article/${item.id}`)}>
                <span className={`kc-type-badge ${item.type}`}>
                  {TYPE_ICONS[item.type] || '📄'} {item.typeLabel}
                </span>
                <div className="kc-title">{item.title}</div>
                <div className="kc-summary">{item.summary}</div>
                <div className="kc-tags">
                  {(item.tags || []).slice(0, 3).map((tag) => (
                    <span key={tag} className="tag tag-blue">{tag}</span>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                  📂 {item.category}
                </div>
                <div className="kc-meta" onClick={(e) => e.stopPropagation()}>
                  <div className="kc-meta-left">
                    <span>👤 {item.author}</span>
                    <span>{formatTime(item.publishTime)}</span>
                  </div>
                  <div className="kc-meta-right">
                    <span>👁 {formatCount(item.viewCount)}</span>
                    <span>💬 {item.commentCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Recall Test Panel ----
function RecallTestPanel({ datasetId }: { datasetId: string }) {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(5);
  const [searchMode, setSearchMode] = useState<'vector' | 'keyword' | 'hybrid'>('hybrid');
  const [results, setResults] = useState<{ content: string; score: number; source: string }[]>([]);
  const [tested, setTested] = useState(false);

  const handleTest = () => {
    if (!query.trim()) {
      message.warning('请输入测试查询语句');
      return;
    }
    // Simulate recall results
    const mockResults = [
      { content: '这是与查询相关的第一条分段内容，包含了关键信息点...', score: 0.92, source: '文档1.pdf' },
      { content: '这是与查询相关的第二条分段内容，提供了补充说明...', score: 0.85, source: '文档1.pdf' },
      { content: '这是与查询相关的第三条分段内容，来自不同文档...', score: 0.73, source: '文档2.docx' },
    ];
    setResults(mockResults);
    setTested(true);
    message.success('召回测试完成');
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden p-6">
      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <Text strong className="block mb-3">测试查询</Text>
        <div className="flex gap-3 mb-3">
          <Input.TextArea
            placeholder="输入测试查询语句，模拟用户提问..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={2}
            className="flex-1"
          />
        </div>
        <div className="flex items-center gap-6 mb-3">
          <div className="flex items-center gap-2">
            <Text className="text-sm">Top K:</Text>
            <Slider
              value={topK}
              onChange={setTopK}
              min={1}
              max={20}
              className="w-24"
            />
            <Text className="text-xs text-gray-400">{topK}</Text>
          </div>
          <div className="flex items-center gap-2">
            <Text className="text-sm">检索方式:</Text>
            <Select
              value={searchMode}
              onChange={setSearchMode}
              size="small"
              options={[
                { value: 'vector', label: '向量检索' },
                { value: 'keyword', label: '关键词检索' },
                { value: 'hybrid', label: '混合检索' },
              ]}
              className="w-28"
            />
          </div>
        </div>
        <Button type="primary" icon={<SearchOutlined />} onClick={handleTest}>
          测试
        </Button>
      </div>

      {tested && (
        <div className="flex-1 bg-white rounded-lg shadow-sm overflow-auto">
          <div className="px-4 py-3 border-b border-gray-200">
            <Text strong>召回结果（{results.length} 条）</Text>
          </div>
          {results.map((r, i) => (
            <div key={i} className="p-4 border-b border-gray-100 hover:bg-gray-50">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-gray-400">#{i + 1}</span>
                <span style={{
                  display: 'inline-block', padding: '1px 6px', borderRadius: 4, fontSize: 11,
                  background: r.score > 0.8 ? '#dcfce7' : r.score > 0.6 ? '#fef9c3' : '#f1f5f9',
                  color: r.score > 0.8 ? '#166534' : r.score > 0.6 ? '#854d0e' : '#475569',
                }}>
                  {(r.score * 100).toFixed(0)}%
                </span>
                <Text type="secondary" className="text-xs">{r.source}</Text>
              </div>
              <Paragraph className="!mb-0 text-sm text-gray-700 line-clamp-2">{r.content}</Paragraph>
            </div>
          ))}
        </div>
      )}

      {!tested && (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <SearchOutlined style={{ fontSize: 36 }} />
            <p className="mt-2">输入查询语句并点击"测试"开始召回测试</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Settings Panel ----
function SettingsPanel({ datasetId }: { datasetId: string }) {
  const navigate = useNavigate();
  const datasets = useAppStore((s) => s.datasets);
  const updateDataset = useAppStore((s) => s.updateDataset);
  const deleteDataset = useAppStore((s) => s.deleteDataset);
  const reEmbedDataset = useAppStore((s) => s.reEmbedDataset);
  const exportDatasetAsExcel = useAppStore((s) => s.exportDatasetAsExcel);
  const knowledgeList = useAppStore((s) => s.knowledgeList);

  const dataset = datasets.find((ds) => ds.id === datasetId);
  if (!dataset) return null;

  const articleCount = knowledgeList.filter((k) => k.datasetId === datasetId).length;
  const docCount = dataset.documents.length;
  const chunkCount = dataset.documents.reduce((sum, d) => sum + d.chunks.length, 0);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(dataset.name);
  const [description, setDescription] = useState(dataset.description);

  const handleSave = () => {
    if (!name.trim()) { message.warning('名称不能为空'); return; }
    updateDataset(dataset.id, { name: name.trim(), description: description.trim() });
    message.success('设置已保存');
    setEditing(false);
  };

  const handleDelete = () => {
    deleteDataset(dataset.id);
    message.success('知识库已删除');
    navigate('/browse');
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl">
        <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
          <Text strong className="block text-base mb-4">基本信息</Text>
          {editing ? (
            <div className="space-y-4">
              <div>
                <Text className="text-sm block mb-1">名称</Text>
                <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} />
              </div>
              <div>
                <Text className="text-sm block mb-1">描述</Text>
                <Input.TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <div className="flex gap-2">
                <Button type="primary" onClick={handleSave}>保存</Button>
                <Button onClick={() => { setEditing(false); setName(dataset.name); setDescription(dataset.description); }}>取消</Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-3">
                <Text className="text-sm text-gray-500 block">名称</Text>
                <Text>{dataset.name}</Text>
              </div>
              <div className="mb-3">
                <Text className="text-sm text-gray-500 block">描述</Text>
                <Text>{dataset.description || '暂无描述'}</Text>
              </div>
              <Button onClick={() => setEditing(true)}>编辑</Button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
          <Text strong className="block text-base mb-4">知识库信息</Text>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Text className="text-sm text-gray-500 block">类型</Text>
              <Text>{dataset.type === 'general' ? '通用型' : dataset.type === 'web' ? 'Web 站点' : '飞书文档'}</Text>
            </div>
            <div>
              <Text className="text-sm text-gray-500 block">向量模型</Text>
              <Text>{dataset.vectorModel}</Text>
            </div>
            <div>
              <Text className="text-sm text-gray-500 block">创建时间</Text>
              <Text>{dataset.createdAt}</Text>
            </div>
            <div>
              <Text className="text-sm text-gray-500 block">更新时间</Text>
              <Text>{dataset.updatedAt}</Text>
            </div>
            <div>
              <Text className="text-sm text-gray-500 block">知识文章</Text>
              <Text>{articleCount} 篇</Text>
            </div>
            <div>
              <Text className="text-sm text-gray-500 block">文档分段</Text>
              <Text>{chunkCount} 段</Text>
            </div>
            <div>
              <Text className="text-sm text-gray-500 block">上传文档</Text>
              <Text>{docCount} 个</Text>
            </div>
            <div>
              <Text className="text-sm text-gray-500 block">状态</Text>
              <Text>{statusLabel[dataset.status]}</Text>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
          <Text strong className="block text-base mb-4">操作</Text>
          <div className="flex flex-wrap gap-3">
            <Button icon={<ThunderboltOutlined />} onClick={() => { reEmbedDataset(dataset.id); message.success('正在重新向量化...'); }}>
              重新向量化
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => exportDatasetAsExcel(dataset.id)}>
              导出
            </Button>
            <Popconfirm title="确定删除此知识库？" onConfirm={handleDelete}>
              <Button danger icon={<DeleteOutlined />}>删除知识库</Button>
            </Popconfirm>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Main KnowledgeDetail Page ----
export default function KnowledgeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const datasets = useAppStore((s) => s.datasets);
  const [activeMenu, setActiveMenu] = useState('articles');
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [relatedModalVisible, setRelatedModalVisible] = useState(false);

  const dataset = id ? datasets.find((ds) => ds.id === id) : null;
  const knowledgeList = useAppStore((s) => s.knowledgeList);
  const articleCount = useMemo(() => knowledgeList.filter(k => k.datasetId === dataset?.id).length, [knowledgeList, dataset?.id]);
  const chunkCount = useMemo(() => (dataset?.documents || []).reduce((sum, d) => sum + d.chunks.length, 0), [dataset?.documents]);

  if (!dataset) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">🗂️</div>
          <div className="empty-text">知识库不存在</div>
          <Button type="primary" onClick={() => navigate('/browse')} style={{ marginTop: 16 }}>
            返回知识库列表
          </Button>
        </div>
      </div>
    );
  }

  const isWebType = dataset.type === 'web';
  const isFeishuType = dataset.type === 'feishu';

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-gray-50">
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

      {/* Sidebar + Content */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar */}
        <div className="w-[200px] min-w-[200px] bg-white border-r border-gray-200 flex flex-col">
          <div className="p-3 border-b border-gray-100">
            <Text strong className="text-sm">菜单</Text>
          </div>
          {SIDEBAR_MENUS.map((menu) => (
            <div
              key={menu.key}
              className={`knowledge-detail-menu-item ${activeMenu === menu.key ? 'active' : ''}`}
              onClick={() => setActiveMenu(menu.key)}
            >
              <span className="mr-2">{menu.icon}</span>
              <span>{menu.label}</span>
            </div>
          ))}
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {activeMenu === 'articles' && <ArticleListPanel datasetId={dataset.id} />}
          {activeMenu === 'recall' && <RecallTestPanel datasetId={dataset.id} />}
          {activeMenu === 'settings' && <SettingsPanel datasetId={dataset.id} />}
        </div>
      </div>

      <AuthorizationModal open={authModalVisible} datasetId={dataset.id} onClose={() => setAuthModalVisible(false)} />
      <RelatedResourcesModal open={relatedModalVisible} datasetId={dataset.id} onClose={() => setRelatedModalVisible(false)} />
    </div>
  );
}
