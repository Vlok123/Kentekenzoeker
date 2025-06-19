import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Car, ArrowRight, ChevronDown, Search, Target, BarChart3 } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

export default function HomePage() {
  const navigate = useNavigate();
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

  const navigateToTrekgewicht = () => {
    navigate('/trekgewicht');
  };

  const navigateToZoek = () => {
    navigate('/zoek');
  };

  return (
    <>
      <SEOHead 
        title="RDW Intelligence - Nederlandse Voertuig Informatie | Kenteken Opzoeken & Trekgewicht Check"
        description="Zoek alle Nederlandse voertuigen op kenteken, controleer trekgewicht en bekijk complete RDW data. 15+ miljoen voertuigen, 100% officiële RDW informatie, gratis en actueel."
        keywords="RDW, kenteken opzoeken, voertuig informatie, trekgewicht check, APK, Nederlandse voertuigen, auto gegevens, kenteken check, voertuig historie, RDW data"
        canonicalUrl="https://rdw-intelligence.vercel.app/"
      />
      
      <div className="min-h-screen gradient-bg relative overflow-hidden">
        {/* Animated Background - Fixed z-index */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 opacity-20 dark:opacity-30"
            style={{
              background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 40%)`,
            }}
          />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23000000%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] dark:bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse" />
        </div>

        {/* Hero Section with proper spacing */}
        <div ref={heroRef} className="relative min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 z-10 pb-24">
          <div 
            className="text-center max-w-6xl mx-auto"
            style={{
              transform: `translateY(${Math.min(scrollY * 0.2, 50)}px)`,
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

            {/* How it Works Section */}
            <div className="mb-16 max-w-4xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
                Hoe werkt RDW Intelligence?
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Search Explanation */}
                <div className="glass-card p-6 text-center">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl w-fit mx-auto mb-4">
                    <Search className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                    Zoeken
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    Zoek voertuigen op kenteken, merk, model of andere criteria. 
                    Krijg direct toegang tot alle RDW gegevens inclusief APK, 
                    technische specs en historie.
                  </p>
                </div>

                {/* Towing Explanation */}
                <div className="glass-card p-6 text-center">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-xl w-fit mx-auto mb-4">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                    Trekgewicht Check
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    Controleer of je voertuig veilig kan trekken wat je wilt. 
                    Voer het kenteken en gewicht in voor een instant veiligheidscheck 
                    gebaseerd op officiële RDW data.
                  </p>
                </div>

                {/* Future Features */}
                <div className="glass-card p-6 text-center">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-xl w-fit mx-auto mb-4">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                    Binnenkort
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    Kentekenvergelijkers, waardebepalingen, onderhoudshistorie 
                    en nog veel meer functies komen binnenkort beschikbaar. 
                    De site is volop in ontwikkeling!
                  </p>
                </div>
              </div>
            </div>

            {/* Action Cards with proper z-index */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto relative z-20">
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
                      Klik hier om de trekgewicht checker te gebruiken.
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
                      Voertuigen Zoeken
                    </h3>
                    <p className="text-slate-600 dark:text-white/70 leading-relaxed">
                      Zoek voertuigen op kenteken, merk, model, bouwjaar en meer. 
                      Klik hier om te beginnen met zoeken.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-30">
            <ChevronDown className="h-8 w-8 text-slate-400 dark:text-white/50" />
          </div>
        </div>

        {/* Stats Section - Properly positioned below hero */}
        <div className="relative py-16 px-4 sm:px-6 lg:px-8 z-30 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-slate-900/50">
          <div className="max-w-3xl mx-auto">
            <div className="glass-card p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-center">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">15M+</span>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Voertuigen</span>
                </div>
                <div className="hidden sm:block w-px h-8 bg-slate-300 dark:bg-slate-600"></div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">100%</span>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">RDW Data</span>
                </div>
                <div className="hidden sm:block w-px h-8 bg-slate-300 dark:bg-slate-600"></div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">24/7</span>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Beschikbaar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 