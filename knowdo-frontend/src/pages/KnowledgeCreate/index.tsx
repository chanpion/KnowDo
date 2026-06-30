import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button, Input, Select, message, Modal, Typography } from 'antd';
import {
  FileTextOutlined, LinkOutlined, PictureOutlined,
  VideoCameraOutlined, QuestionCircleOutlined, SoundOutlined,
  LeftOutlined, RightOutlined, CheckOutlined,
  DatabaseOutlined, GlobalOutlined, CloudUploadOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store';
import { TAG_LIBRARY, CATEGORY_TREE } from '@/mock/data';
import TiptapEditor from '@/components/common/TiptapEditor';
import type { KnowledgeType, CategoryNode, DraftItem, DatasetType } from '@/types';

const { Title, Text, Paragraph } = Typography;

const TYPE_OPTIONS = [
  { key: 'doc', label: '文档', desc: '富文本文档', icon: <FileTextOutlined style={{ fontSize: 36, color: '#1a56db' }} /> },
  { key: 'image', label: '图片', desc: '图片 + 文字说明', icon: <PictureOutlined style={{ fontSize: 36, color: '#15803d' }} /> },
  { key: 'video', label: '视频', desc: '视频教程/录制', icon: <VideoCameraOutlined style={{ fontSize: 36, color: '#a16207' }} /> },
  { key: 'audio', label: '音频', desc: '音频内容', icon: <SoundOutlined style={{ fontSize: 36, color: '#b45309' }} /> },
  { key: 'link', label: '链接', desc: '外部资源链接', icon: <LinkOutlined style={{ fontSize: 36, color: '#7c3aed' }} /> },
  { key: 'qa', label: '问答', desc: 'Q&A 形式', icon: <QuestionCircleOutlined style={{ fontSize: 36, color: '#be123c' }} /> },
];

const datasetTypeOptions = [
  {
    type: 'general' as const,
    label: '通用型',
    icon: <DatabaseOutlined style={{ fontSize: 32 }} />,
    description: '上传离线文档（Markdown、PDF、DOCX、TXT、HTML、XLS、XLSX、CSV），系统自动完成分段、存储和向量化。适用于企业内部知识库、政策文档库等场景。',
    color: '#1890ff',
  },
  {
    type: 'web' as const,
    label: 'Web 站点',
    icon: <GlobalOutlined style={{ fontSize: 32 }} />,
    description: '输入网站地址，系统自动爬取网页内容并向量化。适用于官网 FAQ、产品文档、帮助中心等场景。支持设置 CSS 选择器精准抓取。',
    color: '#52c41a',
  },
];

function flattenCategories(nodes: CategoryNode[], prefix = ''): { value: string; label: string }[] {
  const result: { value: string; label: string }[] = [];
  for (const node of nodes) {
    const label = prefix ? `${prefix} > ${node.name}` : node.name;
    result.push({ value: node.id, label });
    if (node.children) {
      result.push(...flattenCategories(node.children, label));
    }
  }
  return result;
}

function genDraftId() {
  return `draft-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

// ---- Dataset 创建面板 ----

function DatasetCreatePanel() {
  const navigate = useNavigate();
  const addDataset = useAppStore((s) => s.addDataset);

  const [selectedType, setSelectedType] = useState<DatasetType | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [vectorModel, setVectorModel] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [webSelector, setWebSelector] = useState('');

  const handleCreate = () => {
    if (!name.trim()) {
      message.warning('请输入知识库名称');
      return;
    }
    if (!vectorModel) {
      message.warning('请选择向量模型');
      return;
    }
    if (selectedType === 'web' && !webUrl.trim()) {
      message.warning('请输入 Web 根地址');
      return;
    }

    const newDatasetId = addDataset({
      name: name.trim(),
      description: description.trim(),
      type: selectedType!,
      vectorModel,
      webUrl: selectedType === 'web' ? webUrl.trim() : undefined,
      webSelector: selectedType === 'web' ? webSelector.trim() || undefined : undefined,
      folderId: 'ds-folder-1',
      documents: [],
    });

    message.success('知识库创建成功！');
    navigate(`/detail/${newDatasetId}`);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Title level={3} className="!mb-2">创建知识库</Title>
        <Text type="secondary">知识库用于管理和向量化文档，创建完成后可在详情页上传文档或创建文章。</Text>
      </div>

      <div className="mb-6">
        <Title level={5} className="!mb-4">选择知识库类型</Title>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {datasetTypeOptions.map((option) => {
            const isSelected = selectedType === option.type;
            return (
              <div
                key={option.type}
                className={`type-card-enhanced ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedType(option.type)}
              >
                {isSelected && <span className="tc-check">✓</span>}
                <div
                  className="tc-icon-wrapper"
                  style={{ backgroundColor: `${option.color}15`, color: option.color }}
                >
                  {option.icon}
                </div>
                <div className="tc-name">{option.label}</div>
                <div className="tc-desc">{option.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedType && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <Title level={5} className="!mb-4">
            {selectedType === 'general' ? '通用型知识库 - 基本信息' : 'Web 站点知识库 - 基本信息'}
          </Title>

          <div className="mb-4">
            <Text strong>知识库名称 <span className="text-red-500">*</span></Text>
            <Input
              placeholder="请输入知识库名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              maxLength={50}
              showCount
            />
          </div>

          <div className="mb-4">
            <Text strong>描述</Text>
            <Input.TextArea
              placeholder="请输入知识库描述（选填）"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
              rows={3}
              maxLength={200}
              showCount
            />
          </div>

          <div className="mb-4">
            <Text strong>向量模型 <span className="text-red-500">*</span></Text>
            <Select
              placeholder="请选择向量模型"
              value={vectorModel || undefined}
              onChange={setVectorModel}
              className="mt-1 w-full"
              options={[
                { value: 'bge-large-zh-v1.5', label: 'BAAI/bge-large-zh-v1.5（推荐）' },
                { value: 'text-embedding-3-large', label: 'OpenAI/text-embedding-3-large' },
                { value: 'text2vec-large-chinese', label: 'shibing624/text2vec-large-chinese' },
              ]}
            />
          </div>

          {selectedType === 'web' && (
            <>
              <div className="mb-4">
                <Text strong>Web 根地址 <span className="text-red-500">*</span></Text>
                <Input
                  placeholder="请输入网站地址，如 https://example.com"
                  value={webUrl}
                  onChange={(e) => setWebUrl(e.target.value)}
                  className="mt-1"
                  prefix={<LinkOutlined />}
                />
              </div>
              <div className="mb-4">
                <Text strong>选择器（选填）</Text>
                <Input
                  placeholder="CSS 选择器，如 .content 或 #main"
                  value={webSelector}
                  onChange={(e) => setWebSelector(e.target.value)}
                  className="mt-1"
                />
                <Text type="secondary" className="text-xs mt-1 block">
                  用于精准抓取页面中的指定内容区域
                </Text>
              </div>
            </>
          )}

          <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
            <Button type="primary" size="large" onClick={handleCreate} icon={<CloudUploadOutlined />}>
              创建知识库
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- 文章创建面板 ----

function ArticleCreatePanel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const draftId = searchParams.get('draft');
  const presetDatasetId = searchParams.get('dataset');
  const { addKnowledge, updateKnowledge, user, knowledgeList, datasets } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);

  // 编辑模式：回填原内容
  const editKnowledge = editId ? (knowledgeList.find(k => k.id === editId) || null) : null;
  const isEditMode = !!editKnowledge;

  // 表单数据
  const [type, setType] = useState<KnowledgeType>(editKnowledge?.type || 'doc');
  const [title, setTitle] = useState(editKnowledge?.title || '');
  const [categoryId, setCategoryId] = useState<string | undefined>(editKnowledge?.categoryId);
  const [selectedTags, setSelectedTags] = useState<string[]>(editKnowledge?.tags || []);
  const [content, setContent] = useState(editKnowledge?.content || '');
  const [summary, setSummary] = useState(editKnowledge?.summary || '');
  const [publishScope, setPublishScope] = useState(editKnowledge?.publishScope || '全行可见');
  const [datasetId, setDatasetId] = useState<string | undefined>(editKnowledge?.datasetId || presetDatasetId || undefined);

  // 草稿恢复
  useEffect(() => {
    if (draftId) {
      const drafts: DraftItem[] = JSON.parse(localStorage.getItem('knowdo_drafts') || '[]');
      const draft = drafts.find(d => d.id === draftId);
      if (draft && draft.data) {
        setType(draft.type);
        if (draft.data.title) setTitle(draft.data.title);
        if (draft.data.categoryId) setCategoryId(draft.data.categoryId);
        if (draft.data.tags) setSelectedTags(draft.data.tags);
        if (draft.data.content) setContent(draft.data.content);
        if (draft.data.summary) setSummary(draft.data.summary);
        if (draft.data.publishScope) setPublishScope(draft.data.publishScope);
        const remaining = drafts.filter(d => d.id !== draftId);
        localStorage.setItem('knowdo_drafts', JSON.stringify(remaining));
      }
    }
  }, [draftId]);

  // 草稿自动保存（每30秒）
  useEffect(() => {
    if (isEditMode) return;
    const interval = setInterval(() => {
      if (!title.trim() && !content.trim()) return;
      const drafts: DraftItem[] = JSON.parse(localStorage.getItem('knowdo_drafts') || '[]');
      const draftData: DraftItem = {
        id: genDraftId(),
        title: title.trim() || '未命名草稿',
        type,
        data: { title, categoryId, tags: selectedTags, content, summary, publishScope, type },
        updatedAt: new Date().toISOString(),
      };
      const existingIdx = drafts.findIndex(d => d.title === draftData.title);
      if (existingIdx >= 0) {
        drafts[existingIdx] = draftData;
      } else {
        drafts.unshift(draftData);
      }
      localStorage.setItem('knowdo_drafts', JSON.stringify(drafts.slice(0, 20)));
    }, 30000);
    return () => clearInterval(interval);
  }, [title, content, type, categoryId, selectedTags, summary, publishScope, isEditMode]);

  const categoryOptions = flattenCategories(CATEGORY_TREE);
  const datasetOptions = datasets.map(ds => ({ value: ds.id, label: ds.name }));

  const handleSaveDraft = () => {
    const drafts: DraftItem[] = JSON.parse(localStorage.getItem('knowdo_drafts') || '[]');
    const draftData: DraftItem = {
      id: genDraftId(),
      title: title.trim() || '未命名草稿',
      type,
      data: { title, categoryId, tags: selectedTags, content, summary, publishScope, type },
      updatedAt: new Date().toISOString(),
    };
    drafts.unshift(draftData);
    localStorage.setItem('knowdo_drafts', JSON.stringify(drafts.slice(0, 20)));
    message.success('草稿已保存');
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      message.warning('请输入知识标题');
      return;
    }
    if (!categoryId) {
      message.warning('请选择分类');
      return;
    }
    if (!datasetId) {
      message.warning('请选择所属知识库');
      return;
    }

    const selectedCat = categoryOptions.find(c => c.value === categoryId);
    const typeLabelMap: Record<string, string> = { doc: '文档', image: '图片', video: '视频', audio: '音频', link: '链接', qa: '问答' };
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (isEditMode && editKnowledge) {
      const newVersionNum = `V${(parseFloat(editKnowledge.version.replace('V', '')) + 1).toFixed(1)}`;
      updateKnowledge(editKnowledge.id, {
        title,
        type,
        typeLabel: typeLabelMap[type],
        content,
        summary: summary || content.substring(0, 200),
        category: selectedCat?.label || '',
        categoryId,
        tags: selectedTags,
        publishScope,
        updateTime: now,
        version: newVersionNum,
        status: 'pending_review',
        datasetId,
      });
      message.success('文章已提交审核');
    } else {
      addKnowledge({
        id: `k-new-${Date.now()}`,
        title,
        type,
        typeLabel: typeLabelMap[type],
        content,
        summary: summary || content.substring(0, 200),
        category: selectedCat?.label || '',
        categoryId,
        tags: selectedTags,
        author: user.name,
        authorDept: user.department,
        publishTime: now,
        updateTime: now,
        version: 'V1.0',
        status: 'pending_review',
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        favoriteCount: 0,
        isLiked: false,
        isFavorited: false,
        publishScope,
        validPeriod: '永久有效',
        attachments: [],
        comments: [],
        versions: [],
        datasetId,
      });
      message.success('文章已提交审核');
    }

    navigate(`/detail/${datasetId}`);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>选择文章类型</h3>
            <div className="type-cards">
              {TYPE_OPTIONS.map(opt => (
                <div
                  key={opt.key}
                  className={`type-card ${type === opt.key ? 'selected' : ''}`}
                  onClick={() => setType(opt.key as KnowledgeType)}
                >
                  <div className="type-icon">{opt.icon}</div>
                  <div className="type-name">{opt.label}</div>
                  <div className="type-desc">{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>填写基本信息</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  所属知识库 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <Select
                  placeholder="选择目标知识库"
                  value={datasetId}
                  onChange={setDatasetId}
                  options={datasetOptions}
                  size="large"
                  style={{ width: '100%' }}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  知识标题 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <Input
                  placeholder="请输入知识标题"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  size="large"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  所属分类 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <Select
                  placeholder="选择知识分类"
                  value={categoryId}
                  onChange={setCategoryId}
                  options={categoryOptions}
                  size="large"
                  style={{ width: '100%' }}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  标签
                </label>
                <Select
                  mode="multiple"
                  placeholder="选择标签"
                  value={selectedTags}
                  onChange={setSelectedTags}
                  options={TAG_LIBRARY.map(t => ({ value: t.name, label: t.name }))}
                  size="large"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  AI 摘要
                </label>
                <Input.TextArea
                  placeholder="输入知识摘要，或留空让AI自动生成"
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  发布范围
                </label>
                <Select
                  value={publishScope}
                  onChange={setPublishScope}
                  options={[
                    { value: '全行可见', label: '🌐 全行可见' },
                    { value: '部门可见', label: '🏢 部门可见' },
                    { value: '仅自己', label: '🔒 仅自己' },
                  ]}
                  style={{ width: '100%' }}
                  size="large"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>编辑内容</h3>
            <div className="ai-toolbar">
              <button className="ai-btn" onClick={() => {
                const hide = message.loading('AI 正在优化排版...', 0);
                setTimeout(() => { hide(); message.success('排版已优化'); }, 1500);
              }}>🤖 AI 优化排版</button>
              <button className="ai-btn" onClick={() => {
                if (!content.trim()) { message.warning('请先输入正文内容'); return; }
                const autoSummary = content.trim().substring(0, 200) + (content.length > 200 ? '...' : '');
                setSummary(autoSummary);
                message.success('摘要已生成');
              }}>📝 生成摘要</button>
              <button className="ai-btn" onClick={() => {
                const hide = message.loading('AI 正在翻译...', 0);
                setTimeout(() => { hide(); message.success('翻译完成（模拟）'); }, 2000);
              }}>🌐 智能翻译</button>
              <button className="ai-btn" onClick={() => {
                const hide = message.loading('AI 正在校对...', 0);
                setTimeout(() => {
                  hide();
                  const issues = [
                    '第3段："由于"与"因此"语义重复，建议删除其一',
                    '第5段：发现拼写错误 "资原" → "资源"',
                    '第8段：建议将长句拆分为两句，提高可读性',
                  ];
                  Modal.info({
                    title: '智能校对结果',
                    content: (
                      <div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>共发现 {issues.length} 个问题：</p>
                        {issues.map((issue, i) => (
                          <p key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: 13 }}>⚠️ {issue}</p>
                        ))}
                      </div>
                    ),
                    okText: '知道了',
                  });
                }, 1000);
              }}>✅ 智能校对</button>
            </div>
            <div className="editor-container">
              <TiptapEditor content={content} onChange={setContent} />
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>提交审核</h3>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <h4 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>确认提交</h4>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>
                请确认以下信息无误后提交审核
              </p>
              <div style={{ background: 'var(--bg-page)', borderRadius: 8, padding: 20, textAlign: 'left', maxWidth: 400, margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>文章类型</span>
                  <span style={{ fontWeight: 500 }}>{TYPE_OPTIONS.find(o => o.key === type)?.label}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>标题</span>
                  <span style={{ fontWeight: 500, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>所属知识库</span>
                  <span style={{ fontWeight: 500 }}>{datasets.find(ds => ds.id === datasetId)?.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>分类</span>
                  <span style={{ fontWeight: 500 }}>{categoryOptions.find(c => c.value === categoryId)?.label}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>发布范围</span>
                  <span style={{ fontWeight: 500 }}>{publishScope}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>字数</span>
                  <span style={{ fontWeight: 500 }}>{content.length} 字</span>
                </div>
              </div>
              <div style={{ marginTop: 24 }}>
                <Button type="primary" size="large" icon={<CheckOutlined />} onClick={handleSubmit}>
                  {isEditMode ? '提交更新' : '确认提交'}
                </Button>
                <Button size="large" style={{ marginLeft: 12 }} onClick={handleSaveDraft}>
                  💾 保存草稿
                </Button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="page-container">
      <div className="breadcrumb">
        <a href="/">首页</a>
        <span className="separator">›</span>
        <a href="/browse">知识库</a>
        <span className="separator">›</span>
        {datasetId && (
          <>
            <a href={`/detail/${datasetId}`}>{datasets.find(ds => ds.id === datasetId)?.name || '知识库'}</a>
            <span className="separator">›</span>
          </>
        )}
        <span>{isEditMode ? '编辑文章' : '创建文章'}</span>
      </div>
      <h1 className="page-title">{isEditMode ? '✏️ 编辑文章' : '✏️ 创建文章'}</h1>

      <div className="steps-container">
        <div className="step-indicator">
          {['选择类型', '填写信息', '编辑内容', '提交审核'].map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div className="step-item">
                <div className={`step-number ${i < currentStep ? 'completed' : ''} ${i === currentStep ? 'active' : ''}`}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <span className={`step-label ${i === currentStep ? 'active' : ''}`}>{label}</span>
              </div>
              {i < 3 && <div className={`step-connector ${i < currentStep ? 'completed' : ''}`} />}
            </div>
          ))}
        </div>

        <div className="step-content">
          {renderStepContent()}
        </div>

        <div className="step-actions">
          <Button icon={<LeftOutlined />} disabled={currentStep === 0} onClick={() => setCurrentStep(s => s - 1)}>
            上一步
          </Button>
          {currentStep < 3 ? (
            <Button
              type="primary"
              icon={<RightOutlined />}
              onClick={() => {
                if (currentStep === 1 && !title.trim()) { message.warning('请输入知识标题'); return; }
                if (currentStep === 1 && !categoryId) { message.warning('请选择分类'); return; }
                if (currentStep === 1 && !datasetId) { message.warning('请选择所属知识库'); return; }
                setCurrentStep(s => s + 1);
              }}
            >
              下一步
            </Button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}

// ---- 主页面 ----

export default function KnowledgeCreate() {
  const location = useLocation();
  const isArticleMode = location.pathname.endsWith('/article');

  if (isArticleMode) {
    return <ArticleCreatePanel />;
  }

  return (
    <div className="page-container">
      <div className="breadcrumb">
        <a href="/">首页</a>
        <span className="separator">›</span>
        <a href="/browse">知识库</a>
        <span className="separator">›</span>
        <span>创建知识库</span>
      </div>
      <h1 className="page-title">🗂️ 创建知识库</h1>
      <DatasetCreatePanel />
    </div>
  );
}
