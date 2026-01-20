
import React, { useState } from 'react';
import { Player, Court } from '../types';
import { Trash2, Wand2, Edit3, Loader2, User, X as XIcon, Play, Square, Activity, Swords, Flame, Plus } from 'lucide-react';
import { cn } from '../utils';
import { generateTeamNameAndStrategy } from '../services/geminiService';
import { LevelBadge } from './LevelBadge';

interface CourtCardProps {
  court: Court;
  players: (Player | null)[]; // Fixed length 4, allowing nulls
  selectedPlayerId: string | null;
  playedCounts: Record<string, number>;
  onPlayerClick: (playerId: string) => void;
  onCourtClick: (courtId: string) => void; 
  onSlotClick: (courtId: string, slotIndex: number) => void; // New Prop
  onRemovePlayer: (playerId: string) => void;
  onDeleteCourt: (courtId: string) => void;
  onEditCourt: (courtId: string) => void;
  onDropPlayer: (courtId: string, playerId: string, slotIndex: number) => void;
  onToggleStatus: (courtId: string) => void;
}

export const CourtCard: React.FC<CourtCardProps> = ({
  court,
  players,
  selectedPlayerId,
  playedCounts,
  onPlayerClick,
  onCourtClick,
  onSlotClick,
  onRemovePlayer,
  onDeleteCourt,
  onEditCourt,
  onDropPlayer,
  onToggleStatus
}) => {
  const [aiData, setAiData] = useState<{ name: string; strategy: string } | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [dragOverSlotIndex, setDragOverSlotIndex] = useState<number | null>(null);

  const isPlaying = court.status === 'playing';
  const filledCount = players.filter(Boolean).length;
  const canStart = filledCount === 4;

  const handleAiGen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (filledCount === 0) return;
    setIsLoadingAi(true);
    const playerNames = players.filter(p => p !== null).map(p => p!.name);
    const result = await generateTeamNameAndStrategy(playerNames);
    setAiData(result);
    setIsLoadingAi(false);
  };

  const isSelected = (id: string) => selectedPlayerId === id;

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault(); 
    if (!isPlaying) {
        setDragOverSlotIndex(slotIndex);
    }
  };

  const handleDragLeave = () => {
    setDragOverSlotIndex(null);
  };

  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    setDragOverSlotIndex(null);
    if (isPlaying) return; 
    const playerId = e.dataTransfer.getData("text/plain");
    if (playerId) {
        onDropPlayer(court.id, playerId, slotIndex);
    }
  };

  // Render a specific slot (0-3)
  const renderSlot = (slotIndex: number) => {
      const player = players[slotIndex];
      // The ghost slot appears specifically on the hovered slot
      const isGhostSlot = dragOverSlotIndex === slotIndex;
      const isTeam1 = slotIndex < 2;

      return (
        <div 
            className="flex-1 h-full w-full relative"
            onDragOver={(e) => handleDragOver(e, slotIndex)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, slotIndex)}
            onClick={(e) => {
                // If empty, trigger slot click (for picker/fill)
                // If occupied, parent div handles click below, but we can also let slot click handle it if needed
                if (!player && !isPlaying) {
                    e.stopPropagation();
                    onSlotClick(court.id, slotIndex);
                }
            }}
        >
            {player ? (
                <div 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        if(!isPlaying) onPlayerClick(player.id); 
                    }}
                    className={cn(
                        "relative flex flex-col items-center justify-center w-full h-full rounded-xl transition-all shadow-sm border-2 overflow-hidden backdrop-blur-sm z-10",
                        isSelected(player.id) 
                            ? "bg-yellow-100 border-yellow-400 scale-105 z-20 shadow-xl" 
                            : isPlaying 
                                ? "bg-slate-900/60 border-rose-500/20 text-white hover:bg-slate-900/80 hover:border-rose-500/40" 
                                : "bg-white/95 border-transparent hover:bg-white hover:scale-[1.02]",
                        // If we are dragging over a filled slot, highlight it as "Replace"
                        isGhostSlot && !isPlaying && "border-emerald-400 ring-2 ring-emerald-200 opacity-80"
                    )}
                >
                    {/* Ghost Overlay for Replacement */}
                    {isGhostSlot && !isPlaying && (
                         <div className="absolute inset-0 flex items-center justify-center bg-emerald-900/20 z-30 pointer-events-none">
                            <span className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">替換</span>
                         </div>
                    )}

                    {/* Avatar */}
                    <div className="flex flex-col items-center justify-center pt-1 relative">
                        <div className={cn(
                            "rounded-full flex items-center justify-center mb-1 border shadow-sm transition-all",
                            "w-10 h-10 sm:w-9 sm:h-9", 
                            isPlaying ? "bg-slate-800 border-slate-700 text-slate-300" :
                            player.gender === 'M' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-pink-50 text-pink-600 border-pink-100"
                        )}>
                            <User className="w-5 h-5 sm:w-4 sm:h-4" strokeWidth={2.5} />
                        </div>
                        {/* Played Count Badge - Mini */}
                        {!isPlaying && (
                            <div className="absolute -top-1 -right-2 bg-slate-600 text-white text-[8px] sm:text-[7px] font-bold px-1.5 py-0.5 sm:px-1 rounded-full shadow-sm border border-white">
                                {playedCounts[player.id] || 0}
                            </div>
                        )}
                    </div>

                    {/* Name & Level */}
                    <div className={cn("w-full flex flex-col items-center pb-1", isPlaying ? "bg-transparent" : "bg-slate-50/50")}>
                        <span className={cn(
                            "font-bold truncate max-w-[90%] leading-tight mt-0.5",
                            "text-[11px] sm:text-[10px]",
                            isPlaying ? "text-slate-200 shadow-black drop-shadow-md" : "text-slate-800"
                        )}>
                            {player.name}
                        </span>
                        <div className="mt-0.5 scale-90 origin-top">
                            <LevelBadge level={player.level} />
                        </div>
                    </div>
                    
                    {/* Quick Remove */}
                    {!isSelected(player.id) && !isPlaying && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onRemovePlayer(player.id); }}
                            className="absolute top-0 right-0 text-slate-300 hover:text-red-500 transition-colors p-1"
                        >
                            <XIcon size={12} />
                        </button>
                    )}
                </div>
            ) : (
                // Empty Slot / Ghost Slot
                <div className={cn(
                    "w-full h-full rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer active:scale-95",
                    isGhostSlot 
                        ? "border-emerald-400 bg-emerald-50/90 border-dashed shadow-[inset_0_0_10px_rgba(16,185,129,0.2)] scale-[0.98]"
                        : "border-white/30 bg-black/5 hover:bg-white/10 border-dashed"
                )}>
                    {isGhostSlot ? (
                        <>
                            <div className="w-8 h-8 rounded-full bg-emerald-200/50 flex items-center justify-center mb-1 animate-pulse text-emerald-700">
                                <User size={16} />
                            </div>
                            <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider animate-pulse">
                                加入 {isTeam1 ? "Team 1" : "Team 2"}
                            </span>
                        </>
                    ) : (
                        // Empty State - Add Plus Icon for clearer interaction
                        selectedPlayerId ? (
                             // Cue that placing is possible
                             <div className="flex flex-col items-center animate-pulse opacity-50">
                                 <div className="w-6 h-6 rounded-full bg-yellow-400/40 mb-1"></div>
                                 <div className="w-8 h-1.5 bg-yellow-400/40 rounded"></div>
                             </div>
                        ) : (
                             // Standard Empty State
                             <div className="group-hover:scale-110 transition-transform opacity-30 text-slate-500">
                                 <Plus size={24} />
                             </div>
                        )
                    )}
                </div>
            )}
        </div>
      );
  };

  return (
    <div className={cn(
        "relative flex flex-col rounded-2xl overflow-hidden shadow-sm transition-all duration-300 bg-white",
        isPlaying ? "ring-2 ring-rose-500/70 shadow-rose-200/50" : "ring-1 ring-slate-200 hover:ring-emerald-400/50"
    )}>
      
      {/* Court Header */}
      <div className={cn(
          "flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b transition-colors relative z-20",
          isPlaying ? "bg-rose-50/90 border-rose-100" : "bg-gradient-to-r from-slate-50 to-white border-slate-100"
      )}>
        <div className="flex items-center gap-2 sm:gap-3">
             <button
                onClick={(e) => { e.stopPropagation(); onToggleStatus(court.id); }}
                disabled={!isPlaying && !canStart}
                className={cn(
                    "w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all shadow-sm shrink-0",
                    isPlaying 
                        ? "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-200 ring-2 ring-rose-100" 
                        : canStart 
                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )}
             >
                {isPlaying ? <Square size={14} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
             </button>

             <div className="flex flex-col">
                <h3 className={cn("font-extrabold text-lg sm:text-base leading-none uppercase tracking-tight", isPlaying ? "text-rose-700" : "text-slate-800")}>
                    {court.name}
                </h3>
                
                <div className="flex items-center gap-1.5 mt-0.5">
                    {isPlaying ? (
                        <>
                             <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                             </span>
                             <span className="text-[11px] sm:text-[10px] font-bold tracking-widest text-rose-500 flex items-center gap-1">
                                比賽進行中 <Flame size={10} className="text-orange-500 animate-pulse" fill="currentColor" />
                             </span>
                        </>
                    ) : (
                        <span className="text-[11px] sm:text-[10px] font-bold tracking-widest text-slate-400">
                             {court.type} 廳 • 準備中
                        </span>
                    )}
                </div>
             </div>
        </div>
        
        <div className="flex items-center gap-0.5 sm:gap-1">
            <button 
                type="button"
                onClick={handleAiGen}
                disabled={isLoadingAi || filledCount === 0}
                className={cn(
                    "p-2 sm:p-1.5 rounded-full transition-colors flex items-center justify-center",
                    aiData ? "text-indigo-600 bg-indigo-50" : "text-slate-400 hover:text-indigo-500 hover:bg-slate-50"
                )}
            >
                {isLoadingAi ? <Loader2 size={18} className="animate-spin"/> : <Wand2 size={18} className="sm:w-4 sm:h-4" />}
            </button>
            <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onEditCourt(court.id); }} 
                className="p-2 sm:p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            >
                <Edit3 size={18} className="sm:w-4 sm:h-4" />
            </button>
            <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onDeleteCourt(court.id); }} 
                className="p-2 sm:p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            >
                <Trash2 size={18} className="sm:w-4 sm:h-4" />
            </button>
        </div>
      </div>

      {/* AI Overlay */}
      {aiData && (
          <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100 flex justify-between items-start animate-in slide-in-from-top relative z-20">
            <div>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">AI 教練</p>
                <p className="font-bold text-indigo-900 text-sm">{aiData.name}</p>
                <p className="text-xs text-indigo-700 mt-0.5 italic">"{aiData.strategy}"</p>
            </div>
            <button onClick={() => setAiData(null)} className="text-indigo-300 hover:text-indigo-600"><XIcon size={14}/></button>
          </div>
      )}

      {/* Court Visual Area */}
      <div 
        onClick={() => !isPlaying && onCourtClick(court.id)}
        // Remove container level drag events to avoid conflict with specific slots
        className={cn(
            "relative transition-all group overflow-hidden",
            "aspect-[4/3] sm:aspect-[16/9]", 
            isPlaying ? "bg-slate-900" : "bg-[#1a9f6e]",
            // Selection cue
            selectedPlayerId && !players.find(p => p && p.id === selectedPlayerId) && !isPlaying ? "ring-4 ring-inset ring-yellow-300 shadow-inner" : ""
        )}
      >
        {/* Background Layers */}
        <div className={cn("absolute inset-0 z-0 opacity-10", isPlaying ? "bg-transparent" : "bg-grid-pattern")} style={{ backgroundSize: '12px 12px' }}></div>
        
        <div 
          className={cn(
              "absolute inset-0 z-0",
              isPlaying && "animate-stripes opacity-20"
          )}
          style={{
            backgroundImage: isPlaying 
                ? `repeating-linear-gradient(45deg, transparent, transparent 10px, #f43f5e 10px, #f43f5e 20px)`
                : `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)`
          }}
        ></div>

        {isPlaying && (
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-900/40 via-slate-900/50 to-transparent animate-pulse"></div>
        )}

        {isPlaying && (
             <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-rose-900/20 to-transparent z-0"></div>
        )}

        {isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none overflow-hidden">
                <div className="relative transform transition-transform animate-pulse opacity-10">
                    <Swords size={140} className="text-rose-500" />
                </div>
                <div className="absolute bottom-2 right-3 flex items-center gap-1 opacity-60">
                    <Activity size={16} className="text-rose-400 animate-pulse" />
                    <span className="text-[10px] font-black text-rose-400 tracking-widest uppercase">LIVE</span>
                </div>
            </div>
        )}

        {/* Court Lines */}
        <div className="absolute inset-1 border border-white/40 rounded-sm pointer-events-none z-0"></div>
        
        {/* Player Grid (Split Team A / Team B) */}
        <div className="relative z-10 flex flex-col h-full py-1.5 px-2 sm:px-3">
            
            {/* TEAM 1 Area */}
            <div className="flex-1 flex flex-col">
                <div className="flex-1 flex gap-2 pb-1 relative">
                    {/* Watermark Label */}
                    <div className="absolute top-0 left-0 text-[9px] font-black text-white/20 uppercase tracking-wider pointer-events-none z-0">Team 1</div>
                    {renderSlot(0)}
                    {renderSlot(1)}
                </div>
            </div>

            {/* NET DIVIDER */}
            <div className="h-[2px] bg-white/40 w-full relative flex items-center justify-center my-0.5">
                 <div className="w-full h-full opacity-50" style={{backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(255,255,255,0.8) 50%)', backgroundSize: '4px 100%'}}></div>
                 <div className="absolute bg-[#1a9f6e] px-1.5 py-0.5 rounded border border-white/30 shadow-sm">
                    <span className="text-[8px] font-bold text-white/80 tracking-widest block leading-none">NET</span>
                 </div>
            </div>

            {/* TEAM 2 Area */}
            <div className="flex-1 flex flex-col">
                <div className="flex-1 flex gap-2 pt-1 relative">
                    {/* Watermark Label */}
                    <div className="absolute bottom-0 right-0 text-[9px] font-black text-white/20 uppercase tracking-wider pointer-events-none z-0">Team 2</div>
                    {renderSlot(2)}
                    {renderSlot(3)}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};
