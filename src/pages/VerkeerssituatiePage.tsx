import Layout from '../components/Layout';
import SEOHead from '../components/SEOHead';
import AdvancedIncidentMap from '../components/verkeerssituatie/AdvancedIncidentMap';

export default function VerkeerssituatiePage() {
  return (
    <Layout>
      <SEOHead 
        title="Verkeersschets - CarIntel"
        description="Maak professionele verkeersschetsen voor ongevallen, verkeerssituaties en incidenten. Eenvoudig te gebruiken tool voor politie, verzekeringen en verkeersbureaus."
        keywords="verkeersschets, ongevalschets, verkeerssituatie, incident kaart, politie, verzekering"
      />
      
      <div className="min-h-screen">
              <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-blue-900/20 dark:to-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              Verkeersschets Tool
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-4xl mx-auto mb-8">
              Verkeerssituaties eenvoudig en duidelijk in beeld brengen
            </p>
          </div>

          {/* Instructies en Tips */}
          <div className="max-w-5xl mx-auto mb-12">
            <div className="glass-card p-8 mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
                📋 Waarom deze tool gebruiken?
              </h2>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                  Bij verkeersongevallen is het vaak nodig om een verkeersschets te maken ter ondersteuning van de afhandeling. 
                  Helaas zijn dergelijke schetsen in de praktijk regelmatig onduidelijk, waardoor verzekeraars niet altijd over 
                  de juiste informatie beschikken. Deze applicatie helpt u om verkeerssituaties overzichtelijk en nauwkeurig vast te leggen.
                </p>
                <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                  Met behulp van intuïtieve icoontjes plaatst u voertuigen, weggebruikers en relevante elementen eenvoudig op de kaart. 
                  Zo ontstaat er een helder beeld van de situatie. Gebruik het tekstblok om aanvullende informatie te geven, zoals wie 
                  welk voertuig bestuurde of wat de rol van een betrokkene was. De gemaakte weergave kunt u vervolgens opslaan als 
                  afbeelding en meesturen met uw schadeformulier of verzekeringsdossier.
                </p>
              </div>
            </div>

            <div className="glass-card p-8 mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
                💡 Handige tips bij het gebruik
              </h2>
              <div className="grid gap-4">
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">1</span>
                  <p className="text-slate-700 dark:text-slate-300">
                    Soms is het handiger om de <strong>sateliet-kaart</strong> te pakken, omdat verkeerstekens op de weg dan meestal ook te zien zijn.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">2</span>
                  <p className="text-slate-700 dark:text-slate-300">
                    Voeg <strong>verkeersborden</strong> toe als deze van invloed zijn geweest op de situatie.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">3</span>
                  <p className="text-slate-700 dark:text-slate-300">
                    Noteer duidelijk in het <strong>tekstvak</strong> wie wie is en wat hun positie of beweging was.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">4</span>
                  <p className="text-slate-700 dark:text-slate-300">
                    Icoontjes zijn te <strong>spiegelen of te draaien</strong> zodat ze overeenkomen met de werkelijke richting.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">5</span>
                  <p className="text-slate-700 dark:text-slate-300">
                    Gebruik <strong>pijlen</strong> om de rijrichting of remsporen aan te geven.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">6</span>
                  <p className="text-slate-700 dark:text-slate-300">
                    Markeer <strong>belangrijke punten</strong>, zoals botsplaatsen of zichtbelemmeringen.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">7</span>
                  <p className="text-slate-700 dark:text-slate-300">
                    Zorg dat de <strong>kaartweergave volledig</strong> is, inclusief straatnamen indien relevant.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-card p-6 border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/20">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-amber-600 dark:text-amber-400">⚠️</span>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200">Let op</h3>
                </div>
                <div className="text-amber-700 dark:text-amber-300 text-sm space-y-2">
                  <p>
                    📷 <strong>Screenshots maken</strong> kan zonder in te loggen.
                  </p>
                  <p>
                    💾 Om schetsen op te slaan en later te laden dient u <strong>ingelogd</strong> te zijn.
                  </p>
                </div>
              </div>

              <div className="glass-card p-6 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-blue-600 dark:text-blue-400">ℹ️</span>
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200">Disclaimer</h3>
                </div>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  Er worden regelmatig nieuwe icoontjes toegevoegd. Mist u een specifiek icoon? 
                  Laat het ons weten via het <strong>contactformulier</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
        
        <div className="bg-white dark:bg-slate-900">
          <AdvancedIncidentMap />
        </div>
      </div>
    </Layout>
  );
} 