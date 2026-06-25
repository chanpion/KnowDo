import { useState } from 'react';
import { Table, Button, Tag, Modal, Input, Select, Popconfirm, message, Empty, ColorPicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store';
import type { Tag as TagType } from '@/types';

const TAG_COLORS: { value: TagType['color']; label: string }[] = [
  { value: 'blue', label: '蓝色' },
  { value: 'green', label: '绿色' },
  { value: 'purple', label: '紫色' },
  { value: 'orange', label: '橙色' },
  { value: 'red', label: '红色' },
];

const COLOR_MAP: Record<string, string> = {
  blue: 'blue', green: 'green', purple: 'purple', orange: 'orange', red: 'red',
};

export default function TagsPage() {
  const { tagLibrary, addTag, updateTag, deleteTag } = useAppStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState<TagType['color']>('blue');
  const [formGroup, setFormGroup] = useState('');

  const handleAdd = () => {
    setEditingTag(null);
    setFormName('');
    setFormColor('blue');
    setFormGroup('');
    setModalVisible(true);
  };

  const handleEdit = (tag: TagType) => {
    setEditingTag(tag);
    setFormName(tag.name);
    setFormColor(tag.color);
    setFormGroup(tag.group || '');
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      message.warning('请输入标签名称');
      return;
    }
    if (editingTag) {
      updateTag(editingTag.id, { name: formName.trim(), color: formColor, group: formGroup.trim() || undefined });
      message.success('标签已更新');
    } else {
      addTag(formName.trim(), formColor, formGroup.trim() || undefined);
      message.success('标签已添加');
    }
    setModalVisible(false);
  };

  const columns = [
    {
      title: '标签名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, record: TagType) => (
        <Tag color={COLOR_MAP[record.color]}>{name}</Tag>
      ),
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      width: 120,
      render: (color: string) => {
        const cfg = TAG_COLORS.find(c => c.value === color);
        return (
          <span>
            <span style={{
              display: 'inline-block', width: 12, height: 12, borderRadius: 3,
              background: color === 'blue' ? '#3b82f6' : color === 'green' ? '#10b981' : color === 'purple' ? '#8b5cf6' : color === 'orange' ? '#f59e0b' : '#ef4444',
              marginRight: 6, verticalAlign: 'middle',
            }} />
            {cfg?.label || color}
          </span>
        );
      },
    },
    {
      title: '分组',
      dataIndex: 'group',
      key: 'group',
      width: 150,
      render: (group: string) => group ? <Tag>{group}</Tag> : <span style={{ color: 'var(--text-muted)' }}>-</span>,
    },
    {
      title: '使用次数',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 100,
      render: (count: number) => count || 0,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: TagType) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="确定删除此标签？" onConfirm={() => { deleteTag(record.id); message.success('标签已删除'); }}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="breadcrumb">
        <a href="/">首页</a>
        <span className="separator">›</span>
        <span>标签管理</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>🏷️ 标签管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加标签</Button>
      </div>

      <div className="model-content">
        {tagLibrary.length === 0 ? (
          <div style={{ padding: 60 }}>
            <Empty description="暂无标签" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          <Table
            dataSource={tagLibrary}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="middle"
          />
        )}
      </div>

      <Modal
        title={editingTag ? '编辑标签' : '添加标签'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>标签名称</label>
            <Input
              value={formName}
              onChange={e => setFormName(e.target.value)}
              onPressEnter={handleSave}
              placeholder="请输入标签名称"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>颜色</label>
            <Select
              value={formColor}
              onChange={setFormColor}
              style={{ width: '100%' }}
              options={TAG_COLORS}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>分组（选填）</label>
            <Input
              value={formGroup}
              onChange={e => setFormGroup(e.target.value)}
              placeholder="如：业务类型、产品线"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
