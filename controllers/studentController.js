import Student from "../models/student.js";
import bcrypt from "bcryptjs";
import { isValidEmail, isValidMatricNumber } from "../utils/validator.js";
import { signToken } from "../utils/jwt.js";

export async function registerStudent(req, res) {
    try {
        const { email, matricNo, fullName, password } = req.body;

        if (!email || !matricNo || !fullName || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Validate email format
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        // Validate matric number format
        if (!isValidMatricNumber(matricNo)) {
            return res.status(400).json({
                success: false,
                message: "Invalid matric number format"
            });
        }

        const existingMatric = await Student.findOne({ matricNo });
        if (existingMatric) {
            return res.status(400).json({
                success: false,
                message: "Matric number already registered"
            });
        }

        const existingEmail = await Student.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newStudent = await Student.create({
            fullName,
            matricNo,
            email,
            password: hashedPassword
        });

        // Sign JWT
        const token = signToken({
            id: newStudent._id,
            email: newStudent.email
        });

        return res.status(201).json({
            success: true,
            message: "Student registered successfully",
            token,
            student: {
                id: newStudent._id,
                fullName: newStudent.fullName,
                matricNo: newStudent.matricNo,
                email: newStudent.email
            }
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
}

// Login
export async function loginStudent(req, res) {
    try {
        const { email, password, matricNo } = req.body;

        // Must provide email or matric number
        if (!email && !matricNo) {
            return res.status(400).json({
                status: "fail",
                message: "Provide email or matricNo to login",
            });
        }

        // Password required
        if (!password) {
            return res.status(400).json({
                status: "fail",
                message: "Password is required",
            });
        }

        // Validate email if provided
        if (email && !isValidEmail(email)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid student email format",
            });
        }

        // Validate matric if provided
        if (matricNo && !isValidMatricNumber(matricNo)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid matric number format (YY/NNNN)",
            });
        }

        // Find student by email or matric
        const student = await Student.findOne({
            $or: [{ email }, { matricNo }],
        });

        if (!student) {
            return res.status(404).json({
                status: "fail",
                message: "Student not found",
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) {
            return res.status(401).json({
                status: "fail",
                message: "Incorrect password",
            });
        }

        // Generate JWT
        const token = generateToken({
            id: student._id,
            email: student.email,
            matricNo: student.matricNo,
        });

        return res.status(200).json({
            status: "success",
            message: "Login successful",
            token,
            student: {
                id: student._id,
                fullName: student.fullName,
                email: student.email,
                matricNo: student.matricNo,
            },
        });
    } catch (err) {
        console.error("Login Error:", err);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
}