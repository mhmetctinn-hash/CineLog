import { pool } from "../config/db";
import type { Movie } from "../types/movie";
import { getMovieDetails } from "./tmdb.service";

interface TmdbMovieDetails {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  overview: string | null;
  genres?: { id: number; name: string }[];
  belongs_to_collection?: { id: number; name: string } | null;
}

export async function getOrCreateMovieByTmdbId(tmdbId: number): Promise<Movie> {
  const existing = await pool.query<Movie>("SELECT * FROM movies WHERE tmdb_id = $1", [tmdbId]);
  if (existing.rows[0] && existing.rows[0].genre_ids.length > 0) {
    return existing.rows[0];
  }

  const details = (await getMovieDetails(String(tmdbId))) as TmdbMovieDetails;
  const genreIds = (details.genres ?? []).map((g) => g.id);

  const result = await pool.query<Movie>(
    `INSERT INTO movies (tmdb_id, title, poster_path, release_date, overview, genre_ids, collection_id, collection_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (tmdb_id) DO UPDATE SET title = EXCLUDED.title
     RETURNING *`,
    [
      details.id,
      details.title,
      details.poster_path,
      details.release_date || null,
      details.overview,
      genreIds,
      details.belongs_to_collection?.id ?? null,
      details.belongs_to_collection?.name ?? null,
    ],
  );

  return result.rows[0];
}

export async function getMovieById(movieId: string): Promise<Movie | undefined> {
  const result = await pool.query<Movie>("SELECT * FROM movies WHERE id = $1", [movieId]);
  return result.rows[0];
}
