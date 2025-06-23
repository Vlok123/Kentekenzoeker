import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { ApiAuthService as AuthService } from '@/lib/api-auth';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Geen verificatie token gevonden');
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await AuthService.verifyEmail(token!);
      setStatus('success');
      setMessage(response.message);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Er is iets misgegaan tijdens het verifiëren van je email');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
            <div className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-sm border border-slate-200/50">
              <img 
                src="/logo.png" 
                alt="CarIntel Logo" 
                className="h-6 w-auto object-contain mix-blend-multiply"
                style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))' }}
              />
            </div>
            <span className="font-semibold">CarIntel</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Email Verificatie
          </h1>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Email verifiëren...
                </h2>
                <p className="text-slate-600 dark:text-slate-300">
                  Even geduld terwijl we je email adres verifiëren.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Email geverifieerd!
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  {message}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Je wordt automatisch doorgestuurd naar de inlogpagina...
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Verificatie mislukt
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  {message}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link 
                    to="/login" 
                    className="btn btn-primary flex-1"
                  >
                    Naar inlogpagina
                  </Link>
                  <Link 
                    to="/resend-verification" 
                    className="btn btn-secondary flex-1"
                  >
                    Nieuwe email aanvragen
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Problemen met de verificatie?{' '}
            <Link to="/contact" className="text-blue-600 hover:text-blue-700 font-medium">
              Neem contact op
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 