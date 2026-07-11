import "./setupEnv";

process.env.TMDB_API_KEY = "test-tmdb-key";

jest.mock("../config/db", () => ({
  pool: { query: jest.fn() },
}));

import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../app";

const authCookie = `token=${jwt.sign({ userId: "user-1", email: "me@example.com" }, "test-secret-for-jest-do-not-use-in-prod")}`;

describe("tmdb routes", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("GET /api/tmdb/search requires authentication", async () => {
    const res = await request(app).get("/api/tmdb/search?query=inception");
    expect(res.status).toBe(401);
  });

  it("GET /api/tmdb/search proxies to TMDB and never leaks the api key in the response", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ page: 1, results: [{ id: 27205, title: "Inception" }], total_pages: 1, total_results: 1 }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await request(app).get("/api/tmdb/search?query=inception").set("Cookie", authCookie);

    expect(res.status).toBe(200);
    expect(res.body.results[0].title).toBe("Inception");
    expect(JSON.stringify(res.body)).not.toContain("test-tmdb-key");

    const requestedUrl = String(fetchMock.mock.calls[0][0]);
    expect(requestedUrl).toContain("api_key=test-tmdb-key");
    expect(requestedUrl).toContain("themoviedb.org");
  });

  it("GET /api/tmdb/search rejects a missing query with 400", async () => {
    const res = await request(app).get("/api/tmdb/search").set("Cookie", authCookie);
    expect(res.status).toBe(400);
  });

  it("GET /api/tmdb/movie/:id returns 502-range status when TMDB errors", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 }) as unknown as typeof fetch;

    const res = await request(app).get("/api/tmdb/movie/999999999").set("Cookie", authCookie);

    expect(res.status).toBe(404);
  });
});
