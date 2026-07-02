import { useState } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { useAppStore } from '@/store';
import { TAG_LIBRARY } from '@/mock/data';

interface CreateDatasetModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateDatasetModal({ open, onClose }: CreateDatasetModalProps) {
  const addDataset = useAppStore((s) => s.addDataset);
  const datasets = useAppStore((s) => s.datasets);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const newId = addDataset({
        name: values.name.trim(),
        description: values.description?.trim() || '',
        tags: values.tags || [],
        type: 'general',
        vectorModel: 'bge-large-zh-v1.5',
        folderId: '',
        documents: [],
      });

      message.success(`知识库「${values.name}」创建成功`);
      form.resetFields();
      onClose();
    } catch (err) {
      if ((err as { errorFields?: unknown[] }).errorFields) return;
      message.error('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="创建知识库"
      open={open}
      onOk={handleCreate}
      onCancel={handleCancel}
      okText="创建"
      cancelText="取消"
      confirmLoading={loading}
      width={480}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        style={{ marginTop: 8 }}
      >
        <Form.Item
          label="名称"
          name="name"
          rules={[{ required: true, message: '请输入知识库名称' }]}
        >
          <Input placeholder="请输入知识库名称" maxLength={50} showCount />
        </Form.Item>

        <Form.Item label="描述" name="description">
          <Input.TextArea
            placeholder="请输入知识库描述（选填）"
            rows={3}
            maxLength={200}
            showCount
          />
        </Form.Item>

        <Form.Item label="标签" name="tags">
          <Select
            mode="multiple"
            placeholder="选择标签（选填）"
            options={TAG_LIBRARY.map((t) => ({ value: t.name, label: t.name }))}
            allowClear
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
