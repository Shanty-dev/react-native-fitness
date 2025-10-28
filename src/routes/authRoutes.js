import express, { Router } from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const generateToken = (userId) =>{
 return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15d" });

}

router.post("/register", async(req,res) =>{
  try {
    const {email, username, password} = req.body;

    if(!username || !email || !password) {
      return res.status(400).json({message :"All fields must be fill"});
    }
    if(password.length <7 ){
      return res.status(400).json({message :"Password should be least 7 chareacters "});
    }
    if(username.length < 3 ){
      return res.status(400).json({message :"Username should be least 3 chareacters long "});
    }
    //check if user already exists
    const existingEmail = await User.findOne({email});
    if(existingEmail) {return res.status(400).json({message:"Email already exist"});
    }
    const existingUser = await User.findOne({username});
    if(existingUser) {return res.status(400).json({message:"User already exist"});
    }
    //get a rendam avatar
    const profileImage =`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
    const user = new User({
      email,  
      username,
      password,
      profileImage, 
    });
    await user.save();

    const token = generateToken(user._id)
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.log("error in  register route",error);
    res.status(500).json({message:"Internal server error"});
  }
});

router.post("/login", async(req,res) =>{
  try {
    const {email, password} =req.body;
    if  (!email || !password) 
      return res.status(400).json({message:"All Field are required"});
    //check if user exist
    const user =await User.findOne({email});
    if(!user) return res.status(400).json({message:"Invald credentials"});
    
    // check if password is correct
    const isPasswordCorrect = await user.comparePassword(password);
    if(!isPasswordCorrect) return res.status(400).json({message:"PInvald credentials"});
    //generate token
    const token = generateToken(user._id);
    res.status(200).json({
      token,
      user:{
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.log("error in login route",error);
    res.status(500).json({message:"Internal server error"});  
  }
});

export default router;