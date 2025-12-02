import express from "express";
import { loginStudent, registerStudent } from "../controllers/studentController.js";

const router = express.Router();

router.post("/register", registerStudent);
router.post("/login",loginStudent)

export default router;
