import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  SyncOutlined,
  ThunderboltOutlined,
  QuestionCircleOutlined,
  TeamOutlined,
  LinkOutlined,
  SwapOutlined,
  SettingOutlined,
  DownloadOutlined,
  ExportOutlined,
  DeleteOutlined,
  UploadOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  GlobalOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import {
  Button, Typography, Tag, Table, Space, Upload, message, Popconfirm, Modal, Form, Input, Select, Tabs, Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useAppStore } from '@/store';
import type { Dataset, DatasetDocument, DatasetDocumentType, ChunkMode } from '@/types';

const { Title, Text, Paragraph } = Typography;

const docTypeIcon: Record<DatasetDocumentType, React.ReactNode> = {
  md: <FileTextOutlined className="text-blue-500" />,
  txt: <FileTextOutlined className="text-gray-500" />,
  pdf: <FilePdfOutlined className="text-red-500" />,
  docx: <FileWordOutlined className="text-blue-600" />,
  html: <GlobalOutlined className="text-orange-500" />,
  xls: <FileExcelOutlined className="text-green-600" />,
  xlsx: <FileExcelOutlined className="text-green-600" />,
  csv: <FileExcelOutlined className="text-green-500" />,
};

const statusIcon: Record<string, React.ReactNode> = {
  pending: <ExclamationCircleOutlined className="text-gray-400" />,
  processing: <LoadingOutlined className="text-blue-400" />,
  completed: <CheckCircleOutlined className="text-green-500" />,
  failed: <MinusCircleOutlined className="text-red-500" />,
};

export default function DatasetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const datasets = useAppStore((s) => s.datasets);
  const deleteDataset = useAppStore((s) => s.deleteDataset);
  const addDatasetDocuments = useAppStore((s) => s.addDatasetDocuments);
  const deleteDatasetDocument = useAppStore((s) => s.deleteDatasetDocument);
  const reEmbedDataset = useAppStore((s) => s.reEmbedDataset);
  const syncWebDataset = useAppStore((s) => s.syncWebDataset);
  const transferDataset = useAppStore((s) => s.transferDataset);
  const exportDatasetAsExcel = useAppStore((s) => s.exportDatasetAsExcel);
  const exportFullDataset = useAppStore((s) => s.exportFullDataset);

  const dataset = datasets.find((ds) => ds.id === id);

  const [settingModalVisible, setSettingModalVisible] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!dataset) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <DatabaseOutlined style={{ fontSize: 48 }} />
        <Text type="secondary" className="mt-4">知识库不存在</Text>
        <Button className="mt-4" onClick={() => navigate('/dataset')}>返回知识库列表</Button>
      </div>
    );
  }

  const isWebType = dataset.type === 'web';

  // 文档表格列定义
  const columns: ColumnsType<DatasetDocument> = [
    {
      title: '文档名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: DatasetDocument) => (
        <Space>
          {docTypeIcon[record.type]}
          <Text>{name}</Text>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag>{type.toUpperCase()}</Tag>,
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Space>
          {statusIcon[status]}
          <Text>{status === 'completed' ? '已完成' : status === 'processing' ? '处理中' : status === 'pending' ? '待处理' : '失败'}</Text>
        </Space>
      ),
    },
    {
      title: '分段数',
      key: 'chunkCount',
      width: 100,
      render: (_, record) => <Text>{record.chunks.length}</Text>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Popconfirm title="确定删除此文档？" onConfirm={() => { deleteDatasetDocument(dataset.id, record.id); message.success('文档已删除'); }}>
          <Button type="link" danger size="small">删除</Button>
        </Popconfirm>
      ),
    },
  ];

  // 处理文件上传（模拟）
  const handleUpload = (files: File[]) => {
    setUploading(true);
    const newDocs = files.map((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() as DatasetDocumentType;
      return {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        type: ext,
        status: 'pending' as const,
        chunks: [],
      };
    });
    addDatasetDocuments(dataset.id, newDocs);
    message.success(`已添加 ${files.length} 个文档，开始处理...`);
    setTimeout(() => {
      setUploading(false);
      message.success('文档处理完成！');
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部信息区 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3 mb-2">
          <Button type="text" onClick={() => navigate('/dataset')}>← 返回</Button>
          <Title level={4} className="!mb-0">{dataset.name}</Title>
          <Tag color={dataset.type === 'general' ? 'blue' : 'green'}>
            {dataset.type === 'general' ? '通用型' : 'Web 站点'}
          </Tag>
          <Tag color={dataset.status === 'completed' ? 'success' : dataset.status === 'processing' ? 'processing' : 'default'}>
            {dataset.status === 'completed' ? '已完成' : dataset.status === 'processing' ? '处理中' : '待处理'}
          </Tag>
        </div>
        <Text type="secondary">{dataset.description}</Text>
      </div>

      {/* 操作按钮组 */}
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-2 flex-wrap">
        {isWebType && (
          <Tooltip title="同步 Web 站点内容">
            <Button size="small" icon={<SyncOutlined />} onClick={() => { syncWebDataset(dataset.id, 'replace'); message.success('正在同步 Web 知识库...'); }}>
              同步
            </Button>
          </Tooltip>
        )}
        <Tooltip title="重新进行向量化">
          <Button size="small" icon={<ThunderboltOutlined />} onClick={() => { reEmbedDataset(dataset.id); message.success('正在重新向量化...'); }}>
            重新向量化
          </Button>
        </Tooltip>
        <Tooltip title="AI 自动生成关联问题">
          <Button size="small" icon={<QuestionCircleOutlined />} onClick={() => message.info('正在生成关联问题...（模拟）')}>
            生成问题
          </Button>
        </Tooltip>
        <Tooltip title="授权给用户">
          <Button size="small" icon={<TeamOutlined />} onClick={() => message.info('资源授权功能（模拟）')}>
            授权
          </Button>
        </Tooltip>
        <Tooltip title="查看关联资源">
          <Button size="small" icon={<LinkOutlined />} onClick={() => message.info('查看关联资源（模拟）')}>
            关联资源
          </Button>
        </Tooltip>
        <Tooltip title="转移到其他文件夹">
          <Button size="small" icon={<SwapOutlined />} onClick={() => setTransferModalVisible(true)}>
            转移
          </Button>
        </Tooltip>
        <Tooltip title="修改知识库设置">
          <Button size="small" icon={<SettingOutlined />} onClick={() => setSettingModalVisible(true)}>
            设置
          </Button>
        </Tooltip>
        <Tooltip title="导出分段内容为 Excel">
          <Button size="small" icon={<DownloadOutlined />} onClick={() => exportDatasetAsExcel(dataset.id)}>
            导出文档
          </Button>
        </Tooltip>
        <Tooltip title="导出完整知识库">
          <Button size="small" icon={<ExportOutlined />} onClick={() => exportFullDataset(dataset.id)}>
            导出知识库
          </Button>
        </Tooltip>
        <Popconfirm title="确定删除此知识库？删除后数据无法恢复。" onConfirm={() => { deleteDataset(dataset.id); navigate('/dataset'); message.success('知识库已删除'); }}>
          <Tooltip title="删除知识库">
            <Button size="small" icon={<DeleteOutlined />} danger>
              删除
            </Button>
          </Tooltip>
        </Popconfirm>
      </div>

      {/* 文档区域 */}
      <div className="flex-1 overflow-auto p-6">
        {/* 上传区域（仅通用型） */}
        {!isWebType && (
          <div className="mb-4">
            <Upload.Dragger
              multiple
              showUploadList={false}
              accept=".md,.txt,.pdf,.docx,.html,.xls,.xlsx,.csv"
              beforeUpload={(file) => {
                handleUpload([file as File]);
                return false;
              }}
              disabled={uploading}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持 Markdown、TXT、PDF、DOCX、HTML、XLS、XLSX、CSV 格式
              </p>
            </Upload.Dragger>
          </div>
        )}

        {/* Web 站点信息（仅 Web 类型） */}
        {isWebType && (
          <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <Space>
              <GlobalOutlined className="text-green-600" />
              <Text strong>Web 站点地址：</Text>
              <Text className="text-green-700">{dataset.webUrl}</Text>
            </Space>
            {dataset.webSelector && (
              <div className="mt-2">
                <Text type="secondary">CSS 选择器：{dataset.webSelector}</Text>
              </div>
            )}
          </div>
        )}

        {/* 文档列表 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <Text strong>文档列表（{dataset.documents.length}）</Text>
          </div>
          <Table
            dataSource={dataset.documents}
            columns={columns}
            rowKey="id"
            pagination={false}
            locale={{ emptyText: '暂无文档，请上传文档' }}
          />
        </div>
      </div>

      {/* 设置弹窗 */}
      <Modal title="设置知识库" open={settingModalVisible} onCancel={() => setSettingModalVisible(false)} footer={null}>
        <Form layout="vertical" initialValues={{ name: dataset.name, description: dataset.description, vectorModel: dataset.vectorModel }}>
          <Form.Item label="知识库名称">
            <Input defaultValue={dataset.name} />
          </Form.Item>
          <Form.Item label="描述">
            <Input.TextArea defaultValue={dataset.description} rows={3} />
          </Form.Item>
          <Form.Item label="向量模型">
            <Select defaultValue={dataset.vectorModel} options={[
              { value: 'bge-large-zh-v1.5', label: 'BAAI/bge-large-zh-v1.5' },
              { value: 'text-embedding-3-large', label: 'OpenAI/text-embedding-3-large' },
              { value: 'text2vec-large-chinese', label: 'shibing624/text2vec-large-chinese' },
            ]} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={() => { setSettingModalVisible(false); message.success('设置已保存（模拟）'); }}>保存</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 转移弹窗 */}
      <Modal title="转移知识库" open={transferModalVisible} onCancel={() => setTransferModalVisible(false)} footer={null}>
        <p>选择目标文件夹：</p>
        <Select className="w-full" placeholder="请选择文件夹" onChange={(val) => { transferDataset(dataset.id, val); setTransferModalVisible(false); message.success('转移成功（模拟）'); }}>
          <Select.Option value="ds-folder-1">产品知识库</Select.Option>
          <Select.Option value="ds-folder-2">操作手册</Select.Option>
          <Select.Option value="ds-folder-3">合规文档</Select.Option>
        </Select>
      </Modal>
    </div>
  );
}
