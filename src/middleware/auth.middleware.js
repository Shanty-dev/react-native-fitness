import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protectRoute = async (req,res,next) => {
  try {
    //get token
    const token =req.header("Authorization").replace("Bearer ","");
    if(!token)  return res.status(401).json({Message:"NO Authorization token, access denaied"});

    //verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //find user
    const user = await User.findById(decoded.userId).select(("-password"));
    if(!user) return res.status(401).json({Message:"Token is not valid"});

    req.user =user;
    next();

    
  } catch (error) {
    console.error("Authorization error:", error.Message);
    res.status(401).json({Message: "Token is not vaild"});
  }
};
export default protectRoute;