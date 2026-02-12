import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SessionStatus } from '@/types';

export function useSessionStatus(sessionId: string | null) {
  const [status, setStatus] = useState<SessionStatus>('lobby');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    // Initial fetch
    supabase
      .from('sessions')
      .select('status')
      .eq('id', sessionId)
      .single()
      .then(({ data }) => {
        if (data) setStatus(data.status as SessionStatus);
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { status, loading };
}
