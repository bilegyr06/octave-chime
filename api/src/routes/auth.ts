import { Router } from "express";
import { login } from "../services/auth";
import { parseOrThrow } from "../schemas/parse";
import { loginSchema } from "../schemas/auth";
import { SESSION_COOKIE, sessionCookieOptions } from "../core/security";
import { requireAuth } from "./middleware";

export const authRouter = Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = parseOrThrow(loginSchema, req.body);
    const { admin, token } = await login(input);
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
    res.json({ admin });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE, sessionCookieOptions());
  res.status(204).end();
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ admin: req.admin ?? null });
});