import mongoose, { Schema, Document } from "mongoose";

export type GmailAccountStatus = "active" | "inactive" | "error";

export type GmailAccountDocument = Document & {
  userId: mongoose.Types.ObjectId;
  email: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  providerId: string; // Google user ID
  status: GmailAccountStatus;
  lastSyncedAt?: Date;
  errorMessage?: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const gmailAccountSchema = new Schema<GmailAccountDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    accessToken: {
      type: String,
      required: true,
      select: false, // Don't return by default
    },
    refreshToken: {
      type: String,
      select: false,
    },
    tokenExpiry: {
      type: Date,
    },
    providerId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "error"],
      default: "active",
      required: true,
    },
    lastSyncedAt: {
      type: Date,
    },
    errorMessage: {
      type: String,
    },
    isPrimary: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
gmailAccountSchema.index({ userId: 1, email: 1 }, { unique: true });
gmailAccountSchema.index({ userId: 1, status: 1 });
gmailAccountSchema.index({ userId: 1, isPrimary: 1 });

export const GmailAccount = mongoose.model<GmailAccountDocument>(
  "GmailAccount",
  gmailAccountSchema
);
