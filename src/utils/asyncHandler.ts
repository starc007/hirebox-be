import { Request, Response, NextFunction } from "express";

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

type AsyncMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

/**
 * Wraps an async route handler to automatically catch errors
 * and pass them to the error handling middleware
 *
 * @example
 * ```typescript
 * router.get('/users/:id', asyncHandler(async (req, res) => {
 *   const user = await getUserById(req.params.id);
 *   if (!user) throw notFound('User not found');
 *   return sendSuccess(res, user);
 * }));
 * ```
 */
export function asyncHandler(
  fn: AsyncRequestHandler
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await Promise.resolve(fn(req, res, next));
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Wraps an async middleware to automatically catch errors
 * and pass them to the error handling middleware
 *
 * @example
 * ```typescript
 * app.use(asyncMiddleware(async (req, res, next) => {
 *   await validateRequest(req);
 *   next();
 * }));
 * ```
 */
export function asyncMiddleware(
  fn: AsyncMiddleware
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await Promise.resolve(fn(req, res, next));
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Wraps a function with try-catch and error handling
 * Useful for non-Express async functions
 *
 * @example
 * ```typescript
 * const safeFunction = tryCatch(async (data: string) => {
 *   return await processData(data);
 * });
 * ```
 */
export function tryCatch<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T
): T {
  return ((...args: Parameters<T>) => {
    return Promise.resolve(fn(...args)).catch((error: unknown) => {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(String(error));
    });
  }) as T;
}

/**
 * Executes an async function with try-catch and returns a tuple
 * [error, result] - similar to Go's error handling pattern
 *
 * @example
 * ```typescript
 * const [error, result] = await tryCatchResult(async () => {
 *   return await fetchData();
 * });
 * if (error) {
 *   // handle error
 * } else {
 *   // use result
 * }
 * ```
 */
export async function tryCatchResult<T>(
  fn: () => Promise<T>
): Promise<[Error | null, T | null]> {
  try {
    const result = await fn();
    return [null, result];
  } catch (error) {
    if (error instanceof Error) {
      return [error, null];
    }
    return [new Error(String(error)), null];
  }
}
