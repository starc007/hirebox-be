import { Request, Response, NextFunction } from "express";
import { sendNotFound } from "@services/responseService";

export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  sendNotFound(res, `Route ${req.originalUrl} not found`);
}
