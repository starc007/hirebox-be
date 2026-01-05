import { google } from "googleapis";
import { config } from "@config/env";
import { GmailAccount } from "@models/GmailAccount";
import { User } from "@models/User";
import { canAddGmailAccount, getPlanConfig } from "@config/plans";
import type { GmailAccountDocument } from "@models/GmailAccount";
import type { ConnectGmailInput } from "@api/validations/gmailSchemas";
import { badRequest, notFound, forbidden } from "@utils/errorUtils";

type GmailAccountResponse = Omit<
  GmailAccountDocument,
  | "accessToken"
  | "refreshToken"
  | "save"
  | "$save"
  | "remove"
  | "$remove"
  | "deleteOne"
  | "$deleteOne"
  | "updateOne"
  | "$updateOne"
  | "replaceOne"
  | "$replaceOne"
  | "increment"
  | "$increment"
  | "validate"
  | "$validate"
  | "markModified"
  | "$markModified"
  | "isModified"
  | "$isModified"
  | "isDirectModified"
  | "$isDirectModified"
  | "isInit"
  | "$isInit"
  | "isNew"
  | "$isNew"
  | "isSelected"
  | "$isSelected"
  | "isDirectSelected"
  | "$isDirectSelected"
  | "get"
  | "$get"
  | "set"
  | "$set"
  | "unset"
  | "$unset"
  | "increment"
  | "$increment"
  | "decrement"
  | "$decrement"
  | "populate"
  | "$populate"
  | "pop"
  | "$pop"
  | "push"
  | "$push"
  | "addToSet"
  | "$addToSet"
  | "pull"
  | "$pull"
  | "pullAll"
  | "$pullAll"
  | "toObject"
  | "toJSON"
  | "toString"
  | "equals"
  | "$equals"
  | "$__"
  | "$locals"
  | "$op"
  | "$where"
  | "$assertPopulated"
  | "$clearModifiedPaths"
  | "$clone"
  | "$getAllSubdocs"
  | "$ignore"
  | "$isDefault"
  | "$parent"
  | "$session"
  | "$transaction"
  | "$validateSync"
  | "collection"
  | "db"
  | "modelName"
  | "schema"
>;

const oauth2Client = new google.auth.OAuth2(
  config.gmail.clientId,
  config.gmail.clientSecret,
  config.gmail.redirectUri
);

export async function connectGmailAccount(
  userId: string,
  input: ConnectGmailInput
): Promise<GmailAccountResponse> {
  // Get user with plan info
  const user = await User.findById(userId);
  if (!user) {
    throw notFound("User not found");
  }

  // Check current Gmail account count
  const currentAccounts = await GmailAccount.countDocuments({
    userId: user._id,
    status: { $ne: "inactive" },
  });

  // Check if user can add more accounts based on plan
  if (!canAddGmailAccount(user.planType, currentAccounts)) {
    const plan = getPlanConfig(user.planType);
    throw forbidden(
      `You have reached the maximum limit of ${plan.maxGmailAccounts} Gmail account(s) for your ${plan.name} plan`
    );
  }

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

    // Verify the email matches if provided
    if (
      input.email &&
      input.email.toLowerCase() !== googleUser.email.toLowerCase()
    ) {
      throw badRequest("Token email does not match provided email");
    }

    // Check if account already exists
    const existingAccount = await GmailAccount.findOne({
      userId: user._id,
      email: googleUser.email.toLowerCase(),
    });

    if (existingAccount) {
      // Update existing account
      existingAccount.accessToken = input.token;
      existingAccount.providerId = googleUser.id;
      existingAccount.status = "active";
      existingAccount.errorMessage = undefined;

      if (input.isPrimary) {
        // Unset other primary accounts
        await GmailAccount.updateMany(
          { userId: user._id, _id: { $ne: existingAccount._id } },
          { $set: { isPrimary: false } }
        );
        existingAccount.isPrimary = true;
      }

      await existingAccount.save();

      const accountObj = existingAccount.toObject() as unknown as Record<
        string,
        unknown
      >;
      const { accessToken, refreshToken, ...accountWithoutTokens } = accountObj;
      return accountWithoutTokens as GmailAccountResponse;
    }

    // If setting as primary, unset other primary accounts
    if (input.isPrimary) {
      await GmailAccount.updateMany(
        { userId: user._id },
        { $set: { isPrimary: false } }
      );
    }

    // Create new Gmail account
    const gmailAccount = await GmailAccount.create({
      userId: user._id,
      email: googleUser.email.toLowerCase(),
      accessToken: input.token,
      providerId: googleUser.id,
      status: "active",
      isPrimary: input.isPrimary || currentAccounts === 0, // First account is primary by default
    });

    const accountObj = gmailAccount.toObject() as unknown as Record<
      string,
      unknown
    >;
    const { accessToken, refreshToken, ...accountWithoutTokens } = accountObj;
    return accountWithoutTokens as GmailAccountResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw badRequest(`Failed to connect Gmail account: ${error.message}`);
    }
    throw badRequest("Failed to connect Gmail account");
  }
}

export async function disconnectGmailAccount(
  userId: string,
  accountId: string
): Promise<void> {
  const account = await GmailAccount.findOne({
    _id: accountId,
    userId,
  });

  if (!account) {
    throw notFound("Gmail account not found");
  }

  // Mark as inactive instead of deleting (for audit trail)
  account.status = "inactive";
  await account.save();
}

export async function setPrimaryGmailAccount(
  userId: string,
  accountId: string
): Promise<GmailAccountResponse> {
  const account = await GmailAccount.findOne({
    _id: accountId,
    userId,
    status: "active",
  });

  if (!account) {
    throw notFound("Gmail account not found or inactive");
  }

  // Unset other primary accounts
  await GmailAccount.updateMany(
    { userId, _id: { $ne: account._id } },
    { $set: { isPrimary: false } }
  );

  // Set this account as primary
  account.isPrimary = true;
  await account.save();

  const accountObj = account.toObject() as unknown as Record<string, unknown>;
  const { accessToken, refreshToken, ...accountWithoutTokens } = accountObj;
  return accountWithoutTokens as GmailAccountResponse;
}

export async function getUserGmailAccounts(
  userId: string
): Promise<GmailAccountResponse[]> {
  const accounts = await GmailAccount.find({
    userId,
    status: { $ne: "inactive" },
  })
    .select("-accessToken -refreshToken")
    .sort({ isPrimary: -1, createdAt: -1 })
    .lean();

  return accounts as Omit<
    GmailAccountDocument,
    "accessToken" | "refreshToken"
  >[];
}

export async function getGmailAccountById(
  userId: string,
  accountId: string
): Promise<GmailAccountDocument> {
  const account = await GmailAccount.findOne({
    _id: accountId,
    userId,
  }).select("+accessToken +refreshToken");

  if (!account) {
    throw notFound("Gmail account not found");
  }

  return account;
}

export async function getGmailAccountCount(userId: string): Promise<number> {
  return GmailAccount.countDocuments({
    userId,
    status: { $ne: "inactive" },
  });
}
