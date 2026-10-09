import { z } from "zod";

export const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

/**
 * Customer edits allowed to admins. Alert preference and consent/service
 * fields are NOT admin-settable: they are owned by the customer (via the
 * WhatsApp bot) and the enrollment flow. Banks pause alerts bank-wide
 * through Bank.whatsappAlertsPaused instead.
 */
export const updateCustomerSchema = z
  .object({
    fullName: z.string().trim().min(1).max(160).optional(),
    email: z.email("Enter a valid email").optional(),
    whatsappPhone: z.string().regex(PHONE_REGEX, "Phone must look like +2348012345678").optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "At least one field is required");

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;