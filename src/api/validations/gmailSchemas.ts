import { z } from "zod";

export const connectGmailSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Google OAuth token is required"),
    email: z.string().email("Invalid email address").optional(),
    isPrimary: z.boolean().optional().default(false),
  }),
});

export const disconnectGmailSchema = z.object({
  params: z.object({
    accountId: z.string().min(1, "Gmail account ID is required"),
  }),
});

export const setPrimaryGmailSchema = z.object({
  params: z.object({
    accountId: z.string().min(1, "Gmail account ID is required"),
  }),
});

export type ConnectGmailInput = z.infer<typeof connectGmailSchema>["body"];
export type DisconnectGmailInput = z.infer<
  typeof disconnectGmailSchema
>["params"];
export type SetPrimaryGmailInput = z.infer<
  typeof setPrimaryGmailSchema
>["params"];
