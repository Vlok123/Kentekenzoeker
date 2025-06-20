import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
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
import SetupPage from '@/pages/SetupPage';


// Layout wrapper that uses Outlet
function LayoutWrapper() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function App() {
  const { user } = useAppStore();

  // Token verification disabled for stability
  // useEffect(() => {
  //   const verifyUserToken = async () => {
  //     if (token && !user) {
  //       try {
  //         const verifiedUser = await ApiAuthService.verifyToken(token);
  //         if (verifiedUser) {
  //           setUser(verifiedUser);
  //         } else {
  //           logout();
  //           addNotification({
  //             type: 'warning',
  //             title: 'Sessie verlopen',
  //             message: 'Je sessie is verlopen. Log opnieuw in.'
  //           });
  //         }
  //       } catch (error) {
  //         console.error('Token verification failed:', error);
  //         logout();
  //         addNotification({
  //           type: 'error',
  //           title: 'Authenticatie fout',
  //           message: 'Er was een probleem met je sessie. Log opnieuw in.'
  //         });
  //       }
  //     }
  //   };
  //   verifyUserToken();
  // }, [token, user, setUser, logout, addNotification]);

  return (
    <>
      <NotificationProvider />
      <Routes>
        {/* Login route without layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/setup" element={<SetupPage />} />
        
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
    </>
  );
}

export default App; 