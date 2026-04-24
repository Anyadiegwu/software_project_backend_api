const express = require("express");
const router = express.Router();

const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");


// ---------------- GET MY PROFILE ----------------
router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  res.json(user);
});

router.patch("/me", protect, async (req, res) => {
  const updates = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true }
  ).select("-password");

  res.json(user);
});

module.exports = router;