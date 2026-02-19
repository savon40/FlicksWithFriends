import { supabase } from './supabase';
import {
  Session,
  SessionFilters,
  SessionStatus,
  SessionHistoryItem,
  Participant,
  CatalogItem,
  Match,
  MatchTier,
  SwipeDirection,
} from '@/types';

// ─── Snake → Camel Mappers ──────────────────────────────

function toSession(row: any): Session {
  return {
    id: row.id,
    code: row.code,
    hostDeviceId: row.host_device_id,
    streamingServices: row.streaming_services,
    filters: row.filters,
    matchThreshold: row.match_threshold,
    status: row.status as SessionStatus,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

function toParticipant(row: any): Participant {
  return {
    id: row.id,
    sessionId: row.session_id,
    deviceId: row.device_id,
    nickname: row.nickname ?? 'Guest',
    avatarSeed: row.avatar_seed,
    isHost: row.is_host,
    swipeProgress: row.swipe_progress,
    joinedAt: row.joined_at,
  };
}

function toCatalogItem(row: any): CatalogItem {
  return {
    id: row.id,
    sessionId: row.session_id,
    tmdbId: row.tmdb_id,
    title: row.title,
    posterUrl: row.poster_url ?? '',
    synopsis: row.synopsis ?? '',
    genres: row.genres,
    runtime: row.runtime ?? 0,
    releaseYear: row.release_year ?? 0,
    tmdbRating: row.tmdb_rating ?? 0,
    availableOn: row.available_on,
    displayOrder: row.display_order,
  };
}

function toMatch(row: any): Match {
  return {
    catalogItemId: row.catalog_item_id,
    title: row.title,
    posterUrl: row.poster_url ?? '',
    tmdbRating: row.tmdb_rating ?? 0,
    availableOn: row.available_on,
    genres: row.genres,
    runtime: row.runtime ?? 0,
    releaseYear: row.release_year ?? 0,
    synopsis: row.synopsis ?? '',
    rightSwipeCount: Number(row.right_swipe_count),
    totalParticipants: Number(row.total_participants),
    matchPercentage: Number(row.match_percentage),
    tier: row.tier as MatchTier,
    avgEnthusiasm: Number(row.avg_enthusiasm) || 0,
  };
}

// ─── Code Generation ─────────────────────────────────────

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
    }

    const { data } = await supabase
      .from('sessions')
      .select('id')
      .eq('code', code)
      .eq('status', 'lobby')
      .maybeSingle();

    if (!data) return code;
  }
  throw new Error('Failed to generate unique code after 3 attempts');
}

// ─── Session CRUD ────────────────────────────────────────

export async function createSession(params: {
  code: string;
  deviceId: string;
  streamingServices: string[];
  filters: SessionFilters;
  matchThreshold?: number;
}): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      code: params.code,
      host_device_id: params.deviceId,
      streaming_services: params.streamingServices,
      filters: params.filters,
      match_threshold: params.matchThreshold ?? 0.5,
      status: 'lobby',
    })
    .select()
    .single();

  if (error) throw error;
  return toSession(data);
}

export async function fetchSession(sessionId: string): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) throw error;
  return toSession(data);
}

export async function lookupSessionByCode(code: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('status', 'lobby')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error) throw error;
  return data ? toSession(data) : null;
}

export async function updateSessionStatus(
  sessionId: string,
  status: SessionStatus
): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ status })
    .eq('id', sessionId);

  if (error) throw error;
}

export async function selectSessionWinner(
  sessionId: string,
  catalogItemId: string
): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ selected_match_id: catalogItemId })
    .eq('id', sessionId);

  if (error) throw error;
}

// ─── Participants ────────────────────────────────────────

export async function addParticipant(params: {
  sessionId: string;
  deviceId: string;
  nickname: string;
  isHost: boolean;
  avatarSeed?: number;
}): Promise<Participant> {
  const row: Record<string, unknown> = {
    session_id: params.sessionId,
    device_id: params.deviceId,
    nickname: params.nickname,
    is_host: params.isHost,
  };
  if (params.avatarSeed !== undefined) {
    row.avatar_seed = params.avatarSeed;
  }
  const { data, error } = await supabase
    .from('participants')
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return toParticipant(data);
}

export async function fetchParticipants(sessionId: string): Promise<Participant[]> {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('session_id', sessionId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(toParticipant);
}

// ─── Catalog ─────────────────────────────────────────────

export async function seedCatalog(
  sessionId: string,
  items: CatalogItem[]
): Promise<void> {
  const rows = items.map((item, i) => ({
    session_id: sessionId,
    tmdb_id: item.tmdbId,
    title: item.title,
    poster_url: item.posterUrl,
    synopsis: item.synopsis,
    genres: item.genres,
    runtime: item.runtime,
    release_year: item.releaseYear,
    tmdb_rating: item.tmdbRating,
    available_on: item.availableOn,
    display_order: item.displayOrder ?? i + 1,
  }));

  const { error } = await supabase.from('catalog_items').insert(rows);
  if (error) throw error;
}

export async function fetchCatalog(sessionId: string): Promise<CatalogItem[]> {
  const { data, error } = await supabase
    .from('catalog_items')
    .select('*')
    .eq('session_id', sessionId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(toCatalogItem);
}

// ─── Swipes ──────────────────────────────────────────────

export async function recordSwipe(params: {
  participantId: string;
  catalogItemId: string;
  sessionId: string;
  direction: SwipeDirection;
  timeOnCardMs: number;
}): Promise<void> {
  const { error } = await supabase.from('swipes').insert({
    participant_id: params.participantId,
    catalog_item_id: params.catalogItemId,
    session_id: params.sessionId,
    direction: params.direction,
    time_on_card_ms: params.timeOnCardMs,
  });
  if (error) throw error;
}

export async function updateSwipeProgress(
  participantId: string,
  progress: number
): Promise<void> {
  const { error } = await supabase
    .from('participants')
    .update({ swipe_progress: progress })
    .eq('id', participantId);

  if (error) throw error;
}

// ─── Matches ─────────────────────────────────────────────

export async function fetchMatches(
  sessionId: string,
  matchThreshold: number
): Promise<Match[]> {
  const { data, error } = await supabase
    .from('session_matches')
    .select('*')
    .eq('session_id', sessionId)
    .gte('match_percentage', matchThreshold)
    .order('match_percentage', { ascending: false })
    .order('tmdb_rating', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toMatch);
}

// ─── Session History ────────────────────────────────────────

export async function fetchSessionHistory(
  deviceId: string
): Promise<SessionHistoryItem[]> {
  // 1. Find sessions this device participated in
  const { data: participantRows, error: pErr } = await supabase
    .from('participants')
    .select('session_id')
    .eq('device_id', deviceId);

  if (pErr) throw pErr;
  if (!participantRows || participantRows.length === 0) return [];

  const sessionIds = [...new Set(participantRows.map((r) => r.session_id))];

  // 2. Fetch session details
  const { data: sessions, error: sErr } = await supabase
    .from('sessions')
    .select('*')
    .in('id', sessionIds)
    .in('status', ['active', 'completed'])
    .order('created_at', { ascending: false });

  if (sErr) throw sErr;
  if (!sessions || sessions.length === 0) return [];

  const activeSessionIds = sessions.map((s) => s.id);

  // 3. Get participant details
  const { data: participantDetailRows, error: cErr } = await supabase
    .from('participants')
    .select('session_id, nickname, avatar_seed, is_host')
    .in('session_id', activeSessionIds)
    .order('is_host', { ascending: false })
    .order('joined_at', { ascending: true });

  if (cErr) throw cErr;
  const countMap: Record<string, number> = {};
  const participantsMap: Record<string, { nickname: string; avatarSeed: number; isHost: boolean }[]> = {};
  (participantDetailRows ?? []).forEach((r) => {
    countMap[r.session_id] = (countMap[r.session_id] || 0) + 1;
    if (!participantsMap[r.session_id]) participantsMap[r.session_id] = [];
    participantsMap[r.session_id].push({
      nickname: r.nickname ?? 'Guest',
      avatarSeed: r.avatar_seed,
      isHost: r.is_host,
    });
  });

  // 4a. Check for host-selected winners
  const sessionsWithSelection = sessions.filter((s) => s.selected_match_id);
  const selectedMatchIds = sessionsWithSelection.map((s) => s.selected_match_id);

  const topMatchMap: Record<string, SessionHistoryItem['topMatch']> = {};

  if (selectedMatchIds.length > 0) {
    const { data: selectedItems, error: selErr } = await supabase
      .from('catalog_items')
      .select('id, session_id, title, poster_url, available_on')
      .in('id', selectedMatchIds);

    if (selErr) throw selErr;

    const selectedItemMap = new Map(
      (selectedItems ?? []).map((item) => [item.id, item])
    );

    for (const s of sessionsWithSelection) {
      const item = selectedItemMap.get(s.selected_match_id);
      if (item) {
        topMatchMap[s.id] = {
          title: item.title,
          posterUrl: item.poster_url ?? '',
          matchPercentage: 1,
          availableOn: item.available_on ?? [],
        };
      }
    }
  }

  // 4b. Fall back to session_matches view for sessions without a selection
  const sessionIdsWithoutSelection = activeSessionIds.filter((id) => !topMatchMap[id]);

  if (sessionIdsWithoutSelection.length > 0) {
    const { data: matchRows, error: mErr } = await supabase
      .from('session_matches')
      .select('session_id, title, poster_url, match_percentage, available_on')
      .in('session_id', sessionIdsWithoutSelection)
      .order('match_percentage', { ascending: false })
      .order('tmdb_rating', { ascending: false });

    if (mErr) throw mErr;
    (matchRows ?? []).forEach((r) => {
      if (!topMatchMap[r.session_id]) {
        topMatchMap[r.session_id] = {
          title: r.title,
          posterUrl: r.poster_url ?? '',
          matchPercentage: Number(r.match_percentage),
          availableOn: r.available_on ?? [],
        };
      }
    });
  }

  // 5. Assemble results
  return sessions.map((s) => ({
    sessionId: s.id,
    sessionCode: s.code,
    status: s.status as SessionStatus,
    createdAt: s.created_at,
    participantCount: countMap[s.id] || 0,
    participants: participantsMap[s.id] || [],
    topMatch: topMatchMap[s.id] || null,
  }));
}
