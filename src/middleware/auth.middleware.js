import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ Message: "No Authorization token, access denied" });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ Message: "Token is not valid" });

    req.user = user;
    next();
  } catch (error) {
    console.error("Authorization error:", error.message);
    res.status(401).json({ Message: "Token is not valid" });
  }
};


export default protectRoute;