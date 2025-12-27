import { Router } from "express";
import {
  register,
  login,
  googleOAuth,
  googleOAuthCallback,
  refreshToken,
  getMe,
} from "@api/controllers/authController";
import { validate } from "@api/middleware/validate";
import {
  registerSchema,
  loginSchema,
  googleOAuthCallbackSchema,
  refreshTokenSchema,
} from "@api/validations/authSchemas";
import { authenticate } from "@api/middleware/auth";
import { asyncHandler } from "@utils/asyncHandler";
import { rateLimiters } from "@api/middleware/rateLimiter";

const router = Router();

// Public routes
router.post(
  "/register",
  rateLimiters.standard,
  validate(registerSchema),
  asyncHandler(register)
);

router.post(
  "/login",
  rateLimiters.strict,
  validate(loginSchema),
  asyncHandler(login)
);

router.get("/google", rateLimiters.standard, asyncHandler(googleOAuth));

router.get(
  "/google/callback",
  rateLimiters.standard,
  validate(googleOAuthCallbackSchema),
  asyncHandler(googleOAuthCallback)
);

router.post(
  "/refresh",
  rateLimiters.standard,
  validate(refreshTokenSchema),
  asyncHandler(refreshToken)
);

// Protected routes
router.get("/me", authenticate, asyncHandler(getMe));

export default router;
