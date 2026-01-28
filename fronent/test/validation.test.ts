import { describe, it, expect } from 'vitest';
import {
  validatePlayerName,
  validatePlayerLevel,
  validatePlayerGender,
  validatePlayer,
  validateCourtName,
  isNotEmpty,
  isInRange,
} from '../utils/validation';

describe('validatePlayerName', () => {
  it('should reject empty name', () => {
    expect(validatePlayerName('').isValid).toBe(false);
    expect(validatePlayerName('   ').isValid).toBe(false);
  });

  it('should accept valid name', () => {
    expect(validatePlayerName('小明').isValid).toBe(true);
    expect(validatePlayerName('John').isValid).toBe(true);
  });

  it('should reject name longer than 20 characters', () => {
    const longName = 'a'.repeat(21);
    const result = validatePlayerName(longName);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('20');
  });

  it('should accept name with exactly 20 characters', () => {
    const exactName = 'a'.repeat(20);
    expect(validatePlayerName(exactName).isValid).toBe(true);
  });

  it('should detect duplicate names', () => {
    const existingPlayers = [
      { id: '1', name: '小明' },
      { id: '2', name: 'John' },
    ];
    const result = validatePlayerName('小明', { items: existingPlayers });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('已存在');
  });

  it('should allow same name when editing same player', () => {
    const existingPlayers = [
      { id: '1', name: '小明' },
      { id: '2', name: 'John' },
    ];
    const result = validatePlayerName('小明', { items: existingPlayers, excludeId: '1' });
    expect(result.isValid).toBe(true);
  });

  it('should detect duplicates case-insensitively', () => {
    const existingPlayers = [{ id: '1', name: 'John' }];
    const result = validatePlayerName('JOHN', { items: existingPlayers });
    expect(result.isValid).toBe(false);
  });
});

describe('validatePlayerLevel', () => {
  it('should reject non-integer levels', () => {
    expect(validatePlayerLevel(1.5).isValid).toBe(false);
    expect(validatePlayerLevel(NaN).isValid).toBe(false);
  });

  it('should reject levels outside 1-18 range', () => {
    expect(validatePlayerLevel(0).isValid).toBe(false);
    expect(validatePlayerLevel(19).isValid).toBe(false);
    expect(validatePlayerLevel(-1).isValid).toBe(false);
  });

  it('should accept valid levels', () => {
    expect(validatePlayerLevel(1).isValid).toBe(true);
    expect(validatePlayerLevel(18).isValid).toBe(true);
    expect(validatePlayerLevel(10).isValid).toBe(true);
  });
});

describe('validatePlayerGender', () => {
  it('should accept M and F', () => {
    expect(validatePlayerGender('M').isValid).toBe(true);
    expect(validatePlayerGender('F').isValid).toBe(true);
  });

  it('should reject invalid genders', () => {
    expect(validatePlayerGender('X').isValid).toBe(false);
    expect(validatePlayerGender('male').isValid).toBe(false);
    expect(validatePlayerGender('').isValid).toBe(false);
  });
});

describe('validatePlayer', () => {
  it('should validate complete player data', () => {
    const validPlayer = {
      name: '小明',
      gender: 'M' as const,
      level: 5,
    };
    expect(validatePlayer(validPlayer).isValid).toBe(true);
  });

  it('should fail on invalid name', () => {
    const invalidPlayer = {
      name: '',
      gender: 'M' as const,
      level: 5,
    };
    expect(validatePlayer(invalidPlayer).isValid).toBe(false);
  });

  it('should fail on invalid level', () => {
    const invalidPlayer = {
      name: '小明',
      gender: 'M' as const,
      level: 20,
    };
    expect(validatePlayer(invalidPlayer).isValid).toBe(false);
  });
});

describe('validateCourtName', () => {
  it('should reject empty name', () => {
    expect(validateCourtName('').isValid).toBe(false);
    expect(validateCourtName('   ').isValid).toBe(false);
  });

  it('should accept valid name', () => {
    expect(validateCourtName('第一場地').isValid).toBe(true);
    expect(validateCourtName('Court A').isValid).toBe(true);
  });

  it('should reject name longer than 30 characters', () => {
    const longName = 'a'.repeat(31);
    const result = validateCourtName(longName);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('30');
  });

  it('should detect duplicate court names', () => {
    const existingCourts = [
      { id: '1', name: '第一場地' },
      { id: '2', name: 'Court B' },
    ];
    const result = validateCourtName('第一場地', { items: existingCourts });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('已存在');
  });

  it('should allow same name when editing same court', () => {
    const existingCourts = [
      { id: '1', name: '第一場地' },
      { id: '2', name: 'Court B' },
    ];
    const result = validateCourtName('第一場地', { items: existingCourts, excludeId: '1' });
    expect(result.isValid).toBe(true);
  });
});

describe('isNotEmpty', () => {
  it('should return false for empty strings', () => {
    expect(isNotEmpty('')).toBe(false);
    expect(isNotEmpty('   ')).toBe(false);
  });

  it('should return true for non-empty strings', () => {
    expect(isNotEmpty('hello')).toBe(true);
    expect(isNotEmpty('  hello  ')).toBe(true);
  });
});

describe('isInRange', () => {
  it('should return true for values in range', () => {
    expect(isInRange(5, 1, 10)).toBe(true);
    expect(isInRange(1, 1, 10)).toBe(true);
    expect(isInRange(10, 1, 10)).toBe(true);
  });

  it('should return false for values outside range', () => {
    expect(isInRange(0, 1, 10)).toBe(false);
    expect(isInRange(11, 1, 10)).toBe(false);
    expect(isInRange(-5, 1, 10)).toBe(false);
  });
});
