import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, RefreshCw, LogOut, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [basicStats, setBasicStats] = useState({
    totalUsers: 0,
    totalSearches: 0
  });
  
  const { user, token, addNotification, logout } = useAppStore();
  const navigate = useNavigate();

  const clearStorageAndReload = () => {
    console.log('Clearing all storage...');
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  const forceCompleteLogout = () => {
    console.log('Force logout using store function...');
    const { forceLogout } = useAppStore.getState();
    forceLogout();
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };

  const testConnection = async () => {
    if (!token || !user || user.role !== 'admin') {
      setError('Geen admin rechten of niet ingelogd');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('=== TOKEN DEBUG INFO ===');
      console.log('Token exists:', !!token);
      console.log('Token length:', token?.length);
      console.log('User role:', user?.role);
      console.log('User email:', user?.email);
      console.log('Token preview:', token?.substring(0, 50) + '...');
      
      // Try to decode token locally (just for debug)
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('Token payload:', payload);
          console.log('Token expires:', new Date(payload.exp * 1000));
          console.log('Token is expired:', payload.exp < Date.now() / 1000);
          console.log('Token issued at:', new Date(payload.iat * 1000));
          console.log('Token age (minutes):', (Date.now() / 1000 - payload.iat) / 60);
        }
      } catch (e) {
        console.log('Could not decode token:', e);
      }
      
      console.log('=== STORAGE CHECK ===');
      console.log('localStorage items:', Object.keys(localStorage));
      console.log('sessionStorage items:', Object.keys(sessionStorage));
      
      // Check current time for debugging
      console.log('Current time:', new Date().toISOString());

      // Simple fetch test
      const response = await fetch('/api/auth?action=admin-stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.text();
        console.log('Error response:', errorData);
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      console.log('Success! Data received:', data);
      
      setBasicStats({
        totalUsers: data.totalUsers || 0,
        totalSearches: data.totalSearchCount || 0
      });

      addNotification({
        type: 'success',
        title: 'Verbonden!',
        message: 'Admin data succesvol geladen.'
      });
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setError(error.message || 'Onbekende fout');
      
      addNotification({
        type: 'error',
        title: 'Verbinding mislukt',
        message: error.message || 'Kan geen verbinding maken met admin API'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    addNotification({
      type: 'info',
      title: 'Uitgelogd',
      message: 'Je bent uitgelogd.'
    });
  };

  useEffect(() => {
    testConnection();
  }, []);

  // Check admin access
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Geen toegang
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Je hebt geen admin rechten om deze pagina te bekijken.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn btn-primary"
          >
            Ga naar login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Admin Dashboard (Test)
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Eenvoudige admin pagina voor verbinding testen
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={testConnection}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Test Verbinding
          </button>
          <button
            onClick={clearStorageAndReload}
            className="btn btn-secondary"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Wis Storage
          </button>
          <button
            onClick={forceCompleteLogout}
            className="btn btn-secondary"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Force Logout
          </button>
          <button
            onClick={handleLogout}
            className="btn btn-danger"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Uitloggen
          </button>
        </div>
      </div>

      {/* Debug Info */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-lg font-semibold">🔧 Debug Informatie</h2>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Gebruiker:</strong> {user?.email}</p>
              <p><strong>Rol:</strong> {user?.role}</p>
              <p><strong>Token aanwezig:</strong> {token ? 'Ja' : 'Nee'}</p>
            </div>
            <div>
              <p><strong>Token lengte:</strong> {token?.length || 0}</p>
              <p><strong>Status:</strong> {isLoading ? 'Laden...' : error ? 'Fout' : 'OK'}</p>
              <p><strong>Tijd:</strong> {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card">
          <div className="card-content">
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-slate-600 dark:text-slate-400">Verbinding testen...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card border-red-200 dark:border-red-800 mb-6">
          <div className="card-content">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-700 dark:text-red-300 mb-1">
                  Verbinding Mislukt
                </h3>
                <p className="text-red-600 dark:text-red-400 mb-3">{error}</p>
                <button
                  onClick={testConnection}
                  className="btn btn-sm btn-secondary"
                >
                  Opnieuw proberen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-content">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Totaal Gebruikers</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {basicStats.totalUsers}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <RefreshCw className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Totaal Zoekopdrachten</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {basicStats.totalSearches}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {!isLoading && !error && (
        <div className="card mt-6 border-green-200 dark:border-green-800">
          <div className="card-content">
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-1">
                Verbinding Succesvol!
              </h3>
              <p className="text-green-600 dark:text-green-400">
                Admin API werkt correct. Je kunt nu de volledige admin functionaliteit toevoegen.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 