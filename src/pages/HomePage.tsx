import { Link } from 'react-router-dom';
import { Weight, Search, Car, CheckCircle, Download } from 'lucide-react';

const features = [
  {
    name: 'Trekgewicht Check',
    description: 'Controleer snel of uw voertuig een bepaald aanhangergewicht mag trekken met officiële RDW gegevens',
    icon: Weight,
    href: '/trekgewicht',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
  },
  {
    name: 'Kenteken Zoeken',
    description: 'Zoek voertuigen met wildcards zoals A123** of **45AB. Geen streepjes nodig! Je kunt meerdere ** gebruiken waar je wilt.',
    icon: Search,
    href: '/zoek',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
  },
];

const stats = [
  { name: 'Voertuigen in database', value: '13M+' },
  { name: 'Dagelijkse updates', value: '24/7' },
  { name: 'API response tijd', value: '<500ms' },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full">
            <Car className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl lg:text-6xl">
          RDW Voertuig Informatie
        </h1>
        <p className="mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-slate-600 dark:text-slate-300 max-w-2xl mx-auto px-4">
          Krijg instant toegang tot officiële RDW data. Check trekgewicht, zoek kentekens met wildcards (A123**, **45AB, zonder streepjes!), 
          controleer milieuzones en veel meer - allemaal in één moderne, snelle app.
        </p>
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 px-4">
          <Link
            to="/trekgewicht"
            className="btn btn-primary px-6 py-3 w-full sm:w-auto text-center"
          >
            🏋️ Trekgewicht Checken
          </Link>
          <Link
            to="/zoek"
            className="btn btn-primary px-6 py-3 w-full sm:w-auto text-center"
          >
            🔍 Kenteken Zoeken
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-4xl">
            Alles wat je nodig hebt
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            Professionele tools voor voertuiginformatie, gebouwd op officiële RDW data
          </p>
        </div>
        
        <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 max-w-4xl mx-auto">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.name}
                to={feature.href}
                className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 hover:scale-105 touch-manipulation"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${feature.bgColor} mb-4 sm:mb-6`}>
                  <Icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3">
                  {feature.name}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  {feature.description}
                </p>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary-600 rounded-full" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 mx-4 sm:mx-0">
        <div className="text-center mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Betrouwbare Data
          </h3>
          <p className="text-slate-600 dark:text-slate-300 mt-2 text-sm sm:text-base">
            Direct van de RDW, altijd up-to-date
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.name} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                {stat.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 px-4 sm:px-0">
        <div className="bg-success-50 dark:bg-success-900/20 rounded-xl p-4 sm:p-6 border border-success-200 dark:border-success-800">
          <div className="flex items-center mb-3 sm:mb-4">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-success-600 mr-3" />
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
              Officiële RDW Data
            </h3>
          </div>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
            Alle informatie komt rechtstreeks van de officiële RDW database via hun open data API. 
            Geen tussenpartijen, altijd de meest actuele gegevens.
          </p>
        </div>

        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 sm:p-6 border border-primary-200 dark:border-primary-800">
          <div className="flex items-center mb-3 sm:mb-4">
            <Download className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 mr-3" />
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
              Export Mogelijkheden
            </h3>
          </div>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
            Download voertuiggegevens als PDF, exporteer zoekresultaten naar CSV, 
            of voeg APK-vervaldatums toe aan je agenda.
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 sm:p-12 text-white mx-4 sm:mx-0">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
          Klaar om te beginnen?
        </h2>
        <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-primary-100">
          Check je trekgewicht of zoek kentekens met flexibele wildcards (geen streepjes nodig) - kies jouw tool!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link
            to="/trekgewicht"
            className="bg-white text-primary-600 px-6 sm:px-8 py-3 rounded-md font-semibold hover:bg-slate-50 transition-colors text-center"
          >
            🏋️ Start met Trekgewicht Check
          </Link>
          <Link
            to="/zoek"
            className="bg-white text-primary-600 px-6 sm:px-8 py-3 rounded-md font-semibold hover:bg-slate-50 transition-colors text-center"
          >
            🔍 Zoek een Kenteken
          </Link>
        </div>
      </div>
    </div>
  );
} 