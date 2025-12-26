import type { AppError } from "@api/middleware/errorHandler";

/**
 * Creates a custom error that can be thrown in route handlers
 * The error will be automatically caught by asyncHandler and passed to errorHandler
 */
export function createError(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: unknown
): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  if (code) {
    error.code = code;
  }
  if (details) {
    error.details = details;
  }
  return error;
}

/**
 * Creates a Bad Request error (400)
 */
export function badRequest(message: string, details?: unknown): AppError {
  return createError(message, 400, "BAD_REQUEST", details);
}

/**
 * Creates an Unauthorized error (401)
 */
export function unauthorized(message: string = "Unauthorized"): AppError {
  return createError(message, 401, "UNAUTHORIZED");
}

/**
 * Creates a Forbidden error (403)
 */
export function forbidden(message: string = "Forbidden"): AppError {
  return createError(message, 403, "FORBIDDEN");
}

/**
 * Creates a Not Found error (404)
 */
export function notFound(message: string = "Resource not found"): AppError {
  return createError(message, 404, "NOT_FOUND");
}

/**
 * Creates a Conflict error (409)
 */
export function conflict(message: string, details?: unknown): AppError {
  return createError(message, 409, "CONFLICT", details);
}

/**
 * Creates a Validation error (422)
 */
export function validationError(message: string, details?: unknown): AppError {
  return createError(message, 422, "VALIDATION_ERROR", details);
}

/**
 * Creates an Internal Server error (500)
 */
export function internalError(
  message: string = "Internal server error",
  details?: unknown
): AppError {
  return createError(message, 500, "INTERNAL_ERROR", details);
}
