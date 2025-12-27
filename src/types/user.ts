import type { Document } from "mongoose";

export type UserRole = "admin" | "hr" | "viewer";

export type AuthProvider = "email" | "google";

export type UserDocument = Document & {
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  provider: AuthProvider;
  providerId?: string; // Google ID or other provider ID
  companyId: string;
  isEmailVerified: boolean;
  avatar?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type UserPayload = {
  userId: string;
  email: string;
  role: UserRole;
  companyId: string;
};
