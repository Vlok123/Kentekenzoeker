import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { processVehicleData } from '@/utils/dataProcessing';
import { normalizeLicensePlate, matchesWildcard } from '@/utils/licensePlate';
import { useAppStore } from '@/store/useAppStore';
import { ApiAuthService } from '@/lib/api-auth';
import type { 
  RdwVehicle, 
  RdwRecall, 
  RdwBrandstofData,
  RdwCarrosserieData,
  RdwAssenData,
  ProcessedVehicle, 
  SearchFilters, 
  TrekgewichtCheck,
  TrekgewichtResult,
  ApkHistorieItem,
  AsInfo,
  // Additional API types
  RdwCarrosserieSpecificData,
  RdwVoertuigklasseData,
  // New API types
  RdwApkExpiryData,
  RdwApkHistoryData,
  RdwEnvironmentData,
  RdwTechnicalData,
  RdwFuelData,
  RdwRoadTaxData
} from '@/types/rdw';

// RDW API Base URLs - direct access (RDW supports CORS)
const RDW_BASE_URL = 'https://opendata.rdw.nl/resource';

// Main vehicle data endpoints
const VEHICLES_ENDPOINT = `${RDW_BASE_URL}/m9d7-ebf2.json`; // Main vehicle data
const CARROSSERIE_ENDPOINT = `${RDW_BASE_URL}/vezc-m2t6.json`; // Body type basic
const CARROSSERIE_SPECIFIC_ENDPOINT = `${RDW_BASE_URL}/jhie-znh9.json`; // Body type specific
const VOERTUIGKLASSE_ENDPOINT = `${RDW_BASE_URL}/kmfi-hrps.json`; // Vehicle class
const ASSEN_ENDPOINT = `${RDW_BASE_URL}/3huj-srit.json`; // Axles data
const BRANDSTOF_ENDPOINT = `${RDW_BASE_URL}/8ys7-d773.json`; // Fuel/emissions data

// APK/Inspection endpoints - Updated to working endpoints
const APK_ENDPOINT = `${RDW_BASE_URL}/w4rt-e856.json`; // APK keuringen (working endpoint)
const APK_EXPIRY_ENDPOINT = `${RDW_BASE_URL}/vezc-m2t6.json`; // APK expiry (same as carrosserie)
const APK_HISTORY_ENDPOINT = `${RDW_BASE_URL}/w4rt-e856.json`; // APK keuringen (working endpoint)

// Additional data endpoints
const EMISSIONS_ENDPOINT = `${RDW_BASE_URL}/8ys7-d773.json`; // Same as brandstof
const TECHNICAL_ENDPOINT = `${RDW_BASE_URL}/78bh-yfrx.json`; // Technical data
const FUEL_ENDPOINT = `${RDW_BASE_URL}/8dk6-zvkw.json`; // Fuel info
const ROAD_TAX_ENDPOINT = `${RDW_BASE_URL}/gm6w-96i9.json`; // Road tax
const RECALLS_ENDPOINT = `${RDW_BASE_URL}/ef3c-2uwd.json`; // Terugroepacties (updated endpoint)

// Create axios instance with default config
const rdwApi = axios.create({
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
  },
});

// Add response interceptor to suppress expected 404 errors from console
rdwApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Suppress console errors for expected 404s from RDW API
    if (error.response?.status === 404 || 
        error.response?.status === 400 ||
        error.code === 'ERR_BAD_REQUEST') {
      // Create a custom error object without logging to console
      const suppressedError = {
        ...error,
        response: error.response,
        code: error.code,
        message: error.message,
        config: error.config,
        isAxiosError: true,
        suppressedRdwError: true
      };
      return Promise.reject(suppressedError);
    }
    return Promise.reject(error);
  }
);

// Helper function to make RDW API calls with graceful 404 handling
async function safeRdwApiCall<T>(endpoint: string, params: any): Promise<T[]> {
  try {
    const response = await rdwApi.get<T[]>(endpoint, { params });
    return response.data || [];
  } catch (error: any) {
    // Silently handle 404 errors and other common errors - data not available for this vehicle
    if (error.response?.status === 404 || 
        error.response?.status === 400 ||
        error.code === 'ERR_BAD_REQUEST' ||
        error.code === 'ENOTFOUND' ||
        error.message?.includes('404') ||
        error.message?.includes('Not Found')) {
      // Completely suppress these errors - they're expected for vehicles without certain data
      return [];
    }
    throw error;
  }
}

/**
 * Hook voor het ophalen van APK historie van een voertuig
 * Nu gebaseerd op APK vervaldatum uit hoofddataset omdat aparte APK endpoints niet meer bestaan
 */
export function useVehicleApkHistory(kenteken: string, enabled = true) {
  return useQuery({
    queryKey: ['apkHistory', kenteken],
    queryFn: async (): Promise<ApkHistorieItem[]> => {
      if (!kenteken) {
        return [];
      }

      const normalizedKenteken = normalizeLicensePlate(kenteken);
      
      // Haal APK info uit hoofddataset omdat aparte APK endpoints niet meer bestaan
      const vehicleData = await safeRdwApiCall<RdwVehicle>(VEHICLES_ENDPOINT, {
        kenteken: normalizedKenteken,
        $limit: 1,
      });

      if (vehicleData.length === 0) {
        return [];
      }

      const vehicle = vehicleData[0];
      
      // Creëer een APK item gebaseerd op de vervaldatum in de hoofddata
      if (vehicle.vervaldatum_apk) {
        return [{
          datum: new Date(), // Huidige datum als placeholder
          uitslag: 'Goedgekeurd' as const, // Aanname: als er een vervaldatum is, was de laatste APK goedgekeurd
          gebrekLicht: 0,
          gebrekZwaar: 0,
          gebrekKritiek: 0,
          keuringsinstantie: 'Onbekend',
          plaats: 'Onbekend',
          vervaldatum: new Date(vehicle.vervaldatum_apk),
        }];
      }

      return [];
    },
    enabled: enabled && !!kenteken,
    staleTime: 1000 * 60 * 30, // 30 minutes
    cacheTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Hook voor het ophalen van brandstof gegevens
 */
export function useVehicleFuelData(kenteken: string, enabled = true) {
  return useQuery({
    queryKey: ['fuelData', kenteken],
    queryFn: async (): Promise<RdwBrandstofData[]> => {
      if (!kenteken) {
        return [];
      }

      const normalizedKenteken = normalizeLicensePlate(kenteken);
      
      return await safeRdwApiCall<RdwBrandstofData>(BRANDSTOF_ENDPOINT, {
        kenteken: normalizedKenteken,
        $limit: 10,
      });
    },
    enabled: enabled && !!kenteken,
    staleTime: 1000 * 60 * 30,
    cacheTime: 1000 * 60 * 60,
  });
}

/**
 * Hook voor het ophalen van carrosserie gegevens
 */
export function useVehicleBodyData(kenteken: string, enabled = true) {
  return useQuery({
    queryKey: ['bodyData', kenteken],
    queryFn: async (): Promise<RdwCarrosserieData[]> => {
      if (!kenteken) {
        return [];
      }

      const normalizedKenteken = normalizeLicensePlate(kenteken);
      
      return await safeRdwApiCall<RdwCarrosserieData>(CARROSSERIE_ENDPOINT, {
        kenteken: normalizedKenteken,
        $limit: 10,
      });
    },
    enabled: enabled && !!kenteken,
    staleTime: 1000 * 60 * 30,
    cacheTime: 1000 * 60 * 60,
  });
}

/**
 * Hook voor het ophalen van assen gegevens
 */
export function useVehicleAxlesData(kenteken: string, enabled = true) {
  return useQuery({
    queryKey: ['axlesData', kenteken],
    queryFn: async (): Promise<AsInfo[]> => {
      if (!kenteken) {
        return [];
      }

      const normalizedKenteken = normalizeLicensePlate(kenteken);
      
      const data = await safeRdwApiCall<RdwAssenData>(ASSEN_ENDPOINT, {
        kenteken: normalizedKenteken,
        $limit: 10,
      });

      return data.map(item => ({
        nummer: parseInt(item.as_nummer) || 0,
        maximumAslast: parseInt(item.technisch_toegestane_maximum_aslast) || 0,
        bandenAantal: parseInt(item.banden_aantal) || 0,
        bandenType: item.banden_type || 'Onbekend',
        bandenAfmeting: item.banden_afmeting || 'Onbekend',
      }));
    },
    enabled: enabled && !!kenteken,
    staleTime: 1000 * 60 * 30,
    cacheTime: 1000 * 60 * 60,
  });
}

/**
 * Hook voor complete voertuiggegevens inclusief alle datasets
 */
export function useCompleteVehicleData(kenteken: string, enabled = true) {
  const vehicleQuery = useVehicleByLicensePlate(kenteken, enabled);
  const apkHistoryQuery = useVehicleApkHistory(kenteken, enabled && !!kenteken);
  const fuelDataQuery = useVehicleFuelData(kenteken, enabled && !!kenteken);
  const bodyDataQuery = useVehicleBodyData(kenteken, enabled && !!kenteken);
  const axlesDataQuery = useVehicleAxlesData(kenteken, enabled && !!kenteken);
  const recallsQuery = useVehicleRecalls(kenteken, enabled && !!kenteken);

  return useQuery({
    queryKey: ['completeVehicleData', kenteken],
    queryFn: async (): Promise<ProcessedVehicle> => {
      // Wait for all queries to complete
      const [vehicle] = await Promise.all([
        vehicleQuery.refetch().then(r => r.data),
        apkHistoryQuery.refetch().then(r => r.data),
        fuelDataQuery.refetch().then(r => r.data),
        bodyDataQuery.refetch().then(r => r.data),
        axlesDataQuery.refetch().then(r => r.data),
        recallsQuery.refetch().then(r => r.data),
      ]);

      if (!vehicle) {
        throw new Error('Voertuiggegevens niet gevonden');
      }

      // Enrich vehicle data with additional information
      const enrichedVehicle: ProcessedVehicle = {
        ...vehicle,
        apkHistorie: apkHistoryQuery.data || [],
        carrosserie: bodyDataQuery.data?.[0] ? {
          type: bodyDataQuery.data[0].type_carrosserie_code,
          omschrijving: bodyDataQuery.data[0].type_carrosserie_nederlands || bodyDataQuery.data[0].type_carrosserie_europese_omschrijving,
        } : undefined,
        assen: axlesDataQuery.data || [],
      };

      return enrichedVehicle;
    },
    enabled: enabled && !!kenteken && vehicleQuery.isSuccess,
    staleTime: 1000 * 60 * 15,
    cacheTime: 1000 * 60 * 60,
  });
}

/**
 * Hook voor het ophalen van voertuiggegevens op basis van kenteken
 */
export function useVehicleByLicensePlate(kenteken: string, enabled = true) {
  const { addVehicleToCache, getVehicleFromCache, addRecentSearch, addNotification } = useAppStore();
  
  return useQuery({
    queryKey: ['vehicle', kenteken],
    queryFn: async (): Promise<ProcessedVehicle> => {
      if (!kenteken) {
        throw new Error('Kenteken is verplicht');
      }

      // Check cache first
      const cached = getVehicleFromCache(kenteken);
      if (cached) {
        return cached;
      }

      const normalizedKenteken = normalizeLicensePlate(kenteken);
      
      console.log('Searching for vehicle:', normalizedKenteken);
      
      // Haal zowel hoofdvoertuig data als brandstof data op
      const [vehicleResponse, fuelResponse] = await Promise.allSettled([
        rdwApi.get<RdwVehicle[]>(VEHICLES_ENDPOINT, {
          params: {
            kenteken: normalizedKenteken,
            $limit: 1,
          },
        }),
        rdwApi.get<RdwBrandstofData[]>(BRANDSTOF_ENDPOINT, {
          params: {
            kenteken: normalizedKenteken,
            $limit: 10,
          },
        }).catch(() => ({ data: [] })) // Graceful fallback voor brandstof data
      ]);

      // Check vehicle response
      if (vehicleResponse.status === 'rejected' || !vehicleResponse.value.data || vehicleResponse.value.data.length === 0) {
        throw new Error(`Geen voertuig gevonden met kenteken ${kenteken}. Probeer een echt Nederlands kenteken.`);
      }

      console.log('RDW API vehicle response:', vehicleResponse.value.data);
      
      // Extract fuel data (safe fallback)
      const fuelData = fuelResponse.status === 'fulfilled' ? fuelResponse.value.data : [];
      console.log('RDW API fuel response:', fuelData);

      // Process vehicle data with fuel data als fallback voor brandstof info
      const vehicle = processVehicleData(vehicleResponse.value.data[0], fuelData);
      
      // Cache the result
      addVehicleToCache(kenteken, vehicle);
      
      // Add to recent searches
      addRecentSearch(kenteken);

      return vehicle;
    },
    enabled: enabled && !!kenteken,
    staleTime: 1000 * 60 * 15, // 15 minutes
    cacheTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
    onError: (error: Error) => {
      addNotification({
        type: 'error',
        title: 'Fout bij ophalen voertuiggegevens',
        message: error.message,
      });
    },
  });
}

/**
 * Hook voor het zoeken van voertuigen met wildcards en filters
 */
export function useVehicleSearch(query: string, filters: SearchFilters, enabled = true) {
  const { addNotification, token } = useAppStore();

  return useQuery({
    queryKey: ['vehicleSearch', query, filters],
    queryFn: async (): Promise<ProcessedVehicle[]> => {
      const params: Record<string, string | number> = {
        $limit: 100,
        $order: 'datum_eerste_toelating DESC',
      };

      // Validate query - RDW API doesn't accept queries that are too short
      if (query && !query.includes('*') && query.length < 3) {
        throw new Error('Voer minstens 3 karakters in of gebruik wildcards (*)');
      }

      // Add wildcard search for kenteken
      if (query && query.includes('*')) {
        // For wildcard searches, try to optimize with partial matches if possible
        const queryWithoutWildcards = query.replace(/\*/g, '');
        
        if (queryWithoutWildcards.length >= 2) {
          // Use a LIKE query if we have enough characters
          const likePattern = query.replace(/\*/g, '%');
          params.$where = `kenteken like '${likePattern.toUpperCase()}'`;
          params.$limit = 1000; // Reasonable limit for LIKE queries
        } else {
          // Fallback to large dataset for very broad wildcards
          params.$limit = 10000;
        }
        params.$order = 'kenteken';
        // Don't send kenteken parameter for wildcard searches
      } else if (query && query.length >= 3) {
        // For exact searches, send the normalized kenteken
        params.kenteken = normalizeLicensePlate(query);
      }

      // Add filters
      if (filters.merk) {
        params.merk = filters.merk.toUpperCase();
      }
      if (filters.handelsbenaming) {
        params.handelsbenaming = filters.handelsbenaming.toUpperCase();
      }
      if (filters.kleur) {
        params.eerste_kleur = filters.kleur.toUpperCase();
      }
      if (filters.brandstof) {
        params.brandstof_hoofdsoort = filters.brandstof.toUpperCase();
      }
      if (filters.voertuigsoort) {
        params.voertuigsoort = filters.voertuigsoort;
      }
      if (filters.aantalDeuren) {
        params.aantal_deuren = filters.aantalDeuren;
      }
      if (filters.aantalZitplaatsen) {
        params.aantal_zitplaatsen = filters.aantalZitplaatsen;
      }
      if (filters.aantalCilinders) {
        params.aantal_cilinders = filters.aantalCilinders;
      }
      if (filters.euroKlasse) {
        params.emissiecode_omschrijving = filters.euroKlasse;
      }
      if (filters.zuinigheidslabel) {
        params.zuinigheidslabel = filters.zuinigheidslabel;
      }
      if (filters.roetfilter !== undefined) {
        params.roetfilter = filters.roetfilter ? 'J' : 'N';
      }
      
      // Handle date range filters
      let whereClause = '';
      
      if (filters.bouwjaarVan || filters.bouwjaarTot) {
        if (filters.bouwjaarVan && filters.bouwjaarTot) {
          whereClause = `datum_eerste_toelating between '${filters.bouwjaarVan}0101' and '${filters.bouwjaarTot}1231'`;
        } else if (filters.bouwjaarVan) {
          whereClause = `datum_eerste_toelating >= '${filters.bouwjaarVan}0101'`;
        } else if (filters.bouwjaarTot) {
          whereClause = `datum_eerste_toelating <= '${filters.bouwjaarTot}1231'`;
        }
      }
      
      // Handle cylinder capacity range filters
      if (filters.cilinderinhoudVan || filters.cilinderinhoudTot) {
        const cylinderClause = [];
        if (filters.cilinderinhoudVan) {
          cylinderClause.push(`cilinderinhoud >= ${filters.cilinderinhoudVan}`);
        }
        if (filters.cilinderinhoudTot) {
          cylinderClause.push(`cilinderinhoud <= ${filters.cilinderinhoudTot}`);
        }
        
        if (whereClause) {
          whereClause += ' AND ' + cylinderClause.join(' AND ');
        } else {
          whereClause = cylinderClause.join(' AND ');
        }
      }
      
      if (whereClause) {
        params.$where = whereClause;
      }

      console.log('Search params:', params);

      const response = await rdwApi.get<RdwVehicle[]>(VEHICLES_ENDPOINT, { params });

      let vehicles = response.data.map(rdwVehicle => processVehicleData(rdwVehicle));

      // Apply client-side wildcard filtering if needed (fallback for cases where LIKE didn't work perfectly)
      if (query && query.includes('*')) {
        console.log('Applying wildcard filter:', query);
        console.log('Before filter:', vehicles.length, 'vehicles');
        const normalizedQuery = query.toUpperCase().replace(/-/g, ''); // Remove dashes from query
        
        // Only apply client-side filtering if we didn't use server-side LIKE
        // or if server-side filtering might have missed some edge cases
        const queryWithoutWildcards = query.replace(/\*/g, '');
        const needsClientFiltering = queryWithoutWildcards.length < 2;
        
        if (needsClientFiltering) {
          vehicles = vehicles.filter(vehicle => {
            // Try matching both with and without dashes
            const kenteken1 = vehicle.kenteken; // Original format
            const kenteken2 = vehicle.kenteken.replace(/-/g, ''); // Without dashes
            
            const matches = matchesWildcard(kenteken1, query.toUpperCase()) || 
                           matchesWildcard(kenteken2, normalizedQuery) ||
                           matchesWildcard(kenteken1, normalizedQuery) ||
                           matchesWildcard(kenteken2, query.toUpperCase());
            
            if (matches) {
              console.log('Match found:', vehicle.kenteken, 'matches', query);
            }
            return matches;
          });
        }
        console.log('After filter:', vehicles.length, 'vehicles');
      }

      return vehicles;
    },
    enabled: enabled && (!!query || Object.keys(filters).some(key => filters[key as keyof SearchFilters])),
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
    onSuccess: async (vehicles: ProcessedVehicle[]) => {
      // Log search activity if user is authenticated and there's a meaningful search
      const hasQuery = query && query.trim().length > 0;
      const hasFilters = Object.values(filters).some(value => value !== undefined && value !== '');
      
      if (token && (hasQuery || hasFilters)) {
        try {
          console.log('Logging search activity:', { 
            query: query || '', 
            filters, 
            resultCount: vehicles.length,
            user: 'authenticated'
          });
          await ApiAuthService.logSearch(token, query || '', filters, vehicles.length);
          console.log('Search activity logged successfully');
        } catch (error) {
          console.warn('Failed to log search activity:', error);
          // Don't show error to user - search logging is not critical
        }
      } else {
        console.log('Search logging skipped:', { 
          hasToken: !!token, 
          hasQuery, 
          hasFilters,
          query: query || 'empty',
          filterCount: Object.keys(filters).length
        });
      }
    },
    onError: (error: Error) => {
      addNotification({
        type: 'error',
        title: 'Fout bij zoeken',
        message: error.message,
      });
    },
  });
}

/**
 * Hook voor het ophalen van recall informatie
 */
export function useVehicleRecalls(kenteken: string, enabled = true) {
  return useQuery({
    queryKey: ['recalls', kenteken],
    queryFn: async (): Promise<RdwRecall[]> => {
      if (!kenteken) {
        return [];
      }

      const normalizedKenteken = normalizeLicensePlate(kenteken);
      
      // Haal recall info uit hoofddataset omdat aparte recall endpoints niet meer bestaan
      const vehicleData = await safeRdwApiCall<RdwVehicle>(VEHICLES_ENDPOINT, {
        kenteken: normalizedKenteken,
        $limit: 1,
      });

      if (vehicleData.length === 0) {
        return [];
      }

      const vehicle = vehicleData[0];
      
      // Check openstaande terugroepactie indicator
      if (vehicle.openstaande_terugroepactie_indicator === 'Ja') {
        return [{
          referentiecode_rdw: 'ONBEKEND',
          kenteken: vehicle.kenteken,
          fabrikant: vehicle.merk,
          handelsnaam: vehicle.handelsbenaming,
          beschrijving_probleem: 'Er is een openstaande terugroepactie voor dit voertuig. Neem contact op met de dealer voor details.',
          datum_probleem_geconstateerd: '',
          datum_start_terugroepactie: '',
          datum_einde_terugroepactie: '',
          typegoedkeuring_nummer: vehicle.typegoedkeuring_nummer || '',
          status: 'ACTIEF',
        }];
      }

      return [];
    },
    enabled: enabled && !!kenteken,
    staleTime: 1000 * 60 * 30, // 30 minutes
    cacheTime: 1000 * 60 * 60 * 2, // 2 hours
  });
}

/**
 * Hook voor trekgewicht controle
 */
export function useTrekgewichtCheck() {
  const { addNotification } = useAppStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TrekgewichtCheck): Promise<TrekgewichtResult> => {
      const vehicle = await queryClient.fetchQuery({
        queryKey: ['vehicle', data.kenteken],
        queryFn: async () => {
          const normalizedKenteken = normalizeLicensePlate(data.kenteken);
          
          console.log('Fetching trekgewicht for:', normalizedKenteken);
          
          const response = await rdwApi.get<RdwVehicle[]>(VEHICLES_ENDPOINT, {
            params: {
              kenteken: normalizedKenteken,
              $limit: 1,
            },
          });

          if (!response.data || response.data.length === 0) {
            throw new Error(`Geen voertuig gevonden met kenteken ${data.kenteken}. Probeer een echt Nederlands kenteken.`);
          }

          return processVehicleData(response.data[0]);
        },
      });

      const maximumGewicht = data.heeftRemmen 
        ? vehicle.trekgewicht.geremd 
        : vehicle.trekgewicht.ongeremd;

      // Check if towing weight data is available
      if (maximumGewicht === 0) {
        return {
          toegestaan: false,
          maximumGewicht: 0,
          message: `ℹ️ Geen trekgewicht data beschikbaar - Voor kenteken ${data.kenteken} zijn geen trekhaken specificaties bekend in de RDW database. Dit betekent dat dit voertuig mogelijk geen officiële trekhaak heeft of de gegevens niet geregistreerd zijn.`,
          rdwData: vehicle,
          noData: true,
        };
      }

      const toegestaan = data.gewensteAanhangergewicht <= maximumGewicht;

      let message: string;
      if (toegestaan) {
        message = `✅ Toegestaan - Dit voertuig mag ${data.gewensteAanhangergewicht}kg trekken ${data.heeftRemmen ? '(geremd)' : '(ongeremd)'}`;
      } else {
        const type = data.heeftRemmen ? 'geremd' : 'ongeremd';
        message = `❌ Niet toegestaan - Maximum ${type} trekgewicht is ${maximumGewicht}kg, maar u wilt ${data.gewensteAanhangergewicht}kg trekken`;
      }

      return {
        toegestaan,
        maximumGewicht,
        message,
        rdwData: vehicle,
      };
    },
    onSuccess: (result) => {
      const type = result.toegestaan ? 'success' : 'warning';
      addNotification({
        type,
        title: 'Trekgewicht controle voltooid',
        message: result.message,
      });
    },
    onError: (error: Error) => {
      addNotification({
        type: 'error',
        title: 'Fout bij trekgewicht controle',
        message: error.message,
      });
    },
  });
}

/**
 * Hook voor het ophalen van unieke merken voor autocomplete
 */
export function useVehicleBrands(enabled = true) {
  return useQuery({
    queryKey: ['vehicleBrands'],
    queryFn: async (): Promise<string[]> => {
      // Bekende Nederlandse automerken die altijd beschikbaar moeten zijn
      const knownBrands = [
        'ALFA ROMEO', 'AUDI', 'BMW', 'CHEVROLET', 'CITROEN', 'DACIA', 'FIAT',
        'FORD', 'HONDA', 'HYUNDAI', 'JAGUAR', 'KIA', 'LANCIA', 'LEXUS',
        'MAZDA', 'MERCEDES-BENZ', 'MINI', 'MITSUBISHI', 'NISSAN', 'OPEL',
        'PEUGEOT', 'RENAULT', 'SEAT', 'SKODA', 'SUBARU', 'SUZUKI', 'TOYOTA',
        'VOLKSWAGEN', 'VOLVO', 'SMART', 'PORSCHE', 'LAND ROVER', 'JEEP',
        'TESLA', 'SAAB', 'CHRYSLER', 'CADILLAC', 'BUICK', 'LINCOLN'
      ];

      // Haal ook data op van de API voor minder bekende merken
      try {
        const response = await rdwApi.get<RdwVehicle[]>(VEHICLES_ENDPOINT, {
          params: {
            $limit: 5000, // Reasonable limit to get diverse brand sample
            $order: 'merk',
            $where: 'merk IS NOT NULL',
          },
        });

        // Client-side deduplication to get unique brands
        const brandsSet = new Set<string>(knownBrands);
        response.data.forEach(item => {
          if (item.merk && item.merk.trim()) {
            brandsSet.add(item.merk.trim());
          }
        });

        return Array.from(brandsSet).sort();
      } catch (error) {
        // Fallback to known brands if API fails
        console.warn('Failed to fetch brands from API, using known brands only', error);
        return knownBrands.sort();
      }
    },
    enabled,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

/**
 * Hook voor het ophalen van kleuren voor filters
 */
export function useVehicleColors(enabled = true) {
  return useQuery({
    queryKey: ['vehicleColors'],
    queryFn: async (): Promise<string[]> => {
      const response = await rdwApi.get<Array<{ eerste_kleur: string }>>(VEHICLES_ENDPOINT, {
        params: {
          $select: 'eerste_kleur',
          $group: 'eerste_kleur',
          $limit: 50,
          $order: 'eerste_kleur',
        },
      });

      return response.data
        .map(item => item.eerste_kleur)
        .filter(Boolean)
        .sort();
    },
    enabled,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

/**
 * Utility hook voor batch operaties
 */
export function useBatchVehicleLookup() {
  const { addNotification } = useAppStore();

  return useMutation({
    mutationFn: async (kentekens: string[]): Promise<ProcessedVehicle[]> => {
      const results: ProcessedVehicle[] = [];
      const batchSize = 10; // Process in batches to avoid rate limiting

      for (let i = 0; i < kentekens.length; i += batchSize) {
        const batch = kentekens.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (kenteken) => {
          try {
            const normalizedKenteken = normalizeLicensePlate(kenteken);
            const response = await rdwApi.get<RdwVehicle[]>(VEHICLES_ENDPOINT, {
              params: {
                kenteken: normalizedKenteken,
                $limit: 1,
              },
            });

            if (response.data && response.data.length > 0) {
              return processVehicleData(response.data[0]);
            }
            return null;
          } catch {
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.filter(Boolean) as ProcessedVehicle[]);

        // Small delay between batches
        if (i + batchSize < kentekens.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return results;
    },
    onSuccess: (results) => {
      addNotification({
        type: 'success',
        title: 'Batch lookup voltooid',
        message: `${results.length} voertuigen gevonden`,
      });
    },
    onError: (error: Error) => {
      addNotification({
        type: 'error',
        title: 'Fout bij batch lookup',
        message: error.message,
      });
    },
  });
}

// NEW 2025 API HOOKS

/**
 * Hook voor APK vervaldatum (nieuwe endpoint)
 */
export function useVehicleApkExpiry(kenteken: string, enabled = true) {
  return useQuery({
    queryKey: ['apkExpiry', kenteken],
    queryFn: async (): Promise<RdwApkExpiryData[]> => {
      if (!kenteken) {
        return [];
      }

      const normalizedKenteken = normalizeLicensePlate(kenteken);
      
      return await safeRdwApiCall<RdwApkExpiryData>(APK_EXPIRY_ENDPOINT, {
        kenteken: normalizedKenteken,
        $limit: 10,
      });
    },
    enabled: enabled && !!kenteken,
    staleTime: 1000 * 60 * 30,
    cacheTime: 1000 * 60 * 60,
  });
}

/**
 * Hook voor APK keuringshistorie (nieuwe endpoint)
 */
export function useVehicleApkHistoryNew(kenteken: string, enabled = true) {
  return useQuery({
    queryKey: ['apkHistoryNew', kenteken],
    queryFn: async (): Promise<RdwApkHistoryData[]> => {
      if (!kenteken) {
        return [];
      }

      const normalizedKenteken = normalizeLicensePlate(kenteken);
      
      return await safeRdwApiCall<RdwApkHistoryData>(APK_HISTORY_ENDPOINT, {
        kenteken: normalizedKenteken,
        $limit: 50,
        $order: 'datum_afgifte_apk DESC',
      });
    },
    enabled: enabled && !!kenteken,
    staleTime: 1000 * 60 * 30,
    cacheTime: 1000 * 60 * 60,
  });
}

/**
 * Hook voor milieu/emissie/verbruik gegevens (nieuwe endpoint)
 */
export function useVehicleEnvironmentData(kenteken: string, enabled = true) {
  return useQuery({
    queryKey: ['environmentData', kenteken],
    queryFn: async (): Promise<RdwEnvironmentData[]> => {
      if (!kenteken) {
        return [];
      }

      const normalizedKenteken = normalizeLicensePlate(kenteken);
      
      return await safeRdwApiCall<RdwEnvironmentData>(EMISSIONS_ENDPOINT, {
        kenteken: normalizedKenteken,
        $limit: 10,
      });
    },
    enabled: enabled && !!kenteken,
    staleTime: 1000 * 60 * 30,
    cacheTime: 1000 * 60 * 60,
  });
}

/**
 * Hook voor technische gegevens (nieuwe endpoint)
 */
export function useVehicleTechnicalData(kenteken: string, enabled = true) {
  return useQuery({
    queryKey: ['technicalData', kenteken],
    queryFn: async (): Promise<RdwTechnicalData[]> => {
      if (!kenteken) {
        return [];
      }

      const normalizedKenteken = normalizeLicensePlate(kenteken);
      
      return await safeRdwApiCall<RdwTechnicalData>(TECHNICAL_ENDPOINT, {
        kenteken: normalizedKenteken,
        $limit: 10,
      });
    },
    enabled: enabled && !!kenteken,
    staleTime: 1000 * 60 * 30,
    cacheTime: 1000 * 60 * 60,
  });
}

/**
 * Hook voor brandstofinfo (nieuwe endpoint)
 */
export function useVehicleFuelDataNew(kenteken: string, enabled = true) {
  return useQuery({
    queryKey: ['fuelDataNew', kenteken],
    queryFn: async (): Promise<RdwFuelData[]> => {
      if (!kenteken) {
        return [];
      }

      const normalizedKenteken = normalizeLicensePlate(kenteken);
      
      return await safeRdwApiCall<RdwFuelData>(FUEL_ENDPOINT, {
        kenteken: normalizedKenteken,
        $limit: 10,
      });
    },
    enabled: enabled && !!kenteken,
    staleTime: 1000 * 60 * 30,
    cacheTime: 1000 * 60 * 60,
  });
}

/**
 * Hook voor motorrijtuigenbelasting (algemeen, niet kentekengebonden)
 */
export function useRoadTaxData(enabled = true) {
  return useQuery({
    queryKey: ['roadTaxData'],
    queryFn: async (): Promise<RdwRoadTaxData[]> => {
      return await safeRdwApiCall<RdwRoadTaxData>(ROAD_TAX_ENDPOINT, {
        $limit: 1000,
        $order: 'wegenbelasting_jaar DESC',
      });
    },
    enabled,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

/**
 * Hook voor specifieke carrosserie gegevens (jhie-znh9.json)
 */
export function useVehicleCarrosserieSpecific(kenteken: string, enabled = true) {
  return useQuery({
    queryKey: ['carrosserieSpecific', kenteken],
    queryFn: async (): Promise<RdwCarrosserieSpecificData[]> => {
      if (!kenteken) {
        return [];
      }

      const normalizedKenteken = normalizeLicensePlate(kenteken);
      
      return await safeRdwApiCall<RdwCarrosserieSpecificData>(CARROSSERIE_SPECIFIC_ENDPOINT, {
        kenteken: normalizedKenteken,
        $limit: 10,
      });
    },
    enabled: enabled && !!kenteken,
    staleTime: 1000 * 60 * 30,
    cacheTime: 1000 * 60 * 60,
  });
}

/**
 * Hook voor voertuigklasse gegevens (kmfi-hrps.json)
 */
export function useVehicleClass(kenteken: string, enabled = true) {
  return useQuery({
    queryKey: ['vehicleClass', kenteken],
    queryFn: async (): Promise<RdwVoertuigklasseData[]> => {
      if (!kenteken) {
        return [];
      }

      const normalizedKenteken = normalizeLicensePlate(kenteken);
      
      return await safeRdwApiCall<RdwVoertuigklasseData>(VOERTUIGKLASSE_ENDPOINT, {
        kenteken: normalizedKenteken,
        $limit: 10,
      });
    },
    enabled: enabled && !!kenteken,
    staleTime: 1000 * 60 * 30,
    cacheTime: 1000 * 60 * 60,
  });
}

/**
 * 🎯 COMPLETE RDW DATA COMBINER
 * Combineert alle beschikbare RDW API endpoints tot één overzichtelijk resultaat
 * Gebruikt bestaande, geteste hooks voor betrouwbaarheid
 */
export function useCompleteRdwData(kenteken: string, enabled = true) {
  // Gebruik bestaande hooks
  const vehicleQuery = useVehicleByLicensePlate(kenteken, enabled);
  const apkHistoryQuery = useVehicleApkHistory(kenteken, enabled && !!kenteken);
  const fuelDataQuery = useVehicleFuelData(kenteken, enabled && !!kenteken);
  const bodyDataQuery = useVehicleBodyData(kenteken, enabled && !!kenteken);
  const axlesDataQuery = useVehicleAxlesData(kenteken, enabled && !!kenteken);
  const recallsQuery = useVehicleRecalls(kenteken, enabled && !!kenteken);
  const carrosserieSpecificQuery = useVehicleCarrosserieSpecific(kenteken, enabled && !!kenteken);

  return useQuery({
    queryKey: ['completeRdwData', kenteken],
    queryFn: async () => {
      if (!kenteken) {
        throw new Error('Kenteken is verplicht');
      }

      // Wacht tot alle queries klaar zijn
      const vehicle = vehicleQuery.data;
      const apkHistorie = apkHistoryQuery.data || [];
      const fuelData = fuelDataQuery.data || [];
      const bodyData = bodyDataQuery.data || [];
      const axlesData = axlesDataQuery.data || [];
      const recalls = recallsQuery.data || [];
      const carrosserieSpecific = carrosserieSpecificQuery.data || [];

      if (!vehicle) {
        throw new Error(`Geen voertuig gevonden met kenteken ${kenteken}`);
      }

      // Combineer alle data tot één overzichtelijk object (zoals jouw voorbeeld)
      const completeVehicleInfo = {
        // 📋 BASIS INFORMATIE
        kenteken: vehicle.kenteken,
        merk: vehicle.merk,
        model: vehicle.model,
        uitvoering: bodyData[0]?.type_carrosserie_nederlands || '',
        bouwjaar: vehicle.bouwjaar,
        datumEersteToelating: vehicle.datumEersteToelating,
        
        // 🔋 BRANDSTOF & AANDRIJVING
        brandstof: vehicle.brandstof,
        brandstofDetails: fuelData.map(f => f.brandstof_omschrijving).join(', '),
        
        // 🛡️ APK INFORMATIE
        apkVervaldatum: vehicle.apkGeldigTot ? vehicle.apkGeldigTot.toISOString().split('T')[0] : null,
        apkVerlooptBinnenkort: vehicle.apkVerlooptBinnenkort,
        apkHistorie: apkHistorie.slice(0, 10),
        
        // 🌍 MILIEU & EMISSIES
        co2Uitstoot: vehicle.milieu.co2Uitstoot,
        euroNorm: vehicle.milieu.euroKlasse,
        zuinigheidslabel: vehicle.milieu.zuinigheidslabel,
        roetfilter: vehicle.milieu.roetfilter,
        
        // ⛽ VERBRUIK (uit milieu data indien beschikbaar)
        verbruikGecombineerd: vehicle.milieu.verbruikGecombineerd ? `${vehicle.milieu.verbruikGecombineerd} l/100km` : '',
        verbruikStad: vehicle.milieu.verbruikStad ? `${vehicle.milieu.verbruikStad} l/100km` : '',
        verbruikBuiten: vehicle.milieu.verbruikBuiten ? `${vehicle.milieu.verbruikBuiten} l/100km` : '',
        
        // ⚖️ MASSA & GEWICHTEN
        massaLedig: vehicle.massa.ledig,
        massaRijklaar: vehicle.massa.rijklaar,
        massaMaximum: vehicle.massa.technischMaximum,
        
        // 🚛 TREKGEWICHT
        trekgewichtOngeremd: vehicle.trekgewicht.ongeremd,
        trekgewichtGeremd: vehicle.trekgewicht.geremd,
        
        // 📐 AFMETINGEN
        lengte: vehicle.afmetingen.lengte,
        breedte: vehicle.afmetingen.breedte,
        hoogte: vehicle.afmetingen.hoogte,
        
        // 🔧 MOTOR & TECHNIEK
        cilinderinhoud: vehicle.motor.cilinderinhoud,
        vermogen: vehicle.motor.vermogen,
        aantalCilinders: vehicle.motor.cilinders,
        
        // 🎨 UITERLIJK
        kleur: vehicle.kleur,
        
        // 🏗️ CARROSSERIE
        voertuigsoort: vehicle.voertuigsoort,
        carrosserieOmschrijving: bodyData[0]?.type_carrosserie_europese_omschrijving || 
                                 carrosserieSpecific[0]?.carrosserie_voertuig_nummer_europese_omschrijving || '',
        
        // ⚠️ WAARSCHUWINGEN
        openstaandeTerugroepactie: vehicle.hasRecall,
        recalls: recalls,
        
        // 🛞 ASSEN & BANDEN
        assen: axlesData,
        
        // 📊 METADATA
        laatsteUpdate: new Date().toISOString(),
        source: {
          voertuiggegevens: `${VEHICLES_ENDPOINT}?kenteken=${kenteken}`,
          apkHistorie: `${APK_ENDPOINT}?kenteken=${kenteken}`,
          carrosserie: `${CARROSSERIE_ENDPOINT}?kenteken=${kenteken}`,
          brandstofData: `${BRANDSTOF_ENDPOINT}?kenteken=${kenteken}`,
          assenData: `${ASSEN_ENDPOINT}?kenteken=${kenteken}`,
          recalls: `${RECALLS_ENDPOINT}?kenteken=${kenteken}`,
        }
      };

      console.log('✅ Complete RDW data combined:', completeVehicleInfo);
      return completeVehicleInfo;
    },
    enabled: enabled && !!kenteken && vehicleQuery.isSuccess,
    staleTime: 1000 * 60 * 15, // 15 minutes
    cacheTime: 1000 * 60 * 60, // 1 hour
  });
}



