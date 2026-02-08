import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@weakexcuse.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

interface InviteEmailParams {
  to: string;
  inviterName: string;
  groupName: string;
  groupEmoji: string;
  inviteCode: string;
}

export async function sendInviteEmail({
  to,
  inviterName,
  groupName,
  groupEmoji,
  inviteCode,
}: InviteEmailParams) {
  if (!apiKey) {
    throw new Error("SendGrid is not configured");
  }

  const joinLink = APP_URL
    ? `${APP_URL}/groups/join?code=${inviteCode}`
    : null;

  const textBody = [
    `${inviterName} invited you to join "${groupName}" ${groupEmoji} on Weak Excuse!`,
    "",
    `Your invite code: ${inviteCode}`,
    ...(joinLink ? [`Join here: ${joinLink}`] : []),
    "",
    "See you on the board of shame.",
  ].join("\n");

  const htmlBody = [
    `<h2>${groupEmoji} You've been summoned</h2>`,
    `<p><strong>${inviterName}</strong> invited you to join <strong>${groupName}</strong> on Weak Excuse.</p>`,
    `<p>Your invite code: <code style="font-size:1.2em;padding:4px 8px;background:#f3f4f6;border-radius:4px;">${inviteCode}</code></p>`,
    ...(joinLink
      ? [
          `<p><a href="${joinLink}" style="display:inline-block;padding:10px 20px;background:#000;color:#fff;border-radius:6px;text-decoration:none;">Join the group</a></p>`,
        ]
      : []),
    `<p style="color:#6b7280;font-size:0.875em;">See you on the board of shame.</p>`,
  ].join("\n");

  await sgMail.send({
    to,
    from: FROM_EMAIL,
    subject: `${inviterName} invited you to "${groupName}" on Weak Excuse`,
    text: textBody,
    html: htmlBody,
  });
}
