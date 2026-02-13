import { useEffect, useState, useCallback } from 'react';
import { fetchSessionHistory } from '@/lib/sessionService';
import { getDeviceId } from '@/lib/device';
import { SessionHistoryItem } from '@/types';

export function useSessionHistory() {
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const deviceId = await getDeviceId();
      const data = await fetchSessionHistory(deviceId);
      setSessions(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { sessions, loading, error, refresh: load };
}
