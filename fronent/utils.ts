
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Player, Court, RoundRecord } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function getPlayerStats(players: Player[], history: RoundRecord[]): Record<string, number> {
  const stats: Record<string, number> = {};
  
  players.forEach(p => {
    let playedCount = 0;
    history.forEach(round => {
      round.matches.forEach(match => {
        if (match.playerNames.includes(p.name)) {
          playedCount++;
        }
      });
    });
    stats[p.id] = playedCount;
  });
  
  return stats;
}

export function arePlayerSetsEqual(idsA: (string | null)[], idsB: (string | null)[]): boolean {
    const validA = idsA.filter(Boolean) as string[];
    const validB = idsB.filter(Boolean) as string[];
    if (validA.length !== validB.length) return false;
    const setA = new Set(validA);
    return validB.every(id => setA.has(id));
}

/**
 * Smart Allocation Algorithm
 * 1. Respect 'Playing' courts (do not touch them).
 * 2. Exclude players currently in 'Playing' courts.
 * 3. Allocate remaining active players to 'Allocating' courts.
 * 4. Prioritize: Least Played > Most Rested > Level Balance (S-Curve).
 * 5. Intra-court balancing: (Best + Worst) vs (2nd Best + 2nd Worst)
 */
export function smartAllocation(
  allPlayers: Player[], 
  currentCourts: Court[], 
  history: RoundRecord[]
): Court[] {
  
  // 1. Identify Locked Resources (Playing Courts & Players)
  const playingPlayerIds = new Set<string>();
  currentCourts.forEach(c => {
      if (c.status === 'playing') {
          c.playerIds.forEach(pid => {
            if(pid) playingPlayerIds.add(pid);
          });
      }
  });

  // 2. Filter Available Active Players (Active AND Not currently playing)
  const availablePlayers = allPlayers.filter(p => p.isActive && !playingPlayerIds.has(p.id));
  
  // 3. Calculate Stats for AVAILABLE players
  const playerStats = availablePlayers.map(p => {
    let playedCount = 0;
    let lastRoundIndex = -1;

    history.forEach((round, rIdx) => {
      round.matches.forEach(match => {
        if (match.playerNames.includes(p.name)) {
          playedCount++;
          lastRoundIndex = rIdx;
        }
      });
    });

    // Calculate "Rest Score": Higher means rested longer
    // If never played, treated as rested for infinite rounds
    const restRounds = lastRoundIndex === -1 ? 999 : (history.length - lastRoundIndex);

    return {
      player: p,
      playedCount,
      restRounds,
      // Random noise to break ties
      random: Math.random()
    };
  });

  // 4. Sort Players by Priority
  // Priority: Least Played > Most Rested > Random
  playerStats.sort((a, b) => {
    if (a.playedCount !== b.playedCount) return a.playedCount - b.playedCount; // Ascending
    if (a.restRounds !== b.restRounds) return b.restRounds - a.restRounds; // Descending
    return b.random - a.random;
  });

  // 5. Determine Target Courts
  // We only allocate to courts that are NOT playing
  const targetCourts = currentCourts.filter(c => c.status === 'allocating');

  // 6. Determine Capacity
  // How many FULL courts (4 players) can we create with available players?
  const courtsToFillCount = Math.min(targetCourts.length, Math.floor(availablePlayers.length / 4));
  const playersToTakeCount = courtsToFillCount * 4;

  // Select top priority players
  const selectedStats = playerStats.slice(0, playersToTakeCount);
  
  // 7. S-Curve Distribution (Snake)
  // Sort selected players by Level to balance courts distribution
  const selectedPlayers = selectedStats.map(s => s.player).sort((a, b) => b.level - a.level);

  // Create a map to hold the new assignments for target courts
  const assignmentMap = new Map<string, Player[]>();
  targetCourts.forEach(c => assignmentMap.set(c.id, []));

  // Distribute players if we have any courts to fill
  if (courtsToFillCount > 0) {
    const courtsToFillIds = targetCourts.slice(0, courtsToFillCount).map(c => c.id);
    
    let courtIdx = 0;
    let forward = true;

    selectedPlayers.forEach(player => {
      const cId = courtsToFillIds[courtIdx];
      const currentList = assignmentMap.get(cId) || [];
      currentList.push(player);
      assignmentMap.set(cId, currentList);

      // Snake movement
      if (forward) {
        courtIdx++;
        if (courtIdx >= courtsToFillIds.length) {
          courtIdx = courtsToFillIds.length - 1;
          forward = false;
        }
      } else {
        courtIdx--;
        if (courtIdx < 0) {
          courtIdx = 0;
          forward = true;
        }
      }
    });
  }

  // 8. Merge, Balance Teams, and Return
  return currentCourts.map(c => {
    // If it was playing, keep it exactly as is
    if (c.status === 'playing') return c;

    // If it was allocating, check if we assigned players
    if (assignmentMap.has(c.id)) {
      let allocatedPlayers = assignmentMap.get(c.id) || [];
      let allocatedIds: (string | null)[] = [null, null, null, null];

      if (allocatedPlayers.length === 4) {
          // Intra-Court Balancing Logic:
          // Sort by Level Descending: [Best, 2nd, 3rd, Worst]
          // We want Team 1: (Best + Worst), Team 2: (2nd + 3rd)
          // Index mapping for CourtCard slots [0, 1, 2, 3]:
          // Slot 0, 1 is Team A. Slot 2, 3 is Team B.
          // So we want: [Best, Worst, 2nd, 3rd]
          
          const sorted = [...allocatedPlayers].sort((a, b) => b.level - a.level);
          const best = sorted[0];
          const second = sorted[1];
          const third = sorted[2];
          const worst = sorted[3];

          // Specific Slots: 0, 1, 2, 3
          allocatedIds = [best.id, worst.id, second.id, third.id];
      } else {
          // Fallback for partial fill (shouldn't happen with logic above but safe to handle)
          allocatedPlayers.forEach((p, i) => {
              if (i < 4) allocatedIds[i] = p.id;
          });
      }

      return {
        ...c,
        status: 'allocating',
        playerIds: allocatedIds
      };
    }
    
    // Empty courts
    return { ...c, playerIds: [null, null, null, null] };
  });
}
