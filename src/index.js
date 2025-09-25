import express from "express";
import "dotenv/config";
import authRoutes from "./routes/authRoutes.js";
import fitnastRoutes from "./routes/fitnastRoutes.js"
import { connectDB } from "./lib/db.js"; 
import cors from "cors";
import job from "./lib/cors.js";

const app= express();
const PORT = process.env.PORT || 3000; 

job.start();
app.use(express.json()); //midlerwaere
app.use(cors.json()); //midlerware

app.use("/api/auth",authRoutes);
app.use("/api/fit",fitnastRoutes);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
