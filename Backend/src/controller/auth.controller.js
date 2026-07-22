import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/mail.service.js";

const getBackendUrl = (req) => {
  if (process.env.BACKEND_URL) return process.env.BACKEND_URL;
  return `${req.protocol}://${req.get('host')}`;
};

const getFrontendUrl = (req) => {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;
  const origin = req.get('origin');
  if (origin) return origin;

  const host = req.get('host');
  if (host) {
    const hostname = host.split(':')[0];
    return `${req.protocol}://${hostname}:5173`;
  }
  return "http://localhost:5173";
};


export const register = async (req, res) => {

  const { username, email, password } = req.body;

  const isUserExist = await userModel.findOne({
    $or: [{ username }, { email }]
  });

  if (isUserExist) {
    return res.status(400).json({
      message: "Username or email already exists",
      success: false,
      err: "User already exists"
    });
  }

  const user = await userModel.create({ username, email, password });

  const emailVerificationToken = jwt.sign(
    { email: user.email },
    process.env.JWT_SECRET,
  );


  const backendUrl = getBackendUrl(req);
  try {
    // Fire and forget: Do not await this so it doesn't block the user from registering if SMTP hangs
    sendEmail({
      to: email,
      subject: "Welcome to Our Aether App",
      html: `
          <p>Hi <strong>${username},</strong>, 
            welcome to our Aether App!</p>
          <p>thank you for registering with our Aether App. Please verify your email by clicking the link below:</p>
          <a href="${backendUrl}/api/auth/verify-email?token=${emailVerificationToken}"><strong>Verify Email</strong></a>
          <br/>
          <p>If you did not register for our Aether App, please ignore this email.</p>
          <p>Best regards,</p>  
          <p>Aether App Team</p>
            `
    }).catch(emailErr => {
      console.error("Async email send failed:", emailErr.message);
    });
  } catch (emailErr) {
    console.error("Failed to initiate verification email:", emailErr.message);
  }

  res.status(201).json({
    message: "User registered successfully",
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus
    }
  });

}


export const login = async (req, res) => {
  const { email, password } = req.body;

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
      message: "Email not verified",
      success: false,
      err: "Email not verified"
    });
  }

  const token = jwt.sign({
    id: user._id,
    username: user.username
  }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  })

  const isProduction = process.env.NODE_ENV === "production" || !!process.env.FRONTEND_URL;
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })


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
  })


}


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

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);




    const user = await userModel.findOne({ email: decoded.email });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
        success: false,
        err: "User not found"
      });
    }


    const frontendUrl = getFrontendUrl(req);
    if (user.verified) {
      const html = `
        <h1>Email Already Verified</h1>

        <p>
          Hi <strong>${user.username}</strong>,
          your email is already verified.
        </p>

        <p>You can directly login to your account.</p>

        <a href="${frontendUrl}/login">
          <strong>Login</strong>
        </a>

        <br/>

        <p>Best regards,</p>
        <p>Aether App Team</p>
      `;

      return res.send(html);
    }


    user.verified = true;
    await user.save();


    const html = `
      <h1>Email Verified Successfully</h1>
      <p>Hi <strong>${user.username},</strong>, your email has been verified successfully.</p>
      <p>You can now log in to your account.</p>
      <a href="${frontendUrl}/login"><strong>Login</strong></a>
      <br/>
      <p>Best regards,</p>  
      <p>Aether App Team</p>
        `;

    return res.send(html);
  }
  catch (err) {
    return res.status(400).json({
      message: "Invalid or expired token",
      success: false,
      err: err.message,
    });
  }
}


export const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  const user = await userModel.findOne({ email });

  if (!user) {
    return res.status(400).json({
      message: "User not found",
      success: false,
      err: "User not found"
    });
  }

  if (user.verified) {
    return res.status(400).json({
      message: "Email already verified",
      success: false,
      err: "Email already verified"
    });
  }


  const token = jwt.sign(
    { email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );


  const backendUrl = getBackendUrl(req);
  try {
    await sendEmail({
      to: user.email,
      subject: "Verify your email",
      html: `
        <p>Hi <strong>${user.username}</strong>,</p>

        <p>
          Please verify your email by clicking the link below:
        </p>

        <a href="${backendUrl}/api/auth/verify-email?token=${token}">
          <strong>Verify Email</strong>
        </a>

        <br/>

        <p>Best regards,</p>
        <p>Aether App Team</p>
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
    message: "Verification email sent successfully",
    success: true
  });
}

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