import { google } from "googleapis";
import { config } from "@config/env";
import { User } from "@models/User";
import { generateTokens, verifyToken } from "@utils/jwt";
import { sendOtp, verifyOtp } from "@services/otpService";
import type { UserDocument, UserPayload } from "@models/User";
import type {
  CompleteProfileInput,
  SendOtpInput,
  VerifyOtpInput,
  GoogleOAuthTokenInput,
} from "@api/validations/authSchemas";
import { notFound, unauthorized, badRequest } from "@utils/errorUtils";

const oauth2Client = new google.auth.OAuth2(
  config.gmail.clientId,
  config.gmail.clientSecret,
  config.gmail.redirectUri,
);

export function isProfileComplete(user: UserDocument): boolean {
  if (!user.name || user.name.trim() === "") {
    return false;
  }

  if (user.role === "hr") {
    if (!user.hrType) {
      return false;
    }

    if (user.hrType === "company" && !user.companyName) {
      return false;
    }

    if (user.hrType === "agency" && !user.agencyName) {
      return false;
    }

    if (
      user.hrType === "freelance" &&
      (!user.companyNames || user.companyNames.length === 0)
    ) {
      return false;
    }
  }

  return true;
}

export async function completeProfile(
  userId: string,
  input: CompleteProfileInput,
): Promise<Omit<UserDocument, "password">> {
  const user = await User.findById(userId);
  if (!user) {
    throw notFound("User not found");
  }

  // Update user profile
  user.name = input.name;
  user.role = input.role || user.role || "hr";

  // Add HR type specific fields
  if (user.role === "hr" && input.hrType) {
    user.hrType = input.hrType;
    if (input.hrType === "company" && input.companyName) {
      user.companyName = input.companyName;
      user.agencyName = undefined;
      user.companyNames = [];
    } else if (input.hrType === "agency" && input.agencyName) {
      user.agencyName = input.agencyName;
      user.companyName = undefined;
      user.companyNames = [];
    } else if (input.hrType === "freelance" && input.companyNames) {
      user.companyNames = input.companyNames;
      user.companyName = undefined;
      user.agencyName = undefined;
    }
  }

  // Mark profile as complete
  user.isProfileComplete = isProfileComplete(user);
  await user.save();

  // Remove password from response
  const userObj = user.toObject();
  delete userObj.password;

  return userObj;
}

/**
 * Send OTP to user's email for login
 * @param input - Email address
 * @returns Success status and expiry time
 */
export async function sendLoginOtp(input: SendOtpInput): Promise<{
  success: boolean;
  expiresIn: number;
}> {
  return await sendOtp(input.email);
}

/**
 * Verify OTP and login user
 * @param input - Email and OTP
 * @returns User object and JWT tokens
 */
export async function verifyOtpAndLogin(input: VerifyOtpInput): Promise<{
  user: Omit<UserDocument, "password">;
  tokens: { accessToken: string; refreshToken: string };
}> {
  // Verify OTP
  const { email } = await verifyOtp(input.email, input.otp);

  // Find or create user
  let user = await User.findOne({ email });

  if (!user) {
    // Create new user on first login
    user = await User.create({
      email,
      name: "",
      role: "hr",
      provider: "email",
      isEmailVerified: true, // OTP verified means email is verified
      isProfileComplete: false,
    });
  } else {
    // Verify user is using email provider
    if (user.provider !== "email") {
      throw unauthorized("Please use Google OAuth to sign in");
    }

    // Mark email as verified
    user.isEmailVerified = true;
  }

  // Generate tokens
  const payload: UserPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    hrType: user.hrType,
    companyName: user.companyName,
    agencyName: user.agencyName,
    companyNames: user.companyNames,
    isProfileComplete: user.isProfileComplete,
  };

  const tokens = generateTokens(payload);

  // Update last login and recalculate profile completion status
  user.lastLoginAt = new Date();
  user.isProfileComplete = isProfileComplete(user);
  await user.save();

  // Remove password from response
  const userObj = user.toObject();
  delete userObj.password;

  return { user: userObj, tokens };
}

export async function verifyGoogleToken(input: GoogleOAuthTokenInput): Promise<{
  user: Omit<UserDocument, "password">;
  tokens: { accessToken: string; refreshToken: string };
}> {
  try {
    // Set the token from frontend
    oauth2Client.setCredentials({
      access_token: input.token,
    });

    // Verify token and get user info from Google
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const { data: googleUser } = await oauth2.userinfo.get();

    if (!googleUser.email || !googleUser.id) {
      throw badRequest("Failed to get user information from Google");
    }

    // Find or create user
    let user = await User.findOne({
      $or: [
        { email: googleUser.email },
        { providerId: googleUser.id, provider: "google" },
      ],
    });

    if (user) {
      // Update existing user
      user.provider = "google";
      user.providerId = googleUser.id;
      // Only update name if it's empty (not overwriting user's completed profile)
      if (!user.name || user.name.trim() === "") {
        user.name = googleUser.name || "";
      }
      user.isEmailVerified = true;
      user.lastLoginAt = new Date();
      user.isProfileComplete = isProfileComplete(user);
      await user.save();
    } else {
      // Create new user with minimal info (profile will be completed later)
      user = await User.create({
        email: googleUser.email,
        name: googleUser.name || "",
        provider: "google",
        providerId: googleUser.id || undefined,
        role: "hr",
        isEmailVerified: true,
        isProfileComplete: false,
        lastLoginAt: new Date(),
      });
    }

    // Generate tokens
    const payload: UserPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      hrType: user.hrType,
      companyName: user.companyName,
      agencyName: user.agencyName,
      companyNames: user.companyNames,
      isProfileComplete: user.isProfileComplete,
    };

    const tokens = generateTokens(payload);

    // Remove password from response
    const userObj = user.toObject();
    delete userObj.password;

    return { user: userObj, tokens };
  } catch (error) {
    if (error instanceof Error) {
      throw badRequest(`Google OAuth error: ${error.message}`);
    }
    throw badRequest("Failed to authenticate with Google");
  }
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  try {
    const payload = verifyToken(refreshToken);

    // Verify user still exists
    const user = await User.findById(payload.userId);
    if (!user) {
      throw notFound("User not found");
    }

    // Generate new tokens with fresh user data (token rotation)
    const newPayload: UserPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      hrType: user.hrType,
      companyName: user.companyName,
      agencyName: user.agencyName,
      companyNames: user.companyNames,
      isProfileComplete: user.isProfileComplete,
    };

    const tokens = generateTokens(newPayload);

    return tokens;
  } catch (error) {
    throw unauthorized("Invalid refresh token");
  }
}

export async function getUserById(userId: string): Promise<UserDocument> {
  const user = await User.findById(userId);
  if (!user) {
    throw notFound("User not found");
  }
  return user;
}
