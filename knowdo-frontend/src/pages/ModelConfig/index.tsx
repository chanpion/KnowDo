import { useState } from 'react';
import { Table, Button, Tag, Tabs, message, Space, Tooltip, Modal, Form, Input, Select, InputNumber, Drawer, Slider } from 'antd';
import {
  ApiOutlined,
  ReloadOutlined, PlusOutlined, SettingOutlined,
} from '@ant-design/icons';
import { useModelList, useCreateModel, useUpdateModel, useTestModel } from '@/hooks/use-models';
import type { ModelConfig, ModelType } from '@/types';

const PROVIDERS = [
  { key: '全部', label: '全部供应商' },
  { key: 'OpenAI', label: 'OpenAI' },
  { key: 'DeepSeek', label: 'DeepSeek' },
  { key: '阿里云百炼', label: '阿里云百炼' },
  { key: 'Anthropic', label: 'Anthropic' },
  { key: 'BAAI', label: 'BAAI' },
  { key: 'shibing624', label: 'shibing624' },
  { key: 'Cohere', label: 'Cohere' },
];

const MODEL_TYPE_OPTIONS: { label: string; value: ModelType }[] = [
  { label: '🧠 大语言模型 (LLM)', value: 'LLM' },
  { label: '🔢 向量化模型 (Embedding)', value: 'Embedding' },
  { label: '📊 重排序模型 (Reranker)', value: 'Reranker' },
];

const PROVIDER_OPTIONS = [
  'OpenAI', 'DeepSeek', '阿里云百炼', 'Anthropic', 'BAAI', 'shibing624', 'Cohere',
];

export default function ModelConfigPage() {
  const { data: modelData, isLoading } = useModelList();
  const createModel = useCreateModel();
  const updateModel = useUpdateModel();
  const testModel = useTestModel();

  // 将后端返回的 items 按 type 组织为 Record<string, ModelConfig[]>
  const rawModels = (modelData as any)?.items || [];
  const modelList: Record<string, ModelConfig[]> = {};
  for (const m of rawModels) {
    const key = (m.type || 'llm').toLowerCase();
    if (!modelList[key]) modelList[key] = [];
    modelList[key].push(m);
  }
  const [activeProvider, setActiveProvider] = useState('全部');
  const [activeTab, setActiveTab] = useState<ModelType>('LLM');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [addForm] = Form.useForm();
  const [configForm] = Form.useForm();

  const models = (modelList[activeTab.toLowerCase()] || []) as ModelConfig[];

  const filteredModels = activeProvider === '全部'
    ? models
    : models.filter(m => m.provider === activeProvider);

  const handleTestConnection = (model: ModelConfig) => {
    setTestingId(model.id);
    testModel.mutate(model.id, {
      onSuccess: (result: any) => {
        setTestingId(null);
        if (result.success) {
          message.success({ content: `${model.name} 连接成功！延迟 ${result.latency}`, key: 'test' });
        } else {
          message.error({ content: `${model.name} 连接失败：${result.error || '未知错误'}`, key: 'test' });
        }
      },
      onError: (err: Error) => {
        setTestingId(null);
        message.error({ content: `${model.name} 测试失败：${err.message}`, key: 'test' });
      },
    });
  };

  const handleRefreshAll = () => {
    setRefreshingAll(true);
    const allCurrentModels = [...filteredModels];
    let completed = 0;
    message.loading({ content: `正在刷新 ${allCurrentModels.length} 个模型状态...`, key: 'refresh-all', duration: 0 });

    allCurrentModels.forEach((model) => {
      testModel.mutate(model.id, {
        onSettled: () => {
          completed++;
          if (completed >= allCurrentModels.length) {
            setRefreshingAll(false);
            message.success({ content: `刷新完成：${allCurrentModels.length} 个模型`, key: 'refresh-all' });
          }
        },
      });
    });
  };

  const handleAddModel = () => {
    addForm.validateFields().then((values) => {
      const modelNameMap: Record<string, string> = {
        'OpenAI': 'gpt-4o', 'DeepSeek': 'deepseek-chat', '阿里云百炼': 'qwen-turbo',
        'Anthropic': 'claude-3-opus', 'BAAI': 'bge-large-zh', 'shibing624': 'text2vec-base',
        'Cohere': 'command-r-plus',
      };
      createModel.mutate({
        name: values.name,
        provider: values.provider,
        type: values.type,
        api_url: values.apiUrl || '',
        api_key: '',
        model_name: values.modelName || modelNameMap[values.provider] || '',
        max_tokens: values.maxTokens || 4096,
        concurrency: values.concurrency || 5,
        timeout: values.timeout || 30,
        retry: values.retry || 3,
      }, {
        onSuccess: () => message.success('模型添加成功'),
        onError: (err: Error) => message.error(`添加失败: ${err.message}`),
      });
      setAddModalOpen(false);
      addForm.resetFields();
    });
  };

  const handleOpenConfig = (model: ModelConfig) => {
    setEditingModel(model);
    configForm.setFieldsValue(model);
    setDrawerOpen(true);
  };

  const handleSaveConfig = () => {
    if (!editingModel) return;
    configForm.validateFields().then((values) => {
      updateModel.mutate(
        { id: editingModel.id, ...values },
        { onSuccess: () => message.success('配置已保存') }
      );
      setDrawerOpen(false);
      setEditingModel(null);
    });
  };

  const columns = [
    {
      title: '模型名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, record: ModelConfig) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{record.modelName}</div>
        </div>
      ),
    },
    {
      title: '供应商',
      dataIndex: 'provider',
      key: 'provider',
      width: 120,
      render: (provider: string) => <Tag>{provider}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config: Record<string, { color: string; label: string }> = {
          online: { color: '#10b981', label: '在线' },
          offline: { color: '#ef4444', label: '离线' },
          testing: { color: '#f59e0b', label: '测试中' },
        };
        const c = config[status] || config.offline;
        return (
          <span>
            <span className="model-status-dot" style={{ background: c.color }} />
            {c.label}
          </span>
        );
      },
    },
    {
      title: 'API地址',
      dataIndex: 'apiUrl',
      key: 'apiUrl',
      width: 220,
      ellipsis: true,
      render: (url: string) => (
        <Tooltip title={url}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{url}</span>
        </Tooltip>
      ),
    },
    {
      title: '最大Token',
      dataIndex: 'maxTokens',
      key: 'maxTokens',
      width: 100,
      render: (tokens: number) => tokens.toLocaleString(),
    },
    {
      title: '并发数',
      dataIndex: 'concurrency',
      key: 'concurrency',
      width: 80,
    },
    {
      title: '超时(s)',
      dataIndex: 'timeout',
      key: 'timeout',
      width: 80,
    },
    {
      title: '上次测试',
      dataIndex: 'lastTest',
      key: 'lastTest',
      width: 140,
      render: (time: string, record: ModelConfig) => (
        <div>
          <div style={{ fontSize: 12 }}>{time}</div>
          <div style={{ fontSize: 12 }}>
            {record.testResult.success ? (
              <span style={{ color: '#10b981' }}>延迟 {record.testResult.latency}</span>
            ) : (
              <span style={{ color: '#ef4444' }}>{record.testResult.error || '失败'}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: unknown, record: ModelConfig) => (
        <Space>
          <Button
            size="small"
            icon={<ApiOutlined />}
            loading={testingId === record.id}
            onClick={() => handleTestConnection(record)}
          >
            测试
          </Button>
          <Button size="small" icon={<SettingOutlined />} onClick={() => handleOpenConfig(record)}>配置</Button>
        </Space>
      ),
    },
  ];

  // 统计各类型模型数量
  const modelCounts: Record<string, number> = {};
  const allModels = [...(modelList.llm || []), ...(modelList.embedding || []), ...(modelList.reranker || [])];
  const uniqueProviders = [...new Set(allModels.map(m => m.provider))];
  PROVIDERS.forEach(p => {
    if (p.key === '全部') {
      modelCounts['全部'] = allModels.length;
    } else {
      modelCounts[p.key] = allModels.filter(m => m.provider === p.key).length;
    }
  });

  return (
    <div className="page-container">
      <div className="breadcrumb">
        <a href="/">首页</a>
        <span className="separator">›</span>
        <span>模型管理</span>
      </div>

      {/* 左右结构 */}
      <div className="flex flex-1 min-h-0">
        {/* 左侧供应商筛选 */}
        <div className="folder-tree-panel flex flex-col overflow-hidden w-[260px] min-w-[260px]">
          <div className="flex-1 overflow-auto p-4">
            {PROVIDERS.map(p => (
              <div key={p.key} className="folder-tree-item-wrapper">
                <div
                  className={`folder-tree-item ${activeProvider === p.key ? 'active' : ''}`}
                  onClick={() => setActiveProvider(p.key)}
                >
                  <span className="ft-icon">⚙️</span>
                  <span className="ft-label">{p.label}</span>
                  <span className="ft-count">{modelCounts[p.key] || 0}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 向量化策略提示 */}
          {activeTab === 'Embedding' && (
            <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
              💡 向量化模型用于将知识内容转换为向量进行语义搜索
            </div>
          )}
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          {/* 顶部工具栏 */}
          <div className="toolbar">
            <div className="toolbar-spacer" />
            <div className="toolbar-group">
              <Button icon={<ReloadOutlined />} loading={refreshingAll} onClick={handleRefreshAll}>
                刷新状态
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
                添加模型
              </Button>
            </div>
          </div>
          {/* 模型类型标签页 */}
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as ModelType)}
            style={{ marginTop: 0 }}
            tabBarStyle={{ padding: '0 20px', marginBottom: 0, borderBottom: '1px solid var(--border-color)' }}
            items={[
              {
                key: 'LLM',
                label: (
                  <span>
                    🧠 大语言模型 ({modelList.llm?.length || 0})
                  </span>
                ),
                children: (
                  <>
                    {activeProvider !== '全部' && (
                      <div className="model-filter-bar">
                        <Tag color="blue" closable onClose={() => setActiveProvider('全部')}>
                          供应商: {activeProvider}
                        </Tag>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          共 {filteredModels.length} 个模型
                        </span>
                      </div>
                    )}
                    <Table
                      dataSource={filteredModels}
                      columns={columns}
                      rowKey="id"
                      pagination={false}
                      size="middle"
                      locale={{ emptyText: '暂无模型数据' }}
                    />
                  </>
                ),
              },
              {
                key: 'Embedding',
                label: (
                  <span>
                    🔢 向量化模型 ({modelList.embedding?.length || 0})
                  </span>
                ),
                children: (
                  <>
                    {activeProvider !== '全部' && (
                      <div className="model-filter-bar">
                        <Tag color="blue" closable onClose={() => setActiveProvider('全部')}>
                          供应商: {activeProvider}
                        </Tag>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          共 {filteredModels.length} 个模型
                        </span>
                      </div>
                    )}
                    <Table
                      dataSource={filteredModels}
                      columns={columns}
                      rowKey="id"
                      pagination={false}
                      size="middle"
                      locale={{ emptyText: '暂无模型数据' }}
                    />
                  </>
                ),
              },
              {
                key: 'Reranker',
                label: (
                  <span>
                    📊 重排序模型 ({modelList.reranker?.length || 0})
                  </span>
                ),
                children: (
                  <>
                    {activeProvider !== '全部' && (
                      <div className="model-filter-bar">
                        <Tag color="blue" closable onClose={() => setActiveProvider('全部')}>
                          供应商: {activeProvider}
                        </Tag>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          共 {filteredModels.length} 个模型
                        </span>
                      </div>
                    )}
                    <Table
                      dataSource={filteredModels}
                      columns={columns}
                      rowKey="id"
                      pagination={false}
                      size="middle"
                      locale={{ emptyText: '暂无模型数据' }}
                    />
                  </>
                ),
              },
            ]}
          />
        </div>
      </div>

      {/* 添加模型弹窗 */}
      <Modal
        title="添加模型"
        open={addModalOpen}
        onOk={handleAddModel}
        onCancel={() => { setAddModalOpen(false); addForm.resetFields(); }}
        okText="确认添加"
        cancelText="取消"
        width={560}
        destroyOnClose
      >
        <Form form={addForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="type" label="模型类型" rules={[{ required: true, message: '请选择模型类型' }]} initialValue="LLM">
            <Select options={MODEL_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="name" label="模型名称" rules={[{ required: true, message: '请输入模型名称' }]}>
            <Input placeholder="如：GPT-4o 模型" />
          </Form.Item>
          <Form.Item name="provider" label="供应商" rules={[{ required: true, message: '请选择供应商' }]}>
            <Select
              placeholder="选择供应商"
              options={PROVIDER_OPTIONS.map(p => ({ label: p, value: p }))}
              showSearch
            />
          </Form.Item>
          <Form.Item name="modelName" label="模型标识">
            <Input placeholder="如：gpt-4o / deepseek-chat" />
          </Form.Item>
          <Form.Item name="apiUrl" label="API 地址">
            <Input placeholder="如：https://api.openai.com/v1" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Form.Item name="maxTokens" label="最大Token" initialValue={4096}>
              <InputNumber min={1} max={128000} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="concurrency" label="并发数" initialValue={5}>
              <InputNumber min={1} max={100} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="timeout" label="超时(s)" initialValue={30}>
              <InputNumber min={1} max={300} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="retry" label="重试次数" initialValue={3}>
            <InputNumber min={0} max={10} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 模型配置抽屉 */}
      <Drawer
        title={`模型配置 - ${editingModel?.name || ''}`}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingModel(null); }}
        width={440}
        destroyOnClose
        extra={
          <Space>
            <Button
              icon={<ApiOutlined />}
              loading={testingId === editingModel?.id}
              onClick={() => editingModel && handleTestConnection(editingModel)}
            >
              测试连接
            </Button>
            <Button type="primary" onClick={handleSaveConfig}>保存配置</Button>
          </Space>
        }
      >
        <Form form={configForm} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item name="apiUrl" label="API 地址">
            <Input placeholder="API 接口地址" />
          </Form.Item>
          <Form.Item name="modelName" label="模型标识">
            <Input placeholder="模型标识" />
          </Form.Item>
          <Form.Item name="maxTokens" label="最大Token">
            <InputNumber min={1} max={128000} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="concurrency" label="并发数">
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="timeout" label="超时时间 (秒)">
            <InputNumber min={1} max={300} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="retry" label="重试次数">
            <InputNumber min={0} max={10} style={{ width: '100%' }} />
          </Form.Item>
          {editingModel?.type === 'LLM' && (
            <Form.Item name="temperature" label="温度参数 (Temperature)">
              <Slider min={0} max={2} step={0.1} marks={{ 0: '0', 0.5: '0.5', 1: '1', 1.5: '1.5', 2: '2' }} />
            </Form.Item>
          )}
        </Form>
      </Drawer>
    </div>
  );
}
