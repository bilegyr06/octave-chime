import { z } from "zod";

export const exchangeInputSchema = z.object({
  token: z.string().min(1),
  code: z.string().min(1),
});

export type ExchangeInput = z.infer<typeof exchangeInputSchema>;