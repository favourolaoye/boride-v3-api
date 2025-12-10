import Student from "../models/student.js";
import bcrypt from "bcryptjs";
import { isValidEmail, isValidMatricNumber } from "../utils/validator.js";
import { signToken } from "../utils/jwts.js";
import { mailer } from "../utils/mailer.js";

export async function registerStudent(req, res) {
    try {
        const { email, matricNo, fullName, password, phoneNo } = req.body;

        if (!email || !matricNo || !fullName || !password || !phoneNo) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        if (!isValidMatricNumber(matricNo)) {
            return res.status(400).json({ success: false, message: "Invalid matric number format" });
        }

        const existing = await Student.findOne({ $or: [{ email }, { matricNo }] });
        if (existing) {
            return res.status(400).json({ success: false, message: "Student already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = Date.now() + 15 * 60 * 1000; // 15 mins

        const student = await Student.create({
            fullName,
            matricNo,
            email,
            phoneNo,
            password: hashedPassword,
            emailOTP: otp,
            otpExpires: otpExpiry
        });

        // Send OTP email
        await mailer.sendMail({
            from: process.env.MAIL_USER,
            to: email,
            subject: "Verify Your Student Email",
            html: `
                <h2>Hello ${fullName}</h2>
                <p>Your OTP for email verification is:</p>
                <h1>${otp}</h1>
                <p>This OTP expires in 15 minutes.</p>
            `
        });

        return res.status(201).json({
            success: true,
            message: "Registration successful. OTP sent to email.",
            studentId: student._id
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
}

// verify email function
export async function verifyStudentEmail(req, res) {
    try {
        const { email, otp } = req.body;

        const student = await Student.findOne({ email });
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        if (student.isVerified) {
            return res.status(400).json({ success: false, message: "Email already verified" });
        }

        if (student.emailOTP !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        if (student.otpExpires < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP expired" });
        }

        student.isVerified = true;
        student.emailOTP = null;
        student.otpExpires = null;
        await student.save();

        return res.status(200).json({
            success: true,
            message: "Email verified successfully"
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
}

// Login
export async function loginStudent(req, res) {
    try {
        const { email, password, matricNo } = req.body;
        console.log({ email, password, matricNo })
        if (!password || (!email && !matricNo)) {
            return res
                .status(400)
                .json({ message: "Provide password and either email or matric number" });
        }

        // Find student
        const student = await Student.findOne({
            $or: [{ email }, { matricNo }]
        });

        if (!student) {
            return res.status(404).json({ status: "fail", message: "Student not found" });
        }

        if (!student.isVerified) {
            return res.status(403).json({
                status: "fail",
                message: "Email not verified. Please verify before login."
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) {
            return res.status(401).json({ status: "fail", message: "Incorrect password" });
        }

        const token = signToken({
            id: student._id,
            email: student.email,
            matricNo: student.matricNo
        });

        // SEND LOGIN NOTIFICATION EMAIL
        await mailer.sendMail({
            from: process.env.MAIL_USER,
            to: student.email,
            subject: "Login Notification",
            html: `
                <h3>Hello ${student.fullName},</h3>
                <p>Your account just logged in at:</p>
                <p><strong>${new Date().toLocaleString()}</strong></p>
                <p>If this wasn't you, change your password immediately.</p>
            `
        });

        return res.status(200).json({
            status: "success",
            message: "Login successful",
            token,
            student: {
                id: student._id,
                fullName: student.fullName,
                email: student.email,
                matricNo: student.matricNo
            }
        });

    } 
    catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ status: "error", message: err.message });
}
}



export async function resendVerificationOTP(req, res) {
    try {
        const { email, studentId } = req.body;

        // Must provide something to identify the student
        if (!email && !studentId) {
            return res.status(400).json({
                success: false,
                message: "Email or studentId is required"
            });
        }

        // Find student by email or ID
        const student = await Student.findOne({
            $or: [
                { email: email?.toLowerCase() },
                { _id: studentId }
            ]
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        // Check if already verified
        if (student.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Email already verified"
            });
        }

        // Generate NEW OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = Date.now() + 15 * 60 * 1000; // 15 min

        student.emailOTP = otp;
        student.otpExpires = otpExpiry;
        await student.save();

        // Send OTP mail
        await mailer.sendMail({
            from: process.env.MAIL_USER,
            to: student.email,
            subject: "Resend Email Verification OTP",
            html: `
                <h2>Hello ${student.fullName}</h2>
                <p>Your new OTP for email verification is:</p>
                <h1>${otp}</h1>
                <p>This OTP will expire in 15 minutes.</p>
            `
        });

        return res.status(200).json({
            success: true,
            message: "OTP resent successfully",
            email: student.email
        });

    } catch (error) {
        console.error("Resend OTP Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
}
