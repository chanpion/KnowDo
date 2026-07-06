import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, Popconfirm, Empty, message, Modal, Spin } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, StarFilled, SwapOutlined } from "@ant-design/icons";
import {
  useFavoriteFolders,
  useCreateFavoriteFolder,
  useRenameFavoriteFolder,
  useDeleteFavoriteFolder,
  useMoveToFolder,
  useFavoriteFolderArticles,
} from "@/hooks/use-article";

const TYPE_ICONS: Record<string, string> = { doc: "📄", image: "🖼️", video: "🎬", audio: "🎵", link: "🔗", qa: "❓" };

function fmtTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return Math.floor(diff / 60000) + " 分钟前";
  if (diff < 86400000) return Math.floor(diff / 3600000) + " 小时前";
  if (diff < 604800000) return Math.floor(diff / 86400000) + " 天前";
  return dateStr.split("T")[0] || dateStr;
}

function fmtCount(num: number): string {
  if (num >= 10000) return (num / 10000).toFixed(1) + "w";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return String(num);
}

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { data: favoriteFolders = [], isLoading: foldersLoading } = useFavoriteFolders();
  const [activeFolderId, setActiveFolderId] = useState("fav-default");
  const { data: folderArticles, isLoading: articlesLoading } = useFavoriteFolderArticles(activeFolderId);
  const createFolder = useCreateFavoriteFolder();
  const renameFolder = useRenameFavoriteFolder();
  const deleteFolder = useDeleteFavoriteFolder();
  const moveToFolder = useMoveToFolder();
  const [newFolderName, setNewFolderName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [movingArticleId, setMovingArticleId] = useState<string | null>(null);

  const currentFolder = favoriteFolders.find((f) => f.id === activeFolderId);
  const favoritedArticles = folderArticles?.items || [];

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    createFolder.mutateAsync(newFolderName.trim()).then(() => {
      setNewFolderName("");
      message.success("收藏夹已创建");
    });
  };

  const handleRename = (id: string) => {
    if (!editName.trim()) return;
    renameFolder.mutateAsync({ id, name: editName.trim() }).then(() => {
      setEditingId(null);
      message.success("已重命名");
    });
  };

  const handleDeleteFolder = (id: string) => {
    if (id === "fav-default") {
      message.warning("默认收藏夹不可删除");
      return;
    }
    deleteFolder.mutateAsync(id).then(() => {
      if (activeFolderId === id) setActiveFolderId("fav-default");
      message.success("收藏夹已删除");
    });
  };

  const handleOpenMove = (knowledgeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMovingArticleId(knowledgeId);
    setMoveModalVisible(true);
  };

  const handleMoveToFolder = (folderId: string) => {
    if (!movingArticleId) return;
    moveToFolder.mutateAsync({ articleId: movingArticleId, folderId }).then(() => {
      message.success("移动成功");
      setMoveModalVisible(false);
      setMovingArticleId(null);
    });
  };

  const renderFolders = () => {
    if (foldersLoading) return <div style={{ padding: 16, textAlign: 'center' }}><Spin size="small" /></div>;
    return favoriteFolders.map(folder => (
      <div key={folder.id} className="folder-tree-item-wrapper">
        <div className={`folder-tree-item ${activeFolderId === folder.id ? 'active' : ''}`} onClick={() => setActiveFolderId(folder.id)}>
          <span className="ft-icon">⭐</span>
          <span className="ft-label">
            {editingId === folder.id ? (
              <Input size="small" value={editName} onChange={e => setEditName(e.target.value)}
                onPressEnter={() => handleRename(folder.id)} onBlur={() => handleRename(folder.id)} autoFocus onClick={e => e.stopPropagation()} />
            ) : folder.name}
          </span>
          <span className="ft-count">{folder.count}</span>
        </div>
        {folder.id !== 'fav-default' && (
          <div className="folder-tree-actions">
            <Button type="text" size="small" icon={<EditOutlined />}
              onClick={(e) => { e.stopPropagation(); setEditingId(folder.id); setEditName(folder.name); }} />
            <Popconfirm title="确定删除此收藏夹？" onConfirm={() => handleDeleteFolder(folder.id)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={e => e.stopPropagation()} />
            </Popconfirm>
          </div>
        )}
      </div>
    ));
  };

  const renderArticleGrid = () => {
    if (articlesLoading) return <div style={{ padding: 80, textAlign: 'center' }}><Spin size="large" /></div>;
    if (favoritedArticles.length === 0) {
      return (
        <div style={{ padding: 80 }}>
          <Empty description={currentFolder ? `"${currentFolder.name}"为空` : '暂无收藏的知识'} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      );
    }
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, padding: 16 }}>
        {favoritedArticles.map(item => (
          <div key={item.id} className="knowledge-card" onClick={() => navigate(`/article/${item.id}`)}>
            <span className={`kc-type-badge ${item.type}`}>
              {TYPE_ICONS[item.type] || '📄'} {item.typeLabel}
            </span>
            <div className="kc-title">{item.title}</div>
            <div className="kc-summary">{item.summary}</div>
            <div className="kc-tags">
              {(item.tags || []).slice(0, 3).map(tag => <span key={tag} className="tag tag-blue">{tag}</span>)}
            </div>
            <div className="kc-meta">
              <div className="kc-meta-left">
                <span>👤 {item.author}</span>
                <span>{fmtTime(item.publishTime)}</span>
              </div>
              <div className="kc-meta-right">
                <Button type="text" size="small" icon={<SwapOutlined />} onClick={(e) => handleOpenMove(item.id, e)} title="移动至收藏夹" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="breadcrumb">
        <a href="/">首页</a>
        <span className="separator">›</span>
        <span>我的收藏</span>
      </div>
      <h1 className="page-title">⭐ 我的收藏</h1>
      <div className="flex flex-1 min-h-0">
        <div className="folder-tree-panel flex flex-col overflow-hidden w-[260px] min-w-[260px]">
          <div className="flex-1 overflow-auto p-4">
            {renderFolders()}
            <div style={{ display: 'flex', gap: 8, marginTop: 8, padding: '0 4px' }}>
              <Input size="small" placeholder="新建收藏夹" value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)} onPressEnter={handleAddFolder} />
              <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleAddFolder} />
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          {renderArticleGrid()}
        </div>
      </div>
      <Modal title="移动至收藏夹" open={moveModalVisible}
        onCancel={() => { setMoveModalVisible(false); setMovingArticleId(null); }}
        footer={null} width={360}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {favoriteFolders.map(folder => (
            <div key={folder.id}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                background: folder.id === activeFolderId ? 'var(--bg-page)' : 'transparent',
                border: '1px solid var(--border-color)', transition: 'all 0.2s' }}
              onClick={() => handleMoveToFolder(folder.id)}>
              <span><StarFilled style={{ color: '#f59e0b', marginRight: 8, fontSize: 12 }} />{folder.name}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{folder.articleIds.length} 项</span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
