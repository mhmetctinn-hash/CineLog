import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = env.smtpHost
  ? nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
    })
  : null;

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  if (!transporter) {
    console.warn(`[email] SMTP not configured, skipping send. Reset URL for ${email}: ${resetUrl}`);
    return;
  }

  await transporter.sendMail({
    from: env.smtpFrom,
    to: email,
    subject: "Cinelog - Şifre Sıfırlama",
    html: `
      <p>Şifreni sıfırlamak için aşağıdaki bağlantıya tıkla. Bu bağlantı 1 saat içinde geçersiz olacak.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Bu isteği sen yapmadıysan bu e-postayı görmezden gelebilirsin.</p>
    `,
  });
}
