import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLocalStorageWithUndoOptions {
  debounceMs?: number;
  maxHistory?: number;
  onError?: (error: Error) => void;
}

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useLocalStorageWithUndo<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageWithUndoOptions = {}
) {
  const { debounceMs = 500, maxHistory = 30, onError } = options;

  const [undoState, setUndoState] = useState<UndoRedoState<T>>({
    past: [],
    present: initialValue,
    future: [],
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingValueRef = useRef<T | null>(null);
  const onErrorRef = useRef(onError);
  const isUndoRedoRef = useRef(false);

  onErrorRef.current = onError;

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        setUndoState({
          past: [],
          present: parsed,
          future: [],
        });
      }
      setError(null);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to load from localStorage');
      setError(err);
      onErrorRef.current?.(err);
      console.error(`[useLocalStorageWithUndo] Failed to load "${key}":`, e);
    } finally {
      setIsLoaded(true);
    }
  }, [key]);

  // Save to localStorage
  const saveToStorage = useCallback((value: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setError(null);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to save to localStorage');
      setError(err);
      onErrorRef.current?.(err);
      console.error(`[useLocalStorageWithUndo] Failed to save "${key}":`, e);
    }
  }, [key]);

  // Debounced setter with history tracking
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setUndoState(current => {
      const newPresent = typeof value === 'function'
        ? (value as (prev: T) => T)(current.present)
        : value;

      // Schedule debounced save
      pendingValueRef.current = newPresent;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        if (pendingValueRef.current !== null) {
          saveToStorage(pendingValueRef.current);
        }
      }, debounceMs);

      // Skip history recording for undo/redo operations
      if (isUndoRedoRef.current) {
        isUndoRedoRef.current = false;
        return { ...current, present: newPresent };
      }

      // Don't record if state hasn't changed (shallow comparison)
      if (JSON.stringify(current.present) === JSON.stringify(newPresent)) {
        return current;
      }

      // Add current to past, clear future
      const newPast = [...current.past, current.present].slice(-maxHistory);
      return {
        past: newPast,
        present: newPresent,
        future: [],
      };
    });
  }, [debounceMs, maxHistory, saveToStorage]);

  // Undo
  const undo = useCallback(() => {
    setUndoState(current => {
      if (current.past.length === 0) return current;

      const previous = current.past[current.past.length - 1];
      const newPast = current.past.slice(0, -1);

      isUndoRedoRef.current = true;

      // Save immediately on undo
      saveToStorage(previous);

      return {
        past: newPast,
        present: previous,
        future: [current.present, ...current.future].slice(0, maxHistory),
      };
    });
  }, [maxHistory, saveToStorage]);

  // Redo
  const redo = useCallback(() => {
    setUndoState(current => {
      if (current.future.length === 0) return current;

      const next = current.future[0];
      const newFuture = current.future.slice(1);

      isUndoRedoRef.current = true;

      // Save immediately on redo
      saveToStorage(next);

      return {
        past: [...current.past, current.present].slice(-maxHistory),
        present: next,
        future: newFuture,
      };
    });
  }, [maxHistory, saveToStorage]);

  // Clear history
  const clearHistory = useCallback(() => {
    setUndoState(current => ({
      past: [],
      present: current.present,
      future: [],
    }));
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        if (pendingValueRef.current !== null) {
          saveToStorage(pendingValueRef.current);
        }
      }
    };
  }, [saveToStorage]);

  return {
    state: undoState.present,
    setState: setValue,
    undo,
    redo,
    clearHistory,
    canUndo: undoState.past.length > 0,
    canRedo: undoState.future.length > 0,
    isLoaded,
    error,
  };
}
