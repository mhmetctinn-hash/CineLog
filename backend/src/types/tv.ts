import type { LogStatus } from "./movie";

export interface TvShow {
  id: string;
  tmdb_id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string | null;
  overview: string | null;
  genre_ids: number[];
  created_at: Date;
}

export interface TvLog {
  id: string;
  user_id: string;
  tv_show_id: string;
  rating: number | null;
  review: string | null;
  watched_date: string;
  status: LogStatus;
  has_spoilers: boolean;
  created_at: Date;
}

export interface TvWatchlistEntry {
  id: string;
  user_id: string;
  tv_show_id: string;
  added_at: Date;
}
