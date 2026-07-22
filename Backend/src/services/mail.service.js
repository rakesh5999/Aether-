import nodemailer from "nodemailer";
import "dotenv/config";

// Helper function to send email using Gmail REST API over HTTPS (Port 443 - firewall safe on Render)
async function sendViaGmailApi({ to, subject, html, text }) {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    throw new Error(`Google OAuth Token Refresh Error: ${tokenData.error_description || tokenData.error || JSON.stringify(tokenData)}`);
  }

  const accessToken = tokenData.access_token;
  const fromEmail = process.env.GOOGLE_USER;

  const boundary = "====_Aether_AI_" + Date.now().toString(16);
  const dateStr = new Date().toUTCString();
  const plainText = text || "Please verify your email by clicking the link in the email.";

  const rawMessage = [
    `From: "Aether AI" <${fromEmail}>`,
    `Reply-To: ${fromEmail}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Date: ${dateStr}`,
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
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_REFRESH_TOKEN) {
    console.log("Sending email via Gmail HTTPS API (Port 443)...");
    const details = await sendViaGmailApi({ to, subject, html, text });
    console.log("Email sent successfully via Gmail API:", details.id);
    return "email sent successfully to " + to;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GOOGLE_USER,
      pass: process.env.GOOGLE_APP_PASSWORD,
    },
  });

  const details = await transporter.sendMail({
    from: process.env.GOOGLE_USER,
    to,
    subject,
    text,
    html,
  });
  return "email sent successfully to " + to;
}

