import crypto from "crypto";
import {
  setKey,
  getKeyAsJSON,
  deleteKey,
  increment,
  setExpiration,
} from "@services/redisService";
import { sendOtpEmail } from "@services/emailService";
import { logger } from "@utils/logger";
import { badRequest, tooManyRequests } from "@utils/errorUtils";

const OTP_EXPIRY_SECONDS = 10 * 60; // 10 minutes
const OTP_LENGTH = 6;
const MAX_VERIFICATION_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60; // 1 minute between resends
const MAX_RESENDS_PER_HOUR = 5;

type OtpData = {
  otp: string;
  email: string;
  attempts: number;
  createdAt: number;
};

/**
 * Generate Redis keys for OTP operations
 */
function getOtpKey(email: string): string {
  return `otp:${email.toLowerCase()}`;
}

function getResendCountKey(email: string): string {
  return `otp:resend:${email.toLowerCase()}`;
}

function getResendCooldownKey(email: string): string {
  return `otp:cooldown:${email.toLowerCase()}`;
}

/**
 * Generate a secure random OTP
 */
function generateOtp(): string {
  // Generate cryptographically secure random number
  const randomNumber = crypto.randomInt(0, 10 ** OTP_LENGTH);
  return randomNumber.toString().padStart(OTP_LENGTH, "0");
}

/**
 * Send OTP to user's email
 * @param email - User's email address
 * @returns Success status
 */
export async function sendOtp(
  email: string
): Promise<{ success: boolean; expiresIn: number }> {
  const normalizedEmail = email.toLowerCase().trim();

  // Generate OTP
  const otp = generateOtp();

  // Store OTP in Redis
  const otpData: OtpData = {
    otp,
    email: normalizedEmail,
    attempts: 0,
    createdAt: Date.now(),
  };

  const otpKey = getOtpKey(normalizedEmail);
  await setKey(otpKey, otpData, OTP_EXPIRY_SECONDS);

  // Send OTP email
  try {
    await sendOtpEmail(normalizedEmail, otp);
    logger.info(`OTP sent to ${normalizedEmail}`);
  } catch (error) {
    // Delete OTP if email fails
    await deleteKey(otpKey);
    throw error;
  }

  return {
    success: true,
    expiresIn: OTP_EXPIRY_SECONDS,
  };
}

/**
 * Verify OTP provided by user
 * @param email - User's email address
 * @param otp - OTP to verify
 * @returns Success status
 */
export async function verifyOtp(
  email: string,
  otp: string
): Promise<{ success: boolean; email: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const otpKey = getOtpKey(normalizedEmail);

  // Get OTP data from Redis
  const otpData = await getKeyAsJSON<OtpData>(otpKey);

  if (!otpData) {
    throw badRequest("OTP expired or not found. Please request a new one");
  }

  // Check max attempts
  if (otpData.attempts >= MAX_VERIFICATION_ATTEMPTS) {
    await deleteKey(otpKey);
    throw badRequest(
      "Maximum verification attempts exceeded. Please request a new OTP"
    );
  }

  // Increment attempts
  otpData.attempts += 1;
  await setKey(otpKey, otpData, OTP_EXPIRY_SECONDS);

  // Verify OTP
  if (otpData.otp !== otp.trim()) {
    const attemptsLeft = MAX_VERIFICATION_ATTEMPTS - otpData.attempts;
    throw badRequest(
      `Invalid OTP. ${attemptsLeft} attempt${
        attemptsLeft !== 1 ? "s" : ""
      } remaining`
    );
  }

  // OTP verified successfully - delete it
  await deleteKey(otpKey);

  // Also clear cooldown to allow immediate new OTP if needed
  await deleteKey(getResendCooldownKey(normalizedEmail));

  logger.info(`OTP verified successfully for ${normalizedEmail}`);

  return {
    success: true,
    email: normalizedEmail,
  };
}

/**
 * Delete OTP for a given email (cleanup)
 * @param email - User's email address
 */
export async function deleteOtp(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const otpKey = getOtpKey(normalizedEmail);
  await deleteKey(otpKey);
  logger.debug(`OTP deleted for ${normalizedEmail}`);
}

/**
 * Check if OTP exists for an email
 * @param email - User's email address
 * @returns True if OTP exists and is valid
 */
export async function otpExists(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  const otpKey = getOtpKey(normalizedEmail);
  const otpData = await getKeyAsJSON<OtpData>(otpKey);
  return otpData !== null;
}
