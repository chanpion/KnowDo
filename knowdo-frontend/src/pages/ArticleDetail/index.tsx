import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, message, Input, Tabs, Modal, Tag, Popconfirm, Typography } from 'antd';
import {
  HeartOutlined, HeartFilled, StarOutlined, StarFilled,
  ShareAltOutlined, DownloadOutlined, EditOutlined, EyeOutlined,
  ClockCircleOutlined, UserOutlined, TagOutlined,
  LinkOutlined, QrcodeOutlined, HistoryOutlined,
  InboxOutlined, UndoOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store';
import { getKnowledgeById, RECOMMENDED_KNOWLEDGE, formatCount, formatTime } from '@/mock/data';
import { QRCodeSVG } from 'qrcode.react';
import type { KnowledgeVersion } from '@/types';

const { Text, Paragraph } = Typography;

const TYPE_ICONS: Record<string, string> = { doc: '📄', image: '🖼️', video: '🎬', audio: '🎵', link: '🔗', qa: '❓' };

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { knowledgeList, toggleLike, toggleFavorite, addComment, deleteComment, archiveKnowledge, unarchiveKnowledge, softDeleteKnowledge, rollbackVersion, user, datasets } = useAppStore();
  const [commentText, setCommentText] = useState('');
  const [shareVisible, setShareVisible] = useState(false);
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [versionContentVisible, setVersionContentVisible] = useState<KnowledgeVersion | null>(null);
  const [detailTab, setDetailTab] = useState('content');

  const knowledge = id ? getKnowledgeById(id) : null;
  const latestKnowledge = knowledge ? knowledgeList.find(k => k.id === knowledge.id) || knowledge : null;

  if (!latestKnowledge) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <div className="empty-text">文章不存在或已被删除</div>
          <Button type="primary" onClick={() => navigate('/browse')} style={{ marginTop: 16 }}>
            返回知识库
          </Button>
        </div>
      </div>
    );
  }

  // 查找所属知识库
  const parentDataset = datasets.find(ds => ds.id === latestKnowledge.datasetId);

  const isAdmin = user.role === 'admin';
  const shareUrl = window.location.href;

  const handleShare = () => { setShareVisible(true); };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    message.success('链接已复制到剪贴板');
  };

  const handleDownload = (name: string) => { message.success(`正在下载: ${name}`); };

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    addComment(latestKnowledge.id, {
      author: user.name,
      authorDept: user.department,
      content: commentText.trim(),
      isAuthor: user.name === latestKnowledge.author,
    });
    setCommentText('');
    message.success('评论已发布');
  };

  const handleRollback = (version: KnowledgeVersion) => {
    Modal.confirm({
      title: '确认回滚',
      content: `确定要回滚到版本 "${version.versionNumber}" 吗？当前版本将自动保存为历史版本。`,
      okText: '确认回滚',
      cancelText: '取消',
      onOk: () => {
        rollbackVersion(latestKnowledge.id, version.id);
        message.success(`已回滚至 ${version.versionNumber}`);
        setVersionModalVisible(false);
      },
    });
  };

  const handleDelete = () => {
    softDeleteKnowledge(latestKnowledge.id);
    message.success('文章已移入回收站');
    navigate(parentDataset ? `/detail/${parentDataset.id}` : '/browse');
  };

  const isExpiringSoon = () => {
    if (latestKnowledge.validPeriod === '永久有效') return false;
    const parts = latestKnowledge.validPeriod.split(' ~ ');
    if (parts.length !== 2) return false;
    const endDate = new Date(parts[1]);
    const now = new Date();
    const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return diffDays <= 7 && diffDays > 0;
  };

  const isExpired = () => {
    if (latestKnowledge.validPeriod === '永久有效') return false;
    const parts = latestKnowledge.validPeriod.split(' ~ ');
    if (parts.length !== 2) return false;
    return new Date(parts[1]) < new Date();
  };

  const renderContent = () => (
    <>
      <div className="detail-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span className={`kc-type-badge ${latestKnowledge.type}`}>{TYPE_ICONS[latestKnowledge.type]} {latestKnowledge.typeLabel}</span>
          {latestKnowledge.status === 'archived' && <Tag color="orange">已归档</Tag>}
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>版本 {latestKnowledge.version}</span>
        </div>
        <h1>{latestKnowledge.title}</h1>
        <div className="detail-meta">
          <span className="meta-item"><UserOutlined /> {latestKnowledge.author}</span>
          <span className="meta-item">{latestKnowledge.authorDept}</span>
          <span className="meta-item"><ClockCircleOutlined /> {latestKnowledge.publishTime}</span>
          <span className="meta-item"><EyeOutlined /> {formatCount(latestKnowledge.viewCount)} 浏览</span>
        </div>
      </div>

      {isExpired() && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#dc2626', marginBottom: 16 }}>
          ⚠️ 该文章已过期，内容可能不再适用，建议联系作者更新。
        </div>
      )}
      {isExpiringSoon() && (
        <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#a16207', marginBottom: 16 }}>
          ⏰ 该文章即将过期，请及时关注更新。
        </div>
      )}
      {latestKnowledge.status === 'archived' && (
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#0369a1', marginBottom: 16 }}>
          📦 该文章已归档，仅供查阅。
        </div>
      )}

      <div className="detail-ai-summary">
        <div className="ai-label"><span>🤖</span> AI 智能摘要</div>
        <div className="ai-content">{latestKnowledge.summary}</div>
      </div>

      <div className="detail-content">
        {latestKnowledge.content ? (
          <div dangerouslySetInnerHTML={{
            __html: latestKnowledge.content
              .replace(/## (.*)/g, '<h2>$1</h2>')
              .replace(/### (.*)/g, '<h3>$1</h3>')
              .replace(/- (.*)/g, '<li>$1</li>')
              .replace(/\n\n/g, '</p><p>')
              .replace(/^/, '<p>')
              .replace(/$/, '</p>')
          }} />
        ) : (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
            <div>该文章内容以附件形式提供，请下载查看</div>
          </div>
        )}
      </div>

      {latestKnowledge.attachments.length > 0 && (
        <div className="detail-attachments">
          <h3>📎 附件 ({latestKnowledge.attachments.length})</h3>
          {latestKnowledge.attachments.map((att, i) => (
            <div key={i} className="attachment-item">
              <div><span className="att-name">📄 {att.name}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span className="att-size">{att.size}</span>
                <span className="att-download" onClick={() => handleDownload(att.name)}>
                  <DownloadOutlined /> 下载
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="detail-actions">
        <Button icon={latestKnowledge.isLiked ? <HeartFilled style={{ color: '#ef4444' }} /> : <HeartOutlined />} onClick={() => toggleLike(latestKnowledge.id)}>
          {latestKnowledge.isLiked ? '已点赞' : '点赞'} {formatCount(latestKnowledge.likeCount)}
        </Button>
        <Button icon={latestKnowledge.isFavorited ? <StarFilled style={{ color: '#f59e0b' }} /> : <StarOutlined />} onClick={() => toggleFavorite(latestKnowledge.id)}>
          {latestKnowledge.isFavorited ? '已收藏' : '收藏'} {formatCount(latestKnowledge.favoriteCount)}
        </Button>
        <Button icon={<ShareAltOutlined />} onClick={handleShare}>分享</Button>
        {latestKnowledge.status !== 'archived' && (
          <Button icon={<EditOutlined />} onClick={() => navigate(`/create/article?edit=${latestKnowledge.id}`)}>编辑</Button>
        )}
        {isAdmin && (
          <>
            {latestKnowledge.status === 'archived' ? (
              <Button icon={<UndoOutlined />} onClick={() => { unarchiveKnowledge(latestKnowledge.id); message.success('已解除归档'); }}>解除归档</Button>
            ) : latestKnowledge.status === 'published' && (
              <Button icon={<InboxOutlined />} onClick={() => { archiveKnowledge(latestKnowledge.id); message.success('已归档'); }}>归档</Button>
            )}
            <Popconfirm title="确定删除？将移入回收站保留30天" onConfirm={handleDelete}>
              <Button danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          </>
        )}
      </div>

      <div className="comments-section">
        <h3>💬 评论 ({latestKnowledge.comments.length})</h3>
        <div className="comment-input">
          <Input.TextArea
            placeholder="写下你的评论... 支持 @提及其他用户"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onPressEnter={e => { if (e.ctrlKey) handlePostComment(); }}
            rows={3}
            style={{ flex: 1 }}
          />
          <Button type="primary" disabled={!commentText.trim()} onClick={handlePostComment} style={{ alignSelf: 'flex-end' }}>
            发布 (Ctrl+Enter)
          </Button>
        </div>

        {latestKnowledge.comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
            暂无评论，快来发表第一条评论吧
          </div>
        ) : (
          latestKnowledge.comments.map(cmt => (
            <div key={cmt.id} className="comment-item" style={{ position: 'relative' }}>
              <div className="cmt-header">
                <span className="cmt-author">{cmt.author}</span>
                <span className="cmt-dept">{cmt.authorDept}</span>
                {cmt.isAuthor && <span className="cmt-author-badge">作者</span>}
                {cmt.replyTo && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>@ 回复</span>}
                <span className="cmt-time">{cmt.time}</span>
                {isAdmin && (
                  <Button type="link" danger size="small" style={{ marginLeft: 'auto', fontSize: 11 }}
                    onClick={() => { deleteComment(latestKnowledge.id, cmt.id); message.success('评论已删除'); }}>
                    删除
                  </Button>
                )}
              </div>
              <div className="cmt-content">
                {cmt.content.split(/(@\S+)/g).map((part, i) =>
                  part.startsWith('@') ? (
                    <span key={i} style={{ color: 'var(--primary)', fontWeight: 500 }}>{part}</span>
                  ) : part
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );

  const renderVersions = () => {
    const versions = latestKnowledge.versions || [];
    return (
      <div style={{ padding: '20px 0' }}>
        {versions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>暂无版本历史</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {versions.map((v, idx) => (
              <div key={v.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: idx === 0 ? '#f0f9ff' : 'var(--bg-page)',
                borderRadius: 8, border: `1px solid ${idx === 0 ? '#bae6fd' : 'var(--border-color)'}`,
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {v.versionNumber}
                    {idx === 0 && <Tag color="blue" style={{ marginLeft: 8 }}>当前</Tag>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {v.modifiedBy} · {v.modifiedAt} · {v.changeNotes}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button size="small" onClick={() => setVersionContentVisible(v)}>查看内容</Button>
                  {idx > 0 && latestKnowledge.status !== 'archived' && (
                    <Button size="small" onClick={() => handleRollback(v)}>回滚至此版本</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="breadcrumb">
        <a href="/">首页</a>
        <span className="separator">›</span>
        <a href="/browse">知识库</a>
        <span className="separator">›</span>
        {parentDataset && (
          <>
            <a href={`/detail/${parentDataset.id}`}>{parentDataset.name}</a>
            <span className="separator">›</span>
          </>
        )}
        <span>{latestKnowledge.title.length > 20 ? latestKnowledge.title.substring(0, 20) + '...' : latestKnowledge.title}</span>
      </div>

      <div className="detail-layout">
        <div>
          <div className="detail-main">
            <Tabs
              activeKey={detailTab}
              onChange={setDetailTab}
              items={[
                { key: 'content', label: '📖 正文内容', children: renderContent() },
                {
                  key: 'versions',
                  label: <span><HistoryOutlined /> 版本历史 ({latestKnowledge.versions?.length || 0})</span>,
                  children: renderVersions(),
                },
              ]}
            />
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="sidebar-panel">
            <h3>📋 文章信息</h3>
            {parentDataset && (
              <div className="sidebar-info-item">
                <span className="si-label">所属知识库</span>
                <span className="si-value">
                  <a href={`/detail/${parentDataset.id}`} style={{ color: 'var(--primary)' }}>{parentDataset.name}</a>
                </span>
              </div>
            )}
            <div className="sidebar-info-item">
              <span className="si-label">发布范围</span>
              <span className="si-value">{latestKnowledge.publishScope}</span>
            </div>
            <div className="sidebar-info-item">
              <span className="si-label">有效期</span>
              <span className="si-value">{latestKnowledge.validPeriod}</span>
            </div>
            <div className="sidebar-info-item">
              <span className="si-label">版本号</span>
              <span className="si-value">{latestKnowledge.version}</span>
            </div>
            <div className="sidebar-info-item">
              <span className="si-label">更新时间</span>
              <span className="si-value">{latestKnowledge.updateTime}</span>
            </div>
            <div className="sidebar-info-item">
              <span className="si-label">状态</span>
              <span className="si-value">
                {latestKnowledge.status === 'published' && <span style={{ color: '#10b981' }}>✅ 已发布</span>}
                {latestKnowledge.status === 'draft' && <span style={{ color: '#f59e0b' }}>📝 草稿</span>}
                {latestKnowledge.status === 'pending_review' && <span style={{ color: '#f59e0b' }}>⏳ 待审核</span>}
                {latestKnowledge.status === 'rejected' && <span style={{ color: '#ef4444' }}>❌ 已驳回</span>}
                {latestKnowledge.status === 'archived' && <span style={{ color: '#64748b' }}>📦 已归档</span>}
              </span>
            </div>
          </div>

          <div className="sidebar-panel">
            <h3><TagOutlined /> 标签</h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {latestKnowledge.tags.map(tag => (
                <span key={tag} className="tag tag-blue">{tag}</span>
              ))}
            </div>
          </div>

          <div className="sidebar-panel">
            <h3>💡 推荐阅读</h3>
            {RECOMMENDED_KNOWLEDGE.map(item => (
              <div key={item.id} className="recommend-item" onClick={() => navigate(`/article/${item.id}`)}>
                <div className="rec-title">{item.title}</div>
                <div className="rec-meta">
                  <span>📂 {item.category.split('>').pop()}</span>
                  <span>👁 {formatCount(item.viewCount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal title="分享文章" open={shareVisible} onCancel={() => setShareVisible(false)} footer={null} width={420}>
        <Tabs items={[
          {
            key: 'link', label: <span><LinkOutlined /> 链接分享</span>,
            children: (
              <div style={{ padding: '16px 0' }}>
                <Input value={shareUrl} readOnly />
                <Button type="primary" style={{ marginTop: 12 }} onClick={handleCopyLink}>复制链接</Button>
              </div>
            ),
          },
          {
            key: 'qrcode', label: <span><QrcodeOutlined /> 二维码</span>,
            children: (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <QRCodeSVG value={shareUrl} size={200} level="M" />
                <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>扫描二维码查看文章</div>
              </div>
            ),
          },
        ]} />
      </Modal>

      <Modal title={`版本 ${versionContentVisible?.versionNumber || ''} 内容`} open={!!versionContentVisible} onCancel={() => setVersionContentVisible(null)} footer={null} width={700}>
        <div style={{ padding: '12px 0', maxHeight: 500, overflow: 'auto', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8 }}>
          {versionContentVisible?.content || '（无内容）'}
        </div>
      </Modal>
    </div>
  );
}
