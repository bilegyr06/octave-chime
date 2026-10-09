import { z } from "zod";

export const updateBankProfileSchema = z
  .object({
    // platform_admin only — bank_admin is always scoped to their own bank
    bankId: z.string().cuid("Invalid bank id").optional(),
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(120).optional(),
    logoUrl: z.url("Enter a valid URL for the logo").max(400).nullable().optional(),
    supportEmail: z.email("Enter a valid support email").nullable().optional(),
    whatsappAlertsPaused: z.boolean().optional(),
  })
  .refine(
    (v) =>
      ["name", "logoUrl", "supportEmail", "whatsappAlertsPaused"].some(
        (k) => v[k as keyof typeof v] !== undefined,
      ),
    "At least one field is required",
  );

export type UpdateBankProfileInput = z.infer<typeof updateBankProfileSchema>;