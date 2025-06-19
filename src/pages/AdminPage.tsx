import { useState, useEffect } from 'react';
import { Users, Search, Car, Database, Settings, Shield, Activity, Clock, MapPin, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ApiAuthService } from '@/lib/api-auth';

interface AdminStats {
  totalUsers: number;
  totalSavedSearches: number;
  totalSavedVehicles: number;
  recentUsers: any[];
}

interface ActivityLog {
  id: string;
  action: string;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
  email: string;
  name: string;
  role: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalSavedSearches: 0,
    totalSavedVehicles: 0,
    recentUsers: []
  });
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'cleanup'>('overview');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const { user, token, addNotification } = useAppStore();

  const loadAdminData = async (showLoading = true) => {
    if (!token || !user || user.role !== 'admin') {
      setIsLoading(false);
      return;
    }

    if (showLoading) setIsLoading(true);
    try {
      const adminStats = await ApiAuthService.getAdminStats(token);
      setStats(adminStats);
      
      addNotification({
        type: 'success',
        title: 'Data geladen',
        message: 'Admin statistieken zijn bijgewerkt.'
      });
    } catch (error) {
      console.error('Failed to load admin stats:', error);
      addNotification({
        type: 'error',
        title: 'Fout bij laden',
        message: 'Kon admin statistieken niet laden.'
      });
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAdminData(false);
    if (activeTab === 'logs') {
      await loadLogs(1, false);
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadAdminData();
  }, [token, user, addNotification]);

  const loadLogs = async (page: number = 1, showLoading = true) => {
    if (!token || !user || user.role !== 'admin') return;

    if (showLoading) setIsLoadingLogs(true);
    try {
      const result = await ApiAuthService.getAdminLogs(token, page);
      setLogs(result.logs);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Failed to load admin logs:', error);
      addNotification({
        type: 'error',
        title: 'Fout bij laden',
        message: 'Kon activiteiten logs niet laden.'
      });
    } finally {
      if (showLoading) setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab]);

  const handleCleanupOldData = async () => {
    if (!confirm('Weet je zeker dat je oude data (ouder dan 30 dagen) wilt opschonen?')) {
      return;
    }

    try {
      await ApiAuthService.cleanupOldData(token!);
      addNotification({
        type: 'success',
        title: 'Opschoning voltooid',
        message: 'Oude data is succesvol opgeschoond.'
      });
      // Refresh stats after cleanup
      await loadAdminData(false);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Opschoning mislukt',
        message: error.message || 'Er is iets misgegaan bij het opschonen.'
      });
    }
  };

  const formatActionName = (action: string) => {
    const actionMap: Record<string, string> = {
      'LOGIN': 'Inloggen',
      'LOGOUT': 'Uitloggen',
      'REGISTER': 'Registreren', 
      'SAVE_SEARCH_RESULTS': 'Zoekresultaten opslaan',
      'DELETE_SAVED_SEARCH': 'Opgeslagen zoekopdracht verwijderen',
      'SAVE_VEHICLE': 'Voertuig opslaan',
      'CLEANUP_OLD_DATA': 'Oude data opschonen'
    };
    return actionMap[action] || action;
  };

  // Redirect if not admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Toegang geweigerd
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Je hebt geen administratorrechten om deze pagina te bekijken.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-300">Admin data laden...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full">
            <Settings className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
          Beheer gebruikers, bekijk logs en onderhoud de database
        </p>
        
        {/* Global Refresh Button */}
        <div className="mt-4">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary inline-flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Verversen...' : 'Alles Verversen'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300'
              }`}
            >
              Overzicht
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'logs'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300'
              }`}
            >
              Activiteiten
            </button>
            <button
              onClick={() => setActiveTab('cleanup')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'cleanup'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300'
              }`}
            >
              Onderhoud
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
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

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
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

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
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

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
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

              {/* Recent Users */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Alle gebruikers ({stats.totalUsers})
                  </h2>
                  <button
                    onClick={() => loadAdminData(false)}
                    className="btn btn-secondary btn-sm inline-flex items-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Ververs</span>
                  </button>
                </div>
                
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
                        stats.recentUsers.map((user) => (
                          <tr key={user.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
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
                              {new Date(user.created_at).toLocaleDateString('nl-NL', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
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

          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Activiteiten Logs ({pagination.total})
                </h2>
                <button
                  onClick={() => loadLogs(1, true)}
                  className="btn btn-secondary inline-flex items-center space-x-2"
                  disabled={isLoadingLogs}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                  <span>{isLoadingLogs ? 'Laden...' : 'Vernieuwen'}</span>
                </button>
              </div>

              {isLoadingLogs ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-300">Laden van activiteiten...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs && logs.length > 0 ? (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg">
                              <Activity className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium text-slate-900 dark:text-white">
                                  {formatActionName(log.action)}
                                </h3>
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                  door {log.name || log.email}
                                </span>
                              </div>
                              {log.details && Object.keys(log.details).length > 0 && (
                                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded p-2 font-mono">
                                  <pre className="whitespace-pre-wrap text-xs">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
                                </div>
                              )}
                              <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {new Date(log.created_at).toLocaleString('nl-NL')}
                                </span>
                                {log.ip_address && (
                                  <span className="flex items-center">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {log.ip_address}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500 dark:text-slate-400">Geen activiteiten gevonden</p>
                    </div>
                  )}

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex justify-center space-x-2 pt-4">
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => loadLogs(page)}
                          className={`px-3 py-1 rounded transition-colors ${
                            page === pagination.page
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'cleanup' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Database Onderhoud
              </h2>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 p-6">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  🧹 Automatisch Opschonen
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                  Opgeslagen kentekens en zoekopdrachten worden automatisch verwijderd na 30 dagen. 
                  Je kunt handmatig oude data opschonen door op de knop hieronder te klikken.
                </p>
                <button
                  onClick={handleCleanupOldData}
                  className="btn btn-danger inline-flex items-center space-x-2"
                >
                  <Database className="w-4 h-4" />
                  <span>Oude Data Opschonen (30+ dagen)</span>
                </button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">
                  📊 Database Info
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p className="text-blue-700 dark:text-blue-300">
                      <strong>Database:</strong> PostgreSQL (Neon)
                    </p>
                    <p className="text-blue-700 dark:text-blue-300">
                      <strong>SSL:</strong> Ingeschakeld
                    </p>
                    <p className="text-blue-700 dark:text-blue-300">
                      <strong>Retentie:</strong> 30 dagen
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-blue-700 dark:text-blue-300">
                      <strong>Status:</strong> 🟢 Actief
                    </p>
                    <p className="text-blue-700 dark:text-blue-300">
                      <strong>Backup:</strong> Automatisch
                    </p>
                    <p className="text-blue-700 dark:text-blue-300">
                      <strong>Regio:</strong> Europe West
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 