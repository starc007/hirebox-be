import { getRedisClient } from "@config/redis";
import { logger } from "@utils/logger";

type CacheOptions = {
  ttl?: number; // Time to live in seconds
  prefix?: string;
};

const DEFAULT_TTL = 3600; // 1 hour
const DEFAULT_PREFIX = "cache";

export async function getCache<T>(
  key: string,
  options: CacheOptions = {}
): Promise<T | null> {
  try {
    const redis = getRedisClient();
    const cacheKey = `${options.prefix || DEFAULT_PREFIX}:${key}`;
    const data = await redis.get(cacheKey);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as T;
  } catch (error) {
    logger.error("Cache get error:", error);
    return null;
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const cacheKey = `${options.prefix || DEFAULT_PREFIX}:${key}`;
    const ttl = options.ttl || DEFAULT_TTL;
    const serialized = JSON.stringify(value);

    await redis.setex(cacheKey, ttl, serialized);
    return true;
  } catch (error) {
    logger.error("Cache set error:", error);
    return false;
  }
}

export async function deleteCache(
  key: string,
  options: CacheOptions = {}
): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const cacheKey = `${options.prefix || DEFAULT_PREFIX}:${key}`;
    await redis.del(cacheKey);
    return true;
  } catch (error) {
    logger.error("Cache delete error:", error);
    return false;
  }
}

export async function clearCachePattern(
  pattern: string,
  options: CacheOptions = {}
): Promise<number> {
  try {
    const redis = getRedisClient();
    const prefix = options.prefix || DEFAULT_PREFIX;
    const fullPattern = `${prefix}:${pattern}`;

    const keys = await redis.keys(fullPattern);
    if (keys.length === 0) {
      return 0;
    }

    return await redis.del(...keys);
  } catch (error) {
    logger.error("Cache clear pattern error:", error);
    return 0;
  }
}

export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const cached = await getCache<T>(key, options);
  if (cached !== null) {
    return cached;
  }

  const fresh = await fetcher();
  await setCache(key, fresh, options);
  return fresh;
}
