import { useCallback, useMemo } from 'react';
import { Player, Court, RoundRecord } from '../types';
import { generateId, getPlayerStats } from '../utils';

interface UsePlayerManagementProps {
  players: Player[];
  setPlayers: (value: Player[] | ((prev: Player[]) => Player[])) => void;
  courts: Court[];
  setCourts: (value: Court[] | ((prev: Court[]) => Court[])) => void;
  rounds: RoundRecord[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function usePlayerManagement({
  players,
  setPlayers,
  courts,
  setCourts,
  rounds,
  showToast,
}: UsePlayerManagementProps) {
  // Memoized player stats
  const playedCounts = useMemo(
    () => getPlayerStats(players, rounds),
    [players, rounds]
  );

  // Add a new player
  const addPlayer = useCallback(
    (name: string, gender: 'M' | 'F', level: number) => {
      const trimmedName = name.trim();
      if (!trimmedName) return;

      const newPlayer: Player = {
        id: generateId(),
        name: trimmedName,
        isActive: true,
        gender,
        level,
      };
      setPlayers(prev => [...prev, newPlayer]);
      showToast(`已新增球員：${trimmedName}`, 'success');
    },
    [setPlayers, showToast]
  );

  // Toggle player active status
  const togglePlayerStatus = useCallback(
    (id: string) => {
      setPlayers(prev =>
        prev.map(p => (p.id === id ? { ...p, isActive: !p.isActive } : p))
      );
      // Remove from courts if inactive
      setCourts(prev =>
        prev.map(c => ({
          ...c,
          playerIds: c.playerIds.map(pid => (pid === id ? null : pid)),
        }))
      );
    },
    [setPlayers, setCourts]
  );

  // Delete a player
  const deletePlayer = useCallback(
    (id: string) => {
      setPlayers(prev => prev.filter(p => p.id !== id));
      setCourts(prev =>
        prev.map(c => ({
          ...c,
          playerIds: c.playerIds.map(pid => (pid === id ? null : pid)),
        }))
      );
      showToast('球員已刪除', 'info');
    },
    [setPlayers, setCourts, showToast]
  );

  // Update player info
  const updatePlayer = useCallback(
    (id: string, updates: Partial<Pick<Player, 'name' | 'gender' | 'level'>>) => {
      setPlayers(prev =>
        prev.map(p => {
          if (p.id !== id) return p;
          return {
            ...p,
            ...(updates.name !== undefined && { name: updates.name.trim() }),
            ...(updates.gender !== undefined && { gender: updates.gender }),
            ...(updates.level !== undefined && { level: updates.level }),
          };
        })
      );
      showToast('球員資料已更新', 'success');
    },
    [setPlayers, showToast]
  );

  // Get player by ID
  const getPlayerById = useCallback(
    (id: string) => players.find(p => p.id === id) || null,
    [players]
  );

  // Get active players
  const activePlayers = useMemo(
    () => players.filter(p => p.isActive),
    [players]
  );

  return {
    playedCounts,
    addPlayer,
    togglePlayerStatus,
    deletePlayer,
    updatePlayer,
    getPlayerById,
    activePlayers,
  };
}
