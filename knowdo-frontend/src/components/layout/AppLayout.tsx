import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { Dropdown } from 'antd';
import { EditOutlined, DeleteOutlined, StarOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';

const NAV_ITEMS = [
  { key: 'home', path: '/', label: '首页', icon: '🏠' },
  { key: 'browse', path: '/browse', label: '知识库', icon: '📚' },
  { key: 'model', path: '/model', label: '模型管理', icon: '🤖' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useAppStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const currentPage = NAV_ITEMS.find(item => {
    if (item.path === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.path);
  })?.key || 'home';

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="app-layout">
      {/* 顶部导航 */}
      <header className="app-header">
        <div className="app-header-inner">
          <Link to="/" className="header-logo">
            <span className="logo-icon">知</span>
            <span>知行 KnowDo</span>
          </Link>

          <nav className="header-nav">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.key}
                to={item.path}
                className={`nav-tab ${currentPage === item.key ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="header-search">
            <input type="text" placeholder="搜索知识、文档、问答..." />
            <span className="search-icon">🔍</span>
          </div>

          <div className="header-right" ref={notifRef}>
            <button className="header-btn" onClick={() => setNotifOpen(!notifOpen)}>
              <span>🔔</span>
              {unreadCount > 0 && <span className="badge" />}
            </button>

            {notifOpen && (
              <div className="notif-dropdown" style={{ right: -160 }}>
                <div className="dropdown-header">
                  <span className="dropdown-title">消息通知</span>
                  <a href="#" style={{ fontSize: 12, color: '#1a56db' }} onClick={(e) => { e.preventDefault(); markAllNotificationsRead(); }}>全部已读</a>
                </div>
                <div className="dropdown-body">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className={`dropdown-item ${n.read ? '' : 'unread'}`}
                      onClick={() => markNotificationRead(n.id)}
                    >
                      <div className="notif-icon" style={{ background: n.read ? '#f1f5f9' : '#eff6ff' }}>{n.icon}</div>
                      <div className="notif-content">
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-desc">{n.desc}</div>
                        <div className="notif-time">{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="dropdown-footer">
                  <a href="#">查看全部通知</a>
                </div>
              </div>
            )}

            <Dropdown
              menu={{
                items: [
                  { key: 'drafts', icon: <FileTextOutlined />, label: '草稿箱', onClick: () => navigate('/drafts') },
                  { key: 'favorites', icon: <StarOutlined />, label: '我的收藏', onClick: () => navigate('/favorites') },
                  { type: 'divider' },
                  { key: 'review', icon: <CheckCircleOutlined />, label: '审核管理', onClick: () => navigate('/review') },
                  { key: 'recycle', icon: <DeleteOutlined />, label: '回收站', onClick: () => navigate('/recycle') },
                  { key: 'tags', icon: <EditOutlined />, label: '标签管理', onClick: () => navigate('/tags') },
                ],
              }}
              trigger={['click']}
              placement="bottomRight"
            >
              <div className="header-user" style={{ cursor: 'pointer' }}>
                <span className="avatar">{user.avatar}</span>
                <span className="user-name">{user.name}</span>
                <span className="chevron">▼</span>
              </div>
            </Dropdown>
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <div className="app-body">
        <div className="app-content">
          {children}
        </div>
      </div>
    </div>
  );
}
