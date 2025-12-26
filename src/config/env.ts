import dotenv from "dotenv";

dotenv.config();

type EnvConfig = {
  nodeEnv: string;
  port: number;
  apiVersion: string;
  frontendUrl: string;
  mongodb: {
    uri: string;
    maxPoolSize: number;
    serverSelectionTimeoutMS: number;
    socketTimeoutMS: number;
  };
  redis: {
    host: string;
    port: number;
    password: string | undefined;
    maxRetriesPerRequest: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  gmail: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  r2: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    endpoint: string;
    publicUrl: string;
  };
  ai: {
    apiKey: string;
    serviceUrl: string;
  };
  email: {
    fromEmail: string;
    fromName: string;
  };
  logging: {
    level: string;
    errorLogPath: string;
    combinedLogPath: string;
  };
};

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value || defaultValue || "";
}

export const config: EnvConfig = {
  nodeEnv: getEnvVar("NODE_ENV", "development"),
  port: parseInt(getEnvVar("PORT", "3000"), 10),
  apiVersion: getEnvVar("API_VERSION", "v1"),
  frontendUrl: getEnvVar("FRONTEND_URL", "http://localhost:3001"),
  mongodb: {
    uri: getEnvVar("MONGODB_URI", "mongodb://localhost:27017/hirebox"),
    maxPoolSize: parseInt(getEnvVar("MONGODB_MAX_POOL_SIZE", "50"), 10),
    serverSelectionTimeoutMS: parseInt(
      getEnvVar("MONGODB_SERVER_SELECTION_TIMEOUT_MS", "5000"),
      10
    ),
    socketTimeoutMS: parseInt(
      getEnvVar("MONGODB_SOCKET_TIMEOUT_MS", "45000"),
      10
    ),
  },
  redis: {
    host: getEnvVar("REDIS_HOST", "localhost"),
    port: parseInt(getEnvVar("REDIS_PORT", "6379"), 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: parseInt(
      getEnvVar("REDIS_MAX_RETRIES_PER_REQUEST", "3"),
      10
    ),
  },
  jwt: {
    secret: getEnvVar("JWT_SECRET"),
    expiresIn: getEnvVar("JWT_EXPIRES_IN", "7d"),
  },
  gmail: {
    clientId: getEnvVar("GMAIL_CLIENT_ID"),
    clientSecret: getEnvVar("GMAIL_CLIENT_SECRET"),
    redirectUri: getEnvVar("GMAIL_REDIRECT_URI"),
  },
  r2: {
    accountId: getEnvVar("R2_ACCOUNT_ID"),
    accessKeyId: getEnvVar("R2_ACCESS_KEY_ID"),
    secretAccessKey: getEnvVar("R2_SECRET_ACCESS_KEY"),
    bucketName: getEnvVar("R2_BUCKET_NAME"),
    endpoint: getEnvVar("R2_ENDPOINT"),
    publicUrl: getEnvVar("R2_PUBLIC_URL"),
  },
  ai: {
    apiKey: getEnvVar("AI_API_KEY", ""),
    serviceUrl: getEnvVar("AI_SERVICE_URL", ""),
  },
  email: {
    fromEmail: getEnvVar("FROM_EMAIL", "noreply@hirebox.com"),
    fromName: getEnvVar("FROM_NAME", "Hirebox"),
  },
  logging: {
    level: getEnvVar("LOG_LEVEL", ""),
    errorLogPath: getEnvVar("LOG_ERROR_PATH", "logs/error.log"),
    combinedLogPath: getEnvVar("LOG_COMBINED_PATH", "logs/combined.log"),
  },
};
