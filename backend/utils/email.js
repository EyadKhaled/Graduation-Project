import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const send = ({ to, subject, html }) =>
  transporter.sendMail({
    from: `"GallCare" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });

export const sendVerificationEmail = (user, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  return send({
    to: user.email,
    subject: "Verify your GallCare email",
    html: `
      <h2>Hi ${user.first_name},</h2>
      <p>Please verify your email — link expires in <strong>24 hours</strong>.</p>
      <a href="${url}" style="display:inline-block;padding:12px 28px;background:#0abfaa;color:#fff;border-radius:50px;text-decoration:none;font-weight:700;">
        Verify Email
      </a>
      <p style="margin-top:16px;color:#888;font-size:0.85rem;">Or paste: ${url}</p>
    `,
  });
};

export const sendPasswordResetEmail = (user, token) => {
  const url = `${process.env.CLIENT_URL}/reset?token=${token}`;
  return send({
    to: user.email,
    subject: "Reset your GallCare password",
    html: `
      <h2>Hi ${user.first_name},</h2>
      <p>You requested a password reset — link expires in <strong>1 hour</strong>.</p>
      <a href="${url}" style="display:inline-block;padding:12px 28px;background:#ff6b6b;color:#fff;border-radius:50px;text-decoration:none;font-weight:700;">
        Reset Password
      </a>
      <p style="margin-top:16px;color:#888;font-size:0.85rem;">If you didn't request this, ignore this email.</p>
      <p style="color:#888;font-size:0.85rem;">Or paste: ${url}</p>
    `,
  });
};
