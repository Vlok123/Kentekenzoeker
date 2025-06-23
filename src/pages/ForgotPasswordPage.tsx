import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { ApiAuthService as AuthService } from '@/lib/api-auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Voer je email adres in');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Voer een geldig email adres in');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await AuthService.requestPasswordReset(email);
      setSuccess(response.message);
    } catch (error: any) {
      setError(error.message || 'Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
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
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Email verstuurd!
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                {success}
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Tip:</strong> Controleer ook je spam/ongewenste email map als je de email niet ziet.
                </p>
              </div>
              <Link 
                to="/login" 
                className="btn btn-primary w-full"
              >
                Terug naar inloggen
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Wachtwoord vergeten
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Geen probleem! Voer je email in en we sturen je een reset link.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email adres
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="je@email.com"
                  required
                  autoComplete="email"
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Reset link versturen...
                </>
              ) : (
                'Reset link versturen'
              )}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Je ontvangt binnen enkele minuten een email met instructies om je wachtwoord te resetten. 
              De link is 1 uur geldig.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug naar inloggen
          </Link>
        </div>
      </div>
    </div>
  );
} 