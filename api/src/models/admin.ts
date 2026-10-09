import type { AdminRole, Bank, BankAdmin } from "@prisma/client";

/** Identity attached to authed requests (req.admin). */
export interface AdminPrincipal {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  bankId: string | null;
}

export interface AdminDetail {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  bankId: string | null;
  bankName: string | null;
  createdAt: Date;
}

export function toAdminPrincipal(admin: BankAdmin): AdminPrincipal {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    bankId: admin.bankId,
  };
}

export function toAdminDetail(admin: BankAdmin & { bank?: Pick<Bank, "name"> | null }): AdminDetail {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    bankId: admin.bankId,
    bankName: admin.bank?.name ?? null,
    createdAt: admin.createdAt,
  };
}