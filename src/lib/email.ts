import nodemailer from "nodemailer";
import prisma from "./prisma";

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(options: {
  userId: string;
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const smtpConfig = await prisma.smtpConfig.findUnique({
    where: { userId: options.userId },
  });

  if (!smtpConfig) {
    return {
      success: false,
      error: "SMTP not configured. Go to Settings to set up email.",
    };
  }

  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: {
      user: smtpConfig.username,
      pass: smtpConfig.password,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: smtpConfig.fromName
        ? `"${smtpConfig.fromName}" <${smtpConfig.username}>`
        : smtpConfig.username,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

export async function testSmtpConnection(config: {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.username, pass: config.password },
  });

  try {
    await transporter.verify();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}
