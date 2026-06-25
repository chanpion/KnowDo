import { useNavigate } from 'react-router-dom';
import { FrownOutlined, HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';

const { Title, Text } = Typography;

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 px-4">
      <FrownOutlined style={{ fontSize: 72, color: '#d9d9d9' }} />
      <Title level={1} style={{ fontSize: 96, color: '#d9d9d9', margin: '16px 0' }}>404</Title>
      <Title level={4} type="secondary">页面未找到</Title>
      <Text type="secondary" className="mt-2 mb-8">抱歉，您访问的页面不存在或已被移除。</Text>
      <div className="flex gap-3">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回上页
        </Button>
        <Button type="primary" icon={<HomeOutlined />} onClick={() => navigate('/')}>
          返回首页
        </Button>
      </div>
    </div>
  );
}
