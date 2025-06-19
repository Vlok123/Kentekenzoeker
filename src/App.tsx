import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { ApiAuthService } from '@/lib/api-auth';
import Layout from '@/components/Layout';
import NotificationProvider from '@/components/NotificationProvider';

// Pages
import HomePage from '@/pages/HomePage';
import ZoekPage from '@/pages/ZoekPage';
import TrekgewichtPage from '@/pages/TrekgewichtPage';
import VoertuigDetailPage from '@/pages/VoertuigDetailPage';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import MijnOpgeslagenPage from '@/pages/MijnOpgeslagenPage';
import AdminPage from '@/pages/AdminPage';

// Layout wrapper that uses Outlet
function LayoutWrapper() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function App() {
  const { user, token, setUser, logout, addNotification } = useAppStore();

  // Verify token on app load
  useEffect(() => {
    const verifyUserToken = async () => {
      if (token && !user) {
        try {
          const verifiedUser = await ApiAuthService.verifyToken(token);
          if (verifiedUser) {
            setUser(verifiedUser);
          } else {
            // Token is invalid, clear it
            logout();
            addNotification({
              type: 'warning',
              title: 'Sessie verlopen',
              message: 'Je sessie is verlopen. Log opnieuw in.'
            });
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          logout();
          addNotification({
            type: 'error',
            title: 'Authenticatie fout',
            message: 'Er was een probleem met je sessie. Log opnieuw in.'
          });
        }
      }
    };

    verifyUserToken();
  }, [token, user, setUser, logout, addNotification]);

  return (
    <Router>
      <NotificationProvider />
      <Routes>
        {/* Login route without layout */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Routes with layout */}
        <Route path="/" element={<LayoutWrapper />}>
          <Route index element={<HomePage />} />
          <Route path="zoek" element={<ZoekPage />} />
          <Route path="trekgewicht" element={<TrekgewichtPage />} />
          <Route path="voertuig/:kenteken" element={<VoertuigDetailPage />} />
          
          {/* Protected routes */}
          <Route 
            path="dashboard" 
            element={user ? <DashboardPage /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="mijn-opgeslagen" 
            element={user ? <MijnOpgeslagenPage /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="admin" 
            element={user?.role === 'admin' ? <AdminPage /> : <Navigate to="/login" replace />} 
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App; 