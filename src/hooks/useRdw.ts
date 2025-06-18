import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { processVehicleData } from '@/utils/dataProcessing';
import { normalizeLicensePlate, matchesWildcard } from '@/utils/licensePlate';
import { useAppStore } from '@/store/useAppStore';
import type { 
  RdwVehicle, 
  RdwRecall, 
  ProcessedVehicle, 
  SearchFilters, 
  TrekgewichtCheck,
  TrekgewichtResult 
} from '@/types/rdw';

// RDW API Base URLs - direct access (RDW supports CORS)
const RDW_BASE_URL = 'https://opendata.rdw.nl/resource';
const VEHICLES_ENDPOINT = `${RDW_BASE_URL}/m9d7-ebf2.json`;
const RECALLS_ENDPOINT = `${RDW_BASE_URL}/t3ee-brg3.json`;

// Create axios instance with default config
const rdwApi = axios.create({
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
  },
});

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
      
      const response = await rdwApi.get<RdwVehicle[]>(VEHICLES_ENDPOINT, {
        params: {
          kenteken: normalizedKenteken,
          $limit: 1,
        },
      });

      console.log('RDW API response:', response.data);

      if (!response.data || response.data.length === 0) {
        throw new Error(`Geen voertuig gevonden met kenteken ${kenteken}. Probeer een echt Nederlands kenteken.`);
      }

      const vehicle = processVehicleData(response.data[0]);
      
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
  const { addNotification } = useAppStore();

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

      let vehicles = response.data.map(processVehicleData);

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
  const { addNotification } = useAppStore();

  return useQuery({
    queryKey: ['recalls', kenteken],
    queryFn: async (): Promise<RdwRecall[]> => {
      if (!kenteken) {
        return [];
      }

      const normalizedKenteken = normalizeLicensePlate(kenteken);
      
      const response = await rdwApi.get<RdwRecall[]>(RECALLS_ENDPOINT, {
        params: {
          kenteken: normalizedKenteken,
          $limit: 50,
        },
      });

      return response.data || [];
    },
    enabled: enabled && !!kenteken,
    staleTime: 1000 * 60 * 30, // 30 minutes
    cacheTime: 1000 * 60 * 60 * 2, // 2 hours
    onError: (error: Error) => {
      addNotification({
        type: 'error',
        title: 'Fout bij ophalen recall informatie',
        message: error.message,
      });
    },
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