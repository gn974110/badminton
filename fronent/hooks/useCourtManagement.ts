import { useCallback, useMemo } from 'react';
import { Player, Court } from '../types';
import { generateId, shuffleArray, smartAllocation } from '../utils';

interface UseCourtManagementProps {
  players: Player[];
  courts: Court[];
  setCourts: (value: Court[] | ((prev: Court[]) => Court[])) => void;
  rounds: any[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function useCourtManagement({
  players,
  courts,
  setCourts,
  rounds,
  showToast,
}: UseCourtManagementProps) {
  // Get court slots with player objects
  const getCourtSlots = useCallback(
    (courtId: string): (Player | null)[] => {
      const court = courts.find(c => c.id === courtId);
      if (!court) return [null, null, null, null];
      return court.playerIds.map(id =>
        id ? players.find(p => p.id === id) || null : null
      );
    },
    [courts, players]
  );

  // Memoized court slots map for all courts
  const courtSlotsMap = useMemo(() => {
    const map = new Map<string, (Player | null)[]>();
    courts.forEach(court => {
      map.set(court.id, getCourtSlots(court.id));
    });
    return map;
  }, [courts, getCourtSlots]);

  // Add player to a specific court slot
  const addPlayerToCourt = useCallback(
    (courtId: string, playerId: string, targetSlotIndex: number) => {
      setCourts(prev => {
        // 1. Remove player from any existing position (in any court)
        const courtsWithoutPlayer = prev.map(c => {
          if (c.status === 'playing') return c;
          return {
            ...c,
            playerIds: c.playerIds.map(pid => (pid === playerId ? null : pid)),
          };
        });

        // 2. Add to new position
        return courtsWithoutPlayer.map(c => {
          if (c.id !== courtId) return c;
          const newIds = [...c.playerIds];
          newIds[targetSlotIndex] = playerId;
          return { ...c, playerIds: newIds };
        });
      });
    },
    [setCourts]
  );

  // Remove player from court
  const removePlayerFromCourt = useCallback(
    (playerId: string) => {
      setCourts(prev =>
        prev.map(c => {
          if (c.status === 'playing') return c;
          return {
            ...c,
            playerIds: c.playerIds.map(pid => (pid === playerId ? null : pid)),
          };
        })
      );
    },
    [setCourts]
  );

  // Add a new court
  const addCourt = useCallback(
    (name: string) => {
      const trimmedName = name.trim();
      if (!trimmedName) return;

      setCourts(prev => [
        ...prev,
        {
          id: generateId(),
          name: trimmedName,
          type: 'A',
          status: 'allocating',
          playerIds: [null, null, null, null],
        },
      ]);
      showToast('已新增場地', 'success');
    },
    [setCourts, showToast]
  );

  // Update court name
  const updateCourtName = useCallback(
    (id: string, name: string) => {
      setCourts(prev =>
        prev.map(c => (c.id === id ? { ...c, name: name.trim() } : c))
      );
      showToast('場地名稱已更新', 'success');
    },
    [setCourts, showToast]
  );

  // Delete a court
  const deleteCourt = useCallback(
    (id: string) => {
      setCourts(prev => prev.filter(c => c.id !== id));
      showToast('場地已刪除', 'info');
    },
    [setCourts, showToast]
  );

  // Toggle court status (allocating <-> playing)
  const toggleCourtStatus = useCallback(
    (courtId: string): { success: boolean; needsWinnerSelection?: boolean } => {
      const court = courts.find(c => c.id === courtId);
      if (!court) return { success: false };

      if (court.status === 'allocating') {
        // Validation: Must have 4 players
        const validPlayerIds = court.playerIds.filter(
          (id): id is string => id !== null
        );
        if (validPlayerIds.length !== 4) {
          showToast('場地人數不足 4 人，無法開始比賽！', 'error');
          return { success: false };
        }

        // Start match
        setCourts(prev =>
          prev.map(c => (c.id === courtId ? { ...c, status: 'playing' } : c))
        );
        return { success: true };
      } else {
        // Request to finish - needs winner selection
        return { success: true, needsWinnerSelection: true };
      }
    },
    [courts, setCourts, showToast]
  );

  // Reset court after game finish
  const resetCourt = useCallback(
    (courtId: string) => {
      setCourts(prev =>
        prev.map(c => {
          if (c.id !== courtId) return c;
          return {
            ...c,
            status: 'allocating',
            playerIds: [null, null, null, null],
          };
        })
      );
    },
    [setCourts]
  );

  // Shuffle players randomly
  const shufflePlayers = useCallback(() => {
    const activePlayers = players.filter(p => p.isActive);
    if (activePlayers.length === 0) {
      showToast('沒有出席的球員', 'error');
      return;
    }

    const shuffled = shuffleArray([...activePlayers]);
    const newCourts = courts.map(c => {
      if (c.status === 'playing') return c;
      return { ...c, playerIds: [null, null, null, null] as (string | null)[] };
    });

    let pIdx = 0;
    for (const court of newCourts) {
      if (court.status === 'playing') continue;
      const newIds = [...court.playerIds];
      for (let i = 0; i < 4; i++) {
        if (pIdx < shuffled.length) {
          newIds[i] = shuffled[pIdx].id;
          pIdx++;
        }
      }
      court.playerIds = newIds;
    }

    setCourts(newCourts);
    showToast('隨機分配完成', 'success');
  }, [players, courts, setCourts, showToast]);

  // Smart allocation
  const smartAllocate = useCallback(() => {
    const allocatedCourts = smartAllocation(players, courts, rounds);
    setCourts(allocatedCourts);
    showToast('智慧排點完成', 'success');
  }, [players, courts, rounds, setCourts, showToast]);

  // Clear all courts
  const clearAllCourts = useCallback(() => {
    setCourts(prev =>
      prev.map(c => {
        if (c.status === 'playing') return c;
        return { ...c, status: 'allocating', playerIds: [null, null, null, null] };
      })
    );
    showToast('場地已清空', 'info');
  }, [setCourts, showToast]);

  return {
    getCourtSlots,
    courtSlotsMap,
    addPlayerToCourt,
    removePlayerFromCourt,
    addCourt,
    updateCourtName,
    deleteCourt,
    toggleCourtStatus,
    resetCourt,
    shufflePlayers,
    smartAllocate,
    clearAllCourts,
  };
}
