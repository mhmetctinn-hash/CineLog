import type { Request, Response } from "express";
import { z } from "zod";
import { env } from "../config/env";
import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  loginUser,
  registerUser,
} from "../services/auth.service";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
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
    return res.status(201).json({ email: parsed.data.email });
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
    return res.json({ email: parsed.data.email });
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      return res.status(401).json({ error: err.message });
    }
    throw err;
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie("token", COOKIE_OPTIONS);
  return res.status(204).send();
}

export async function me(req: Request, res: Response) {
  return res.json({ email: req.auth!.email });
}
