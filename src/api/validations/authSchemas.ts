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
    }
  );

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
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

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
  }),
});

export type CompleteProfileInput = z.infer<
  typeof completeProfileSchema
>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
export type GoogleOAuthTokenInput = z.infer<
  typeof googleOAuthTokenSchema
>["body"];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>["body"];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>["body"];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>["body"];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>["body"];
