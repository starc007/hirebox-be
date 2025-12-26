import { Server } from "http";
import { logger } from "@utils/logger";
import { disconnectDatabase } from "@config/database";
import { disconnectRedis } from "@config/redis";

type ShutdownHandler = () => Promise<void> | void;

const shutdownHandlers: ShutdownHandler[] = [];

export function registerShutdownHandler(handler: ShutdownHandler): void {
  shutdownHandlers.push(handler);
}

export async function gracefulShutdown(
  server: Server,
  signal: string
): Promise<void> {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    logger.info("HTTP server closed");
  });

  // Execute registered shutdown handlers
  for (const handler of shutdownHandlers) {
    try {
      await Promise.resolve(handler());
    } catch (error) {
      logger.error("Error in shutdown handler:", error);
    }
  }

  // Close database connections
  try {
    await disconnectDatabase();
    logger.info("Database disconnected");
  } catch (error) {
    logger.error("Error disconnecting database:", error);
  }

  // Close Redis connections
  try {
    await disconnectRedis();
    logger.info("Redis disconnected");
  } catch (error) {
    logger.error("Error disconnecting Redis:", error);
  }

  logger.info("Graceful shutdown completed");
  process.exit(0);
}

export function setupGracefulShutdown(server: Server): void {
  const signals = ["SIGTERM", "SIGINT"];

  signals.forEach((signal) => {
    process.on(signal, () => {
      gracefulShutdown(server, signal).catch((error) => {
        logger.error("Error during graceful shutdown:", error);
        process.exit(1);
      });
    });
  });

  // Handle uncaught exceptions
  process.on("uncaughtException", (error: Error) => {
    logger.error("Uncaught Exception:", error);
    gracefulShutdown(server, "uncaughtException").catch(() => {
      process.exit(1);
    });
  });

  // Handle unhandled rejections
  process.on("unhandledRejection", (error: Error) => {
    logger.error("Unhandled Rejection:", error);
    gracefulShutdown(server, "unhandledRejection").catch(() => {
      process.exit(1);
    });
  });
}
