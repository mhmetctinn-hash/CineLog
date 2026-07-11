import "./setupEnv";

jest.mock("../config/db", () => ({
  pool: { query: jest.fn() },
}));

jest.mock("../services/movie.service", () => ({
  getOrCreateMovieByTmdbId: jest.fn(),
}));

import { pool } from "../config/db";
import { getOrCreateMovieByTmdbId } from "../services/movie.service";
import { createLog, deleteLog, encodeLogCursor, listLogs, listLogsPage, updateLog } from "../services/log.service";

const mockedQuery = pool.query as jest.Mock;
const mockedGetOrCreateMovie = getOrCreateMovieByTmdbId as jest.Mock;

describe("log.service", () => {
  afterEach(() => jest.clearAllMocks());

  it("createLog resolves the movie by tmdbId and inserts a log row scoped to the user", async () => {
    mockedGetOrCreateMovie.mockResolvedValueOnce({ id: "movie-1", tmdb_id: 550 });
    mockedQuery.mockResolvedValueOnce({ rows: [{ id: "log-1", user_id: "user-1", movie_id: "movie-1", rating: 8 }] });

    const log = await createLog({ userId: "user-1", tmdbId: 550, rating: 8 });

    expect(mockedGetOrCreateMovie).toHaveBeenCalledWith(550);
    expect(log.id).toBe("log-1");
    const [sql, params] = mockedQuery.mock.calls[0];
    expect(sql).toContain("INSERT INTO movie_logs");
    expect(params).toEqual(["user-1", "movie-1", 8, null, null, null, null]);
  });

  it("listLogs scopes the query to the given userId", async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [] });

    await listLogs("user-1");

    const [, params] = mockedQuery.mock.calls[0];
    expect(params).toEqual(["user-1", null]);
  });

  it("updateLog only affects rows owned by the requesting user", async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ id: "log-1", rating: 9 }] });

    const result = await updateLog("user-1", "log-1", { rating: 9 });

    expect(result?.rating).toBe(9);
    const [sql, params] = mockedQuery.mock.calls[0];
    expect(sql).toContain("WHERE id = $1 AND user_id = $2");
    expect(params[0]).toBe("log-1");
    expect(params[1]).toBe("user-1");
  });

  it("deleteLog returns false when no row was deleted (wrong owner or missing)", async () => {
    mockedQuery.mockResolvedValueOnce({ rowCount: 0 });

    const result = await deleteLog("user-1", "not-mine");

    expect(result).toBe(false);
  });

  it("deleteLog returns true when a row was deleted", async () => {
    mockedQuery.mockResolvedValueOnce({ rowCount: 1 });

    const result = await deleteLog("user-1", "log-1");

    expect(result).toBe(true);
  });

  describe("listLogsPage", () => {
    it("returns no nextCursor when fewer rows than the limit come back", async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [{ id: "1", watched_date: "2026-01-01", created_at: "t1" }] });

      const page = await listLogsPage({ userId: "user-1", limit: 5 });

      expect(page.items).toHaveLength(1);
      expect(page.nextCursor).toBeNull();
      const [, params] = mockedQuery.mock.calls[0];
      expect(params[params.length - 1]).toBe(6); // limit + 1
    });

    it("returns a nextCursor and trims the extra row when there are more results", async () => {
      const rows = Array.from({ length: 6 }, (_, i) => ({
        id: `id-${i}`,
        watched_date: "2026-01-01",
        created_at: `t${i}`,
      }));
      mockedQuery.mockResolvedValueOnce({ rows });

      const page = await listLogsPage({ userId: "user-1", limit: 5 });

      expect(page.items).toHaveLength(5);
      expect(page.nextCursor).not.toBeNull();
    });

    it("decodes a cursor into the row-comparison parameters", async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] });
      const cursor = encodeLogCursor({ watchedDate: "2026-01-01", createdAt: "2026-01-01T00:00:00Z", id: "abc" });

      await listLogsPage({ userId: "user-1", cursor });

      const [, params] = mockedQuery.mock.calls[0];
      expect(params[2]).toBe("2026-01-01");
      expect(params[3]).toBe("2026-01-01T00:00:00Z");
      expect(params[4]).toBe("abc");
    });

    it("filters by status when provided", async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] });

      await listLogsPage({ userId: "user-1", status: "dropped" });

      const [, params] = mockedQuery.mock.calls[0];
      expect(params[1]).toBe("dropped");
    });
  });
});
