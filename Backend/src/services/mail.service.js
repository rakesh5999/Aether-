import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.GOOGLE_USER,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    clientId: process.env.GOOGLE_CLIENT_ID,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
});


transporter.verify()
.then(() => {
  console.log("Ready to send emails");
})
.catch((err) => {
  console.error("Error verifying transporter:", err);
});

export async function sendEmail({to, subject, html, text=""}) {
    const mailOptions = {
      to,
      subject,
      text,
      html,
    };

    const details = await transporter.sendMail(mailOptions);
    console.log("Email sent:", details);
    return "email sent successfully to" + to;
  }

