import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "admin" | "hr" | "viewer";
export type AuthProvider = "email" | "google";
export type HrType = "company" | "agency" | "freelance";

export type UserDocument = Document & {
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  provider: AuthProvider;
  providerId?: string;
  // HR type specific fields
  hrType?: HrType; // Only for role === "hr"
  companyName?: string; // For company HR
  agencyName?: string; // For agency HR
  companyNames?: string[]; // For freelance HR (can work with multiple companies)
  isEmailVerified: boolean;
  isProfileComplete: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type UserPayload = {
  userId: string;
  email: string;
  role: UserRole;
  hrType?: HrType;
  companyName?: string;
  agencyName?: string;
  companyNames?: string[];
  isProfileComplete?: boolean;
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
    name: {
      type: String,
      required: false, // Will be set during profile completion
      trim: true,
      default: "",
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
    hrType: {
      type: String,
      enum: ["company", "agency", "freelance"],
      required: false, // Will be set during profile completion
    },
    companyName: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },
    agencyName: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },
    companyNames: {
      type: [String],
      default: [],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
      index: true,
    },

    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for performance
userSchema.index({ email: 1, companyName: 1 });
userSchema.index({ email: 1, agencyName: 1 });
userSchema.index({ providerId: 1, provider: 1 });
userSchema.index({ role: 1, hrType: 1 });
userSchema.index({ companyNames: 1 }); // For freelance HR queries

export const User = mongoose.model<UserDocument>("User", userSchema);
