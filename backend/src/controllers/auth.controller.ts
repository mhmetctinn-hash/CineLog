import type { Request, Response } from "express";
import { z } from "zod";
import { env } from "../config/env";
import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidResetTokenError,
  getUserById,
  loginUser,
  registerUser,
  removeAvatar,
  requestPasswordReset,
  resetPassword,
  updateAvatar,
  verifyToken,
} from "../services/auth.service";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

const MAX_AVATAR_DATA_URL_LENGTH = 700_000; // ~500KB image, base64-encoded

const avatarSchema = z.object({
  avatarUrl: z
    .string()
    .startsWith("data:image/")
    .max(MAX_AVATAR_DATA_URL_LENGTH, "Görsel çok büyük"),
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function register(req: Request, res: Response) {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const token = await registerUser(parsed.data.email, parsed.data.password);
    res.cookie("token", token, COOKIE_OPTIONS);
    return res.status(201).json({ email: parsed.data.email, avatarUrl: null });
  } catch (err) {
    if (err instanceof EmailAlreadyRegisteredError) {
      return res.status(409).json({ error: err.message });
    }
    throw err;
  }
}

export async function login(req: Request, res: Response) {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const token = await loginUser(parsed.data.email, parsed.data.password);
    res.cookie("token", token, COOKIE_OPTIONS);
    const { userId } = verifyToken(token);
    const user = await getUserById(userId);
    return res.json({ email: parsed.data.email, avatarUrl: user?.avatar_url ?? null });
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      return res.status(401).json({ error: err.message });
    }
    throw err;
  }
}

export async function forgotPassword(req: Request, res: Response) {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  await requestPasswordReset(parsed.data.email);
  return res.status(204).send();
}

export async function performPasswordReset(req: Request, res: Response) {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    await resetPassword(parsed.data.token, parsed.data.password);
    return res.status(204).send();
  } catch (err) {
    if (err instanceof InvalidResetTokenError) {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie("token", COOKIE_OPTIONS);
  return res.status(204).send();
}

export async function me(req: Request, res: Response) {
  const user = await getUserById(req.auth!.userId);
  return res.json({ email: req.auth!.email, avatarUrl: user?.avatar_url ?? null });
}

export async function setAvatar(req: Request, res: Response) {
  const parsed = avatarSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  await updateAvatar(req.auth!.userId, parsed.data.avatarUrl);
  return res.json({ avatarUrl: parsed.data.avatarUrl });
}

export async function deleteAvatar(req: Request, res: Response) {
  await removeAvatar(req.auth!.userId);
  return res.status(204).send();
}
