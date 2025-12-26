import { Request, Response, NextFunction } from "express";
import { getRedisClient } from "@config/redis";
import { sendTooManyRequests } from "@services/responseService";

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
};

const defaultKeyGenerator = (req: Request): string => {
  return req.ip || "unknown";
};

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const redis = getRedisClient();
      const key = `rate_limit:${keyGenerator(req)}`;
      const window = Math.floor(Date.now() / windowMs);

      const current = await redis.incr(`${key}:${window}`);

      if (current === 1) {
        await redis.expire(`${key}:${window}`, Math.ceil(windowMs / 1000));
      }

      const remaining = Math.max(0, maxRequests - current);

      res.setHeader("X-RateLimit-Limit", maxRequests.toString());
      res.setHeader("X-RateLimit-Remaining", remaining.toString());
      res.setHeader("X-RateLimit-Reset", ((window + 1) * windowMs).toString());

      if (current > maxRequests) {
        sendTooManyRequests(res, "Too many requests, please try again later");
        return;
      }

      // Track response status for skip options
      const originalSend = res.send;
      res.send = function (body) {
        const statusCode = res.statusCode;
        const shouldSkip =
          (skipSuccessfulRequests && statusCode < 400) ||
          (skipFailedRequests && statusCode >= 400);

        if (shouldSkip && current > 0) {
          redis.decr(`${key}:${window}`);
        }

        return originalSend.call(this, body);
      };

      next();
    } catch (error) {
      // If Redis fails, allow request through (fail open)
      next();
    }
  };
}

// Pre-configured rate limiters
export const rateLimiters = {
  // Strict rate limiter for auth endpoints
  strict: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  }),

  // Standard API rate limiter
  standard: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  }),

  // Generous rate limiter for public endpoints
  generous: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000,
  }),
};
