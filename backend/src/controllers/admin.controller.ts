import type { Request, Response } from "express";
import { deleteUser, getAdminStats, listUsers } from "../services/admin.service";

export async function users(_req: Request, res: Response) {
  const data = await listUsers();
  return res.json(data);
}

export async function removeUser(req: Request, res: Response) {
  if (req.params.id === req.auth!.userId) {
    return res.status(400).json({ error: "Kendi hesabını admin panelinden silemezsin" });
  }

  const deleted = await deleteUser(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.status(204).send();
}

export async function stats(_req: Request, res: Response) {
  const data = await getAdminStats();
  return res.json(data);
}
