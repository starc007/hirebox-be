import winston from "winston";
import { config } from "@config/env";

const logLevel =
  config.logging.level || (config.nodeEnv === "production" ? "info" : "debug");

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: "hirebox-be" },
  transports: [
    new winston.transports.File({
      filename: config.logging.errorLogPath,
      level: "error",
    }),
    new winston.transports.File({ filename: config.logging.combinedLogPath }),
  ],
});

// Add console transport for non-production environments
if (config.nodeEnv !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
          }`;
        })
      ),
    })
  );
}
