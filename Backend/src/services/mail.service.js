import nodemailer from "nodemailer";
import "dotenv/config";

// Helper function to send email using Gmail REST API over HTTPS (Port 443 - firewall safe on Render)
async function sendViaGmailApi({ to, subject, html, text }) {
  const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
  const refreshToken = (process.env.GOOGLE_REFRESH_TOKEN || "").trim();

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const rawText = await tokenRes.text();
  let tokenData = {};
  try {
    tokenData = JSON.parse(rawText);
  } catch (_) {
    throw new Error(`Google OAuth Token Refresh Error: ${rawText}`);
  }
  if (!tokenRes.ok) {
    throw new Error(`Google OAuth Token Refresh Error (${tokenRes.status}): ${rawText}`);
  }

  const accessToken = tokenData.access_token;
  const fromEmail = (process.env.GOOGLE_USER || "").trim();

  const boundary = "====_Aether_AI_" + Date.now().toString(16);
  const dateStr = new Date().toUTCString();
  const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2, 9)}@aether.ai>`;
  const plainText = text || "Please verify your email address to activate your Aether AI account.";

  const rawMessage = [
    `From: "Aether AI" <${fromEmail}>`,
    `Reply-To: ${fromEmail}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Date: ${dateStr}`,
    `Message-ID: ${messageId}`,
    `X-Mailer: Aether-AI-Auth-Service`,
    `Auto-Submitted: auto-generated`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=utf-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    plainText,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=utf-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    html,
    ``,
    `--${boundary}--`
  ].join("\r\n");

  const encodedMessage = Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encodedMessage }),
  });

  const sendData = await sendRes.json();
  if (!sendRes.ok) {
    throw new Error(`Gmail API Error: ${sendData.error?.message || JSON.stringify(sendData)}`);
  }

  return sendData;
}

export async function sendEmail({ to, subject, html, text = "" }) {
  const plainFallback = text || "Please verify your email address to activate your Aether AI account.";
  let lastError = null;

  // 1. Prioritize Nodemailer with Gmail App Password (stable, permanent, no OAuth expiration)
  if (process.env.GOOGLE_USER && process.env.GOOGLE_APP_PASSWORD) {
    try {
      console.log("Sending email via Nodemailer Gmail App Password...");
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: (process.env.GOOGLE_USER || "").trim(),
          pass: (process.env.GOOGLE_APP_PASSWORD || "").replace(/\s+/g, "").trim(),
        },
      });

      const details = await transporter.sendMail({
        from: `"Aether AI" <${(process.env.GOOGLE_USER || "").trim()}>`,
        replyTo: (process.env.GOOGLE_USER || "").trim(),
        to,
        subject,
        text: plainFallback,
        html,
        headers: {
          "X-Mailer": "Aether-AI-Auth-Service",
          "Auto-Submitted": "auto-generated"
        }
      });
      console.log("Email sent successfully via Nodemailer App Password:", details.messageId);
      return "email sent successfully to " + to;
    } catch (nodemailerErr) {
      console.error("Nodemailer App Password failed:", nodemailerErr.message);
      lastError = nodemailerErr;
    }
  }

  // 2. Try Gmail REST API over HTTPS
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_REFRESH_TOKEN) {
    try {
      console.log("Sending email via Gmail HTTPS API (Port 443)...");
      const details = await sendViaGmailApi({ to, subject, html, text: plainFallback });
      console.log("Email sent successfully via Gmail API:", details.id);
      return "email sent successfully to " + to;
    } catch (err) {
      console.error("sendViaGmailApi failed:", err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("No email provider configured or all providers failed");
}
