import express from "express";
import "dotenv/config";
import authRoutes from "./routes/authRoutes.js";
import fitnessRoutes from "./routes/fitnessRoutes.js";
import fitnastRouter from "./routes/fitnastRoutes.js";
import { connectDB } from "./lib/db.js";
import cors from "cors";
import job from "./lib/cors.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON bodies with a 10mb size limit
app.use(express.json({ limit: '10mb' }));

// Middleware for enabling Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Assuming this is a scheduled job and should be started once
job.start(); 

// Route handlers
app.use("/api/auth", authRoutes);
app.use("/api/fitness", fitnessRoutes);
app.use("/api/fitnast", fitnastRouter);

// Start the server and connect to the database
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
