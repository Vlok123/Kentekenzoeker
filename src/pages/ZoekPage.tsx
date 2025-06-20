import { useState, useEffect } from 'react';
import { Search, Filter, Download, Star, Eye, Save, X, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useVehicleSearch, useVehicleBrands, useVehicleColors } from '@/hooks/useRdw';
import { useAppStore } from '@/store/useAppStore';
import { ApiAuthService as AuthService } from '@/lib/api-auth';
import { generateCsvData } from '@/utils/dataProcessing';
import Autocomplete from '@/components/Autocomplete';
import type { SearchFilters } from '@/types/rdw';

export default function ZoekPage() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showModelInfo, setShowModelInfo] = useState(false);
  
  const { 
    searchQuery, 
    searchFilters, 
    setSearchQuery, 
    setSearchFilters,
    clearSearch,
    addFavorite,
    removeFavorite,
    isFavorite,
    user,
    isAuthenticated,
    addNotification,
    token
  } = useAppStore();

  // Reset search on component mount to start fresh
  useEffect(() => {
    clearSearch();
  }, [clearSearch]);

  // Load saved search state
  useEffect(() => {
    setQuery(searchQuery);
    setFilters(searchFilters);
  }, [searchQuery, searchFilters]);

  const { data: vehicles = [], isLoading, error } = useVehicleSearch(searchQuery, searchFilters, !!searchQuery || Object.values(searchFilters).some(v => v));

  // Log search activity when results are loaded
  useEffect(() => {
    if (searchQuery && vehicles.length > 0 && isAuthenticated && token && !isLoading && !error) {
      AuthService.logSearch(token, searchQuery, searchFilters, vehicles.length);
    }
  }, [vehicles, searchQuery, searchFilters, isAuthenticated, token, isLoading, error]);
  const { data: brands = [] } = useVehicleBrands();
  const { data: colors = [] } = useVehicleColors();

  const handleInputChange = (value: string) => {
    // Remove any dashes and make uppercase - we want kentekens WITHOUT dashes
    const cleaned = value.replace(/-/g, '').toUpperCase();
    setQuery(cleaned);
  };

  const handleSearch = async () => {
    // Validate input
    if (query && !query.includes('*') && query.length < 3) {
      addNotification({
        type: 'warning',
        title: 'Onvoldoende karakters',
        message: 'Voer minstens 3 karakters in of gebruik wildcards (*)'
      });
      return;
    }
    
    setSearchQuery(query);
    setSearchFilters(filters);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchFilters({});
  };

  const handleExportCsv = () => {
    if (vehicles.length === 0) return;
    
    const csvData = generateCsvData(vehicles);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rdw-zoekresultaten-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveResults = () => {
    if (!isAuthenticated || !user) {
      addNotification({
        type: 'error',
        title: 'Inloggen vereist',
        message: 'Je moet ingelogd zijn om zoekresultaten op te slaan.'
      });
      return;
    }

    if (vehicles.length === 0) {
      addNotification({
        type: 'warning',
        title: 'Geen resultaten',
        message: 'Er zijn geen zoekresultaten om op te slaan.'
      });
      return;
    }

    setShowSaveModal(true);
    setSaveName(`Zoekresultaten ${new Date().toLocaleDateString('nl-NL')}`);
  };

  const handleConfirmSave = async () => {
    if (!saveName.trim()) {
      addNotification({
        type: 'error',
        title: 'Naam vereist',
        message: 'Geef een naam op voor je opgeslagen zoekresultaten.'
      });
      return;
    }

    setIsSaving(true);
    try {
      const kentekens = vehicles.map(v => v.kenteken);
      await AuthService.saveSearchResults(
        token!, 
        kentekens, 
        saveName.trim(),
        searchQuery,
        searchFilters
      );

      addNotification({
        type: 'success',
        title: 'Resultaten opgeslagen',
        message: `${kentekens.length} kentekens zijn opgeslagen als "${saveName.trim()}".`
      });

      setShowSaveModal(false);
      setSaveName('');
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Opslaan mislukt',
        message: error.message || 'Er is iets misgegaan bij het opslaan.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full">
            <Search className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Kenteken Zoeken
        </h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
          Zoek voertuigen met wildcards (*) en uitgebreide filters: merk, brandstof, aantal deuren, zitplaatsen en meer
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="space-y-4">
          {/* Main Search */}
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Kenteken of wildcard (bijv. S714NJ, S*J, *14*) - zonder streepjes"
                className="input w-full"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                maxLength={8}
              />
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                💡 Tip: Voer kentekens in zonder streepjes. Als je streepjes gebruikt worden ze automatisch weggehaald
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} px-4`}
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={handleSearch}
              className="btn btn-primary px-6"
              disabled={!query && Object.keys(filters).length === 0}
            >
              <Search className="w-4 h-4 mr-2" />
              Zoeken
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <Autocomplete
                    label="Merk"
                    value={filters.merk || ''}
                    onChange={(value) => setFilters(prev => ({ ...prev, merk: value || undefined }))}
                    options={brands}
                    placeholder="Type een merk"
                  />
                </div>

                <div className="relative">
                  <div className="flex items-center gap-2 mb-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Model/Variant
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onMouseEnter={() => setShowModelInfo(true)}
                        onMouseLeave={() => setShowModelInfo(false)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                      {showModelInfo && (
                        <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-lg z-50 border border-slate-600">
                          <div className="font-semibold mb-2">💡 Let op bij zoeken op modeltype:</div>
                          <p className="mb-2">
                            Soms wijkt de typebenaming in de RDW-data af van wat je gewend bent. 
                            Zo heet een BMW 3-serie bijvoorbeeld <strong>"3ER"</strong> en een Golf Variant <strong>"GOLF VII VARIANT"</strong>.
                          </p>
                          <p className="text-slate-300">
                            Kun je een kenteken niet vinden? Zoek dan op een vergelijkbaar type voertuig om te zien hoe het model in de database benoemd wordt. 
                            Dat helpt bij het juist invoeren.
                          </p>
                          <div className="absolute -top-1 left-3 w-2 h-2 bg-slate-800 border-l border-t border-slate-600 transform rotate-45"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={filters.handelsbenaming || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, handelsbenaming: e.target.value || undefined }))}
                    placeholder="bijv. GOLF, POLO, TIGUAN, 3ER"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Voertuigsoort
                  </label>
                  <select
                    value={filters.voertuigsoort || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, voertuigsoort: e.target.value || undefined }))}
                    className="input"
                  >
                    <option value="">Alle types</option>
                    <option value="Personenauto">Personenauto</option>
                    <option value="Bedrijfsauto">Bedrijfsauto</option>
                    <option value="Bus">Bus</option>
                    <option value="Motorfiets">Motorfiets</option>
                    <option value="Brom- of snorfiets">Brom- of snorfiets</option>
                    <option value="Aanhangwagen">Aanhangwagen</option>
                    <option value="Oplegger">Oplegger</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Brandstof
                  </label>
                  <select
                    value={filters.brandstof || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, brandstof: e.target.value || undefined }))}
                    className="input"
                  >
                    <option value="">Alle brandstoffen</option>
                    <option value="Benzine">Benzine</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Elektriciteit">Elektriciteit</option>
                    <option value="Hybride">Hybride</option>
                    <option value="LPG">LPG</option>
                    <option value="CNG">CNG (Aardgas)</option>
                    <option value="Waterstof">Waterstof</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Kleur
                  </label>
                  <select
                    value={filters.kleur || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, kleur: e.target.value || undefined }))}
                    className="input"
                  >
                    <option value="">Alle kleuren</option>
                    {colors.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Aantal deuren
                  </label>
                  <select
                    value={filters.aantalDeuren || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, aantalDeuren: parseInt(e.target.value) || undefined }))}
                    className="input"
                  >
                    <option value="">Alle aantallen</option>
                    <option value="2">2 deuren</option>
                    <option value="3">3 deuren</option>
                    <option value="4">4 deuren</option>
                    <option value="5">5 deuren</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Aantal zitplaatsen
                  </label>
                  <select
                    value={filters.aantalZitplaatsen || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, aantalZitplaatsen: parseInt(e.target.value) || undefined }))}
                    className="input"
                  >
                    <option value="">Alle aantallen</option>
                    <option value="2">2 personen</option>
                    <option value="4">4 personen</option>
                    <option value="5">5 personen</option>
                    <option value="7">7 personen</option>
                    <option value="8">8 personen</option>
                    <option value="9">9+ personen</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Euro klasse
                  </label>
                  <select
                    value={filters.euroKlasse || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, euroKlasse: e.target.value || undefined }))}
                    className="input"
                  >
                    <option value="">Alle klassen</option>
                    <option value="EURO 6">Euro 6</option>
                    <option value="EURO 5">Euro 5</option>
                    <option value="EURO 4">Euro 4</option>
                    <option value="EURO 3">Euro 3</option>
                    <option value="EURO 2">Euro 2</option>
                    <option value="EURO 1">Euro 1</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Bouwjaar van
                  </label>
                  <input
                    type="number"
                    value={filters.bouwjaarVan || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, bouwjaarVan: parseInt(e.target.value) || undefined }))}
                    placeholder="2000"
                    min="1900"
                    max={new Date().getFullYear()}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Bouwjaar tot
                  </label>
                  <input
                    type="number"
                    value={filters.bouwjaarTot || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, bouwjaarTot: parseInt(e.target.value) || undefined }))}
                    placeholder="2024"
                    min="1900"
                    max={new Date().getFullYear()}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Cilinderinhoud van (cc)
                  </label>
                  <input
                    type="number"
                    value={filters.cilinderinhoudVan || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, cilinderinhoudVan: parseInt(e.target.value) || undefined }))}
                    placeholder="1000"
                    min="0"
                    max="10000"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Cilinderinhoud tot (cc)
                  </label>
                  <input
                    type="number"
                    value={filters.cilinderinhoudTot || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, cilinderinhoudTot: parseInt(e.target.value) || undefined }))}
                    placeholder="2000"
                    min="0"
                    max="10000"
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Zuinigheidslabel
                  </label>
                  <select
                    value={filters.zuinigheidslabel || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, zuinigheidslabel: e.target.value || undefined }))}
                    className="input"
                  >
                    <option value="">Alle labels</option>
                    <option value="A">A (Zeer zuinig)</option>
                    <option value="B">B (Zuinig)</option>
                    <option value="C">C (Gemiddeld)</option>
                    <option value="D">D (Matig)</option>
                    <option value="E">E (Onzuinig)</option>
                    <option value="F">F (Zeer onzuinig)</option>
                    <option value="G">G (Uiterst onzuinig)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Roetfilter
                  </label>
                  <select
                    value={filters.roetfilter === undefined ? '' : filters.roetfilter ? 'true' : 'false'}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      roetfilter: e.target.value === '' ? undefined : e.target.value === 'true' 
                    }))}
                    className="input"
                  >
                    <option value="">Beide</option>
                    <option value="true">Met roetfilter</option>
                    <option value="false">Zonder roetfilter</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleClearFilters}
                    className="btn btn-secondary w-full"
                  >
                    Alle Filters Wissen
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {isLoading && (searchQuery || Object.values(searchFilters).some(v => v)) && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Zoeken...</p>
        </div>
      )}

      {error && (
        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-4">
          <p className="text-danger-700 dark:text-danger-300">
            Er is een fout opgetreden bij het zoeken. Probeer het opnieuw.
          </p>
        </div>
      )}

      {/* Save Results Actions */}
      {vehicles.length > 0 && isAuthenticated && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Save className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100">
                  Resultaten opslaan
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Sla alle {vehicles.length} gevonden kentekens op voor later gebruik
                </p>
              </div>
            </div>
            <button
              onClick={handleSaveResults}
              className="btn btn-primary whitespace-nowrap"
            >
              <Save className="w-4 h-4 mr-2" />
              Opslaan
            </button>
          </div>
        </div>
      )}

      {vehicles.length > 0 && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {vehicles.length} voertuigen gevonden
            </h2>
            <button
              onClick={handleExportCsv}
              className="btn btn-secondary"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.kenteken}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                      {vehicle.kenteken}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      {vehicle.merk} {vehicle.model}
                    </p>
                  </div>
                  <button
                    onClick={() => isFavorite(vehicle.kenteken) ? removeFavorite(vehicle.kenteken) : addFavorite(vehicle.kenteken)}
                    className={`p-1 rounded ${
                      isFavorite(vehicle.kenteken) 
                        ? 'text-yellow-500' 
                        : 'text-slate-400 hover:text-yellow-500'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${isFavorite(vehicle.kenteken) ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Bouwjaar:</span>
                    <span className="text-slate-900 dark:text-white">{vehicle.bouwjaar}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Brandstof:</span>
                    <span className="text-slate-900 dark:text-white">{vehicle.brandstof}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Kleur:</span>
                    <span className="text-slate-900 dark:text-white">{vehicle.kleur}</span>
                  </div>
                  {vehicle.apkVerlooptBinnenkort && (
                    <div className="text-yellow-600 dark:text-yellow-400 text-xs font-medium">
                      ⚠️ APK verloopt binnenkort
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <Link
                    to={`/voertuig/${vehicle.kenteken}`}
                    className="btn btn-primary w-full text-sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Bekijk Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!isLoading && !error && vehicles.length === 0 && (query || Object.keys(filters).length > 0) && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Geen voertuigen gevonden
          </h3>
          <p className="text-slate-600 dark:text-slate-300">
            Probeer een andere zoekopdracht of pas de filters aan.
          </p>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
          Zoektips
        </h3>
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p>
            • <strong>Wildcards:</strong> Gebruik * voor onbekende karakters (bijv. *AB-*3* vindt 1AB-234, 2AB-135, etc.)
          </p>
          <p>
            • <strong>Filters:</strong> Combineer kenteken zoeken met filters voor betere resultaten
          </p>
          <p>
            • <strong>Export:</strong> Download zoekresultaten als CSV bestand voor verder gebruik
          </p>
          <p>
            • <strong>Favorieten:</strong> Klik op de ster om voertuigen toe te voegen aan je favorieten
          </p>
        </div>
      </div>

             {/* Save Results Modal */}
       {showSaveModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                 Resultaten opslaan
               </h2>
               <button
                 onClick={() => setShowSaveModal(false)}
                 className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>
             <div className="mb-4">
               <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                 Je gaat {vehicles.length} kentekens opslaan
               </p>
               <input
                 type="text"
                 value={saveName}
                 onChange={(e) => setSaveName(e.target.value)}
                 placeholder="Naam voor deze zoekopdracht"
                 className="input w-full"
                 onKeyDown={(e) => e.key === 'Enter' && handleConfirmSave()}
               />
             </div>
             <div className="flex gap-2">
               <button
                 onClick={handleConfirmSave}
                 className="btn btn-primary flex-1"
                 disabled={isSaving || !saveName.trim()}
               >
                 {isSaving ? 'Opslaan...' : 'Opslaan'}
               </button>
               <button
                 onClick={() => setShowSaveModal(false)}
                 className="btn btn-secondary"
               >
                 Annuleren
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
} 