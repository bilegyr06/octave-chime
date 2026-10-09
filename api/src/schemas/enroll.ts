import { z } from "zod";

/** Re-consent confirmation: the customer explicitly affirms consent on the web. */
export const consentSchema = z.object({
  consent: z.literal(true),
});