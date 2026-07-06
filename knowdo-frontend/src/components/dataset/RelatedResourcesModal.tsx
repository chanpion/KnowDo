import { Modal, Table, Tag, Typography } from 'antd';
import { RobotOutlined, ApartmentOutlined } from '@ant-design/icons';
import { useAppStoreLegacy } from '@/store';
import type { RelatedResource } from '@/types';

const { Text } = Typography;

interface RelatedResourcesModalProps {
  open: boolean;
  knowledgeBaseId: string;
  onClose: () => void;
}

export default function RelatedResourcesModal({ open, knowledgeBaseId, onClose }: RelatedResourcesModalProps) {
  const relatedResources = useAppStoreLegacy((s) => s.relatedResources);
  const knowledgeBases = useAppStoreLegacy((s) => s.knowledgeBases);

  const kb = knowledgeBases.find((ds) => ds.id === knowledgeBaseId);
  // 所有关联资源统一展示（后续可根据 knowledgeBaseId 过滤）
  const resources = relatedResources;

  const columns = [
    {
      title: '资源类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: RelatedResource['type']) => (
        <Tag
          icon={type === 'agent' ? <RobotOutlined /> : <ApartmentOutlined />}
          color={type === 'agent' ? 'blue' : 'green'}
        >
          {type === 'agent' ? '智能体' : '模型'}
        </Tag>
      ),
    },
    {
      title: '资源名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: '关联方式',
      dataIndex: 'relationType',
      key: 'relationType',
      width: 120,
      render: (relType: string) => (
        <Tag color={relType === 'references' ? 'orange' : 'purple'}>
          {relType === 'references' ? '引用' : '依赖'}
        </Tag>
      ),
    },
  ];

  return (
    <Modal
      title={
        <span>
          关联资源
          {kb && <Text type="secondary" className="ml-2">- {kb.name}</Text>}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
    >
      <div className="mb-4">
        <Text type="secondary">
          以下展示当前知识库被哪些智能体引用，以及依赖的模型资源。
        </Text>
      </div>
      <Table
        dataSource={resources}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        locale={{ emptyText: '暂无关联资源' }}
      />
    </Modal>
  );
}
