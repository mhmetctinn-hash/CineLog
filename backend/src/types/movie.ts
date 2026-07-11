export interface Movie {
  id: string;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  overview: string | null;
  genre_ids: number[];
  collection_id: number | null;
  collection_name: string | null;
  created_at: Date;
}

export interface MovieLog {
  id: string;
  user_id: string;
  movie_id: string;
  rating: number | null;
  review: string | null;
  watched_date: string;
  created_at: Date;
}

export interface WatchlistEntry {
  id: string;
  user_id: string;
  movie_id: string;
  added_at: Date;
}
