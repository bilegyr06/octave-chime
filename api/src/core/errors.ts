import type { NextFunction, Request, Response } from "express";
import { logger } from "./logger";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400,
    public readonly code: string = "bad_request",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ error: "not_found", path: req.path });
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.code, message: err.message });
    return;
  }
  logger.error("unhandled error", { error: err instanceof Error ? err.message : String(err) });
  res.status(500).json({ error: "internal_error", message: "Something went wrong" });
};
