import { prisma } from "../db/prisma";
import { logAudit } from "../db/audit";
import { verifyPassword, signSession } from "../core/security";
import { AppError } from "../core/errors";
import { toAdminDetail, type AdminDetail } from "../models/admin";
import type { LoginInput } from "../schemas/auth";

export interface LoginResult {
  admin: AdminDetail;
  token: string;
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const email = input.email.trim().toLowerCase();
  const admin = await prisma.bankAdmin.findUnique({
    where: { email },
    include: { bank: { select: { name: true } } },
  });

  if (!admin?.passwordHash || !verifyPassword(input.password, admin.passwordHash)) {
    throw new AppError("Invalid email or password", 401, "invalid_credentials");
  }

  const token = signSession({ id: admin.id, role: admin.role, bankId: admin.bankId });

  await logAudit({
    bankId: admin.bankId,
    actorType: admin.role,
    actorId: admin.id,
    action: "admin.login",
    metadata: { email: admin.email },
  });

  return { admin: toAdminDetail(admin), token };
}