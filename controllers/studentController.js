import Student from "../models/student.js";
import bcrypt from "bcrypt";
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