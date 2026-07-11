import "./setupEnv";

jest.mock("../config/db", () => ({
  pool: { query: jest.fn() },
}));

jest.mock("../services/movie.service", () => ({
  getOrCreateMovieByTmdbId: jest.fn(),
}));

import { pool } from "../config/db";
import { getOrCreateMovieByTmdbId } from "../services/movie.service";
import { createLog, deleteLog, listLogs, updateLog } from "../services/log.service";

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
    expect(params).toEqual(["user-1", "movie-1", 8, null, null]);
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
});
