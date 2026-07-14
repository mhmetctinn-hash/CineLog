import { pool } from "../config/db";
import { discoverMoviesByGenre, getMovieRecommendations, getPopularMovies, type TmdbListItem } from "./tmdb.service";

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

async function getWatchedAndWatchlistIds(userId: string): Promise<Set<number>> {
  const { rows } = await pool.query<{ tmdb_id: number }>(
    `SELECT movies.tmdb_id FROM movie_logs JOIN movies ON movies.id = movie_logs.movie_id WHERE movie_logs.user_id = $1
     UNION
     SELECT movies.tmdb_id FROM watchlist JOIN movies ON movies.id = watchlist.movie_id WHERE watchlist.user_id = $1`,
    [userId],
  );
  return new Set(rows.map((r) => r.tmdb_id));
}

// "Bugün ne izlesem?" — dice roll: prefers the user's own watchlist (they already
// chose these), falls back to their personalized recommendations, then to
// TMDB's popular list for brand-new users with no history at all.
export async function getDiceRoll(userId: string): Promise<Recommendation | null> {
  const { rows: watchlistRows } = await pool.query<{ tmdb_id: number; title: string; poster_path: string | null }>(
    `SELECT movies.tmdb_id, movies.title, movies.poster_path
     FROM watchlist JOIN movies ON movies.id = watchlist.movie_id
     WHERE watchlist.user_id = $1`,
    [userId],
  );

  if (watchlistRows.length > 0) {
    const pick = watchlistRows[Math.floor(Math.random() * watchlistRows.length)];
    return {
      tmdbId: pick.tmdb_id,
      title: pick.title,
      posterPath: pick.poster_path,
      voteAverage: 0,
      reason: "İzleme listenden zar attık",
    };
  }

  const recs = await getRecommendationsForUser(userId);
  if (recs.length > 0) {
    return recs[Math.floor(Math.random() * recs.length)];
  }

  try {
    const excludeIds = await getWatchedAndWatchlistIds(userId);
    const popular = ((await getPopularMovies()).results ?? []).filter((item) => !excludeIds.has(item.id));
    if (popular.length === 0) return null;
    const pick = popular[Math.floor(Math.random() * popular.length)];
    return {
      tmdbId: pick.id,
      title: pick.title,
      posterPath: pick.poster_path,
      voteAverage: pick.vote_average,
      reason: "Popüler filmlerden zar attık",
    };
  } catch {
    return null;
  }
}

const MOOD_GENRES: Record<string, number> = {
  action: 28,
  cozy: 35,
  emotional: 18,
  thrill: 53,
};

const MOOD_LABELS: Record<string, string> = {
  action: "Aksiyon & Macera",
  cozy: "Komedi & Keyifli",
  emotional: "Dram & Duygusal",
  thrill: "Gerilim & Gizem",
};

const PACE_GENRES: Record<string, number> = {
  fast: 12, // Adventure — layered onto the mood genre for a faster-paced pick
  calm: 10749, // Romance — layered on for a slower, softer pick
};

const PACE_LABELS: Record<string, string> = {
  fast: "hızlı tempolu",
  calm: "sakin ve rahatlatıcı",
};

export const MOOD_OPTIONS = Object.keys(MOOD_GENRES);
export const PACE_OPTIONS = Object.keys(PACE_GENRES);

// The quiz's second question ("mood-quiz" — question generation is a fixed,
// pre-written pair rather than an LLM, since there's no AI in this project).
export async function getMoodRecommendations(
  userId: string,
  mood: string,
  pace?: string,
): Promise<Recommendation[]> {
  const genreId = MOOD_GENRES[mood];
  if (!genreId) return [];

  const excludeIds = await getWatchedAndWatchlistIds(userId);
  const paceGenre = pace ? PACE_GENRES[pace] : undefined;

  let discovered: TmdbListItem[] = [];
  try {
    if (paceGenre) {
      discovered = (await discoverMoviesByGenre(`${genreId},${paceGenre}`)).results ?? [];
    }
    if (discovered.length < 6) {
      discovered = (await discoverMoviesByGenre(genreId)).results ?? [];
    }
  } catch {
    return [];
  }

  const reasonParts = [MOOD_LABELS[mood], pace ? PACE_LABELS[pace] : null].filter(Boolean).join(", ");

  return discovered
    .filter((item) => !excludeIds.has(item.id))
    .slice(0, 8)
    .map((item) => ({
      tmdbId: item.id,
      title: item.title,
      posterPath: item.poster_path,
      voteAverage: item.vote_average,
      reason: `${reasonParts} tercihine göre`,
    }));
}
