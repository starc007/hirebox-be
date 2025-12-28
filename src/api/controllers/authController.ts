import { Request, Response } from "express";
import {
  completeProfile,
  loginUser,
  verifyGoogleToken,
  refreshAccessToken,
  getUserById,
} from "@services/authService";
import { sendSuccess } from "@services/responseService";
import type { AuthenticatedRequest } from "@api/middleware/auth";

export async function completeUserProfile(
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  const { body } = req;
  const user = await completeProfile(req.user!.userId, body);
  return sendSuccess(res, { user }, "Profile completed successfully");
}

export async function login(req: Request, res: Response): Promise<Response> {
  const { body } = req;
  const { user, tokens } = await loginUser(body);
  return sendSuccess(res, { user, ...tokens }, "Login successful");
}

export async function googleOAuth(
  req: Request,
  res: Response
): Promise<Response> {
  const { token } = req.body;
  const { user, tokens } = await verifyGoogleToken({ token });
  return sendSuccess(res, { user, ...tokens }, "Google OAuth successful");
}

export async function refreshToken(
  req: Request,
  res: Response
): Promise<Response> {
  const { refreshToken } = req.body;
  const { accessToken } = await refreshAccessToken(refreshToken);
  return sendSuccess(res, { accessToken }, "Token refreshed successfully");
}

export async function getMe(
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  const user = await getUserById(req.user!.userId);
  const userObj = user.toObject();
  delete userObj.password;
  return sendSuccess(res, { user: userObj }, "User retrieved successfully");
}
