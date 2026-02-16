import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SessionStatus } from '@/types';

export function useSessionStatus(sessionId: string | null) {
  const [status, setStatus] = useState<SessionStatus>('lobby');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    // Initial fetch
    supabase
      .from('sessions')
      .select('status')
      .eq('id', sessionId)
      .single()
      .then(({ data, error: fetchErr }) => {
        if (fetchErr) {
          console.warn('[FlickPick] Session status fetch error:', fetchErr.message);
          setError(fetchErr.message);
        } else if (data) {
          setStatus(data.status as SessionStatus);
          setError(null);
        }
        setLoading(false);
      });

    // Realtime subscription
    const channel = supabase
      .channel(`session_status:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          setStatus(payload.new.status as SessionStatus);
        }
      )
      .subscribe((status, err) => {
        if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          console.warn('[FlickPick] Session status realtime error:', status, err);
          setError(`Realtime connection ${status.toLowerCase()}`);
        }
        if (status === 'SUBSCRIBED') {
          setError(null);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { status, loading, error };
}
