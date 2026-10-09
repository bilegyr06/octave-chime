import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const customerQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(160).optional(),
  serviceStatus: z.enum(["pending_link", "active", "paused", "opted_out", "link_expired"]).optional(),
  enrollmentStatus: z.enum(["not_started", "in_progress", "completed"]).optional(),
  bankId: z.string().cuid().optional(), // platform_admin only
});

export const notificationQuerySchema = paginationSchema.extend({
  type: z.enum(["transaction_alert", "daily_summary"]).optional(),
  status: z.enum(["queued", "sent", "failed", "skipped"]).optional(),
  customerId: z.string().cuid("Invalid customer id").optional(),
  bankId: z.string().cuid().optional(), // platform_admin only
});

export const transactionQuerySchema = paginationSchema.extend({
  customerId: z.string().cuid("Invalid customer id").optional(),
  type: z.enum(["debit", "credit"]).optional(),
  q: z.string().trim().max(160).optional(), // matches narration or reference
  bankId: z.string().cuid().optional(), // platform_admin only
});

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}