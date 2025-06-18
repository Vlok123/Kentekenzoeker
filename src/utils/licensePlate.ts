/**
 * Nederlandse kenteken validatie en formatting utilities
 */

// Nederlandse kenteken patronen
/*
const LICENSE_PLATE_PATTERNS = [
  /^[A-Z]{2}-[0-9]{2}-[0-9]{2}$/, // XX-99-99
  /^[0-9]{2}-[A-Z]{2}-[0-9]{2}$/, // 99-XX-99
  /^[0-9]{2}-[0-9]{2}-[A-Z]{2}$/, // 99-99-XX
  /^[A-Z]{2}-[0-9]{3}-[A-Z]{1}$/, // XX-999-X
  /^[A-Z]{1}-[0-9]{3}-[A-Z]{2}$/, // X-999-XX
  /^[0-9]{1}-[A-Z]{3}-[0-9]{2}$/, // 9-XXX-99
  /^[0-9]{3}-[A-Z]{2}-[0-9]{1}$/, // 999-XX-9
  /^[A-Z]{3}-[0-9]{2}-[A-Z]{1}$/, // XXX-99-X
  /^[0-9]{2}-[A-Z]{3}-[0-9]{1}$/, // 99-XXX-9
  /^[0-9]{1}-[A-Z]{2}-[0-9]{3}$/, // 9-XX-999
  /^[A-Z]{1}-[0-9]{2}-[A-Z]{3}$/, // X-99-XXX
  /^[A-Z]{2}-[A-Z]{2}-[0-9]{2}$/, // XX-XX-99
  /^[0-9]{2}-[A-Z]{2}-[A-Z]{2}$/, // 99-XX-XX
  /^[A-Z]{2}-[0-9]{2}-[A-Z]{2}$/, // XX-99-XX
];
*/

/**
 * Formatteert een kenteken naar Nederlandse standaard (uppercase, met streepjes)
 * Nu veel flexibeler voor alle RDW kentekentypes
 */
export function formatLicensePlate(input: string): string {
  // Verwijder alle spaties en streepjes, maak uppercase
  const cleaned = input.replace(/[\s-]/g, '').toUpperCase();
  
  if (cleaned.length < 4 || cleaned.length > 8) {
    return cleaned; // Retourneer schoon formaat voor RDW opzoeken
  }

  // Probeer eerst de standaard patronen
  if (cleaned.length === 6) {
    // Meest voorkomende patronen
    if (/^[A-Z]{2}[0-9]{4}$/.test(cleaned)) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 6)}`;
    }
    if (/^[0-9]{2}[A-Z]{2}[0-9]{2}$/.test(cleaned)) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 6)}`;
    }
    if (/^[0-9]{4}[A-Z]{2}$/.test(cleaned)) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 6)}`;
    }
    if (/^[A-Z]{4}[0-9]{2}$/.test(cleaned)) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 6)}`;
    }
    if (/^[A-Z]{2}[0-9]{2}[A-Z]{2}$/.test(cleaned)) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 6)}`;
    }
    // Fallback voor 6-karakter kentekens
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 6)}`;
  }

  if (cleaned.length === 7) {
    // 7-karakter patronen
    if (/^[A-Z]{2}[0-9]{3}[A-Z]{1}$/.test(cleaned)) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5, 6)}`;
    }
    if (/^[A-Z]{1}[0-9]{3}[A-Z]{2}$/.test(cleaned)) {
      return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 4)}-${cleaned.slice(4, 6)}`;
    }
    if (/^[0-9]{1}[A-Z]{3}[0-9]{2}$/.test(cleaned)) {
      return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 4)}-${cleaned.slice(4, 6)}`;
    }
    if (/^[0-9]{3}[A-Z]{2}[0-9]{1}$/.test(cleaned)) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 6)}`;
    }
    // Fallback voor 7-karakter kentekens
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5, 6)}`;
  }

  if (cleaned.length === 8) {
    // 8-karakter patronen
    if (/^[A-Z]{3}[0-9]{2}[A-Z]{1}$/.test(cleaned)) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 6)}`;
    }
    if (/^[0-9]{2}[A-Z]{3}[0-9]{1}$/.test(cleaned)) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5, 6)}`;
    }
    // Fallback voor 8-karakter kentekens
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5, 6)}`;
  }

  if (cleaned.length === 4) {
    // 4-karakter kentekens (speciale types)
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}`;
  }

  if (cleaned.length === 5) {
    // 5-karakter kentekens 
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}`;
  }

  return cleaned; // Retourneer schoon formaat voor onbekende patronen
}

/**
 * Valideert of een kenteken geldig is volgens Nederlandse standaarden
 * Nu veel flexibeler om alle RDW kentekentypes toe te staan
 */
export function isValidLicensePlate(licensePlate: string): boolean {
  const cleaned = licensePlate.replace(/[\s-]/g, '').toUpperCase();
  
  // Accepteer alle kentekens tussen 4-8 karakters met letters en cijfers
  // Dit dekt alle RDW kentekentypes inclusief speciale types
  if (cleaned.length >= 4 && cleaned.length <= 8) {
    // Moet minimaal één letter en één cijfer bevatten
    const hasLetter = /[A-Z]/.test(cleaned);
    const hasNumber = /[0-9]/.test(cleaned);
    const onlyLettersAndNumbers = /^[A-Z0-9]+$/.test(cleaned);
    
    return hasLetter && hasNumber && onlyLettersAndNumbers;
  }
  
  return false;
}

/**
 * Converteert een wildcard kenteken naar een RegExp voor zoeken
 * Bijvoorbeeld: "*AB-*3*" wordt omgezet naar een RegExp die matcht met "1AB-234", etc.
 */
export function wildcardToRegExp(wildcard: string): RegExp {
  // Vervang * door .* en escape speciale regex karakters
  const escaped = wildcard
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape speciale karakters
    .replace(/\*/g, '.*'); // Vervang * door .*
  
  return new RegExp(`^${escaped}$`, 'i');
}

/**
 * Test of een kenteken matcht met een wildcard patroon
 */
export function matchesWildcard(licensePlate: string, wildcard: string): boolean {
  const regex = wildcardToRegExp(wildcard);
  return regex.test(licensePlate);
}

/**
 * Normaliseert een kenteken voor API calls (verwijdert streepjes)
 */
export function normalizeLicensePlate(licensePlate: string): string {
  return licensePlate.replace(/-/g, '').toUpperCase();
}

/**
 * Valideert en formatteert een kenteken input
 */
export function validateAndFormatLicensePlate(input: string): {
  formatted: string;
  normalized: string;
  isValid: boolean;
  error?: string;
} {
  if (!input || input.trim().length === 0) {
    return {
      formatted: '',
      normalized: '',
      isValid: false,
      error: 'Kenteken is verplicht'
    };
  }

  const formatted = formatLicensePlate(input);
  const normalized = normalizeLicensePlate(formatted);
  const isValid = isValidLicensePlate(formatted);

  return {
    formatted,
    normalized,
    isValid,
    error: isValid ? undefined : 'Ongeldig kenteken formaat'
  };
}

/**
 * Extraheert mogelijk kenteken uit een tekst string
 */
export function extractLicensePlate(text: string): string | null {
  // Zoek naar kenteken patronen in de tekst
  const patterns = [
    /[A-Z]{2}-[0-9]{2}-[0-9]{2}/g,
    /[0-9]{2}-[A-Z]{2}-[0-9]{2}/g,
    /[0-9]{2}-[0-9]{2}-[A-Z]{2}/g,
    /[A-Z]{2}-[0-9]{3}-[A-Z]{1}/g,
    /[A-Z]{1}-[0-9]{3}-[A-Z]{2}/g,
  ];

  for (const pattern of patterns) {
    const matches = text.toUpperCase().match(pattern);
    if (matches) {
      return matches[0];
    }
  }

  return null;
} 