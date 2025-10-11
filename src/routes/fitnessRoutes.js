import express from "express";
import cloudinary from "../lib/cloudinary.js";
import Fitness from "../models/Fitness.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protectRoute, async (req, res) => {
  try {
    const { title, caption, rating, image } = req.body;

    if (!image || !title || !caption || !rating) {
      return res.status(400).json({ message: "Please provide all fields" });
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
  } catch (error) {
    console.log("Error creating post", error);
    res.status(500).json({ message: error.message });
  }
});

// pagination => infinite loading
router.get("/", protectRoute, async (req, res) => {
  // example call from react native - frontend
  // const response = await fetch("http://localhost:3000/api/books?page=1&limit=5");
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 2;
    const skip = (page - 1) * limit;

    const fitnesss = await Fitness.find()
      .sort({ createdAt: -1 }) // desc
      .skip(skip)
      .limit(limit)
      .populate("user", "username profileImage");

    const totalFitnesss = await Fitness.countDocuments();

    res.send({
      fitnesss,
      currentPage: page,
      totalFitnesss,
      totalPages: Math.ceil(totalFitnesss / limit),
    });
  } catch (error) {
    console.log("Error in get all fitness route", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// get recommended books by the logged in user
router.get("/user", protectRoute, async (req, res) => {
  try {
    const fitnesss = await Fitness.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(fitnesss);
  } catch (error) {
    console.error("Get user fitnesss error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const fitness = await Fitness.findById(req.params.id);
    if (!fitness) return res.status(404).json({ message: "post not found" });

    // check if user is the creator of the book
    if (fitness.user.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Unauthorized" });

    // https://res.cloudinary.com/de1rm4uto/image/upload/v1741568358/qyup61vejflxxw8igvi0.png
    // delete image from cloduinary as well
    if (fitness.image && fitness.image.includes("cloudinary")) {
      try {
        const publicId = fitness.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.log("Error deleting image from cloudinary", deleteError);
      }
    }

    await fitness.deleteOne();

    res.json({ message: "post deleted successfully" });
  } catch (error) {
    console.log("Error deleting post", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;