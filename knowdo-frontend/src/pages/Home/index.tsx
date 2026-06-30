import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { getHotKnowledge, getLatestKnowledge, formatCount, formatTime } from '@/mock/data';

const QUICK_ACTIONS = [
  { key: 'create-kb', label: '创建知识库', desc: '新建知识库容器', icon: '🗂️', color: 'blue', path: '/create' },
  { key: 'create-article', label: '创建文章', desc: '编写知识文章', icon: '📝', color: 'green', path: '/create/article' },
  { key: 'browse', label: '浏览知识库', desc: '查看所有知识库', icon: '📚', color: 'purple', path: '/browse' },
  { key: 'review', label: '待审核', desc: '审核待发布的文章', icon: '✅', color: 'orange', path: '/review' },
];

export default function Home() {
  const navigate = useNavigate();
  const { knowledgeList, datasets, toggleLike, toggleFavorite } = useAppStore();
  const hotList = getHotKnowledge();
  const latestList = getLatestKnowledge();

  const totalDocuments = datasets.reduce((sum, ds) => sum + ds.documents.length, 0);

  const STAT_CARDS = [
    { key: 'datasets', label: '知识库', icon: '🗂️', color: 'blue' as const, value: formatCount(datasets.length) },
    { key: 'articles', label: '知识文章', icon: '📄', color: 'green' as const, value: formatCount(knowledgeList.length) },
    { key: 'documents', label: '文档总量', icon: '📎', color: 'purple' as const, value: formatCount(totalDocuments) },
    { key: 'views', label: '今日浏览', icon: '👁', color: 'orange' as const, value: formatCount(knowledgeList.reduce((s, k) => s + k.viewCount, 0)) },
  ];

  return (
    <div className="page-container">
      {/* 统计卡片 */}
      <div className="stat-cards">
        {STAT_CARDS.map(card => (
          <div key={card.key} className="stat-card">
            <div className={`stat-card-icon ${card.color}`}>{card.icon}</div>
            <div className="stat-card-info">
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 快捷入口 */}
      <div className="quick-actions">
        {QUICK_ACTIONS.map(action => (
          <div
            key={action.key}
            className="quick-action-item"
            onClick={() => navigate(action.path)}
          >
            <div className={`qa-icon ${action.color}`}>{action.icon}</div>
            <div className="qa-text">
              <div className="qa-title">{action.label}</div>
              <div className="qa-desc">{action.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 双栏面板 */}
      <div className="panel-grid">
        {/* 热门知识 Top10 */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">🔥 热门文章 Top10</span>
            <a href="#" className="panel-link" onClick={(e) => { e.preventDefault(); navigate('/browse'); }}>查看全部 →</a>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            {hotList.map((item, index) => (
              <div
                key={item.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 20px', borderBottom: '1px solid var(--border-color)',
                  cursor: 'pointer', transition: 'background 0.2s',
                }}
                className="hover:bg-gray-50"
                onClick={() => navigate(`/article/${item.id}`)}
              >
                <span style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: index < 3 ? '#eff6ff' : '#f1f5f9',
                  color: index < 3 ? '#1a56db' : '#94a3b8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}>
                  {index + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    👁 {formatCount(item.viewCount)} · {item.author}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 最新时间线 */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">📋 最新发布</span>
            <a href="#" className="panel-link" onClick={(e) => { e.preventDefault(); navigate('/browse'); }}>查看全部 →</a>
          </div>
          <div className="panel-body">
            {latestList.map(item => (
              <div key={item.id} className="timeline-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/article/${item.id}`)}>
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="tl-title">{item.title}</div>
                  <div className="tl-meta">
                    <span>👤 {item.author}</span>
                    <span>{formatTime(item.publishTime)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
