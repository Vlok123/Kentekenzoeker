import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Car, Moon, Sun, Menu, X, User, LogOut, Settings, Bookmark } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import NotificationProvider from './NotificationProvider';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, addNotification } = useAppStore();

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    logout();
    addNotification({
      type: 'success',
      title: 'Uitgelogd',
      message: 'Je bent succesvol uitgelogd.'
    });
    setUserMenuOpen(false);
    navigate('/');
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Trekgewicht', href: '/trekgewicht' },
    { name: 'Zoeken', href: '/zoek' },
  ];

  // Add admin nav for admin users
  if (user?.role === 'admin') {
    navigation.push({ name: 'Admin', href: '/admin' });
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <NotificationProvider />
      
      {/* Navigation */}
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and brand */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  RDW App
                </span>
              </Link>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:flex md:items-center md:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? 'text-primary-600 bg-primary-50 dark:bg-primary-900 dark:text-primary-400'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right side buttons */}
            <div className="flex items-center space-x-2">
              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Authentication */}
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span className="hidden sm:block text-sm font-medium">
                      {user.name || user.email.split('@')[0]}
                    </span>
                  </button>

                  {/* User dropdown menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
                      <div className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                        <p className="font-medium">{user.name || 'Gebruiker'}</p>
                        <p className="text-xs">{user.email}</p>
                        {user.role === 'admin' && (
                          <span className="inline-flex mt-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                      
                      <Link
                        to="/mijn-opgeslagen"
                        className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Bookmark className="w-4 h-4 mr-2" />
                        Mijn opgeslagen
                      </Link>

                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Admin Dashboard
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Uitloggen
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="btn btn-primary"
                >
                  Inloggen
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Open menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile navigation menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200 dark:border-slate-700 py-2">
              <div className="space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      location.pathname === item.href
                        ? 'text-primary-600 bg-primary-50 dark:bg-primary-900 dark:text-primary-400'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main content */}
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Click outside to close dropdown */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </div>
  );
} 