import { useState, useEffect } from 'react';
import { Download, Trash2, Calendar, Hash, FileText } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ApiAuthService as AuthService } from '@/lib/api-auth';

export default function MijnOpgeslagenPage() {
  const [savedResults, setSavedResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated, addNotification, token } = useAppStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      loadSavedResults();
    }
  }, [isAuthenticated, user]);

  const loadSavedResults = async () => {
    try {
      const results = await AuthService.getSavedSearchResults(token!);
      setSavedResults(results);
    } catch (error) {
      console.error('Error loading saved results:', error);
      addNotification({
        type: 'error',
        title: 'Fout bij laden',
        message: 'Kon opgeslagen resultaten niet laden.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (result: any) => {
    // Format kentekens in rows of 20, separated by "; "
    const kentekens = result.kentekens;
    const rows: string[] = [];
    
    for (let i = 0; i < kentekens.length; i += 20) {
      const row = kentekens.slice(i, i + 20).join('; ');
      rows.push(row);
    }
    
    const content = rows.join('\n');
    const filename = `${result.name.replace(/[^a-zA-Z0-9]/g, '_')}_kentekens.txt`;
    
    // Create and download file
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
      await AuthService.deleteSavedSearchResult(token!, resultId);
      setSavedResults(prev => prev.filter(r => r.id !== resultId));
      
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
          Je moet ingelogd zijn om je opgeslagen zoekresultaten te bekijken.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
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
            <FileText className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Mijn Opgeslagen Zoekresultaten
        </h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
          Beheer en download je opgeslagen kenteken lijsten
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
          📋 Download Formaat
        </h2>
        <p className="text-blue-700 dark:text-blue-300">
          Kentekens worden gedownload als tekstbestand met maximaal 20 kentekens per regel, 
          gescheiden door "; " (puntkomma en spatie). Perfect voor verder gebruik in andere systemen.
        </p>
        <p className="text-blue-600 dark:text-blue-400 text-sm mt-2">
          Voorbeeld: <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">AB123C; CD456E; FG789H; ...</code>
        </p>
      </div>

      {/* Results */}
      {savedResults.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Nog geen opgeslagen zoekresultaten
          </h3>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Ga naar de zoekpagina en sla je resultaten op om ze hier terug te vinden.
          </p>
          <a
            href="/zoek"
            className="btn btn-primary"
          >
            Start met zoeken
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {savedResults.map((result) => (
            <div
              key={result.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                    {result.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Hash className="w-4 h-4" />
                      {result.kenteken_count} kentekens
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(result.created_at).toLocaleDateString('nl-NL')}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(result.id)}
                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Verwijderen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Search Info */}
              {result.search_query && (
                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    <strong>Zoekopdracht:</strong> {result.search_query}
                  </p>
                  {Object.keys(result.search_filters || {}).length > 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Met {Object.keys(result.search_filters).length} filter(s)
                    </p>
                  )}
                </div>
              )}

              {/* Preview */}
              <div className="mb-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Eerste kentekens:
                </p>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                  <code className="text-sm text-slate-800 dark:text-slate-200">
                    {result.kentekens.slice(0, 6).join('; ')}
                    {result.kentekens.length > 6 && '...'}
                  </code>
                </div>
              </div>



              {/* Actions */}
              <button
                onClick={() => handleDownload(result)}
                className="btn btn-primary w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Tekstbestand
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 