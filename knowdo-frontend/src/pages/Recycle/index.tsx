import { useState } from 'react';
import { Table, Button, Popconfirm, Tag, Empty, message } from 'antd';
import { UndoOutlined, DeleteOutlined } from '@ant-design/icons';
import { useDeletedArticles, useRestoreArticle, useDeleteArticle } from '@/hooks/use-article';
import type { Article } from '@/types';

const TYPE_ICONS: Record<string, string> = { doc: '📄', image: '🖼️', video: '🎬', audio: '🎵', link: '🔗', qa: '❓' };

function getRemainDays(deletedAt: string): number {
  const deleted = new Date(deletedAt);
  const expire = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000);
  const remain = Math.ceil((expire.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  return Math.max(0, remain);
}

export default function RecyclePage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const { data, isLoading } = useDeletedArticles(page, pageSize);
  const { mutate: restoreMutate } = useRestoreArticle();
  const { mutate: deleteMutate } = useDeleteArticle();

  const deletedArticles = data?.items || [];
  const total = data?.total || 0;

  const handleRestore = (id: string) => {
    restoreMutate(id);
    message.success('知识已恢复');
  };

  const handlePermanentDelete = (id: string) => {
    deleteMutate(id);
    message.success('知识已永久删除');
  };

  const columns = [
    {
      title: '知识标题',
      dataIndex: 'title',
      key: 'title',
      width: 280,
      render: (title: string, record: Article) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {TYPE_ICONS[record.type]} {record.typeLabel} · {record.author}
          </div>
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 180,
      render: (cat: string) => <Tag>{cat}</Tag>,
    },
    {
      title: '删除时间',
      dataIndex: 'deletedAt',
      key: 'deletedAt',
      width: 170,
      render: (time: string) => time ? new Date(time).toLocaleString('zh-CN') : '-',
    },
    {
      title: '剩余天数',
      key: 'remain',
      width: 100,
      render: (_: unknown, record: Article) => {
        const remain = getRemainDays(record.deletedAt || '');
        return (
          <span style={{
            color: remain <= 3 ? '#ef4444' : remain <= 7 ? '#f59e0b' : 'var(--text-secondary)',
            fontWeight: remain <= 3 ? 700 : 400,
          }}>
            {remain <= 0 ? '即将清除' : `剩余 ${remain} 天`}
          </span>
        );
      },
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: unknown, record: Article) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" icon={<UndoOutlined />} onClick={() => handleRestore(record.id)}>
            恢复
          </Button>
          <Popconfirm title="确定永久删除？此操作不可恢复" onConfirm={() => handlePermanentDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="breadcrumb">
        <a href="/">首页</a>
        <span className="separator">›</span>
        <span>回收站</span>
      </div>
      <h1 className="page-title">🗑️ 回收站</h1>

      <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: '#a16207', marginBottom: 20 }}>
        💡 删除的知识将在回收站保留30天，逾期将自动物理删除。剩余不足3天的项目标红提醒。
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {!isLoading && deletedArticles.length === 0 ? (
          <div style={{ padding: 60, background: 'white', borderRadius: 8 }}>
            <Empty description="回收站为空" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 8, padding: '0 0 16px' }}>
            <Table
              dataSource={deletedArticles}
              columns={columns}
              rowKey="id"
              pagination={{
                current: page,
                pageSize,
                total,
                onChange: (p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                },
                showSizeChanger: true,
                showTotal: (t) => `共 ${t} 条`,
              }}
              size="middle"
              loading={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
