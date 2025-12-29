import { config } from "@/config/env";
import { SendMailClient } from "zeptomail";
import { logger } from "@/utils/logger";
import { internalError } from "@/utils/errorUtils";

const url = "https://api.zeptomail.in/v1.1/email";
const token = config.zeptomail.apiKey;

const client = new SendMailClient({
  url,
  token,
});

type EmailResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

type ZeptomailResponse = {
  data?: {
    queued_at?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

/**
 * Sends an OTP email to the specified email address using Zeptomail template
 * @param email - Recipient email address
 * @param otp - OTP code to send
 * @returns Promise with email sending result
 */
export async function sendOtpEmail(
  email: string,
  otp: string
): Promise<EmailResult> {
  try {
    if (!email || !otp) {
      throw new Error("Email and OTP are required");
    }

    if (!config.zeptomail.otpTemplateId) {
      throw new Error("OTP template ID is not configured");
    }

    logger.info(`Sending OTP email to ${email}`);

    const response = (await client.sendMailWithTemplate({
      template_key: config.zeptomail.otpTemplateId,
      from: {
        address: config.email.fromEmail,
        name: config.email.fromName,
      },
      to: [
        {
          email_address: {
            address: email,
            name: "",
          },
        },
      ],
      merge_info: {
        otp: otp,
      },
    })) as ZeptomailResponse;

    const messageId = response?.data?.queued_at as string | undefined;

    logger.info(`OTP email sent successfully to ${email}`, {
      messageId,
    });

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send OTP email";

    logger.error(`Failed to send OTP email to ${email}`, {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Re-throw as operational error for proper error handling
    throw internalError(`Failed to send OTP email: ${errorMessage}`, {
      email,
      originalError: errorMessage,
    });
  }
}

/**
 * Sends a plain text email (for non-template emails)
 * @param email - Recipient email address
 * @param subject - Email subject
 * @param htmlBody - HTML email body
 * @param textBody - Plain text email body (optional)
 * @returns Promise with email sending result
 */
export async function sendEmail(
  email: string,
  subject: string,
  htmlBody: string,
  textBody?: string
): Promise<EmailResult> {
  try {
    if (!email || !subject || !htmlBody) {
      throw new Error("Email, subject, and HTML body are required");
    }

    logger.info(`Sending email to ${email}`, { subject });

    const response = (await client.sendMail({
      from: {
        address: config.email.fromEmail,
        name: config.email.fromName,
      },
      to: [
        {
          email_address: {
            address: email,
            name: "",
          },
        },
      ],
      subject,
      htmlbody: htmlBody,
      textbody: textBody || htmlBody.replace(/<[^>]*>/g, ""), // Strip HTML if no text body provided
    })) as ZeptomailResponse;

    const messageId = response?.data?.queued_at as string | undefined;

    logger.info(`Email sent successfully to ${email}`, {
      messageId,
      subject,
    });

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send email";

    logger.error(`Failed to send email to ${email}`, {
      error: errorMessage,
      subject,
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw internalError(`Failed to send email: ${errorMessage}`, {
      email,
      subject,
      originalError: errorMessage,
    });
  }
}
