import { Router } from "express";
import {
  completeUserProfile,
  login,
  googleOAuth,
  refreshToken,
  getMe,
} from "@api/controllers/authController";
import { validate } from "@api/middleware/validate";
import {
  completeProfileSchema,
  loginSchema,
  googleOAuthTokenSchema,
  refreshTokenSchema,
} from "@api/validations/authSchemas";
import { authenticate } from "@api/middleware/auth";
import { asyncHandler } from "@utils/asyncHandler";
import { rateLimiters } from "@api/middleware/rateLimiter";

const router = Router();

// Public routes
router.post(
  "/login",
  rateLimiters.strict,
  validate(loginSchema),
  asyncHandler(login)
);

router.post(
  "/google",
  rateLimiters.standard,
  validate(googleOAuthTokenSchema),
  asyncHandler(googleOAuth)
);

router.post(
  "/refresh",
  rateLimiters.standard,
  validate(refreshTokenSchema),
  asyncHandler(refreshToken)
);

// Protected routes
router.post(
  "/complete-profile",
  authenticate,
  validate(completeProfileSchema),
  asyncHandler(completeUserProfile)
);

router.get("/me", authenticate, asyncHandler(getMe));

export default router;
