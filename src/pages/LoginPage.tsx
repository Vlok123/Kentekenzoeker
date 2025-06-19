import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { MockAuthService as AuthService } from '@/lib/auth-mock';
import type { LoginCredentials, RegisterData } from '@/types/auth';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setToken, addNotification } = useAppStore();
  
  // Get the redirect path from location state, default to home
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login
        const credentials: LoginCredentials = {
          email: formData.email,
          password: formData.password
        };

        const response = await AuthService.login(credentials);
        setUser(response.user);
        setToken(response.token);
        
        addNotification({
          type: 'success',
          title: 'Ingelogd',
          message: `Welkom terug, ${response.user.name || response.user.email}!`
        });

        navigate(from, { replace: true });
      } else {
        // Register
        if (formData.password !== formData.confirmPassword) {
          addNotification({
            type: 'error',
            title: 'Wachtwoorden komen niet overeen',
            message: 'Controleer je wachtwoord en probeer opnieuw.'
          });
          return;
        }

        if (formData.password.length < 6) {
          addNotification({
            type: 'error',
            title: 'Wachtwoord te kort',
            message: 'Je wachtwoord moet minimaal 6 karakters lang zijn.'
          });
          return;
        }

        const registerData: RegisterData = {
          email: formData.email,
          password: formData.password,
          name: formData.name
        };

        const response = await AuthService.register(registerData);
        setUser(response.user);
        setToken(response.token);
        
        addNotification({
          type: 'success',
          title: 'Account aangemaakt',
          message: `Welkom bij RDW App, ${response.user.name || response.user.email}!`
        });

        navigate(from, { replace: true });
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: isLogin ? 'Inloggen mislukt' : 'Registreren mislukt',
        message: error.message || 'Er is iets misgegaan. Probeer het opnieuw.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">R</span>
            </div>
            <span className="font-semibold">RDW App</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isLogin ? 'Inloggen' : 'Account aanmaken'}
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            {isLogin 
              ? 'Log in om je kentekens en zoekopdrachten op te slaan' 
              : 'Maak een account aan om aan de slag te gaan'
            }
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field (only for registration) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Naam (optioneel)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Je naam"
                    className="input pl-10"
                  />
                </div>
              </div>
            )}

            {/* Email field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email adres
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="je@email.com"
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Wachtwoord
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder={isLogin ? 'Je wachtwoord' : 'Minimaal 6 karakters'}
                  className="input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password field (only for registration) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Wachtwoord bevestigen
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    placeholder="Herhaal je wachtwoord"
                    className="input pl-10"
                  />
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {isLogin ? 'Inloggen' : 'Account aanmaken'}
                </>
              )}
            </button>
          </form>

          {/* Toggle between login and register */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData({ email: '', password: '', name: '', confirmPassword: '' });
              }}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {isLogin 
                ? 'Nog geen account? Maak er een aan' 
                : 'Al een account? Log in'
              }
            </button>
          </div>

          {/* Admin info */}
          {isLogin && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Admin toegang:</strong><br />
                Email: sanderhelmink@gmail.com<br />
                Wachtwoord: admin123!
              </p>
            </div>
          )}
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          >
            ← Terug naar homepage
          </Link>
        </div>
      </div>
    </div>
  );
} 