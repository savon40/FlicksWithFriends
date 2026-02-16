import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchMatches } from '@/lib/sessionService';
import { Match } from '@/types';

export function useMatches(sessionId: string | null, matchThreshold: number) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!sessionId) return;
    setError(null);
    try {
      const data = await fetchMatches(sessionId, matchThreshold);
      setMatches(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId, matchThreshold]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`matches:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'swipes',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          // Debounce re-fetch to 500ms
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            load();
          }, 500);
        }
      )
      .subscribe((status, err) => {
        if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          console.warn('[FlickPick] Matches realtime error:', status, err);
          setError(`Realtime connection ${status.toLowerCase()}`);
        }
        if (status === 'SUBSCRIBED') {
          setError(null);
        }
      });

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [sessionId, load]);

  return { matches, loading, error, retry: load };
}
