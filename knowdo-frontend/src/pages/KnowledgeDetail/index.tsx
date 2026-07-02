  import { useState, useMemo } from 'react';
  import { useParams, useNavigate } from 'react-router-dom';
  import { Button, message, Typography, Tag, Space, Input, Segmented, Select, Slider, Form, Popconfirm, Dropdown, Tooltip, Modal, Switch, InputNumber } from 'antd';
  import {
    SearchOutlined, AppstoreOutlined, UnorderedListOutlined,
    PlusOutlined, DeleteOutlined, FileTextOutlined,
    DatabaseOutlined, TeamOutlined, LinkOutlined, SettingOutlined,
    ThunderboltOutlined, DownloadOutlined, ExportOutlined,
    GlobalOutlined, EditOutlined, FolderOutlined,
  } from '@ant-design/icons';
  import { useAppStore } from '@/store';
  import { formatCount, formatTime } from '@/mock/data';
  import type { ChunkMode } from '@/types';
  import AuthorizationModal from '@/components/dataset/AuthorizationModal';
  import RelatedResourcesModal from '@/components/dataset/RelatedResourcesModal';

  const { Text, Paragraph } = Typography;

  const TYPE_ICONS: Record<string, string> = { doc: '📄', image: '🖼️ ', video: '🎬', audio: '🎵', link: '🔗', qa: '❓' };

  const statusLabel: Record<string, string> = {
    pending: '待处理', processing: '处理中', completed: '已完成', failed: '失败',
  };

  const SIDEBAR_MENUS = [
    { key: 'articles', label: '文档', icon: '📄' },
    { key: 'recall', label: '召回测试', icon: '🧪' },
    { key: 'settings', label: '设置', icon: '⚙️ ' },
  ];

  function ArticleListPanel({ datasetId }: { datasetId: string }) {
    const navigate = useNavigate();
    const archiveKnowledge = useAppStore((s) => s.archiveKnowledge);
    const deleteKnowledge = useAppStore((s) => s.deleteKnowledge);
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
        <div className="toolbar">
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
        <div className="flex-1 overflow-auto p-[10px]">
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
                <div key={item.id} className={`knowledge-card ${viewMode === 'list' ? 'list-view' : ''}`} onClick={() => navigate(`/article/${item.id}`)}>
                  <span className={`kc-type-badge ${item.type}`}>
                    {TYPE_ICONS[item.type] || '📄'} {item.typeLabel}
                  </span>
                  <div className="kc-card-actions">
                    <Dropdown
                      menu={{
                        items: [
                          { key: 'edit', icon: <EditOutlined />, label: '编辑', onClick: (e: any) => { e.domEvent.stopPropagation(); navigate(`/create?edit=${item.id}`); } },
                          { key: 'archive', icon: <FolderOutlined />, label: '归档', onClick: (e: any) => { e.domEvent.stopPropagation(); archiveKnowledge(item.id); message.success('已归档'); } },
                          { key: 'copy', icon: <LinkOutlined />, label: '复制链接', onClick: (e: any) => { e.domEvent.stopPropagation();
  navigator.clipboard.writeText(`${window.location.origin}/article/${item.id}`); message.success('链接已复制'); } },
                          { type: 'divider' },
                          { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true, onClick: (e: any) => { e.domEvent.stopPropagation(); deleteKnowledge(item.id);
  message.success('已删除'); } },
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
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- Recall Test Panel ----
  function RecallTestPanel({ datasetId }: { datasetId: string }) {
    const datasets = useAppStore((s) => s.datasets);
    const sourceDocNames = datasets.find(ds => ds.id === datasetId)?.documents.map(d => d.name) || [];

    const [query, setQuery] = useState('');
    const [topK, setTopK] = useState(5);
    const [searchMode, setSearchMode] = useState<'vector' | 'keyword' | 'hybrid'>('hybrid');
    const [results, setResults] = useState<{ content: string; score: number; source: string }[]>([]);
    const [tested, setTested] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const handleTest = () => {
      if (!query.trim()) {
        message.warning('请输入测试查询语句');
        return;
      }
      const mockResults = [
        { content: '申请材料包括：企业营业执照、组织机构代码证、税务登记证、最近三年财务报表、信贷申请书、法定代表人身份证明...', score: 0.92, source: sourceDocNames[0] || '文档1.pdf' },
        { content: '信用评估包括财务分析、行业分析、管理层评估等步骤，评估结果分为AAA、AA、A、BBB...', score: 0.85, source: sourceDocNames[1] || sourceDocNames[0] || '文档2.docx' },
        { content: '信贷审批流程分为以下节点：客户经理受理、信贷专员初审、风险专员评估、审批官审批...', score: 0.73, source: sourceDocNames[0] || '文档1.pdf' },
      ];
      setResults(mockResults);
      setTested(true);
      message.success('召回测试完成');
    };

    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden" style={{ padding: 10 }}>
        {/* 输入区域 */}
        <div className="bg-white rounded-lg p-4 mb-4" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div className="flex gap-2 mb-3">
            <Input.TextArea
              placeholder="输入测试查询语句..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onPressEnter={handleTest}
              autoSize={{ minRows: 3, maxRows: 6 }}
              style={{ flex: 1 }}
            />
          </div>
          <div className="flex items-center justify-between">
            <Text type="secondary" style={{ fontSize: 12 }}>
              TopK: {topK} | 检索模式: {searchMode === 'vector' ? '向量检索' : searchMode === 'keyword' ? '关键词检索' : '混合检索'}
            </Text>
            <Space>
              <Button icon={<SettingOutlined />} onClick={() => setShowSettings(true)}>设置</Button>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleTest}>测试</Button>
            </Space>
          </div>
        </div>

        {/* 结果区 */}
        {tested ? (
          <div className="flex-1 overflow-auto" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ height: 1, flex: 1, background: '#e2e8f0' }} />
              <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                找到 {results.length} 条相关结果
              </Text>
              <div style={{ height: 1, flex: 1, background: '#e2e8f0' }} />
            </div>
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

        {/* 设置弹窗 */}
        <Modal
          title="召回测试设置"
          open={showSettings}
          onCancel={() => setShowSettings(false)}
          footer={null}
          width={400}
        >
          <div style={{ padding: '16px 0' }}>
            <div style={{ marginBottom: 16 }}>
              <Text style={{ display: 'block', marginBottom: 8 }}>TopK</Text>
              <Select
                value={topK}
                onChange={setTopK}
                style={{ width: '100%' }}
                options={[1,3,5,10,15,20].map(v => ({ value: v, label: `返回 ${v} 条结果` }))}
              />
            </div>
            <div>
              <Text style={{ display: 'block', marginBottom: 8 }}>检索模式</Text>
              <Select
                value={searchMode}
                onChange={setSearchMode}
                style={{ width: '100%' }}
                options={[
                  { value: 'vector', label: '向量检索' },
                  { value: 'keyword', label: '关键词检索' },
                  { value: 'hybrid', label: '混合检索' },
                ]}
              />
            </div>
          </div>
        </Modal>
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

    // 基本信息
    const [name, setName] = useState(dataset.name);
    const [description, setDescription] = useState(dataset.description);
    const [icon, setIcon] = useState(dataset.icon || '📚');
    const [iconModalOpen, setIconModalOpen] = useState(false);

    // 权限
    const [permission, setPermission] = useState(dataset.permission || 'private');

    // 分段策略
    const chunkStrategy = dataset.chunkStrategy || { mode: 'smart' as const, maxCharsPerChunk: 500, overlap: 50 };
    const [chunkMode, setChunkMode] = useState<ChunkMode>(chunkStrategy.mode || 'smart');
    const [chunkSize, setChunkSize] = useState(chunkStrategy.maxCharsPerChunk || chunkStrategy.chunkSize || 500);
    const [chunkOverlap, setChunkOverlap] = useState(chunkStrategy.overlap || 50);

    // 索引模式
    const [indexMode, setIndexMode] = useState<'high_quality' | 'economy'>(dataset.indexMode || 'high_quality');
    const [keywordCount, setKeywordCount] = useState(10);

    // Embedding 模型
    const [embeddingModel, setEmbeddingModel] = useState(dataset.embeddingModel || 'text-embedding-v1');

    // 检索设置
    const [searchMode, setSearchMode] = useState(dataset.searchMode || 'hybrid');
    const [topK, setTopK] = useState(dataset.topK || 5);
    const [scoreThreshold, setScoreThreshold] = useState(dataset.scoreThreshold || 0.5);
    const [enableRerank, setEnableRerank] = useState(dataset.enableRerank ?? false);
    const [rerankModel, setRerankModel] = useState(dataset.rerankModel || 'bge-reranker-v2-m3');

    const [saving, setSaving] = useState(false);

    const handleSave = () => {
      if (!name.trim()) { message.warning('名称不能为空'); return; }
      setSaving(true);
      setTimeout(() => {
        updateDataset(dataset.id, {
          name: name.trim(),
          description: description.trim(),
          icon,
          permission: permission as any,
          chunkStrategy: {
            mode: chunkMode,
            maxCharsPerChunk: chunkSize,
            overlap: chunkOverlap,
          },
          indexMode: indexMode as any,
          embeddingModel,
          searchMode: searchMode as any,
          topK,
          scoreThreshold,
          enableRerank,
          rerankModel,
        });
        message.success('设置已保存');
        setSaving(false);
      }, 400);
    };

    const handleDelete = () => {
      deleteDataset(dataset.id);
      message.success('知识库已删除');
      navigate('/browse');
    };

    const EMBEDDING_OPTIONS = [
      { value: 'text-embedding-v1', label: 'text-embedding-v1' },
      { value: 'bge-large-zh-v1.5', label: 'BAAI/bge-large-zh-v1.5' },
      { value: 'text-embedding-3-large', label: 'OpenAI/text-embedding-3-large' },
      { value: 'text2vec-large-chinese', label: 'shibing624/text2vec-large-chinese' },
    ];

    const RERANK_OPTIONS = [
      { value: 'bge-reranker-v2-m3', label: 'BAAI/bge-reranker-v2-m3' },
      { value: 'cohere-rerank-v3', label: 'Cohere/rerank-v3' },
    ];

    const ICON_OPTIONS = ['📚', '🏦', '⚠️', '🌐', '📋', '📘', '📄', '🗂️', '📊', '💡', '🔍', '🔧', '⚙️', '🤖', '💬', '❓', '📝', '📁', '📂', '🗃️'];

    const chunkModes = [
      { key: 'smart' as ChunkMode, icon: '🤖', title: 'General', desc: '通用文本分段模式。按文本和符号的优先级分段。' },
      { key: 'advanced' as ChunkMode, icon: '🔧', title: 'Parent-Child', desc: '使用父子模式时，子块用于检索，父块用于上下文。' },
      { key: 'qa' as ChunkMode, icon: '💬', title: 'Q&A', desc: '使用 Q&A 模式时，系统将分为问题和答案对，检索时使用问题命中进行检索，答案直接作为上下文返回。' },
    ];

    const indexModes: { key: 'high_quality' | 'economy'; icon: string; title: string; desc: string; badge?: string }[] = [
      { key: 'high_quality', icon: '⭐', title: '高质量', desc: '调用嵌入模型来处理文档以实现更精确的检索，可以帮助大语言模型生成高质量的回答。', badge: '推荐' },
      { key: 'economy', icon: '💰', title: '经济', desc: '每个块使用 10 个关键词进行检索，不消耗 Tokens，但可能会有精度损失。' },
    ];

    const searchModes = [
      { key: 'vector', icon: '🔢', title: '向量检索', desc: '通过生成查询嵌入并查询与其向量表示最相似的文本分段。' },
      { key: 'fulltext', icon: '📝', title: '全文检索', desc: '索引文档中的所有词汇，从而允许用户查询任意词汇，并返回包含这些词汇的文本片段。' },
      { key: 'hybrid', icon: '⚡', title: '混合检索', desc: '同时执行全文检索和向量检索，并应用重排序步骤，从两类查询结果中选择匹配用户问题的最佳结果。用户可以选择设置权重或配置重新排序模型。', badge: '推荐' },
    ];

    const permissionOptions = [
      { value: 'private', label: '只有我', icon: '👤' },
      { value: 'team', label: '团队成员', icon: '👥' },
      { value: 'public', label: '公开', icon: '🌐' },
    ];

    return (
      <div className="flex-1 overflow-auto">
        <div className="settings-panel">
          {/* 名称和图标 */}
          <div className="settings-row">
            <div className="settings-label">名称和图标</div>
            <div className="settings-content">
              <div className="settings-icon-picker">
                <div className="settings-icon-preview" onClick={() => setIconModalOpen(true)}>{icon}</div>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="知识库名称" maxLength={50} style={{ flex: 1 }} />
              </div>
              <Modal title="选择图标" open={iconModalOpen} onCancel={() => setIconModalOpen(false)} footer={null} width={360}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, padding: 16 }}>
                  {ICON_OPTIONS.map((emoji) => (
                    <div key={emoji} style={{ fontSize: 24, textAlign: 'center', cursor: 'pointer', padding: 8, borderRadius: 8, border: icon === emoji ? '2px solid var(--primary)' : '1px solid transparent', background: icon === emoji ? 'var(--primary-bg)' : 'transparent' }} onClick={() => { setIcon(emoji); setIconModalOpen(false); }}>{emoji}</div>
                  ))}
                </div>
              </Modal>
            </div>
          </div>

          {/* 描述 */}
          <div className="settings-row">
            <div className="settings-label">描述</div>
            <div className="settings-content">
              <Input.TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="描述该数据集的内容..." />
              <div className="settings-hint">详细描述可以让 AI 更快地识别数据集中的内容。如果为空，系统将使用默认的命中逻辑。</div>
            </div>
          </div>

          {/* 可见权限 */}
          <div className="settings-row">
            <div className="settings-label">可见权限</div>
            <div className="settings-content">
              <Select
                value={permission}
                onChange={setPermission}
                style={{ width: '100%' }}
                options={permissionOptions.map(o => ({ value: o.value, label: `${o.icon} ${o.label}` }))}
              />
            </div>
          </div>

          <div className="settings-divider" />

          {/* 分段模式 */}
          <div className="settings-row">
            <div className="settings-label">
              分段模式
              <div className="settings-sublabel">了解更多关于分段模式</div>
            </div>
            <div className="settings-content">
              <div className="settings-card-list">
                {chunkModes.map((mode) => (
                  <div
                    key={mode.key}
                    className={`settings-card-option ${chunkMode === mode.key ? 'active' : ''}`}
                    onClick={() => setChunkMode(mode.key)}
                  >
                    <div className="sco-icon">{mode.icon}</div>
                    <div className="sco-body">
                      <div className="sco-title">{mode.title}</div>
                      <div className="sco-desc">{mode.desc}</div>
                    </div>
                    {chunkMode === mode.key && <div className="sco-check">✓</div>}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <div className="flex items-center justify-between mb-1">
                  <Text className="text-sm">分段长度</Text>
                  <Text style={{ fontSize: 12, color: 'var(--primary)' }}>{chunkSize} 字符</Text>
                </div>
                <Slider value={chunkSize} onChange={setChunkSize} min={100} max={3000} step={50} />
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="flex items-center justify-between mb-1">
                  <Text className="text-sm">重叠长度</Text>
                  <Text style={{ fontSize: 12, color: 'var(--primary)' }}>{chunkOverlap} 字符</Text>
                </div>
                <Slider value={chunkOverlap} onChange={setChunkOverlap} min={0} max={500} step={10} />
              </div>
              {chunkMode === 'advanced' && (
                <div style={{ marginTop: 12 }}>
                  <Text className="text-sm block mb-2">自定义分隔符</Text>
                  <Input placeholder="如：\n\n, 。, ；" defaultValue="\n\n, 。" />
                </div>
              )}
              {dataset.documents.length > 0 && (
                <div className="chunk-preview" style={{ marginTop: 16 }}>
                  <div className="chunk-preview-title">分段预览（前 3 段）</div>
                  {dataset.documents.slice(0, 1).map(doc =>
                    doc.chunks.slice(0, 3).map(chunk => (
                      <div key={chunk.id} className="chunk-preview-item">
                        <span className="chunk-preview-index">分段 {chunk.index}</span>
                        {' '}{chunk.content.substring(0, 80)}...
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="settings-divider" />

          {/* 索引模式 */}
          <div className="settings-row">
            <div className="settings-label">索引模式</div>
            <div className="settings-content">
              <div className="settings-card-list">
                {indexModes.map((mode) => (
                  <div
                    key={mode.key}
                    className={`settings-card-option ${indexMode === mode.key ? 'active' : ''}`}
                    onClick={() => setIndexMode(mode.key)}
                  >
                    <div className="sco-icon">{mode.icon}</div>
                    <div className="sco-body">
                      <div className="sco-title">
                        {mode.title}
                        {mode.badge && <span className="sco-badge">{mode.badge}</span>}
                      </div>
                      <div className="sco-desc">{mode.desc}</div>
                    </div>
                    {indexMode === mode.key && <div className="sco-check">✓</div>}
                  </div>
                ))}
              </div>
              {indexMode === 'economy' && (
                <div style={{ marginTop: 12 }}>
                  <div className="flex items-center justify-between mb-1">
                    <Text className="text-sm">关键词数量</Text>
                    <Text style={{ fontSize: 12, color: 'var(--primary)' }}>{keywordCount}</Text>
                  </div>
                  <Slider value={keywordCount} onChange={setKeywordCount} min={1} max={30} step={1} />
                </div>
              )}
            </div>
          </div>

          {/* Embedding 模型 */}
          <div className="settings-row">
            <div className="settings-label">Embedding 模型</div>
            <div className="settings-content">
              <Select
                value={embeddingModel}
                onChange={setEmbeddingModel}
                style={{ width: '100%' }}
                options={EMBEDDING_OPTIONS}
              />
            </div>
          </div>

          <div className="settings-divider" />

          {/* 检索设置 */}
          <div className="settings-row">
            <div className="settings-label">
              检索设置
              <div className="settings-sublabel">了解更多关于检索方法</div>
            </div>
            <div className="settings-content">
              <div className="settings-card-list">
                {searchModes.map((mode) => (
                  <div
                    key={mode.key}
                    className={`settings-card-option ${searchMode === mode.key ? 'active' : ''}`}
                    onClick={() => setSearchMode(mode.key as any)}
                  >
                    <div className="sco-icon">{mode.icon}</div>
                    <div className="sco-body">
                      <div className="sco-title">
                        {mode.title}
                        {mode.badge && <span className="sco-badge">{mode.badge}</span>}
                      </div>
                      <div className="sco-desc">{mode.desc}</div>
                      {searchMode === mode.key && (mode.key === 'vector' || mode.key === 'hybrid') && (
                        <div className="settings-params-grid" onClick={(e) => e.stopPropagation()}>
                          <div className="settings-param-item">
                            <div className="sp-label">Top K</div>
                            <InputNumber min={1} max={50} value={topK} onChange={(v) => setTopK(v || 1)} style={{ width: '100%' }} />
                            <div className="sp-hint">返回相似结果的最大数量</div>
                          </div>
                          <div className="settings-param-item">
                            <div className="sp-label">Score 阈值</div>
                            <Slider value={scoreThreshold} onChange={setScoreThreshold} min={0} max={1} step={0.05} />
                            <div className="sp-hint">{scoreThreshold}</div>
                          </div>
                          <div className="settings-param-item" style={{ gridColumn: '1 / -1' }}>
                            <div className="settings-switch-row">
                              <div>
                                <div className="ss-label">Rerank 模型</div>
                                <div className="ss-desc">启用重排序提升检索精度</div>
                              </div>
                              <Switch checked={enableRerank} onChange={setEnableRerank} />
                            </div>
                            {enableRerank && (
                              <Select
                                value={rerankModel}
                                onChange={setRerankModel}
                                style={{ width: '100%', marginTop: 8 }}
                                options={RERANK_OPTIONS}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {searchMode === mode.key && <div className="sco-check">✓</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="settings-divider" />

          {/* 知识库信息 */}
          <div className="settings-row">
            <div className="settings-label">知识库信息</div>
            <div className="settings-content">
              <div className="grid grid-cols-2 gap-4" style={{ fontSize: 13 }}>
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
          </div>

          {/* 操作 */}
          <div className="settings-row">
            <div className="settings-label">操作</div>
            <div className="settings-content">
              <Space>
                <Button icon={<ThunderboltOutlined />} onClick={() => { reEmbedDataset(dataset.id); message.success('正在重新向量化...'); }}>
                  重新向量化
                </Button>
                <Button icon={<DownloadOutlined />} onClick={() => exportDatasetAsExcel(dataset.id)}>
                  导出
                </Button>
                <Popconfirm title="确定删除此知识库？" onConfirm={handleDelete}>
                  <Button danger icon={<DeleteOutlined />}>删除知识库</Button>
                </Popconfirm>
              </Space>
            </div>
          </div>

          <div className="settings-save-bar">
            <Button type="primary" loading={saving} onClick={handleSave}>保存</Button>
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
            <div className="empty-icon">🗂️ </div>
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
      <div className="page-container">
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
          <div className="folder-tree-panel flex flex-col overflow-hidden w-[260px] min-w-[260px]">
            <div className="flex-1 overflow-auto p-4">
              {SIDEBAR_MENUS.map((menu) => (
                <div key={menu.key} className="folder-tree-item-wrapper">
                  <div
                    className={`folder-tree-item ${activeMenu === menu.key ? 'active' : ''}`}
                    onClick={() => setActiveMenu(menu.key)}
                  >
                    <span className="ft-icon">{menu.icon}</span>
                    <span className="ft-label">{menu.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1 flex flex-col min-h-0" style={{ padding: 10 }}>
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