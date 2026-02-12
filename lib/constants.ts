import { StreamingService } from '@/types';

// ─── Streaming Services ────────────────────────────────────
export const STREAMING_SERVICES: StreamingService[] = [
  { id: 'netflix', name: 'Netflix', logo: 'N', color: '#E50914' },
  { id: 'hulu', name: 'Hulu', logo: 'H', color: '#1CE783' },
  { id: 'max', name: 'Max', logo: 'M', color: '#002BE7' },
  { id: 'prime', name: 'Prime Video', logo: 'P', color: '#00A8E1' },
  { id: 'disney', name: 'Disney+', logo: 'D', color: '#113CCF' },
  { id: 'peacock', name: 'Peacock', logo: 'Pk', color: '#000000' },
  { id: 'paramount', name: 'Paramount+', logo: 'P+', color: '#0064FF' },
  { id: 'apple', name: 'Apple TV+', logo: 'A', color: '#000000' },
  { id: 'tubi', name: 'Tubi', logo: 'T', color: '#FA382F' },
  { id: 'pluto', name: 'Pluto TV', logo: 'Pl', color: '#2ECC71' },
];

// ─── Genres ────────────────────────────────────────────────
export const GENRES = [
  'Action',
  'Comedy',
  'Drama',
  'Horror',
  'Thriller',
  'Sci-Fi',
  'Romance',
  'Documentary',
  'Animation',
  'Fantasy',
  'Mystery',
  'Crime',
];

// ─── Moods ─────────────────────────────────────────────────
export const MOODS = [
  { id: 'chill', label: 'Chill & Easy', emoji: '😌' },
  { id: 'feelgood', label: 'Feel-Good', emoji: '😊' },
  { id: 'intense', label: 'Intense & Gripping', emoji: '😤' },
  { id: 'mindbending', label: 'Mind-Bending', emoji: '🤯' },
  { id: 'scary', label: 'Scary', emoji: '😱' },
  { id: 'funny', label: 'Laugh Out Loud', emoji: '😂' },
  { id: 'tearjerker', label: 'Tear Jerker', emoji: '😢' },
];

// ─── Runtime Options ───────────────────────────────────────
export const RUNTIME_OPTIONS = [
  { id: 'short', label: 'Under 90 min' },
  { id: 'medium', label: '90–120 min' },
  { id: 'long', label: 'Over 120 min' },
  { id: 'any', label: 'Any' },
];

// ─── Release Year Options ──────────────────────────────────
export const YEAR_OPTIONS = [
  { id: 'classic', label: 'Classics (pre-2000)' },
  { id: '2000s', label: '2000s' },
  { id: '2010s', label: '2010s' },
  { id: 'recent', label: 'Recent (2020+)' },
  { id: 'any', label: 'Any' },
];

// ─── Rating Options ────────────────────────────────────────
export const RATING_OPTIONS = [
  { value: 0, label: 'Any' },
  { value: 6, label: '6+' },
  { value: 7, label: '7+' },
  { value: 8, label: '8+' },
];

// ─── Content Type ──────────────────────────────────────────
export const CONTENT_TYPES = [
  { id: 'movies', label: 'Movies' },
  { id: 'tv', label: 'TV Shows' },
  { id: 'both', label: 'Both' },
] as const;
