
export interface Player {
  id: string;
  name: string;
  isActive: boolean; // Is present today
  gender: 'M' | 'F';
  level: number; // 1 to 18
  avatar?: string;
}

export interface Court {
  id: string;
  name: string;
  type: 'A' | 'B'; // Supports multi-hall configuration
  status: 'allocating' | 'playing';
  playerIds: (string | null)[]; // Fixed length 4: [slot0, slot1, slot2, slot3]
}

export interface MatchRecord {
  courtName: string;
  playerNames: string[];
  timestamp: number;
  result?: 'teamA' | 'teamB'; // Record the winner
}

export interface RoundRecord {
  id: string;
  roundNumber: number;
  timestamp: number;
  matches: MatchRecord[];
}

export interface AppState {
  players: Player[];
  courts: Court[];
  rounds: RoundRecord[];
}

export type DragItemType = 'PLAYER';

export interface DragData {
  type: DragItemType;
  id: string;
  sourceId: string; // 'waiting-list' or courtId
}
