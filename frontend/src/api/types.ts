export interface User {
  email: string;
}

export interface TmdbMovieSummary {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  overview: string;
}

export interface TmdbSearchResult {
  page: number;
  results: TmdbMovieSummary[];
  total_pages: number;
  total_results: number;
}

export interface TmdbMovieDetail extends TmdbMovieSummary {
  runtime: number | null;
  genres: { id: number; name: string }[];
}

export interface MovieLog {
  id: string;
  user_id: string;
  movie_id: string;
  tmdb_id: number;
  rating: number | null;
  review: string | null;
  watched_date: string;
  created_at: string;
  title: string;
  poster_path: string | null;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  movie_id: string;
  tmdb_id: number;
  added_at: string;
  title: string;
  poster_path: string | null;
}
