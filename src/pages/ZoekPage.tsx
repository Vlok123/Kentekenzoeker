import { useState, useEffect } from 'react';
import { Search, Filter, Download, Star, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useVehicleSearch, useVehicleBrands, useVehicleColors } from '@/hooks/useRdw';
import { useAppStore } from '@/store/useAppStore';
import { generateCsvData } from '@/utils/dataProcessing';
import Autocomplete from '@/components/Autocomplete';
import type { SearchFilters } from '@/types/rdw';

export default function ZoekPage() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  
  const { 
    searchQuery, 
    searchFilters, 
    setSearchQuery, 
    setSearchFilters,
    clearSearch,
    addFavorite,
    removeFavorite,
    isFavorite 
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
  const { data: brands = [] } = useVehicleBrands();
  const { data: colors = [] } = useVehicleColors();

  const handleSearch = () => {
    // Validate input
    if (query && !query.includes('*') && query.length < 3) {
      alert('Voer minstens 3 karakters in of gebruik wildcards (*)');
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
          Zoek voertuigen met wildcards (*) en geavanceerde filters
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
                onChange={(e) => setQuery(e.target.value.toUpperCase())}
                placeholder="Kenteken of wildcard (bijv. S714*, S*J, *14*)"
                className="input w-full"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                maxLength={10}
              />
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Autocomplete
                    label="Merk"
                    value={filters.merk || ''}
                    onChange={(value) => setFilters(prev => ({ ...prev, merk: value || undefined }))}
                    options={brands}
                    placeholder="Type een merk (bijv. volk voor Volkswagen)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Model/Variant
                  </label>
                  <input
                    type="text"
                    value={filters.handelsbenaming || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, handelsbenaming: e.target.value || undefined }))}
                    placeholder="bijv. GOLF, POLO, TIGUAN"
                    className="input"
                  />
                </div>

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
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={handleClearFilters}
                  className="btn btn-secondary"
                >
                  Filters Wissen
                </button>
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
    </div>
  );
} 