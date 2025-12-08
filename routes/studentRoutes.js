import express from "express";
import { registerStudent, loginStudent, verifyStudentEmail, resendVerificationOTP } from "../controllers/studentController.js";

const router = express.Router();

// REGISTER — send OTP to email
router.post("/register", registerStudent);

// VERIFY EMAIL OTP
router.post("/verify-email", verifyStudentEmail);

// RESEND OTP (optional but useful)
router.post("/resend-otp", resendVerificationOTP);

// LOGIN — only if verified
router.post("/login", loginStudent);

export default router;
