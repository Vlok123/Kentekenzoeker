import { useParams, Link } from 'react-router-dom';
import { 
  Car, 
  Fuel, 
  Gauge, 
  Palette, 
  Scale, 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  ArrowLeft,
  Download,
  Star,
  Eye,
  Shield
} from 'lucide-react';
import { useVehicleByLicensePlate, useVehicleRecalls } from '@/hooks/useRdw';
import { formatDate } from '@/utils/dataProcessing';
import { useAppStore } from '@/store/useAppStore';

export default function VoertuigDetailPage() {
  const { kenteken } = useParams<{ kenteken: string }>();
  const { addFavorite, removeFavorite, isFavorite } = useAppStore();
  
  const { data: vehicle, isLoading, error } = useVehicleByLicensePlate(kenteken || '', !!kenteken);
  const { data: recalls = [] } = useVehicleRecalls(kenteken || '', !!kenteken);

  if (!kenteken) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-4">
          <p className="text-danger-700 dark:text-danger-300">
            Ongeldig kenteken in URL.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Voertuiggegevens laden...</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-danger-700 dark:text-danger-300 mb-2">
            Voertuig niet gevonden
          </h3>
          <p className="text-danger-700 dark:text-danger-300">
            Er kon geen voertuig gevonden worden met kenteken <strong>{kenteken}</strong>.
          </p>
          <Link to="/zoek" className="btn btn-secondary mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug naar zoeken
          </Link>
        </div>
      </div>
    );
  }

  const handlePrintPdf = () => {
    window.print();
  };

  const handleToggleFavorite = () => {
    if (isFavorite(vehicle.kenteken)) {
      removeFavorite(vehicle.kenteken);
    } else {
      addFavorite(vehicle.kenteken);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link to="/zoek" className="text-primary-600 hover:text-primary-700 flex items-center text-sm mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Terug naar zoeken
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {vehicle.kenteken}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            {vehicle.merk} {vehicle.model}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleToggleFavorite}
            className={`btn ${isFavorite(vehicle.kenteken) ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Star className={`w-4 h-4 mr-2 ${isFavorite(vehicle.kenteken) ? 'fill-current' : ''}`} />
            {isFavorite(vehicle.kenteken) ? 'Favoriet' : 'Favoriet toevoegen'}
          </button>
          <button onClick={handlePrintPdf} className="btn btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Print PDF
          </button>
        </div>
      </div>

      {/* Alert for recalls or APK */}
      {(recalls.length > 0 || vehicle.apkVerlooptBinnenkort) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Belangrijk
              </h3>
              <ul className="text-yellow-700 dark:text-yellow-300 space-y-1">
                {recalls.length > 0 && (
                  <li>• Er is een openstaande terugroepactie voor dit voertuig</li>
                )}
                {vehicle.apkVerlooptBinnenkort && (
                  <li>• APK keuring verloopt binnenkort ({formatDate(vehicle.apkGeldigTot)})</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main Vehicle Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center mb-4">
              <Car className="w-5 h-5 text-slate-600 dark:text-slate-400 mr-3" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Basisgegevens
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-400">Kenteken</label>
                  <p className="font-medium text-slate-900 dark:text-white">{vehicle.kenteken}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-400">Merk</label>
                  <p className="font-medium text-slate-900 dark:text-white">{vehicle.merk}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-400">Model</label>
                  <p className="font-medium text-slate-900 dark:text-white">{vehicle.model}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-400">Voertuigsoort</label>
                  <p className="font-medium text-slate-900 dark:text-white">{vehicle.voertuigsoort}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-400">Bouwjaar</label>
                  <p className="font-medium text-slate-900 dark:text-white">{vehicle.bouwjaar}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-400">Eerste toelating</label>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {formatDate(vehicle.datumEersteToelating)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-400">Kleur</label>
                  <div className="flex items-center">
                    <Palette className="w-4 h-4 text-slate-400 mr-2" />
                    <p className="font-medium text-slate-900 dark:text-white">{vehicle.kleur}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-400">Brandstof</label>
                  <div className="flex items-center">
                    <Fuel className="w-4 h-4 text-slate-400 mr-2" />
                    <p className="font-medium text-slate-900 dark:text-white">{vehicle.brandstof}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Specs */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center mb-4">
              <Wrench className="w-5 h-5 text-slate-600 dark:text-slate-400 mr-3" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Technische Specificaties
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Motor */}
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-3">Motor</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Cilinderinhoud:</span>
                    <span className="text-slate-900 dark:text-white">
                      {vehicle.motor.cilinderinhoud > 0 ? `${vehicle.motor.cilinderinhoud} cc` : 'Onbekend'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Vermogen:</span>
                    <span className="text-slate-900 dark:text-white">
                      {vehicle.motor.vermogen > 0 ? `${vehicle.motor.vermogen} kW` : 'Onbekend'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Cilinders:</span>
                    <span className="text-slate-900 dark:text-white">
                      {vehicle.motor.cilinders > 0 ? vehicle.motor.cilinders : 'Onbekend'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Massa */}
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-3">Massa</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Ledig:</span>
                    <span className="text-slate-900 dark:text-white">
                      {vehicle.massa.ledig > 0 ? `${vehicle.massa.ledig.toLocaleString()} kg` : 'Onbekend'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Rijklaar:</span>
                    <span className="text-slate-900 dark:text-white">
                      {vehicle.massa.rijklaar > 0 ? `${vehicle.massa.rijklaar.toLocaleString()} kg` : 'Onbekend'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Technisch max:</span>
                    <span className="text-slate-900 dark:text-white">
                      {vehicle.massa.technischMaximum > 0 ? `${vehicle.massa.technischMaximum.toLocaleString()} kg` : 'Onbekend'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Afmetingen */}
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-3">Afmetingen</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Lengte:</span>
                    <span className="text-slate-900 dark:text-white">
                      {vehicle.afmetingen.lengte > 0 ? `${vehicle.afmetingen.lengte} cm` : 'Onbekend'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Breedte:</span>
                    <span className="text-slate-900 dark:text-white">
                      {vehicle.afmetingen.breedte > 0 ? `${vehicle.afmetingen.breedte} cm` : 'Onbekend'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Hoogte:</span>
                    <span className="text-slate-900 dark:text-white">
                      {vehicle.afmetingen.hoogte > 0 ? `${vehicle.afmetingen.hoogte} cm` : 'Onbekend'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Towing Capacity */}
          {(vehicle.trekgewicht.geremd > 0 || vehicle.trekgewicht.ongeremd > 0) && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center mb-4">
                <Scale className="w-5 h-5 text-slate-600 dark:text-slate-400 mr-3" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Trekgewicht
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 dark:text-white mb-2">Ongeremd</h3>
                  <p className="text-2xl font-bold text-primary-600">
                    {vehicle.trekgewicht.ongeremd > 0 ? `${vehicle.trekgewicht.ongeremd.toLocaleString()} kg` : 'Niet beschikbaar'}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 dark:text-white mb-2">Geremd</h3>
                  <p className="text-2xl font-bold text-primary-600">
                    {vehicle.trekgewicht.geremd > 0 ? `${vehicle.trekgewicht.geremd.toLocaleString()} kg` : 'Niet beschikbaar'}
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <Link 
                  to="/trekgewicht" 
                  className="btn btn-secondary"
                >
                  <Scale className="w-4 h-4 mr-2" />
                  Trekgewicht controleren
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* APK Status */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center mb-4">
              <Shield className="w-5 h-5 text-slate-600 dark:text-slate-400 mr-3" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                APK Status
              </h3>
            </div>
            
            {vehicle.apkGeldigTot ? (
              <div>
                <div className={`flex items-center mb-2 ${
                  vehicle.apkVerlooptBinnenkort ? 'text-yellow-600' : 'text-success-600'
                }`}>
                  {vehicle.apkVerlooptBinnenkort ? (
                    <AlertTriangle className="w-4 h-4 mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  <span className="font-medium">
                    {vehicle.apkVerlooptBinnenkort ? 'Verloopt binnenkort' : 'Geldig'}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Geldig tot: {formatDate(vehicle.apkGeldigTot, true)}
                </p>
              </div>
            ) : (
              <p className="text-slate-600 dark:text-slate-300">
                Geen APK informatie beschikbaar
              </p>
            )}
          </div>

          {/* Environmental Info */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center mb-4">
              <Gauge className="w-5 h-5 text-slate-600 dark:text-slate-400 mr-3" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Milieu
              </h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400">Euro klasse</label>
                <p className="font-medium text-slate-900 dark:text-white">{vehicle.milieu.euroKlasse}</p>
              </div>
              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400">CO₂ uitstoot</label>
                <p className="font-medium text-slate-900 dark:text-white">
                  {vehicle.milieu.co2Uitstoot > 0 ? `${vehicle.milieu.co2Uitstoot} g/km` : 'Onbekend'}
                </p>
              </div>
              {vehicle.milieu.zuinigheidslabel && (
                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-400">Zuinigheidslabel</label>
                  <p className="font-medium text-slate-900 dark:text-white">{vehicle.milieu.zuinigheidslabel}</p>
                </div>
              )}
              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400">Roetfilter</label>
                <p className="font-medium text-slate-900 dark:text-white">
                  {vehicle.milieu.roetfilter ? 'Ja' : 'Nee'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Snelle acties
            </h3>
            
            <div className="space-y-2">
              <Link to="/trekgewicht" className="btn btn-secondary w-full text-sm">
                <Scale className="w-4 h-4 mr-2" />
                Trekgewicht check
              </Link>
              <Link to="/zoek" className="btn btn-secondary w-full text-sm">
                <Eye className="w-4 h-4 mr-2" />
                Meer voertuigen zoeken
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recalls Section */}
      {recalls.length > 0 && (
        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-5 h-5 text-danger-600 mr-3" />
            <h2 className="text-xl font-semibold text-danger-900 dark:text-danger-100">
              Terugroepacties ({recalls.length})
            </h2>
          </div>
          
          <div className="space-y-4">
            {recalls.map((recall, index) => (
              <div key={index} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-danger-200 dark:border-danger-700">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    {recall.handelsnaam}
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    recall.status === 'Open' 
                      ? 'bg-danger-100 text-danger-700 dark:bg-danger-900/50 dark:text-danger-300'
                      : 'bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-300'
                  }`}>
                    {recall.status}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">
                  {recall.beschrijving_probleem}
                </p>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Referentie: {recall.referentiecode_rdw}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 