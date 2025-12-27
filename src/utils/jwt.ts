import jwt from "jsonwebtoken";
import { config } from "@config/env";
import type { UserPayload } from "@models/User";

export function generateTokens(payload: UserPayload): {
  accessToken: string;
  refreshToken: string;
} {
  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
}

export function verifyToken(token: string): UserPayload {
  try {
    return jwt.verify(token, config.jwt.secret) as UserPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

export function decodeToken(token: string): UserPayload | null {
  try {
    return jwt.decode(token) as UserPayload;
  } catch {
    return null;
  }
}
