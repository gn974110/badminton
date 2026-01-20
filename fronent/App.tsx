
import React, { useState, useEffect, useMemo } from 'react';
import { Player, Court, RoundRecord, MatchRecord } from './types';
import { generateId, shuffleArray, cn, smartAllocation, getPlayerStats, arePlayerSetsEqual } from './utils';
import { PlayerList } from './components/PlayerList';
import { CourtCard } from './components/CourtCard';
import { Button } from './components/Button';
import { Modal } from './components/Modal';
import { HistoryModal } from './components/HistoryModal';
import { RulesModal } from './components/RulesModal';
import { PlayerPickerModal } from './components/PlayerPickerModal'; // New import
import { AdBanner } from './components/AdBanner'; // New import
import { Toast, ToastType } from './components/Toast';
import { 
  Shuffle, 
  RotateCcw, 
  Plus, 
  Users, 
  Grid2X2, 
  Trophy,
  Clock,
  ArrowRight,
  CircleHelp,
  Trash2,
  Crown
} from 'lucide-react';

const STORAGE_KEY = 'badminton-app-state-v6';

// Courts init with fixed array of 4 nulls
const INITIAL_COURTS: Court[] = [
  { id: 'c1', name: '第一場地', type: 'A', status: 'allocating', playerIds: [null, null, null, null] },
  { id: 'c2', name: '第二場地', type: 'A', status: 'allocating', playerIds: [null, null, null, null] },
];

// Specific Initial Players as requested
const INITIAL_PLAYERS: Player[] = [
  { id: 'p1', name: '學陽', isActive: true, gender: 'M', level: 8 },
  { id: 'p2', name: '彥欣', isActive: true, gender: 'F', level: 6 },
  { id: 'p3', name: '宇恆', isActive: true, gender: 'M', level: 7 },
  { id: 'p4', name: '志豪', isActive: true, gender: 'M', level: 9 },
  { id: 'p5', name: '佩雲', isActive: true, gender: 'F', level: 5 },
  { id: 'p6', name: 'jacky', isActive: false, gender: 'M', level: 4 }, // Resting
];

export default function App() {
  // --- State ---
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [courts, setCourts] = useState<Court[]>(INITIAL_COURTS);
  const [rounds, setRounds] = useState<RoundRecord[]>([]);
  
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'courts' | 'roster'>('courts');
  
  const [isCourtModalOpen, setIsCourtModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [newCourtName, setNewCourtName] = useState('');
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);

  // Player Editing State
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState<'M' | 'F'>('M');
  const [editLevel, setEditLevel] = useState<number>(3);

  // Player Picker Modal State
  const [pickerTarget, setPickerTarget] = useState<{ courtId: string, slotIndex: number } | null>(null);

  // Deletion Confirmation State
  const [courtToDelete, setCourtToDelete] = useState<string | null>(null);
  
  // Finish Game Confirmation State (Replaces Stop)
  const [courtFinishingId, setCourtFinishingId] = useState<string | null>(null);

  // Toast State
  const [toast, setToast] = useState<{ msg: string; type: ToastType; show: boolean }>({
    msg: '',
    type: 'info',
    show: false
  });

  // --- Effects ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPlayers(parsed.players || INITIAL_PLAYERS);
        // Migration check: if loaded courts have old format (array length < 4 or not 4), reset or fix them
        const loadedCourts = parsed.courts || INITIAL_COURTS;
        // Fix structure if migrating from V5
        const fixedCourts = loadedCourts.map((c: any) => ({
            ...c,
            playerIds: Array.isArray(c.playerIds) && c.playerIds.length === 4 
                ? c.playerIds 
                : [null, null, null, null] // Reset if bad format
        }));
        setCourts(fixedCourts);
        setRounds(parsed.rounds || []);
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ players, courts, rounds }));
  }, [players, courts, rounds]);

  // --- Memoized Stats ---
  const playedCounts = useMemo(() => getPlayerStats(players, rounds), [players, rounds]);

  // --- Helpers ---
  // Get players for rendering cards (preserves nulls so slots are rendered correctly)
  const getCourtSlots = (courtId: string) => {
    const court = courts.find(c => c.id === courtId);
    if (!court) return [null, null, null, null];
    return court.playerIds.map(id => id ? players.find(p => p.id === id) || null : null);
  };

  const showToast = (msg: string, type: ToastType = 'info') => {
    setToast({ msg, type, show: true });
  };

  // --- Logic ---
  const handlePlayerClick = (id: string) => {
      if (selectedPlayerId === id) {
          setSelectedPlayerId(null);
      } else {
          setSelectedPlayerId(id);
      }
  };

  const handleCourtClick = (targetCourtId: string) => {
      // Legacy/Fallback handler: auto-fill first empty slot
      const targetCourt = courts.find(c => c.id === targetCourtId);
      if (!selectedPlayerId || !targetCourt || targetCourt.status === 'playing') return;

      const emptyIndex = targetCourt.playerIds.indexOf(null);
      if (emptyIndex !== -1) {
          addPlayerToCourt(targetCourtId, selectedPlayerId, emptyIndex);
          setSelectedPlayerId(null);
          if (navigator.vibrate) navigator.vibrate(50);
      } else {
          showToast("場地已滿", 'error');
      }
  };

  const handleSlotClick = (courtId: string, slotIndex: number) => {
    if (selectedPlayerId) {
        // If a player is selected from the roster, place them in this slot
        addPlayerToCourt(courtId, selectedPlayerId, slotIndex);
        setSelectedPlayerId(null);
        if (navigator.vibrate) navigator.vibrate(50);
    } else {
        // If no player is selected, open the picker modal for this specific slot
        setPickerTarget({ courtId, slotIndex });
    }
  };

  const handlePickPlayer = (playerId: string) => {
    if (pickerTarget) {
        addPlayerToCourt(pickerTarget.courtId, playerId, pickerTarget.slotIndex);
        setPickerTarget(null);
        if (navigator.vibrate) navigator.vibrate(50);
    }
  };

  const handleDropPlayer = (targetCourtId: string, playerId: string, slotIndex: number) => {
     addPlayerToCourt(targetCourtId, playerId, slotIndex);
     if (navigator.vibrate) navigator.vibrate(50);
  };

  const addPlayerToCourt = (courtId: string, playerId: string, targetSlotIndex: number) => {
      setCourts(prev => {
          // 1. Remove player from any existing position (in any court)
          const courtsWithoutPlayer = prev.map(c => {
              if (c.status === 'playing') return c;
              return {
                  ...c,
                  playerIds: c.playerIds.map(pid => pid === playerId ? null : pid)
              };
          });

          // 2. Add to new position
          return courtsWithoutPlayer.map(c => {
              if (c.id !== courtId) return c;
              
              const newIds = [...c.playerIds];
              // If target slot is occupied, remove the occupant (move to bench)
              // Or practically, we just overwrite it, effectively moving the previous occupant to bench
              newIds[targetSlotIndex] = playerId;
              
              return { ...c, playerIds: newIds };
          });
      });
  };

  const handleRemoveFromCourt = (playerId: string) => {
      setCourts(prev => prev.map(c => {
          if (c.status === 'playing') return c;
          return {
            ...c,
            playerIds: c.playerIds.map(pid => pid === playerId ? null : pid)
          };
      }));
  };

  const handleAddPlayer = (name: string, gender: 'M' | 'F', level: number) => {
    const newPlayer: Player = { 
        id: generateId(), 
        name, 
        isActive: true,
        gender,
        level 
    };
    setPlayers(prev => [...prev, newPlayer]);
    showToast(`已新增球員：${name}`, 'success');
  };

  const handleTogglePlayerStatus = (id: string) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
    // Remove from courts if inactive
    setCourts(prev => prev.map(c => ({
        ...c,
        playerIds: c.playerIds.map(pid => pid === id ? null : pid)
    })));
  };

  const handleDeletePlayer = (id: string) => {
    if (!confirm("確定刪除球員？")) return;
    setPlayers(prev => prev.filter(p => p.id !== id));
    setCourts(prev => prev.map(c => ({
      ...c,
      playerIds: c.playerIds.map(pid => pid === id ? null : pid)
    })));
    showToast('球員已刪除', 'info');
  };

  const handleStartEditPlayer = (id: string) => {
    const player = players.find(p => p.id === id);
    if (player) {
        setEditingPlayerId(id);
        setEditName(player.name);
        setEditGender(player.gender);
        setEditLevel(player.level);
    }
  };

  const handleSavePlayer = () => {
    if (!editingPlayerId || !editName.trim()) return;
    setPlayers(prev => prev.map(p => 
        p.id === editingPlayerId 
            ? { ...p, name: editName.trim(), gender: editGender, level: editLevel } 
            : p
    ));
    setEditingPlayerId(null);
    showToast('球員資料已更新', 'success');
  };

  const handleAddCourt = () => {
    if (!newCourtName.trim()) return;
    if (editingCourtId) {
      setCourts(prev => prev.map(c => c.id === editingCourtId ? { ...c, name: newCourtName } : c));
      showToast('場地名稱已更新', 'success');
    } else {
      setCourts(prev => [...prev, { id: generateId(), name: newCourtName, type: 'A', status: 'allocating', playerIds: [null, null, null, null] }]);
      showToast('已新增場地', 'success');
    }
    setNewCourtName('');
    setEditingCourtId(null);
    setIsCourtModalOpen(false);
  };

  const handleDeleteCourt = (id: string) => {
    setCourtToDelete(id);
  };

  const confirmDeleteCourt = () => {
    if (courtToDelete) {
        setCourts(prev => prev.filter(c => c.id !== courtToDelete));
        setCourtToDelete(null);
        showToast('場地已刪除', 'info');
    }
  };

  // Court Status Toggle (Allocating <-> Playing)
  const handleToggleCourtStatus = (courtId: string) => {
    const court = courts.find(c => c.id === courtId);
    if (!court) return;

    if (court.status === 'allocating') {
        // Validation: Must have 4 players (no nulls)
        const validPlayerIds = court.playerIds.filter((id): id is string => id !== null);
        if (validPlayerIds.length !== 4) {
            showToast("場地人數不足 4 人，無法開始比賽！", 'error');
            return;
        }

        // --- Record Match History (At Start of Game) ---
        const pNames = validPlayerIds.map(pid => players.find(p => p.id === pid)?.name || 'Unknown');
        const timestamp = Date.now();
        
        const newMatch: MatchRecord = {
            courtName: court.name,
            playerNames: pNames,
            timestamp
        };

        setRounds(prev => {
            const newRounds = [...prev];
            const lastRound = newRounds[newRounds.length - 1];
            
            // Grouping Logic: 
            // If last round was created recently (e.g., < 15 mins), append to it.
            const GROUP_WINDOW_MS = 15 * 60 * 1000; 

            if (lastRound && (timestamp - lastRound.timestamp < GROUP_WINDOW_MS)) {
                // Avoid duplicates in the same round
                // Cast to nullable array for type compat with util function
                const newIdsWithNulls = [...validPlayerIds] as (string|null)[];
                const isDuplicate = lastRound.matches.some(m => 
                    m.courtName === newMatch.courtName && 
                    m.playerNames.join(',') === pNames.join(',')
                );

                if (!isDuplicate) {
                    const updatedLastRound = {
                        ...lastRound,
                        matches: [...lastRound.matches, newMatch]
                    };
                    newRounds[newRounds.length - 1] = updatedLastRound;
                }
                return newRounds;
            } else {
                // Start a new Round
                const newRound: RoundRecord = {
                    id: generateId(),
                    roundNumber: newRounds.length + 1,
                    timestamp,
                    matches: [newMatch]
                };
                return [...newRounds, newRound];
            }
        });

        // Start Match
        setCourts(prev => prev.map(c => c.id === courtId ? { ...c, status: 'playing' } : c));
        showToast("比賽開始！已記錄至歷史", 'success');
    } else {
        // Request Stop -> Open Winner Selection Modal
        setCourtFinishingId(courtId);
    }
  };

  const handleGameFinish = (winner: 'teamA' | 'teamB' | 'none') => {
      if (!courtFinishingId) return;
      
      const court = courts.find(c => c.id === courtFinishingId);
      if (!court) return;

      // 1. Update History Record with Result
      setRounds(prev => {
          const newRounds = [...prev];
          for (let i = newRounds.length - 1; i >= 0; i--) {
              const round = { ...newRounds[i] }; 
              const matches = [...round.matches];
              const matchIndex = matches.findIndex(m => 
                  m.courtName === court.name && !m.result
              );

              if (matchIndex !== -1) {
                  matches[matchIndex] = {
                      ...matches[matchIndex],
                      result: winner === 'none' ? undefined : winner
                  };
                  round.matches = matches;
                  newRounds[i] = round;
                  break; 
              }
          }
          return newRounds;
      });

      // 2. Reset Court and Clear Players
      setCourts(prev => prev.map(c => {
          if (c.id !== courtFinishingId) return c;
          return {
              ...c,
              status: 'allocating',
              playerIds: [null, null, null, null] // Reset to 4 empty slots
          };
      }));

      setCourtFinishingId(null);
      if (winner !== 'none') {
        showToast("比賽結束，已記錄勝負", 'success');
      } else {
        showToast("比賽已取消 (無勝負)", 'info');
      }
  };

  const handleShuffle = () => {
      const activePlayers = players.filter(p => p.isActive);
      if (activePlayers.length === 0) {
          showToast("沒有出席的球員", 'error');
          return;
      }
      const shuffled = shuffleArray([...activePlayers]);
      const newCourts = courts.map(c => {
          if (c.status === 'playing') return c;
          return { ...c, playerIds: [null, null, null, null] as (string | null)[] };
      });
      
      let pIdx = 0;
      for(const court of newCourts) {
          if (court.status === 'playing') continue;
          const newIds = [...court.playerIds];
          for(let i=0; i<4; i++) {
              if(pIdx < shuffled.length) {
                  newIds[i] = shuffled[pIdx].id;
                  pIdx++;
              }
          }
          court.playerIds = newIds;
      }
      setCourts(newCourts);
      setSelectedPlayerId(null);
      showToast("隨機分配完成", 'success');
  };

  const handleSmartAllocation = () => {
      const allocatedCourts = smartAllocation(players, courts, rounds);
      setCourts(allocatedCourts);
      setSelectedPlayerId(null);
      showToast("智慧排點完成", 'success');
  };

  const handleClearCourts = () => {
      if(!confirm("確定清空所有場地分配？")) return;
      setCourts(prev => prev.map(c => {
          if (c.status === 'playing') return c; 
          return { ...c, status: 'allocating', playerIds: [null, null, null, null] };
      }));
      setSelectedPlayerId(null);
      showToast("場地已清空", 'info');
  };

  // Get players for the finishing court for the modal
  const finishingCourtPlayers = useMemo(() => {
      if (!courtFinishingId) return { teamA: [], teamB: [] };
      const court = courts.find(c => c.id === courtFinishingId);
      if (!court) return { teamA: [], teamB: [] };
      
      const pList = court.playerIds.map(id => id ? players.find(p => p.id === id) : null);
      return {
          teamA: [pList[0], pList[1]].filter(Boolean) as Player[],
          teamB: [pList[2], pList[3]].filter(Boolean) as Player[]
      };
  }, [courtFinishingId, courts, players]);

  return (
    <div className="flex flex-col h-dvh bg-grid-pattern text-slate-900 overflow-hidden font-sans select-none pl-safe pr-safe">
      
      <Toast 
        message={toast.msg} 
        type={toast.type} 
        isVisible={toast.show} 
        onClose={() => setToast(t => ({...t, show: false}))} 
      />

      {/* --- Header --- */}
      <header className="bg-emerald-900 text-white shadow-md z-30 flex-shrink-0 pt-safe">
        <div className="px-4 py-3 flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
             <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-2 rounded-lg shadow-lg shadow-yellow-500/20">
                <Trophy size={20} className="text-white" />
             </div>
             <div>
                 <h1 className="font-extrabold text-lg leading-none tracking-tight text-white">羽球排點王</h1>
                 <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest opacity-80">專業場地管理</p>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
                size="sm" 
                className="bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border-none"
                onClick={() => setShowHistory(true)}
            >
                <Clock size={18} />
            </Button>
            <Button 
                size="sm" 
                className="bg-emerald-800 hover:bg-emerald-700 border border-emerald-700 text-emerald-100 hidden sm:flex"
                onClick={handleClearCourts}
            >
                <RotateCcw size={16} className="mr-1" /> 重置
            </Button>
            <Button 
                size="sm" 
                className="bg-white text-emerald-900 hover:bg-slate-100 border-none font-bold shadow-md"
                onClick={() => {
                    setNewCourtName('');
                    setEditingCourtId(null);
                    setIsCourtModalOpen(true);
                }}
            >
                <Plus size={16} className="mr-1" /> 場地
            </Button>
          </div>
        </div>
        
        {/* Toolbar */}
        <div className="px-4 py-2 bg-emerald-950 border-t border-emerald-800 flex items-center justify-between gap-3 overflow-x-auto hide-scrollbar">
             <div className="flex gap-2">
                <button onClick={handleShuffle} className="flex items-center px-3 py-1.5 rounded-md bg-emerald-800/50 text-emerald-100 text-xs font-bold hover:bg-emerald-700 transition-all active:scale-95 border border-emerald-700/50 whitespace-nowrap">
                    <Shuffle size={14} className="mr-2" /> 隨機
                </button>
             </div>

             <div className="flex items-center gap-2">
                <button 
                    onClick={() => setShowRules(true)}
                    className="p-1.5 text-emerald-400 hover:text-white transition-colors"
                    title="排點規則"
                >
                    <CircleHelp size={18} />
                </button>
                <button 
                    onClick={handleSmartAllocation}
                    className="flex items-center px-4 py-1.5 rounded-md bg-yellow-500 text-yellow-950 text-xs font-bold hover:bg-yellow-400 transition-all active:scale-95 shadow-md whitespace-nowrap"
                >
                    智慧排點 (Smart Allocate) <ArrowRight size={14} className="ml-2" />
                </button>
             </div>
        </div>
      </header>

      {/* --- Main Layout --- */}
      <div className="flex-1 flex overflow-hidden relative max-w-7xl mx-auto w-full">
        
        {/* Desktop Sidebar: Roster (Visible on md+) */}
        <aside className="hidden md:flex w-80 border-r border-slate-200 flex-col z-20 h-full bg-white">
             <PlayerList 
                players={players}
                courts={courts}
                selectedPlayerId={selectedPlayerId}
                playedCounts={playedCounts}
                onPlayerClick={handlePlayerClick}
                onAddPlayer={handleAddPlayer}
                onToggleStatus={handleTogglePlayerStatus}
                onDeletePlayer={handleDeletePlayer}
                onEditPlayer={handleStartEditPlayer}
             />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 relative flex flex-col overflow-hidden bg-slate-50/50">
           
           {/* MOBILE ROSTER VIEW */}
           {activeTab === 'roster' && (
               <div className="md:hidden flex-1 flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 relative z-10">
                  <PlayerList 
                    players={players}
                    courts={courts}
                    selectedPlayerId={selectedPlayerId}
                    playedCounts={playedCounts}
                    onPlayerClick={handlePlayerClick}
                    onAddPlayer={handleAddPlayer}
                    onToggleStatus={handleTogglePlayerStatus}
                    onDeletePlayer={handleDeletePlayer}
                    onEditPlayer={handleStartEditPlayer}
                    isMobileView={true}
                 />
               </div>
           )}

           {/* COURT GRID */}
           <div className={cn(
               "flex-1 overflow-y-auto p-4 md:p-6 z-0",
               activeTab === 'courts' ? 'block' : 'hidden md:block'
           )}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6 pb-24 md:pb-0">
                    {courts.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4 animate-bounce">
                                <Grid2X2 size={32} className="text-slate-400"/>
                            </div>
                            <p className="text-lg font-bold text-slate-500">目前沒有場地</p>
                            <Button onClick={() => setIsCourtModalOpen(true)} className="bg-emerald-600 text-white mt-4">
                                新增場地
                            </Button>
                        </div>
                    )}
                    {courts.map((court, index) => (
                        <React.Fragment key={court.id}>
                            <CourtCard 
                                court={court}
                                players={getCourtSlots(court.id)}
                                selectedPlayerId={selectedPlayerId}
                                playedCounts={playedCounts}
                                onPlayerClick={handlePlayerClick}
                                onCourtClick={handleCourtClick}
                                onSlotClick={handleSlotClick}
                                onRemovePlayer={handleRemoveFromCourt}
                                onDeleteCourt={handleDeleteCourt}
                                onEditCourt={(id) => {
                                    setEditingCourtId(id);
                                    setNewCourtName(courts.find(c => c.id === id)?.name || '');
                                    setIsCourtModalOpen(true);
                                }}
                                onDropPlayer={handleDropPlayer}
                                onToggleStatus={handleToggleCourtStatus}
                            />
                            {/* Insert Ad Banner Every 2 Courts (Full Width) */}
                            {(index + 1) % 2 === 0 && (
                                <div className="col-span-full">
                                    <AdBanner 
                                        // client="ca-pub-XXXXXXXXXXXXXXXX" 
                                        // slot="XXXXXXXXXX"
                                        // Add your actual AdSense IDs here when ready
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
           </div>
        </main>
      </div>

      {/* --- Mobile Bottom Nav --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-40 flex h-16 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
         <button 
            onClick={() => setActiveTab('courts')}
            className="flex-1 flex flex-col items-center justify-center gap-1 active:bg-slate-50 outline-none"
         >
            <div className={cn("p-1 rounded-xl transition-colors", activeTab === 'courts' ? "bg-emerald-100 text-emerald-700" : "text-slate-400")}>
                <Grid2X2 size={22} strokeWidth={2.5} />
            </div>
            <span className={cn("text-[10px] font-bold", activeTab === 'courts' ? "text-emerald-700" : "text-slate-400")}>場地</span>
         </button>
         
         <button 
            onClick={() => setActiveTab('roster')}
            className="flex-1 flex flex-col items-center justify-center gap-1 active:bg-slate-50 relative outline-none"
         >
            <div className={cn("p-1 rounded-xl transition-colors", activeTab === 'roster' ? "bg-emerald-100 text-emerald-700" : "text-slate-400")}>
                <Users size={22} strokeWidth={2.5} />
            </div>
            <span className={cn("text-[10px] font-bold", activeTab === 'roster' ? "text-emerald-700" : "text-slate-400")}>名單</span>
            
            {selectedPlayerId && (
                <span className="absolute top-3 right-[35%] w-3 h-3 bg-yellow-400 border-2 border-white rounded-full animate-bounce shadow-sm"></span>
            )}
         </button>
      </nav>

      {/* --- Modals --- */}
      <Modal
        isOpen={isCourtModalOpen}
        onClose={() => setIsCourtModalOpen(false)}
        title={editingCourtId ? "編輯場地" : "新增場地"}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">場地名稱</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all font-medium"
              placeholder="例如：第一場地..."
              value={newCourtName}
              onChange={e => setNewCourtName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsCourtModalOpen(false)}>取消</Button>
            <Button onClick={handleAddCourt} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200">
                {editingCourtId ? "儲存" : "新增場地"}
            </Button>
          </div>
        </div>
      </Modal>
      
      <Modal
        isOpen={!!courtToDelete}
        onClose={() => setCourtToDelete(null)}
        title="刪除場地？"
      >
        <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg flex gap-3 items-start">
                <div className="p-2 bg-red-100 rounded-full text-red-600 shrink-0">
                    <Trash2 size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-red-900 text-sm">確定刪除？</h4>
                    <p className="text-xs text-red-700 mt-1 leading-relaxed">
                        即將刪除 <span className="font-bold">{courts.find(c => c.id === courtToDelete)?.name}</span>。
                        該場地上的球員將會回到名單中。
                    </p>
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setCourtToDelete(null)}>取消</Button>
                <Button onClick={confirmDeleteCourt} variant="danger">
                    刪除場地
                </Button>
            </div>
        </div>
      </Modal>

      {/* FINISH GAME / SELECT WINNER MODAL */}
      <Modal
        isOpen={!!courtFinishingId}
        onClose={() => setCourtFinishingId(null)}
        title="比賽結束，誰贏了？"
      >
        <div className="space-y-5">
            <p className="text-center text-sm text-slate-500">請選擇獲勝的隊伍，系統將記錄勝負並清空場地。</p>
            
            <div className="grid grid-cols-2 gap-4">
                {/* TEAM A BUTTON */}
                <button 
                    onClick={() => handleGameFinish('teamA')}
                    className="relative flex flex-col items-center p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 hover:shadow-md transition-all group"
                >
                    <span className="absolute -top-3 bg-white text-blue-600 text-xs font-black px-2 py-1 border border-blue-100 rounded-full shadow-sm">Team 1</span>
                    <div className="mt-2 space-y-1 text-center">
                        {finishingCourtPlayers.teamA.map(p => (
                            <div key={p.id} className="font-bold text-slate-800">{p.name}</div>
                        ))}
                        {finishingCourtPlayers.teamA.length === 0 && <span className="text-slate-400 text-sm">-</span>}
                    </div>
                    <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600">
                        <Crown size={24} />
                    </div>
                </button>

                {/* TEAM B BUTTON */}
                <button 
                    onClick={() => handleGameFinish('teamB')}
                    className="relative flex flex-col items-center p-4 rounded-xl border-2 border-pink-200 bg-pink-50 hover:bg-pink-100 hover:border-pink-400 hover:shadow-md transition-all group"
                >
                    <span className="absolute -top-3 bg-white text-pink-600 text-xs font-black px-2 py-1 border border-pink-100 rounded-full shadow-sm">Team 2</span>
                    <div className="mt-2 space-y-1 text-center">
                        {finishingCourtPlayers.teamB.map(p => (
                            <div key={p.id} className="font-bold text-slate-800">{p.name}</div>
                        ))}
                        {finishingCourtPlayers.teamB.length === 0 && <span className="text-slate-400 text-sm">-</span>}
                    </div>
                    <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity text-pink-600">
                        <Crown size={24} />
                    </div>
                </button>
            </div>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs">或是</span>
                <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <div className="flex justify-center">
                <Button 
                    variant="ghost" 
                    onClick={() => handleGameFinish('none')}
                    className="text-slate-400 hover:text-slate-600"
                >
                    不記錄勝負，直接結束
                </Button>
            </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!editingPlayerId}
        onClose={() => setEditingPlayerId(null)}
        title="編輯球員"
      >
         <div className="space-y-4">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">姓名</label>
                <input 
                    type="text"
                    className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all font-medium"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                />
             </div>
             
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">性別</label>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setEditGender('M')}
                        className={cn(
                            "flex-1 py-2 rounded-xl border-2 font-bold transition-all",
                            editGender === 'M' ? "border-blue-500 bg-blue-50 text-blue-600" : "border-slate-100 text-slate-400 hover:bg-slate-50"
                        )}
                    >
                        男生
                    </button>
                    <button 
                        onClick={() => setEditGender('F')}
                        className={cn(
                            "flex-1 py-2 rounded-xl border-2 font-bold transition-all",
                            editGender === 'F' ? "border-pink-500 bg-pink-50 text-pink-600" : "border-slate-100 text-slate-400 hover:bg-slate-50"
                        )}
                    >
                        女生
                    </button>
                </div>
             </div>

             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">實力等級 (Lv.1 ~ Lv.18)</label>
                <div className="relative w-full">
                    <select 
                        value={editLevel}
                        onChange={(e) => setEditLevel(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 appearance-none transition-all"
                    >
                        {Array.from({ length: 18 }, (_, i) => i + 1).map(lvl => (
                            <option key={lvl} value={lvl}>Level {lvl}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <span className="text-slate-400 text-xs">▼</span>
                    </div>
                </div>
             </div>

             <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setEditingPlayerId(null)}>取消</Button>
                <Button onClick={handleSavePlayer} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    儲存修改
                </Button>
             </div>
         </div>
      </Modal>
      
      <PlayerPickerModal
        isOpen={!!pickerTarget}
        onClose={() => setPickerTarget(null)}
        players={players}
        courts={courts}
        onPick={handlePickPlayer}
      />

      <HistoryModal 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        rounds={rounds} 
      />

      <RulesModal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
      />

    </div>
  );
}
