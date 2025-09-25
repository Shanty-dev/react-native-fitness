import express   from "express";
import cloudinary from "../lib/cloudinary.js";
import Fitnast from "../models/Fitnast.js";
import User from "../models/User.js";
import protectRoute from "../middleware/auth.middleware.js";

const route = express.Router();

route.post("/" , protectRoute, async (req,res) => {
  try {

    const {title, load, reps, caption, rating, image} = req.body;
    if(!title || !load || !reps || !caption || !rating|| !image){
      return res.status(400).json({Message:"Please provide all filds"});
    }
    // uplode a image to couldinary
   const uploadRespone = await cloudinary.uploader.upload(image);
    const imageUrl = uploadRespone.secure_Url;
    //save into db
    const newFitnast = new Fitnast ({
      title, 
      load, 
      reps, 
      caption, 
      rating, 
      image: imageUrl,
      user: req.user._id,
    })  
    await newFitnast.save();
    res.status(201).json(newFitnast);

  } catch (error) {
    console.log("error Creating fitnast",error);
    res.status(500).json({Message: error.Message});
  }
});
// pages =infinite load
route.get("/", protectRoute, async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 2;
    const skip = (page - 1) * limit;

    const fitnast = await Fitnast.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username profileImage");

    const totalfitnast = await Fitnast.countDocuments();
    res.send({
      fitnast,
      currentPage: page,
      totalfitnast,
      totalPages: Math.ceil(totalfitnast / limit),
    });
  } catch (error) {
    console.log("Error in get all books route", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

route.get("/user", protectRoute, async (req,res) =>{
  try {
    const fitnast = await Fitnast.find({ user: req.user._id}).sort({ createdAt: -1});
    res.json(fitnast);
  } catch (error) {
    console.log("get user post error",error.message);
    res.status(500).json({message:"Server error"});
  }
});

route.delete("/:id" ,protectRoute, async (req,res) => {
  try {
    const fitnast = await Fitnast.findById(req.params.id);
    if(!fitnast)  return res.status(404).json({message:"Post not found"});
    // check if user is the creator of the fit
    if(fitnast.user.toString() !== req.user._id.toString())
      return res.status(401).json({message:"Unauthrization"});
    
    //deleted image from cloudniaryy as well
    if(fitnast.image && fitnast.image.includes("cloudinary")) {
      try {
        const publicId  = fitnast.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.log("Error deleted image from cloudninary", deleteError);
      }
    }

    await fitnast.deleteOne();

    res.json({message:"book deleted successfuly"})
  } catch (error) {
    console.log("Error deleting",error);
    res.status(500).json({message:"Internal server error"});
  }
});

export default route;