import { useState } from 'react';
import { Button, Input, Tag, Empty, message, Divider } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, RollbackOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store';
import type { ReviewItem, Knowledge } from '@/types';

export default function ReviewPage() {
  const { reviewQueue, knowledgeList, approveKnowledge, rejectKnowledge, returnForEdit } = useAppStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');

  // 从 knowledgeList 中找到对应知识（如果有的话）
  const selectedReview = reviewQueue.find(r => r.id === selectedId);
  const relatedKnowledge = selectedReview
    ? knowledgeList.find(k => k.title === selectedReview.title)
    : null;

  const handleApprove = () => {
    if (!relatedKnowledge) {
      if (selectedReview) {
        message.success(`《${selectedReview.title}》已审核通过`);
      }
      if (selectedId) setSelectedId(null);
      return;
    }
    approveKnowledge(relatedKnowledge.id);
    message.success('审核通过，知识已发布');
    setSelectedId(null);
    setReviewComment('');
  };

  const handleReject = () => {
    if (!reviewComment.trim()) {
      message.warning('请填写驳回原因');
      return;
    }
    if (relatedKnowledge) {
      rejectKnowledge(relatedKnowledge.id, reviewComment);
    } else if (selectedReview) {
      message.success(`《${selectedReview.title}》已驳回`);
    }
    setSelectedId(null);
    setReviewComment('');
  };

  const handleReturn = () => {
    if (!reviewComment.trim()) {
      message.warning('请填写修改意见');
      return;
    }
    if (relatedKnowledge) {
      returnForEdit(relatedKnowledge.id, reviewComment);
    } else if (selectedReview) {
      message.success(`《${selectedReview.title}》已退回修改`);
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

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        {/* 左侧审核队列 */}
        <div className="model-sidebar" style={{ position: 'sticky', top: 80 }}>
          <div style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14, borderBottom: '1px solid var(--border-color)' }}>
            待审核列表 ({reviewQueue.length})
          </div>
          <div style={{ padding: 8 }}>
            {reviewQueue.length === 0 ? (
              <Empty description="暂无待审核知识" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              reviewQueue.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`model-provider-item ${selectedId === item.id ? 'active' : ''}`}
                  style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, padding: '10px 14px' }}
                >
                  <div style={{ fontWeight: 500, fontSize: 13, lineHeight: 1.4 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {item.author} · {item.authorDept}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.submitTime}</div>
                  {item.aiScore > 0 && (
                    <Tag color={item.aiScore >= 4 ? 'green' : item.aiScore >= 3 ? 'orange' : 'red'}>
                      AI评分: {item.aiScore}
                    </Tag>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 右侧审核操作区 */}
        <div className="model-content" style={{ minHeight: 500 }}>
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
                {relatedKnowledge && (
                  <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-page)', borderRadius: 8, maxHeight: 300, overflow: 'auto' }}>
                    <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                      {relatedKnowledge.content.substring(0, 1000)}
                      {relatedKnowledge.content.length > 1000 && '...'}
                    </div>
                  </div>
                )}
                {relatedKnowledge?.attachments && relatedKnowledge.attachments.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>📎 附件</div>
                    {relatedKnowledge.attachments.map((att, idx) => (
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
                  <Tag color={selectedReview.aiScore >= 4 ? 'green' : 'orange'}>{selectedReview.aiScore} / 5.0</Tag>
                </div>
                {selectedReview.aiIssues.length > 0 ? (
                  <ul style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 13 }}>
                    {selectedReview.aiIssues.map((issue, i) => (
                      <li key={i} style={{ color: '#a16207', marginBottom: 4 }}>{issue}</li>
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