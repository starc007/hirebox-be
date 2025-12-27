import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "admin" | "hr" | "viewer";
export type AuthProvider = "email" | "google";

export type UserDocument = Document & {
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  provider: AuthProvider;
  providerId?: string;
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

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: function (this: UserDocument) {
        return this.provider === "email";
      },
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "hr", "viewer"],
      default: "hr",
      required: true,
    },
    provider: {
      type: String,
      enum: ["email", "google"],
      default: "email",
      required: true,
    },
    providerId: {
      type: String,
      sparse: true,
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
userSchema.index({ email: 1, companyId: 1 });
userSchema.index({ providerId: 1, provider: 1 });

export const User = mongoose.model<UserDocument>("User", userSchema);
