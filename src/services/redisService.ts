import { getRedisClient } from "@config/redis";
import { logger } from "@utils/logger";

/**
 * Redis Service for key-value operations
 * Provides abstraction over Redis client for common operations
 */

/**
 * Set a key-value pair with optional expiration
 * @param key - Redis key
 * @param value - Value to store (will be stringified if object)
 * @param ttlSeconds - Time to live in seconds (optional)
 */
export async function setKey(
  key: string,
  value: string | number | object,
  ttlSeconds?: number
): Promise<void> {
  const redis = getRedisClient();
  const stringValue = typeof value === "object" ? JSON.stringify(value) : String(value);

  if (ttlSeconds) {
    await redis.setex(key, ttlSeconds, stringValue);
  } else {
    await redis.set(key, stringValue);
  }

  logger.debug(`Redis SET: ${key}`, { ttl: ttlSeconds });
}

/**
 * Get value by key
 * @param key - Redis key
 * @returns Value or null if not found
 */
export async function getKey(key: string): Promise<string | null> {
  const redis = getRedisClient();
  const value = await redis.get(key);
  logger.debug(`Redis GET: ${key}`, { found: !!value });
  return value;
}

/**
 * Get value and parse as JSON
 * @param key - Redis key
 * @returns Parsed object or null if not found
 */
export async function getKeyAsJSON<T>(key: string): Promise<T | null> {
  const value = await getKey(key);
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    logger.error(`Failed to parse JSON for key: ${key}`, { error });
    return null;
  }
}

/**
 * Delete a key
 * @param key - Redis key
 * @returns Number of keys deleted (0 or 1)
 */
export async function deleteKey(key: string): Promise<number> {
  const redis = getRedisClient();
  const result = await redis.del(key);
  logger.debug(`Redis DEL: ${key}`, { deleted: result });
  return result;
}

/**
 * Delete multiple keys
 * @param keys - Array of Redis keys
 * @returns Number of keys deleted
 */
export async function deleteKeys(keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;

  const redis = getRedisClient();
  const result = await redis.del(...keys);
  logger.debug(`Redis DEL multiple keys`, { count: keys.length, deleted: result });
  return result;
}

/**
 * Check if key exists
 * @param key - Redis key
 * @returns True if key exists
 */
export async function exists(key: string): Promise<boolean> {
  const redis = getRedisClient();
  const result = await redis.exists(key);
  return result === 1;
}

/**
 * Set expiration on a key
 * @param key - Redis key
 * @param ttlSeconds - Time to live in seconds
 * @returns True if expiration was set
 */
export async function setExpiration(key: string, ttlSeconds: number): Promise<boolean> {
  const redis = getRedisClient();
  const result = await redis.expire(key, ttlSeconds);
  return result === 1;
}

/**
 * Get remaining TTL for a key
 * @param key - Redis key
 * @returns TTL in seconds, -1 if no expiration, -2 if key doesn't exist
 */
export async function getTTL(key: string): Promise<number> {
  const redis = getRedisClient();
  return await redis.ttl(key);
}

/**
 * Increment a numeric value
 * @param key - Redis key
 * @param amount - Amount to increment (default: 1)
 * @returns New value after increment
 */
export async function increment(key: string, amount: number = 1): Promise<number> {
  const redis = getRedisClient();
  return await redis.incrby(key, amount);
}

/**
 * Decrement a numeric value
 * @param key - Redis key
 * @param amount - Amount to decrement (default: 1)
 * @returns New value after decrement
 */
export async function decrement(key: string, amount: number = 1): Promise<number> {
  const redis = getRedisClient();
  return await redis.decrby(key, amount);
}

/**
 * Get all keys matching a pattern
 * @param pattern - Redis key pattern (e.g., "user:*")
 * @returns Array of matching keys
 */
export async function getKeysByPattern(pattern: string): Promise<string[]> {
  const redis = getRedisClient();
  return await redis.keys(pattern);
}

/**
 * Set multiple key-value pairs atomically
 * @param keyValuePairs - Object with key-value pairs
 */
export async function setMultiple(keyValuePairs: Record<string, string>): Promise<void> {
  const redis = getRedisClient();
  const args: string[] = [];

  for (const [key, value] of Object.entries(keyValuePairs)) {
    args.push(key, value);
  }

  if (args.length > 0) {
    await redis.mset(args);
    logger.debug(`Redis MSET: ${args.length / 2} keys`);
  }
}

/**
 * Get multiple values by keys
 * @param keys - Array of Redis keys
 * @returns Array of values (null for non-existent keys)
 */
export async function getMultiple(keys: string[]): Promise<(string | null)[]> {
  if (keys.length === 0) return [];

  const redis = getRedisClient();
  return await redis.mget(keys);
}
