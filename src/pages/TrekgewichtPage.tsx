import { useState } from 'react';
import { Weight, CheckCircle, XCircle, AlertTriangle, Car } from 'lucide-react';
import { useTrekgewichtCheck } from '@/hooks/useRdw';
import { validateAndFormatLicensePlate } from '@/utils/licensePlate';
import type { TrekgewichtCheck } from '@/types/rdw';

export default function TrekgewichtPage() {
  const [formData, setFormData] = useState<TrekgewichtCheck>({
    kenteken: '',
    gewensteAanhangergewicht: 0,
    heeftRemmen: true,
  });
  const [kentekenError, setKentekenError] = useState<string>('');
  
  const trekgewichtMutation = useTrekgewichtCheck();

  const handleKentekenChange = (value: string) => {
    const validation = validateAndFormatLicensePlate(value);
    setFormData(prev => ({ ...prev, kenteken: validation.formatted }));
    // Alleen tonen error als er daadwerkelijk iets is ingevuld en het niet valid is
    setKentekenError(value.length > 2 ? (validation.error || '') : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateAndFormatLicensePlate(formData.kenteken);
    // Versoepelde validatie - accepteer alle kentekens die niet leeg zijn
    if (!formData.kenteken.trim()) {
      setKentekenError('Kenteken is verplicht');
      return;
    }

    if (formData.gewensteAanhangergewicht <= 0) {
      return;
    }

    trekgewichtMutation.mutate({
      ...formData,
      kenteken: validation.normalized,
    });
  };

  const result = trekgewichtMutation.data;
  const isLoading = trekgewichtMutation.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full">
            <Weight className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Trekgewicht Controle
        </h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
          Controleer of uw voertuig een bepaald aanhangergewicht mag trekken
        </p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kenteken Input */}
            <div>
              <label htmlFor="kenteken" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Kenteken
              </label>
              <input
                type="text"
                id="kenteken"
                value={formData.kenteken}
                onChange={(e) => handleKentekenChange(e.target.value)}
                placeholder="Alle kentekentypes toegestaan (bijv. 12AB34, ABC123)"
                className={`input ${kentekenError ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                maxLength={10}
                required
              />
              {kentekenError && (
                <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">
                  {kentekenError}
                </p>
              )}
            </div>

            {/* Gewicht Input */}
            <div>
              <label htmlFor="gewicht" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Gewenst aanhangergewicht (kg)
              </label>
              <input
                type="number"
                id="gewicht"
                value={formData.gewensteAanhangergewicht || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  gewensteAanhangergewicht: parseInt(e.target.value) || 0 
                }))}
                placeholder="1500"
                min="0"
                max="10000"
                className="input"
                required
              />
            </div>
          </div>

          {/* Remmen Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remmen"
              checked={formData.heeftRemmen}
              onChange={(e) => setFormData(prev => ({ ...prev, heeftRemmen: e.target.checked }))}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
            />
            <label htmlFor="remmen" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">
              Aanhanger heeft remmen
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !!kentekenError}
            className="w-full btn btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Controleren...
              </div>
            ) : (
              'Trekgewicht Controleren'
            )}
          </button>
        </form>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Result Card */}
          <div className={`rounded-xl border p-6 ${
            result.noData
              ? 'bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700'
              : result.toegestaan 
                ? 'bg-success-50 border-success-200 dark:bg-success-900/20 dark:border-success-800'
                : 'bg-danger-50 border-danger-200 dark:bg-danger-900/20 dark:border-danger-800'
          }`}>
            <div className="flex items-center mb-4">
              {result.noData ? (
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-slate-600 dark:text-slate-300 text-lg">ℹ️</span>
                </div>
              ) : result.toegestaan ? (
                <CheckCircle className="w-8 h-8 text-success-600 mr-3" />
              ) : (
                <XCircle className="w-8 h-8 text-danger-600 mr-3" />
              )}
              <div>
                <h3 className={`text-xl font-semibold ${
                  result.noData
                    ? 'text-slate-900 dark:text-slate-100'
                    : result.toegestaan 
                      ? 'text-success-900 dark:text-success-100' 
                      : 'text-danger-900 dark:text-danger-100'
                }`}>
                  {result.noData ? 'Geen Trekgewicht Data' : result.toegestaan ? 'Toegestaan' : 'Niet Toegestaan'}
                </h3>
                <p className={`text-sm ${
                  result.noData
                    ? 'text-slate-700 dark:text-slate-300'
                    : result.toegestaan 
                      ? 'text-success-700 dark:text-success-300' 
                      : 'text-danger-700 dark:text-danger-300'
                }`}>
                  {result.message}
                </p>
              </div>
            </div>

            {!result.noData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Maximum trekgewicht {formData.heeftRemmen ? 'geremd' : 'ongeremd'}
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {result.maximumGewicht.toLocaleString()} kg
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Gewenst aanhangergewicht
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formData.gewensteAanhangergewicht.toLocaleString()} kg
                  </div>
                </div>
              </div>
            )}

            {result.noData && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Wat betekent dit?
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Dit voertuig heeft mogelijk geen officiële trekhaak</li>
                  <li>• De trekgewicht specificaties zijn niet geregistreerd bij de RDW</li>
                  <li>• Voor trekgewicht informatie kunt u contact opnemen met de dealer of fabrikant</li>
                  <li>• Controleer het kentekenbewijs voor eventuele trekhaak aantekeningen</li>
                </ul>
              </div>
            )}
          </div>

          {/* Vehicle Info Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center mb-4">
              <Car className="w-6 h-6 text-slate-600 mr-3" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Voertuiggegevens
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Kenteken</div>
                <div className="font-medium text-slate-900 dark:text-white">{result.rdwData.kenteken}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Merk & Model</div>
                <div className="font-medium text-slate-900 dark:text-white">
                  {result.rdwData.merk} {result.rdwData.model}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Bouwjaar</div>
                <div className="font-medium text-slate-900 dark:text-white">{result.rdwData.bouwjaar}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Brandstof</div>
                <div className="font-medium text-slate-900 dark:text-white">{result.rdwData.brandstof}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Massa rijklaar</div>
                <div className="font-medium text-slate-900 dark:text-white">
                  {result.rdwData.massa.rijklaar.toLocaleString()} kg
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Trekgewicht ongeremd</div>
                <div className="font-medium text-slate-900 dark:text-white">
                  {result.rdwData.trekgewicht.ongeremd > 0 
                    ? `${result.rdwData.trekgewicht.ongeremd.toLocaleString()} kg`
                    : 'Niet beschikbaar'
                  }
                </div>
              </div>
            </div>

            {result.rdwData.hasRecall && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Let op: Er is een openstaande terugroepactie voor dit voertuig
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
          Hoe werkt de trekgewicht controle?
        </h3>
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p>
            • <strong>Geremd trekgewicht:</strong> Het maximum gewicht dat uw voertuig mag trekken wanneer de aanhanger eigen remmen heeft.
          </p>
          <p>
            • <strong>Ongeremd trekgewicht:</strong> Het maximum gewicht voor aanhangers zonder eigen remsysteem.
          </p>
          <p>
            • <strong>Officiële gegevens:</strong> Alle informatie komt rechtstreeks van de RDW database.
          </p>
          <p>
            • <strong>Veiligheid:</strong> Overschrijd nooit het maximum trekgewicht - dit kan gevaarlijk zijn en is niet toegestaan.
          </p>
        </div>
      </div>
    </div>
  );
} 