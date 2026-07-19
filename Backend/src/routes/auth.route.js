import { Router } from "express";
import { registerValidationRules,loginValidationRules } from "../validator/auth.validator.js";
import { register ,verifyEmail,login,getMe,resendVerificationEmail,logout} from "../controller/auth.controller.js";
import {authUser} from "../middleware/auth.middleware.js";
const authRouter = Router();

authRouter.post("/register", registerValidationRules, register);

authRouter.post("/login", loginValidationRules, login);

authRouter.post("/logout", logout);

authRouter.get("/get-me", authUser, getMe);

authRouter.get("/verify-email", verifyEmail);

authRouter.post("/resend-verification", resendVerificationEmail);


export default authRouter;

