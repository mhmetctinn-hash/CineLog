import { pool } from "../config/db";
import { searchMovies } from "./tmdb.service";
import { getOrCreateMovieByTmdbId } from "./movie.service";
import type { TmdbListItem } from "./tmdb.service";

interface ExportRow {
  media_type: "movie" | "tv";
  title: string;
  tmdb_id: number;
  rating: number | null;
  watched_date: string;
  status: string;
  has_spoilers: boolean;
  review: string | null;
}

const CSV_HEADER = ["Type", "Title", "TMDB ID", "Rating", "Watched Date", "Status", "Has Spoilers", "Review"];

export async function exportLogsCsv(userId: string): Promise<string> {
  const [movieRows, tvRows] = await Promise.all([
    pool.query<Omit<ExportRow, "media_type">>(
      `SELECT movies.title, movies.tmdb_id, movie_logs.rating, movie_logs.watched_date,
              movie_logs.status, movie_logs.has_spoilers, movie_logs.review
       FROM movie_logs
       JOIN movies ON movies.id = movie_logs.movie_id
       WHERE movie_logs.user_id = $1
       ORDER BY movie_logs.watched_date DESC`,
      [userId],
    ),
    pool.query<Omit<ExportRow, "media_type" | "title"> & { name: string }>(
      `SELECT tv_shows.name, tv_shows.tmdb_id, tv_logs.rating, tv_logs.watched_date,
              tv_logs.status, tv_logs.has_spoilers, tv_logs.review
       FROM tv_logs
       JOIN tv_shows ON tv_shows.id = tv_logs.tv_show_id
       WHERE tv_logs.user_id = $1
       ORDER BY tv_logs.watched_date DESC`,
      [userId],
    ),
  ]);

  const rows: ExportRow[] = [
    ...movieRows.rows.map((r) => ({ ...r, media_type: "movie" as const })),
    ...tvRows.rows.map((r) => ({ ...r, title: r.name, media_type: "tv" as const })),
  ];

  const lines = [CSV_HEADER.map(csvEscape).join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.media_type,
        row.title,
        String(row.tmdb_id),
        row.rating != null ? String(row.rating) : "",
        String(row.watched_date).slice(0, 10),
        row.status,
        row.has_spoilers ? "true" : "false",
        row.review ?? "",
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  return lines.join("\r\n");
}

function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((f) => f.trim().length > 0));
}

const MAX_IMPORT_ROWS = 500;

export interface ImportResult {
  imported: number;
  duplicates: number;
  notFound: string[];
}

export async function importLetterboxdCsv(userId: string, csvText: string): Promise<ImportResult> {
  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return { imported: 0, duplicates: 0, notFound: [] };
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const nameIdx = header.indexOf("name");
  const yearIdx = header.indexOf("year");
  const ratingIdx = header.indexOf("rating");
  const watchedDateIdx = header.indexOf("watched date") !== -1 ? header.indexOf("watched date") : header.indexOf("date");

  if (nameIdx === -1) {
    throw new Error("CSV must have a 'Name' column (Letterboxd export format)");
  }

  const dataRows = rows.slice(1).slice(0, MAX_IMPORT_ROWS);

  let imported = 0;
  let duplicates = 0;
  const notFound: string[] = [];

  for (const cols of dataRows) {
    const name = cols[nameIdx]?.trim();
    if (!name) continue;

    const year = yearIdx !== -1 ? cols[yearIdx]?.trim() : undefined;
    const rawRating = ratingIdx !== -1 ? cols[ratingIdx]?.trim() : undefined;
    const watchedDate = watchedDateIdx !== -1 ? cols[watchedDateIdx]?.trim() : undefined;

    const match = await findBestMovieMatch(name, year);
    if (!match) {
      notFound.push(year ? `${name} (${year})` : name);
      continue;
    }

    const movie = await getOrCreateMovieByTmdbId(match.id);
    const rating = rawRating ? Math.round(Math.min(5, Math.max(0, Number(rawRating))) * 2) : null;
    const validDate = watchedDate && /^\d{4}-\d{2}-\d{2}$/.test(watchedDate) ? watchedDate : null;

    const result = await pool.query(
      `INSERT INTO movie_logs (user_id, movie_id, rating, watched_date, status)
       VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), 'watched')
       ON CONFLICT (user_id, movie_id, watched_date) DO NOTHING
       RETURNING id`,
      [userId, movie.id, rating || null, validDate],
    );

    if (result.rowCount && result.rowCount > 0) {
      imported++;
    } else {
      duplicates++;
    }
  }

  return { imported, duplicates, notFound };
}

async function findBestMovieMatch(name: string, year?: string): Promise<TmdbListItem | null> {
  try {
    const results = await searchMovies(name, 1) as { results: TmdbListItem[] };
    if (!results.results || results.results.length === 0) return null;

    if (year) {
      const withYear = results.results.find((m) => m.release_date?.startsWith(year));
      if (withYear) return withYear;
    }

    return results.results[0];
  } catch {
    return null;
  }
}
