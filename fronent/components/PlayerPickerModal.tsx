
import React, { useState } from 'react';
import { Modal } from './Modal';
import { Player, Court } from '../types';
import { User, Search, Activity } from 'lucide-react';
import { LevelBadge } from './LevelBadge';
import { cn } from '../utils';

interface PlayerPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  courts: Court[];
  onPick: (playerId: string) => void;
}

export const PlayerPickerModal: React.FC<PlayerPickerModalProps> = ({
  isOpen,
  onClose,
  players,
  courts,
  onPick
}) => {
  const [filter, setFilter] = useState('');

  // Filter Logic:
  // 1. Must be Active
  // 2. Must NOT be in a Playing court
  // 3. Match name filter
  const availablePlayers = players.filter(p => {
    if (!p.isActive) return false;
    
    const court = courts.find(c => c.playerIds.includes(p.id));
    if (court && court.status === 'playing') return false; // Cannot pick playing players

    return p.name.toLowerCase().includes(filter.toLowerCase());
  });

  // Sort: Waiting players first, then Allocated players
  availablePlayers.sort((a, b) => {
      const courtA = courts.find(c => c.playerIds.includes(a.id));
      const courtB = courts.find(c => c.playerIds.includes(b.id));
      
      if (!courtA && courtB) return -1; // A is waiting, B is allocated -> A first
      if (courtA && !courtB) return 1;
      return a.name.localeCompare(b.name);
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="選擇球員">
      <div className="flex flex-col h-[60vh] -mx-2">
        
        {/* Search Bar */}
        <div className="px-2 mb-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="搜尋可上場球員..." 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    autoFocus
                />
            </div>
        </div>

        {/* Player List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-2 pb-4">
            {availablePlayers.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                    <p>沒有可用的球員</p>
                </div>
            ) : (
                availablePlayers.map(p => {
                    const court = courts.find(c => c.playerIds.includes(p.id));
                    const isAllocated = !!court;

                    return (
                        <button
                            key={p.id}
                            onClick={() => onPick(p.id)}
                            className={cn(
                                "w-full flex items-center p-3 rounded-xl border transition-all active:scale-[0.98]",
                                isAllocated 
                                    ? "bg-slate-50 border-slate-200 opacity-80 hover:opacity-100" 
                                    : "bg-white border-slate-200 shadow-sm hover:border-emerald-400 hover:shadow-md"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center border shadow-sm mr-3 shrink-0",
                                p.gender === 'M' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-pink-50 text-pink-600 border-pink-100"
                            )}>
                                <User size={18} />
                            </div>
                            
                            <div className="flex-1 text-left">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-slate-800">{p.name}</span>
                                    <LevelBadge level={p.level} />
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    {isAllocated ? (
                                        <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                            <Activity size={10} /> 在 {court?.name}
                                        </span>
                                    ) : (
                                        <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">等待中</span>
                                    )}
                                </div>
                            </div>

                            <div className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm shadow-emerald-200">
                                選擇
                            </div>
                        </button>
                    );
                })
            )}
        </div>
      </div>
    </Modal>
  );
};
