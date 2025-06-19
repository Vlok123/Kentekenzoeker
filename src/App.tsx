import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import TrekgewichtPage from '@/pages/TrekgewichtPage';
import VoertuigDetailPage from '@/pages/VoertuigDetailPage';
import ZoekPage from '@/pages/ZoekPage';
import LoginPage from '@/pages/LoginPage';
import AdminPage from '@/pages/AdminPage';
import MijnOpgeslagenPage from '@/pages/MijnOpgeslagenPage';
import DashboardPage from '@/pages/DashboardPage';
import { useAppStore } from '@/store/useAppStore';
import { MockAuthService as AuthService } from '@/lib/auth-mock';

// Protected Route component
function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, isAuthenticated } = useAppStore();

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  if (adminOnly && user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Toegang geweigerd
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Je hebt geen administratorrechten om deze pagina te bekijken.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

function App() {
  const { user, token, setUser, setToken } = useAppStore();

  useEffect(() => {
    // Check if user is already logged in
    if (token && !user) {
      AuthService.verifyToken(token)
        .then((verifiedUser) => {
          if (verifiedUser) {
            setUser(verifiedUser);
          } else {
            setToken(null);
          }
        })
        .catch(() => {
          setToken(null);
        });
    }
  }, [token, user, setUser, setToken]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Routes with layout */}
      <Route
        path="/*"
        element={
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/trekgewicht" element={<TrekgewichtPage />} />
              <Route path="/zoek" element={<ZoekPage />} />
              <Route path="/voertuig/:kenteken" element={<VoertuigDetailPage />} />
              
              {/* Protected admin route */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              
              {/* Protected user routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mijn-opgeslagen"
                element={
                  <ProtectedRoute>
                    <MijnOpgeslagenPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}

export default App; 