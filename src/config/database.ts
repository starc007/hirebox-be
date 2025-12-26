import mongoose from "mongoose";
import { logger } from "@utils/logger";
import { config } from "@config/env";

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri, {
      maxPoolSize: config.mongodb.maxPoolSize,
      serverSelectionTimeoutMS: config.mongodb.serverSelectionTimeoutMS,
      socketTimeoutMS: config.mongodb.socketTimeoutMS,
    });

    const connection = mongoose.connection;

    connection.on("error", (err: Error) => {
      logger.error("MongoDB connection error:", err);
    });

    connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
    });
  } catch (error) {
    logger.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info("MongoDB disconnected");
  } catch (error) {
    logger.error("Error disconnecting from MongoDB:", error);
    throw error;
  }
}
