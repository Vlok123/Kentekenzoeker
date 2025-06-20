import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock } from 'lucide-react';
import { ApiAuthService } from '@/lib/api-auth';
import { useAppStore } from '@/store/useAppStore';

export default function SetupPage() {
  const [email] = useState('sanderhelmink@gmail.com');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const { setUser, setToken } = useAppStore();

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== 'Admin123') {
      setError('Incorrect setup password. Use Admin123');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // First try to register
      try {
        const response = await ApiAuthService.register({
          email,
          password,
          name: 'Sander Helmink'
        });
        
        setUser(response.user);
        setToken(response.token);
        setSuccess(true);
        
        // Note: User will have 'user' role, needs to be changed to 'admin' in database
        setTimeout(() => {
          navigate('/admin');
        }, 2000);
        
      } catch (registerError: any) {
        // If user already exists, try to login
        if (registerError.message.includes('bestaat al')) {
          const response = await ApiAuthService.login({ email, password });
          setUser(response.user);
          setToken(response.token);
          setSuccess(true);
          
          setTimeout(() => {
            navigate('/admin');
          }, 2000);
        } else {
          throw registerError;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Account Created!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Note: You need to manually update the role to 'admin' in the database.
          </p>
          <p className="text-sm text-slate-500">Redirecting to admin page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Admin Setup
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Create admin account for sanderhelmink@gmail.com
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="input opacity-60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password (use: Admin123)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter Admin123"
                  className="input pl-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary"
            >
              {isLoading ? 'Creating...' : 'Create Admin Account'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> After creating the account, you need to manually update the database to set role = 'admin' for this user.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 