import { Router, type Request, type Response } from "express";
import { prisma } from "../db/prisma";
import { parseOrThrow } from "../schemas/parse";
import { termiiInboundSchema } from "../schemas/webhook";
import { createTermiiAdapter } from "../adapters/termii";
import { deliverReplies, handleInbound, normalizePhone } from "../services/bot";
import { logger } from "../core/logger";

export const webhooksRouter = Router();

const adapter = createTermiiAdapter();

/**
 * Termii inbound webhook. Idempotent on the webhook message id: duplicate
 * deliveries are recorded once and replied to zero times so `mock-inbound.js`
 * can safely replay payloads.
 */
webhooksRouter.post("/termii", async (req: Request, res: Response, next) => {
  try {
    const inbound = parseOrThrow(termiiInboundSchema, req.body ?? {});

    if (!inbound.message.trim()) {
      // Status/delivery notifications and heartbeats carry no user message.
      res.status(200).json({ ok: true, ignored: "empty" });
      return;
    }

    const messageId = inbound.id ?? inbound.message_id;
    if (messageId) {
      const seen = await prisma.botMessage.findUnique({ where: { messageId } });
      if (seen) {
        res.status(200).json({ ok: true, duplicate: true });
        return;
      }
    }

    const sender = normalizePhone(inbound.sender);
    const user = await prisma.customer.findUnique({ where: { whatsappPhone: sender } });

    await prisma.botMessage.create({
      data: {
        direction: "inbound",
        messageId: messageId ?? null,
        sender,
        recipient: inbound.receiver ?? null,
        text: inbound.message,
        customerId: user?.id ?? null,
      },
    });

    const handled = await handleInbound(inbound.message, sender);
    await deliverReplies(sender, handled.customerId ?? user?.id, handled.replies, (to, text) =>
      adapter.send(to, text),
    );

    logger.info("termii inbound processed", {
      sender,
      message: inbound.message,
      replies: handled.replies.length,
    });

    res.status(200).json({ ok: true, replies: handled.replies.length });
  } catch (err) {
    next(err);
  }
});