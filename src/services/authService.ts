import bcrypt from "bcryptjs";
import { google } from "googleapis";
import { config } from "@config/env";
import { User } from "@models/User";
import { generateTokens } from "@utils/jwt";
import type { UserDocument, UserPayload } from "@models/User";
import type {
  RegisterInput,
  LoginInput,
  GoogleOAuthCallbackInput,
} from "@api/validations/authSchemas";
import { notFound, unauthorized, badRequest } from "@utils/errorUtils";

const oauth2Client = new google.auth.OAuth2(
  config.gmail.clientId,
  config.gmail.clientSecret,
  config.gmail.redirectUri
);

export async function registerUser(input: RegisterInput): Promise<{
  user: Omit<UserDocument, "password">;
  tokens: { accessToken: string; refreshToken: string };
}> {
  // Check if user already exists
  const existingUser = await User.findOne({ email: input.email });
  if (existingUser) {
    throw badRequest("User with this email already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(input.password, 12);

  // Create user
  const user = await User.create({
    email: input.email,
    password: hashedPassword,
    name: input.name,
    companyId: input.companyId,
    role: input.role || "hr",
    provider: "email",
    isEmailVerified: false,
  });

  // Generate tokens
  const payload: UserPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  };

  const tokens = generateTokens(payload);

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  // Remove password from response
  const userObj = user.toObject();
  delete userObj.password;

  return { user: userObj, tokens };
}

export async function loginUser(input: LoginInput): Promise<{
  user: Omit<UserDocument, "password">;
  tokens: { accessToken: string; refreshToken: string };
}> {
  // Find user with password
  const user = await User.findOne({ email: input.email }).select("+password");
  if (!user) {
    throw unauthorized("Invalid email or password");
  }

  // Check if user uses email provider
  if (user.provider !== "email" || !user.password) {
    throw unauthorized("Please use Google OAuth to sign in");
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(input.password, user.password);
  if (!isPasswordValid) {
    throw unauthorized("Invalid email or password");
  }

  // Generate tokens
  const payload: UserPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  };

  const tokens = generateTokens(payload);

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  // Remove password from response
  const userObj = user.toObject();
  delete userObj.password;

  return { user: userObj, tokens };
}

export function getGoogleOAuthUrl(state?: string): string {
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/gmail.readonly",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state: state || "",
    prompt: "consent",
  });
}

export async function handleGoogleOAuthCallback(
  input: GoogleOAuthCallbackInput
): Promise<{
  user: Omit<UserDocument, "password">;
  tokens: { accessToken: string; refreshToken: string };
}> {
  try {
    // Exchange code for tokens
    const { tokens: oauthTokens } = await oauth2Client.getToken(input.code);
    oauth2Client.setCredentials(oauthTokens);

    // Get user info from Google
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
      user.name = googleUser.name || user.name;
      user.avatar = googleUser.picture || user.avatar;
      user.isEmailVerified = true;
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      // Create new user - need companyId from state or default
      // For now, we'll require companyId in state or use a default
      // In production, you might want to handle this differently
      const companyId = input.state || "default-company";

      user = await User.create({
        email: googleUser.email,
        name: googleUser.name || "User",
        provider: "google",
        providerId: googleUser.id || undefined,
        companyId,
        role: "hr",
        isEmailVerified: true,
        avatar: googleUser.picture || undefined,
        lastLoginAt: new Date(),
      });
    }

    // Generate tokens
    const payload: UserPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      companyId: user.companyId,
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
  refreshToken: string
): Promise<{ accessToken: string }> {
  try {
    const { verifyToken } = await import("@utils/jwt");
    const payload = verifyToken(refreshToken);

    // Verify user still exists
    const user = await User.findById(payload.userId);
    if (!user) {
      throw notFound("User not found");
    }

    // Generate new access token
    const newPayload: UserPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    const accessToken = generateTokens(newPayload).accessToken;

    return { accessToken };
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
