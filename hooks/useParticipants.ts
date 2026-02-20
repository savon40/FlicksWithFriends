import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchParticipants } from '@/lib/sessionService';
import { Participant } from '@/types';

export function useParticipants(sessionId: string | null) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sessionId) return;
    setError(null);
    try {
      const data = await fetchParticipants(sessionId);
      setParticipants(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`participants:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'participants',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new;
          const p: Participant = {
            id: row.id,
            sessionId: row.session_id,
            deviceId: row.device_id,
            nickname: row.nickname ?? 'Guest',
            avatarSeed: row.avatar_seed,
            isHost: row.is_host,
            swipeProgress: row.swipe_progress,
            joinedAt: row.joined_at,
          };
          setParticipants((prev) =>
            prev.some((x) => x.id === p.id) ? prev : [...prev, p]
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'participants',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new;
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === row.id
                ? {
                    ...p,
                    swipeProgress: row.swipe_progress,
                    nickname: row.nickname ?? p.nickname,
                  }
                : p
            )
          );
        }
      )
      .subscribe((status, err) => {
        if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
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

  return { participants, loading, error, retry: load };
}
