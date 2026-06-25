import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DatabaseOutlined,
  GlobalOutlined,
  RightOutlined,
  LinkOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';
import { Button, Card, Input, Select, Typography, message, Steps, Tooltip } from 'antd';
import { useAppStore } from '@/store';
import type { DatasetType } from '@/types';

const { Title, Text, Paragraph } = Typography;

const datasetTypeOptions = [
  {
    type: 'general' as const,
    label: '通用型',
    icon: <DatabaseOutlined style={{ fontSize: 32 }} />,
    description: '上传离线文档（Markdown、PDF、DOCX、TXT、HTML、XLS、XLSX、CSV），系统自动完成分段、存储和向量化。适用于企业内部知识库、政策文档库等场景。',
    color: '#1890ff',
  },
  {
    type: 'web' as const,
    label: 'Web 站点',
    icon: <GlobalOutlined style={{ fontSize: 32 }} />,
    description: '输入网站地址，系统自动爬取网页内容并向量化。适用于官网 FAQ、产品文档、帮助中心等场景。支持设置 CSS 选择器精准抓取。',
    color: '#52c41a',
  },
];

export default function DatasetCreatePage() {
  const navigate = useNavigate();
  const addDataset = useAppStore((s) => s.addDataset);
  const VECTOR_MODELS = useAppStore((s) => s.VECTOR_MODELS || []);

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedType, setSelectedType] = useState<DatasetType | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [vectorModel, setVectorModel] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [webSelector, setWebSelector] = useState('');

  const handleNext = () => {
    if (currentStep === 0) {
      if (!selectedType) {
        message.warning('请选择知识库类型');
        return;
      }
      setCurrentStep(1);
    }
  };

  const handleCreate = () => {
    if (!name.trim()) {
      message.warning('请输入知识库名称');
      return;
    }
    if (!vectorModel) {
      message.warning('请选择向量模型');
      return;
    }
    if (selectedType === 'web' && !webUrl.trim()) {
      message.warning('请输入 Web 根地址');
      return;
    }

    const newDatasetId = addDataset({
      name: name.trim(),
      description: description.trim(),
      type: selectedType!,
      vectorModel,
      webUrl: selectedType === 'web' ? webUrl.trim() : undefined,
      webSelector: selectedType === 'web' ? webSelector.trim() || undefined : undefined,
      folderId: 'ds-folder-1',
      documents: [],
    });

    message.success('知识库创建成功！');
    navigate(`/dataset/${newDatasetId}`);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Title level={3} className="!mb-2">创建知识库</Title>
        <Text type="secondary">知识库用于管理和向量化文档，创建完成后可在详情页上传文档。</Text>
      </div>

      <Steps
        current={currentStep}
        className="mb-8"
        items={[
          { title: '选择类型', description: '选择知识库类型' },
          { title: '填写信息', description: '配置基本信息' },
        ]}
      />

      {currentStep === 0 && (
        <div>
          <Title level={5} className="!mb-4">选择知识库类型</Title>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {datasetTypeOptions.map((option) => {
              const isSelected = selectedType === option.type;
              return (
                <Card
                  key={option.type}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedType(option.type)}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${option.color}15`, color: option.color }}
                    >
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <Text strong className="text-base">{option.label}</Text>
                      <Paragraph type="secondary" className="!mt-2 !mb-0 text-sm">
                        {option.description}
                      </Paragraph>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          <div className="flex justify-end mt-6">
            <Button type="primary" onClick={handleNext} disabled={!selectedType}>
              下一步 <RightOutlined />
            </Button>
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div>
          <Title level={5} className="!mb-4">填写基本信息</Title>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="mb-4">
              <Text strong>知识库名称 <span className="text-red-500">*</span></Text>
              <Input
                placeholder="请输入知识库名称"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
                maxLength={50}
                showCount
              />
            </div>

            <div className="mb-4">
              <Text strong>描述</Text>
              <Input.TextArea
                placeholder="请输入知识库描述（选填）"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
                rows={3}
                maxLength={200}
                showCount
              />
            </div>

            <div className="mb-4">
              <Text strong>向量模型 <span className="text-red-500">*</span></Text>
              <Select
                placeholder="请选择向量模型"
                value={vectorModel || undefined}
                onChange={setVectorModel}
                className="mt-1 w-full"
                options={[
                  { value: 'bge-large-zh-v1.5', label: 'BAAI/bge-large-zh-v1.5（推荐）' },
                  { value: 'text-embedding-3-large', label: 'OpenAI/text-embedding-3-large' },
                  { value: 'text2vec-large-chinese', label: 'shibing624/text2vec-large-chinese' },
                ]}
              />
            </div>

            {selectedType === 'web' && (
              <>
                <div className="mb-4">
                  <Text strong>Web 根地址 <span className="text-red-500">*</span></Text>
                  <Input
                    placeholder="请输入网站地址，如 https://example.com"
                    value={webUrl}
                    onChange={(e) => setWebUrl(e.target.value)}
                    className="mt-1"
                    prefix={<LinkOutlined />}
                  />
                </div>
                <div className="mb-4">
                  <Text strong>选择器（选填）</Text>
                  <Input
                    placeholder="CSS 选择器，如 .content 或 #main"
                    value={webSelector}
                    onChange={(e) => setWebSelector(e.target.value)}
                    className="mt-1"
                  />
                  <Text type="secondary" className="text-xs mt-1 block">
                    用于精准抓取页面中的指定内容区域
                  </Text>
                </div>
              </>
            )}

            <div className="flex justify-between mt-6">
              <Button onClick={() => setCurrentStep(0)}>上一步</Button>
              <Button type="primary" onClick={handleCreate} icon={<CloudUploadOutlined />}>
                创建知识库
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
