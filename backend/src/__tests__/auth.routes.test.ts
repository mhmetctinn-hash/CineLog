import "./setupEnv";

jest.mock("../config/db", () => ({
  pool: { query: jest.fn() },
}));

import request from "supertest";
import { pool } from "../config/db";
import { app } from "../app";

const mockedQuery = pool.query as jest.Mock;

describe("auth routes", () => {
  afterEach(() => jest.clearAllMocks());

  it("POST /api/auth/register creates a user and sets an httpOnly cookie", async () => {
    mockedQuery
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: "user-1", email: "new@example.com" }] });

    const res = await request(app).post("/api/auth/register").send({ email: "new@example.com", password: "password123" });

    expect(res.status).toBe(201);
    const cookieHeader = res.headers["set-cookie"]?.[0] ?? "";
    expect(cookieHeader).toContain("HttpOnly");
  });

  it("POST /api/auth/register rejects a duplicate email with 409", async () => {
    mockedQuery.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: "existing" }] });

    const res = await request(app).post("/api/auth/register").send({ email: "dup@example.com", password: "password123" });

    expect(res.status).toBe(409);
  });

  it("POST /api/auth/register rejects a short password with 400", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "short@example.com", password: "short" });

    expect(res.status).toBe(400);
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it("POST /api/auth/login rejects wrong credentials with 401", async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post("/api/auth/login").send({ email: "nobody@example.com", password: "password123" });

    expect(res.status).toBe(401);
  });

  it("GET /api/auth/me returns 401 without a cookie", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
  });

  it("GET /api/auth/me returns the user after a successful login", async () => {
    const bcrypt = await import("bcrypt");
    const hash = await bcrypt.hash("password123", 4);
    mockedQuery.mockResolvedValueOnce({ rows: [{ id: "user-1", email: "me@example.com", password_hash: hash }] });

    const agent = request.agent(app);
    const loginRes = await agent.post("/api/auth/login").send({ email: "me@example.com", password: "password123" });
    expect(loginRes.status).toBe(200);

    const meRes = await agent.get("/api/auth/me");
    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe("me@example.com");
  });
});
