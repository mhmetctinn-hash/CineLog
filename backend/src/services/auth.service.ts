import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { pool } from "../config/db";
import { env } from "../config/env";
import { sendPasswordResetEmail } from "./email.service";
import { createNotification } from "./notification.service";
import { sendPushToUser } from "./push.service";
import type { AuthPayload, User } from "../types/user";

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = "7d";
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

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

export class InvalidResetTokenError extends Error {
  constructor() {
    super("Invalid or expired reset token");
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

export async function getUserById(userId: string): Promise<Pick<User, "email" | "avatar_url"> | null> {
  const result = await pool.query<User>("SELECT email, avatar_url FROM users WHERE id = $1", [userId]);
  return result.rows[0] ?? null;
}

export async function updateAvatar(userId: string, avatarUrl: string): Promise<void> {
  await pool.query("UPDATE users SET avatar_url = $1 WHERE id = $2", [avatarUrl, userId]);
}

export async function removeAvatar(userId: string): Promise<void> {
  await pool.query("UPDATE users SET avatar_url = NULL WHERE id = $1", [userId]);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const result = await pool.query<User>("SELECT id FROM users WHERE email = $1", [email]);
  const user = result.rows[0];
  if (!user) {
    return;
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  const expires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  await pool.query("UPDATE users SET reset_token_hash = $1, reset_token_expires = $2 WHERE id = $3", [
    tokenHash,
    expires,
    user.id,
  ]);

  const resetUrl = `${env.appUrl}/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail(email, resetUrl);
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const tokenHash = hashResetToken(rawToken);
  const result = await pool.query<User>(
    "SELECT id, reset_token_expires FROM users WHERE reset_token_hash = $1",
    [tokenHash],
  );
  const user = result.rows[0];

  if (!user || !user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
    throw new InvalidResetTokenError();
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.query(
    "UPDATE users SET password_hash = $1, reset_token_hash = NULL, reset_token_expires = NULL WHERE id = $2",
    [passwordHash, user.id],
  );

  const notification = await createNotification({
    userId: user.id,
    type: "system",
    title: "Şifren değiştirildi",
    body: "Hesabının şifresi az önce sıfırlama bağlantısıyla güncellendi. Bu sen değilsen hemen şifreni tekrar değiştir.",
  });
  await sendPushToUser(user.id, { title: notification.title, body: notification.body ?? undefined });
}

function hashResetToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, env.jwtSecret) as AuthPayload;
}
