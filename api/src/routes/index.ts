import { Router } from "express";
import { healthRouter } from "./health";

export const routes = Router();

routes.use("/health", healthRouter);
