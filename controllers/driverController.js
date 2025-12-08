import Driver from "../models/driver.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ========================= REGISTER DRIVER =========================
export const registerDriver = async (req, res) => {
    try {
        const { email, fullName, password, phoneNo } = req.body;

        // Check if email already exists
        const existingDriver = await Driver.findOne({ email });
        if (existingDriver) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new driver
        const newDriver = await Driver.create({
            fullName,
            email,
            phoneNo,
            password: hashedPassword
        });

        res.status(201).json({
            message: "Driver registered successfully",
            driver: {
                id: newDriver._id,
                fullName: newDriver.fullName,
                email: newDriver.email,
                phoneNo: newDriver.phoneNo
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ========================= LOGIN DRIVER =========================
export const loginDriver = async (req, res) => {
    try {
        const { email, password } = req.body;

        const driver = await Driver.findOne({ email });
        if (!driver) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, driver.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: driver._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            driver: {
                id: driver._id,
                fullName: driver.fullName,
                email: driver.email,
                phoneNo: driver.phoneNo
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
