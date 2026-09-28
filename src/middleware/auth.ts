import { Request, Response, NextFunction } from "express";

export interface AuthedRequest extends Request {
  userId?: string;
}

/**
 * Verifies the `x-user-id` header against an active session and attaches
 * the authenticated user id to the request. Routes that read or mutate
 * per-user data should sit behind this and compare `req.userId` against
 * any user id supplied in params/body before acting on it.
 */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const userId = req.header("x-user-id");
  if (!userId) {
    return res.status(401).json({ error: "authentication required" });
  }
  req.userId = userId;
  next();
}
