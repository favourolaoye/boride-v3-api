import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, "Full name is required"],
            trim: true
        },

        matricNo: {
            type: String,
            required: [true, "Matric number is required"],
            unique: true,
            trim: true,
            uppercase: true
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: [true, "Password is required"]
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        emailOTP: {
            type: String,
            default: null
        },

        otpExpires: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

// Ensure MongoDB creates unique indexes
studentSchema.index({ email: 1 }, { unique: true });
studentSchema.index({ matricNo: 1 }, { unique: true });

export default mongoose.model("Student", studentSchema);
