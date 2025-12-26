import { Response } from "express";

export type SuccessResponse<T = unknown> = {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

export type ErrorResponse = {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
};

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200,
  meta?: SuccessResponse<T>["meta"]
): Response {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta }),
  };
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: unknown
): Response {
  const error: ErrorResponse["error"] = {
    message,
  };
  if (code) {
    error.code = code;
  }
  if (details) {
    error.details = details;
  }
  const response: ErrorResponse = {
    success: false,
    error,
  };
  return res.status(statusCode).json(response);
}

export function sendCreated<T>(
  res: Response,
  data: T,
  message?: string
): Response {
  return sendSuccess(res, data, message, 201);
}

export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}

export function sendBadRequest(
  res: Response,
  message: string,
  details?: unknown
): Response {
  return sendError(res, message, 400, "BAD_REQUEST", details);
}

export function sendUnauthorized(
  res: Response,
  message: string = "Unauthorized"
): Response {
  return sendError(res, message, 401, "UNAUTHORIZED");
}

export function sendForbidden(
  res: Response,
  message: string = "Forbidden"
): Response {
  return sendError(res, message, 403, "FORBIDDEN");
}

export function sendNotFound(
  res: Response,
  message: string = "Resource not found"
): Response {
  return sendError(res, message, 404, "NOT_FOUND");
}

export function sendConflict(
  res: Response,
  message: string,
  details?: unknown
): Response {
  return sendError(res, message, 409, "CONFLICT", details);
}

export function sendValidationError(
  res: Response,
  message: string,
  details?: unknown
): Response {
  return sendError(res, message, 422, "VALIDATION_ERROR", details);
}

export function sendInternalError(
  res: Response,
  message: string = "Internal server error",
  details?: unknown
): Response {
  return sendError(res, message, 500, "INTERNAL_ERROR", details);
}
