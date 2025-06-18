import {
  formatLicensePlate,
  isValidLicensePlate,
  wildcardToRegExp,
  matchesWildcard,
  normalizeLicensePlate,
  validateAndFormatLicensePlate,
  extractLicensePlate,
} from '../licensePlate';

describe('licensePlate utilities', () => {
  describe('formatLicensePlate', () => {
    test('formats valid license plates correctly', () => {
      expect(formatLicensePlate('AB1234')).toBe('AB-12-34');
      expect(formatLicensePlate('12AB34')).toBe('12-AB-34');
      expect(formatLicensePlate('1234AB')).toBe('12-34-AB');
      expect(formatLicensePlate('AB123C')).toBe('AB-123-C');
      expect(formatLicensePlate('A123BC')).toBe('A-123-BC');
    });

    test('handles input with spaces and dashes', () => {
      expect(formatLicensePlate('AB 12 34')).toBe('AB-12-34');
      expect(formatLicensePlate('AB-12-34')).toBe('AB-12-34');
      expect(formatLicensePlate('ab1234')).toBe('AB-12-34');
    });

    test('returns original input for invalid lengths', () => {
      expect(formatLicensePlate('ABC')).toBe('ABC');
      expect(formatLicensePlate('ABCDEFGHI')).toBe('ABCDEFGHI');
    });
  });

  describe('isValidLicensePlate', () => {
    test('validates correct license plate formats', () => {
      expect(isValidLicensePlate('AB-12-34')).toBe(true);
      expect(isValidLicensePlate('12-AB-34')).toBe(true);
      expect(isValidLicensePlate('12-34-AB')).toBe(true);
      expect(isValidLicensePlate('AB-123-C')).toBe(true);
      expect(isValidLicensePlate('A-123-BC')).toBe(true);
    });

    test('rejects invalid license plate formats', () => {
      expect(isValidLicensePlate('ABC-123')).toBe(false);
      expect(isValidLicensePlate('12-34-56')).toBe(false);
      expect(isValidLicensePlate('AB-CD-EF')).toBe(false);
      expect(isValidLicensePlate('')).toBe(false);
    });

    test('handles unformatted input', () => {
      expect(isValidLicensePlate('AB1234')).toBe(true);
      expect(isValidLicensePlate('12AB34')).toBe(true);
    });
  });

  describe('wildcardToRegExp', () => {
    test('converts wildcards to regex patterns', () => {
      const regex1 = wildcardToRegExp('*AB-*3*');
      expect(regex1.test('1AB-234')).toBe(true);
      expect(regex1.test('2AB-135')).toBe(true);
      expect(regex1.test('AB-123')).toBe(false);

      const regex2 = wildcardToRegExp('AB-*-*');
      expect(regex2.test('AB-12-34')).toBe(true);
      expect(regex2.test('AB-CD-EF')).toBe(true);
      expect(regex2.test('12-AB-34')).toBe(false);
    });

    test('escapes special regex characters', () => {
      const regex = wildcardToRegExp('AB-12-34');
      expect(regex.test('AB-12-34')).toBe(true);
      expect(regex.test('AB112134')).toBe(false);
    });
  });

  describe('matchesWildcard', () => {
    test('matches license plates against wildcard patterns', () => {
      expect(matchesWildcard('1AB-234', '*AB-*3*')).toBe(true);
      expect(matchesWildcard('2AB-135', '*AB-*3*')).toBe(true);
      expect(matchesWildcard('AB-123', '*AB-*3*')).toBe(false);
      expect(matchesWildcard('AB-12-34', 'AB-*-*')).toBe(true);
    });
  });

  describe('normalizeLicensePlate', () => {
    test('removes dashes and converts to uppercase', () => {
      expect(normalizeLicensePlate('ab-12-34')).toBe('AB1234');
      expect(normalizeLicensePlate('AB-12-34')).toBe('AB1234');
      expect(normalizeLicensePlate('AB1234')).toBe('AB1234');
    });
  });

  describe('validateAndFormatLicensePlate', () => {
    test('validates and formats valid license plates', () => {
      const result = validateAndFormatLicensePlate('ab1234');
      expect(result.isValid).toBe(true);
      expect(result.formatted).toBe('AB-12-34');
      expect(result.normalized).toBe('AB1234');
      expect(result.error).toBeUndefined();
    });

    test('handles invalid license plates', () => {
      const result = validateAndFormatLicensePlate('invalid');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Ongeldig kenteken formaat');
    });

    test('handles empty input', () => {
      const result = validateAndFormatLicensePlate('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Kenteken is verplicht');
    });
  });

  describe('extractLicensePlate', () => {
    test('extracts license plates from text', () => {
      expect(extractLicensePlate('Mijn auto heeft kenteken AB-12-34')).toBe('AB-12-34');
      expect(extractLicensePlate('Kenteken: 12-AB-34 is geldig')).toBe('12-AB-34');
      expect(extractLicensePlate('Geen kenteken hier')).toBeNull();
    });

    test('finds first license plate in text with multiple', () => {
      const text = 'AB-12-34 en 12-CD-56 zijn beide geldig';
      expect(extractLicensePlate(text)).toBe('AB-12-34');
    });
  });
}); 