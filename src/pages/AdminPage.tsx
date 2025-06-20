import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, HardDrive, RefreshCw, AlertCircle, LogOut, Info, Search } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ApiAuthService } from '@/lib/api-auth';

interface AdminStats {
  totalUsers: number;
  totalSavedSearches: number;
  totalSavedVehicles: number;
  totalSearchCount: number;
  searchesByUser: Array<{
    email: string;
    name: string;
    search_count: number;
  }>;
  recentUsers: any[];
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalSavedSearches: 0,
    totalSavedVehicles: 0,
    totalSearchCount: 0,
    searchesByUser: [],
    recentUsers: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
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

      {/* Debug Panel */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Info className="w-5 h-5" />
            Debug Informatie
          </h2>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Gebruiker Status</h3>
              <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                <li>Email: {debugInfo.user?.email || 'Onbekend'}</li>
                <li>Rol: {debugInfo.user?.role || 'Onbekend'}</li>
                <li>Ingelogd: {debugInfo.isAuthenticated ? 'Ja' : 'Nee'}</li>
                <li>Timestamp: {debugInfo.timestamp}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Token Status</h3>
              <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                <li>Token bestaat: {debugInfo.tokenExists ? 'Ja' : 'Nee'}</li>
                <li>Token lengte: {debugInfo.tokenLength}</li>
                <li>Status: {debugInfo.tokenStatus || 'Nog niet gecontroleerd'}</li>
                <li>Verloopt: {debugInfo.expiresAt || 'Onbekend'}</li>
                <li>Verificatie: {debugInfo.verificationStatus || 'Nog niet gedaan'}</li>
              </ul>
            </div>
            <div className="md:col-span-2 border-t border-slate-200 dark:border-slate-700 pt-4">
              <h3 className="font-semibold mb-2">Zoek Statistieken Debug</h3>
              <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-sm">
                <li>Totaal zoekopdrachten: {stats.totalSearchCount}</li>
                <li>Gebruikers met zoekopdrachten: {stats.searchesByUser?.length || 0}</li>
                <li>Top zoeker: {stats.searchesByUser?.[0]?.email || 'Geen data'} ({stats.searchesByUser?.[0]?.search_count || 0} zoekopdrachten)</li>
              </ul>
            </div>
            {debugInfo.lastError && (
              <div className="md:col-span-2">
                <h3 className="font-semibold mb-2 text-red-600">Laatste Fout</h3>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded text-red-700 dark:text-red-300">
                  <p className="font-medium">{debugInfo.lastError}</p>
                  <p className="text-sm mt-1">Tijd: {debugInfo.lastErrorTime}</p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={clearLocalStorage} className="btn btn-sm btn-secondary">
              Wis LocalStorage
            </button>
            <button onClick={() => window.location.reload()} className="btn btn-sm btn-secondary">
              Herlaad Pagina
            </button>
          </div>
        </div>
      </div>

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

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-slate-600 dark:text-slate-400">Admin data laden...</p>
        </div>
      )}

      {/* Stats Cards */}
      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
                    <p className="text-sm text-slate-600 dark:text-slate-400">Totaal Zoekopdrachten</p>
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
              <h2 className="text-xl font-semibold">Zoekstatistieken per Gebruiker</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Overzicht van hoeveel zoekopdrachten elke gebruiker heeft uitgevoerd
              </p>
            </div>
            <div className="card-content">
              {stats.searchesByUser.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                  Nog geen zoekstatistieken beschikbaar
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                          Email
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                          Naam
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                          Aantal Zoekopdrachten
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                          Percentage van Totaal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.searchesByUser.map((user, index) => (
                        <tr key={index} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="py-3 px-3 text-slate-900 dark:text-white">
                            {user.email}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            {user.name || '-'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {user.search_count}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
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

          {/* Users List */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Recente Gebruikers</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Overzicht van de {stats.recentUsers.length} meest recente gebruikers
              </p>
            </div>
            <div className="card-content">
              {stats.recentUsers.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                  Geen gebruikers gevonden
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                          Email
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                          Naam
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                          Rol
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                          Aangemaakt
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentUsers.map((user) => (
                        <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="py-3 px-3 text-slate-900 dark:text-white">
                            {user.email}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            {user.name || '-'}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin' 
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            {new Date(user.created_at).toLocaleDateString('nl-NL')}
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
    </div>
  );
} 