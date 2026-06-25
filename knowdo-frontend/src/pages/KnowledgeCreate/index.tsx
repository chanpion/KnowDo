import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input, Select, message, Modal } from 'antd';
import {
  FileTextOutlined, LinkOutlined, PictureOutlined,
  VideoCameraOutlined, QuestionCircleOutlined, SoundOutlined,
  LeftOutlined, RightOutlined, CheckOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store';
import { TAG_LIBRARY, CATEGORY_TREE, KNOWLEDGE_LIST } from '@/mock/data';
import TiptapEditor from '@/components/common/TiptapEditor';
import type { KnowledgeType, CategoryNode, DraftItem } from '@/types';

const TYPE_OPTIONS = [
  { key: 'doc', label: '文档', desc: '富文本文档', icon: <FileTextOutlined style={{ fontSize: 36, color: '#1a56db' }} /> },
  { key: 'image', label: '图片', desc: '图片 + 文字说明', icon: <PictureOutlined style={{ fontSize: 36, color: '#15803d' }} /> },
  { key: 'video', label: '视频', desc: '视频教程/录制', icon: <VideoCameraOutlined style={{ fontSize: 36, color: '#a16207' }} /> },
  { key: 'audio', label: '音频', desc: '音频内容', icon: <SoundOutlined style={{ fontSize: 36, color: '#b45309' }} /> },
  { key: 'link', label: '链接', desc: '外部资源链接', icon: <LinkOutlined style={{ fontSize: 36, color: '#7c3aed' }} /> },
  { key: 'qa', label: '问答', desc: 'Q&A 形式', icon: <QuestionCircleOutlined style={{ fontSize: 36, color: '#be123c' }} /> },
];

// 扁平化分类选项
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

export default function KnowledgeCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const draftId = searchParams.get('draft');
  const { addKnowledge, updateKnowledge, user, knowledgeList } = useAppStore();
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
        // 删除已恢复的草稿
        const remaining = drafts.filter(d => d.id !== draftId);
        localStorage.setItem('knowdo_drafts', JSON.stringify(remaining));
      }
    }
  }, [draftId]);

  // 草稿自动保存（每30秒）
  useEffect(() => {
    if (isEditMode) return; // 编辑模式不自动保存草稿
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
      // 更新或新增
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

    const selectedCat = categoryOptions.find(c => c.value === categoryId);
    const typeLabelMap: Record<string, string> = { doc: '文档', image: '图片', video: '视频', audio: '音频', link: '链接', qa: '问答' };
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (isEditMode && editKnowledge) {
      // 编辑模式：更新已有知识并提交审核
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
      });
      message.success('知识已提交审核');
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
      });
      message.success('知识已提交审核');
    }

    navigate('/browse');
  };

  // ... renderStepContent remains the same

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>选择知识类型</h3>
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

            {/* AI 辅助工具栏 */}
            <div className="ai-toolbar">
              <button className="ai-btn" onClick={() => {
                const hide = message.loading('AI 正在优化排版...', 0);
                setTimeout(() => {
                  hide();
                  message.success('排版已优化');
                }, 1500);
              }}>
                🤖 AI 优化排版
              </button>
              <button className="ai-btn" onClick={() => {
                if (!content.trim()) {
                  message.warning('请先输入正文内容');
                  return;
                }
                const autoSummary = content.trim().substring(0, 200) + (content.length > 200 ? '...' : '');
                setSummary(autoSummary);
                message.success('摘要已生成');
              }}>
                📝 生成摘要
              </button>
              <button className="ai-btn" onClick={() => {
                const hide = message.loading('AI 正在翻译...', 0);
                setTimeout(() => {
                  hide();
                  message.success('翻译完成（模拟）');
                }, 2000);
              }}>
                🌐 智能翻译
              </button>
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
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>
                          共发现 {issues.length} 个问题：
                        </p>
                        {issues.map((issue, i) => (
                          <p key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: 13 }}>
                            ⚠️ {issue}
                          </p>
                        ))}
                      </div>
                    ),
                    okText: '知道了',
                  });
                }, 1000);
              }}>
                ✅ 智能校对
              </button>
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

              <div style={{
                background: 'var(--bg-page)', borderRadius: 8, padding: 20,
                textAlign: 'left', maxWidth: 400, margin: '0 auto',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>知识类型</span>
                  <span style={{ fontWeight: 500 }}>{TYPE_OPTIONS.find(o => o.key === type)?.label}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>标题</span>
                  <span style={{ fontWeight: 500, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
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
        <span>创建知识</span>
      </div>
      <h1 className="page-title">{isEditMode ? '✏️ 编辑知识' : '✏️ 创建知识'}</h1>

      <div className="steps-container">
        {/* 步骤指示器 */}
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

        {/* 步骤内容 */}
        <div className="step-content">
          {renderStepContent()}
        </div>

        {/* 步骤操作按钮 */}
        <div className="step-actions">
          <Button
            icon={<LeftOutlined />}
            disabled={currentStep === 0}
            onClick={() => setCurrentStep(s => s - 1)}
          >
            上一步
          </Button>
          {currentStep < 3 ? (
            <Button
              type="primary"
              icon={<RightOutlined />}
              onClick={() => {
                if (currentStep === 1 && !title.trim()) {
                  message.warning('请输入知识标题');
                  return;
                }
                if (currentStep === 1 && !categoryId) {
                  message.warning('请选择分类');
                  return;
                }
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
