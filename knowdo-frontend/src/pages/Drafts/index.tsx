import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Popconfirm, Tag, Empty } from 'antd';
import { EditOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import type { DraftItem } from '@/types';

const TYPE_ICONS: Record<string, string> = { doc: '📄', image: '🖼️', video: '🎬', audio: '🎵', link: '🔗', qa: '❓' };
const TYPE_LABELS: Record<string, string> = { doc: '文档', image: '图片', video: '视频', audio: '音频', link: '链接', qa: '问答' };

function getDrafts(): DraftItem[] {
  return JSON.parse(localStorage.getItem('knowdo_drafts') || '[]');
}

function saveDrafts(drafts: DraftItem[]) {
  localStorage.setItem('knowdo_drafts', JSON.stringify(drafts));
}

export default function DraftsPage() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<DraftItem[]>(getDrafts());

  const handleDelete = (id: string) => {
    const updated = drafts.filter(d => d.id !== id);
    setDrafts(updated);
    saveDrafts(updated);
  };

  const handleContinue = (draft: DraftItem) => {
    navigate(`/create/article?draft=${draft.id}`);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="page-container">
      <div className="breadcrumb">
        <a href="/">首页</a>
        <span className="separator">›</span>
        <span>草稿箱</span>
      </div>
      <h1 className="page-title">📝 草稿箱</h1>

      {drafts.length === 0 ? (
        <Empty description="暂无草稿" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {drafts.map(draft => (
            <div key={draft.id} className="knowledge-card" style={{ cursor: 'default' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <span className={`kc-type-badge ${draft.type}`}>
                  {TYPE_ICONS[draft.type] || '📄'} {TYPE_LABELS[draft.type] || draft.type}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {formatDate(draft.updatedAt)}
                </span>
              </div>
              <div className="kc-title" style={{ marginTop: 12 }}>{draft.title}</div>
              <div className="kc-summary" style={{ WebkitLineClamp: 2 }}>
                {draft.data?.content?.substring(0, 100) || '暂无内容'}
              </div>
              {draft.data?.tags && draft.data.tags.length > 0 && (
                <div className="kc-tags" style={{ marginTop: 8 }}>
                  {draft.data.tags.slice(0, 3).map((tag: string) => (
                    <Tag key={tag} color="blue">{tag}</Tag>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Button size="small" type="primary" icon={<EditOutlined />} onClick={() => handleContinue(draft)}>
                  继续编辑
                </Button>
                <Popconfirm title="确定删除此草稿？" onConfirm={() => handleDelete(draft.id)}>
                  <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
                </Popconfirm>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
