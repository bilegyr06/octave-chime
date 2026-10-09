import { Router } from "express";
import { parseOrThrow } from "../schemas/parse";
import { notificationQuerySchema } from "../schemas/query";
import { listNotifications } from "../services/notifications";
import { requireAuth, requireBankAdmin } from "./middleware";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);
notificationsRouter.use(requireBankAdmin());

notificationsRouter.get("/", async (req, res, next) => {
  try {
    const query = parseOrThrow(notificationQuerySchema, req.query);
    const result = await listNotifications(req.admin!, {
      page: query.page,
      pageSize: query.pageSize,
      type: query.type,
      status: query.status,
      customerId: query.customerId,
      requestedBankId: query.bankId,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});