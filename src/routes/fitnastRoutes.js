import express from "express";
import cloudinary from "../lib/cloudinary.js";
import Fitnast from "../models/Fitnast.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// 📌 Create a new Fitnast post
router.post("/api/fitnast", protectRoute, async (req, res) => {
  try {
    const { title, caption, rating, image } = req.body;

    if (!image || !title || !caption || !rating) {
      return res.status(400).json({ message: "Please provide all fields" });
    }

    // upload the image to cloudinary
    const uploadResponse = await cloudinary.uploader.upload(image);
    const imageUrl = uploadResponse.secure_url;

    // save to the database
    const newFitnast = new Fitnast({
      title,
      caption,
      rating,
      image: imageUrl,
      user: req.user._id,
    });

    await newFitnast.save();

    res.status(201).json(newFitnast);
  } catch (error) {
    console.log("Error creating post", error);
    res.status(500).json({ message: error.message });
  }
  });

// 📄 Get paginated Fitnast posts
router.get("/", protectRoute, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 2;
    const skip = (page - 1) * limit;

    const fitnast = await Fitnast.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username profileImage");

    const totalFitnast = await Fitnast.countDocuments();

    res.json({
      fitnast,
      currentPage: page,
      totalFitnast,
      totalPages: Math.ceil(totalFitnast / limit),
    });
  } catch (error) {
    console.error("Error fetching Fitnast posts:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 👤 Get posts by logged-in user
router.get("/user", protectRoute, async (req, res) => {
  try {
    const fitnast = await Fitnast.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(fitnast);
  } catch (error) {
    console.error("Error fetching user posts:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// 🗑️ Delete a Fitnast post
router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const fitnast = await Fitnast.findById(req.params.id);
    if (!fitnast) {
      return res.status(404).json({ message: "Post not found" });
    }

    // 🔐 Check if user is the creator
    if (fitnast.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 🧹 Delete image from Cloudinary
    if (fitnast.image && fitnast.image.includes("cloudinary")) {
      try {
        const publicId = fitnast.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.error("Error deleting image from Cloudinary:", deleteError.message);
      }
    }

    await fitnast.deleteOne();
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
