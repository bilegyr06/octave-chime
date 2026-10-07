import jwt from "jsonwebtoken";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { config } from "./config";
import { AppError } from "./errors";

export const SESSION_COOKIE = "oc_admin_session";
export const SESSION_SECONDS = 12 * 60 * 60;

// Matches the scrypt format written by prisma/seed.ts: `<saltHex>:<hashHex>`.
const SCRYPT = { N: 16384, r: 8, p: 1 };

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64, SCRYPT).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;
  const actual = scryptSync(password, salt, 64, SCRYPT);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function jwtSecret(): string {
  if (!config.jwtSecret) {
    throw new AppError("JWT_SECRET is not configured", 500, "server_misconfigured");
  }
  return config.jwtSecret;
}

export interface SessionPrincipal {
  sub: string;
  role: string;
  bankId: string | null;
}

export function signSession(admin: { id: string; role: string; bankId: string | null }): string {
  return jwt.sign(
    { role: admin.role, bankId: admin.bankId },
    jwtSecret(),
    { subject: admin.id, expiresIn: SESSION_SECONDS, issuer: "octave-chime" },
  );
}

export function verifySession(token: string): SessionPrincipal {
  try {
    const decoded = jwt.verify(token, jwtSecret(), { issuer: "octave-chime" });
    if (typeof decoded === "string" || !decoded.sub) throw new Error("bad payload");
    return {
      sub: decoded.sub,
      role: String(decoded.role),
      bankId: decoded.bankId === undefined || decoded.bankId === null ? null : String(decoded.bankId),
    };
  } catch {
    throw new AppError("Invalid or expired session", 401, "unauthorized");
  }
}

export function sessionCookieOptions(): {
  httpOnly: boolean;
  sameSite: "lax" | "none";
  secure: boolean;
  maxAge: number;
  path: string;
} {
  const production = config.env === "production";
  return {
    httpOnly: true,
    sameSite: production ? "none" : "lax",
    secure: production,
    maxAge: SESSION_SECONDS * 1000,
    path: "/",
  };
}