import { useState, useCallback, useRef } from 'react';

interface UndoRedoOptions {
  maxHistory?: number;
}

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useUndoRedo<T>(
  initialState: T,
  options: UndoRedoOptions = {}
) {
  const { maxHistory = 50 } = options;

  const [state, setState] = useState<UndoRedoState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  // Track if we should skip recording (for undo/redo operations)
  const skipRecordRef = useRef(false);

  // Update present state and record history
  const set = useCallback((newState: T | ((prev: T) => T)) => {
    setState(current => {
      const nextPresent = typeof newState === 'function'
        ? (newState as (prev: T) => T)(current.present)
        : newState;

      // Skip recording if this is an undo/redo operation
      if (skipRecordRef.current) {
        skipRecordRef.current = false;
        return { ...current, present: nextPresent };
      }

      // Don't record if state hasn't changed
      if (JSON.stringify(current.present) === JSON.stringify(nextPresent)) {
        return current;
      }

      // Add current present to past, clear future
      const newPast = [...current.past, current.present].slice(-maxHistory);

      return {
        past: newPast,
        present: nextPresent,
        future: [],
      };
    });
  }, [maxHistory]);

  // Undo - go back one step
  const undo = useCallback(() => {
    setState(current => {
      if (current.past.length === 0) return current;

      const previous = current.past[current.past.length - 1];
      const newPast = current.past.slice(0, -1);

      skipRecordRef.current = true;

      return {
        past: newPast,
        present: previous,
        future: [current.present, ...current.future],
      };
    });
  }, []);

  // Redo - go forward one step
  const redo = useCallback(() => {
    setState(current => {
      if (current.future.length === 0) return current;

      const next = current.future[0];
      const newFuture = current.future.slice(1);

      skipRecordRef.current = true;

      return {
        past: [...current.past, current.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setState(current => ({
      past: [],
      present: current.present,
      future: [],
    }));
  }, []);

  // Reset to a specific state (clears history)
  const reset = useCallback((newState: T) => {
    setState({
      past: [],
      present: newState,
      future: [],
    });
  }, []);

  return {
    state: state.present,
    set,
    undo,
    redo,
    reset,
    clearHistory,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    historyLength: state.past.length,
  };
}
