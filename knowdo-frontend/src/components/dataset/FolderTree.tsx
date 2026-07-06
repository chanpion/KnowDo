import { useState } from 'react';
import { Dropdown, Button } from 'antd';
import type { MenuProps } from 'antd';
import {
  FolderOutlined, FolderOpenOutlined, CaretRightOutlined,
  PlusOutlined, MoreOutlined, EditOutlined, DeleteOutlined,
} from '@ant-design/icons';
import type { KnowledgeFolder, KnowledgeBase } from '@/types';

const MAX_DEPTH = 2;

interface FolderTreeProps {
  folders: KnowledgeFolder[];
  selectedFolder: string | null;
  onSelect: (folderId: string | null) => void;
  knowledgeBases: KnowledgeBase[];
  depth?: number;
  onAddSubfolder?: (parentId: string) => void;
  onRename?: (folderId: string, currentName: string) => void;
  onDelete?: (folderId: string, folderName: string) => void;
}

function countKnowledgeBasesInFolder(folderId: string, kbList: KnowledgeBase[], allFolders: KnowledgeFolder[]): number {
  let count = kbList.filter((ds) => ds.folderId === folderId).length;
  const children = allFolders.filter((f) => f.parentId === folderId);
  for (const child of children) {
    count += countKnowledgeBasesInFolder(child.id, kbList, allFolders);
  }
  return count;
}

export default function FolderTree({
  folders, selectedFolder, onSelect, knowledgeBases: kbList, depth = 0,
  onAddSubfolder, onRename, onDelete,
}: FolderTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const getDropdownItems = (folder: KnowledgeFolder): MenuProps['items'] => {
    const items: MenuProps['items'] = [];
    if (depth < MAX_DEPTH) {
      items.push({
        key: 'addSubfolder',
        icon: <PlusOutlined />,
        label: '新建子文件夹',
        onClick: () => onAddSubfolder?.(folder.id),
      });
      items.push({ type: 'divider' });
    }
    items.push({
      key: 'rename',
      icon: <EditOutlined />,
      label: '重命名',
      onClick: () => onRename?.(folder.id, folder.name),
    });
    items.push({ type: 'divider' });
    items.push({
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
      onClick: () => onDelete?.(folder.id, folder.name),
    });
    return items;
  };

  return (
    <>
      {folders.map((folder) => {
        const isExpanded = expandedIds.has(folder.id);
        const hasChildren = folder.children && folder.children.length > 0;
        const totalCount = countKnowledgeBasesInFolder(folder.id, kbList, folders);
        const isSelected = selectedFolder === folder.id;

        return (
          <div key={folder.id}>
            <div className="folder-tree-item-wrapper">
              <div
                className={`folder-tree-item ${isSelected ? 'active' : ''}`}
                style={{ paddingLeft: `${12 + depth * 16}px` }}
                onClick={() => {
                  onSelect(isSelected ? null : folder.id);
                  if (hasChildren) toggleExpand(folder.id);
                }}
              >
                {hasChildren ? (
                  <span
                    className={`ft-expand ${isExpanded ? 'expanded' : ''}`}
                    onClick={(e) => { e.stopPropagation(); toggleExpand(folder.id); }}
                  >
                    <CaretRightOutlined />
                  </span>
                ) : (
                  <span className="ft-expand" />
                )}
                <span className="ft-icon">
                  {isExpanded ? <FolderOpenOutlined /> : <FolderOutlined />}
                </span>
                <span className="ft-label">{folder.name}</span>
                {totalCount > 0 && (
                  <span className="ft-count">{totalCount}</span>
                )}
              </div>
              <div className="folder-tree-actions">
                <Dropdown menu={{ items: getDropdownItems(folder) }} trigger={['click']} placement="bottomRight">
                  <Button
                    type="text"
                    size="small"
                    icon={<MoreOutlined />}
                    className="ft-action-btn"
                    onClick={(e) => e.stopPropagation()}
                  />
                </Dropdown>
              </div>
            </div>
            {hasChildren && isExpanded && (
              <FolderTree
                folders={folder.children!}
                selectedFolder={selectedFolder}
                onSelect={onSelect}
                knowledgeBases={kbList}
                depth={depth + 1}
                onAddSubfolder={onAddSubfolder}
                onRename={onRename}
                onDelete={onDelete}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
