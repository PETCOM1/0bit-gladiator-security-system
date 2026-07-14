import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = `${process.env.EMAIL_FROM_NAME || "Gladiator Pro Team"} <${process.env.SENDER_EMAIL || "noreply@gladiatorpro.co.za"}>`;
const APP    = process.env.APP_NAME || "Gladiator Pro";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN:     "Super Admin",
  ADMIN:           "Admin",
  ACCOUNT_MANAGER: "Account Manager",
  MANAGER:         "Manager",
  SITE_MANAGER:    "Site Manager",
  GUARD:           "Security Guard",
};

async function send(payload: Parameters<typeof resend.emails.send>[0]) {
  const { data, error } = await resend.emails.send(payload);
  if (error) {
    console.error("❌ [MAIL] Resend error:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
  console.log(`✅ [MAIL] Sent to ${Array.isArray(payload.to) ? payload.to.join(", ") : payload.to} (id: ${data?.id})`);
}

// ── Invite email ───────────────────────────────────────────────────────────────

export async function sendInviteEmail(
  to: string,
  inviteLink: string,
  name: string,
  context?: {
    invitedBy?: string;
    role?: string;
    assignedSite?: string;
  }
) {
  const invitedByText = context?.invitedBy ? `<strong>Invited by:</strong> ${context.invitedBy}<br>` : "";
  const roleText = `<strong>Role:</strong> ${context?.role ? (ROLE_LABELS[context.role] ?? context.role) : "Team Member"}<br>`;
  const assignedSiteText = context?.assignedSite ? `<strong>Assigned Site:</strong> ${context.assignedSite}<br>` : "";
  
  const roleForText = context?.role ? (ROLE_LABELS[context.role] ?? context.role) : "Team Member";

  await send({
    from:    FROM,
    to,
    subject: `You've been invited to Gladiator Pro`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:0;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <div style="background:#1e293b;padding:24px;text-align:center;color:#ffffff;">
          <h1 style="margin:0;font-size:20px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Gladiator Pro Security System</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="margin-top:0;color:#0f172a;font-size:24px;font-weight:800;letter-spacing:0.5px;">You've been invited</h2>
          <p style="color:#334155;font-size:16px;line-height:1.5;">Hi ${name},</p>
          <p style="color:#334155;font-size:16px;line-height:1.5;">You have been invited to join Gladiator Pro as part of a security operations team.</p>

          <div style="margin:24px 0;padding:16px;background:#f8fafc;border-radius:8px;color:#334155;font-size:15px;line-height:1.6;">
            ${roleText}
            ${invitedByText}
            ${assignedSiteText}
          </div>

          <p style="color:#334155;font-size:16px;line-height:1.5;">To activate your account, click the button below:</p>

          <div style="text-align:center;margin:32px 0;">
            <a href="${inviteLink}" style="display:inline-block;padding:16px 32px;background:#F57C00;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:1px;">
              Accept invitation
            </a>
          </div>

          <p style="color:#64748b;font-size:13px;line-height:1.5;margin-bottom:8px;">This invitation will expire in 48 hours.</p>
          <p style="color:#64748b;font-size:13px;line-height:1.5;margin-bottom:24px;">Please don't share this link with anyone. If you weren't expecting this invitation, you can safely ignore this email.</p>

          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">This is an automated message from Gladiator Pro Security System, sent because someone invited this address to join their team.</p>
        </div>
      </div>
    `,
    text: [
      `Hi ${name},`,
      ``,
      `You have been invited to join Gladiator Pro as part of a security operations team.`,
      ``,
      `Role: ${roleForText}`,
      context?.invitedBy ? `Invited by: ${context.invitedBy}` : null,
      context?.assignedSite ? `Assigned site: ${context.assignedSite}` : null,
      ``,
      `Accept your invitation: ${inviteLink}`,
      ``,
      `This invitation will expire in 48 hours. Please don't share this link with anyone. If you weren't expecting this invitation, you can safely ignore this email.`,
      ``,
      `-- Gladiator Pro Security System`,
    ].filter((line) => line !== null).join("\n"),
  });
}

// ── Verification email ─────────────────────────────────────────────────────────

export async function sendVerificationEmail(
  to: string, verifyLink: string
) {
  await send({
    from:    FROM,
    to,
    subject: `Verify your ${APP} account`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2>Verify your email</h2>
        <p>Click the button below to verify your email address.</p>
        <a href="${verifyLink}" style="display:inline-block;padding:12px 24px;background:#84cc16;color:#0f172a;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0">
          Verify Email
        </a>
      </div>
    `,
    text: `Verify your email\n\nVisit this link to verify your email address:\n${verifyLink}`,
  });
}

// ── Password reset email ───────────────────────────────────────────────────────

export async function sendPasswordResetEmail(
  to: string, resetLink: string
) {
  await send({
    from:    FROM,
    to,
    subject: `Reset your ${APP} password`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2>Reset your password</h2>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#84cc16;color:#0f172a;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0">
          Reset Password
        </a>
        <p style="color:#666;font-size:13px">If you didn't request this, ignore this email.</p>
      </div>
    `,
    text: `Reset your password\n\nVisit this link to reset your password (expires in 1 hour):\n${resetLink}\n\nIf you didn't request this, you can ignore this email.`,
  });
}

// ── Verification code email ────────────────────────────────────────────────────

export async function sendVerificationCodeEmail(
  to: string, code: string
) {
  await send({
    from:    FROM,
    to,
    subject: `Your ${APP} verification code`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2>Your verification code</h2>
        <p style="font-size:32px;font-weight:800;letter-spacing:8px;color:#0f172a;background:#f1f5f9;padding:16px;border-radius:8px;text-align:center">
          ${code}
        </p>
        <p style="color:#666;font-size:13px">This code expires in 15 minutes.</p>
      </div>
    `,
    text: `Your verification code: ${code}\n\nThis code expires in 15 minutes.`,
  });
}