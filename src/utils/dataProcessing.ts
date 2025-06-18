import { format, parseISO, differenceInDays, isValid } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { RdwVehicle, ProcessedVehicle, Milieuzone, Province } from '@/types/rdw';

/**
 * Converteert RDW API data naar UI-vriendelijke data
 */
export function processVehicleData(rdwData: RdwVehicle): ProcessedVehicle {
  const apkDate = parseRdwDate(rdwData.apk_geldig_tot);
  const datumEersteToelating = parseRdwDate(rdwData.datum_eerste_toelating);
  const today = new Date();
  // const twoMonthsFromNow = addMonths(today, 2);

  // Debug logging voor brandstof detectie
  console.log('🔍 RDW RAW DATA voor', rdwData.kenteken, ':', {
    brandstof_hoofdsoort: rdwData.brandstof_hoofdsoort,
    brandstof_nevensoort: rdwData.brandstof_nevensoort,
    all_brandstof_fields: Object.keys(rdwData).filter(key => key.toLowerCase().includes('brandstof')),
    normalized: normalizeFuelType(rdwData.brandstof_hoofdsoort)
  });
  
  // Log hele object als brandstof hoofdsoort leeg is
  if (!rdwData.brandstof_hoofdsoort) {
    console.log('⚠️ GEEN BRANDSTOF DATA - Volledige RDW object:', rdwData);
  }

  return {
    kenteken: rdwData.kenteken,
    merk: rdwData.merk || 'Onbekend',
    model: rdwData.handelsbenaming || rdwData.type_uitvoering || 'Onbekend',
    bouwjaar: extractYear(rdwData.datum_eerste_toelating),
    datumEersteToelating: datumEersteToelating,
    brandstof: normalizeFuelType(rdwData.brandstof_hoofdsoort || rdwData.brandstof_nevensoort),
    kleur: normalizeColor(rdwData.eerste_kleur),
    voertuigsoort: rdwData.voertuigsoort || 'Personenauto',
    eerste_kleur: rdwData.eerste_kleur || 'Onbekend',
    apkGeldigTot: apkDate,
    apkVerlooptBinnenkort: apkDate ? differenceInDays(apkDate, today) <= 60 : false,
    massa: {
      ledig: parseNumber(rdwData.massa_ledig_voertuig),
      rijklaar: parseNumber(rdwData.massa_rijklaar),
      technischMaximum: parseNumber(rdwData.technische_max_massa_voertuig),
    },
    trekgewicht: {
      ongeremd: parseNumber(rdwData.maximum_massa_trekken_ongeremd),
      geremd: parseNumber(rdwData.maximum_trekken_massa_geremd),
    },
    milieu: {
      euroKlasse: rdwData.euro_klasse || 'Onbekend',
      co2Uitstoot: parseNumber(rdwData.uitstoot_co2_gecombineerd),
      zuinigheidslabel: rdwData.zuinigheidslabel || '',
      roetfilter: rdwData.roetfilter === 'Ja',
    },
    motor: {
      cilinderinhoud: parseNumber(rdwData.cilinderinhoud),
      vermogen: parseNumber(rdwData.nettomaximumvermogen),
      cilinders: parseNumber(rdwData.aantal_cilinders),
    },
    afmetingen: {
      lengte: parseNumber(rdwData.lengte),
      breedte: parseNumber(rdwData.breedte),
      hoogte: parseNumber(rdwData.hoogte),
    },
    hasRecall: rdwData.openstaande_terugroepactie_indicator === 'Ja',
  };
}

/**
 * Parseert een RDW datum string naar Date object
 */
function parseRdwDate(dateString: string): Date | null {
  if (!dateString || dateString === '0' || dateString === '') {
    return null;
  }

  try {
    // RDW gebruikt YYYYMMDD formaat
    if (dateString.length === 8 && /^\d{8}$/.test(dateString)) {
      const year = parseInt(dateString.substring(0, 4));
      const month = parseInt(dateString.substring(4, 6)) - 1; // JavaScript months zijn 0-indexed
      const day = parseInt(dateString.substring(6, 8));
      const date = new Date(year, month, day);
      return isValid(date) ? date : null;
    }

    // Probeer ISO datum
    const isoDate = parseISO(dateString);
    return isValid(isoDate) ? isoDate : null;
  } catch {
    return null;
  }
}

/**
 * Extraheert jaar uit datum string
 */
function extractYear(dateString: string): number {
  const date = parseRdwDate(dateString);
  return date ? date.getFullYear() : 0;
}

/**
 * Parseert nummer uit string, retourneert 0 als niet geldig
 */
function parseNumber(value: string | null | undefined): number {
  if (!value || value === '0' || value === '' || value === null || value === undefined) {
    return 0;
  }
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Normaliseert brandstof type naar leesbare naam
 */
function normalizeFuelType(fuelType: string): string {
  if (!fuelType) return 'Onbekend';
  
  const fuelMap: Record<string, string> = {
    'Benzine': 'Benzine',
    'BENZINE': 'Benzine',
    'Diesel': 'Diesel',
    'DIESEL': 'Diesel',
    'LPG': 'LPG',
    'Elektriciteit': 'Elektrisch',
    'ELEKTRICITEIT': 'Elektrisch',
    'Elektrisch': 'Elektrisch',
    'ELEKTRISCH': 'Elektrisch',
    'Electric': 'Elektrisch',
    'ELECTRIC': 'Elektrisch',
    'Waterstof': 'Waterstof',
    'WATERSTOF': 'Waterstof',
    'CNG': 'CNG',
    'Hybride': 'Hybride',
    'HYBRIDE': 'Hybride',
    'Alcohol': 'Alcohol',
    'ALCOHOL': 'Alcohol',
    // Mogelijke andere varianten
    'Gas': 'LPG',
    'GAS': 'LPG',
    'Autogas': 'LPG',
    'AUTOGAS': 'LPG',
    'LNG': 'LNG',
    'Aardgas': 'CNG',
    'AARDGAS': 'CNG',
  };

  // Eerst proberen exact match
  if (fuelMap[fuelType]) {
    return fuelMap[fuelType];
  }
  
  // Dan proberen case-insensitive match
  const upperFuel = fuelType.toUpperCase();
  for (const [key, value] of Object.entries(fuelMap)) {
    if (key.toUpperCase() === upperFuel) {
      return value;
    }
  }

  return fuelType || 'Onbekend';
}

/**
 * Normaliseert kleur naar Nederlandse naam
 */
function normalizeColor(color: string): string {
  const colorMap: Record<string, string> = {
    'ZWART': 'Zwart',
    'WIT': 'Wit',
    'GRIJS': 'Grijs',
    'ZILVER': 'Zilver',
    'BLAUW': 'Blauw',
    'ROOD': 'Rood',
    'GROEN': 'Groen',
    'GEEL': 'Geel',
    'ORANJE': 'Oranje',
    'BRUIN': 'Bruin',
    'PAARS': 'Paars',
    'ROZE': 'Roze',
  };

  return colorMap[color?.toUpperCase()] || color || 'Onbekend';
}

/**
 * Formatteert datum voor weergave
 */
export function formatDate(date: Date | null, includeRelative = false): string {
  if (!date) return 'Onbekend';

  const formatted = format(date, 'dd MMM yyyy', { locale: nl });
  
  if (includeRelative) {
    const today = new Date();
    const daysFromNow = differenceInDays(date, today);
    
    if (daysFromNow < 0) {
      return `${formatted} (${Math.abs(daysFromNow)} dagen geleden)`;
    } else if (daysFromNow <= 30) {
      return `${formatted} (over ${daysFromNow} dagen)`;
    }
  }

  return formatted;
}

/**
 * Milieuzone data en checker functionaliteit
 */
export const MILIEUZONES: Milieuzone[] = [
  {
    stad: 'Amsterdam',
    type: 'ultra',
    beschrijving: 'Ultra Low Emission Zone',
    toegestaneEuroKlasses: ['Euro 6', 'Euro VI'],
  },
  {
    stad: 'Rotterdam',
    type: 'groen',
    beschrijving: 'Groene zone - Euro 4 en hoger',
    toegestaneEuroKlasses: ['Euro 4', 'Euro 5', 'Euro 6', 'Euro IV', 'Euro V', 'Euro VI'],
  },
  {
    stad: 'Den Haag',
    type: 'groen',
    beschrijving: 'Groene zone - Euro 4 en hoger',
    toegestaneEuroKlasses: ['Euro 4', 'Euro 5', 'Euro 6', 'Euro IV', 'Euro V', 'Euro VI'],
  },
  {
    stad: 'Utrecht',
    type: 'groen',
    beschrijving: 'Groene zone - Euro 4 en hoger',
    toegestaneEuroKlasses: ['Euro 4', 'Euro 5', 'Euro 6', 'Euro IV', 'Euro V', 'Euro VI'],
  },
];

/**
 * Controleert of voertuig milieuzone mag inrijden
 */
export function checkMilieuzone(vehicle: ProcessedVehicle, stad: string): {
  toegestaan: boolean;
  zone: Milieuzone | null;
  reden: string;
} {
  const zone = MILIEUZONES.find(z => z.stad.toLowerCase() === stad.toLowerCase());
  
  if (!zone) {
    return {
      toegestaan: true,
      zone: null,
      reden: 'Geen milieuzone gedefinieerd voor deze stad',
    };
  }

  // Alleen diesel voertuigen worden gecontroleerd in milieuzones
  if (vehicle.brandstof !== 'Diesel') {
    return {
      toegestaan: true,
      zone,
      reden: 'Niet-diesel voertuigen zijn toegestaan',
    };
  }

  const isToegestaan = zone.toegestaneEuroKlasses.includes(vehicle.milieu.euroKlasse);

  return {
    toegestaan: isToegestaan,
    zone,
    reden: isToegestaan 
      ? `${vehicle.milieu.euroKlasse} is toegestaan in ${zone.beschrijving}`
      : `${vehicle.milieu.euroKlasse} is niet toegestaan in ${zone.beschrijving}. Minimaal ${zone.toegestaneEuroKlasses[0]} vereist.`,
  };
}

/**
 * Nederlandse provincies met BPM toeslag percentages
 */
export const PROVINCES: Province[] = [
  { code: 'DR', name: 'Drenthe', toeslagPercentage: 0 },
  { code: 'FL', name: 'Flevoland', toeslagPercentage: 0 },
  { code: 'FR', name: 'Friesland', toeslagPercentage: 0 },
  { code: 'GD', name: 'Gelderland', toeslagPercentage: 0 },
  { code: 'GR', name: 'Groningen', toeslagPercentage: 0 },
  { code: 'LB', name: 'Limburg', toeslagPercentage: 0 },
  { code: 'NB', name: 'Noord-Brabant', toeslagPercentage: 0 },
  { code: 'NH', name: 'Noord-Holland', toeslagPercentage: 7.5 },
  { code: 'OV', name: 'Overijssel', toeslagPercentage: 0 },
  { code: 'UT', name: 'Utrecht', toeslagPercentage: 0 },
  { code: 'ZH', name: 'Zuid-Holland', toeslagPercentage: 25 },
  { code: 'ZE', name: 'Zeeland', toeslagPercentage: 0 },
];

/**
 * Berekent BPM/MRB voor voertuig
 */
export function calculateBpm(vehicle: ProcessedVehicle, provinceCode: string): {
  basisBpm: number;
  provincialeToeslag: number;
  totaalBpm: number;
  kwartaalBedrag: number;
  provincie: Province | null;
} {
  const provincie = PROVINCES.find(p => p.code === provinceCode);
  
  if (!provincie) {
    return {
      basisBpm: 0,
      provincialeToeslag: 0,
      totaalBpm: 0,
      kwartaalBedrag: 0,
      provincie: null,
    };
  }

  // Basis BPM berekening op basis van massa en brandstof
  let basisBpm = 0;
  const massa = vehicle.massa.rijklaar || vehicle.massa.ledig || 1500; // Fallback massa

  // Debug logging voor BPM berekening
  console.log('BPM berekening:', {
    kenteken: vehicle.kenteken,
    brandstof: vehicle.brandstof,
    massa: massa,
    rijklaar: vehicle.massa.rijklaar,
    ledig: vehicle.massa.ledig,
    provincie: provinceCode
  });

  if (vehicle.brandstof === 'Diesel') {
    // Diesel: hoger tarief (€0.192 per kg + minimum €84)
    basisBpm = Math.max(84, massa * 0.192);
  } else if (vehicle.brandstof === 'Benzine') {
    // Benzine: standaard tarief (€0.158 per kg + minimum €84)
    basisBpm = Math.max(84, massa * 0.158);
  } else if (vehicle.brandstof === 'Elektrisch') {
    // Elektrisch: vast lage tarief (alleen minimum tarief)
    basisBpm = 84;
  } else if (vehicle.brandstof === 'LPG') {
    // LPG: lager tarief (€0.126 per kg + minimum €84)
    basisBpm = Math.max(84, massa * 0.126);
  } else if (vehicle.brandstof === 'Hybride') {
    // Hybride: tussen benzine en elektrisch (€0.134 per kg + minimum €84)
    basisBpm = Math.max(84, massa * 0.134);
  } else if (vehicle.brandstof === 'Waterstof') {
    // Waterstof: zeer laag tarief (alleen minimum tarief)
    basisBpm = 84;
  } else if (vehicle.brandstof === 'CNG' || vehicle.brandstof === 'LNG') {
    // CNG/LNG: lager tarief (€0.126 per kg + minimum €84)
    basisBpm = Math.max(84, massa * 0.126);
  } else {
    // Overig: standaard tarief
    basisBpm = Math.max(84, massa * 0.158);
  }

  const provincialeToeslag = (basisBpm * provincie.toeslagPercentage) / 100;
  const totaalBpm = basisBpm + provincialeToeslag;
  const kwartaalBedrag = totaalBpm / 4;

  // Debug logging voor eindresultaat
  console.log('BPM resultaat:', {
    kenteken: vehicle.kenteken,
    basisBpm: Math.round(basisBpm),
    provincialeToeslag: Math.round(provincialeToeslag),
    totaalBpm: Math.round(totaalBpm),
    kwartaalBedrag: Math.round(kwartaalBedrag)
  });

  return {
    basisBpm: Math.round(basisBpm),
    provincialeToeslag: Math.round(provincialeToeslag),
    totaalBpm: Math.round(totaalBpm),
    kwartaalBedrag: Math.round(kwartaalBedrag),
    provincie,
  };
}

/**
 * Genereert CSV data voor export
 */
export function generateCsvData(vehicles: ProcessedVehicle[]): string {
  const headers = [
    'Kenteken',
    'Merk',
    'Model',
    'Bouwjaar',
    'Brandstof',
    'Kleur',
    'APK Geldig Tot',
    'CO2 Uitstoot',
    'Massa (kg)',
    'Trekgewicht Geremd (kg)',
    'Euro Klasse',
  ];

  const rows = vehicles.map(vehicle => [
    vehicle.kenteken,
    vehicle.merk,
    vehicle.model,
    vehicle.bouwjaar.toString(),
    vehicle.brandstof,
    vehicle.kleur,
    vehicle.apkGeldigTot ? formatDate(vehicle.apkGeldigTot) : 'Onbekend',
    vehicle.milieu.co2Uitstoot.toString(),
    vehicle.massa.rijklaar.toString(),
    vehicle.trekgewicht.geremd.toString(),
    vehicle.milieu.euroKlasse,
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
} 