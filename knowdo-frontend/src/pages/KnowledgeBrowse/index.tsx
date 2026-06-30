import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Select, Button, Dropdown, Modal, message, Checkbox, Typography, Popconfirm, Form } from 'antd';
import {
  SearchOutlined, MoreOutlined,
  PlusOutlined, DeleteOutlined, DatabaseOutlined,
  GlobalOutlined, SwapOutlined, SyncOutlined,
  ThunderboltOutlined, QuestionCircleOutlined, TeamOutlined,
  LinkOutlined, SettingOutlined, DownloadOutlined, ExportOutlined,
  ImportOutlined, FileTextOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAppStore } from '@/store';
import type { Dataset, DatasetType } from '@/types';
import FolderTree from '@/components/dataset/FolderTree';
import AuthorizationModal from '@/components/dataset/AuthorizationModal';
import ImportModal from '@/components/dataset/ImportModal';

const { Title, Text } = Typography;

const datasetTypeConfig: Record<DatasetType, { label: string; color: string; icon: React.ReactNode }> = {
  general: { label: '通用型', color: 'blue', icon: <DatabaseOutlined /> },
  web: { label: 'Web 站点', color: 'green', icon: <GlobalOutlined /> },
  feishu: { label: '飞书文档', color: 'purple', icon: <FileTextOutlined /> },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'default' },
  processing: { label: '处理中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  failed: { label: '失败', color: 'error' },
};

function DatasetListPanel() {
  const navigate = useNavigate();
  const datasets = useAppStore((s) => s.datasets);
  const knowledgeList = useAppStore((s) => s.knowledgeList);
  const deleteDataset = useAppStore((s) => s.deleteDataset);
  const transferDataset = useAppStore((s) => s.transferDataset);
  const reEmbedDataset = useAppStore((s) => s.reEmbedDataset);
  const syncWebDataset = useAppStore((s) => s.syncWebDataset);
  const exportDatasetAsExcel = useAppStore((s) => s.exportDatasetAsExcel);
  const exportFullDataset = useAppStore((s) => s.exportFullDataset);
  const updateDataset = useAppStore((s) => s.updateDataset);
  const datasetFolders = useAppStore((s) => s.datasetFolders);

  const [searchText, setSearchText] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [transferDatasetId, setTransferDatasetId] = useState<string | null>(null);
  const [settingModalVisible, setSettingModalVisible] = useState(false);
  const [settingDataset, setSettingDataset] = useState<Dataset | null>(null);
  const [settingForm] = Form.useForm();
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authDatasetId, setAuthDatasetId] = useState<string | null>(null);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [batchMoveVisible, setBatchMoveVisible] = useState(false);

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

  const getArticleCount = (datasetId: string) => knowledgeList.filter(k => k.datasetId === datasetId).length;

  const getDropdownItems = (dataset: Dataset): MenuProps['items'] => {
    const isWeb = dataset.type === 'web';
    return [
      {
        key: 'sync',
        icon: <SyncOutlined />,
        label: '同步',
        disabled: !isWeb,
        onClick: (e) => {
          e.domEvent.stopPropagation();
          syncWebDataset(dataset.id, 'replace');
          message.success(`正在同步知识库「${dataset.name}」...`);
        },
      },
      {
        key: 'reEmbed',
        icon: <ThunderboltOutlined />,
        label: '重新向量化',
        onClick: (e) => {
          e.domEvent.stopPropagation();
          reEmbedDataset(dataset.id);
          message.success(`正在重新向量化知识库「${dataset.name}」...`);
        },
      },
      {
        key: 'generateQuestions',
        icon: <QuestionCircleOutlined />,
        label: '生成问题',
        onClick: (e) => {
          e.domEvent.stopPropagation();
          message.info(`正在为知识库「${dataset.name}」生成关联问题...（模拟）`);
        },
      },
      { type: 'divider' },
      {
        key: 'auth',
        icon: <TeamOutlined />,
        label: '资源授权',
        onClick: (e) => {
          e.domEvent.stopPropagation();
          setAuthDatasetId(dataset.id);
          setAuthModalVisible(true);
        },
      },
      {
        key: 'relatedResources',
        icon: <LinkOutlined />,
        label: '查看关联资源',
        onClick: (e) => {
          e.domEvent.stopPropagation();
          message.info('查看关联资源（详情页已支持）');
        },
      },
      { type: 'divider' },
      {
        key: 'transfer',
        icon: <SwapOutlined />,
        label: '转移到',
        onClick: (e) => {
          e.domEvent.stopPropagation();
          setTransferDatasetId(dataset.id);
          setTransferModalVisible(true);
        },
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: '设置',
        onClick: (e) => {
          e.domEvent.stopPropagation();
          setSettingDataset(dataset);
          settingForm.setFieldsValue({
            name: dataset.name,
            description: dataset.description,
            vectorModel: dataset.vectorModel,
          });
          setSettingModalVisible(true);
        },
      },
      { type: 'divider' },
      {
        key: 'exportExcel',
        icon: <DownloadOutlined />,
        label: '导出文档（Excel）',
        onClick: (e) => {
          e.domEvent.stopPropagation();
          exportDatasetAsExcel(dataset.id);
        },
      },
      {
        key: 'exportFull',
        icon: <ExportOutlined />,
        label: '导出知识库',
        onClick: (e) => {
          e.domEvent.stopPropagation();
          exportFullDataset(dataset.id);
        },
      },
      { type: 'divider' },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
        danger: true,
        onClick: (e) => {
          e.domEvent.stopPropagation();
          handleDelete(dataset.id);
        },
      },
    ];
  };

  return (
    <div className="flex flex-1 min-h-0">
      {/* 左侧文件夹树 */}
      <div className="w-[260px] min-w-[260px] folder-tree-panel flex flex-col overflow-hidden">
        <div className="folder-tree-header">
          <span className="folder-tree-title">📂 知识库文件夹</span>
        </div>
        <div className="flex-1 overflow-auto p-2">
          <div
            className={`folder-tree-item ${!selectedFolder ? 'active' : ''}`}
            onClick={() => setSelectedFolder(null)}
          >
            <span className="ft-icon"><DatabaseOutlined /></span>
            <span className="ft-label">全部知识库</span>
            <span className="ft-count">{datasets.length}</span>
          </div>
          <FolderTree
            folders={datasetFolders}
            selectedFolder={selectedFolder}
            onSelect={setSelectedFolder}
            datasets={datasets}
          />
        </div>
      </div>

      {/* 右侧知识库列表 */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* 顶部工具栏 */}
        <div className="toolbar">
          <Input
            placeholder="搜索知识库..."
            prefix={<SearchOutlined className="text-gray-400" />}
            className="toolbar-search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <div className="toolbar-spacer" />
          <div className="toolbar-group">
            {batchMode && (
              <Text type="secondary" className="text-sm mr-2">
                已选中 {selectedIds.length} 个
              </Text>
            )}
            {batchMode && selectedIds.length > 0 && (
              <>
                <Popconfirm title={`确定删除选中的 ${selectedIds.length} 个知识库？`} onConfirm={handleBatchDelete}>
                  <Button danger size="small" icon={<DeleteOutlined />}>批量删除</Button>
                </Popconfirm>
                <Button size="small" icon={<SwapOutlined />} onClick={() => setBatchMoveVisible(true)}>批量移动</Button>
              </>
            )}
            <Button
              size="small"
              onClick={() => { setBatchMode(!batchMode); setSelectedIds([]); }}
            >
              {batchMode ? '取消选择' : '批量选择'}
            </Button>
          </div>
          <div className="toolbar-divider" />
          <div className="toolbar-group">
            <Button
              size="small"
              icon={<ImportOutlined />}
              onClick={() => setImportModalVisible(true)}
            >
              导入知识库
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/create')}
            >
              创建知识库
            </Button>
          </div>
        </div>

        {/* 知识库卡片列表 */}
        <div className="flex-1 overflow-auto p-6">
          {filteredDatasets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <DatabaseOutlined style={{ fontSize: 48 }} />
              <Text type="secondary" className="mt-4">暂无知识库数据</Text>
              <Button type="primary" className="mt-4" onClick={() => navigate('/create')}>
                创建第一个知识库
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDatasets.map((dataset) => {
                const typeCfg = datasetTypeConfig[dataset.type];
                const statusCfg = statusConfig[dataset.status];
                const isSelected = selectedIds.includes(dataset.id);
                const iconColorClass = typeCfg.color === 'blue' ? 'blue' : typeCfg.color === 'green' ? 'green' : 'purple';

                return (
                  <div
                    key={dataset.id}
                    className={`dataset-card dataset-card-type-${iconColorClass} ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      if (batchMode) {
                        setSelectedIds((prev) =>
                          prev.includes(dataset.id)
                            ? prev.filter((id) => id !== dataset.id)
                            : [...prev, dataset.id]
                        );
                      } else {
                        navigate(`/detail/${dataset.id}`);
                      }
                    }}
                  >
                    <div className="dataset-card-header">
                      <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                        {batchMode && (
                          <Checkbox
                            checked={isSelected}
                            style={{ marginRight: 10, flexShrink: 0 }}
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
                        <span className={`dataset-card-icon ${iconColorClass}`}>
                          {typeCfg.icon}
                        </span>
                        <div className="dataset-card-body">
                          <div className="dataset-card-title">{dataset.name}</div>
                        </div>
                      </div>
                      <Dropdown menu={{ items: getDropdownItems(dataset) }} trigger={['click']} placement="bottomRight">
                        <button
                          className="dataset-more-btn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreOutlined />
                        </button>
                      </Dropdown>
                    </div>

                    <div className="dataset-card-tags">
                      <span className={`dataset-card-tag ${iconColorClass}`}>{typeCfg.label}</span>
                      <span className={`dataset-card-tag ${dataset.status === 'completed' ? 'green' : dataset.status === 'processing' ? 'blue' : 'slate'}`}>
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="dataset-card-desc">{dataset.description}</div>

                    <div className="dataset-stat-bar">
                      <div className="dataset-stat-item">
                        <span className="stat-dot dot-blue" />
                        <span>文章 {getArticleCount(dataset.id)} 篇</span>
                      </div>
                      <div className="dataset-stat-item">
                        <span className="stat-dot dot-green" />
                        <span>文档 {dataset.documents.length} 个</span>
                      </div>
                      <span className="text-xs" style={{ color: '#94a3b8' }}>{dataset.vectorModel?.split('/').pop()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal
        title="转移知识库"
        open={transferModalVisible}
        onCancel={() => setTransferModalVisible(false)}
        footer={null}
      >
        <p className="mb-3">选择目标文件夹：</p>
        <Select
          className="w-full"
          placeholder="请选择文件夹"
          onChange={(val) => {
            if (transferDatasetId) {
              transferDataset(transferDatasetId, val);
              message.success('转移成功');
            }
            setTransferModalVisible(false);
          }}
        >
          {datasetFolders.map((folder) => (
            <Select.Option key={folder.id} value={folder.id}>{folder.name}</Select.Option>
          ))}
        </Select>
      </Modal>

      <Modal
        title="设置知识库"
        open={settingModalVisible}
        onCancel={() => setSettingModalVisible(false)}
        onOk={() => {
          settingForm.validateFields().then((values) => {
            if (settingDataset) {
              updateDataset(settingDataset.id, values);
              message.success('设置已保存');
            }
            setSettingModalVisible(false);
          });
        }}
      >
        <Form form={settingForm} layout="vertical">
          <Form.Item label="知识库名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="向量模型" name="vectorModel">
            <Select
              options={[
                { value: 'bge-large-zh-v1.5', label: 'BAAI/bge-large-zh-v1.5' },
                { value: 'text-embedding-3-large', label: 'OpenAI/text-embedding-3-large' },
                { value: 'text2vec-large-chinese', label: 'shibing624/text2vec-large-chinese' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <AuthorizationModal
        open={authModalVisible}
        datasetId={authDatasetId || ''}
        onClose={() => { setAuthModalVisible(false); setAuthDatasetId(null); }}
      />

      <ImportModal
        open={importModalVisible}
        onClose={() => setImportModalVisible(false)}
      />

      <Modal
        title="批量移动到"
        open={batchMoveVisible}
        onCancel={() => setBatchMoveVisible(false)}
        footer={null}
      >
        <p className="mb-3">选择目标文件夹：</p>
        <Select
          className="w-full"
          placeholder="请选择目标文件夹"
          onChange={(val) => {
            selectedIds.forEach((id) => transferDataset(id, val));
            message.success(`已将 ${selectedIds.length} 个知识库移动`);
            setSelectedIds([]);
            setBatchMode(false);
            setBatchMoveVisible(false);
          }}
        >
          {datasetFolders.map((folder) => (
            <Select.Option key={folder.id} value={folder.id}>{folder.name}</Select.Option>
          ))}
        </Select>
      </Modal>
    </div>
  );
}

export default function KnowledgeBrowse() {
  return (
    <div className="page-container">
      <div className="breadcrumb">
        <a href="/">首页</a>
        <span className="separator">›</span>
        <span>知识库</span>
      </div>
      <h1 className="page-title">📚 知识库</h1>
      <DatasetListPanel />
    </div>
  );
}
