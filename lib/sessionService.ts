import { supabase } from './supabase';
import {
  Session,
  SessionFilters,
  SessionStatus,
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

// ─── Participants ────────────────────────────────────────

export async function addParticipant(params: {
  sessionId: string;
  deviceId: string;
  nickname: string;
  isHost: boolean;
}): Promise<Participant> {
  const { data, error } = await supabase
    .from('participants')
    .insert({
      session_id: params.sessionId,
      device_id: params.deviceId,
      nickname: params.nickname,
      is_host: params.isHost,
    })
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
    .order('match_percentage', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toMatch);
}
