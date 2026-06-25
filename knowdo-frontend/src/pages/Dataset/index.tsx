import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SearchOutlined,
  PlusOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  FolderOutlined,
  MoreOutlined,
  DeleteOutlined,
  EditOutlined,
  SwapOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { Input, Button, Card, Tag, Dropdown, Checkbox, Space, Typography, Popconfirm, message, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { useAppStore } from '@/store';
import type { Dataset, DatasetType } from '@/types';

const { Title, Text } = Typography;

const datasetTypeConfig: Record<DatasetType, { label: string; color: string; icon: React.ReactNode }> = {
  general: { label: '通用型', color: 'blue', icon: <DatabaseOutlined /> },
  web: { label: 'Web 站点', color: 'green', icon: <GlobalOutlined /> },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'default' },
  processing: { label: '处理中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  failed: { label: '失败', color: 'error' },
};

export default function DatasetPage() {
  const navigate = useNavigate();
  const datasets = useAppStore((s) => s.datasets);
  const deleteDataset = useAppStore((s) => s.deleteDataset);
  const transferDataset = useAppStore((s) => s.transferDataset);
  const datasetFolders = useAppStore((s) => s.datasetFolders);

  const [searchText, setSearchText] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredDatasets = datasets.filter((ds) => {
    const matchSearch = ds.name.toLowerCase().includes(searchText.toLowerCase()) || ds.description.toLowerCase().includes(searchText.toLowerCase());
    const matchFolder = !selectedFolder || ds.folderId === selectedFolder;
    return matchSearch && matchFolder;
  });

  const handleDelete = (id: string) => {
    deleteDataset(id);
    message.success('知识库已删除');
  };

  const handleBatchDelete = () => {
    selectedIds.forEach((id) => deleteDataset(id));
    setSelectedIds([]);
    setBatchMode(false);
    message.success(`已删除 ${selectedIds.length} 个知识库`);
  };

  const getDropdownItems = (dataset: Dataset): MenuProps['items'] => [
    { key: 'edit', icon: <EditOutlined />, label: '编辑' },
    { key: 'transfer', icon: <SwapOutlined />, label: '转移到' },
    { type: 'divider' },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
      onClick: (e) => { e.domEvent.stopPropagation(); handleDelete(dataset.id); },
    },
  ];

  return (
    <div className="flex h-full">
      {/* 左侧文件夹树 */}
      <div className="w-[260px] min-w-[260px] bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Title level={5} className="!mb-0">知识库</Title>
        </div>
        <div className="flex-1 overflow-auto p-2">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
              !selectedFolder ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
            }`}
            onClick={() => setSelectedFolder(null)}
          >
            <DatabaseOutlined />
            <span className="text-sm">全部知识库</span>
            <Text type="secondary" className="text-xs ml-auto">{datasets.length}</Text>
          </div>
          {datasetFolders.map((folder) => (
            <div
              key={folder.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors mt-1 ${
                selectedFolder === folder.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedFolder(folder.id)}
            >
              <FolderOutlined />
              <span className="text-sm">{folder.name}</span>
              <Text type="secondary" className="text-xs ml-auto">
                {datasets.filter((ds) => ds.folderId === folder.id).length}
              </Text>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧知识库列表 */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* 顶部工具栏 */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
          <Input
            placeholder="搜索知识库..."
            prefix={<SearchOutlined className="text-gray-400" />}
            className="max-w-[300px]"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <div className="flex-1" />
          {batchMode && (
            <Text type="secondary" className="text-sm">
              已选中 {selectedIds.length} 个知识库
            </Text>
          )}
          {batchMode && selectedIds.length > 0 && (
            <Popconfirm title={`确定删除选中的 ${selectedIds.length} 个知识库？`} onConfirm={handleBatchDelete}>
              <Button danger size="small" icon={<DeleteOutlined />}>批量删除</Button>
            </Popconfirm>
          )}
          <Button
            size="small"
            onClick={() => { setBatchMode(!batchMode); setSelectedIds([]); }}
          >
            {batchMode ? '取消选择' : '批量选择'}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/dataset/create')}
          >
            创建知识库
          </Button>
        </div>

        {/* 知识库卡片列表 */}
        <div className="flex-1 overflow-auto p-6">
          {filteredDatasets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <DatabaseOutlined style={{ fontSize: 48 }} />
              <Text type="secondary" className="mt-4">暂无知识库数据</Text>
              <Button type="primary" className="mt-4" onClick={() => navigate('/dataset/create')}>
                创建第一个知识库
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDatasets.map((dataset) => {
                const typeCfg = datasetTypeConfig[dataset.type];
                const statusCfg = statusConfig[dataset.status];
                const isSelected = selectedIds.includes(dataset.id);

                return (
                  <Card
                    key={dataset.id}
                    className={`transition-all hover:shadow-md cursor-pointer ${
                      isSelected ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => {
                      if (batchMode) {
                        setSelectedIds((prev) =>
                          prev.includes(dataset.id)
                            ? prev.filter((id) => id !== dataset.id)
                            : [...prev, dataset.id]
                        );
                      } else {
                        navigate(`/dataset/${dataset.id}`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {batchMode && (
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              setSelectedIds((prev) =>
                                prev.includes(dataset.id)
                                  ? prev.filter((id) => id !== dataset.id)
                                  : [...prev, dataset.id]
                              );
                            }}
                          />
                        )}
                        <span className="text-lg" style={{ color: typeCfg.color === 'blue' ? '#1890ff' : '#52c41a' }}>
                          {typeCfg.icon}
                        </span>
                        <Text strong className="text-base">{dataset.name}</Text>
                      </div>
                      <Dropdown menu={{ items: getDropdownItems(dataset) }} trigger={['click']}>
                        <Button
                          type="text"
                          size="small"
                          icon={<MoreOutlined />}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Dropdown>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <Tag color={typeCfg.color}>{typeCfg.label}</Tag>
                      <Tag color={statusCfg.color}>{statusCfg.label}</Tag>
                    </div>

                    <Text type="secondary" className="text-sm block mb-3 line-clamp-2">
                      {dataset.description}
                    </Text>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>文档: {dataset.documents.length} 个</span>
                      <span>向量模型: {dataset.vectorModel}</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      更新时间: {dataset.updatedAt}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
