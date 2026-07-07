import { useState } from 'react';
import { Button, Input, Tag, Empty, message, Divider } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, RollbackOutlined } from '@ant-design/icons';
import { useReviewQueue, useApproveArticle, useRejectArticle, useReturnForEdit } from '@/hooks/use-article';
import type { ReviewItem } from '@/types';

export default function ReviewPage() {
  const { data: reviewQueue = [] } = useReviewQueue();
  const approveArticle = useApproveArticle();
  const rejectArticle = useRejectArticle();
  const returnForEdit = useReturnForEdit();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');

  const selectedReview = (reviewQueue as any[]).find(r => r.id === selectedId);
  const relatedArticle = null; // article can be loaded on demand

  const handleApprove = () => {
    if (!selectedReview) return;
    const articleId = selectedReview.articleId;
    if (articleId) {
      approveArticle.mutate(articleId, { onSuccess: () => message.success('审核通过，文章已发布') });
    } else {
      message.success(`《${selectedReview.title}》已审核通过`);
    }
    setSelectedId(null);
    setReviewComment('');
  };

  const handleReject = () => {
    if (!reviewComment.trim()) {
      message.warning('请填写驳回原因');
      return;
    }
    if (selectedReview?.articleId) {
      rejectArticle.mutate({ id: selectedReview.articleId, reason: reviewComment }, { onSuccess: () => message.success('已驳回') });
    } else {
      message.success(`《${selectedReview?.title}》已驳回`);
    }
    setSelectedId(null);
    setReviewComment('');
  };

  const handleReturn = () => {
    if (!reviewComment.trim()) {
      message.warning('请填写修改意见');
      return;
    }
    if (selectedReview?.articleId) {
      returnForEdit.mutate({ id: selectedReview.articleId, feedback: reviewComment }, { onSuccess: () => message.success('已退回修改') });
    } else {
      message.success(`《${selectedReview?.title}》已退回修改`);
    }
    setSelectedId(null);
    setReviewComment('');
  };

  return (
    <div className="page-container">
      <div className="breadcrumb">
        <a href="/">首页</a>
        <span className="separator">›</span>
        <span>审核管理</span>
      </div>
      <h1 className="page-title">📋 审核管理</h1>

      <div className="flex flex-1 min-h-0">
        {/* 左侧审核队列 */}
        <div className="folder-tree-panel flex flex-col overflow-hidden w-[260px] min-w-[260px]">
          <div className="flex-1 overflow-auto p-4">
            {reviewQueue.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                暂无待审核知识
              </div>
            ) : (
              reviewQueue.map(item => (
                <div key={item.id} className="folder-tree-item-wrapper">
                  <div
                    onClick={() => setSelectedId(item.id)}
                    className={`folder-tree-item ${selectedId === item.id ? 'active' : ''}`}
                    style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}
                  >
                    <span className="ft-label" style={{ fontWeight: 500 }}>{item.title}</span>
                    <span className="ft-count">{item.author} · {item.authorDept}</span>
                    {item.aiScore > 0 && (
                      <span className="ft-count" style={{ background: item.aiScore >= 80 ? '#dcfce7' : item.aiScore >= 60 ? '#fef3c7' : '#fee2e2', color: item.aiScore >= 80 ? '#166534' : item.aiScore >= 60 ? '#92400e' : '#991b1b' }}>
                        AI: {item.aiScore}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 右侧审核操作区 */}
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          {!selectedReview ? (
            <div style={{ padding: 80, textAlign: 'center' }}>
              <Empty description="请从左侧选择待审核知识" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ) : (
            <div>
              {/* 知识预览 */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{selectedReview.title}</h3>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                  作者: {selectedReview.author} · {selectedReview.authorDept} · 提交时间: {selectedReview.submitTime}
                </div>
                <Tag color="blue">{selectedReview.category}</Tag>
                {relatedArticle && (
                  <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-page)', borderRadius: 8, maxHeight: 300, overflow: 'auto' }}>
                    <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                      {relatedArticle.content.substring(0, 1000)}
                      {relatedArticle.content.length > 1000 && '...'}
                    </div>
                  </div>
                )}
                {relatedArticle?.attachments && relatedArticle.attachments.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>📎 附件</div>
                    {relatedArticle.attachments.map((att, idx) => (
                      <div key={idx} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {att.name} ({att.size})
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI 评估 */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', background: '#f8fafc' }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>🤖 AI 质量评估</div>
                <div style={{ fontSize: 13 }}>
                  <span style={{ fontWeight: 500 }}>综合得分: </span>
                  <Tag color={selectedReview.aiScore >= 80 ? 'green' : 'orange'}>{(selectedReview.aiScore / 20).toFixed(1)} / 5.0</Tag>
                </div>
                {selectedReview.aiIssues.length > 0 ? (
                  <ul style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 13 }}>
                    {selectedReview.aiIssues.map((issue, i) => (
                      <li key={i} style={{ color: "#a16207", marginBottom: 4 }}>{issue.type}：{issue.content}</li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: 13, color: '#10b981' }}>✅ 未发现问题</div>
                )}
              </div>

              {/* 审核意见 */}
              <div style={{ padding: '20px 24px' }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>审批意见</div>
                <Input.TextArea
                  rows={3}
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="请输入审批意见（驳回/退回时必填）"
                />
                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <Button type="primary" icon={<CheckCircleOutlined />} style={{ background: '#10b981', borderColor: '#10b981' }} onClick={handleApprove}>
                    通过
                  </Button>
                  <Button icon={<RollbackOutlined />} style={{ borderColor: '#f59e0b', color: '#f59e0b' }} onClick={handleReturn}>
                    退回修改
                  </Button>
                  <Button danger icon={<CloseCircleOutlined />} onClick={handleReject}>
                    驳回
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}