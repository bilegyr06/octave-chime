import { Router } from "express";
import { listBanks } from "../services/bank";
import { requireAuth, requirePlatformAdmin } from "./middleware";

export const banksRouter = Router();

banksRouter.use(requireAuth);
banksRouter.use(requirePlatformAdmin());

banksRouter.get("/", async (req, res, next) => {
  try {
    const banks = await listBanks(req.admin!);
    res.json(banks);
  } catch (err) {
    next(err);
  }
});