import userModel, { normalizeEmail } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../services/mail.service.js";

const getBackendUrl = (req) => {
  let url = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url.replace(/\/$/, "");
};

const getFrontendUrl = (req) => {
  let url = process.env.FRONTEND_URL;
  if (!url) {
    const origin = req.get('origin');
    if (origin) return origin.replace(/\/$/, "");

    const host = req.get('host');
    if (host) {
      const hostname = host.split(':')[0];
      return `${req.protocol}://${hostname}:5173`;
    }
    return "http://localhost:5173";
  }

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url.replace(/\/$/, "");
};


export const register = async (req, res) => {
  let { username, email, password } = req.body;

  email = (email || "").trim().toLowerCase();
  username = (username || "").trim();

  if (!email.endsWith("@gmail.com")) {
    return res.status(400).json({
      message: "Please use a valid Gmail address to create your Aether AI account.",
      success: false,
      err: "Invalid email domain"
    });
  }

  const localPart = email.slice(0, -10);
  if (localPart.length < 6 || localPart.length > 30 || !/^[a-z0-9.]+$/.test(localPart) || localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes("..")) {
    return res.status(400).json({
      message: "Please enter a valid @gmail.com address (6-30 letters, numbers, or dots).",
      success: false,
      err: "Invalid Gmail address format"
    });
  }

  const normalizedEmail = normalizeEmail(email);
  const isUserExist = await userModel.findOne({
    $or: [{ username }, { email }, { normalizedEmail }]
  });

  if (isUserExist) {
    return res.status(400).json({
      message: "An account with this username or email already exists. Please log in.",
      success: false,
      err: "User already exists"
    });
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const user = await userModel.create({
    username,
    email,
    password,
    verified: false,
    verificationToken,
    verificationTokenExpires,
    lastVerificationSentAt: new Date()
  });

  const frontendUrl = getFrontendUrl(req);
  const verifyLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

  try {
    await sendEmail({
      to: email,
      subject: "Verify Your Aether AI Account",
      text: `Hi ${username},\n\nWelcome to Aether AI! Please verify your email by clicking the link below:\n${verifyLink}\n\nThank you,\nAether AI Security Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Aether AI Account</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b;">
          <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; padding: 36px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 28px;">
              <div style="display: inline-block; background-color: #FF6B2C; color: #ffffff; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; font-weight: 900; font-size: 20px;">AE</div>
              <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 16px; margin-bottom: 6px;">Verify your email address</h1>
              <p style="font-size: 14px; color: #64748b; margin: 0;">Complete your registration to start using Aether AI</p>
            </div>
            
            <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hi <strong>${username}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6; color: #334155;">Thank you for registering with Aether AI. Please click the button below to verify your email address and activate your account:</p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verifyLink}" style="background-color: #FF6B2C; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 2px 8px rgba(255, 107, 44, 0.3);">Verify Email Address</a>
            </div>
            
            <p style="font-size: 13px; color: #64748b; margin-bottom: 24px;">If the button doesn't work, copy and paste this link into your web browser:<br/><a href="${verifyLink}" style="color: #FF6B2C; word-break: break-all;">${verifyLink}</a></p>

            <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 28px; font-size: 12px; color: #94a3b8; text-align: center;">
              <p style="margin: 0 0 6px 0;">This email was sent to <strong>${email}</strong> because an Aether AI account registration was requested.</p>
              <p style="margin: 0;">If you did not initiate this request, you can safely ignore this message.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  } catch (emailErr) {
    console.error("Failed to send verification email during registration:", emailErr.message);
    // Roll back created user if email fails to send
    await userModel.findByIdAndDelete(user._id);

    return res.status(400).json({
      message: "Unable to send verification email to this address. Please ensure your @gmail.com address exists and is active.",
      success: false,
      err: "Email delivery failed",
      details: emailErr.message
    });
  }

  res.status(201).json({
    message: "User registered successfully! Please check your Gmail inbox to verify your account.",
    success: true,
    requiresVerification: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      verified: false,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus
    }
  });
};

export const login = async (req, res) => {
  let { email, password } = req.body;
  email = (email || "").trim().toLowerCase();

  const user = await userModel.findOne({ email });

  if (!user) {
    return res.status(400).json({
      message: "Invalid email or password",
      success: false,
      err: "User not found"
    });
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return res.status(400).json({
      message: "Invalid email or password",
      success: false,
      err: "Incorrect password"
    });
  }

  if (!user.verified) {
    return res.status(400).json({
      message: "Your email address has not been verified yet. Please check your Gmail inbox and verify your email to continue.",
      success: false,
      err: "Email not verified",
      isUnverified: true,
      email: user.email
    });
  }

  const token = jwt.sign({
    id: user._id,
    username: user.username
  }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });

  const isProduction = process.env.NODE_ENV === "production" || !!process.env.FRONTEND_URL;
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(200).json({
    message: "Login successful",
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus
    }
  });
};


export const getMe = async (req, res) => {
  const userId = req.user.id;

  const User = await userModel.findById(userId).select("-password");

  if (!User) {
    return res.status(404).json({
      message: "User not found",
      success: false,
      err: "User not found"
    });
  }

  res.status(200).json({
    message: "User fetched successfully",
    success: true,
    user: User
  });



}


export const verifyEmail = async (req, res) => {
  const { token } = req.query;
  const isJsonReq = req.headers.accept?.includes("application/json") || req.query.format === "json";
  const frontendUrl = getFrontendUrl(req);

  if (!token) {
    if (isJsonReq) {
      return res.status(400).json({ message: "Verification token is required", success: false });
    }
    return res.status(400).send(`
      <div style="font-family: Arial, sans-serif; background: #0a0a0a; color: #fff; text-align: center; padding: 60px 20px; min-height: 100vh;">
        <h2 style="color: #ef4444; font-size: 24px;">Verification Token Missing</h2>
        <p style="color: #a3a3a3;">Please use the full verification link sent to your Gmail inbox.</p>
        <a href="${frontendUrl}/login" style="color: #60a5fa; text-decoration: underline;">Return to Login</a>
      </div>
    `);
  }

  try {
    let user = await userModel.findOne({ verificationToken: token });

    // Fallback support for legacy JWT tokens if any
    if (!user) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.email) {
          user = await userModel.findOne({ email: decoded.email });
        }
      } catch (jwtErr) {
        // Not a valid JWT token
      }
    }

    if (!user) {
      if (isJsonReq) {
        return res.status(400).json({ message: "Invalid or expired verification link.", success: false });
      }
      return res.status(400).send(`
        <div style="font-family: Arial, sans-serif; background: #0a0a0a; color: #fff; text-align: center; padding: 60px 20px; min-height: 100vh;">
          <h2 style="color: #ef4444; font-size: 24px;">Invalid or Expired Link</h2>
          <p style="color: #a3a3a3;">This verification link is invalid or has expired.</p>
          <a href="${frontendUrl}/login" style="color: #60a5fa; text-decoration: underline;">Return to Login</a>
        </div>
      `);
    }

    if (user.verified) {
      if (isJsonReq) {
        return res.status(200).json({ message: "Email is already verified.", success: true, alreadyVerified: true });
      }
      return res.send(`
        <div style="font-family: Arial, sans-serif; background: #0a0a0a; color: #fff; text-align: center; padding: 60px 20px; min-height: 100vh;">
          <h2 style="color: #60a5fa; font-size: 24px;">Email Already Verified</h2>
          <p style="color: #a3a3a3;">Hi <strong>${user.username}</strong>, your Gmail address is already verified.</p>
          <a href="${frontendUrl}/login" style="background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; display: inline-block; margin-top: 15px; font-weight: bold;">Log In Now</a>
        </div>
      `);
    }

    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      if (isJsonReq) {
        return res.status(400).json({ message: "Verification link has expired. Please request a new one.", success: false, expired: true, email: user.email });
      }
      return res.status(400).send(`
        <div style="font-family: Arial, sans-serif; background: #0a0a0a; color: #fff; text-align: center; padding: 60px 20px; min-height: 100vh;">
          <h2 style="color: #f59e0b; font-size: 24px;">Verification Link Expired</h2>
          <p style="color: #a3a3a3;">Your verification link has expired. Please try logging in to request a new verification email.</p>
          <a href="${frontendUrl}/login" style="color: #60a5fa; text-decoration: underline;">Return to Login</a>
        </div>
      `);
    }

    user.verified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    if (isJsonReq) {
      return res.status(200).json({ message: "Email verified successfully!", success: true });
    }

    return res.send(`
      <div style="font-family: Arial, sans-serif; background: #0a0a0a; color: #fff; text-align: center; padding: 60px 20px; min-height: 100vh;">
        <h2 style="color: #22c55e; font-size: 24px;">Email Verified Successfully!</h2>
        <p style="color: #a3a3a3;">Hi <strong>${user.username}</strong>, your Gmail address has been verified successfully.</p>
        <a href="${frontendUrl}/login" style="background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; display: inline-block; margin-top: 15px; font-weight: bold;">Log In Now</a>
      </div>
    `);
  } catch (err) {
    if (isJsonReq) {
      return res.status(400).json({ message: "Invalid or expired token", success: false, err: err.message });
    }
    return res.status(400).send(`
      <div style="font-family: Arial, sans-serif; background: #0a0a0a; color: #fff; text-align: center; padding: 60px 20px; min-height: 100vh;">
        <h2 style="color: #ef4444; font-size: 24px;">Verification Failed</h2>
        <p style="color: #a3a3a3;">${err.message || "Invalid token"}</p>
        <a href="${frontendUrl}/login" style="color: #60a5fa; text-decoration: underline;">Return to Login</a>
      </div>
    `);
  }
};

export const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Email is required",
      success: false
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await userModel.findOne({
    $or: [{ email: normalizedEmail }, { normalizedEmail }]
  });

  if (!user) {
    return res.status(400).json({
      message: "User with this Gmail address was not found",
      success: false
    });
  }

  if (user.verified) {
    return res.status(400).json({
      message: "Email is already verified. You can log in directly.",
      success: false
    });
  }

  // Rate limiting / cooldown check (60 seconds)
  if (user.lastVerificationSentAt) {
    const elapsed = Date.now() - new Date(user.lastVerificationSentAt).getTime();
    if (elapsed < 60 * 1000) {
      const waitSeconds = Math.ceil((60 * 1000 - elapsed) / 1000);
      return res.status(429).json({
        message: `Please wait ${waitSeconds} seconds before requesting another verification email.`,
        success: false,
        cooldownRemaining: waitSeconds
      });
    }
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  user.verificationToken = verificationToken;
  user.verificationTokenExpires = verificationTokenExpires;
  user.lastVerificationSentAt = new Date();
  await user.save();

  const frontendUrl = getFrontendUrl(req);
  const verifyLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Verify Your Aether AI Account",
      text: `Hi ${user.username},\n\nHere is your requested verification link to activate your Aether AI account:\n${verifyLink}\n\nThank you,\nAether AI Security Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Aether AI Account</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b;">
          <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; padding: 36px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 28px;">
              <div style="display: inline-block; background-color: #FF6B2C; color: #ffffff; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; font-weight: 900; font-size: 20px;">AE</div>
              <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 16px; margin-bottom: 6px;">Email Verification Request</h1>
              <p style="font-size: 14px; color: #64748b; margin: 0;">Activate your Aether AI account</p>
            </div>
            
            <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hi <strong>${user.username}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6; color: #334155;">You requested a new verification link for your Aether AI account. Please click the button below to activate your account:</p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verifyLink}" style="background-color: #FF6B2C; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 2px 8px rgba(255, 107, 44, 0.3);">Verify Email Address</a>
            </div>
            
            <p style="font-size: 13px; color: #64748b; margin-bottom: 24px;">If the button doesn't work, copy and paste this link into your web browser:<br/><a href="${verifyLink}" style="color: #FF6B2C; word-break: break-all;">${verifyLink}</a></p>

            <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 28px; font-size: 12px; color: #94a3b8; text-align: center;">
              <p style="margin: 0 0 6px 0;">This email was sent to <strong>${user.email}</strong> because a verification link request was initiated.</p>
              <p style="margin: 0;">If you did not request this email, you can safely ignore this message.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  } catch (emailErr) {
    console.error("Failed to resend verification email:", emailErr.message);
    return res.status(500).json({
      message: "Failed to send email. Please check server email credentials.",
      success: false,
      err: emailErr.message
    });
  }

  return res.status(200).json({
    message: "Verification email sent successfully! Please check your Gmail inbox.",
    success: true
  });
};

export const logout = async (req, res) => {
  const isProduction = process.env.NODE_ENV === "production" || !!process.env.FRONTEND_URL;
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax"
  });
  return res.status(200).json({
    message: "Logout successful",
    success: true
  });
};

export const testEmail = async (req, res) => {
  const recipient = req.query.to || process.env.GOOGLE_USER;
  if (!recipient) {
    return res.status(400).json({ success: false, message: "Pass ?to=your_email@gmail.com in URL query parameter" });
  }

  const envCheck = {
    GOOGLE_USER: !!process.env.GOOGLE_USER,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN: !!process.env.GOOGLE_REFRESH_TOKEN,
    refreshTokenLength: process.env.GOOGLE_REFRESH_TOKEN?.length,
    refreshTokenPrefix: process.env.GOOGLE_REFRESH_TOKEN?.substring(0, 8),
  };

  try {
    const result = await sendEmail({
      to: recipient,
      subject: "Aether AI Email Diagnostic Test",
      html: "<p>If you receive this, your email configuration on Render is working perfectly!</p>"
    });
    return res.status(200).json({ success: true, message: "Email sent successfully!", result, envCheck });
  } catch (error) {
    console.error("Test email failed:", error);
    return res.status(500).json({
      success: false,
      message: "Email sending failed",
      error: error.message,
      envCheck
    });
  }
};