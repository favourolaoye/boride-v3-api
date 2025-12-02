import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    matricNo: { type: String, required: true, unique: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model("Student", studentSchema);
