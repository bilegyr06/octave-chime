import { prisma } from "./prisma";
import type { AuditActorType, Prisma } from "@prisma/client";

export interface AuditInput {
  bankId?: string | null;
  actorType: AuditActorType;
  actorId: string;
  action: string;
  metadata?: Prisma.InputJsonValue;
}

/** Fire-and-forget audit logging — never throws into the request path. */
export async function logAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        bankId: input.bankId ?? null,
        actorType: input.actorType,
        actorId: input.actorId,
        action: input.action,
        metadata: input.metadata ?? undefined,
      },
    });
  } catch (error) {
    // Swallow: audit must not break the primary operation.
    console.error("audit log failed", error);
  }
}