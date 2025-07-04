import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ApiAuthService as AuthService } from '@/lib/api-auth';
import type { LoginCredentials, RegisterData } from '@/types/auth';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
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

  // Clear error when switching between login/register
  useEffect(() => {
    setError('');
  }, [isLogin]);

  // Clear error when user starts typing
  useEffect(() => {
    if (error) {
      setError('');
    }
  }, [formData.email, formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login
        const credentials: LoginCredentials = {
          email: formData.email,
          password: formData.password
        };

        console.log('=== LOGIN ATTEMPT ===');
        console.log('Email:', credentials.email);
        console.log('Password length:', credentials.password.length);
        
        const response = await AuthService.login(credentials);
        
        console.log('Login response:', response);
        console.log('Token received:', response.token);
        console.log('Token length:', response.token?.length);
        console.log('User received:', response.user);
        
        setUser(response.user);
        setToken(response.token);
        
        // Verify storage
        setTimeout(() => {
          console.log('After setting - Token in store:', useAppStore.getState().token);
          console.log('After setting - User in store:', useAppStore.getState().user);
          console.log('localStorage rdw-app-storage:', localStorage.getItem('rdw-app-storage'));
        }, 100);
        
        addNotification({
          type: 'success',
          title: 'Ingelogd',
          message: `Welkom terug, ${response.user.name || response.user.email}!`
        });

        navigate(from, { replace: true });
      } else {
        // Register
        if (formData.password !== formData.confirmPassword) {
          setError('Wachtwoorden komen niet overeen');
          return;
        }

        if (formData.password.length < 6) {
          setError('Je wachtwoord moet minimaal 6 karakters lang zijn');
          return;
        }

        const registerData: RegisterData = {
          email: formData.email,
          password: formData.password,
          name: formData.name
        };

        const response = await AuthService.register(registerData);
        
        addNotification({
          type: 'success',
          title: 'Account aangemaakt',
          message: response.message
        });

        // Switch to login form after successful registration
        setIsLogin(true);
        setFormData({
          email: formData.email,
          password: '',
          name: '',
          confirmPassword: ''
        });
      }
    } catch (error: any) {
      // Set specific error message based on the error
      if (error.message.includes('Gebruiker niet gevonden')) {
        setError('Dit email adres is niet bekend. Controleer je email of maak een nieuw account aan.');
      } else if (error.message.includes('Ongeldig wachtwoord')) {
        setError('Het wachtwoord is incorrect. Controleer je wachtwoord en probeer opnieuw.');
      } else if (error.message.includes('Gebruiker bestaat al')) {
        setError('Er bestaat al een account met dit email adres. Probeer in te loggen.');
      } else {
        setError(error.message || 'Er is iets misgegaan. Probeer het opnieuw.');
      }
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
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
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
                    autoComplete="name"
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
                  autoComplete={isLogin ? "email" : "email"}
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
                  autoComplete={isLogin ? "current-password" : "new-password"}
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
                    placeholder="Bevestig je wachtwoord"
                    autoComplete="new-password"
                    className="input pl-10"
                  />
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isLogin ? 'Inloggen...' : 'Account aanmaken...'}
                </>
              ) : (
                <>
                  {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {isLogin ? 'Inloggen' : 'Account aanmaken'}
                </>
              )}
            </button>
          </form>

          {/* Forgot password link (only show for login) */}
          {isLogin && (
            <div className="mt-4 text-center">
              <Link 
                to="/forgot-password" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Wachtwoord vergeten?
              </Link>
            </div>
          )}

          {/* Toggle between login and register */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData({ email: '', password: '', name: '', confirmPassword: '' });
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {isLogin 
                ? 'Nog geen account? Maak er een aan' 
                : 'Al een account? Log in'
              }
            </button>
          </div>


        </div>
      </div>
    </div>
  );
} 