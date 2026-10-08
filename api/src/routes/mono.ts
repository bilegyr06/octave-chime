import { Router } from "express";
import { parseOrThrow } from "../schemas/parse";
import { exchangeInputSchema } from "../schemas/mono";
import { linkAccountByCode } from "../services/accountLinking";

export const monoRouter = Router();

/** Exchange a Mono Connect auth code for a linked account (enroll token gated). */
monoRouter.post("/exchange", async (req, res, next) => {
  try {
    const input = parseOrThrow(exchangeInputSchema, req.body);
    const result = await linkAccountByCode(input.token, input.code);
    res.json(result);
  } catch (err) {
    next(err);
  }
});