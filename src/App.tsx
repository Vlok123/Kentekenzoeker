import { Routes, Route } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import TrekgewichtPage from '@/pages/TrekgewichtPage';
import ZoekPage from '@/pages/ZoekPage';
import VoertuigDetailPage from '@/pages/VoertuigDetailPage';
import NotificationProvider from '@/components/NotificationProvider';

function App() {
  const isDarkMode = useAppStore((state) => state.isDarkMode);

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <NotificationProvider />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trekgewicht" element={<TrekgewichtPage />} />
          <Route path="/zoek" element={<ZoekPage />} />
          <Route path="/voertuig/:kenteken" element={<VoertuigDetailPage />} />
        </Routes>
      </Layout>
    </div>
  );
}

export default App; 