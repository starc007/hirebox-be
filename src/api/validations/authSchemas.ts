import { z } from "zod";

// Profile completion schema (for authenticated users)
export const completeProfileSchema = z
  .object({
    body: z.object({
      name: z.string().min(2, "Name must be at least 2 characters").max(100),
      role: z.enum(["admin", "hr", "viewer"]).optional().default("hr"),
      hrType: z.enum(["company", "agency", "freelance"]).optional(),
      companyName: z
        .string()
        .min(1, "Company name is required")
        .max(200)
        .optional(),
      agencyName: z
        .string()
        .min(1, "Agency name is required")
        .max(200)
        .optional(),
      companyNames: z.array(z.string().min(1).max(200)).optional(),
    }),
  })
  .refine(
    (data) => {
      const { role, hrType, companyName, agencyName, companyNames } = data.body;

      // For non-HR roles, no hrType validation needed
      if (role !== "hr") {
        return true;
      }

      // For HR role, hrType is required
      if (!hrType) {
        return false;
      }

      // Company HR must have companyName
      if (hrType === "company" && !companyName) {
        return false;
      }

      // Agency HR must have agencyName
      if (hrType === "agency" && !agencyName) {
        return false;
      }

      // Freelance HR must have at least one companyName in companyNames array
      if (
        hrType === "freelance" &&
        (!companyNames || companyNames.length === 0)
      ) {
        return false;
      }

      return true;
    },
    {
      message:
        "Invalid HR type configuration. Company HR requires companyName, Agency HR requires agencyName, Freelance HR requires companyNames array",
      path: ["body"],
    },
  );

// OTP request schema
export const sendOtpSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
});

// OTP verification schema
export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    otp: z
      .string()
      .length(6, "OTP must be 6 digits")
      .regex(/^\d{6}$/, "OTP must contain only digits"),
  }),
});

export const googleOAuthTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Google OAuth token is required"),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

export type CompleteProfileInput = z.infer<
  typeof completeProfileSchema
>["body"];
export type SendOtpInput = z.infer<typeof sendOtpSchema>["body"];
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>["body"];
export type GoogleOAuthTokenInput = z.infer<
  typeof googleOAuthTokenSchema
>["body"];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>["body"];
