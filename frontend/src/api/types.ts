export interface User {
  email: string;
  avatarUrl: string | null;
  isAdmin: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  movie_log_count: number;
  tv_log_count: number;
}

export interface AdminStats {
  totalUsers: number;
  totalMovieLogs: number;
  totalTvLogs: number;
  totalWatchlistItems: number;
  signupsLast30Days: number;
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

export interface TmdbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  iso_639_1: string;
}

export interface TmdbMovieDetail extends TmdbMovieSummary {
  runtime: number | null;
  genres: { id: number; name: string }[];
  videos?: { results: TmdbVideo[] };
}

export type LogStatus = 'watched' | 'dropped';

export interface MovieLog {
  id: string;
  user_id: string;
  movie_id: string;
  tmdb_id: number;
  rating: number | null;
  review: string | null;
  watched_date: string;
  status: LogStatus;
  has_spoilers: boolean;
  created_at: string;
  title: string;
  poster_path: string | null;
  genre_ids: number[];
  collection_id: number | null;
  collection_name: string | null;
}

export interface MovieLogPage {
  items: MovieLog[];
  nextCursor: string | null;
}

export interface Recommendation {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  voteAverage: number;
  reason: string;
}

export interface LogStats {
  totalLogs: number;
  averageRating: number | null;
  genreCounts: { genreId: number; count: number }[];
  monthlyCounts: { month: string; count: number }[];
  topRated: {
    tmdbId: number;
    title: string;
    posterPath: string | null;
    rating: number | null;
    mediaType: 'movie' | 'tv';
  }[];
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  movie_id: string;
  tmdb_id: number;
  added_at: string;
  title: string;
  poster_path: string | null;
  genre_ids: number[];
}

export interface TmdbTvSummary {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string | null;
  overview: string;
}

export interface TmdbTvSearchResult {
  page: number;
  results: TmdbTvSummary[];
  total_pages: number;
  total_results: number;
}

export interface TmdbTvSeason {
  season_number: number;
  name: string;
  episode_count: number;
}

export interface TmdbTvDetail extends TmdbTvSummary {
  number_of_seasons: number | null;
  genres: { id: number; name: string }[];
  videos?: { results: TmdbVideo[] };
  seasons?: TmdbTvSeason[];
}

export interface TvLog {
  id: string;
  user_id: string;
  tv_show_id: string;
  tmdb_id: number;
  rating: number | null;
  review: string | null;
  watched_date: string;
  status: LogStatus;
  has_spoilers: boolean;
  last_watched_season: number | null;
  last_watched_episode: number | null;
  created_at: string;
  name: string;
  poster_path: string | null;
  genre_ids: number[];
}

export interface TvWatchlistItem {
  id: string;
  user_id: string;
  tv_show_id: string;
  tmdb_id: number;
  added_at: string;
  name: string;
  poster_path: string | null;
  genre_ids: number[];
}

export interface TvLogPage {
  items: TvLog[];
  nextCursor: string | null;
}
