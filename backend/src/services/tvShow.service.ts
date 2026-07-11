import { pool } from "../config/db";
import type { TvShow } from "../types/tv";
import { getTvShowDetails } from "./tmdb.service";

interface TmdbTvDetails {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string | null;
  overview: string | null;
  genres?: { id: number; name: string }[];
}

export async function getOrCreateTvShowByTmdbId(tmdbId: number): Promise<TvShow> {
  const existing = await pool.query<TvShow>("SELECT * FROM tv_shows WHERE tmdb_id = $1", [tmdbId]);
  if (existing.rows[0] && existing.rows[0].genre_ids.length > 0) {
    return existing.rows[0];
  }

  const details = (await getTvShowDetails(String(tmdbId))) as TmdbTvDetails;
  const genreIds = (details.genres ?? []).map((g) => g.id);

  const result = await pool.query<TvShow>(
    `INSERT INTO tv_shows (tmdb_id, name, poster_path, first_air_date, overview, genre_ids)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (tmdb_id) DO UPDATE SET name = EXCLUDED.name
     RETURNING *`,
    [details.id, details.name, details.poster_path, details.first_air_date || null, details.overview, genreIds],
  );

  return result.rows[0];
}

export async function getTvShowById(tvShowId: string): Promise<TvShow | undefined> {
  const result = await pool.query<TvShow>("SELECT * FROM tv_shows WHERE id = $1", [tvShowId]);
  return result.rows[0];
}
