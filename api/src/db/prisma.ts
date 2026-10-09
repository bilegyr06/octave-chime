import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

let instance: PrismaClient | undefined;

const getClient = (): PrismaClient => {
  instance ??= new PrismaClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = instance;
  return instance;
};

/**
 * Lazy Prisma singleton: the client is only constructed on first use, so the
 * API can boot (and /api/health can report `not_configured`) before a
 * DATABASE_URL is provided.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
