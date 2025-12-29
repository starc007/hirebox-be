import expressWinston from "express-winston";
import winston from "winston";

const RequestLogger = expressWinston.logger({
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.colorize(),
    winston.format.json()
  ),
  statusLevels: true,
  meta: false,
  msg: "HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms {{req.ip}}",
  expressFormat: true,
  ignoreRoute() {
    return false;
  },
});

export { RequestLogger };
