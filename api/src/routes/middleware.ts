import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma";
import { AppError } from "../core/errors";
import { SESSION_COOKIE, verifySession } from "../core/security";
import { toAdminPrincipal } from "../models/admin";

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = (req.cookies ?? {})[SESSION_COOKIE];
    if (!token) throw new AppError("Authentication required", 401, "unauthorized");

    const principal = verifySession(token);
    const admin = await prisma.bankAdmin.findUnique({ where: { id: principal.sub } });
    if (!admin) throw new AppError("Account no longer exists", 401, "unauthorized");

    req.admin = toAdminPrincipal(admin);
    next();
  } catch (err) {
    next(err);
  }
}

/** Ensures the authenticated admin has one of the given roles. */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const admin = req.admin;
    if (!admin || !roles.includes(admin.role)) {
      next(new AppError("You do not have permission to do this", 403, "forbidden"));
      return;
    }
    next();
  };
}

export function requirePlatformAdmin() {
  return requireRole("platform_admin");
}

export function requireBankAdmin() {
  return requireRole("bank_admin", "platform_admin");
}