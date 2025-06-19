import { useState, useEffect } from 'react';
import { Users, Search, Car, Database, Settings, Shield } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ApiAuthService } from '@/lib/api-auth';

interface AdminStats {
  totalUsers: number;
  totalSavedSearches: number;
  totalSavedVehicles: number;
  recentUsers: any[];
}

// Function to fetch real admin statistics
async function fetchAdminStats(token: string): Promise<AdminStats> {
  return await ApiAuthService.getAdminStats(token);
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalSavedSearches: 0,
    totalSavedVehicles: 0,
    recentUsers: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user, token } = useAppStore();

  useEffect(() => {
    async function loadStats() {
      if (!token || !user || user.role !== 'admin') {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const adminStats = await fetchAdminStats(token);
        setStats(adminStats);
      } catch (error) {
        console.error('Failed to load admin stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, [token, user]);

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
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full">
            <Settings className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
          Beheer gebruikers en bekijk systeemstatistieken (Demo versie)
        </p>
      </div>

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
                Live
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Recente gebruikers
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
              {stats.recentUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 dark:border-slate-700">
                  <td className="py-3 px-4 text-slate-900 dark:text-white">
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
                      {user.role}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Notice */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6">
        <h2 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
          ✅ Live Database
        </h2>
        <p className="text-green-700 dark:text-green-300">
          Het admin dashboard is nu live verbonden met de Neon PostgreSQL database. 
          Alle statistieken en gebruikersgegevens worden real-time opgehaald.
        </p>
      </div>

      {/* System Info */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Systeem informatie
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-slate-900 dark:text-white mb-2">Database</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Live: PostgreSQL (Neon)<br />
              SSL: Ingeschakeld<br />
              Real-time data
            </p>
          </div>
          <div>
            <h3 className="font-medium text-slate-900 dark:text-white mb-2">Authenticatie</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Live: Echte JWT + bcrypt<br />
              Database authenticatie<br />
              Sessie: 7 dagen
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 