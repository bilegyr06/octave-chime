import { Router } from "express";
import cookieParser from "cookie-parser";
import { healthRouter } from "./health";
import { authRouter } from "./auth";
import { dashboardRouter } from "./dashboard";
import { customersRouter } from "./customers";
import { notificationsRouter } from "./notifications";

export const routes = Router();

routes.use(cookieParser());

routes.use("/health", healthRouter);
routes.use("/auth", authRouter);
routes.use("/dashboard", dashboardRouter);
routes.use("/customers", customersRouter);
routes.use("/notifications", notificationsRouter);