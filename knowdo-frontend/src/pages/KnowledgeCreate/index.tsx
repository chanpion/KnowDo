import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button, Input, Select, DatePicker, Radio, message, Typography, Upload } from 'antd';
import {
  FileTextOutlined, LinkOutlined, PictureOutlined,
  VideoCameraOutlined, QuestionCircleOutlined, SoundOutlined,
  LeftOutlined, RightOutlined, CheckOutlined,
  DatabaseOutlined, GlobalOutlined, CloudUploadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useAppStoreLegacy } from '@/store';
import { useCreateKnowledgeBase, useUpdateKnowledgeBase, useKnowledgeBaseList } from '@/hooks/use-knowledgebase';
import { useCreateArticle, useUpdateArticle, useArticleDetail } from '@/hooks/use-article';
import { useTagList } from '@/hooks/use-tags';
import { useCategoryTree } from '@/hooks/use-categories';
import type { ArticleType, CategoryNode, DraftItem, KnowledgeBaseType, Attachment } from '@/types';

const { Title, Text } = Typography;

const TYPE_OPTIONS = [
  { key: 'doc', label: '文档', desc: '富文本文档', icon: <FileTextOutlined style={{ fontSize: 36, color: '#1a56db' }} /> },
  { key: 'image', label: '图片', desc: '图片 + 文字说明', icon: <PictureOutlined style={{ fontSize: 36, color: '#15803d' }} /> },
  { key: 'video', label: '视频', desc: '视频教程/录制', icon: <VideoCameraOutlined style={{ fontSize: 36, color: '#a16207' }} /> },
  { key: 'audio', label: '音频', desc: '音频内容', icon: <SoundOutlined style={{ fontSize: 36, color: '#b45309' }} /> },
  { key: 'link', label: '链接', desc: '外部资源链接', icon: <LinkOutlined style={{ fontSize: 36, color: '#7c3aed' }} /> },
  { key: 'qa', label: '问答', desc: 'Q&A 形式', icon: <QuestionCircleOutlined style={{ fontSize: 36, color: '#be123c' }} /> },
];

const TYPE_FILE_ACCEPTS: Record<string, { accept: string; hint: string }> = {
  doc: { accept: '.pdf,.doc,.docx,.txt,.md,.html,.htm,.xls,.xlsx,.csv', hint: '支持 PDF、Word、Excel、Markdown、TXT、HTML 等格式' },
  image: { accept: '.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg', hint: '支持 JPG、PNG、GIF、WebP、SVG 等图片格式' },
  video: { accept: '.mp4,.mov,.avi,.wmv,.flv,.mkv,.webm', hint: '支持 MP4、MOV、AVI、MKV 等视频格式' },
  audio: { accept: '.mp3,.wav,.flac,.aac,.ogg,.wma,.m4a', hint: '支持 MP3、WAV、FLAC、AAC 等音频格式' },
  link: { accept: '.url,.webloc,.html,.htm', hint: '支持书签文件、HTML 等链接格式' },
  qa: { accept: '.json,.csv,.xlsx,.xls,.txt', hint: '支持 JSON、CSV、Excel 等 Q&A 数据格式' },
};

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
  const createKnowledgeBase = useCreateKnowledgeBase();

  const [selectedType, setSelectedType] = useState<KnowledgeBaseType | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [vectorModel, setVectorModel] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [webSelector, setWebSelector] = useState('');

  const handleCreate = async () => {
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

    try {
      const result = await createKnowledgeBase.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        type: selectedType!,
        vectorModel,
        webUrl: selectedType === 'web' ? webUrl.trim() : undefined,
        webSelector: selectedType === 'web' ? webSelector.trim() || undefined : undefined,
      });
      message.success('知识库创建成功！');
      navigate(`/detail/${result.id}`);
    } catch {
      message.error('知识库创建失败');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto self-center py-8 px-4">
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
  const presetKnowledgeBaseId = searchParams.get('dataset');
  const { user } = useAppStoreLegacy();
  const [currentStep, setCurrentStep] = useState(0);

  // Hooks for data fetching
  const createArticle = useCreateArticle();
  const updateArticleHook = useUpdateArticle();
  const updateKnowledgeBaseHook = useUpdateKnowledgeBase();
  const { data: kbListData } = useKnowledgeBaseList();
  const kbList = kbListData?.items || [];
  const { data: tagData } = useTagList();
  const tagLibrary = tagData || [];
  const { data: categoryData } = useCategoryTree();
  const categoryTree = categoryData || [];

  // Edit mode: fetch article detail
  const { data: editArticle, isLoading: editLoading } = useArticleDetail(editId || '');
  const isEditMode = !!editId;

  // Form data
  const [type, setType] = useState<ArticleType>('doc');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [publishScope, setPublishScope] = useState('全行可见');
  const [targetPositions, setTargetPositions] = useState<string[]>([]);
  const [validPeriodType, setValidPeriodType] = useState<'forever' | 'limited'>('forever');
  const [validStart, setValidStart] = useState<string>('');
  const [validEnd, setValidEnd] = useState<string>('');
  const [aiTagsLoading, setAiTagsLoading] = useState(false);
  const [knowledgeBaseId, setKnowledgeBaseId] = useState<string | undefined>(undefined);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('text-embedding-v1');

  // Populate form fields in edit mode
  useEffect(() => {
    if (editArticle) {
      setType(editArticle.type || 'doc');
      setTitle(editArticle.title || '');
      setCategoryId(editArticle.categoryId);
      setSelectedTags(editArticle.tags || []);
      setContent(editArticle.content || '');
      setSummary(editArticle.summary || '');
      setPublishScope(editArticle.publishScope || '全行可见');
      setKnowledgeBaseId(editArticle.knowledgeBaseId || presetKnowledgeBaseId || undefined);
      setAttachments(editArticle.attachments || []);
    } else if (presetKnowledgeBaseId) {
      setKnowledgeBaseId(presetKnowledgeBaseId);
    }
  }, [editArticle, presetKnowledgeBaseId]);

  // Draft recovery
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
        if (draft.data.validPeriodType !== undefined) setValidPeriodType(draft.data.validPeriodType);
        if (draft.data.validStart) setValidStart(draft.data.validStart);
        if (draft.data.validEnd) setValidEnd(draft.data.validEnd);
        const remaining = drafts.filter(d => d.id !== draftId);
        localStorage.setItem('knowdo_drafts', JSON.stringify(remaining));
      }
    }
  }, [draftId]);

  // Draft auto-save every 30 seconds
  useEffect(() => {
    if (isEditMode) return;
    const interval = setInterval(() => {
      if (!title.trim() && !content.trim()) return;
      const drafts: DraftItem[] = JSON.parse(localStorage.getItem('knowdo_drafts') || '[]');
      const draftData: DraftItem = {
        id: genDraftId(),
        title: title.trim() || '未命名草稿',
        type,
        data: { title, categoryId, tags: selectedTags, content, summary, publishScope, type, validPeriodType, validStart, validEnd },
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

  const categoryOptions = flattenCategories(categoryTree);
  const datasetOptions = kbList.map(ds => ({ value: ds.id, label: ds.name }));

  const handleAiTagRecommend = () => {
    if (!title.trim() && !content.trim()) {
      message.warning('请先输入标题或正文内容');
      return;
    }
    setAiTagsLoading(true);
    setTimeout(() => {
      const combinedText = (title + ' ' + content).toLowerCase();
      const matchingTags = tagLibrary.filter((tag: any) =>
        combinedText.includes((tag.name || tag).replace(/[制度文件|操作手册|培训资料|风险控制|合规要求|案例分享|技术方案|年度报告|政策解读|最佳实践|FAQ|业务流程]/g, '').toLowerCase())
      ).map((t: any) => t.name || t);

      const recommended = matchingTags.length >= 2
        ? matchingTags.slice(0, 3)
        : tagLibrary
            .filter((t: any) => (t.name || t).includes('制度') || (t.name || t).includes('手册') || (t.name || t).includes('业务'))
            .map((t: any) => t.name || t)
            .slice(0, 3);

      setSelectedTags(prev => {
        const newTags = recommended.filter((t: string) => !prev.includes(t));
        return [...prev, ...newTags];
      });
      setAiTagsLoading(false);
      message.success(`AI 推荐了 ${recommended.length} 个标签`);
    }, 1200);
  };

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

  const handleSubmit = async () => {
    if (!title.trim()) {
      message.warning('请输入知识标题');
      return;
    }
    if (!knowledgeBaseId) {
      message.warning('请选择所属知识库');
      return;
    }

    const selectedCat = categoryOptions.find(c => c.value === categoryId);
    const typeLabelMap: Record<string, string> = { doc: '文档', image: '图片', video: '视频', audio: '音频', link: '链接', qa: '问答' };
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const generatedContent = content || (attachments.length > 0 ? attachments.map(a => a.name).join(', ') : '');

    try {
      let created: { id: string } | undefined;
      if (isEditMode && editArticle) {
        const newVersionNum = `V${(parseFloat(editArticle.version.replace('V', '')) + 1).toFixed(1)}`;
        await updateArticleHook.mutateAsync({
          id: editArticle.id,
          title,
          type,
          typeLabel: typeLabelMap[type],
          content: generatedContent,
          summary: summary || generatedContent.substring(0, 200),
          category: selectedCat?.label || '',
          categoryId: categoryId || '',
          tags: selectedTags,
          publishScope: publishScope === '特定岗位可见' ? `特定岗位可见(${targetPositions.join('、')})` : publishScope,
          validPeriod: validPeriodType === 'forever' ? '永久有效' : `${validStart} ~ ${validEnd}`,
          validStart: validPeriodType === 'limited' ? validStart : undefined,
          validEnd: validPeriodType === 'limited' ? validEnd : undefined,
          updateTime: now,
          version: newVersionNum,
          status: 'pending_review',
          knowledgeBaseId,
          attachments,
        });
      } else {
        created = await createArticle.mutateAsync({
          title,
          type,
          typeLabel: typeLabelMap[type],
          content: generatedContent,
          summary: summary || generatedContent.substring(0, 200),
          category: selectedCat?.label || '',
          categoryId: categoryId || '',
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
          publishScope: publishScope === '特定岗位可见' ? `特定岗位可见(${targetPositions.join('、')})` : publishScope,
          validPeriod: validPeriodType === 'forever' ? '永久有效' : `${validStart} ~ ${validEnd}`,
          validStart: validPeriodType === 'limited' ? validStart : undefined,
          validEnd: validPeriodType === 'limited' ? validEnd : undefined,
          attachments,
          comments: [],
          versions: [],
          knowledgeBaseId,
        });
      }

      // Update the knowledge base embedding model (best-effort, must not block submission)
      if (knowledgeBaseId) {
        try {
          await updateKnowledgeBaseHook.mutateAsync({ id: knowledgeBaseId, embeddingModel: selectedModel });
        } catch {
          // 知识库可能不存在或更新失败，不影响文章提交
        }
      }

      const targetId = isEditMode && editArticle ? editArticle.id : (created?.id ?? knowledgeBaseId);
      message.success('文章已提交审核');
      navigate(`/detail/${targetId}`);
    } catch {
      message.error('提交失败');
    }
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
                  onClick={() => setType(opt.key as ArticleType)}
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
                  标签
                </label>
                <Select
                  mode="multiple"
                  placeholder="选择标签"
                  value={selectedTags}
                  onChange={setSelectedTags}
                  options={tagLibrary.map((t: any) => ({ value: t.name || t, label: t.name || t }))}
                  size="large"
                  style={{ width: '100%' }}
                />
                <Button
                  type="dashed"
                  icon={<span>🤖</span>}
                  onClick={handleAiTagRecommend}
                  loading={aiTagsLoading}
                  size="small"
                  style={{ marginTop: 8 }}
                >
                  AI 推荐标签
                </Button>
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
                    { value: '特定岗位可见', label: '👥 特定岗位可见' },
                  ]}
                  style={{ width: '100%' }}
                  size="large"
                />

              </div>
                <div style={{ marginTop: 16 }}>
  <label style={{ display: 'block', marginBottom: 6 }}>
    有效期
  </label>
  <Radio.Group value={validPeriodType} onChange={e => setValidPeriodType(e.target.value)}>
    <Radio value='forever'>永久有效</Radio>
    <Radio value='limited'>限时有效</Radio>
  </Radio.Group>
  {validPeriodType === 'limited' && (
    <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
      <DatePicker placeholder='开始日期' onChange={(_, ds) => setValidStart(ds as string)} />
      <DatePicker placeholder='结束日期' onChange={(_, ds) => setValidEnd(ds as string)} />
    </div>
  )}

              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>上传文档</h3>
            <div style={{ maxWidth: 600 }}>
              <Upload.Dragger multiple showUploadList={false} accept={TYPE_FILE_ACCEPTS[type]?.accept || '.pdf,.doc,.docx,.txt,.md'}>
                <p className='ant-upload-drag-icon'>
                  <CloudUploadOutlined style={{ fontSize: 48, color: '#1a56db' }} />
                </p>
                <p className='ant-upload-text'>点击或拖拽文件到此区域上传</p>
                <p className='ant-upload-hint'>{TYPE_FILE_ACCEPTS[type]?.hint || '支持 PDF、Word、Markdown、TXT 等格式'}</p>
              </Upload.Dragger>
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>选择向量模型</h3>
            <div style={{ maxWidth: 600 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  嵌入模型 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <Select
                  placeholder="请选择向量模型"
                  value={selectedModel || undefined}
                  onChange={setSelectedModel}
                  style={{ width: '100%' }}
                  size="large"
                  options={[
                    { value: 'text-embedding-v1', label: 'text-embedding-v1（推荐）' },
                    { value: 'text-embedding-3-small', label: 'text-embedding-3-small' },
                    { value: 'text-embedding-3-large', label: 'text-embedding-3-large' },
                    { value: 'bge-large-zh-v1.5', label: 'BAAI/bge-large-zh-v1.5' },
                  ]}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  所属知识库 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <Select
                  placeholder="请选择知识库"
                  value={knowledgeBaseId || undefined}
                  onChange={setKnowledgeBaseId}
                  style={{ width: '100%' }}
                  size="large"
                  options={datasetOptions}
                />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>确认并提交</h3>
            <div style={{ maxWidth: 600, background: '#f9fafb', borderRadius: 8, padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 14 }}>文章类型：</Text>
                <Text>{TYPE_OPTIONS.find(o => o.key === type)?.label || '文档'}</Text>
              </div>
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 14 }}>标题：</Text>
                <Text>{title || '（未填写）'}</Text>
              </div>
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 14 }}>标签：</Text>
                <Text>{selectedTags.length > 0 ? selectedTags.join(', ') : '（无）'}</Text>
              </div>
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 14 }}>发布范围：</Text>
                <Text>{publishScope}</Text>
              </div>
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 14 }}>有效期：</Text>
                <Text>{validPeriodType === 'forever' ? '永久有效' : `${validStart} ~ ${validEnd}`}</Text>
              </div>
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 14 }}>附件数量：</Text>
                <Text>{attachments.length} 个</Text>
              </div>
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 14 }}>向量模型：</Text>
                <Text>{selectedModel}</Text>
              </div>
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 14 }}>所属知识库：</Text>
                <Text>{kbList.find(k => k.id === knowledgeBaseId)?.name || '（未选择）'}</Text>
              </div>
            </div>
            <div style={{ marginTop: 24 }}>
              <Button type="primary" size="large" onClick={handleSubmit} loading={createArticle.isPending || updateArticleHook.isPending}>
                提交审核
              </Button>
            </div>
          </div>
        );
    }
  };

  const stepLabels = ['选择类型', '基本信息', '上传文档', '选择模型', '确认提交'];

  return (
    <div className="w-full max-w-4xl mx-auto self-center py-6 px-4">
      <div className="mb-6">
        <Title level={3} className="!mb-1">
          {editId ? '编辑知识' : '创建知识'}
        </Title>
      </div>

      <div className="flex items-center justify-center mb-8">
        {stepLabels.map((label, idx) => (
          <div key={idx} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                idx <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {idx + 1}
            </div>
            <span className={`ml-2 text-sm ${
              idx === currentStep ? 'text-blue-600 font-medium' : 'text-gray-400'
            }`}>
              {label}
            </span>
            {idx < stepLabels.length - 1 && (
              <div className={`mx-4 w-16 h-0.5 ${
                idx < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        {renderStepContent()}
      </div>

      <div className="flex justify-between mt-6">
        <Button
          disabled={currentStep === 0}
          onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
          icon={<LeftOutlined />}
        >
          上一步
        </Button>
        {currentStep < 4 ? (
          <Button
            type="primary"
            onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
          >
            下一步 <RightOutlined />
          </Button>
        ) : (
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={createArticle.isPending || updateArticleHook.isPending}
          >
            <CheckOutlined /> 提交审核
          </Button>
        )}
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={handleSaveDraft}>
          保存草稿
        </Button>
      </div>
    </div>
  );
}

function KnowledgeCreate() {
  const location = useLocation();
  const isArticlePath = location.pathname === '/create/article';

  if (!isArticlePath) {
    return <DatasetCreatePanel />;
  }

  return <ArticleCreatePanel />;
}

export default KnowledgeCreate;
