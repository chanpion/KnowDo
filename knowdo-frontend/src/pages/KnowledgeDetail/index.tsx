import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, message, Tabs, Tag, Typography, Table, Space, Upload, InputNumber, Switch, Input, Popconfirm, Segmented } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SearchOutlined, AppstoreOutlined, UnorderedListOutlined,
  PlusOutlined,
  InboxOutlined, DeleteOutlined, EditOutlined,
  UploadOutlined, FileOutlined, FilePdfOutlined,
  FileWordOutlined, FileExcelOutlined, FileTextOutlined,
  GlobalOutlined, DatabaseOutlined, TeamOutlined, LinkOutlined,
  CheckCircleOutlined, LoadingOutlined, ExclamationCircleOutlined, MinusCircleOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store';
import { formatCount, formatTime } from '@/mock/data';
import type { DatasetDocument, DatasetDocumentType, ChunkMode, QAChunkPair, Knowledge } from '@/types';
import AuthorizationModal from '@/components/dataset/AuthorizationModal';
import RelatedResourcesModal from '@/components/dataset/RelatedResourcesModal';

const { Title, Text, Paragraph } = Typography;

const TYPE_ICONS: Record<string, string> = { doc: '📄', image: '🖼️', video: '🎬', audio: '🎵', link: '🔗', qa: '❓' };

// ---- 文档管理相关 ----

const docTypeIcon: Record<DatasetDocumentType, React.ReactNode> = {
  md: <FileTextOutlined className="text-blue-500" />,
  txt: <FileTextOutlined className="text-gray-500" />,
  pdf: <FilePdfOutlined className="text-red-500" />,
  docx: <FileWordOutlined className="text-blue-600" />,
  html: <GlobalOutlined className="text-orange-500" />,
  xls: <FileExcelOutlined className="text-green-600" />,
  xlsx: <FileExcelOutlined className="text-green-600" />,
  csv: <FileExcelOutlined className="text-green-500" />,
};

const statusIcon: Record<string, React.ReactNode> = {
  pending: <ExclamationCircleOutlined className="text-gray-400" />,
  processing: <LoadingOutlined className="text-blue-400" />,
  completed: <CheckCircleOutlined className="text-green-500" />,
  failed: <MinusCircleOutlined className="text-red-500" />,
};

const statusLabel: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
  failed: '失败',
};

interface SimulatedChunk {
  id: string;
  index: number;
  content: string;
  question?: string;
}

function generateFakeChunks(fileName: string, mode: ChunkMode, maxChars: number, overlap: number): SimulatedChunk[] {
  const baseTexts = [
    `## 一、概述\n\n本文档「${fileName}」旨在规范企业信贷业务中的风险评估流程，确保信贷资产质量。所有信贷人员必须严格遵守本文档的相关规定。`,
    `## 二、核心流程\n\n### 2.1 贷前调查\n\n信贷人员应对借款企业进行全面调查，包括但不限于：企业基本情况及经营状况、财务状况分析、行业发展前景评估。必要时可委托第三方机构进行尽调。`,
    `### 2.2 信用评级\n\n根据《企业信用评级管理办法》执行评级工作。评级因素包括：企业规模、盈利能力、偿债能力、经营稳定性、行业地位等。评级结果分为 AAA、AA、A、BBB、BB、B、CCC、CC、C 九个等级。`,
    `## 三、风险控制\n\n建立完善的风险预警机制，对客户经营状况、财务指标、行业变动、负面舆情等进行持续监控。出现以下情况应及时启动风险预案…`,
    `## 四、审批权限\n\n支行行长审批额度上限为 500 万元；分行副行长审批额度上限为 2000 万元；分行行长审批额度上限为 5000 万元；超过 5000 万元需报总行审批。`,
    `## 五、附则\n\n本制度自发布之日起执行，由风险管理部负责解释。未尽事宜按《信贷管理基本制度》执行。`,
  ];

  if (mode === 'smart') {
    return baseTexts.map((text, i) => ({
      id: `chk-${i + 1}`,
      index: i + 1,
      content: text.substring(0, maxChars),
      question: i === 0 ? `「${fileName}」的核心内容概述是什么？` : undefined,
    }));
  }

  const chunks: SimulatedChunk[] = [];
  let idx = 1;
  for (const text of baseTexts) {
    const words = text.split('');
    for (let i = 0; i < words.length; i += maxChars - overlap) {
      const segment = words.slice(i, i + maxChars).join('');
      chunks.push({ id: `chk-${idx}`, index: idx, content: segment });
      idx++;
      if (i + maxChars >= words.length) break;
    }
  }
  return chunks.slice(0, 10);
}

// ---- 文档管理面板 ----

function DocumentPanel({ datasetId }: { datasetId: string }) {
  const navigate = useNavigate();
  const datasets = useAppStore((s) => s.datasets);
  const addDatasetDocuments = useAppStore((s) => s.addDatasetDocuments);
  const deleteDatasetDocument = useAppStore((s) => s.deleteDatasetDocument);
  const generateQAChunks = useAppStore((s) => s.generateQAChunks);

  const dataset = datasets.find((ds) => ds.id === datasetId);

  const [chunkModalVisible, setChunkModalVisible] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [chunkMode, setChunkMode] = useState<ChunkMode>('smart');
  const [maxCharsPerChunk, setMaxCharsPerChunk] = useState(4096);
  const [autoClean, setAutoClean] = useState(true);
  const [autoAddTitleAsQuestion, setAutoAddTitleAsQuestion] = useState(true);
  const [chunkSize, setChunkSize] = useState(512);
  const [chunkOverlap, setChunkOverlap] = useState(64);
  const [separators, setSeparators] = useState('\\n\\n, \\n, 。');
  const [editChunks, setEditChunks] = useState<SimulatedChunk[]>([]);
  const [editingChunkId, setEditingChunkId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [qaPairs, setQaPairs] = useState<QAChunkPair[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  const refreshPreview = () => {
    if (pendingFiles.length === 0) return;
    const fileName = pendingFiles[0].name;
    const chunks = generateFakeChunks(
      fileName,
      chunkMode,
      chunkMode === 'smart' ? maxCharsPerChunk : chunkSize,
      chunkOverlap,
    );
    setEditChunks(chunks);
  };

  const handleBeforeUpload = (file: File, fileList: File[]) => {
    setPendingFiles(fileList);
    setChunkMode('smart');
    setMaxCharsPerChunk(4096);
    setAutoClean(true);
    setAutoAddTitleAsQuestion(true);
    setChunkSize(512);
    setChunkOverlap(64);
    setSeparators('\\n\\n, \\n, 。');
    setEditChunks([]);
    setChunkModalVisible(true);
    setQaPairs([]);

    setTimeout(() => {
      const chunks = generateFakeChunks(file.name, 'smart', 4096, 64);
      setEditChunks(chunks);
    }, 200);
    return false;
  };

  const handleConfirmImport = () => {
    if (chunkMode === 'qa') {
      if (qaPairs.length === 0) {
        message.warning('请至少添加一个问答对');
        return;
      }
      const newDocs = pendingFiles.map((file) => {
        const ext = file.name.split('.').pop()?.toLowerCase() as DatasetDocumentType;
        return { name: file.name, size: `${(file.size / 1024 / 1024).toFixed(1)} MB`, type: ext };
      });
      addDatasetDocuments(dataset!.id, newDocs);
      const updatedDatasets = useAppStore.getState().datasets;
      const updatedDs = updatedDatasets.find((ds) => ds.id === datasetId);
      if (updatedDs && updatedDs.documents.length > 0) {
        const lastDoc = updatedDs.documents[updatedDs.documents.length - 1];
        generateQAChunks(dataset!.id, lastDoc.id, qaPairs);
      }
      message.success(`已导入 ${pendingFiles.length} 个文档（QA 分段模式）`);
    } else {
      const newDocs = pendingFiles.map((file) => {
        const ext = file.name.split('.').pop()?.toLowerCase() as DatasetDocumentType;
        return { name: file.name, size: `${(file.size / 1024 / 1024).toFixed(1)} MB`, type: ext };
      });
      addDatasetDocuments(dataset!.id, newDocs);
      message.success(`已导入 ${pendingFiles.length} 个文档，正在分段处理...`);
    }
    setChunkModalVisible(false);
    setPendingFiles([]);
    setEditChunks([]);
    setQaPairs([]);
    setTimeout(() => message.success('文档导入并分段完成！'), 2500);
  };

  const deletePreviewChunk = (chunkId: string) => {
    setEditChunks((prev) => prev.filter((c) => c.id !== chunkId));
  };

  const startEditChunk = (chunk: SimulatedChunk) => {
    setEditingChunkId(chunk.id);
    setEditingContent(chunk.content);
  };

  const saveEditChunk = () => {
    setEditChunks((prev) =>
      prev.map((c) => (c.id === editingChunkId ? { ...c, content: editingContent } : c)),
    );
    setEditingChunkId(null);
    setEditingContent('');
  };

  const addChunk = () => {
    const newChunk: SimulatedChunk = {
      id: `chk-new-${Date.now()}`,
      index: editChunks.length + 1,
      content: '新建分段（双击编辑内容）',
    };
    setEditChunks([...editChunks, newChunk]);
  };

  if (!dataset) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <DatabaseOutlined style={{ fontSize: 48 }} />
        <Text type="secondary" className="mt-4">知识库不存在</Text>
        <Button className="mt-4" onClick={() => navigate('/browse')}>返回知识库列表</Button>
      </div>
    );
  }

  const isWebType = dataset.type === 'web';
  const isFeishuType = dataset.type === 'feishu';

  const columns: ColumnsType<DatasetDocument> = [
    {
      title: '文档名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: DatasetDocument) => (
        <Space>
          {docTypeIcon[record.type]}
          <Text>{name}</Text>
        </Space>
      ),
    },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100, render: (type: string) => <Tag>{type.toUpperCase()}</Tag> },
    { title: '大小', dataIndex: 'size', key: 'size', width: 100 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 120,
      render: (status: string) => (<Space>{statusIcon[status]}<Text>{statusLabel[status]}</Text></Space>),
    },
    { title: '分段数', key: 'chunkCount', width: 100, render: (_, record) => <Text>{record.chunks.length}</Text> },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
    {
      title: '操作', key: 'action', width: 80,
      render: (_, record) => (
        <Popconfirm title="确定删除此文档？" onConfirm={() => { deleteDatasetDocument(dataset.id, record.id); message.success('文档已删除'); }}>
          <Button type="link" danger size="small">删除</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="flex-1 overflow-auto p-6">
      {!isWebType && (
        <div className="mb-4">
          <Upload.Dragger
            multiple
            showUploadList={false}
            accept=".md,.txt,.pdf,.docx,.html,.xls,.xlsx,.csv"
            beforeUpload={handleBeforeUpload}
          >
            <p className="ant-upload-drag-icon"><UploadOutlined /></p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">支持 Markdown、TXT、PDF、DOCX、HTML、XLS、XLSX、CSV 格式</p>
          </Upload.Dragger>
        </div>
      )}

      {isWebType && dataset.documents.length === 0 && (
        <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200 text-center">
          <GlobalOutlined className="text-green-600 text-2xl mb-2 block" />
          <Text type="secondary">Web 站点知识库的内容由系统自动爬取。如需同步最新内容，请返回列表页点击「同步」。</Text>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <Text strong>文档列表（{dataset.documents.length}）</Text>
        </div>
        <Table
          dataSource={dataset.documents}
          columns={columns}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: '暂无文档，请上传文档' }}
        />
      </div>

      {/* 分段配置 Modal */}
      {chunkModalVisible && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)' }}>
          <div style={{ background: '#fff', borderRadius: 8, width: 860, maxHeight: '85vh', overflow: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={4} className="!mb-0">文档分段配置</Title>
              <Button type="text" onClick={() => { setChunkModalVisible(false); setPendingFiles([]); setEditChunks([]); }}>✕</Button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <Space wrap>
                {pendingFiles.map((f) => (
                  <Tag key={f.name} icon={<FileOutlined />}>{f.name}（{(f.size / 1024 / 1024).toFixed(1)} MB）</Tag>
                ))}
              </Space>
            </div>

            <Tabs
              activeKey={chunkMode}
              onChange={(key) => {
                setChunkMode(key as ChunkMode);
                setTimeout(refreshPreview, 100);
              }}
              items={[
                {
                  key: 'smart', label: '智能分段',
                  children: (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-4">
                        <Text strong className="w-32 flex-shrink-0">分段长度：</Text>
                        <InputNumber value={maxCharsPerChunk} onChange={(v) => setMaxCharsPerChunk(v || 4096)} min={128} max={8192} step={256} addonAfter="字符" className="w-48" />
                        <Text type="secondary" className="text-xs">推荐 4096</Text>
                      </div>
                      <div className="flex items-center gap-4">
                        <Text strong className="w-32 flex-shrink-0">自动清洗：</Text>
                        <Switch checked={autoClean} onChange={setAutoClean} />
                        <Text type="secondary" className="text-xs">去除空白字符和无效换行</Text>
                      </div>
                      <div className="flex items-center gap-4">
                        <Text strong className="w-32 flex-shrink-0">标题转问题：</Text>
                        <Switch checked={autoAddTitleAsQuestion} onChange={setAutoAddTitleAsQuestion} />
                        <Text type="secondary" className="text-xs">将 Markdown 标题自动作为关联问题</Text>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'advanced', label: '高级分段',
                  children: (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-4">
                        <Text strong className="w-32 flex-shrink-0">分段大小：</Text>
                        <InputNumber value={chunkSize} onChange={(v) => setChunkSize(v || 512)} min={64} max={4096} step={64} className="w-48" />
                        <Text type="secondary" className="text-xs">字符数</Text>
                      </div>
                      <div className="flex items-center gap-4">
                        <Text strong className="w-32 flex-shrink-0">分段重叠：</Text>
                        <InputNumber value={chunkOverlap} onChange={(v) => setChunkOverlap(v || 64)} min={0} max={512} step={16} className="w-48" />
                        <Text type="secondary" className="text-xs">相邻分段重叠字符数</Text>
                      </div>
                      <div className="flex items-start gap-4">
                        <Text strong className="w-32 flex-shrink-0 pt-1">分隔符：</Text>
                        <Input value={separators} onChange={(e) => setSeparators(e.target.value)} className="flex-1" placeholder="多个分隔符用逗号分隔" />
                      </div>
                      <div className="flex justify-end">
                        <Button size="small" icon={<FileOutlined />} onClick={refreshPreview}>刷新预览</Button>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'qa', label: 'QA 问答对',
                  children: (
                    <div className="space-y-4 pt-2">
                      <Text type="secondary">添加问答对，每个问答对将作为一个独立分段。支持手动录入或批量导入。</Text>
                      <div className="flex gap-2 items-start">
                        <div className="flex-1 space-y-2">
                          <Input placeholder="输入问题..." value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} />
                          <Input.TextArea placeholder="输入答案..." value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} rows={2} />
                        </div>
                        <Button
                          type="primary" icon={<PlusOutlined />}
                          onClick={() => {
                            if (!newQuestion.trim() || !newAnswer.trim()) { message.warning('问答对不能为空'); return; }
                            setQaPairs([...qaPairs, { id: `qa-${Date.now()}`, question: newQuestion, answer: newAnswer }]);
                            setNewQuestion(''); setNewAnswer('');
                          }}
                        >添加</Button>
                      </div>
                      <div className="max-h-48 overflow-auto border rounded-lg divide-y">
                        {qaPairs.length === 0 ? (
                          <div className="text-center py-4 text-gray-400 text-sm">暂无问答对</div>
                        ) : (
                          qaPairs.map((pair, idx) => (
                            <div key={pair.id} className="p-2 flex items-start gap-2 hover:bg-gray-50 group">
                              <Tag color="orange" className="!m-0 flex-shrink-0">Q{idx + 1}</Tag>
                              <div className="flex-1 min-w-0">
                                <Text className="text-sm block truncate"><Text strong>Q: </Text>{pair.question}</Text>
                                <Text className="text-sm block truncate text-gray-500"><Text strong>A: </Text>{pair.answer}</Text>
                              </div>
                              <Button type="text" size="small" danger icon={<DeleteOutlined />} className="opacity-0 group-hover:opacity-100" onClick={() => setQaPairs(qaPairs.filter((p) => p.id !== pair.id))} />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ),
                },
              ]}
            />

            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <Text strong>分段预览（{editChunks.length} 段）</Text>
                <Button size="small" icon={<PlusOutlined />} onClick={addChunk}>新建分段</Button>
              </div>
              <div className="max-h-[320px] overflow-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {editChunks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FileTextOutlined style={{ fontSize: 24 }} />
                    <p className="mt-2">暂无分段数据，请配置后刷新预览</p>
                  </div>
                ) : (
                  editChunks.map((chunk) => (
                    <div key={chunk.id} className="p-3 hover:bg-gray-50 group">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Tag color="blue" className="!m-0">段落 {chunk.index}</Tag>
                          <Text type="secondary" className="text-xs">{chunk.content.length} 字符</Text>
                          {chunk.question && <Tag color="orange" className="!m-0 text-xs">{chunk.question}</Tag>}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => startEditChunk(chunk)} />
                          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => deletePreviewChunk(chunk.id)} />
                        </div>
                      </div>
                      {editingChunkId === chunk.id ? (
                        <div className="mt-2">
                          <Input.TextArea value={editingContent} onChange={(e) => setEditingContent(e.target.value)} rows={3} autoFocus />
                          <div className="flex gap-2 mt-1">
                            <Button size="small" type="primary" onClick={saveEditChunk}>保存</Button>
                            <Button size="small" onClick={() => setEditingChunkId(null)}>取消</Button>
                          </div>
                        </div>
                      ) : (
                        <Paragraph className="!mb-0 text-sm text-gray-700 line-clamp-3" style={{ whiteSpace: 'pre-wrap' }}>
                          {chunk.content}
                        </Paragraph>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
              <div className="text-gray-500 text-sm">
                已上传 {pendingFiles.length} 个文件，分段预览共 {editChunks.length} 段
              </div>
              <Space>
                <Button onClick={() => { setChunkModalVisible(false); setPendingFiles([]); setEditChunks([]); }}>取消</Button>
                <Button type="primary" onClick={handleConfirmImport}>确认导入</Button>
              </Space>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- 文章列表面板 ----

function ArticleListPanel({ datasetId }: { datasetId: string }) {
  const navigate = useNavigate();
  const { knowledgeList, toggleLike, toggleFavorite } = useAppStore();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const articles = useMemo(() => {
    let list = knowledgeList.filter(k => k.datasetId === datasetId);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(k =>
        k.title.toLowerCase().includes(s) ||
        k.summary.toLowerCase().includes(s) ||
        k.tags.some(t => t.toLowerCase().includes(s))
      );
    }
    return list;
  }, [knowledgeList, datasetId, search]);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <Input
          prefix={<SearchOutlined className="text-gray-400" />}
          placeholder="搜索文章标题、内容、标签..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          className="max-w-[300px]"
        />
        <div className="flex-1" />
        <Text type="secondary" className="text-sm">共 {articles.length} 篇文章</Text>
        <Segmented
          value={viewMode}
          onChange={(v) => setViewMode(v as 'grid' | 'list')}
          options={[
            { value: 'grid', icon: <AppstoreOutlined /> },
            { value: 'list', icon: <UnorderedListOutlined /> },
          ]}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`/create/article?dataset=${datasetId}`)}>
          创建文章
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FileTextOutlined style={{ fontSize: 48 }} />
            <Text type="secondary" className="mt-4">该知识库暂无文章</Text>
            <Button type="primary" className="mt-4" onClick={() => navigate(`/create/article?dataset=${datasetId}`)}>
              创建第一篇文章
            </Button>
          </div>
        ) : (
          <div style={{
            display: viewMode === 'grid' ? 'grid' : 'block',
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(360px, 1fr))' : undefined,
            gap: 16,
          }}>
            {articles.map(item => (
              <div key={item.id} className="knowledge-card" onClick={() => navigate(`/article/${item.id}`)}>
                <span className={`kc-type-badge ${item.type}`}>
                  {TYPE_ICONS[item.type] || '📄'} {item.typeLabel}
                </span>
                <div className="kc-title">{item.title}</div>
                <div className="kc-summary">{item.summary}</div>
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
                    <span className="kc-stat" onClick={() => toggleLike(item.id)}>
                      {item.isLiked ? '❤️' : '🤍'} {formatCount(item.likeCount)}
                    </span>
                    <span className="kc-stat">👁 {formatCount(item.viewCount)}</span>
                    <span className="kc-stat" onClick={() => toggleFavorite(item.id)}>
                      {item.isFavorited ? '⭐' : '☆'} {formatCount(item.favoriteCount)}
                    </span>
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

// ---- 主页面：知识库详情容器 ----

export default function KnowledgeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const datasets = useAppStore((s) => s.datasets);
  const [activeTab, setActiveTab] = useState('articles');
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [relatedModalVisible, setRelatedModalVisible] = useState(false);

  const dataset = id ? datasets.find(ds => ds.id === id) : null;

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
      {/* 顶部信息区 - 渐变背景 */}
      <div className="detail-header-gradient">
        <div className="detail-header-top">
          <Button type="text" size="small" onClick={() => navigate('/browse')} style={{ marginRight: 4 }}>← 返回</Button>
          <span className="detail-header-title">{dataset.name}</span>
          <Tag color={isWebType ? 'green' : isFeishuType ? 'purple' : 'blue'}>
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
        <div className="detail-header-desc">{dataset.description}</div>
        {isWebType && (
          <div className="detail-header-meta-row">
            <GlobalOutlined className="text-green-600" />
            <Text type="secondary" style={{ fontSize: 13 }}>站点地址：</Text>
            <Text className="text-green-700" style={{ fontSize: 13 }}>{dataset.webUrl}</Text>
            {dataset.webSelector && (
              <>
                <Text type="secondary" style={{ fontSize: 13, marginLeft: 8 }}>选择器：</Text>
                <Text code style={{ fontSize: 12 }}>{dataset.webSelector}</Text>
              </>
            )}
          </div>
        )}
        {isFeishuType && (
          <div className="detail-header-meta-row">
            <Text type="secondary" style={{ fontSize: 13 }}>飞书应用ID：</Text>
            <Text code style={{ fontSize: 12 }}>{dataset.feishuAppId}</Text>
            <Text type="secondary" style={{ fontSize: 13, marginLeft: 8 }}>文件夹Token：</Text>
            <Text code style={{ fontSize: 12 }}>{dataset.feishuFolderToken}</Text>
          </div>
        )}
      </div>

      {/* Tab 内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="detail-tabs-bar">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'articles', label: '📝 知识文章' },
              { key: 'documents', label: '📄 文档管理' },
            ]}
            style={{ marginBottom: 0 }}
          />
        </div>
        {activeTab === 'articles' ? (
          <ArticleListPanel datasetId={dataset.id} />
        ) : (
          <DocumentPanel datasetId={dataset.id} />
        )}
      </div>

      <AuthorizationModal open={authModalVisible} datasetId={dataset.id} onClose={() => setAuthModalVisible(false)} />
      <RelatedResourcesModal open={relatedModalVisible} datasetId={dataset.id} onClose={() => setRelatedModalVisible(false)} />
    </div>
  );
}
