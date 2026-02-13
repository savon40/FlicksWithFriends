import { CatalogItem, SessionFilters } from '@/types';

// ─── Constants ──────────────────────────────────────────────

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const GENRE_MAP: Record<string, number> = {
  Action: 28,
  Comedy: 35,
  Drama: 18,
  Horror: 27,
  Thriller: 53,
  'Sci-Fi': 878,
  Romance: 10749,
  Documentary: 99,
  Animation: 16,
  Fantasy: 14,
  Mystery: 9648,
  Crime: 80,
};

const TV_GENRE_MAP: Record<string, number> = {
  Action: 10759,
  'Sci-Fi': 10765,
};

const PROVIDER_MAP: Record<string, number> = {
  netflix: 8,
  hulu: 15,
  max: 1899,
  prime: 119,
  disney: 337,
  peacock: 386,
  paramount: 531,
  apple: 350,
  tubi: 73,
  pluto: 300,
};

const REVERSE_PROVIDER_MAP: Record<number, string> = Object.fromEntries(
  Object.entries(PROVIDER_MAP).map(([k, v]) => [v, k])
);

const MOOD_GENRE_MAP: Record<string, string[]> = {
  chill: ['Drama', 'Romance'],
  feelgood: ['Comedy', 'Romance', 'Animation'],
  intense: ['Action', 'Thriller', 'Crime'],
  mindbending: ['Sci-Fi', 'Mystery', 'Thriller'],
  scary: ['Horror', 'Thriller'],
  funny: ['Comedy'],
  tearjerker: ['Drama', 'Romance'],
};

const TMDB_GENRE_NAME_MAP: Record<string, string> = {
  'Science Fiction': 'Sci-Fi',
  'Action & Adventure': 'Action',
  'Sci-Fi & Fantasy': 'Sci-Fi',
  'War & Politics': 'Drama',
};

// ─── Helpers ────────────────────────────────────────────────

async function tmdbFetch(path: string, params: Record<string, string> = {}): Promise<any> {
  const apiKey = process.env.EXPO_PUBLIC_TMDB_API_KEY;
  if (!apiKey) throw new Error('TMDB API key not configured. Add EXPO_PUBLIC_TMDB_API_KEY to .env');

  const query = Object.entries({ api_key: apiKey, ...params })
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const url = `${TMDB_BASE}${path}?${query}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function resolveGenreIds(filters: SessionFilters, isTV: boolean): number[] {
  const genreNames =
    filters.genres.length > 0
      ? filters.genres
      : filters.mood && MOOD_GENRE_MAP[filters.mood]
        ? MOOD_GENRE_MAP[filters.mood]
        : [];

  const baseMap = isTV ? { ...GENRE_MAP, ...TV_GENRE_MAP } : GENRE_MAP;
  return genreNames.map((name) => baseMap[name]).filter(Boolean);
}

function buildDiscoverParams(
  filters: SessionFilters,
  selectedServices: string[],
  isTV: boolean
): Record<string, string> {
  const params: Record<string, string> = {
    sort_by: 'popularity.desc',
    'vote_count.gte': '200',
    with_original_language: 'en',
    watch_region: 'US',
    with_watch_monetization_types: 'flatrate|free|ads',
  };

  // Streaming providers
  const providerIds = selectedServices
    .map((s) => PROVIDER_MAP[s])
    .filter(Boolean);
  if (providerIds.length > 0) {
    params.with_watch_providers = providerIds.join('|');
  }

  // Genres (OR join so multiple picks broaden results)
  const genreIds = resolveGenreIds(filters, isTV);
  if (genreIds.length > 0) {
    params.with_genres = genreIds.join('|');
  }

  // Rating
  if (filters.minRating && filters.minRating > 0) {
    params['vote_average.gte'] = String(filters.minRating);
  }

  // Runtime (movies only)
  if (!isTV && filters.runtimeRange && filters.runtimeRange !== 'any') {
    switch (filters.runtimeRange) {
      case 'short':
        params['with_runtime.lte'] = '90';
        break;
      case 'medium':
        params['with_runtime.gte'] = '90';
        params['with_runtime.lte'] = '120';
        break;
      case 'long':
        params['with_runtime.gte'] = '120';
        break;
    }
  }

  // Release year
  if (filters.releaseYearRange && filters.releaseYearRange !== 'any') {
    const dateGte = isTV ? 'first_air_date.gte' : 'primary_release_date.gte';
    const dateLte = isTV ? 'first_air_date.lte' : 'primary_release_date.lte';

    switch (filters.releaseYearRange) {
      case 'classic':
        params[dateLte] = '1999-12-31';
        break;
      case '2000s':
        params[dateGte] = '2000-01-01';
        params[dateLte] = '2009-12-31';
        break;
      case '2010s':
        params[dateGte] = '2010-01-01';
        params[dateLte] = '2019-12-31';
        break;
      case 'recent':
        params[dateGte] = '2020-01-01';
        break;
    }
  }

  // MPAA certification (movies only)
  if (!isTV && filters.certifications.length > 0) {
    params.certification_country = 'US';
    params.certification = filters.certifications.join('|');
  }

  return params;
}

function extractAvailableOn(
  providers: any,
  selectedServices: string[]
): string[] {
  const usProviders = providers?.US;
  if (!usProviders) return [];

  const allProviders = [
    ...(usProviders.flatrate ?? []),
    ...(usProviders.ads ?? []),
    ...(usProviders.free ?? []),
  ];

  const selectedSet = new Set(selectedServices);
  const available = new Set<string>();
  for (const p of allProviders) {
    const appId = REVERSE_PROVIDER_MAP[p.provider_id];
    if (appId && selectedSet.has(appId)) {
      available.add(appId);
    }
  }

  return Array.from(available);
}

function mapGenreNames(tmdbGenres: { id: number; name: string }[]): string[] {
  return tmdbGenres
    .map((g) => TMDB_GENRE_NAME_MAP[g.name] ?? g.name)
    .filter((name) => Object.keys(GENRE_MAP).includes(name));
}

async function fetchMovieDetails(
  tmdbId: number,
  selectedServices: string[],
  displayOrder: number
): Promise<CatalogItem | null> {
  const data = await tmdbFetch(`/movie/${tmdbId}`, {
    append_to_response: 'watch/providers',
  });

  const availableOn = extractAvailableOn(
    data['watch/providers']?.results,
    selectedServices
  );
  if (availableOn.length === 0) return null;

  return {
    id: '',
    sessionId: '',
    tmdbId: data.id,
    title: data.title,
    posterUrl: data.poster_path ? `${TMDB_IMAGE_BASE}${data.poster_path}` : '',
    synopsis: data.overview ?? '',
    genres: mapGenreNames(data.genres ?? []),
    runtime: data.runtime ?? 0,
    releaseYear: data.release_date ? parseInt(data.release_date.substring(0, 4), 10) : 0,
    tmdbRating: Math.round((data.vote_average ?? 0) * 10) / 10,
    availableOn,
    displayOrder,
  };
}

async function fetchTVDetails(
  tmdbId: number,
  selectedServices: string[],
  displayOrder: number
): Promise<CatalogItem | null> {
  const data = await tmdbFetch(`/tv/${tmdbId}`, {
    append_to_response: 'watch/providers',
  });

  const availableOn = extractAvailableOn(
    data['watch/providers']?.results,
    selectedServices
  );
  if (availableOn.length === 0) return null;

  const runtimes: number[] = data.episode_run_time ?? [];
  const avgRuntime =
    runtimes.length > 0
      ? Math.round(runtimes.reduce((a: number, b: number) => a + b, 0) / runtimes.length)
      : 0;

  return {
    id: '',
    sessionId: '',
    tmdbId: data.id,
    title: data.name,
    posterUrl: data.poster_path ? `${TMDB_IMAGE_BASE}${data.poster_path}` : '',
    synopsis: data.overview ?? '',
    genres: mapGenreNames(data.genres ?? []),
    runtime: avgRuntime,
    releaseYear: data.first_air_date ? parseInt(data.first_air_date.substring(0, 4), 10) : 0,
    tmdbRating: Math.round((data.vote_average ?? 0) * 10) / 10,
    availableOn,
    displayOrder,
  };
}

// ─── Exported ───────────────────────────────────────────────

export function getDiscoverPreviewUrls(
  filters: SessionFilters,
  selectedServices: string[]
): string[] {
  const apiKey = process.env.EXPO_PUBLIC_TMDB_API_KEY ?? 'MISSING_KEY';
  const includeMovies = filters.contentType === 'movies' || filters.contentType === 'both';
  const includeTV = filters.contentType === 'tv' || filters.contentType === 'both';
  const urls: string[] = [];

  if (includeMovies) {
    const params = buildDiscoverParams(filters, selectedServices, false);
    const query = Object.entries({ api_key: apiKey, ...params })
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    urls.push(`${TMDB_BASE}/discover/movie?${query}`);
  }

  if (includeTV) {
    const params = buildDiscoverParams(filters, selectedServices, true);
    const query = Object.entries({ api_key: apiKey, ...params })
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    urls.push(`${TMDB_BASE}/discover/tv?${query}`);
  }

  return urls;
}

export async function buildCatalog(
  filters: SessionFilters,
  selectedServices: string[]
): Promise<CatalogItem[]> {
  const includeMovies = filters.contentType === 'movies' || filters.contentType === 'both';
  const includeTV = filters.contentType === 'tv' || filters.contentType === 'both';
  const isBoth = filters.contentType === 'both';

  const perType = isBoth ? 10 : 20;

  let movieResults: any[] = [];
  let tvResults: any[] = [];

  // Discover movies (fetch 2 pages for broader pool)
  if (includeMovies) {
    const params = buildDiscoverParams(filters, selectedServices, false);
    const [page1, page2] = await Promise.all([
      tmdbFetch('/discover/movie', { ...params, page: '1' }),
      tmdbFetch('/discover/movie', { ...params, page: '2' }),
    ]);
    movieResults = [
      ...(page1.results ?? []),
      ...(page2.results ?? []),
    ].slice(0, perType);
  }

  // Discover TV (fetch 2 pages for broader pool)
  if (includeTV) {
    const params = buildDiscoverParams(filters, selectedServices, true);
    const [page1, page2] = await Promise.all([
      tmdbFetch('/discover/tv', { ...params, page: '1' }),
      tmdbFetch('/discover/tv', { ...params, page: '2' }),
    ]);
    tvResults = [
      ...(page1.results ?? []),
      ...(page2.results ?? []),
    ].slice(0, perType);
  }

  // Fetch details in parallel
  const moviePromises = movieResults.map((r, i) =>
    fetchMovieDetails(r.id, selectedServices, i + 1)
  );
  const tvPromises = tvResults.map((r, i) =>
    fetchTVDetails(r.id, selectedServices, i + 1)
  );

  const [movieItems, tvItems] = await Promise.all([
    Promise.all(moviePromises),
    Promise.all(tvPromises),
  ]);

  const movies = movieItems.filter((item): item is CatalogItem => item !== null);
  const tvShows = tvItems.filter((item): item is CatalogItem => item !== null);

  let catalog: CatalogItem[];

  if (isBoth) {
    // Interleave movies and TV shows
    catalog = [];
    const maxLen = Math.max(movies.length, tvShows.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < movies.length) catalog.push(movies[i]);
      if (i < tvShows.length) catalog.push(tvShows[i]);
    }
  } else {
    catalog = includeMovies ? movies : tvShows;
  }

  // Reassign displayOrder sequentially
  catalog = catalog.map((item, i) => ({ ...item, displayOrder: i + 1 }));

  // Fallback: if zero results, drop explicit genre picks but keep mood-derived genres
  if (catalog.length === 0) {
    const fallbackFilters: SessionFilters = {
      ...filters,
      genres: [],
      // Keep mood so mood-derived genres still apply via resolveGenreIds
    };

    let fallbackResults: any[] = [];

    if (includeMovies) {
      const params = buildDiscoverParams(fallbackFilters, selectedServices, false);
      const [page1, page2] = await Promise.all([
        tmdbFetch('/discover/movie', { ...params, page: '1' }),
        tmdbFetch('/discover/movie', { ...params, page: '2' }),
      ]);
      fallbackResults = fallbackResults.concat(
        [...(page1.results ?? []), ...(page2.results ?? [])].slice(0, perType)
      );
    }
    if (includeTV) {
      const params = buildDiscoverParams(fallbackFilters, selectedServices, true);
      const [page1, page2] = await Promise.all([
        tmdbFetch('/discover/tv', { ...params, page: '1' }),
        tmdbFetch('/discover/tv', { ...params, page: '2' }),
      ]);
      fallbackResults = fallbackResults.concat(
        [...(page1.results ?? []), ...(page2.results ?? [])].slice(0, perType)
      );
    }

    const fallbackPromises = fallbackResults.map((r, i) => {
      const isMovie = 'title' in r;
      return isMovie
        ? fetchMovieDetails(r.id, selectedServices, i + 1)
        : fetchTVDetails(r.id, selectedServices, i + 1);
    });

    const fallbackItems = await Promise.all(fallbackPromises);
    catalog = fallbackItems
      .filter((item): item is CatalogItem => item !== null)
      .map((item, i) => ({ ...item, displayOrder: i + 1 }));
  }

  return catalog;
}
