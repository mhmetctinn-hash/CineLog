import "./setupEnv";

jest.mock("../config/db", () => ({
  pool: { query: jest.fn() },
}));

import { pool } from "../config/db";
import { EmailAlreadyRegisteredError, InvalidCredentialsError, loginUser, registerUser, verifyToken } from "../services/auth.service";

const mockedQuery = pool.query as jest.Mock;

describe("auth.service", () => {
  afterEach(() => jest.clearAllMocks());

  describe("registerUser", () => {
    it("throws EmailAlreadyRegisteredError when the email is already taken", async () => {
      mockedQuery.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: "existing" }] });

      await expect(registerUser("taken@example.com", "password123")).rejects.toThrow(EmailAlreadyRegisteredError);
    });

    it("hashes the password and returns a signed JWT for a new user", async () => {
      mockedQuery
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // existing check
        .mockResolvedValueOnce({ rows: [{ id: "new-user-id", email: "new@example.com" }] }); // insert

      const token = await registerUser("new@example.com", "password123");

      expect(typeof token).toBe("string");
      const payload = verifyToken(token);
      expect(payload.userId).toBe("new-user-id");
      expect(payload.email).toBe("new@example.com");

      const insertCall = mockedQuery.mock.calls[1];
      expect(insertCall[0]).toContain("INSERT INTO users");
      // password must never be stored in plain text
      expect(insertCall[1][1]).not.toBe("password123");
    });
  });

  describe("loginUser", () => {
    it("throws InvalidCredentialsError when the user does not exist", async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] });

      await expect(loginUser("nobody@example.com", "password123")).rejects.toThrow(InvalidCredentialsError);
    });

    it("throws InvalidCredentialsError when the password does not match", async () => {
      const bcrypt = await import("bcrypt");
      const hash = await bcrypt.hash("correct-password", 4);
      mockedQuery.mockResolvedValueOnce({ rows: [{ id: "1", email: "user@example.com", password_hash: hash }] });

      await expect(loginUser("user@example.com", "wrong-password")).rejects.toThrow(InvalidCredentialsError);
    });

    it("returns a valid JWT when credentials are correct", async () => {
      const bcrypt = await import("bcrypt");
      const hash = await bcrypt.hash("correct-password", 4);
      mockedQuery.mockResolvedValueOnce({ rows: [{ id: "1", email: "user@example.com", password_hash: hash }] });

      const token = await loginUser("user@example.com", "correct-password");
      const payload = verifyToken(token);
      expect(payload.email).toBe("user@example.com");
    });
  });

  describe("verifyToken", () => {
    it("throws for a malformed token", () => {
      expect(() => verifyToken("not-a-real-token")).toThrow();
    });
  });
});
