import { z } from "zod";

export const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24-hour)");

export const createCustomerSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(160),
  email: z.email("Enter a valid email").optional(),
  whatsappPhone: z
    .string()
    .regex(PHONE_REGEX, "Phone must look like +2348012345678")
    .optional(),
  // platform_admin only — bank_admin is forced to their own bank
  bankId: z.string().cuid("Invalid bank id").optional(),
  whatsappAlertsEnabled: z.boolean().default(true),
  dailySummaryEnabled: z.boolean().default(true),
  preferredSummaryTime: timeSchema.default("21:00"),
});

export const updateCustomerSchema = z
  .object({
    fullName: z.string().trim().min(1).max(160).optional(),
    email: z.email("Enter a valid email").optional(),
    whatsappPhone: z.string().regex(PHONE_REGEX, "Phone must look like +2348012345678").optional(),
    whatsappAlertsEnabled: z.boolean().optional(),
    dailySummaryEnabled: z.boolean().optional(),
    preferredSummaryTime: timeSchema.optional(),
    serviceStatus: z
      .enum(["pending_link", "active", "paused", "opted_out", "link_expired"])
      .optional(),
    consentStatus: z.enum(["pending", "granted", "revoked"]).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "At least one field is required");

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;