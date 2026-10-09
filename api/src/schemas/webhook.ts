import { z } from "zod";

/**
 * Termii inbound webhook payload (see OCTAVE_CHIME_BUILD_PLAN §3 for the
 * exact mock payload). Only `message`, `id`/`message_id` and `sender` matter
 * for processing; the rest is tolerated.
 */
export const termiiInboundSchema = z.object({
  type: z.string().optional(),
  id: z.string().optional(),
  message_id: z.string().optional(),
  receiver: z.string().optional(),
  sender: z.string().min(1),
  message: z.string().default(""),
  channel: z.string().optional(),
});

export type TermiiInbound = z.infer<typeof termiiInboundSchema>;