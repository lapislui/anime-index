import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendOtpEmail(to: string, code: string) {
  const hasCredentials = process.env.SMTP_USER && process.env.SMTP_PASSWORD;
  
  if (!hasCredentials) {
    console.log(`\n[Mail Fallback] SMTP credentials not set in .env. Here is your OTP:\n🔑 OTP for ${to}: ${code} (expires in 10 min)\n`);
    return;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || `"Anime Index" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your Anime Index One-Time Passcode",
    text: `Your Anime Index one-time passcode is: ${code}\n\nThis code will expire in 10 minutes.`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #0f172a;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #6366f1; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">✦ Anime Index ✦</h2>
          <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">Your Personal Anime Story Breakdown Catalog</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 16px; line-height: 1.5;">Hello,</p>
        <p style="font-size: 16px; line-height: 1.5;">Use the following one-time passcode (OTP) to sign in to your Anime Index account:</p>
        <div style="font-size: 36px; font-weight: 800; letter-spacing: 6px; text-align: center; padding: 18px; margin: 25px 0; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; color: #6366f1; font-family: monospace;">
          ${code}
        </div>
        <p style="font-size: 14px; line-height: 1.5; color: #475569;">This passcode is valid for <strong>10 minutes</strong>. If you did not request this code, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; text-align: center; color: #94a3b8; margin: 0;">This is an automated message from Anime Index. Please do not reply directly to this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
