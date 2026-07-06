import { useState } from 'react';
import { Modal, Upload, Descriptions, Tag, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useAppStoreLegacy } from '@/store';

const { Dragger } = Upload;
const { Item } = Descriptions;

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ImportModal({ open, onClose }: ImportModalProps) {
  const importKnowledgeBase = useAppStoreLegacy((s) => s.importKnowledgeBase);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<{
    name: string;
    description: string;
    type: 'general' | 'web' | 'feishu';
    documentCount: number;
    chunkCount: number;
    vectorModel: string;
  } | null>(null);

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.zip',
    beforeUpload: (file) => {
      setUploadedFile(file);
      // 模拟解析 ZIP 包预览
      setPreviewData({
        name: file.name.replace('.zip', ''),
        description: '从 ZIP 包导入的知识库',
        type: 'general',
        documentCount: Math.floor(Math.random() * 8) + 2,
        chunkCount: Math.floor(Math.random() * 50) + 10,
        vectorModel: 'bge-large-zh-v1.5',
      });
      return false;
    },
    onRemove: () => {
      setUploadedFile(null);
      setPreviewData(null);
    },
    maxCount: 1,
  };

  const handleImport = () => {
    if (!previewData) {
      message.warning('请先选择要导入的知识库文件');
      return;
    }
    importKnowledgeBase({
      name: previewData.name,
      description: previewData.description,
      type: previewData.type,
      vectorModel: previewData.vectorModel,
      status: 'pending',
      documents: Array.from({ length: previewData.documentCount }, (_, i) => ({
        id: `imp-doc-${i + 1}`,
        knowledgeBaseId: '',
        name: `导入文档_${i + 1}.md`,
        size: `${Math.floor(Math.random() * 500) + 50} KB`,
        type: 'md' as const,
        status: 'pending' as const,
        chunks: Array.from({ length: Math.ceil(previewData.chunkCount / previewData.documentCount) }, (_, j) => ({
          id: `imp-chk-${i}-${j}`,
          index: j + 1,
          content: `这是导入分段 ${j + 1} 的内容...`,
          length: 50,
        })),
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      })),
      folderId: '',
      documentCount: previewData.documentCount,
      charCount: previewData.chunkCount * 200,
    });
    message.success(`知识库「${previewData.name}」导入成功`);
    setUploadedFile(null);
    setPreviewData(null);
    onClose();
  };

  return (
    <Modal
      title="导入知识库"
      open={open}
      onCancel={() => { setUploadedFile(null); setPreviewData(null); onClose(); }}
      onOk={handleImport}
      okText="确认导入"
      okButtonProps={{ disabled: !previewData }}
      width={560}
    >
      <Dragger {...uploadProps} className="mb-4">
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽 ZIP 文件到此区域上传</p>
        <p className="ant-upload-hint">支持导入 MaxKB 知识库导出的 ZIP 包</p>
      </Dragger>

      {previewData && (
        <div className="bg-gray-50 rounded-lg p-4">
          <Descriptions title="导入预览" column={2} size="small">
            <Item label="知识库名称">{previewData.name}</Item>
            <Item label="类型">
              <Tag color="blue">通用型</Tag>
            </Item>
            <Item label="文档数">{previewData.documentCount} 个</Item>
            <Item label="分段数">{previewData.chunkCount} 段</Item>
            <Item label="向量模型" span={2}>{previewData.vectorModel}</Item>
          </Descriptions>
        </div>
      )}
    </Modal>
  );
}
