
import React from 'react';
import { Modal } from './Modal';
import { RoundRecord } from '../types';
import { Clock, Crown } from 'lucide-react';
import { cn } from '../utils';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  rounds: RoundRecord[];
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, rounds }) => {
  // Sort rounds: Newest first
  const sortedRounds = [...rounds].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="對戰歷史紀錄">
      <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-6">
        {sortedRounds.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Clock size={48} className="mx-auto mb-3 opacity-20" />
            <p>尚未有對戰紀錄</p>
            <p className="text-xs mt-1">按下「下一輪」後會自動產生紀錄</p>
          </div>
        ) : (
          sortedRounds.map((round) => (
            <div key={round.id} className="relative pl-5 border-l-2 border-slate-200 pb-2">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm"></div>
              
              <div className="mb-3 flex items-baseline justify-between">
                 <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    第 {round.roundNumber} 輪
                 </h4>
                 <span className="text-xs text-slate-400 font-medium font-mono bg-slate-100 px-2 py-1 rounded-full">
                    {new Date(round.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                 </span>
              </div>

              <div className="grid gap-3">
                {round.matches.map((match, idx) => {
                  const teamA = match.playerNames.slice(0, 2);
                  const teamB = match.playerNames.slice(2, 4);
                  const winA = match.result === 'teamA';
                  const winB = match.result === 'teamB';
                  const hasResult = !!match.result;
                  
                  return (
                    <div key={idx} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm relative overflow-hidden">
                      {/* Decoration */}
                      <div className={cn(
                          "absolute top-0 left-0 w-1 h-full",
                          hasResult ? "bg-slate-300" : "bg-emerald-400"
                      )}></div>

                      {/* Court Name */}
                      <div className="flex items-center justify-between mb-3 pl-2">
                          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                              {match.courtName}
                              {hasResult && <span className="text-slate-400 font-normal px-1">• 已結束</span>}
                          </div>
                      </div>

                      {/* Matchup Grid */}
                      <div className="flex items-center gap-2">
                          {/* Team A */}
                          <div className={cn(
                              "flex-1 rounded-lg border p-2.5 flex flex-col items-center justify-center gap-1.5 relative transition-all",
                              winA ? "bg-yellow-50 border-yellow-300 shadow-sm ring-1 ring-yellow-200" : 
                              winB ? "bg-slate-50 border-slate-100 opacity-60 grayscale-[0.5]" :
                              "bg-blue-50/50 border-blue-100"
                          )}>
                             {winA && (
                                 <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 p-1 rounded-full shadow-sm z-10">
                                     <Crown size={12} fill="currentColor" />
                                 </div>
                             )}
                             <span className={cn(
                                 "absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-black px-1 uppercase tracking-widest",
                                 winA ? "text-yellow-600 bg-white" : "text-blue-300 bg-white"
                             )}>Team 1</span>
                             
                             {teamA.length > 0 ? teamA.map((name, i) => (
                                 <div key={i} className="flex items-center gap-1.5 w-full justify-center">
                                    <div className={cn("w-1.5 h-1.5 rounded-full", winA ? "bg-yellow-500" : "bg-blue-400")}></div>
                                    <span className={cn("font-bold text-sm", winA ? "text-yellow-900" : "text-slate-700")}>{name}</span>
                                 </div>
                             )) : <span className="text-xs text-slate-300">-</span>}
                          </div>

                          {/* VS Badge */}
                          <div className="flex flex-col items-center justify-center px-1">
                            <span className="text-xs font-black text-slate-300 italic">VS</span>
                          </div>

                          {/* Team B */}
                          <div className={cn(
                              "flex-1 rounded-lg border p-2.5 flex flex-col items-center justify-center gap-1.5 relative transition-all",
                              winB ? "bg-yellow-50 border-yellow-300 shadow-sm ring-1 ring-yellow-200" : 
                              winA ? "bg-slate-50 border-slate-100 opacity-60 grayscale-[0.5]" :
                              "bg-pink-50/50 border-pink-100"
                          )}>
                             {winB && (
                                 <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 p-1 rounded-full shadow-sm z-10">
                                     <Crown size={12} fill="currentColor" />
                                 </div>
                             )}
                             <span className={cn(
                                 "absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-black px-1 uppercase tracking-widest",
                                 winB ? "text-yellow-600 bg-white" : "text-pink-300 bg-white"
                             )}>Team 2</span>
                             
                             {teamB.length > 0 ? teamB.map((name, i) => (
                                 <div key={i} className="flex items-center gap-1.5 w-full justify-center">
                                    <div className={cn("w-1.5 h-1.5 rounded-full", winB ? "bg-yellow-500" : "bg-pink-400")}></div>
                                    <span className={cn("font-bold text-sm", winB ? "text-yellow-900" : "text-slate-700")}>{name}</span>
                                 </div>
                             )) : <span className="text-xs text-slate-300">-</span>}
                          </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};