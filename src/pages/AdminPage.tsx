import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, HardDrive, RefreshCw, AlertCircle, LogOut, Info, Search, Eye, Clock, TrendingUp, BarChart3, Activity, Globe, Database } from 'lucide-react';
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
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const [debugData, setDebugData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'debug' | 'users'>('overview');
  const { user, token, addNotification, logout } = useAppStore();
  const navigate = useNavigate();

  // Debug: Check token validity
  const checkTokenValidity = async () => {
    if (!token) {
      setDebugInfo(prev => ({ ...prev, tokenStatus: 'Geen token gevonden' }));
      return false;
    }

    try {
      // Try to decode the token to see its contents (basic check)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        setDebugInfo(prev => ({ ...prev, tokenStatus: 'Token heeft onjuist formaat' }));
        return false;
      }

      // Decode JWT payload (without verification)
      const payload = JSON.parse(atob(tokenParts[1]));
      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp && payload.exp < now;
      
      setDebugInfo(prev => ({
        ...prev,
        tokenStatus: isExpired ? 'Token is verlopen' : 'Token lijkt geldig',
        tokenPayload: payload,
        tokenLength: token.length,
        expiresAt: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'Onbekend'
      }));

      if (isExpired) {
        return false;
      }

      // Try to verify with API
      const verifiedUser = await ApiAuthService.verifyToken(token);
      if (verifiedUser) {
        setDebugInfo(prev => ({ ...prev, verificationStatus: 'API verificatie succesvol' }));
        return true;
      } else {
        setDebugInfo(prev => ({ ...prev, verificationStatus: 'API verificatie gefaald' }));
        return false;
      }
    } catch (error: any) {
      setDebugInfo(prev => ({ 
        ...prev, 
        tokenStatus: 'Token parsing error',
        tokenError: error.message 
      }));
      return false;
    }
  };

  const loadAdminData = async () => {
    if (!token || !user || user.role !== 'admin') {
      setError('Geen admin rechten of niet ingelogd');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('=== ADMIN DEBUG START ===');
      console.log('User:', user);
      console.log('Token (first 50 chars):', token.substring(0, 50) + '...');
      console.log('Token length:', token.length);
      
      // Check token validity first
      const isTokenValid = await checkTokenValidity();
      console.log('Token validity check:', isTokenValid);

      if (!isTokenValid) {
        throw new Error('Token is ongeldig of verlopen');
      }

      console.log('Attempting to fetch admin stats...');
      const adminStats = await ApiAuthService.getAdminStats(token);
      console.log('Admin stats loaded successfully:', adminStats);
      console.log('Total search count:', adminStats.totalSearchCount);
      console.log('Searches by user:', adminStats.searchesByUser);
      
      setStats(adminStats);

      console.log('Attempting to fetch debug data...');
      const debugData = await ApiAuthService.getAdminDebug(token);
      console.log('Debug data loaded successfully:', debugData);
      
      setDebugData(debugData);
      addNotification({
        type: 'success',
        title: 'Gelukt!',
        message: 'Admin data geladen.'
      });
      
      console.log('=== ADMIN DEBUG END ===');
    } catch (error: any) {
      console.error('=== ADMIN ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      setError(error.message || 'Onbekende fout bij laden van admin data');
      
      // Add detailed error info to debug
      setDebugInfo(prev => ({
        ...prev,
        lastError: error.message,
        lastErrorTime: new Date().toLocaleString(),
        errorDetails: error.stack || 'Geen stack trace'
      }));
      
      addNotification({
        type: 'error',
        title: 'Fout bij laden admin data',
        message: error.message || 'Onbekende fout'
      });
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

  const clearLocalStorage = () => {
    localStorage.clear();
    addNotification({
      type: 'info',
      title: 'LocalStorage gewist',
      message: 'Alle lokale data is gewist. Herlaad de pagina.'
    });
  };

  useEffect(() => {
    setDebugInfo({
      user: user,
      tokenExists: !!token,
      tokenLength: token?.length || 0,
      userRole: user?.role,
      isAuthenticated: !!user && !!token,
      timestamp: new Date().toLocaleString()
    });
    
    loadAdminData();
  }, []);

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
            onClick={handleManualLogout}
            className="btn btn-danger"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Uitloggen
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-700 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            📊 Overzicht
          </button>
          <button
            onClick={() => setActiveTab('debug')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'debug'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            🔧 Debug Info
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            👥 Gebruikers
          </button>
        </nav>
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
                <button
                  onClick={handleRetry}
                  className="btn btn-sm btn-danger"
                >
                  Opnieuw proberen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {!isLoading && !error && (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
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
                        <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Systeem Status</p>
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          Actief
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Statistics */}
              <div className="card mb-8">
                <div className="card-header">
                  <h2 className="text-xl font-semibold">🔍 Zoekstatistieken per Gebruiker</h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Overzicht van hoeveel zoekopdrachten elke gebruiker heeft uitgevoerd
                  </p>
                </div>
                <div className="card-content">
                  {stats.searchesByUser.length === 0 ? (
                    <div className="text-center py-8">
                      <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        Nog geen zoekstatistieken
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400">
                        Gebruikers moeten eerst zoekopdrachten uitvoeren voordat er statistieken verschijnen.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                              Email
                            </th>
                            <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                              Naam
                            </th>
                            <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                              Zoekopdrachten
                            </th>
                            <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                              Percentage
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.searchesByUser.map((user, index) => (
                            <tr key={index} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                              <td className="py-3 px-4 text-slate-900 dark:text-white font-medium">
                                {user.email}
                              </td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                                {user.name || '-'}
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                  {user.search_count}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                                {stats.totalSearchCount > 0 
                                  ? `${((user.search_count / stats.totalSearchCount) * 100).toFixed(1)}%`
                                  : '0%'
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Anonymous Search Statistics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="card">
                  <div className="card-header">
                    <h2 className="text-xl font-semibold">👤 Anonieme Zoekopdrachten per Type</h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      Overzicht van zoekopdrachten zonder account
                    </p>
                  </div>
                  <div className="card-content">
                    {stats.anonymousSearchesByType.length === 0 ? (
                      <div className="text-center py-8">
                        <Eye className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                          Nog geen anonieme zoekopdrachten
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400">
                          Wacht tot bezoekers zonder account gaan zoeken.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {stats.anonymousSearchesByType.map((type, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                type.search_type === 'kenteken' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                type.search_type === 'wildcard' ? 'bg-green-100 dark:bg-green-900/30' :
                                'bg-purple-100 dark:bg-purple-900/30'
                              }`}>
                                {type.search_type === 'kenteken' ? <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" /> :
                                 type.search_type === 'wildcard' ? <Globe className="w-5 h-5 text-green-600 dark:text-green-400" /> :
                                 <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white capitalize">
                                  {type.search_type}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  Gem. {Math.round(type.avg_results)} resultaten
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {type.count}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                zoekopdrachten
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h2 className="text-xl font-semibold">⏰ Zoekpatroon per Uur</h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      Activiteit gedurende de dag (laatste 7 dagen)
                    </p>
                  </div>
                  <div className="card-content">
                    {stats.hourlySearchPattern.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">Geen data beschikbaar</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {stats.hourlySearchPattern.map((hour, index) => {
                          const maxCount = Math.max(...stats.hourlySearchPattern.map(h => h.search_count));
                          const percentage = maxCount > 0 ? (hour.search_count / maxCount) * 100 : 0;
                          return (
                            <div key={index} className="flex items-center gap-3">
                              <div className="w-12 text-sm text-slate-600 dark:text-slate-400">
                                {hour.hour.toString().padStart(2, '0')}:00
                              </div>
                              <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-4 relative">
                                <div 
                                  className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                />
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                                  {hour.search_count}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Top Search Queries */}
              <div className="card mb-8">
                <div className="card-header">
                  <h2 className="text-xl font-semibold">🔥 Populairste Zoekopdrachten</h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Meest gezochte kentekens en queries (anoniem)
                  </p>
                </div>
                <div className="card-content">
                  {stats.topSearchQueries.length === 0 ? (
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        Nog geen populaire zoekopdrachten
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400">
                        Wacht tot er meer zoekopdrachten zijn uitgevoerd.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stats.topSearchQueries.slice(0, 12).map((query, index) => (
                        <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              query.search_type === 'kenteken' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                              query.search_type === 'wildcard' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                              'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                            }`}>
                              {query.search_type}
                            </span>
                            <span className="text-lg font-bold text-slate-900 dark:text-white">
                              {query.search_count}×
                            </span>
                          </div>
                          <p className="text-sm font-mono text-slate-700 dark:text-slate-300 truncate">
                            {query.search_query}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Daily Search Statistics */}
              <div className="card mb-8">
                <div className="card-header">
                  <h2 className="text-xl font-semibold">📈 Dagelijkse Statistieken</h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Zoekopdrachten en unieke bezoekers per dag (laatste 30 dagen)
                  </p>
                </div>
                <div className="card-content">
                  {stats.dailySearchStats.length === 0 ? (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500 dark:text-slate-400">Geen dagelijkse data beschikbaar</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                              Datum
                            </th>
                            <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                              Zoekopdrachten
                            </th>
                            <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                              Unieke IP's
                            </th>
                            <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                              Gem. per IP
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.dailySearchStats.slice(0, 14).map((day, index) => (
                            <tr key={index} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                              <td className="py-3 px-4 text-slate-900 dark:text-white font-medium">
                                {new Date(day.search_date).toLocaleDateString('nl-NL')}
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                  {day.anonymous_searches}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                  {day.unique_ips}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                                {day.unique_ips > 0 ? (day.anonymous_searches / day.unique_ips).toFixed(1) : '0'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Debug Tab */}
          {activeTab === 'debug' && (
            <div className="space-y-6">
              {/* System Info */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    🔧 Systeem Debug Informatie
                  </h2>
                </div>
                <div className="card-content">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <h3 className="font-semibold mb-3 text-slate-900 dark:text-white">Gebruiker Status</h3>
                      <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                        <li><span className="font-medium">Email:</span> {debugInfo.user?.email || 'Onbekend'}</li>
                        <li><span className="font-medium">Rol:</span> {debugInfo.user?.role || 'Onbekend'}</li>
                        <li><span className="font-medium">Ingelogd:</span> {debugInfo.isAuthenticated ? 'Ja' : 'Nee'}</li>
                        <li><span className="font-medium">Timestamp:</span> {debugInfo.timestamp}</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-3 text-slate-900 dark:text-white">Token Status</h3>
                      <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                        <li><span className="font-medium">Token bestaat:</span> {debugInfo.tokenExists ? 'Ja' : 'Nee'}</li>
                        <li><span className="font-medium">Token lengte:</span> {debugInfo.tokenLength}</li>
                        <li><span className="font-medium">Status:</span> {debugInfo.tokenStatus || 'Nog niet gecontroleerd'}</li>
                        <li><span className="font-medium">Verloopt:</span> {debugInfo.expiresAt || 'Onbekend'}</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
                    <div className="flex gap-2">
                      <button onClick={clearLocalStorage} className="btn btn-sm btn-secondary">
                        Wis LocalStorage
                      </button>
                      <button onClick={() => window.location.reload()} className="btn btn-sm btn-secondary">
                        Herlaad Pagina
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Database Debug Info */}
              {debugData && (
                <>
                  <div className="card">
                    <div className="card-header">
                      <h2 className="text-lg font-semibold">🗄️ Database Informatie</h2>
                    </div>
                    <div className="card-content">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-semibold mb-3">Database Tabellen</h3>
                          <ul className="space-y-1 text-sm">
                            {debugData.database_tables?.map((table: string) => (
                              <li key={table} className="text-slate-600 dark:text-slate-400">
                                📋 {table}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-3">Activiteit Overzicht</h3>
                          <ul className="space-y-2 text-sm">
                            {debugData.activity_summary?.map((activity: any) => (
                              <li key={activity.action} className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">{activity.action}:</span>
                                <span className="font-medium text-slate-900 dark:text-white">{activity.count}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <h2 className="text-lg font-semibold">📊 Recente Activiteiten</h2>
                    </div>
                    <div className="card-content">
                      {debugData.recent_logs?.length === 0 ? (
                        <p className="text-center text-slate-500 dark:text-slate-400 py-4">
                          Geen recente activiteiten gevonden
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-3">Gebruiker</th>
                                <th className="text-left py-2 px-3">Actie</th>
                                <th className="text-left py-2 px-3">Details</th>
                                <th className="text-left py-2 px-3">Tijd</th>
                              </tr>
                            </thead>
                            <tbody>
                              {debugData.recent_logs?.slice(0, 10).map((log: any, index: number) => (
                                <tr key={index} className="border-b border-slate-100 dark:border-slate-800">
                                  <td className="py-2 px-3 text-slate-900 dark:text-white">
                                    {log.email}
                                  </td>
                                  <td className="py-2 px-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      log.action === 'SEARCH' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                      log.action === 'LOGIN' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                      'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                                    }`}>
                                      {log.action}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                                    {log.details?.search_query || log.details?.result_count || '-'}
                                  </td>
                                  <td className="py-2 px-3 text-slate-500 dark:text-slate-400">
                                    {new Date(log.created_at).toLocaleString('nl-NL')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {debugInfo.lastError && (
                <div className="card border-red-200 dark:border-red-800">
                  <div className="card-header">
                    <h3 className="font-semibold text-red-600 dark:text-red-400">❌ Laatste Fout</h3>
                  </div>
                  <div className="card-content">
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                      <p className="font-medium text-red-700 dark:text-red-300 mb-2">{debugInfo.lastError}</p>
                      <p className="text-sm text-red-600 dark:text-red-400">Tijd: {debugInfo.lastErrorTime}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold">👥 Gebruikers Overzicht</h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Overzicht van alle {stats.recentUsers.length} gebruikers
                </p>
              </div>
              <div className="card-content">
                {stats.recentUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">Geen gebruikers gevonden</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                            Email
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                            Naam
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                            Rol
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                            Aangemaakt
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                            Activiteit
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentUsers.map((user) => {
                          const userActivity = debugData?.users_with_activity?.find((u: any) => u.email === user.email);
                          return (
                            <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                              <td className="py-3 px-4 text-slate-900 dark:text-white font-medium">
                                {user.email}
                              </td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                                {user.name || '-'}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.role === 'admin' 
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                                }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                                {new Date(user.created_at).toLocaleDateString('nl-NL')}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2 text-xs">
                                  {userActivity && (
                                    <>
                                      <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded">
                                        🔍 {userActivity.search_count}
                                      </span>
                                      <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded">
                                        🔑 {userActivity.login_count}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 