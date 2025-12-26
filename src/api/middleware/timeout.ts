import { Request, Response, NextFunction } from "express";
import { sendInternalError } from "@services/responseService";

export function createTimeoutMiddleware(timeoutMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        sendInternalError(res, `Request timeout after ${timeoutMs}ms`);
      }
    }, timeoutMs);

    res.on("finish", () => {
      clearTimeout(timeout);
    });

    next();
  };
}

// Default timeout: 30 seconds
export const timeoutMiddleware = createTimeoutMiddleware(30000);
