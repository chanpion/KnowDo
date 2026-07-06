import { useState } from 'react';
import { Modal, Table, Button, Select, Typography, Tag, Space, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppStoreLegacy } from '@/store';
import type { AuthPermission, KnowledgeAuthorization } from '@/types';

const { Text } = Typography;

interface AuthorizationModalProps {
  open: boolean;
  knowledgeBaseId: string;
  onClose: () => void;
}

const permissionLabels: Record<AuthPermission, { label: string; color: string }> = {
  view: { label: '查看', color: 'blue' },
  use: { label: '使用', color: 'green' },
  maintain: { label: '维护', color: 'orange' },
};

// 模拟可选用户和部门
const MOCK_USERS = [
  { id: 'user-li', name: '李建国' },
  { id: 'user-wang', name: '王丽华' },
  { id: 'user-liu', name: '刘博文' },
  { id: 'user-chen', name: '陈志远' },
  { id: 'user-sun', name: '孙晓峰' },
  { id: 'user-zhao', name: '赵强' },
];

const MOCK_DEPARTMENTS = [
  { id: 'dept-credit', name: '信贷业务部' },
  { id: 'dept-risk', name: '风险管理部' },
  { id: 'dept-compliance', name: '合规管理部' },
  { id: 'dept-it', name: '信息技术部' },
];

export default function AuthorizationModal({ open, knowledgeBaseId, onClose }: AuthorizationModalProps) {
  const authorizations = useAppStoreLegacy((s) => s.knowledgeAuthorizations);
  const authorizeKnowledgeBase = useAppStoreLegacy((s) => s.authorizeKnowledgeBase);
  const revokeAuthorization = useAppStoreLegacy((s) => s.revokeAuthorization);
  const knowledgeBases = useAppStoreLegacy((s) => s.knowledgeBases);

  const [targetType, setTargetType] = useState<'user' | 'department'>('user');
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [permission, setPermission] = useState<AuthPermission>('view');

  const kb = knowledgeBases.find((ds) => ds.id === knowledgeBaseId);
  const kbAuths = authorizations.filter((a) => a.knowledgeBaseId === knowledgeBaseId);

  const handleAdd = () => {
    if (!selectedTarget) {
      message.warning('请选择授权对象');
      return;
    }
    const targets = targetType === 'user' ? MOCK_USERS : MOCK_DEPARTMENTS;
    const target = targets.find((t) => t.id === selectedTarget);
    if (!target) return;

    authorizeKnowledgeBase({
      id: '',
      knowledgeBaseId,
      targetType,
      targetId: target.id,
      targetName: target.name,
      permission,
      authorizedAt: '',
    });
    message.success('授权成功');
    setSelectedTarget(null);
  };

  const columns = [
    {
      title: '授权对象',
      dataIndex: 'targetName',
      key: 'targetName',
      render: (name: string, record: KnowledgeAuthorization) => (
        <Space>
          <Tag color={record.targetType === 'user' ? 'blue' : 'purple'}>
            {record.targetType === 'user' ? '用户' : '部门'}
          </Tag>
          <Text>{name}</Text>
        </Space>
      ),
    },
    {
      title: '权限级别',
      dataIndex: 'permission',
      key: 'permission',
      render: (perm: AuthPermission) => {
        const cfg = permissionLabels[perm];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: '授权时间',
      dataIndex: 'authorizedAt',
      key: 'authorizedAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: KnowledgeAuthorization) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => {
            revokeAuthorization(record.id);
            message.success('已取消授权');
          }}
        />
      ),
    },
  ];

  if (!open) return null;

  return (
    <Modal
      title={
        <Space>
          <span>资源授权</span>
          {kb && <Text type="secondary">- {kb.name}</Text>}
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
    >
      {/* 添加授权 */}
      <div className="flex items-end gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
        <div>
          <Text className="text-xs text-gray-500 block mb-1">对象类型</Text>
          <Select
            value={targetType}
            onChange={(val) => { setTargetType(val); setSelectedTarget(null); }}
            style={{ width: 100 }}
            options={[
              { value: 'user', label: '用户' },
              { value: 'department', label: '部门' },
            ]}
          />
        </div>
        <div className="flex-1">
          <Select
            className="w-full"
            placeholder={targetType === 'user' ? '搜索选择用户' : '搜索选择部门'}
            value={selectedTarget}
            onChange={setSelectedTarget}
            showSearch
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
            options={(targetType === 'user' ? MOCK_USERS : MOCK_DEPARTMENTS).map((t) => ({
              value: t.id,
              label: t.name,
            }))}
          />
        </div>
        <div>
          <Select
            value={permission}
            onChange={setPermission}
            style={{ width: 100 }}
            options={[
              { value: 'view', label: '查看' },
              { value: 'use', label: '使用' },
              { value: 'maintain', label: '维护' },
            ]}
          />
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加
        </Button>
      </div>

      {/* 已授权列表 */}
      <Table
        dataSource={kbAuths}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        locale={{ emptyText: '暂无授权记录' }}
      />
    </Modal>
  );
}
