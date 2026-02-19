// ─── Session ───────────────────────────────────────────────
export type SessionStatus = 'lobby' | 'active' | 'completed' | 'expired';

export interface Session {
  id: string;
  code: string;
  hostDeviceId: string;
  streamingServices: string[];
  filters: SessionFilters;
  matchThreshold: number;
  status: SessionStatus;
  createdAt: string;
  expiresAt: string;
}

export interface SessionFilters {
  genres: string[];
  mood: string | null;
  runtimeRange: string | null;
  releaseYearRange: string[];
  minRating: number | null;
  certifications: string[];
  animation: 'include' | 'exclude' | null;
  contentType: 'movies' | 'tv' | 'both';
}

// ─── Participant ───────────────────────────────────────────
export interface Participant {
  id: string;
  sessionId: string;
  deviceId: string;
  nickname: string;
  avatarSeed: number;
  isHost: boolean;
  swipeProgress: number;
  joinedAt: string;
}

// ─── Catalog Item ──────────────────────────────────────────
export interface CatalogItem {
  id: string;
  sessionId: string;
  tmdbId: number;
  title: string;
  posterUrl: string;
  synopsis: string;
  genres: string[];
  runtime: number;
  releaseYear: number;
  tmdbRating: number;
  availableOn: string[];
  displayOrder: number;
}

// ─── Swipe ─────────────────────────────────────────────────
export type SwipeDirection = 'left' | 'right';

export interface Swipe {
  id: string;
  participantId: string;
  catalogItemId: string;
  sessionId: string;
  direction: SwipeDirection;
  timeOnCardMs: number;
  swipedAt: string;
}

// ─── Match ─────────────────────────────────────────────────
export type MatchTier = 'perfect' | 'strong' | 'soft' | 'none';

export interface Match {
  catalogItemId: string;
  title: string;
  posterUrl: string;
  tmdbRating: number;
  availableOn: string[];
  genres: string[];
  runtime: number;
  releaseYear: number;
  synopsis: string;
  rightSwipeCount: number;
  totalParticipants: number;
  matchPercentage: number;
  tier: MatchTier;
  avgEnthusiasm: number;
}

// ─── Session History ──────────────────────────────────────
export interface SessionHistoryItem {
  sessionId: string;
  sessionCode: string;
  status: SessionStatus;
  createdAt: string;
  participantCount: number;
  topMatch: {
    title: string;
    posterUrl: string;
    matchPercentage: number;
    availableOn: string[];
  } | null;
}

// ─── Streaming Service ─────────────────────────────────────
export interface StreamingService {
  id: string;
  name: string;
  logo: string;
  color: string;
}
