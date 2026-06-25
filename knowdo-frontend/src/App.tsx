import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AppLayout from '@/components/layout/AppLayout';
import Home from '@/pages/Home';
import KnowledgeBrowse from '@/pages/KnowledgeBrowse';
import KnowledgeCreate from '@/pages/KnowledgeCreate';
import KnowledgeDetail from '@/pages/KnowledgeDetail';
import ModelConfig from '@/pages/ModelConfig';
import DraftsPage from '@/pages/Drafts';
import ReviewPage from '@/pages/Review';
import RecyclePage from '@/pages/Recycle';
import FavoritesPage from '@/pages/Favorites';
import TagsPage from '@/pages/Tags';
import Dataset from '@/pages/Dataset';
import DatasetCreate from '@/pages/DatasetCreate';
import DatasetDetail from '@/pages/DatasetDetail';
import NotFound from '@/pages/NotFound';

const theme = {
  token: {
    colorPrimary: '#1a56db',
    borderRadius: 8,
    fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif`,
  },
};

function App() {
  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<KnowledgeBrowse />} />
            <Route path="/create" element={<KnowledgeCreate />} />
            <Route path="/detail/:id" element={<KnowledgeDetail />} />
            <Route path="/model" element={<ModelConfig />} />
            <Route path="/drafts" element={<DraftsPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/recycle" element={<RecyclePage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="/dataset" element={<Dataset />} />
            <Route path="/dataset/create" element={<DatasetCreate />} />
            <Route path="/dataset/:id" element={<DatasetDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
