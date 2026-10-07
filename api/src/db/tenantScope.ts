import { AppError } from "../core/errors";

/**
 * Tenant isolation helpers. Every cross-tenant query must pass through here:
 * `where` clauses always end up scoped by bankId.
 */

export const scopedWhere = <T extends Record<string, unknown>>(
  bankId: string,
  where: T = {} as T,
): T & { bankId: string } => ({ ...where, bankId });

export function assertBelongsToBank(
  bankId: string,
  record: { bankId: string } | null | undefined,
  entity: string,
): void {
  if (!record) throw new AppError(`${entity} not found`, 404, "not_found");
  if (record.bankId !== bankId) throw new AppError(`${entity} not found`, 404, "not_found");
}
