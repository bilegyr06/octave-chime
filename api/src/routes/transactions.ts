import { Router } from "express";
import { parseOrThrow } from "../schemas/parse";
import { transactionQuerySchema } from "../schemas/query";
import { simulateTxnSchema } from "../schemas/transaction";
import { listTransactions, simulateTransaction } from "../services/transactions";
import { requireAuth, requireBankAdmin } from "./middleware";

export const transactionsRouter = Router();

transactionsRouter.use(requireAuth);
transactionsRouter.use(requireBankAdmin());

transactionsRouter.get("/", async (req, res, next) => {
  try {
    const query = parseOrThrow(transactionQuerySchema, req.query);
    const result = await listTransactions(req.admin!, {
      page: query.page,
      pageSize: query.pageSize,
      customerId: query.customerId,
      type: query.type,
      q: query.q,
      requestedBankId: query.bankId,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

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