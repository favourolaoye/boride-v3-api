import express from "express";
import dotenv from "dotenv";
import cors from "cors"
import helmet from "helmet";
import studentRoutes from "./routes/studentRoutes.js";
dotenv.config()

// started the express app
const app = express()
const PORT = 5000 || process.env.DEV_PORT

// middleware
app.use(cors())
app.use(helmet())
 

// api routes
app.use("/api/student", studentRoutes)

// app listening to requests
app.listen(PORT, (req,res) => {
    console.log(`server online @port -> ${PORT}`);
})