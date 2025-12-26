import { Request, Response, NextFunction } from "express";
import { logger } from "@utils/logger";
import { config } from "@config/env";
import { sendError } from "@services/responseService";

export type AppError = Error & {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
  details?: unknown;
};

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error("Error:", {
    statusCode,
    message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  sendError(
    res,
    message,
    statusCode,
    err.code,
    config.nodeEnv === "development" ? { stack: err.stack } : undefined
  );
}
