import Redis from "ioredis";
import { logger } from "@utils/logger";
import { config } from "@config/env";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    throw new Error("Redis client not initialized. Call connectRedis() first.");
  }
  return redisClient;
}

export async function connectRedis(): Promise<void> {
  try {
    const redisConfig = {
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
      enableReadyCheck: true,
      enableOfflineQueue: true, // Allow queuing commands when offline
      lazyConnect: false,
      connectTimeout: 10000,
    };

    redisClient = new Redis(config.redis.cacheUrl, redisConfig);

    redisClient.on("connect", () => {
      logger.info("Redis client connected");
    });

    redisClient.on("ready", () => {
      logger.info("Redis client ready");
    });

    redisClient.on("error", (err) => {
      logger.error("Redis client error:", err);
    });

    redisClient.on("close", () => {
      logger.warn("Redis client connection closed");
    });

    redisClient.on("reconnecting", () => {
      logger.info("Redis client reconnecting...");
    });

    // Wait for connection to be ready before testing
    await new Promise<void>((resolve, reject) => {
      if (redisClient!.status === "ready") {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error("Redis connection timeout"));
      }, 10000);

      redisClient!.once("ready", () => {
        clearTimeout(timeout);
        resolve();
      });

      redisClient!.once("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    // Test connection
    await redisClient.ping();
    logger.info("Redis connection verified");
  } catch (error) {
    logger.error("Failed to connect to Redis:", error);
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info("Redis client disconnected");
  }
}
