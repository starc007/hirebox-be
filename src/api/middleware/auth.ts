import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@utils/jwt";

import { sendUnauthorized } from "@services/responseService";
import type { UserPayload } from "@models/User";

export type AuthenticatedRequest = Request & {
  user?: UserPayload;
};

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      sendUnauthorized(res, "No token provided");
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    req.user = payload;
    next();
  } catch (error) {
    sendUnauthorized(res, "Invalid or expired token");
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      sendUnauthorized(res, "Authentication required");
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendUnauthorized(res, "Insufficient permissions");
      return;
    }

    next();
  };
}
