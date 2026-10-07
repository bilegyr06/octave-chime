import { z } from "zod";
import { AppError } from "../core/errors";

/** Coerce + validate a request payload, throwing a 400 AppError on failure. */
export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join("; ");
    throw new AppError(message || "Invalid input", 400, "validation_error");
  }
  return result.data;
}