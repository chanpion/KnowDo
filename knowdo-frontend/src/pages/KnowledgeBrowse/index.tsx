import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Select, Button, Dropdown, Modal, message, Checkbox, Typography, Popconfirm, Form } from 'antd';
import {
  SearchOutlined, MoreOutlined,
  PlusOutlined, DeleteOutlined, DatabaseOutlined,
  GlobalOutlined, SwapOutlined, SyncOutlined,
  ThunderboltOutlined, QuestionCircleOutlined, TeamOutlined,
  LinkOutlined, SettingOutlined, DownloadOutlined, ExportOutlined,
  FileTextOutlined,
  FolderAddOutlined,
  UnorderedListOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { KnowledgeBase, KnowledgeBaseType } from '@/types';
import {
  useKnowledgeBaseList,
  useKnowledgeFolders,
  useDeleteKnowledgeBase,
  useUpdateKnowledgeBase,
  useCreateFolder,
  useRenameFolder,
  useDeleteFolder,
} from '@/hooks/use-knowledgebase';
import FolderTree from '@/components/dataset/FolderTree';
import AuthorizationModal from '@/components/dataset/AuthorizationModal';
import ImportModal from '@/components/dataset/ImportModal';
import CreateDatasetModal from '@/components/dataset/CreateDatasetModal';

const { Text } = Typography;

const knowledgeBaseTypeConfig: Record<KnowledgeBaseType, { label: string; color: string; icon: React.ReactNode }> = {
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
  // 从后端加载知识库和文件夹数据
  const { data: kbData, isLoading: kbLoading } = useKnowledgeBaseList();
  const { data: foldersData } = useKnowledgeFolders();
  const knowledgeBases = (kbData as any)?.items || [];
  const knowledgeFolders = foldersData || [];

  // 使用 react-query 的真实加载状态
  const loading = kbLoading;

  const deleteKbMutate = useDeleteKnowledgeBase();
  const updateKbMutate = useUpdateKnowledgeBase();
  const createFolderMutate = useCreateFolder();
  const renameFolderMutate = useRenameFolder();
  const deleteFolderMutate = useDeleteFolder();

  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('datasetViewMode') as 'grid' | 'list') || 'grid';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // 使用 react-query 的真实加载状态

  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [transferKnowledgeBaseId, setTransferKnowledgeBaseId] = useState<string | null>(null);
  const [settingModalVisible, setSettingModalVisible] = useState(false);
  const [settingKnowledgeBase, setSettingKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [settingForm] = Form.useForm();
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authKnowledgeBaseId, setAuthKnowledgeBaseId] = useState<string | null>(null);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [batchMoveVisible, setBatchMoveVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [folderModalMode, setFolderModalMode] = useState<'add-root' | 'add-sub' | 'rename'>('add-root');
  const [folderModalParentId, setFolderModalParentId] = useState<string | null>(null);
  const [folderModalEditId, setFolderModalEditId] = useState<string | null>(null);
  const [folderModalName, setFolderModalName] = useState('');

  // 搜索防抖
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const handleSearchChange = useCallback((value: string) => {
    setSearchText(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(value), 300);
  }, []);

  // 视图模式切换
  const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('datasetViewMode', mode);
  }, []);

  const filteredKnowledgeBases = knowledgeBases.filter((ds: KnowledgeBase) => {
    const searchKey = debouncedSearch || searchText;
    const matchSearch = !searchKey || ds.name.toLowerCase().includes(searchKey.toLowerCase()) || (ds.description || '').toLowerCase().includes(searchKey.toLowerCase());
    const matchFolder = !selectedFolder || ds.folderId === selectedFolder;
    return matchSearch && matchFolder;
  });

  const handleDelete = (id: string) => {
    deleteKbMutate.mutate(id);
    message.success('知识库已删除');
  };

  const handleBatchDelete = () => {
    selectedIds.forEach((id) => deleteKbMutate.mutate(id));
    setSelectedIds([]);
    setBatchMode(false);
    message.success(`已删除 ${selectedIds.length} 个知识库`);
  };

  // 文件夹 CRUD
  const handleOpenAddRoot = () => {
    setFolderModalMode('add-root');
    setFolderModalParentId(null);
    setFolderModalEditId(null);
    setFolderModalName('');
    setFolderModalVisible(true);
  };

  const handleOpenAddSubfolder = (parentId: string) => {
    setFolderModalMode('add-sub');
    setFolderModalParentId(parentId);
    setFolderModalEditId(null);
    setFolderModalName('');
    setFolderModalVisible(true);
  };

  const handleOpenRename = (folderId: string, currentName: string) => {
    setFolderModalMode('rename');
    setFolderModalParentId(null);
    setFolderModalEditId(folderId);
    setFolderModalName(currentName);
    setFolderModalVisible(true);
  };

  const handleFolderModalOk = () => {
    const name = folderModalName.trim();
    if (!name) {
      message.warning('请输入文件夹名称');
      return;
    }
    if (folderModalMode === 'rename' && folderModalEditId) {
      renameFolderMutate.mutate({ id: folderModalEditId, name });
      message.success('文件夹已重命名');
    } else if (folderModalMode === 'add-sub' && folderModalParentId) {
      createFolderMutate.mutate({ name, parentId: folderModalParentId });
      message.success('子文件夹已创建');
    } else {
      createFolderMutate.mutate({ name, parentId: null });
      message.success('文件夹已创建');
    }
    setFolderModalVisible(false);
  };

  const handleDeleteFolder = (folderId: string, folderName: string) => {
    Modal.confirm({
      title: `删除文件夹「${folderName}」？`,
      content: '删除后，该文件夹下的子文件夹和知识库将不再属于此文件夹。（知识库本身不会被删除）',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        deleteFolderMutate.mutate(folderId);
        if (selectedFolder === folderId) {
          setSelectedFolder(null);
        }
        message.success('文件夹已删除');
      },
    });
  };

  const getDropdownItems = (kb: KnowledgeBase): MenuProps['items'] => {
    const isWeb = kb.type === 'web';
    return [
      {
        key: 'sync',
        icon: <SyncOutlined />,
        label: '同步',
        disabled: !isWeb,
        onClick: (e) => {
          e.domEvent.stopPropagation();
          message.info(`正在同步知识库「${kb.name}」...`);
        },
      },
      {
        key: 'reEmbed',
        icon: <ThunderboltOutlined />,
        label: '重新向量化',
        onClick: (e) => {
          e.domEvent.stopPropagation();
          message.info(`正在重新向量化知识库「${kb.name}」...`);
        },
      },
      {
        key: 'generateQuestions',
        icon: <QuestionCircleOutlined />,
        label: '生成问题',
        onClick: (e) => {
          e.domEvent.stopPropagation();
          message.info(`正在为知识库「${kb.name}」生成关联问题...（模拟）`);
        },
      },
      { type: 'divider' },
      {
        key: 'auth',
        icon: <TeamOutlined />,
        label: '资源授权',
        onClick: (e) => {
          e.domEvent.stopPropagation();
          setAuthKnowledgeBaseId(kb.id);
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
          setTransferKnowledgeBaseId(kb.id);
          setTransferModalVisible(true);
        },
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: '设置',
        onClick: (e) => {
          e.domEvent.stopPropagation();
          setSettingKnowledgeBase(kb);
          settingForm.setFieldsValue({
            name: kb.name,
            description: kb.description,
            vectorModel: kb.vectorModel,
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
          message.info('导出文档（Excel）功能开发中');
        },
      },
      {
        key: 'exportFull',
        icon: <ExportOutlined />,
        label: '导出知识库',
        onClick: (e) => {
          e.domEvent.stopPropagation();
          message.info('导出知识库功能开发中');
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
          handleDelete(kb.id);
        },
      },
    ];
  };

  return (
    <div className="flex flex-1 min-h-0">
      {/* 左侧文件夹树 */}
      <div className={`folder-tree-panel flex flex-col overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-0 min-w-0' : 'w-[260px] min-w-[260px]'}`}>
        <div className="flex-1 overflow-auto p-4 pt-4">
          <div className="folder-tree-item-wrapper">
            <div
              className={`folder-tree-item ${!selectedFolder ? 'active' : ''}`}
              onClick={() => setSelectedFolder(null)}
            >
              <span className="ft-icon"><DatabaseOutlined /></span>
              <span className="ft-label">全部知识库</span>
              <span className="ft-count">{knowledgeBases.length}</span>
            </div>
            <div className="folder-tree-actions">
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'addRoot',
                      icon: <FolderAddOutlined />,
                      label: '新建文件夹',
                      onClick: () => handleOpenAddRoot(),
                    },
                  ],
                }}
                trigger={['click']}
                placement="bottomRight"
              >
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

          <FolderTree
            folders={knowledgeFolders}
            selectedFolder={selectedFolder}
            onSelect={setSelectedFolder}
            knowledgeBases={knowledgeBases}
            onAddSubfolder={handleOpenAddSubfolder}
            onRename={handleOpenRename}
            onDelete={handleDeleteFolder}
          />
        </div>
      </div>
      {/* 右侧知识库列表 */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden p-0 gap-0">
        {/* 顶部工具栏 */}
        <div className="toolbar">
          <Input
            placeholder="搜索知识库..."
            prefix={<SearchOutlined className="text-gray-400" />}
            className="toolbar-search"
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            allowClear
          />
          {/* 视图切换 */}
          <div className="toolbar-group" style={{ border: '1px solid var(--border-color)', borderRadius: 6, overflow: 'hidden' }}>
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('grid')}
              title="网格视图"
            >
              <AppstoreOutlined />
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('list')}
              title="列表视图"
            >
              <UnorderedListOutlined />
            </button>
          </div>
          {/* 小屏折叠按钮 */}
          <button
            className="lg:hidden toolbar-collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? '展开侧栏' : '折叠侧栏'}
          >
            <span style={{ fontSize: 18 }}>☰</span>
          </button>
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
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              创建知识库
            </Button>
          </div>
        </div>

        {/* 知识库卡片列表 */}
        <div className="flex-1 overflow-auto" style={{ padding: 10 }}>
          {filteredKnowledgeBases.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="20" width="100" height="70" rx="8" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2"/>
                <rect x="20" y="35" width="40" height="8" rx="4" fill="#cbd5e1"/>
                <rect x="20" y="50" width="70" height="6" rx="3" fill="#e2e8f0"/>
                <rect x="20" y="62" width="55" height="6" rx="3" fill="#e2e8f0"/>
                <circle cx="90" cy="30" r="16" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="2"/>
                <path d="M85 30h10M90 25v10" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <Text type="secondary" className="mt-4 text-base">暂无知识库数据</Text>
              <Text type="secondary" className="text-sm mt-1">点击下方按钮创建第一个知识库，开启智能知识管理</Text>
              <div className="mt-4 flex gap-2">
                <Button type="primary" onClick={() => setCreateModalVisible(true)}>创建知识库</Button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {(loading ? (Array.from({ length: 6 }) as unknown as KnowledgeBase[]) : filteredKnowledgeBases).map((kb, index) => {
                if (loading) {
                  return (
                    <div key={`skeleton-${index}`} className="dataset-card skeleton-card">
                      <div className="skeleton-line" style={{ width: '60%', height: 20, marginBottom: 12 }} />
                      <div className="skeleton-line" style={{ width: '40%', height: 14, marginBottom: 8 }} />
                      <div className="skeleton-line" style={{ width: '80%', height: 14 }} />
                    </div>
                  );
                }
                const typeCfg = knowledgeBaseTypeConfig[kb.type] || knowledgeBaseTypeConfig.general;
                const statusCfg = statusConfig[kb.status] || statusConfig.pending;
                const isSelected = selectedIds.includes(kb.id);
                const iconColorClass = typeCfg.color === 'blue' ? 'blue' : typeCfg.color === 'green' ? 'green' : 'purple';

                return (
                  <div
                    key={kb.id}
                    className={`dataset-card dataset-card-type-${iconColorClass} ${isSelected ? 'selected' : ''} ${kb.status === 'processing' ? 'dataset-card-processing' : ''}`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => {
                      if (batchMode) {
                        setSelectedIds((prev) =>
                          prev.includes(kb.id)
                            ? prev.filter((id) => id !== kb.id)
                            : [...prev, kb.id]
                        );
                      } else {
                        navigate(`/detail/${kb.id}`);
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
                                prev.includes(kb.id)
                                  ? prev.filter((id) => id !== kb.id)
                                  : [...prev, kb.id]
                              );
                            }}
                          />
                        )}
                        <span className={`dataset-card-icon ${iconColorClass}`}>
                          {typeCfg.icon}
                        </span>
                        <div className="dataset-card-body">
                          <div className="dataset-card-title">{kb.name}</div>
                        </div>
                      </div>
                      <Dropdown menu={{ items: getDropdownItems(kb) }} trigger={['click']} placement="bottomRight">
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
                      <span className={`dataset-card-tag ${kb.status === 'completed' ? 'green' : kb.status === 'processing' ? 'blue' : 'slate'}`}>
                        {statusCfg.label}
                      </span>
                      {kb.status === 'failed' && <span className="dataset-card-tag red">失败</span>}
                    </div>

                    <div className="dataset-card-desc">{kb.description}</div>

                    <div className="dataset-stat-bar">
                      <div className="dataset-stat-item">
                        <span className="stat-dot dot-green" />
                        <span>文档 {kb.documents.length} 个</span>
                      </div>
                      <span className="text-xs" style={{ color: '#94a3b8' }}>{kb.vectorModel?.split('/').pop()}</span>
                    </div>

                    {/* 处理中进度条 */}
                    {kb.status === 'processing' && (
                      <div className="dataset-processing-bar">
                        <div className="dataset-processing-bar-inner" />
                      </div>
                    )}

                    {/* 选中勾选标记 */}
                    {batchMode && isSelected && (
                      <div className="dataset-check-badge">✓</div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* 列表视图 */
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="dataset-list-header">
                <span style={{ flex: '0 0 40px' }} />
                <span className="dataset-list-col">知识库名称</span>
                <span className="dataset-list-col">类型</span>
                <span className="dataset-list-col">状态</span>
                <span className="dataset-list-col">文档数</span>
                <span className="dataset-list-col">向量模型</span>
                <span className="dataset-list-col" style={{ flex: '0 0 60px' }}>操作</span>
              </div>
              {filteredKnowledgeBases.map((kb, index) => {
                const typeCfg = knowledgeBaseTypeConfig[kb.type] || knowledgeBaseTypeConfig.general;
                const statusCfg = statusConfig[kb.status] || statusConfig.pending;
                const isSelected = selectedIds.includes(kb.id);
                return (
                  <div
                    key={kb.id}
                    className={`dataset-list-row ${isSelected ? 'selected' : ''} ${kb.status === 'processing' ? 'dataset-card-processing' : ''}`}
                    style={{ animationDelay: `${index * 0.03}s` }}
                    onClick={() => {
                      if (batchMode) {
                        setSelectedIds(prev => prev.includes(kb.id) ? prev.filter(id => id !== kb.id) : [...prev, kb.id]);
                      } else {
                        navigate(`/detail/${kb.id}`);
                      }
                    }}
                  >
                    <span style={{ flex: '0 0 40px' }}>
                      {batchMode && (
                        <Checkbox
                          checked={isSelected}
                          onChange={(e) => { e.stopPropagation(); setSelectedIds(prev => prev.includes(kb.id) ? prev.filter(id => id !== kb.id) : [...prev, kb.id]); }}
                        />
                      )}
                    </span>
                    <span className="dataset-list-cell dataset-list-title">
                      <span className={`dataset-card-icon-sm ${typeCfg.color === 'blue' ? 'blue' : typeCfg.color === 'green' ? 'green' : 'purple'}`}>
                        {typeCfg.icon}
                      </span>
                      {kb.name}
                    </span>
                    <span className="dataset-list-cell">
                      <span className={`dataset-card-tag ${typeCfg.color === 'blue' ? 'blue' : typeCfg.color === 'green' ? 'green' : 'purple'}`}>{typeCfg.label}</span>
                    </span>
                    <span className="dataset-list-cell">
                      <span className={`dataset-card-tag ${kb.status === 'completed' ? 'green' : kb.status === 'processing' ? 'blue' : kb.status === 'failed' ? 'red' : 'slate'}`}>{statusCfg.label}</span>
                    </span>
                    <span className="dataset-list-cell text-sm text-gray-500">{kb.documents.length} 个</span>
                    <span className="dataset-list-cell text-xs text-gray-400">{kb.vectorModel?.split('/').pop()}</span>
                    <span className="dataset-list-cell" style={{ flex: '0 0 60px' }}>
                      <Dropdown menu={{ items: getDropdownItems(kb) }} trigger={['click']} placement="bottomRight">
                        <button className="dataset-more-btn" onClick={(e) => e.stopPropagation()}>
                          <MoreOutlined />
                        </button>
                      </Dropdown>
                    </span>
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
            if (transferKnowledgeBaseId) {
              message.success(`知识库已转移到目标文件夹`);
            }
            setTransferModalVisible(false);
          }}
        >
          {knowledgeFolders.map((folder) => (
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
            if (settingKnowledgeBase) {
              updateKbMutate.mutate({ id: settingKnowledgeBase.id, ...values });
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
        knowledgeBaseId={authKnowledgeBaseId || ''}
        onClose={() => { setAuthModalVisible(false); setAuthKnowledgeBaseId(null); }}
      />

      <ImportModal
        open={importModalVisible}
        onClose={() => setImportModalVisible(false)}
      />

      <CreateDatasetModal
        open={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
      />

      {/* 文件夹新建/重命名弹窗 */}
      <Modal
        title={
          folderModalMode === 'rename' ? '重命名文件夹' :
          folderModalMode === 'add-sub' ? '新建子文件夹' : '新建文件夹'
        }
        open={folderModalVisible}
        onOk={handleFolderModalOk}
        onCancel={() => setFolderModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Input
          value={folderModalName}
          onChange={(e) => setFolderModalName(e.target.value)}
          onPressEnter={handleFolderModalOk}
          placeholder="请输入文件夹名称"
          autoFocus
        />
      </Modal>

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
            message.success(`已将 ${selectedIds.length} 个知识库移动`);
            setSelectedIds([]);
            setBatchMode(false);
            setBatchMoveVisible(false);
          }}
        >
          {knowledgeFolders.map((folder) => (
            <Select.Option key={folder.id} value={folder.id}>{folder.name}</Select.Option>
          ))}
        </Select>
      </Modal>
    </div>
  );
}

export default function KnowledgeBrowse() {
  return (
    <div className="page-container" style={{ overflow: 'hidden auto', scrollbarGutter: 'stable' }}>
      <div className="breadcrumb">
        <a href="/">首页</a>
        <span className="separator">›</span>
        <span>知识库</span>
      </div>
      <h1 className="page-title" style={{ display: 'none' }}>📚 知识库</h1>
      <DatasetListPanel />
    </div>
  );
}
