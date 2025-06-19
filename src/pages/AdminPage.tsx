import { useState, useEffect } from 'react';
import { Users, Search, Car, Database, Settings, Shield, RefreshCw, LogOut } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ApiAuthService } from '@/lib/api-auth';
import { useNavigate } from 'react-router-dom';

interface AdminStats {
  totalUsers: number;
  totalSavedSearches: number;
  totalSavedVehicles: number;
  recentUsers: any[];
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalSavedSearches: 0,
    totalSavedVehicles: 0,
    recentUsers: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, token, addNotification, logout } = useAppStore();
  const navigate = useNavigate();

  const loadAdminData = async () => {
    if (!token || !user || user.role !== 'admin') {
      setError('Geen admin rechten of niet ingelogd');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Loading admin stats with token:', token.substring(0, 20) + '...');
      const adminStats = await ApiAuthService.getAdminStats(token);
      console.log('Admin stats loaded successfully:', adminStats);
      
      setStats(adminStats);
      addNotification({
        type: 'success',
        title: 'Gelukt!',
        message: 'Admin data geladen.'
      });
    } catch (error: any) {
      console.error('Admin stats error:', error);
      setError(error.message || 'Onbekende fout bij laden van admin data');
      
      if (error.message?.includes('token')) {
        addNotification({
          type: 'error',
          title: 'Token probleem',
          message: 'Er is een probleem met je sessie. Probeer opnieuw in te loggen.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLogout = () => {
    logout();
    navigate('/login');
    addNotification({
      type: 'info',
      title: 'Uitgelogd',
      message: 'Je bent uitgelogd.'
    });
  };

  const handleRetry = () => {
    loadAdminData();
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Geen Toegang
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Je hebt geen admin rechten. Huidige status: {user ? `${user.email} (${user.role})` : 'Niet ingelogd'}
        </p>
        <div className="space-x-4">
          <button
            onClick={() => navigate('/login')}
            className="btn btn-primary"
          >
            Inloggen
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn btn-secondary"
          >
            Naar Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full">
            <Settings className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Welkom {user.email} ({user.role})
        </p>
        
        <div className="mt-4 flex justify-center space-x-4">
          <button
            onClick={handleRetry}
            disabled={isLoading}
            className="btn btn-primary inline-flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Laden...' : 'Vernieuwen'}</span>
          </button>
          
          <button
            onClick={handleManualLogout}
            className="btn btn-secondary inline-flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Uitloggen</span>
          </button>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 mb-6 text-sm">
        <h3 className="font-bold mb-2">Debug Info:</h3>
        <p><strong>User:</strong> {user?.email || 'Geen user'}</p>
        <p><strong>Role:</strong> {user?.role || 'Geen role'}</p>
        <p><strong>Token:</strong> {token ? `${token.substring(0, 10)}...` : 'Geen token'}</p>
        <p><strong>Loading:</strong> {isLoading ? 'Ja' : 'Nee'}</p>
        <p><strong>Error:</strong> {error || 'Geen error'}</p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
              Er ging iets fout
            </h3>
          </div>
          <p className="text-red-700 dark:text-red-300 mb-4">
            {error}
          </p>
          <div className="space-x-2">
            <button onClick={handleRetry} className="btn btn-primary btn-sm">
              Opnieuw proberen
            </button>
            <button onClick={handleManualLogout} className="btn btn-secondary btn-sm">
              Uitloggen en opnieuw inloggen
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Admin data laden...</p>
        </div>
      )}

      {/* Success State - Stats */}
      {!isLoading && !error && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Totaal gebruikers
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats.totalUsers}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Search className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Opgeslagen zoekopdrachten
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats.totalSavedSearches}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Car className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Opgeslagen voertuigen
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats.totalSavedVehicles}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Database className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Systeem status
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    🟢 Live
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              Alle gebruikers ({stats.totalUsers})
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                      Naam
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                      Rol
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                      Aangemaakt
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentUsers && stats.recentUsers.length > 0 ? (
                    stats.recentUsers.map((user, index) => (
                      <tr key={user.id || index} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                        <td className="py-3 px-4 text-slate-900 dark:text-white font-medium">
                          {user.email}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {user.name || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('nl-NL', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500 dark:text-slate-400">
                        Geen gebruikers gevonden
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 