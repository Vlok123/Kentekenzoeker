import { useState, useEffect } from 'react';
import { User, FileText, Download, Trash2, Hash, Settings, Eye, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { MockAuthService as AuthService } from '@/lib/auth-mock';

export default function DashboardPage() {
  const [savedResults, setSavedResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSavedResults: 0,
    totalKentekens: 0,
    totalSearches: 0,
    favoriteKentekens: 0
  });
  
  const { user, isAuthenticated, addNotification, favorites } = useAppStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserData();
    }
  }, [isAuthenticated, user]);

  const loadUserData = async () => {
    try {
      const results = await AuthService.getSavedSearchResults(user!.id);
      setSavedResults(results);
      
      // Calculate stats
      const totalKentekens = results.reduce((sum: number, result: any) => sum + result.kenteken_count, 0);
      setStats({
        totalSavedResults: results.length,
        totalKentekens,
        totalSearches: results.length, // For now, same as saved results
        favoriteKentekens: favorites.length
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (result: any) => {
    // Same download logic as in MijnOpgeslagenPage
    const kentekens = result.kentekens;
    const rows: string[] = [];
    
    for (let i = 0; i < kentekens.length; i += 20) {
      const row = kentekens.slice(i, i + 20).join('; ');
      rows.push(row);
    }
    
    const content = rows.join('\n');
    const filename = `${result.name.replace(/[^a-zA-Z0-9]/g, '_')}_kentekens.txt`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addNotification({
      type: 'success',
      title: 'Download gestart',
      message: `${kentekens.length} kentekens gedownload als ${filename}`
    });
  };

  const handleDelete = async (resultId: string) => {
    if (!confirm('Weet je zeker dat je deze opgeslagen zoekresultaten wilt verwijderen?')) {
      return;
    }

    try {
      await AuthService.deleteSavedSearchResult(user!.id, resultId);
      setSavedResults(prev => prev.filter(r => r.id !== resultId));
      
      // Update stats
      const deletedResult = savedResults.find(r => r.id === resultId);
      if (deletedResult) {
        setStats(prev => ({
          ...prev,
          totalSavedResults: prev.totalSavedResults - 1,
          totalKentekens: prev.totalKentekens - deletedResult.kenteken_count,
          totalSearches: prev.totalSearches - 1
        }));
      }
      
      addNotification({
        type: 'success',
        title: 'Verwijderd',
        message: 'De opgeslagen zoekresultaten zijn verwijderd.'
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Verwijderen mislukt',
        message: error.message || 'Er is iets misgegaan bij het verwijderen.'
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Inloggen vereist
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Je moet ingelogd zijn om je dashboard te bekijken.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full">
            <User className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Mijn Dashboard
        </h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
          Welkom terug, {user?.name || user?.email.split('@')[0]}!
        </p>
      </div>

      {/* User Info Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Account Informatie
          </h2>
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <span className="inline-flex px-3 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                Administrator
              </span>
            )}
            <span className="inline-flex px-3 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
              Actief
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Email</p>
            <p className="text-slate-900 dark:text-white font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Naam</p>
            <p className="text-slate-900 dark:text-white font-medium">{user?.name || 'Niet ingesteld'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Lid sinds</p>
            <p className="text-slate-900 dark:text-white font-medium">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('nl-NL') : 'Onbekend'}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Account type</p>
            <p className="text-slate-900 dark:text-white font-medium capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Opgeslagen Sets</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalSavedResults}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Totaal Kentekens</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalKentekens}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg">
              <Hash className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Favorieten</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.favoriteKentekens}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Zoekopdrachten</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalSearches}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Snelle Acties
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/zoek"
            className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">Kentekens Zoeken</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">Start een nieuwe zoekopdracht</p>
            </div>
          </Link>

          <Link
            to="/mijn-opgeslagen"
            className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg mr-3">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">Opgeslagen Bekijken</p>
              <p className="text-sm text-green-700 dark:text-green-300">Beheer je opgeslagen lijsten</p>
            </div>
          </Link>

          <Link
            to="/trekgewicht"
            className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg mr-3">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-purple-900 dark:text-purple-100">Trekgewicht Check</p>
              <p className="text-sm text-purple-700 dark:text-purple-300">Controleer trekgewicht</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Saved Results */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Recente Opgeslagen Resultaten
          </h2>
          <Link
            to="/mijn-opgeslagen"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Alle bekijken →
          </Link>
        </div>

        {savedResults.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Nog geen opgeslagen resultaten
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Begin met zoeken en sla je resultaten op
            </p>
            <Link
              to="/zoek"
              className="btn btn-primary"
            >
              Start met zoeken
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {savedResults.slice(0, 3).map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg">
                    <FileText className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      {result.name}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                      <span>{result.kenteken_count} kentekens</span>
                      <span>{new Date(result.created_at).toLocaleDateString('nl-NL')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownload(result)}
                    className="p-2 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(result.id)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Verwijderen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {savedResults.length > 3 && (
              <div className="text-center pt-2">
                <Link
                  to="/mijn-opgeslagen"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Bekijk alle {savedResults.length} opgeslagen resultaten →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 