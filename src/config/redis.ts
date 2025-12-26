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
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
      enableReadyCheck: true,
      enableOfflineQueue: false,
      lazyConnect: false,
    };

    redisClient = new Redis(redisConfig);

    redisClient.on("connect", () => {
      logger.info("Redis client connected");
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

    // Test connection
    await redisClient.ping();
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
