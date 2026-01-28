import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLocalStorageOptions {
  debounceMs?: number;
  onError?: (error: Error) => void;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions = {}
): [T, (value: T | ((prev: T) => T)) => void, { isLoaded: boolean; error: Error | null }] {
  const { debounceMs = 500, onError } = options;

  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingValueRef = useRef<T | null>(null);

  // Use ref to store onError to avoid dependency issues
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        setStoredValue(parsed);
      }
      setError(null);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to load from localStorage');
      setError(err);
      onErrorRef.current?.(err);
      console.error(`[useLocalStorage] Failed to load "${key}":`, e);
    } finally {
      setIsLoaded(true);
    }
  }, [key]);

  // Debounced save to localStorage
  const saveToStorage = useCallback((value: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setError(null);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to save to localStorage');
      setError(err);
      onErrorRef.current?.(err);
      console.error(`[useLocalStorage] Failed to save "${key}":`, e);
    }
  }, [key]);

  // Debounced setter
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value;
      pendingValueRef.current = newValue;

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new debounced save
      timeoutRef.current = setTimeout(() => {
        if (pendingValueRef.current !== null) {
          saveToStorage(pendingValueRef.current);
        }
      }, debounceMs);

      return newValue;
    });
  }, [debounceMs, saveToStorage]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        // Save any pending value immediately on unmount
        if (pendingValueRef.current !== null) {
          saveToStorage(pendingValueRef.current);
        }
      }
    };
  }, [saveToStorage]);

  return [storedValue, setValue, { isLoaded, error }];
}
