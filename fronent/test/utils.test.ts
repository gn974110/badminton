import { describe, it, expect } from 'vitest';
import {
  cn,
  generateId,
  shuffleArray,
  getPlayerStats,
  arePlayerSetsEqual,
  smartAllocation,
} from '../utils';
import { Player, Court, RoundRecord } from '../types';

describe('cn (className merge)', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should merge tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
});

describe('generateId', () => {
  it('should generate a string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
  });

  it('should generate unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it('should generate ids of expected length', () => {
    const id = generateId();
    expect(id.length).toBe(9);
  });
});

describe('shuffleArray', () => {
  it('should return array of same length', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    expect(shuffled.length).toBe(arr.length);
  });

  it('should contain all original elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    expect(shuffled.sort()).toEqual(arr.sort());
  });

  it('should not modify original array', () => {
    const arr = [1, 2, 3, 4, 5];
    const original = [...arr];
    shuffleArray(arr);
    expect(arr).toEqual(original);
  });
});

describe('getPlayerStats', () => {
  const players: Player[] = [
    { id: 'p1', name: 'Player 1', isActive: true, gender: 'M', level: 5 },
    { id: 'p2', name: 'Player 2', isActive: true, gender: 'F', level: 6 },
  ];

  it('should return empty stats for empty history', () => {
    const stats = getPlayerStats(players, []);
    expect(stats['p1']).toBe(0);
    expect(stats['p2']).toBe(0);
  });

  it('should count player appearances correctly', () => {
    const rounds: RoundRecord[] = [
      {
        id: 'r1',
        roundNumber: 1,
        timestamp: Date.now(),
        matches: [
          { courtName: 'Court 1', playerNames: ['Player 1', 'Player 2'], timestamp: Date.now() },
        ],
      },
      {
        id: 'r2',
        roundNumber: 2,
        timestamp: Date.now(),
        matches: [
          { courtName: 'Court 1', playerNames: ['Player 1'], timestamp: Date.now() },
        ],
      },
    ];

    const stats = getPlayerStats(players, rounds);
    expect(stats['p1']).toBe(2);
    expect(stats['p2']).toBe(1);
  });
});

describe('arePlayerSetsEqual', () => {
  it('should return true for identical arrays', () => {
    expect(arePlayerSetsEqual(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(true);
  });

  it('should return true for same elements in different order', () => {
    expect(arePlayerSetsEqual(['a', 'b', 'c'], ['c', 'a', 'b'])).toBe(true);
  });

  it('should handle null values', () => {
    expect(arePlayerSetsEqual(['a', null, 'b'], ['b', null, 'a'])).toBe(true);
  });

  it('should return false for different arrays', () => {
    expect(arePlayerSetsEqual(['a', 'b'], ['a', 'c'])).toBe(false);
  });

  it('should return false for different lengths', () => {
    expect(arePlayerSetsEqual(['a', 'b'], ['a', 'b', 'c'])).toBe(false);
  });
});

describe('smartAllocation', () => {
  const createPlayer = (id: string, name: string, level: number, isActive = true): Player => ({
    id,
    name,
    isActive,
    gender: 'M',
    level,
  });

  const createCourt = (id: string, name: string, status: 'allocating' | 'playing' = 'allocating'): Court => ({
    id,
    name,
    type: 'A',
    status,
    playerIds: [null, null, null, null],
  });

  it('should not modify playing courts', () => {
    const players = [
      createPlayer('p1', 'P1', 5),
      createPlayer('p2', 'P2', 6),
      createPlayer('p3', 'P3', 7),
      createPlayer('p4', 'P4', 8),
    ];

    const courts: Court[] = [
      { ...createCourt('c1', 'Court 1', 'playing'), playerIds: ['p1', 'p2', 'p3', 'p4'] },
    ];

    const result = smartAllocation(players, courts, []);
    expect(result[0].playerIds).toEqual(['p1', 'p2', 'p3', 'p4']);
    expect(result[0].status).toBe('playing');
  });

  it('should allocate players to empty courts', () => {
    const players = [
      createPlayer('p1', 'P1', 5),
      createPlayer('p2', 'P2', 6),
      createPlayer('p3', 'P3', 7),
      createPlayer('p4', 'P4', 8),
    ];

    const courts = [createCourt('c1', 'Court 1')];
    const result = smartAllocation(players, courts, []);

    // 應該分配 4 個玩家
    const allocatedPlayers = result[0].playerIds.filter(id => id !== null);
    expect(allocatedPlayers.length).toBe(4);
  });

  it('should not allocate inactive players', () => {
    const players = [
      createPlayer('p1', 'P1', 5, true),
      createPlayer('p2', 'P2', 6, true),
      createPlayer('p3', 'P3', 7, true),
      createPlayer('p4', 'P4', 8, false), // inactive
    ];

    const courts = [createCourt('c1', 'Court 1')];
    const result = smartAllocation(players, courts, []);

    // 只有 3 個活躍玩家，無法填滿場地
    const allocatedPlayers = result[0].playerIds.filter(id => id !== null);
    expect(allocatedPlayers).not.toContain('p4');
  });

  it('should balance teams by level', () => {
    const players = [
      createPlayer('p1', 'Best', 10),
      createPlayer('p2', 'Second', 8),
      createPlayer('p3', 'Third', 6),
      createPlayer('p4', 'Worst', 4),
    ];

    const courts = [createCourt('c1', 'Court 1')];
    const result = smartAllocation(players, courts, []);

    // 檢查分配結果 - Team A (slots 0,1) 應該是最強+最弱
    const slots = result[0].playerIds;

    // 依據演算法：[Best, Worst, 2nd, 3rd]
    expect(slots[0]).toBe('p1'); // Best
    expect(slots[1]).toBe('p4'); // Worst
    expect(slots[2]).toBe('p2'); // 2nd
    expect(slots[3]).toBe('p3'); // 3rd
  });
});
