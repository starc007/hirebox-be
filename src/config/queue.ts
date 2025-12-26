import { Queue, Worker, QueueOptions, WorkerOptions } from "bullmq";
import { getRedisClient } from "@config/redis";
import { logger } from "@utils/logger";
import { config } from "@config/env";

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
};

export function createQueue<T = unknown>(
  name: string,
  options?: Partial<QueueOptions>
): Queue<T> {
  const queue = new Queue<T>(name, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: {
        age: 24 * 3600, // Keep completed jobs for 24 hours
        count: 1000, // Keep max 1000 completed jobs
      },
      removeOnFail: {
        age: 7 * 24 * 3600, // Keep failed jobs for 7 days
      },
    },
    ...options,
  });

  queue.on("error", (error) => {
    logger.error(`Queue ${name} error:`, error);
  });

  return queue;
}

export function createWorker<T = unknown>(
  name: string,
  processor: (job: { data: T }) => Promise<unknown>,
  options?: Partial<WorkerOptions>
): Worker<T> {
  const worker = new Worker<T>(
    name,
    async (job) => {
      logger.info(`Processing job ${job.id} in queue ${name}`);
      return await processor(job);
    },
    {
      connection,
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 1000,
      },
      ...options,
    }
  );

  worker.on("completed", (job) => {
    logger.info(`Job ${job.id} completed in queue ${name}`);
  });

  worker.on("failed", (job, error) => {
    logger.error(`Job ${job?.id} failed in queue ${name}:`, error);
  });

  worker.on("error", (error) => {
    logger.error(`Worker ${name} error:`, error);
  });

  return worker;
}

// Queue names
export const QUEUE_NAMES = {
  EMAIL_PROCESSING: "email-processing",
  RESUME_EXTRACTION: "resume-extraction",
  AI_CLASSIFICATION: "ai-classification",
  EMAIL_SENDING: "email-sending",
} as const;
