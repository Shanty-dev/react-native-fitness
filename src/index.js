import express from "express";
import "dotenv/config";
import authRoutes from "./routes/authRoutes.js";
import fitnastRoutes from "./routes/fitnastRoutes.js";
import fitnessRoutes from "./models/Fitness.js";
import { connectDB } from "./lib/db.js"; 
import cors from "cors";
import job from "./lib/cors.js";

const app= express();
const PORT = process.env.PORT || 3000; 

job.start();
app.use(express.json()); //midlerwaere
app.use(cors()); //midlerware
app.use(express.json({ limit: '10mb' }));



app.use("/api/auth", authRoutes);
app.use("/api/fitnast", fitnastRoutes);
app.use("/api/fitnesss",fitnessRoutes);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});