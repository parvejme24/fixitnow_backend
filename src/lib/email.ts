import nodemailer from "nodemailer";
import config from "../config/index.js";

const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
    },
});

type SendMailOptions = {
    to: string;
    subject: string;
    html: string;
    text?: string;
};

export const sendEmail = async ({ to, subject, html, text }: SendMailOptions) => {
    if (!config.smtp.user || !config.smtp.pass) {
        console.warn("SMTP not configured — email skipped:", subject, "→", to);
        return { skipped: true as const };
    }

    const info = await transporter.sendMail({
        from: `"FixItNow" <${config.smtp.from}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]+>/g, " "),
    });

    return { skipped: false as const, messageId: info.messageId };
};

export const sendPasswordResetEmail = async (
    to: string,
    name: string,
    resetUrl: string
) => {
    return sendEmail({
        to,
        subject: "Reset your FixItNow password",
        html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
        <h2>Password reset request</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your FixItNow password. Click the button below to continue:</p>
        <p style="margin:24px 0">
          <a href="${resetUrl}" style="background:#0f766e;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">
            Reset password
          </a>
        </p>
        <p>Or copy this link:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
        <p>— FixItNow</p>
      </div>
    `,
    });
};

export const sendPasswordChangedEmail = async (to: string, name: string) => {
    return sendEmail({
        to,
        subject: "Your FixItNow password was changed",
        html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
        <h2>Password updated</h2>
        <p>Hi ${name},</p>
        <p>Your FixItNow account password was changed successfully.</p>
        <p>If you did not make this change, please reset your password immediately and contact support.</p>
        <p>— FixItNow</p>
      </div>
    `,
    });
};

export const sendRoleChangedEmail = async (
    to: string,
    name: string,
    oldRole: string,
    newRole: string
) => {
    return sendEmail({
        to,
        subject: `Your FixItNow role is now ${newRole}`,
        html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
        <h2>Role updated</h2>
        <p>Hi ${name},</p>
        <p>An admin updated your account role.</p>
        <p><strong>Previous role:</strong> ${oldRole}<br/>
           <strong>New role:</strong> ${newRole}</p>
        <p>You may need to log out and log in again for the change to apply fully.</p>
        <p>— FixItNow</p>
      </div>
    `,
    });
};
