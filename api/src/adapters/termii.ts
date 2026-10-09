import { config, isMockMode } from "../core/config";
import { logger } from "../core/logger";

export interface TermiiSendResult {
  status: "sent" | "failed";
  providerMessageId: string | null;
  errorMessage?: string | null;
}

export interface TermiiAdapter {
  /** Send a WhatsApp-style text message to a customer. */
  send(to: string, text: string): Promise<TermiiSendResult>;
}

function mockAdapter(): TermiiAdapter {
  return {
    async send(to, text) {
      logger.info(`[termii:mock] outbound -> ${to}:\n${text}`);
      return { status: "sent", providerMessageId: null };
    },
  };
}

/**
 * Live Termii WhatsApp free-form API.
 * (Free-form messages only work inside the 24-hour customer-service window;
 * proactive messages need TERMII_TEMPLATE_ID — handled in later phases.)
 */
function liveAdapter(): TermiiAdapter {
  return {
    async send(to, text) {
      try {
        const res = await fetch(`${config.termii.baseUrl}/api/whatsapp/freeform`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: config.termii.apiKey,
            to,
            from: config.termii.deviceId,
            type: "text",
            content: { text },
          }),
        });
        if (!res.ok) {
          logger.error("termii send failed", { status: res.status, body: await res.text() });
          return { status: "failed", providerMessageId: null, errorMessage: `HTTP ${res.status}` };
        }
        const data = (await res.json()) as { ok?: boolean; messageId?: string };
        return { status: "sent", providerMessageId: data.messageId ?? null };
      } catch (error) {
        logger.error("termii send threw", { error });
        return { status: "failed", providerMessageId: null, errorMessage: String(error) };
      }
    },
  };
}

export function createTermiiAdapter(): TermiiAdapter {
  return isMockMode() ? mockAdapter() : liveAdapter();
}