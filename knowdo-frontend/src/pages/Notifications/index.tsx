import { useNavigate } from 'react-router-dom';
import { Typography, Button, Tag, Empty } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { useNotificationList, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/use-notifications';

const { Title, Text } = Typography;

const typeConfig: Record<string, { color: string; label: string }> = {
  publish: { color: 'blue', label: '发布通知' },
  review: { color: 'orange', label: '审核提醒' },
  comment: { color: 'purple', label: '评论' },
  like: { color: 'red', label: '点赞' },
  expire: { color: 'gold', label: '过期提醒' },
  system: { color: 'default', label: '系统通知' },
};

interface NotificationItem {
  id: string;
  type: string;
  read: boolean;
  icon: string;
  title: string;
  desc: string;
  time: string;
  targetId?: string;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useNotificationList();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications: NotificationItem[] = (data as any)?.items || [];
  const unreadCount = (data as any)?.unreadCount || 0;

  const handleClick = (n: NotificationItem) => {
    markRead.mutate(n.id);
    if (n.targetId) {
      navigate(`/article/${n.targetId}`);
    } else if (n.type === 'review') {
      navigate('/review');
    }
  };

  return (
    <div className="page-container">
      <div className="breadcrumb">
        <a href="/">首页</a>
        <span className="separator">›</span>
        <span>通知中心</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>🔔 通知中心</Title>
        {unreadCount > 0 && (
          <Button icon={<CheckOutlined />} onClick={() => markAllRead.mutate()} type="primary" ghost size="small">
            全部已读（{unreadCount}）
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Empty description="暂无通知" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                padding: '16px 20px',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                background: n.read ? '#fff' : '#f0f5ff',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { if (n.read) e.currentTarget.style.background = '#fafafa'; }}
              onMouseLeave={(e) => { if (n.read) e.currentTarget.style.background = '#fff'; }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                background: n.read ? '#f5f5f5' : '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>
                {n.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Text strong style={{ fontSize: 14 }}>{n.title}</Text>
                  {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a56db', flexShrink: 0 }} />}
                  <Tag style={{ marginLeft: 4, fontSize: 11 }}>{typeConfig[n.type]?.label || n.type}</Tag>
                </div>
                <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>{n.desc}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{n.time}</Text>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}