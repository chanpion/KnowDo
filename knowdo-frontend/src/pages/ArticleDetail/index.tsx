import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, message, Input, Tabs, Modal, Tag, Popconfirm, Spin } from 'antd';
import {
  HeartOutlined, HeartFilled, StarOutlined, StarFilled,
  ShareAltOutlined, DownloadOutlined, EditOutlined, EyeOutlined,
  ClockCircleOutlined, UserOutlined,
  HistoryOutlined,
  InboxOutlined, UndoOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { useAppStoreLegacy } from '@/store';
import {
  useArticleDetail, useToggleLike, useAddComment, useDeleteComment,
  useArchiveArticle, useUnarchiveArticle, useSoftDeleteArticle,
  useRollback, useHotArticles, useArticleVersions, useUpdateArticle,
} from '@/hooks/use-article';

const { TextArea } = Input;

// Helper functions
function fmtTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60 * 1000) return '刚刚';
  if (diff < 60 * 60 * 1000) return Math.floor(diff / (60 * 1000)) + '分钟前';
  if (diff < 24 * 60 * 60 * 1000) return Math.floor(diff / (60 * 60 * 1000)) + '小时前';
  if (diff < 7 * 24 * 60 * 60 * 1000) return Math.floor(diff / (24 * 60 * 60 * 1000)) + '天前';
  return dateStr.substring(0, 10);
}

function fmtCount(num: number): string {
  if (num >= 10000) return (num / 10000).toFixed(1) + '万';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
}

const TYPE_ICONS: Record<string, string> = {
  doc: '📄', image: '🖼️', video: '🎬', audio: '🎵', link: '🔗', qa: '❓',
};

const TYPE_LABEL_MAP: Record<string, string> = {
  doc: '文档', image: '图片', video: '视频', audio: '音频', link: '链接', qa: '问答',
};

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppStoreLegacy();

  // Data fetching
  const { data: article, isLoading } = useArticleDetail(id || '');
  const { data: hotArticles } = useHotArticles();
  const { data: versions } = useArticleVersions(id || '');
  const articleData: any = article;

  // Mutations
  const toggleLike = useToggleLike();
  const doAddComment = useAddComment();
  const doDeleteComment = useDeleteComment();
  const archive = useArchiveArticle();
  const unarchive = useUnarchiveArticle();
  const softDelete = useSoftDeleteArticle();
  const rollback = useRollback();
  const updateArticle = useUpdateArticle();

  // Local state
  const [commentText, setCommentText] = useState('');
  const [shareVisible, setShareVisible] = useState(false);
  const [versionContentVisible, setVersionContentVisible] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<string>('content');
  const [versionModalVisible, setVersionModalVisible] = useState(false);

  // ---- Handlers ----
  const handleShare = () => setShareVisible(true);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/article/${id}`);
    message.success('链接已复制');
  };

  const handleDownload = () => {
    if (!article) return;
    const blob = new Blob([articleData.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${articleData.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('下载成功');
  };

  const handlePostComment = () => {
    if (!commentText.trim() || !article) return;
    doAddComment.mutate(
      { articleId: articleData.id, author: user.name, authorDept: user.department, content: commentText.trim() },
      { onSuccess: () => { setCommentText(''); message.success('评论已发表'); } }
    );
  };

  const handleRollback = (version: any) => {
    if (!article) return;
    rollback.mutate(
      { id: articleData.id, versionId: version.id },
      { onSuccess: () => { setVersionModalVisible(false); message.success('版本已回滚'); } }
    );
  };

  const handleDelete = () => {
    if (!article) return;
    softDelete.mutate(articleData.id, { onSuccess: () => { message.success('已移至回收站'); navigate(-1); } });
  };

  const handleToggleFavorite = () => {
    if (!article) return;
    updateArticle.mutate(
      { id: articleData.id, isFavorited: !articleData.isFavorited, favoriteCount: articleData.favoriteCount + (articleData.isFavorited ? -1 : 1) },
      { onSuccess: () => message.success(articleData.isFavorited ? '已取消收藏' : '已收藏') }
    );
  };

  // Validity check
  const isExpiringSoon = article?.validPeriod === 'limited' && article?.validEnd
    && new Date(articleData.validEnd).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    && new Date(articleData.validEnd).getTime() > Date.now();

  const isExpired = article?.validPeriod === 'limited' && article?.validEnd
    && new Date(articleData.validEnd).getTime() < Date.now();

  const isArchived = article?.status === 'archived';

  // ---- Loading & Empty ----
  if (isLoading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!article) {
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

  // ---- Render Versions ----
  const renderVersions = () => {
    const versionList = versions || articleData.versions || [];
    if (versionList.length === 0) {
      return (
        <div className="empty-state" style={{ padding: 32 }}>
          <HistoryOutlined style={{ fontSize: 36, color: 'var(--text-muted)' }} />
          <div className="empty-text" style={{ marginTop: 12 }}>暂无版本历史</div>
        </div>
      );
    }
    return (
      <div>
        {versionList.map((ver: any) => (
          <div key={ver.id} className="timeline-item" style={{ cursor: 'pointer' }}>
            <div className="timeline-dot" style={{ background: 'var(--primary)' }} />
            <div className="timeline-content" onClick={() => { setSelectedVersion(ver); setVersionContentVisible(true); }}>
              <div className="tl-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag color="blue" style={{ marginRight: 0 }}>{ver.versionNumber}</Tag>
                <span>{ver.changeNotes}</span>
              </div>
              <div className="tl-meta">
                <span><UserOutlined /> {ver.modifiedBy}</span>
                <span><ClockCircleOutlined /> {fmtTime(ver.modifiedAt)}</span>
                {ver.contentSnapshot && (
                  <span style={{ color: 'var(--text-muted)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ver.contentSnapshot}
                  </span>
                )}
              </div>
              <div style={{ marginTop: 8 }}>
                <Popconfirm
                  title="确定回滚到该版本？"
                  description="当前内容将被替换为所选版本的内容。"
                  onConfirm={() => handleRollback(ver)}
                >
                  <Button type="link" size="small" icon={<UndoOutlined />}>回滚到此版本</Button>
                </Popconfirm>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  // ---- Render Content ----
  const renderContent = () => {
    const typeLabel = articleData.typeLabel || TYPE_LABEL_MAP[articleData.type] || articleData.type;
    const typeIcon = TYPE_ICONS[articleData.type] || '📄';

    return (
      <>
        {/* Header */}
        <div className="detail-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className={`kc-type-badge ${articleData.type}`}>
              {typeIcon} {typeLabel}
            </span>
            <Tag color={articleData.status === 'published' ? 'success' : articleData.status === 'draft' ? 'default' : articleData.status === 'archived' ? 'warning' : 'processing'}>
              {articleData.status === 'published' ? '已发布' : articleData.status === 'draft' ? '草稿' : articleData.status === 'archived' ? '已归档' : articleData.status === 'pending_review' ? '审核中' : articleData.status === 'rejected' ? '已驳回' : articleData.status}
            </Tag>
          </div>

          <h1>{articleData.title}</h1>

          <div className="detail-meta">
            <span className="meta-item"><UserOutlined /> {articleData.author}</span>
            {articleData.authorDept && <span className="meta-item" style={{ color: 'var(--text-muted)' }}>{articleData.authorDept}</span>}
            <span className="meta-item"><ClockCircleOutlined /> 发布 {fmtTime(articleData.publishTime)}</span>
            {articleData.updateTime && <span className="meta-item">更新 {fmtTime(articleData.updateTime)}</span>}
            <span className="meta-item"><EyeOutlined /> {fmtCount(articleData.viewCount)}</span>
            <span className="meta-item"><HeartOutlined /> {fmtCount(articleData.likeCount)}</span>
            <span className="meta-item">版本 {articleData.version}</span>
          </div>
        </div>

        {/* Expiry notice */}
        {isExpiringSoon && (
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 'var(--radius)', padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#92400e' }}>
            <ClockCircleOutlined /> 该文章将于 {articleData.validEnd} 过期，如需延长有效期请编辑文章。
          </div>
        )}
        {isExpired && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius)', padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#991b1b' }}>
            <ClockCircleOutlined /> 该文章已过期（有效期至 {articleData.validEnd}），请联系作者更新。
          </div>
        )}

        {/* Archive notice */}
        {isArchived && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius)', padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#92400e' }}>
            <InboxOutlined /> 该文章已归档，只读不可编辑。
          </div>
        )}

        {/* AI Summary */}
        {articleData.summary && (
          <div className="detail-ai-summary">
            <div className="ai-label">🤖 AI 摘要</div>
            <div className="ai-content">{articleData.summary}</div>
          </div>
        )}

        {/* Content body */}
        <div className="detail-content">
          {articleData.content.split('\n').map((line: string, i: number) => {
            if (line.startsWith('## ')) return <h2 key={i}>{line.replace('## ', '')}</h2>;
            if (line.startsWith('### ')) return <h3 key={i}>{line.replace('### ', '')}</h3>;
            if (line.startsWith('- ')) return <li key={i} style={{ marginBottom: 4 }}>{line.replace('- ', '')}</li>;
            if (line.trim() === '') return <br key={i} />;
            return <p key={i}>{line}</p>;
          })}
        </div>

        {/* Attachments */}
        {articleData.attachments && articleData.attachments.length > 0 && (
          <div className="detail-attachments">
            <h3>📎 附件 ({articleData.attachments.length})</h3>
            {articleData.attachments.map((att: any, i: number) => (
              <div key={i} className="attachment-item">
                <span className="att-name">{att.name}</span>
                <span className="att-size">{att.size}</span>
                <span className="att-download" onClick={handleDownload}>下载</span>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="detail-actions">
          <Button
            icon={articleData.isLiked ? <HeartFilled style={{ color: '#ef4444' }} /> : <HeartOutlined />}
            onClick={() => toggleLike.mutate({ id: articleData.id })}
          >
            {fmtCount(articleData.likeCount)}
          </Button>
          <Button
            icon={articleData.isFavorited ? <StarFilled style={{ color: '#f59e0b' }} /> : <StarOutlined />}
            onClick={handleToggleFavorite}
          >
            {fmtCount(articleData.favoriteCount)}
          </Button>
          <Button icon={<ShareAltOutlined />} onClick={handleShare}>分享</Button>
          <Button icon={<DownloadOutlined />} onClick={handleDownload}>下载</Button>
          {!isArchived && (
            <Button icon={<EditOutlined />} onClick={() => navigate(`/create?edit=${articleData.id}`)}>编辑</Button>
          )}
          {!isArchived ? (
            <Popconfirm title="确定归档此文章？" description="归档后文章为只读状态" onConfirm={() => archive.mutate(articleData.id, { onSuccess: () => message.success('已归档') })}>
              <Button icon={<InboxOutlined />}>归档</Button>
            </Popconfirm>
          ) : (
            <Button icon={<UndoOutlined />} onClick={() => unarchive.mutate(articleData.id, { onSuccess: () => message.success('已取消归档') })}>
              取消归档
            </Button>
          )}
          <Popconfirm title="确定删除此文章？" description="删除后将移至回收站" onConfirm={handleDelete}>
            <Button danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </div>

        {/* Comments */}
        <div className="comments-section">
          <h3>💬 评论 ({articleData.commentCount || articleData.comments?.length || 0})</h3>
          <div className="comment-input">
            <TextArea
              rows={3}
              placeholder="写下你的评论..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button type="primary" onClick={handlePostComment} disabled={!commentText.trim()}>发表</Button>
            </div>
          </div>
          {(articleData.comments || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
              暂无评论，快来发表第一条评论吧
            </div>
          ) : (
            (articleData.comments || []).map((cmt: any) => (
              <div key={cmt.id} className="comment-item">
                <div className="cmt-header">
                  <span className="cmt-author">{cmt.author}</span>
                  {cmt.authorDept && <span className="cmt-dept">{cmt.authorDept}</span>}
                  {cmt.isAuthor && <span className="cmt-author-badge">作者</span>}
                  <span className="cmt-time">{fmtTime(cmt.time)}</span>
                  <Popconfirm title="确定删除此评论？" onConfirm={() => doDeleteComment.mutate({ articleId: articleData.id, commentId: cmt.id })}>
                    <Button type="text" size="small" danger style={{ fontSize: 12 }}>删除</Button>
                  </Popconfirm>
                </div>
                <div className="cmt-content">{cmt.content}</div>
              </div>
            ))
          )}
        </div>
      </>
    );
  };
  // ---- Main Return ----
  const hotList = Array.isArray(hotArticles) ? hotArticles : (hotArticles?.items || []);
  const recommendArticles = hotList.filter((h: any) => h.id !== articleData.id).slice(0, 5);

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <a href="/">首页</a>
        <span className="separator">/</span>
        <a href="/browse">知识库</a>
        <span className="separator">/</span>
        <span>{articleData.title}</span>
      </div>

      <div className="detail-layout">
        {/* Main Content */}
        <div className="detail-main">
          <Tabs
            activeKey={detailTab}
            onChange={setDetailTab}
            items={[
              { key: 'content', label: '📖 正文内容', children: renderContent() },
              { key: 'versions', label: '📋 版本历史', children: renderVersions() },
            ]}
          />
        </div>

        {/* Sidebar */}
        <div className="detail-sidebar">
          {/* Article Info */}
          <div className="sidebar-panel">
            <h3>📌 文章信息</h3>
            <div className="sidebar-info-item">
              <span className="si-label">作者</span>
              <span className="si-value">{articleData.author}</span>
            </div>
            {articleData.authorDept && (
              <div className="sidebar-info-item">
                <span className="si-label">部门</span>
                <span className="si-value">{articleData.authorDept}</span>
              </div>
            )}
            <div className="sidebar-info-item">
              <span className="si-label">发布时间</span>
              <span className="si-value">{articleData.publishTime}</span>
            </div>
            <div className="sidebar-info-item">
              <span className="si-label">更新时间</span>
              <span className="si-value">{articleData.updateTime}</span>
            </div>
            <div className="sidebar-info-item">
              <span className="si-label">版本</span>
              <span className="si-value">{articleData.version}</span>
            </div>
            <div className="sidebar-info-item">
              <span className="si-label">分类</span>
              <span className="si-value">{articleData.category}</span>
            </div>
            <div className="sidebar-info-item">
              <span className="si-label">浏览</span>
              <span className="si-value">{fmtCount(articleData.viewCount)}</span>
            </div>
          </div>

          {/* Tags */}
          {articleData.tags && articleData.tags.length > 0 && (
            <div className="sidebar-panel">
              <h3>标签</h3>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {articleData.tags.map((tag: string) => (
                  <span key={tag} className="tag tag-blue">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Reading */}
          <div className="sidebar-panel">
            <h3>💡 推荐阅读</h3>
            {recommendArticles.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                暂无推荐
              </div>
            ) : (
              recommendArticles.map((rec: any) => (
                <div
                  key={rec.id}
                  className="recommend-item"
                  onClick={() => navigate('/article/' + rec.id)}
                >
                  <div className="rec-title">{rec.title}</div>
                  <div className="rec-meta">
                    <span>👁 {fmtCount(rec.viewCount || 0)}</span>
                    <span>{rec.category || ''}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
            创建于 {articleData.publishTime}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <Modal
        title="分享文章"
        open={shareVisible}
        onCancel={() => setShareVisible(false)}
        footer={null}
        width={480}
      >
        <Tabs
          items={[
            {
              key: 'link',
              label: '🔗 链接',
              children: (
                <div style={{ padding: '16px 0' }}>
                  <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                    分享链接，有权限的用户可以访问此文章：
                  </div>
                  <Input
                    value={`${window.location.origin}/article/${id}`}
                    readOnly
                    style={{ marginBottom: 12 }}
                  />
                  <Button type="primary" onClick={handleCopyLink}>复制链接</Button>
                </div>
              ),
            },
            {
              key: 'qrcode',
              label: '💭 二维码',
              children: (
                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                  <div style={{ width: 160, height: 160, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: 13, color: 'var(--text-muted)' }}>
                    二维码组件
                  </div>
                  <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                    扫描二维码查看文章
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Modal>

      {/* Version Content Modal */}
      <Modal
        title={selectedVersion ? `版本 ${selectedVersion.versionNumber} - ${selectedVersion.changeNotes || ''}` : ''}
        open={versionContentVisible}
        onCancel={() => setVersionContentVisible(false)}
        footer={null}
        width={720}
      >
        {selectedVersion && (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
              <span>作者: {selectedVersion.modifiedBy}</span>
              <span>时间: {selectedVersion.modifiedAt}</span>
            </div>
            <div className="detail-content">
              {selectedVersion.content?.split('\n').map((line: string, i: number) => {
                if (line.startsWith('## ')) return <h2 key={i}>{line.replace('## ', '')}</h2>;
                if (line.startsWith('### ')) return <h3 key={i}>{line.replace('### ', '')}</h3>;
                if (line.trim() === '') return <br key={i} />;
                return <p key={i}>{line}</p>;
              })}
            </div>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Popconfirm
                title="确定回滚到该版本？"
                onConfirm={() => handleRollback(selectedVersion)}
              >
                <Button type="primary" icon={<UndoOutlined />}>回滚到此版本</Button>
              </Popconfirm>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
