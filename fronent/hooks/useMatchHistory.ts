import { useCallback } from 'react';
import { Player, Court, RoundRecord, MatchRecord } from '../types';
import { generateId } from '../utils';

interface UseMatchHistoryProps {
  players: Player[];
  courts: Court[];
  rounds: RoundRecord[];
  setRounds: (value: RoundRecord[] | ((prev: RoundRecord[]) => RoundRecord[])) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const GROUP_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function useMatchHistory({
  players,
  courts,
  rounds,
  setRounds,
  showToast,
}: UseMatchHistoryProps) {
  // Record a new match when game starts
  const recordMatchStart = useCallback(
    (courtId: string) => {
      const court = courts.find(c => c.id === courtId);
      if (!court) return;

      const validPlayerIds = court.playerIds.filter(
        (id): id is string => id !== null
      );
      const playerNames = validPlayerIds.map(
        pid => players.find(p => p.id === pid)?.name || 'Unknown'
      );
      const timestamp = Date.now();

      const newMatch: MatchRecord = {
        courtName: court.name,
        playerNames,
        timestamp,
      };

      setRounds(prev => {
        const newRounds = [...prev];
        const lastRound = newRounds[newRounds.length - 1];

        // Grouping Logic: If last round was created recently, append to it
        if (lastRound && timestamp - lastRound.timestamp < GROUP_WINDOW_MS) {
          // Check for duplicates
          const isDuplicate = lastRound.matches.some(
            m =>
              m.courtName === newMatch.courtName &&
              m.playerNames.join(',') === playerNames.join(',')
          );

          if (!isDuplicate) {
            const updatedLastRound = {
              ...lastRound,
              matches: [...lastRound.matches, newMatch],
            };
            newRounds[newRounds.length - 1] = updatedLastRound;
          }
          return newRounds;
        } else {
          // Start a new round
          const newRound: RoundRecord = {
            id: generateId(),
            roundNumber: newRounds.length + 1,
            timestamp,
            matches: [newMatch],
          };
          return [...newRounds, newRound];
        }
      });

      showToast('比賽開始！已記錄至歷史', 'success');
    },
    [courts, players, setRounds, showToast]
  );

  // Record match result when game finishes
  const recordMatchResult = useCallback(
    (courtId: string, winner: 'teamA' | 'teamB' | 'none') => {
      const court = courts.find(c => c.id === courtId);
      if (!court) return;

      setRounds(prev => {
        const newRounds = [...prev];
        for (let i = newRounds.length - 1; i >= 0; i--) {
          const round = { ...newRounds[i] };
          const matches = [...round.matches];
          const matchIndex = matches.findIndex(
            m => m.courtName === court.name && !m.result
          );

          if (matchIndex !== -1) {
            matches[matchIndex] = {
              ...matches[matchIndex],
              result: winner === 'none' ? undefined : winner,
            };
            round.matches = matches;
            newRounds[i] = round;
            break;
          }
        }
        return newRounds;
      });

      if (winner !== 'none') {
        showToast('比賽結束，已記錄勝負', 'success');
      } else {
        showToast('比賽已取消 (無勝負)', 'info');
      }
    },
    [courts, setRounds, showToast]
  );

  // Get finishing court players for winner selection modal
  const getFinishingCourtPlayers = useCallback(
    (courtId: string | null) => {
      if (!courtId) return { teamA: [] as Player[], teamB: [] as Player[] };

      const court = courts.find(c => c.id === courtId);
      if (!court) return { teamA: [] as Player[], teamB: [] as Player[] };

      const playerList = court.playerIds.map(id =>
        id ? players.find(p => p.id === id) : null
      );

      return {
        teamA: [playerList[0], playerList[1]].filter(Boolean) as Player[],
        teamB: [playerList[2], playerList[3]].filter(Boolean) as Player[],
      };
    },
    [courts, players]
  );

  return {
    recordMatchStart,
    recordMatchResult,
    getFinishingCourtPlayers,
  };
}
