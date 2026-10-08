import { Router } from "express";
import { parseOrThrow } from "../schemas/parse";
import { simulateTxnSchema } from "../schemas/transaction";
import { simulateTransaction } from "../services/transactions";
import { requireAuth, requireBankAdmin } from "./middleware";

export const transactionsRouter = Router();

transactionsRouter.use(requireAuth);
transactionsRouter.use(requireBankAdmin());

/** Admin demo action: trigger a simulated debit/credit + WhatsApp alert. */
transactionsRouter.post("/simulate", async (req, res, next) => {
  try {
    const input = parseOrThrow(simulateTxnSchema, req.body);
    const result = await simulateTransaction(req.admin!, input);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});