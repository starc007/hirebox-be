import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import hpp from "hpp";
import { connectDatabase } from "@config/database";
import { connectRedis } from "@config/redis";
import { config } from "@config/env";
import { logger } from "@utils/logger";
import { errorHandler } from "@api/middleware/errorHandler";
import { notFoundHandler } from "@api/middleware/notFoundHandler";

const app = express();

// Security middleware
app.use(helmet());
app.use(hpp());

// CORS configuration
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression middleware
app.use(compression());

// Health check endpoint
app.get("/health", (req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  });
});

// API routes will be added here
// app.use('/api/v1', apiRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database and Redis connections
async function startServer() {
  try {
    await connectDatabase();
    logger.info("Database connected successfully");

    await connectRedis();
    logger.info("Redis connected successfully");

    const server = app.listen(config.port, () => {
      logger.info(
        `Server running on port ${config.port} in ${config.nodeEnv} mode`
      );
    });

    // Optimize for high performance
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  logger.error("Unhandled Promise Rejection:", err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err: Error) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

startServer();
