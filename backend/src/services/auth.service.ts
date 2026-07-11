import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../config/db";
import { env } from "../config/env";
import type { AuthPayload, User } from "../types/user";

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = "7d";

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super("Email already registered");
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password");
  }
}

export async function registerUser(email: string, password: string): Promise<string> {
  const existing = await pool.query<User>("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rowCount && existing.rowCount > 0) {
    throw new EmailAlreadyRegisteredError();
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await pool.query<User>(
    "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
    [email, passwordHash],
  );

  return signToken({ userId: result.rows[0].id, email: result.rows[0].email });
}

export async function loginUser(email: string, password: string): Promise<string> {
  const result = await pool.query<User>("SELECT id, email, password_hash FROM users WHERE email = $1", [email]);
  const user = result.rows[0];

  if (!user) {
    throw new InvalidCredentialsError();
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    throw new InvalidCredentialsError();
  }

  return signToken({ userId: user.id, email: user.email });
}

function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, env.jwtSecret) as AuthPayload;
}
