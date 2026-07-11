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

export function searchMovies(query: string, page: number) {
  return tmdbFetch("/search/movie", { query, page: String(page) });
}

export function getMovieDetails(id: string) {
  return tmdbFetch(`/movie/${id}`, { append_to_response: "credits,videos" });
}

export function getMovieRecommendations(id: string) {
  return tmdbFetch<{ results: TmdbListItem[] }>(`/movie/${id}/recommendations`, {});
}

export function discoverMoviesByGenre(genreId: number) {
  return tmdbFetch<{ results: TmdbListItem[] }>("/discover/movie", {
    with_genres: String(genreId),
    sort_by: "vote_average.desc",
    "vote_count.gte": "200",
  });
}

export interface TmdbDiscoverResult {
  page: number;
  results: TmdbListItem[];
  total_pages: number;
  total_results: number;
}

export function discoverMoviesByGenrePaged(genreId: number, page: number) {
  return tmdbFetch<TmdbDiscoverResult>("/discover/movie", {
    with_genres: String(genreId),
    sort_by: "popularity.desc",
    "vote_count.gte": "50",
    page: String(page),
  });
}

export interface TmdbListItem {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number;
}
