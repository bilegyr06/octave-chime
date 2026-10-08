import { Router } from "express";
import { parseOrThrow } from "../schemas/parse";
import { updateBankProfileSchema } from "../schemas/bank";
import { getBankProfile, updateBankProfile } from "../services/bank";
import { requireAuth, requireBankAdmin } from "./middleware";

export const bankRouter = Router();

bankRouter.use(requireAuth);
bankRouter.use(requireBankAdmin());

bankRouter.get("/profile", async (req, res, next) => {
  try {
    const requestedBankId =
      typeof req.query.bankId === "string" ? req.query.bankId : undefined;
    const profile = await getBankProfile(req.admin!, requestedBankId);
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

bankRouter.patch("/profile", async (req, res, next) => {
  try {
    const input = parseOrThrow(updateBankProfileSchema, req.body);
    const profile = await updateBankProfile(req.admin!, input);
    res.json(profile);
  } catch (err) {
    next(err);
  }
});