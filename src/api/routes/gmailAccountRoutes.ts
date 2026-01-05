import { Router } from "express";
import {
  connectGmail,
  disconnectGmail,
  setPrimaryGmail,
  getGmailAccounts,
} from "@api/controllers/gmailAccountController";
import { validate } from "@api/middleware/validate";
import {
  connectGmailSchema,
  disconnectGmailSchema,
  setPrimaryGmailSchema,
} from "@api/validations/gmailSchemas";
import { authenticate } from "@api/middleware/auth";
import { asyncHandler } from "@utils/asyncHandler";
import { rateLimiters } from "@api/middleware/rateLimiter";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Gmail account management routes
router.post(
  "/connect",
  rateLimiters.standard,
  validate(connectGmailSchema),
  asyncHandler(connectGmail)
);

router.get("/", rateLimiters.standard, asyncHandler(getGmailAccounts));

router.patch(
  "/:accountId/primary",
  rateLimiters.standard,
  validate(setPrimaryGmailSchema),
  asyncHandler(setPrimaryGmail)
);

router.delete(
  "/:accountId",
  rateLimiters.standard,
  validate(disconnectGmailSchema),
  asyncHandler(disconnectGmail)
);

export default router;
