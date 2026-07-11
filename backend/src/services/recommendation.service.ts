import { pool } from "../config/db";
import { discoverMoviesByGenre, getMovieRecommendations, type TmdbListItem } from "./tmdb.service";

export interface Recommendation {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  voteAverage: number;
  reason: string;
}

interface UserMovieRow {
  tmdb_id: number;
  rating: number | null;
  title: string;
  genre_ids: number[];
}

const SEED_MIN_RATING = 7; // out of 10 (3.5 stars)
const MAX_SEEDS = 5;
const TARGET_COUNT = 12;

export async function getRecommendationsForUser(userId: string): Promise<Recommendation[]> {
  const { rows } = await pool.query<UserMovieRow>(
    `SELECT DISTINCT ON (movies.tmdb_id) movies.tmdb_id, movie_logs.rating, movies.title, movies.genre_ids
     FROM movie_logs
     JOIN movies ON movies.id = movie_logs.movie_id
     WHERE movie_logs.user_id = $1
     ORDER BY movies.tmdb_id, movie_logs.rating DESC NULLS LAST`,
    [userId],
  );

  const watchlistResult = await pool.query<{ tmdb_id: number }>(
    `SELECT movies.tmdb_id FROM watchlist JOIN movies ON movies.id = watchlist.movie_id WHERE watchlist.user_id = $1`,
    [userId],
  );

  const excludeIds = new Set<number>([...rows.map((r) => r.tmdb_id), ...watchlistResult.rows.map((r) => r.tmdb_id)]);

  const seeds = rows
    .filter((r) => (r.rating ?? 0) >= SEED_MIN_RATING)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, MAX_SEEDS);

  const aggregated = new Map<number, { item: TmdbListItem; score: number; reason: string }>();

  for (const seed of seeds) {
    let recs: TmdbListItem[] = [];
    try {
      recs = (await getMovieRecommendations(String(seed.tmdb_id))).results ?? [];
    } catch {
      continue;
    }
    for (const item of recs) {
      if (excludeIds.has(item.id)) continue;
      const existing = aggregated.get(item.id);
      if (existing) {
        existing.score += 1;
      } else {
        aggregated.set(item.id, { item, score: 1, reason: `"${seed.title}" filmini sevdiğin için` });
      }
    }
  }

  let results = [...aggregated.values()].sort((a, b) => b.score - a.score || b.item.vote_average - a.item.vote_average);

  if (results.length < TARGET_COUNT) {
    const genreCounts = new Map<number, number>();
    for (const row of rows) {
      for (const g of row.genre_ids ?? []) genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
    }
    const favoriteGenre = [...genreCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

    if (favoriteGenre != null) {
      try {
        const discovered = (await discoverMoviesByGenre(favoriteGenre)).results ?? [];
        for (const item of discovered) {
          if (excludeIds.has(item.id) || aggregated.has(item.id)) continue;
          aggregated.set(item.id, { item, score: 0, reason: "Sevdiğin türe göre" });
          if (aggregated.size >= TARGET_COUNT) break;
        }
        results = [...aggregated.values()].sort((a, b) => b.score - a.score || b.item.vote_average - a.item.vote_average);
      } catch {
        // ignore discover failures, return what we have
      }
    }
  }

  return results.slice(0, TARGET_COUNT).map(({ item, reason }) => ({
    tmdbId: item.id,
    title: item.title,
    posterPath: item.poster_path,
    voteAverage: item.vote_average,
    reason,
  }));
}
