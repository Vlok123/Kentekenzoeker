import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Zap, Car, ArrowRight, ChevronDown, TrendingUp, Shield, Clock, Database } from 'lucide-react';
import { normalizeLicensePlate } from '@/utils/licensePlate';

export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const normalized = normalizeLicensePlate(searchQuery.trim());
      navigate(`/voertuig/${normalized}`);
    }
  };

  const navigateToTrekgewicht = () => {
    navigate('/trekgewicht');
  };

  const navigateToZoek = () => {
    navigate('/zoek');
  };

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 opacity-20 dark:opacity-30"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 40%)`,
          }}
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23000000%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] dark:bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse" />
      </div>

      {/* Hero Section */}
      <div ref={heroRef} className="relative min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 z-10">
        <div 
          className="text-center max-w-6xl mx-auto"
          style={{
            transform: `translateY(${Math.min(scrollY * 0.3, 100)}px)`,
          }}
        >
          {/* Main Title */}
          <div className="mb-8 sm:mb-12">
            <h1 className="text-6xl sm:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-blue-600 to-blue-800 dark:from-white dark:via-blue-200 dark:to-purple-200 leading-none tracking-tighter mb-4">
              RDW
            </h1>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-slate-700 dark:text-white/90 leading-tight">
              Nederlandse Voertuig
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-purple-400">
                Intelligence
              </span>
            </h2>
          </div>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-600 dark:text-white/70 max-w-2xl mx-auto mb-8 leading-relaxed">
            Ontdek alles over elk Nederlands voertuig met real-time RDW data 
            en een moderne, gebruiksvriendelijke ervaring.
          </p>

          {/* Beta Notice */}
          <div className="max-w-lg mx-auto mb-12">
            <div className="glass-card p-4 border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20">
              <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center justify-center gap-2">
                <span className="text-lg">🚧</span>
                <span><strong>Beta versie</strong> - Dagelijks nieuwe functies en verbeteringen</span>
              </p>
            </div>
          </div>

          {/* Search Section */}
          <div className="mb-16">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div 
                className={`relative group transition-all duration-500 ${
                  isSearchFocused ? 'scale-105' : 'scale-100'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                <div className="relative glass-card p-6 sm:p-8">
                  <div className="flex items-center space-x-4">
                    <Search className="h-6 w-6 text-slate-500 dark:text-white/60 flex-shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      placeholder="Voer kenteken in (bijv. 12-ABC-3)"
                      className="flex-1 bg-transparent text-slate-900 dark:text-white text-lg sm:text-xl placeholder-slate-500 dark:placeholder-white/50 border-none outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!searchQuery.trim()}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center space-x-2 shadow-lg shadow-blue-500/25"
                    >
                      <span>Zoek</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Trekgewicht Card */}
            <div 
              onClick={navigateToTrekgewicht}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-3xl glass-card p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 dark:from-orange-500/10 dark:to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-2xl shadow-lg">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                    <ArrowRight className="h-6 w-6 text-slate-400 dark:text-white/60 group-hover:text-slate-600 dark:group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                    Trekgewicht Check
                  </h3>
                  <p className="text-slate-600 dark:text-white/70 leading-relaxed">
                    Controleer of je voertuig veilig kan trekken wat je wilt. 
                    Instant resultaat met officiële RDW data.
                  </p>
                </div>
              </div>
            </div>

            {/* Advanced Search Card */}
            <div 
              onClick={navigateToZoek}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-3xl glass-card p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 dark:from-blue-500/10 dark:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg">
                      <Car className="h-8 w-8 text-white" />
                    </div>
                    <ArrowRight className="h-6 w-6 text-slate-400 dark:text-white/60 group-hover:text-slate-600 dark:group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                    Geavanceerd Zoeken
                  </h3>
                  <p className="text-slate-600 dark:text-white/70 leading-relaxed">
                    Zoek voertuigen op merk, model, bouwjaar en meer. 
                    Krachtige filters en bulk export.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-20">
          <ChevronDown className="h-8 w-8 text-slate-400 dark:text-white/50" />
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative py-16 px-4 sm:px-6 lg:px-8 z-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "15M+", label: "Voertuigen", icon: Database },
              { number: "100%", label: "RDW Data", icon: Shield },
              { number: "24/7", label: "Beschikbaar", icon: Clock },
              { number: "0.1s", label: "Zoektijd", icon: TrendingUp }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="group">
                  <div className="flex justify-center mb-4">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-blue-600 dark:from-white dark:to-blue-200 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-slate-600 dark:text-white/70 font-medium">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 