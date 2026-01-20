
import React, { useState } from 'react';
import { Player, Court } from '../types';
import { Plus, Search, UserX, Check, Trash2, User, Edit3, Swords, Power, Activity, Pause } from 'lucide-react';
import { cn } from '../utils';
import { LevelBadge } from './LevelBadge';

interface PlayerListProps {
  players: Player[];
  courts: Court[];
  selectedPlayerId: string | null;
  playedCounts: Record<string, number>;
  onPlayerClick: (playerId: string) => void;
  onAddPlayer: (name: string, gender: 'M' | 'F', level: number) => void;
  onToggleStatus: (playerId: string) => void;
  onDeletePlayer: (playerId: string) => void;
  onEditPlayer: (playerId: string) => void;
  isMobileView?: boolean;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  courts,
  selectedPlayerId,
  playedCounts,
  onPlayerClick,
  onAddPlayer,
  onToggleStatus,
  onDeletePlayer,
  onEditPlayer,
  isMobileView = false
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newGender, setNewGender] = useState<'M' | 'F'>('M');
  const [newLevel, setNewLevel] = useState<number>(3);
  const [filter, setFilter] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlayerName.trim()) {
      onAddPlayer(newPlayerName.trim(), newGender, newLevel);
      setNewPlayerName('');
    }
  };

  const handleDragStart = (e: React.DragEvent, player: Player) => {
    e.dataTransfer.setData("text/plain", player.id);
    e.dataTransfer.effectAllowed = "copyMove";
  };

  // --- Status Logic Helper ---
  const getPlayerStatus = (player: Player) => {
    if (!player.isActive) {
        return { type: 'resting', label: '休息', colorClass: 'text-slate-400', bgClass: 'bg-slate-100', borderClass: 'border-slate-200' };
    }
    
    const court = courts.find(c => c.playerIds.includes(player.id));
    if (court) {
        if (court.status === 'playing') {
            return { type: 'playing', label: '比賽中', colorClass: 'text-rose-600', bgClass: 'bg-rose-50', borderClass: 'border-rose-200' };
        }
        return { type: 'allocated', label: '準備中', colorClass: 'text-emerald-600', bgClass: 'bg-emerald-50', borderClass: 'border-emerald-200' };
    }

    return { type: 'waiting', label: '等待上場', colorClass: 'text-blue-600', bgClass: 'bg-white', borderClass: 'border-blue-200' };
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(filter.toLowerCase())
  );
  
  // Sort: Active first, then Level (desc), then Name
  filteredPlayers.sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return a.name.localeCompare(b.name);
  });

  const activeCount = players.filter(p => p.isActive).length;

  return (
    <div className="flex flex-col h-full bg-white shadow-sm w-full overflow-hidden">
      {/* Header & Tools */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-slate-100 bg-white z-10">
        <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                球員名單
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold tracking-wide uppercase border border-emerald-100">
                    {activeCount} 出席
                </span>
            </h2>
            
            <button 
                onClick={() => setIsAdding(!isAdding)}
                className={cn(
                    "p-2 rounded-full transition-all",
                    isAdding ? "bg-slate-100 text-slate-600 rotate-45" : "bg-emerald-600 text-white shadow-md hover:bg-emerald-700"
                )}
            >
                <Plus size={20} />
            </button>
        </div>

        {/* Expandable Add Form */}
        <div className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            isAdding ? "max-h-48 opacity-100 mb-4" : "max-h-0 opacity-0"
        )}>
            <form onSubmit={handleSubmit} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="姓名"
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        autoFocus
                    />
                    <button 
                        type="button"
                        onClick={() => setNewGender(g => g === 'M' ? 'F' : 'M')}
                        className={cn(
                            "w-10 flex items-center justify-center rounded-lg border font-bold transition-colors",
                            newGender === 'M' ? "bg-blue-100 border-blue-300 text-blue-600" : "bg-pink-100 border-pink-300 text-pink-600"
                        )}
                    >
                        {newGender === 'M' ? '男' : '女'}
                    </button>
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 whitespace-nowrap">等級:</span>
                    <div className="relative w-full">
                        <select 
                            value={newLevel}
                            onChange={(e) => setNewLevel(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                        >
                            {Array.from({ length: 18 }, (_, i) => i + 1).map(lvl => (
                                <option key={lvl} value={lvl}>Level {lvl}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <span className="text-slate-400 text-xs">▼</span>
                        </div>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={!newPlayerName.trim()}
                    className="w-full py-2 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg disabled:opacity-50 hover:bg-emerald-700"
                >
                    新增球員
                </button>
            </form>
        </div>
        
        {/* Search */}
        {!isAdding && (
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="搜尋球員..." 
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-transparent rounded-lg text-sm text-slate-600 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>
        )}
      </div>

      {/* Scrollable List */}
      <div className={cn(
          "flex-1 overflow-y-auto p-3 space-y-2 bg-white", 
          isMobileView ? "pb-24" : "" // Padding for bottom nav
      )}>
        {filteredPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <p className="text-sm font-medium">找不到球員</p>
            </div>
        ) : (
            filteredPlayers.map(player => {
                const status = getPlayerStatus(player);
                
                return (
                    <div
                        key={player.id}
                        draggable={player.isActive} // Only active players are draggable
                        onDragStart={(e) => handleDragStart(e, player)}
                        onClick={() => player.isActive && onPlayerClick(player.id)}
                        className={cn(
                            "relative flex items-center p-2.5 rounded-xl border transition-all duration-200 group select-none",
                            player.isActive ? "cursor-grab active:cursor-grabbing hover:border-emerald-300 hover:shadow-sm" : "cursor-default opacity-60 bg-slate-50 border-transparent grayscale",
                            selectedPlayerId === player.id
                                ? "bg-indigo-50 border-indigo-500 shadow-md z-10"
                                : "bg-white border-slate-100"
                        )}
                    >
                        {/* Status Indicator (Left) */}
                        <div className="mr-3 flex flex-col items-center gap-1">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-sm transition-colors",
                                player.isActive 
                                    ? (player.gender === 'M' ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-pink-50 border-pink-200 text-pink-600")
                                    : "bg-slate-100 border-slate-200 text-slate-400"
                            )}>
                                <User size={18} strokeWidth={2.5} />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <p className={cn(
                                    "font-bold text-sm truncate",
                                    player.isActive ? "text-slate-800" : "text-slate-400"
                                )}>
                                    {player.name}
                                </p>
                                {/* New Level Badge */}
                                <LevelBadge level={player.level} />
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                                        status.bgClass, status.colorClass, "border", status.borderClass
                                    )}>
                                        {status.type === 'playing' && <Activity size={10} className="animate-pulse" />}
                                        {status.type === 'waiting' && <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>}
                                        {status.type === 'allocated' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>}
                                        {status.type === 'resting' && <Pause size={10} />}
                                        {status.label}
                                    </div>
                                    
                                    {/* Played Count Badge */}
                                    {playedCounts[player.id] !== undefined && playedCounts[player.id] > 0 && (
                                        <span className="flex items-center bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                                            <Swords size={10} className="mr-1" />
                                            {playedCounts[player.id]} 場
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions (Visible on Active or Hover) */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggleStatus(player.id); }}
                                className={cn(
                                    "p-2 rounded-lg transition-all border",
                                    player.isActive 
                                        ? "bg-white border-slate-200 text-emerald-600 hover:bg-slate-50 hover:border-emerald-300" 
                                        : "bg-slate-100 border-transparent text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                                )}
                                title={player.isActive ? "設為休息" : "設為上場"}
                            >
                                <Power size={16} strokeWidth={player.isActive ? 3 : 2} />
                            </button>
                            
                            <button
                                onClick={(e) => { e.stopPropagation(); onEditPlayer(player.id); }}
                                className="p-2 text-slate-300 hover:text-blue-500 rounded-lg transition-colors"
                            >
                                <Edit3 size={16} />
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); onDeletePlayer(player.id); }}
                                className="p-2 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};
