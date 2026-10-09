import { z } from "zod";

export const simulateTxnSchema = z.object({
  customerId: z.string().min(1),
  type: z.enum(["debit", "credit"]),
  amount: z.coerce.number().positive("amount must be positive").max(100_000_000),
  narration: z.string().trim().max(160).optional(),
  // "Which bank the simulated transaction should be sent to" — must match the
  // customer's own bank (validated in simulateTransaction).
  bankId: z.string().cuid("Invalid bank id").optional(),
});

export type SimulateTxnInput = z.infer<typeof simulateTxnSchema>;