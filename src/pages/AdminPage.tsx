import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, HardDrive, RefreshCw, AlertCircle, LogOut, Search, Eye, Clock, TrendingUp, BarChart3, Activity, Globe } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ApiAuthService } from '@/lib/api-auth';

interface AdminStats {
  totalUsers: number;
  totalSavedSearches: number;
  totalSavedVehicles: number;
  totalSearchCount: number;
  totalAnonymousSearches: number;
  anonymousSearchesByType: Array<{
    search_type: string;
    count: number;
    avg_results: number;
  }>;
  dailySearchStats: Array<{
    search_date: string;
    anonymous_searches: number;
    unique_ips: number;
  }>;
  topSearchQueries: Array<{
    search_query: string;
    search_count: number;
    search_type: string;
  }>;
  searchesByUser: Array<{
    email: string;
    name: string;
    search_count: number;
  }>;
  recentUsers: any[];
  hourlySearchPattern: Array<{
    hour: number;
    search_count: number;
  }>;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalSavedSearches: 0,
    totalSavedVehicles: 0,
    totalSearchCount: 0,
    totalAnonymousSearches: 0,
    anonymousSearchesByType: [],
    dailySearchStats: [],
    topSearchQueries: [],
    searchesByUser: [],
    recentUsers: [],
    hourlySearchPattern: []
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
      const adminStats = await ApiAuthService.getAdminStats(token);
      setStats(adminStats);
      
      addNotification({
        type: 'success',
        title: 'Gelukt!',
        message: 'Admin data geladen.'
      });
    } catch (error: any) {
      console.error('Admin data loading error:', error);
      setError(error.message || 'Onbekende fout bij laden van admin data');
      
      addNotification({
        type: 'error',
        title: 'Fout bij laden admin data',
        message: error.message || 'Onbekende fout'
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

  const handleRetry = () => {
    loadAdminData();
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Check if user has admin access
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Beheer gebruikers en bekijk statistieken
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRetry}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Ververs
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

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-slate-600 dark:text-slate-400">Admin data laden...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card mb-6 border-red-200 dark:border-red-800">
          <div className="card-content">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-700 dark:text-red-300 mb-1">
                  Fout bij laden van admin data
                </h3>
                <p className="text-red-600 dark:text-red-400 mb-3">{error}</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleRetry}
                    className="btn btn-sm btn-secondary"
                  >
                    Opnieuw proberen
                  </button>
                  <button
                    onClick={handleLogout}
                    className="btn btn-sm btn-danger"
                  >
                    Uitloggen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success State - Show Stats */}
      {!isLoading && !error && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
            <div className="card">
              <div className="card-content">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Totaal Gebruikers</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {stats.totalUsers}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                    <Search className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Account Zoekopdrachten</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {stats.totalSearchCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Eye className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Anonieme Zoekopdrachten</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {stats.totalAnonymousSearches}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Opgeslagen Zoekopdrachten</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {stats.totalSavedSearches}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <HardDrive className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Opgeslagen Voertuigen</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {stats.totalSavedVehicles}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Globe className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Totaal Zoekopdrachten</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {stats.totalSearchCount + stats.totalAnonymousSearches}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Anonymous Search Types */}
          {stats.anonymousSearchesByType.length > 0 && (
            <div className="card mb-8">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Anonieme Zoekopdrachten per Type
                </h2>
              </div>
              <div className="card-content">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {stats.anonymousSearchesByType.map((type) => (
                    <div key={type.search_type} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          type.search_type === 'kenteken' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          type.search_type === 'wildcard' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        }`}>
                          {type.search_type}
                        </span>
                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                          {type.count}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Gem. {Math.round(type.avg_results)} resultaten
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Top Search Queries */}
          {stats.topSearchQueries.length > 0 && (
            <div className="card mb-8">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Top 50 Zoekopdrachten
                </h2>
              </div>
              <div className="card-content">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 font-medium text-slate-700 dark:text-slate-300">Zoekopdracht</th>
                        <th className="text-left py-2 font-medium text-slate-700 dark:text-slate-300">Type</th>
                        <th className="text-right py-2 font-medium text-slate-700 dark:text-slate-300">Aantal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topSearchQueries.slice(0, 20).map((query, index) => (
                        <tr key={index} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2 font-mono text-xs">{query.search_query}</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              query.search_type === 'kenteken' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                              query.search_type === 'wildcard' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            }`}>
                              {query.search_type}
                            </span>
                          </td>
                          <td className="py-2 text-right font-semibold">{query.search_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Daily Search Stats */}
          {stats.dailySearchStats.length > 0 && (
            <div className="card mb-8">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Dagelijkse Statistieken (Laatste 30 dagen)
                </h2>
              </div>
              <div className="card-content">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 font-medium text-slate-700 dark:text-slate-300">Datum</th>
                        <th className="text-right py-2 font-medium text-slate-700 dark:text-slate-300">Zoekopdrachten</th>
                        <th className="text-right py-2 font-medium text-slate-700 dark:text-slate-300">Unieke IP's</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.dailySearchStats.slice(0, 10).map((day, index) => (
                        <tr key={index} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2">{new Date(day.search_date).toLocaleDateString('nl-NL')}</td>
                          <td className="py-2 text-right font-semibold">{day.anonymous_searches}</td>
                          <td className="py-2 text-right">{day.unique_ips}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Hourly Search Pattern */}
          {stats.hourlySearchPattern.length > 0 && (
            <div className="card mb-8">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Zoekpatroon per Uur
                </h2>
              </div>
              <div className="card-content">
                <div className="grid grid-cols-12 gap-2">
                  {stats.hourlySearchPattern.map((hour) => {
                    const maxCount = Math.max(...stats.hourlySearchPattern.map(h => h.search_count));
                    const height = maxCount > 0 ? Math.max(10, (hour.search_count / maxCount) * 100) : 10;
                    
                    return (
                      <div key={hour.hour} className="text-center">
                        <div className="mb-2">
                          <div
                            className="bg-blue-500 dark:bg-blue-400 rounded-t"
                            style={{ height: `${height}px` }}
                            title={`${hour.hour}:00 - ${hour.search_count} zoekopdrachten`}
                          ></div>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          {hour.hour}
                        </div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          {hour.search_count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 