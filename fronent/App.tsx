import React, { useState, useCallback, useMemo } from 'react';
import { Player, Court, RoundRecord } from './types';
import { cn } from './utils';
import { PlayerList } from './components/PlayerList';
import { CourtCard } from './components/CourtCard';
import { Button } from './components/Button';
import { Modal } from './components/Modal';
import { HistoryModal } from './components/HistoryModal';
import { RulesModal } from './components/RulesModal';
import { PlayerPickerModal } from './components/PlayerPickerModal';
import { ConfirmModal } from './components/ConfirmModal';
import { AdBanner } from './components/AdBanner';
import { Toast } from './components/Toast';
import {
  useLocalStorageWithUndo,
  useToast,
  useCourtModal,
  usePlayerModal,
  useAppModals,
  usePlayerManagement,
  useCourtManagement,
  useMatchHistory,
  useConfirm,
} from './hooks';
import { validatePlayerName, validateCourtName } from './utils/validation';
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
  Crown,
  Undo2,
  Redo2,
} from 'lucide-react';

const STORAGE_KEY = 'badminton-app-state-v6';

// Initial data
const INITIAL_COURTS: Court[] = [
  { id: 'c1', name: '第一場地', type: 'A', status: 'allocating', playerIds: [null, null, null, null] },
  { id: 'c2', name: '第二場地', type: 'A', status: 'allocating', playerIds: [null, null, null, null] },
];

const INITIAL_PLAYERS: Player[] = [
  { id: 'p1', name: '學陽', isActive: true, gender: 'M', level: 8 },
  { id: 'p2', name: '彥欣', isActive: true, gender: 'F', level: 6 },
  { id: 'p3', name: '宇恆', isActive: true, gender: 'M', level: 7 },
  { id: 'p4', name: '志豪', isActive: true, gender: 'M', level: 9 },
  { id: 'p5', name: '佩雲', isActive: true, gender: 'F', level: 5 },
  { id: 'p6', name: 'jacky', isActive: false, gender: 'M', level: 4 },
];

interface AppState {
  players: Player[];
  courts: Court[];
  rounds: RoundRecord[];
}

const INITIAL_STATE: AppState = {
  players: INITIAL_PLAYERS,
  courts: INITIAL_COURTS,
  rounds: [],
};

export default function App() {
  // --- Persistent State with debounced localStorage and Undo/Redo ---
  const {
    state: appState,
    setState: setAppState,
    undo,
    redo,
    canUndo,
    canRedo,
    isLoaded,
    error: storageError,
  } = useLocalStorageWithUndo<AppState>(
    STORAGE_KEY,
    INITIAL_STATE,
    {
      debounceMs: 500,
      maxHistory: 30,
      onError: (err) => console.error('Storage error:', err),
    }
  );

  // Migration: fix court structure if needed
  const migratedState = useMemo(() => {
    const fixedCourts = appState.courts.map(c => ({
      ...c,
      playerIds: Array.isArray(c.playerIds) && c.playerIds.length === 4
        ? c.playerIds
        : [null, null, null, null],
    }));
    return { ...appState, courts: fixedCourts };
  }, [appState]);

  const { players, courts, rounds } = migratedState;

  // State setters that update the whole appState
  const setPlayers = useCallback((value: Player[] | ((prev: Player[]) => Player[])) => {
    setAppState(prev => ({
      ...prev,
      players: typeof value === 'function' ? value(prev.players) : value,
    }));
  }, [setAppState]);

  const setCourts = useCallback((value: Court[] | ((prev: Court[]) => Court[])) => {
    setAppState(prev => ({
      ...prev,
      courts: typeof value === 'function' ? value(prev.courts) : value,
    }));
  }, [setAppState]);

  const setRounds = useCallback((value: RoundRecord[] | ((prev: RoundRecord[]) => RoundRecord[])) => {
    setAppState(prev => ({
      ...prev,
      rounds: typeof value === 'function' ? value(prev.rounds) : value,
    }));
  }, [setAppState]);

  // --- UI State ---
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'courts' | 'roster'>('courts');

  // --- Custom Hooks ---
  const { toast, showToast, hideToast } = useToast();

  // Court Modal (add/edit court, delete confirmation)
  const {
    isCourtModalOpen,
    editingCourtId,
    newCourtName,
    openCourtModal,
    closeCourtModal,
    setNewCourtName,
    courtToDelete,
    confirmDeleteCourt,
    cancelDeleteCourt,
  } = useCourtModal();

  // Player Modal (edit player, player picker)
  const {
    editingPlayerId,
    editName,
    editGender,
    editLevel,
    openPlayerEdit,
    closePlayerEdit,
    setEditName,
    setEditGender,
    setEditLevel,
    pickerTarget,
    openPlayerPicker,
    closePlayerPicker,
  } = usePlayerModal();

  // App Modals (history, rules, finish game)
  const {
    showHistory,
    showRules,
    courtFinishingId,
    openHistory,
    closeHistory,
    openRules,
    closeRules,
    openFinishGame,
    closeFinishGame,
  } = useAppModals();

  const {
    playedCounts,
    addPlayer,
    togglePlayerStatus,
    deletePlayer,
    updatePlayer,
  } = usePlayerManagement({
    players,
    setPlayers,
    courts,
    setCourts,
    rounds,
    showToast,
  });

  const {
    getCourtSlots,
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
  } = useCourtManagement({
    players,
    courts,
    setCourts,
    rounds,
    showToast,
  });

  const {
    recordMatchStart,
    recordMatchResult,
    getFinishingCourtPlayers,
  } = useMatchHistory({
    players,
    courts,
    rounds,
    setRounds,
    showToast,
  });

  const { confirmState, confirm, closeConfirm, handleConfirm } = useConfirm();

  // --- Memoized Values ---
  const finishingCourtPlayers = useMemo(
    () => getFinishingCourtPlayers(courtFinishingId),
    [getFinishingCourtPlayers, courtFinishingId]
  );

  // --- Event Handlers ---
  const handlePlayerClick = useCallback((id: string) => {
    setSelectedPlayerId(prev => (prev === id ? null : id));
  }, []);

  const handleCourtClick = useCallback((targetCourtId: string) => {
    const targetCourt = courts.find(c => c.id === targetCourtId);
    if (!selectedPlayerId || !targetCourt || targetCourt.status === 'playing') return;

    const emptyIndex = targetCourt.playerIds.indexOf(null);
    if (emptyIndex !== -1) {
      addPlayerToCourt(targetCourtId, selectedPlayerId, emptyIndex);
      setSelectedPlayerId(null);
      if (navigator.vibrate) navigator.vibrate(50);
    } else {
      showToast('場地已滿', 'error');
    }
  }, [courts, selectedPlayerId, addPlayerToCourt, showToast]);

  const handleSlotClick = useCallback((courtId: string, slotIndex: number) => {
    if (selectedPlayerId) {
      addPlayerToCourt(courtId, selectedPlayerId, slotIndex);
      setSelectedPlayerId(null);
      if (navigator.vibrate) navigator.vibrate(50);
    } else {
      openPlayerPicker(courtId, slotIndex);
    }
  }, [selectedPlayerId, addPlayerToCourt, openPlayerPicker]);

  const handlePickPlayer = useCallback((playerId: string) => {
    if (pickerTarget) {
      addPlayerToCourt(pickerTarget.courtId, playerId, pickerTarget.slotIndex);
      closePlayerPicker();
      if (navigator.vibrate) navigator.vibrate(50);
    }
  }, [pickerTarget, addPlayerToCourt, closePlayerPicker]);

  const handleDropPlayer = useCallback((targetCourtId: string, playerId: string, slotIndex: number) => {
    addPlayerToCourt(targetCourtId, playerId, slotIndex);
    if (navigator.vibrate) navigator.vibrate(50);
  }, [addPlayerToCourt]);

  const handleRemoveFromCourt = useCallback((playerId: string) => {
    removePlayerFromCourt(playerId);
  }, [removePlayerFromCourt]);

  const handleDeletePlayer = useCallback((id: string) => {
    const player = players.find(p => p.id === id);
    confirm({
      title: '刪除球員',
      message: `確定要刪除球員「${player?.name || ''}」嗎？此操作無法復原。`,
      confirmText: '刪除',
      variant: 'danger',
      onConfirm: () => deletePlayer(id),
    });
  }, [players, deletePlayer, confirm]);

  const handleStartEditPlayer = useCallback((id: string) => {
    const player = players.find(p => p.id === id);
    if (player) {
      openPlayerEdit(id, player.name, player.gender, player.level);
    }
  }, [players, openPlayerEdit]);

  const handleSavePlayer = useCallback(() => {
    if (!editingPlayerId) return;

    const nameValidation = validatePlayerName(editName, { items: players, excludeId: editingPlayerId });
    if (!nameValidation.isValid) {
      showToast(nameValidation.error || '驗證失敗', 'error');
      return;
    }

    updatePlayer(editingPlayerId, {
      name: editName,
      gender: editGender,
      level: editLevel,
    });
    closePlayerEdit();
  }, [editingPlayerId, editName, editGender, editLevel, players, updatePlayer, closePlayerEdit, showToast]);

  const handleAddCourt = useCallback(() => {
    const nameValidation = validateCourtName(newCourtName, { items: courts, excludeId: editingCourtId ?? undefined });
    if (!nameValidation.isValid) {
      showToast(nameValidation.error || '驗證失敗', 'error');
      return;
    }

    if (editingCourtId) {
      updateCourtName(editingCourtId, newCourtName);
    } else {
      addCourt(newCourtName);
    }
    closeCourtModal();
  }, [newCourtName, editingCourtId, courts, updateCourtName, addCourt, closeCourtModal, showToast]);

  const handleDeleteCourt = useCallback((id: string) => {
    confirmDeleteCourt(id);
  }, [confirmDeleteCourt]);

  const handleConfirmDeleteCourt = useCallback(() => {
    if (courtToDelete) {
      deleteCourt(courtToDelete);
      cancelDeleteCourt();
    }
  }, [courtToDelete, deleteCourt, cancelDeleteCourt]);

  const handleToggleCourtStatus = useCallback((courtId: string) => {
    const result = toggleCourtStatus(courtId);
    if (result.success) {
      if (result.needsWinnerSelection) {
        openFinishGame(courtId);
      } else {
        recordMatchStart(courtId);
      }
    }
  }, [toggleCourtStatus, openFinishGame, recordMatchStart]);

  const handleGameFinish = useCallback((winner: 'teamA' | 'teamB' | 'none') => {
    if (!courtFinishingId) return;
    recordMatchResult(courtFinishingId, winner);
    resetCourt(courtFinishingId);
    closeFinishGame();
  }, [courtFinishingId, recordMatchResult, resetCourt, closeFinishGame]);

  const handleShuffle = useCallback(() => {
    shufflePlayers();
    setSelectedPlayerId(null);
  }, [shufflePlayers]);

  const handleSmartAllocation = useCallback(() => {
    smartAllocate();
    setSelectedPlayerId(null);
  }, [smartAllocate]);

  const handleClearCourts = useCallback(() => {
    confirm({
      title: '清空場地',
      message: '確定要清空所有場地分配嗎？場地上的球員將回到名單中。',
      confirmText: '清空',
      variant: 'warning',
      onConfirm: () => {
        clearAllCourts();
        setSelectedPlayerId(null);
      },
    });
  }, [clearAllCourts, confirm]);

  const handleEditCourt = useCallback((id: string) => {
    const court = courts.find(c => c.id === id);
    openCourtModal(id, court?.name);
  }, [courts, openCourtModal]);

  // --- Loading State ---
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-dvh bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">載入中...</p>
        </div>
      </div>
    );
  }

  // --- Storage Error Display ---
  if (storageError) {
    console.warn('Storage error detected:', storageError);
  }

  return (
    <div className="flex flex-col h-dvh bg-grid-pattern text-slate-900 overflow-hidden font-sans select-none pl-safe pr-safe">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* --- Header --- */}
      <header className="bg-emerald-900 text-white shadow-md z-30 flex-shrink-0 pt-safe">
        <div className="px-4 py-3 flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-2 rounded-lg shadow-lg shadow-yellow-500/20">
              <Trophy size={20} className="text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg leading-none tracking-tight text-white">
                羽球排點王
              </h1>
              <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest opacity-80">
                專業場地管理
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border-none"
              onClick={openHistory}
              aria-label="查看比賽歷史"
            >
              <Clock size={18} aria-hidden="true" />
            </Button>
            <Button
              size="sm"
              className="bg-emerald-800 hover:bg-emerald-700 border border-emerald-700 text-emerald-100 hidden sm:flex"
              onClick={handleClearCourts}
              aria-label="重置所有場地"
            >
              <RotateCcw size={16} className="mr-1" aria-hidden="true" /> 重置
            </Button>
            <Button
              size="sm"
              className="bg-white text-emerald-900 hover:bg-slate-100 border-none font-bold shadow-md"
              onClick={() => openCourtModal()}
              aria-label="新增場地"
            >
              <Plus size={16} className="mr-1" aria-hidden="true" /> 場地
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2 bg-emerald-950 border-t border-emerald-800 flex items-center justify-between gap-3 overflow-x-auto hide-scrollbar">
          <div className="flex gap-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="flex items-center px-2 py-1.5 rounded-md bg-emerald-800/50 text-emerald-100 text-xs font-bold hover:bg-emerald-700 transition-all active:scale-95 border border-emerald-700/50 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-800/50"
              aria-label="復原"
              title="復原 (Undo)"
            >
              <Undo2 size={14} aria-hidden="true" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="flex items-center px-2 py-1.5 rounded-md bg-emerald-800/50 text-emerald-100 text-xs font-bold hover:bg-emerald-700 transition-all active:scale-95 border border-emerald-700/50 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-800/50"
              aria-label="重做"
              title="重做 (Redo)"
            >
              <Redo2 size={14} aria-hidden="true" />
            </button>
            <button
              onClick={handleShuffle}
              className="flex items-center px-3 py-1.5 rounded-md bg-emerald-800/50 text-emerald-100 text-xs font-bold hover:bg-emerald-700 transition-all active:scale-95 border border-emerald-700/50 whitespace-nowrap"
              aria-label="隨機分配球員"
            >
              <Shuffle size={14} className="mr-2" aria-hidden="true" /> 隨機
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openRules}
              className="p-1.5 text-emerald-400 hover:text-white transition-colors"
              aria-label="查看排點規則說明"
              title="排點規則"
            >
              <CircleHelp size={18} aria-hidden="true" />
            </button>
            <button
              onClick={handleSmartAllocation}
              className="flex items-center px-4 py-1.5 rounded-md bg-yellow-500 text-yellow-950 text-xs font-bold hover:bg-yellow-400 transition-all active:scale-95 shadow-md whitespace-nowrap"
              aria-label="執行智慧排點"
            >
              智慧排點 (Smart Allocate) <ArrowRight size={14} className="ml-2" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* --- Main Layout --- */}
      <div className="flex-1 flex overflow-hidden relative max-w-7xl mx-auto w-full">
        {/* Desktop Sidebar: Roster */}
        <aside className="hidden md:flex w-80 border-r border-slate-200 flex-col z-20 h-full bg-white">
          <PlayerList
            players={players}
            courts={courts}
            selectedPlayerId={selectedPlayerId}
            playedCounts={playedCounts}
            onPlayerClick={handlePlayerClick}
            onAddPlayer={addPlayer}
            onToggleStatus={togglePlayerStatus}
            onDeletePlayer={handleDeletePlayer}
            onEditPlayer={handleStartEditPlayer}
          />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 relative flex flex-col overflow-hidden bg-slate-50/50">
          {/* Mobile Roster View */}
          {activeTab === 'roster' && (
            <div className="md:hidden flex-1 flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 relative z-10">
              <PlayerList
                players={players}
                courts={courts}
                selectedPlayerId={selectedPlayerId}
                playedCounts={playedCounts}
                onPlayerClick={handlePlayerClick}
                onAddPlayer={addPlayer}
                onToggleStatus={togglePlayerStatus}
                onDeletePlayer={handleDeletePlayer}
                onEditPlayer={handleStartEditPlayer}
                isMobileView={true}
              />
            </div>
          )}

          {/* Court Grid */}
          <div
            className={cn(
              'flex-1 overflow-y-auto p-4 md:p-6 z-0',
              activeTab === 'courts' ? 'block' : 'hidden md:block'
            )}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6 pb-24 md:pb-0">
              {courts.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                  <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4 animate-bounce">
                    <Grid2X2 size={32} className="text-slate-400" aria-hidden="true" />
                  </div>
                  <p className="text-lg font-bold text-slate-500">目前沒有場地</p>
                  <Button
                    onClick={() => openCourtModal()}
                    className="bg-emerald-600 text-white mt-4"
                  >
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
                    onEditCourt={handleEditCourt}
                    onDropPlayer={handleDropPlayer}
                    onToggleStatus={handleToggleCourtStatus}
                  />
                  {/* Ad Banner every 2 courts */}
                  {(index + 1) % 2 === 0 && (
                    <div className="col-span-full">
                      <AdBanner />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* --- Mobile Bottom Nav --- */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-40 flex h-16 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]"
        role="navigation"
        aria-label="主要導覽"
      >
        <button
          onClick={() => setActiveTab('courts')}
          className="flex-1 flex flex-col items-center justify-center gap-1 active:bg-slate-50 outline-none"
          aria-label="切換到場地檢視"
          aria-current={activeTab === 'courts' ? 'page' : undefined}
        >
          <div
            className={cn(
              'p-1 rounded-xl transition-colors',
              activeTab === 'courts' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400'
            )}
          >
            <Grid2X2 size={22} strokeWidth={2.5} aria-hidden="true" />
          </div>
          <span
            className={cn(
              'text-[10px] font-bold',
              activeTab === 'courts' ? 'text-emerald-700' : 'text-slate-400'
            )}
          >
            場地
          </span>
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className="flex-1 flex flex-col items-center justify-center gap-1 active:bg-slate-50 relative outline-none"
          aria-label="切換到名單檢視"
          aria-current={activeTab === 'roster' ? 'page' : undefined}
        >
          <div
            className={cn(
              'p-1 rounded-xl transition-colors',
              activeTab === 'roster' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400'
            )}
          >
            <Users size={22} strokeWidth={2.5} aria-hidden="true" />
          </div>
          <span
            className={cn(
              'text-[10px] font-bold',
              activeTab === 'roster' ? 'text-emerald-700' : 'text-slate-400'
            )}
          >
            名單
          </span>
          {selectedPlayerId && (
            <span
              className="absolute top-3 right-[35%] w-3 h-3 bg-yellow-400 border-2 border-white rounded-full animate-bounce shadow-sm"
              aria-label="有選中的球員"
            />
          )}
        </button>
      </nav>

      {/* --- Modals --- */}
      <Modal
        isOpen={isCourtModalOpen}
        onClose={closeCourtModal}
        title={editingCourtId ? '編輯場地' : '新增場地'}
      >
        <div className="space-y-5">
          <div>
            <label
              htmlFor="court-name-input"
              className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"
            >
              場地名稱
            </label>
            <input
              id="court-name-input"
              type="text"
              className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all font-medium"
              placeholder="例如：第一場地..."
              value={newCourtName}
              onChange={e => setNewCourtName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={closeCourtModal}>
              取消
            </Button>
            <Button
              onClick={handleAddCourt}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
            >
              {editingCourtId ? '儲存' : '新增場地'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!courtToDelete}
        onClose={cancelDeleteCourt}
        title="刪除場地？"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg flex gap-3 items-start">
            <div className="p-2 bg-red-100 rounded-full text-red-600 shrink-0">
              <Trash2 size={20} aria-hidden="true" />
            </div>
            <div>
              <h4 className="font-bold text-red-900 text-sm">確定刪除？</h4>
              <p className="text-xs text-red-700 mt-1 leading-relaxed">
                即將刪除{' '}
                <span className="font-bold">
                  {courts.find(c => c.id === courtToDelete)?.name}
                </span>
                。 該場地上的球員將會回到名單中。
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={cancelDeleteCourt}>
              取消
            </Button>
            <Button onClick={handleConfirmDeleteCourt} variant="danger">
              刪除場地
            </Button>
          </div>
        </div>
      </Modal>

      {/* Finish Game / Select Winner Modal */}
      <Modal
        isOpen={!!courtFinishingId}
        onClose={closeFinishGame}
        title="比賽結束，誰贏了？"
      >
        <div className="space-y-5">
          <p className="text-center text-sm text-slate-500">
            請選擇獲勝的隊伍，系統將記錄勝負並清空場地。
          </p>

          <div className="grid grid-cols-2 gap-4" role="group" aria-label="選擇獲勝隊伍">
            {/* Team A Button */}
            <button
              onClick={() => handleGameFinish('teamA')}
              className="relative flex flex-col items-center p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 hover:shadow-md transition-all group"
              aria-label="Team 1 獲勝"
            >
              <span className="absolute -top-3 bg-white text-blue-600 text-xs font-black px-2 py-1 border border-blue-100 rounded-full shadow-sm">
                Team 1
              </span>
              <div className="mt-2 space-y-1 text-center">
                {finishingCourtPlayers.teamA.map(p => (
                  <div key={p.id} className="font-bold text-slate-800">
                    {p.name}
                  </div>
                ))}
                {finishingCourtPlayers.teamA.length === 0 && (
                  <span className="text-slate-400 text-sm">-</span>
                )}
              </div>
              <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600">
                <Crown size={24} aria-hidden="true" />
              </div>
            </button>

            {/* Team B Button */}
            <button
              onClick={() => handleGameFinish('teamB')}
              className="relative flex flex-col items-center p-4 rounded-xl border-2 border-pink-200 bg-pink-50 hover:bg-pink-100 hover:border-pink-400 hover:shadow-md transition-all group"
              aria-label="Team 2 獲勝"
            >
              <span className="absolute -top-3 bg-white text-pink-600 text-xs font-black px-2 py-1 border border-pink-100 rounded-full shadow-sm">
                Team 2
              </span>
              <div className="mt-2 space-y-1 text-center">
                {finishingCourtPlayers.teamB.map(p => (
                  <div key={p.id} className="font-bold text-slate-800">
                    {p.name}
                  </div>
                ))}
                {finishingCourtPlayers.teamB.length === 0 && (
                  <span className="text-slate-400 text-sm">-</span>
                )}
              </div>
              <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity text-pink-600">
                <Crown size={24} aria-hidden="true" />
              </div>
            </button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs">或是</span>
            <div className="flex-grow border-t border-slate-200" />
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
        onClose={closePlayerEdit}
        title="編輯球員"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="player-name-input"
              className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"
            >
              姓名
            </label>
            <input
              id="player-name-input"
              type="text"
              className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all font-medium"
              value={editName}
              onChange={e => setEditName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              性別
            </label>
            <div className="flex gap-3" role="group" aria-label="選擇性別">
              <button
                onClick={() => setEditGender('M')}
                className={cn(
                  'flex-1 py-2 rounded-xl border-2 font-bold transition-all',
                  editGender === 'M'
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-slate-100 text-slate-400 hover:bg-slate-50'
                )}
                aria-pressed={editGender === 'M'}
              >
                男生
              </button>
              <button
                onClick={() => setEditGender('F')}
                className={cn(
                  'flex-1 py-2 rounded-xl border-2 font-bold transition-all',
                  editGender === 'F'
                    ? 'border-pink-500 bg-pink-50 text-pink-600'
                    : 'border-slate-100 text-slate-400 hover:bg-slate-50'
                )}
                aria-pressed={editGender === 'F'}
              >
                女生
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="player-level-select"
              className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"
            >
              實力等級 (Lv.1 ~ Lv.18)
            </label>
            <div className="relative w-full">
              <select
                id="player-level-select"
                value={editLevel}
                onChange={e => setEditLevel(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 appearance-none transition-all"
              >
                {Array.from({ length: 18 }, (_, i) => i + 1).map(lvl => (
                  <option key={lvl} value={lvl}>
                    Level {lvl}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <span className="text-slate-400 text-xs" aria-hidden="true">▼</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={closePlayerEdit}>
              取消
            </Button>
            <Button
              onClick={handleSavePlayer}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              儲存修改
            </Button>
          </div>
        </div>
      </Modal>

      <PlayerPickerModal
        isOpen={!!pickerTarget}
        onClose={closePlayerPicker}
        players={players}
        courts={courts}
        onPick={handlePickPlayer}
      />

      <HistoryModal
        isOpen={showHistory}
        onClose={closeHistory}
        rounds={rounds}
      />

      <RulesModal isOpen={showRules} onClose={closeRules} />

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
      />
    </div>
  );
}
