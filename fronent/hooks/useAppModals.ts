import { useState, useCallback } from 'react';

export function useAppModals() {
  const [showHistory, setShowHistory] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [courtFinishingId, setCourtFinishingId] = useState<string | null>(null);

  const openHistory = useCallback(() => setShowHistory(true), []);
  const closeHistory = useCallback(() => setShowHistory(false), []);

  const openRules = useCallback(() => setShowRules(true), []);
  const closeRules = useCallback(() => setShowRules(false), []);

  const openFinishGame = useCallback((courtId: string) => setCourtFinishingId(courtId), []);
  const closeFinishGame = useCallback(() => setCourtFinishingId(null), []);

  return {
    showHistory,
    showRules,
    courtFinishingId,
    openHistory,
    closeHistory,
    openRules,
    closeRules,
    openFinishGame,
    closeFinishGame,
  };
}
