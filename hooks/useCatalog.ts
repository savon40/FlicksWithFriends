import { useEffect, useState, useCallback } from 'react';
import { fetchCatalog } from '@/lib/sessionService';
import { CatalogItem } from '@/types';

export function useCatalog(sessionId: string | null) {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sessionId) return;
    setError(null);
    try {
      const data = await fetchCatalog(sessionId);
      setCatalog(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  return { catalog, loading, error, retry: load };
}
