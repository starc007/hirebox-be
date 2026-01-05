import { Request, Response } from "express";
import {
  connectGmailAccount,
  disconnectGmailAccount,
  setPrimaryGmailAccount,
  getUserGmailAccounts,
} from "@services/gmailAccountService";
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
} from "@services/responseService";
import type { AuthenticatedRequest } from "@api/middleware/auth";

export async function connectGmail(
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  const { body } = req;
  const account = await connectGmailAccount(req.user!.userId, body);
  return sendCreated(res, { account }, "Gmail account connected successfully");
}

export async function disconnectGmail(
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  const { accountId } = req.params;
  await disconnectGmailAccount(req.user!.userId, accountId);
  return sendNoContent(res);
}

export async function setPrimaryGmail(
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  const { accountId } = req.params;
  const account = await setPrimaryGmailAccount(req.user!.userId, accountId);
  return sendSuccess(res, { account }, "Primary Gmail account updated");
}

export async function getGmailAccounts(
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  const accounts = await getUserGmailAccounts(req.user!.userId);
  return sendSuccess(
    res,
    { accounts },
    "Gmail accounts retrieved successfully"
  );
}
