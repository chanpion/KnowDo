import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Popconfirm, Empty, message, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, StarFilled, SwapOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store';
import { formatTime, formatCount } from '@/mock/data';
import type { Knowledge } from '@/types';

const TYPE_ICONS: Record<string, string> = { doc: '📄', image: '🖼️', video: '🎬', audio: '🎵', link: '🔗', qa: '❓' };

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { knowledgeList, favoriteFolders, addFavoriteFolder, renameFavoriteFolder, deleteFavoriteFolder, toggleFavorite, moveToFolder } = useAppStore();
  const [activeFolderId, setActiveFolderId] = useState('fav-default');
  const [newFolderName, setNewFolderName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [movingKnowledgeId, setMovingKnowledgeId] = useState<string | null>(null);

  const currentFolder = favoriteFolders.find(f => f.id === activeFolderId);
  const favoritedKnowledge = knowledgeList.filter(k => {
    if (!k.isFavorited) return false;
    if (currentFolder) {
      return currentFolder.knowledgeIds.includes(k.id);
    }
    return true;
  });

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    addFavoriteFolder(newFolderName.trim());
    setNewFolderName('');
    message.success('收藏夹已创建');
  };

  const handleRename = (id: string) => {
    if (!editName.trim()) return;
    renameFavoriteFolder(id, editName.trim());
    setEditingId(null);
    message.success('已重命名');
  };

  const handleDeleteFolder = (id: string) => {
    if (id === 'fav-default') {
      message.warning('默认收藏夹不可删除');
      return;
    }
    deleteFavoriteFolder(id);
    if (activeFolderId === id) setActiveFolderId('fav-default');
    message.success('收藏夹已删除');
  };

  const handleOpenMove = (knowledgeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMovingKnowledgeId(knowledgeId);
    setMoveModalVisible(true);
  };

  const handleMoveToFolder = (folderId: string) => {
    if (!movingKnowledgeId) return;
    moveToFolder(movingKnowledgeId, folderId);
    message.success('移动成功');
    setMoveModalVisible(false);
    setMovingKnowledgeId(null);
  };

  return (
    <div className="page-container">
      <div className="breadcrumb">
        <a href="/">首页</a>
        <span className="separator">›</span>
        <span>我的收藏</span>
      </div>
      <h1 className="page-title">⭐ 我的收藏</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'start' }}>
        {/* 左侧收藏夹列表 */}
        <div className="model-sidebar">
          <div className="model-sidebar-section">
            <div className="model-sidebar-section-title">收藏夹</div>
            <div className="model-provider-list">
              {favoriteFolders.map(folder => (
                <div
                  key={folder.id}
                  className={`model-provider-item ${activeFolderId === folder.id ? 'active' : ''}`}
                  onClick={() => setActiveFolderId(folder.id)}
                >
                  <div style={{ flex: 1 }}>
                    {editingId === folder.id ? (
                      <Input
                        size="small"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onPressEnter={() => handleRename(folder.id)}
                        onBlur={() => handleRename(folder.id)}
                        autoFocus
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span className="model-provider-name">
                        <StarFilled style={{ color: '#f59e0b', marginRight: 6, fontSize: 12 }} />
                        {folder.name}
                      </span>
                    )}
                  </div>
                  {folder.id !== 'fav-default' && (
                    <div style={{ display: 'flex', gap: 2 }} onClick={e => e.stopPropagation()}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined style={{ fontSize: 11 }} />}
                        onClick={() => { setEditingId(folder.id); setEditName(folder.name); }}
                      />
                      <Popconfirm title="确定删除此收藏夹？" onConfirm={() => handleDeleteFolder(folder.id)}>
                        <Button type="text" size="small" danger icon={<DeleteOutlined style={{ fontSize: 11 }} />} />
                      </Popconfirm>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* 新建收藏夹 */}
          <div style={{ padding: '8px 12px 12px', display: 'flex', gap: 8 }}>
            <Input
              size="small"
              placeholder="新建收藏夹"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onPressEnter={handleAddFolder}
            />
            <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleAddFolder} />
          </div>
        </div>

        {/* 右侧知识列表 */}
        <div className="model-content">
          {favoritedKnowledge.length === 0 ? (
            <div style={{ padding: 80 }}>
              <Empty
                description={currentFolder ? `"${currentFolder.name}"为空` : '暂无收藏的知识'}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, padding: 16 }}>
              {favoritedKnowledge.map(item => (
                <div key={item.id} className="knowledge-card" onClick={() => navigate(`/detail/${item.id}`)}>
                  <span className={`kc-type-badge ${item.type}`}>
                    {TYPE_ICONS[item.type] || '📄'} {item.typeLabel}
                  </span>
                  <div className="kc-title">{item.title}</div>
                  <div className="kc-summary">{item.summary}</div>
                  <div className="kc-tags">
                    {(item.tags || []).slice(0, 3).map(tag => (
                      <span key={tag} className="tag tag-blue">{tag}</span>
                    ))}
                  </div>
                  <div className="kc-meta">
                    <div className="kc-meta-left">
                      <span>👤 {item.author}</span>
                      <span>{formatTime(item.publishTime)}</span>
                    </div>
                    <div className="kc-meta-right">
                      <Button
                        type="text"
                        size="small"
                        icon={<SwapOutlined />}
                        onClick={(e) => handleOpenMove(item.id, e)}
                        title="移动至收藏夹"
                      />
                      <span onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}>
                        ⭐ {formatCount(item.favoriteCount)}
                      </span>
                      <span>👁 {formatCount(item.viewCount)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 移动至收藏夹弹窗 */}
      <Modal
        title="移动至收藏夹"
        open={moveModalVisible}
        onCancel={() => { setMoveModalVisible(false); setMovingKnowledgeId(null); }}
        footer={null}
        width={360}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {favoriteFolders.map(folder => (
            <div
              key={folder.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                background: folder.id === activeFolderId ? 'var(--bg-page)' : 'transparent',
                border: '1px solid var(--border-color)',
                transition: 'all 0.2s',
              }}
              onClick={() => handleMoveToFolder(folder.id)}
            >
              <span>
                <StarFilled style={{ color: '#f59e0b', marginRight: 8, fontSize: 12 }} />
                {folder.name}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {folder.knowledgeIds.length} 项
              </span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
