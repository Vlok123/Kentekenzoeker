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
  Shield,
  Calendar,
  FileText,
  Settings,
  TrendingUp,
  Zap,
  Leaf,
  DollarSign,
  History
} from 'lucide-react';
import { useCompleteVehicleData, useVehicleRecalls, useCompleteRdwData } from '@/hooks/useRdw';
import { formatDate } from '@/utils/dataProcessing';
import { useAppStore } from '@/store/useAppStore';

export default function VoertuigDetailPage() {
  const { kenteken } = useParams<{ kenteken: string }>();
  const { addFavorite, removeFavorite, isFavorite } = useAppStore();
  
  const { data: vehicle, isLoading, error } = useCompleteVehicleData(kenteken || '', !!kenteken);
  const { data: recalls = [] } = useVehicleRecalls(kenteken || '', !!kenteken);
  const { data: completeRdwData, isLoading: isLoadingComplete } = useCompleteRdwData(kenteken || '', !!kenteken);

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
                {vehicle.carrosserie && (
                  <div>
                    <label className="text-sm text-slate-600 dark:text-slate-400">Carrosserie</label>
                    <p className="font-medium text-slate-900 dark:text-white">{vehicle.carrosserie.omschrijving}</p>
                  </div>
                )}
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

          {/* Environmental & Emissions Data */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center mb-4">
              <Leaf className="w-5 h-5 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Milieu & Emissies
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-400">CO₂ Uitstoot</label>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {vehicle.milieu.co2Uitstoot} g/km
                  </p>
                </div>
                {vehicle.milieu.co2UitstootStad && (
                  <div>
                    <label className="text-sm text-slate-600 dark:text-slate-400">CO₂ Stad</label>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {vehicle.milieu.co2UitstootStad} g/km
                    </p>
                  </div>
                )}
                {vehicle.milieu.co2UitstootBuiten && (
                  <div>
                    <label className="text-sm text-slate-600 dark:text-slate-400">CO₂ Buiten</label>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {vehicle.milieu.co2UitstootBuiten} g/km
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-400">Euro Klasse</label>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {vehicle.milieu.euroKlasse || 'Niet beschikbaar'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-400">Zuinigheidslabel</label>
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full mr-2 flex items-center justify-center text-xs font-bold text-white ${
                      vehicle.milieu.zuinigheidslabel === 'A' ? 'bg-green-500' :
                      vehicle.milieu.zuinigheidslabel === 'B' ? 'bg-green-400' :
                      vehicle.milieu.zuinigheidslabel === 'C' ? 'bg-yellow-400' :
                      vehicle.milieu.zuinigheidslabel === 'D' ? 'bg-orange-400' :
                      vehicle.milieu.zuinigheidslabel === 'E' ? 'bg-red-400' :
                      vehicle.milieu.zuinigheidslabel === 'F' ? 'bg-red-500' :
                      vehicle.milieu.zuinigheidslabel === 'G' ? 'bg-red-600' :
                      'bg-slate-400'
                    }`}>
                      {vehicle.milieu.zuinigheidslabel || '?'}
                    </div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {vehicle.milieu.zuinigheidslabel || 'Onbekend'}
                    </p>
                  </div>
                </div>
                {vehicle.milieu.verbruikGecombineerd && (
                  <div>
                    <label className="text-sm text-slate-600 dark:text-slate-400">Verbruik</label>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {vehicle.milieu.verbruikGecombineerd} l/100km
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-400">Roetfilter</label>
                  <div className="flex items-center">
                    {vehicle.milieu.roetfilter ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                    )}
                    <p className="font-medium text-slate-900 dark:text-white">
                      {vehicle.milieu.roetfilter ? 'Ja' : 'Nee'}
                    </p>
                  </div>
                </div>
                {vehicle.milieu.geluidsniveauRijdend && (
                  <div>
                    <label className="text-sm text-slate-600 dark:text-slate-400">Geluidsniveau</label>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {vehicle.milieu.geluidsniveauRijdend} dB(A)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Technical Specs */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center mb-4">
              <Wrench className="w-5 h-5 text-slate-600 dark:text-slate-400 mr-3" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Technische specificaties
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Motor */}
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-3 flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Motor
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Cilinderinhoud:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {vehicle.motor.cilinderinhoud} cc
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Vermogen:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {vehicle.motor.vermogen} kW
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Cilinders:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {vehicle.motor.cilinders}
                    </span>
                  </div>
                </div>
              </div>

              {/* Massa */}
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-3 flex items-center">
                  <Scale className="w-4 h-4 mr-2" />
                  Massa & Gewicht
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Ledig gewicht:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {vehicle.massa.ledig} kg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Rijklaar:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {vehicle.massa.rijklaar} kg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Max. toegestaan:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {vehicle.massa.technischMaximum} kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Trekgewicht */}
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trekgewicht
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Ongeremd:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {vehicle.trekgewicht.ongeremd} kg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Geremd:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {vehicle.trekgewicht.geremd} kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Afmetingen */}
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-3 flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Afmetingen
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Lengte:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {vehicle.afmetingen.lengte} cm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Breedte:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {vehicle.afmetingen.breedte} cm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Hoogte:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {vehicle.afmetingen.hoogte} cm
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Axles Information */}
          {vehicle.assen && vehicle.assen.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center mb-4">
                <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400 mr-3" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Assen & Banden
                </h2>
              </div>
              
              <div className="space-y-4">
                {vehicle.assen.map((as, index) => (
                  <div key={index} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">
                      As {as.nummer}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Max. aslast:</span>
                        <p className="font-medium text-slate-900 dark:text-white">{as.maximumAslast} kg</p>
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Aantal banden:</span>
                        <p className="font-medium text-slate-900 dark:text-white">{as.bandenAantal}</p>
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Bandenafmeting:</span>
                        <p className="font-medium text-slate-900 dark:text-white">{as.bandenAfmeting}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complete RDW Data Summary */}
          {completeRdwData && !isLoadingComplete && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
              <div className="flex items-center mb-4">
                <FileText className="w-5 h-5 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Complete RDW Informatie
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="text-slate-600 dark:text-slate-400">APK Vervaldatum:</label>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {completeRdwData.apkVervaldatum || 'Onbekend'}
                  </p>
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400">Brandstof Details:</label>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {completeRdwData.brandstofDetails || completeRdwData.brandstof}
                  </p>
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400">Verbruik Gecombineerd:</label>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {completeRdwData.verbruikGecombineerd || 'Niet beschikbaar'}
                  </p>
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400">Carrosserie:</label>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {completeRdwData.carrosserieOmschrijving || 'Niet beschikbaar'}
                  </p>
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400">Laatste Update:</label>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {new Date(completeRdwData.laatsteUpdate).toLocaleString('nl-NL')}
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* APK History */}
          {vehicle.apkHistorie && vehicle.apkHistorie.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center mb-4">
                <History className="w-5 h-5 text-slate-600 dark:text-slate-400 mr-3" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  APK Keuringshistorie
                </h2>
              </div>
              
              <div className="space-y-3">
                {vehicle.apkHistorie.slice(0, 5).map((apk, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        apk.uitslag === 'Goedgekeurd' ? 'bg-green-500' :
                        apk.uitslag === 'Afgekeurd' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`} />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {formatDate(apk.datum)}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {apk.keuringsinstantie}, {apk.plaats}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        apk.uitslag === 'Goedgekeurd' ? 'text-green-600' :
                        apk.uitslag === 'Afgekeurd' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {apk.uitslag}
                      </p>
                      {(apk.gebrekLicht + apk.gebrekZwaar + apk.gebrekKritiek) > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {apk.gebrekLicht + apk.gebrekZwaar + apk.gebrekKritiek} gebrek(en)
                        </p>
                      )}
                    </div>
                  </div>
                ))}
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
            
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400">Geldig tot</label>
                <p className="font-medium text-slate-900 dark:text-white">
                  {formatDate(vehicle.apkGeldigTot)}
                </p>
              </div>
              
              <div className={`p-3 rounded-lg ${
                vehicle.apkVerlooptBinnenkort 
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                  : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              }`}>
                <div className="flex items-center">
                  {vehicle.apkVerlooptBinnenkort ? (
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  )}
                  <span className={`text-sm font-medium ${
                    vehicle.apkVerlooptBinnenkort 
                      ? 'text-yellow-700 dark:text-yellow-300'
                      : 'text-green-700 dark:text-green-300'
                  }`}>
                    {vehicle.apkVerlooptBinnenkort ? 'Verloopt binnenkort' : 'Geldig'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Road Tax Info */}
          {vehicle.wegenbelasting && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center mb-4">
                <DollarSign className="w-5 h-5 text-slate-600 dark:text-slate-400 mr-3" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Wegenbelasting
                </h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-400">Per kwartaal</label>
                  <p className="font-medium text-slate-900 dark:text-white">
                    €{vehicle.wegenbelasting.kwartaal}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-400">Per jaar</label>
                  <p className="font-medium text-slate-900 dark:text-white">
                    €{vehicle.wegenbelasting.jaar}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-400">BPM</label>
                  <p className="font-medium text-slate-900 dark:text-white">
                    €{vehicle.wegenbelasting.bpm}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recalls */}
          {recalls.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Terugroepacties
                </h3>
              </div>
              
              <div className="space-y-3">
                {recalls.map((recall, index) => (
                  <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="font-medium text-red-700 dark:text-red-300 text-sm">
                      {recall.beschrijving_probleem}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Status: {recall.status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Snelle acties
            </h3>
            
            <div className="space-y-3">
              <Link
                to={`/trekgewicht?kenteken=${vehicle.kenteken}`}
                className="flex items-center w-full p-3 text-left bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <Gauge className="w-4 h-4 text-blue-600 mr-3" />
                <span className="text-blue-700 dark:text-blue-300 font-medium">
                  Trekgewicht controleren
                </span>
              </Link>
              
              <button
                onClick={handlePrintPdf}
                className="flex items-center w-full p-3 text-left bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
              >
                <Download className="w-4 h-4 text-slate-600 dark:text-slate-400 mr-3" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Exporteer als PDF
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 