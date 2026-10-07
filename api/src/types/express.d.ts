import type { AdminPrincipal } from "../models/admin";

declare global {
  namespace Express {
    interface Request {
      /** Attached by requireAuth (routes/middleware.ts). */
      admin?: AdminPrincipal;
    }
  }
}

export {};