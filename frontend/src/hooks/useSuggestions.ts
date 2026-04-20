import { useRef, useCallback, useEffect } from 'react';
import { useSession } from '../store/session';
import { fetchSuggestions } from '../lib/api';

const REFRESH_INTERVAL_MS = 30_000;

export function useSuggestions() {
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownValRef = useRef(30);
  const countdownDisplayRef = useRef<((v: number) => void) | null>(null);

  const {
    apiKey,
    isRefreshing,
    setIsRefreshing,
    addSuggestionBatch,
    getRecentTranscript,
    getPreviousPreviews,
  } = useSession();

  const refresh = useCallback(async () => {
    if (isRefreshing || !apiKey) return;
    setIsRefreshing(true);

    try {
      const recentTranscript = getRecentTranscript(400);
      const previousPreviews = getPreviousPreviews();
      const data = await fetchSuggestions(recentTranscript, previousPreviews, apiKey);

      if (Array.isArray(data?.suggestions) && data.suggestions.length > 0) {
        addSuggestionBatch({
          id: crypto.randomUUID(),
          timestamp: new Date(),
          suggestions: data.suggestions.slice(0, 3),
        });
      }
    } catch (err: any) {
      console.error('Suggestions error:', err.message);
    } finally {
      setIsRefreshing(false);
    }
  }, [apiKey, isRefreshing, setIsRefreshing, addSuggestionBatch, getRecentTranscript, getPreviousPreviews]);

  const resetCountdown = useCallback(
    (onTick?: (v: number) => void) => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (onTick) countdownDisplayRef.current = onTick;

      countdownValRef.current = REFRESH_INTERVAL_MS / 1000;
      countdownDisplayRef.current?.(countdownValRef.current);

      countdownRef.current = setInterval(() => {
        countdownValRef.current = Math.max(0, countdownValRef.current - 1);
        countdownDisplayRef.current?.(countdownValRef.current);

        if (countdownValRef.current <= 0) {
          resetCountdown(countdownDisplayRef.current ?? undefined);
          refresh();
        }
      }, 1000);
    },
    [refresh]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const manualRefresh = useCallback(
    (onTick?: (v: number) => void) => {
      resetCountdown(onTick);
      refresh();
    },
    [resetCountdown, refresh]
  );

  return { refresh, manualRefresh, resetCountdown };
}