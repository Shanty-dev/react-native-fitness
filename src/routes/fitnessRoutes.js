import express from "express";
import asyncHandler from 'express-async-handler';
import cloudinary from "../lib/cloudinary.js";
import Fitness from "../models/Fitness.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// --- Controllers for each route ---

// POST /api/fitness
const createFitnessPost = asyncHandler(async (req, res) => {
  const { title, caption, rating, image } = req.body;

  if (!image || !title || !caption || !rating) {
    res.status(400);
    throw new Error("Please provide all fields");
  }

  // upload the image to cloudinary
  const uploadResponse = await cloudinary.uploader.upload(image);
  const imageUrl = uploadResponse.secure_url;

  // save to the database
  const newFitness = new Fitness({
    title,
    caption,
    rating,
    image: imageUrl,
    user: req.user._id,
  });

  await newFitness.save();

  res.status(201).json(newFitness);
});

// GET /api/fitness (pagination and infinite loading)
const getAllFitnessPosts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 2;
  const skip = (page - 1) * limit;

  const [fitnessPosts, totalFitness] = await Promise.all([
    Fitness.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username profileImage"),
    Fitness.countDocuments(),
  ]);

  res.send({
    fitness: fitnessPosts,
    currentPage: page,
    totalFitness,
    totalPages: Math.ceil(totalFitness / limit),
  });
});

// GET /api/fitness/user (recommended posts by the logged-in user)
const getUserFitnessPosts = asyncHandler(async (req, res) => {
  const fitnessPosts = await Fitness.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(fitnessPosts);
});

// DELETE /api/fitness/:id
const deleteFitnessPost = asyncHandler(async (req, res) => {
  const fitnessPost = await Fitness.findById(req.params.id);

  if (!fitnessPost) {
    res.status(404);
    throw new Error("Post not found");
  }

  // Check if user is the creator of the post
  if (fitnessPost.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized to delete this post");
  }

  // Delete image from cloudinary if it exists
  if (fitnessPost.image && fitnessPost.image.includes("cloudinary")) {
    try {
      const publicId = fitnessPost.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    } catch (deleteError) {
      console.error("Error deleting image from Cloudinary:", deleteError);
      // We can choose to continue even if cloudinary deletion fails
    }
  }

  await fitnessPost.deleteOne();

  res.json({ message: "Post deleted successfully" });
});

// --- Route definitions using controllers ---
router.post("/", protectRoute, createFitnessPost);
router.get("/", protectRoute, getAllFitnessPosts);
router.get("/user", protectRoute, getUserFitnessPosts);
router.delete("/:id", protectRoute, deleteFitnessPost);

export default router;
