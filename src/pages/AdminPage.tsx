import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Users, 
  Search, 
  LogOut, 
  Activity,
  Clock,
  TrendingUp,
  Calendar,
  Database,
  AlertCircle,
  User,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { fetchWithAuth } from '@/lib/api-auth';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalSearches: number;
  searchesToday: number;
  popularSearches: Array<{ kenteken: string; count: number }>;
  recentUsers: Array<{ email: string; created_at: string }>;
  searchesByDay: Array<{ date: string; count: number }>;
  savedVehicles: number;
  databaseSize: string;
  userActivity: Array<{
    email: string;
    name: string;
    search_count: number;
    login_count: number;
    total_activities: number;
    last_activity: string;
    created_at: string;
  }>;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  const { user, logout } = useAppStore();
  const navigate = useNavigate();

  // Check if user is admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch admin statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await fetchWithAuth('/auth?action=admin-stats');
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError('Kon statistieken niet laden');
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchStats();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Welkom terug, {user.name || user.email}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="btn btn-secondary"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Uitloggen
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Totaal
              </span>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {loading ? '...' : stats?.totalUsers || 0}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Geregistreerde gebruikers
              </p>
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Deze week
              </span>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {loading ? '...' : stats?.activeUsers || 0}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Actieve gebruikers
              </p>
            </div>
          </div>
        </div>

        {/* Total Searches */}
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Search className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Totaal
              </span>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {loading ? '...' : stats?.totalSearches || 0}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Zoekopdrachten
              </p>
            </div>
          </div>
        </div>

        {/* Searches Today */}
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Vandaag
              </span>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {loading ? '...' : stats?.searchesToday || 0}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Zoekopdrachten vandaag
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Activity Section */}
      <div className="mb-8">
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <User className="w-5 h-5" />
                Gebruikersactiviteit
              </h2>
              <button
                onClick={() => setShowUserDetails(!showUserDetails)}
                className="btn btn-sm btn-secondary"
              >
                {showUserDetails ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Verberg details
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Toon details
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="card-content">
            {loading ? (
              <p className="text-slate-500">Laden...</p>
            ) : stats?.userActivity && stats.userActivity.length > 0 ? (
              <div className="space-y-4">
                {/* Summary View */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Meest actieve gebruiker</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {stats.userActivity[0]?.email}
                    </p>
                    <p className="text-sm text-slate-500">
                      {stats.userActivity[0]?.search_count} zoekopdrachten
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Gemiddeld per gebruiker</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {Math.round(stats.userActivity.reduce((sum, user) => sum + user.search_count, 0) / stats.userActivity.length)}
                    </p>
                    <p className="text-sm text-slate-500">zoekopdrachten</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Actieve gebruikers</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {stats.userActivity.filter(user => user.search_count > 0).length}
                    </p>
                    <p className="text-sm text-slate-500">van {stats.userActivity.length}</p>
                  </div>
                </div>

                {/* Detailed View */}
                {showUserDetails && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Gebruiker</th>
                          <th className="text-right py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Zoekopdrachten</th>
                          <th className="text-right py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Logins</th>
                          <th className="text-right py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Totale activiteit</th>
                          <th className="text-right py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Laatste activiteit</th>
                          <th className="text-right py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Lid sinds</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.userActivity.map((userActivity, index) => (
                          <tr key={index} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-slate-900 dark:text-slate-100">
                                  {userActivity.name || 'Geen naam'}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {userActivity.email}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                userActivity.search_count > 10 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : userActivity.search_count > 0
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {userActivity.search_count}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                              {userActivity.login_count}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                              {userActivity.total_activities}
                            </td>
                            <td className="py-3 px-4 text-right text-sm text-slate-600 dark:text-slate-400">
                              {userActivity.last_activity 
                                ? new Date(userActivity.last_activity).toLocaleDateString('nl-NL', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : 'Geen activiteit'
                              }
                            </td>
                            <td className="py-3 px-4 text-right text-sm text-slate-600 dark:text-slate-400">
                              {new Date(userActivity.created_at).toLocaleDateString('nl-NL', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500">Geen gebruikersactiviteit beschikbaar</p>
            )}
          </div>
        </div>
      </div>

      {/* Popular Searches & Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Popular Searches */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Search className="w-5 h-5" />
              Populaire Kentekens
            </h2>
          </div>
          <div className="card-content">
            {loading ? (
              <p className="text-slate-500">Laden...</p>
            ) : stats?.popularSearches && stats.popularSearches.length > 0 ? (
              <div className="space-y-3">
                {stats.popularSearches.slice(0, 5).map((search, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700 last:border-0">
                    <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                      {search.kenteken}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {search.count} keer
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">Geen gegevens beschikbaar</p>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recente Gebruikers
            </h2>
          </div>
          <div className="card-content">
            {loading ? (
              <p className="text-slate-500">Laden...</p>
            ) : stats?.recentUsers && stats.recentUsers.length > 0 ? (
              <div className="space-y-3">
                {stats.recentUsers.slice(0, 5).map((user, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700 last:border-0">
                    <span className="text-sm text-slate-900 dark:text-slate-100">
                      {user.email}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {new Date(user.created_at).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">Geen recente aanmeldingen</p>
            )}
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Stats */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Statistieken
            </h2>
          </div>
          <div className="card-content">
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Opgeslagen voertuigen</span>
                <span className="font-medium">{loading ? '...' : stats?.savedVehicles || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Database grootte</span>
                <span className="font-medium">{loading ? '...' : stats?.databaseSize || 'Onbekend'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-600 dark:text-slate-400">API Status</span>
                <span className="font-medium text-green-600 dark:text-green-400">Actief</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Account Informatie
            </h2>
          </div>
          <div className="card-content">
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Email</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Rol</span>
                <span className="font-medium capitalize">{user.role}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-600 dark:text-slate-400">Account aangemaakt</span>
                <span className="font-medium">
                  {new Date(user.created_at).toLocaleDateString('nl-NL', { 
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Activity Chart */}
      {stats?.searchesByDay && stats.searchesByDay.length > 0 && (
        <div className="mt-8 card">
          <div className="card-header">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Zoekactiviteit (Laatste 7 dagen)
            </h2>
          </div>
          <div className="card-content">
            <div className="h-64 flex items-end justify-between gap-2">
              {stats.searchesByDay.slice(0, 7).reverse().map((day, index) => {
                const maxCount = Math.max(...stats.searchesByDay.map(d => Number(d.count)));
                const percentage = (Number(day.count) / maxCount) * 100;
                const date = new Date(day.date);
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-t relative">
                      <div 
                        className="bg-blue-500 dark:bg-blue-400 rounded-t transition-all duration-500"
                        style={{ height: `${percentage * 2}px` }}
                      >
                        <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-sm font-medium text-slate-700 dark:text-slate-300">
                          {day.count}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                      {date.toLocaleDateString('nl-NL', { 
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 