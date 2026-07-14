import { env } from "../config/env";

export class TmdbRequestError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  if (!env.tmdbApiKey) {
    throw new TmdbRequestError("TMDB API key is not configured", 500);
  }

  const url = new URL(`${env.tmdbBaseUrl}${path}`);
  url.searchParams.set("api_key", env.tmdbApiKey);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new TmdbRequestError(`TMDB request failed: ${res.status}`, res.status);
  }

  return (await res.json()) as T;
}

// TMDB natively serves localized title/overview/genre text for this
// language — no translation API or LLM call needed.
const TR = "tr-TR";
// append_to_response's videos sub-request inherits the top-level `language`,
// which would otherwise limit trailers to the (rare) Turkish-dubbed ones;
// this widens it back to Turkish, English, and unlabeled videos.
const VIDEO_LANGS = "tr,en,null";

export function searchMovies(query: string, page: number) {
  return tmdbFetch("/search/movie", { query, page: String(page), language: TR });
}

export function getMovieDetails(id: string) {
  return tmdbFetch(`/movie/${id}`, {
    append_to_response: "credits,videos",
    language: TR,
    include_video_language: VIDEO_LANGS,
  });
}

export function getMovieRecommendations(id: string) {
  return tmdbFetch<{ results: TmdbListItem[] }>(`/movie/${id}/recommendations`, { language: TR });
}

// Used only as a recommendation fallback (favorite-genre discovery), never for
// open-ended catalog browsing — CineLog is a personal tracker, not a
// storefront, so category pages only ever show the user's own collection.
// Accepts a comma-joined genre id list too (TMDB ANDs comma-separated genres).
export function discoverMoviesByGenre(genreIds: number | string) {
  return tmdbFetch<{ results: TmdbListItem[] }>("/discover/movie", {
    with_genres: String(genreIds),
    sort_by: "vote_average.desc",
    "vote_count.gte": "200",
    language: TR,
  });
}

export function getPopularMovies() {
  return tmdbFetch<{ results: TmdbListItem[] }>("/movie/popular", { language: TR });
}

export interface TmdbListItem {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number;
}

export function searchTvShows(query: string, page: number) {
  return tmdbFetch("/search/tv", { query, page: String(page), language: TR });
}

export function getTvShowDetails(id: string) {
  return tmdbFetch(`/tv/${id}`, {
    append_to_response: "credits,videos",
    language: TR,
    include_video_language: VIDEO_LANGS,
  });
}
