const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");
const { protect } = require("../middleware/authMiddleware");


// ---------------- GET MY NOTIFICATIONS ----------------
router.get("/", protect, async (req, res) => {
  const notifications = await Notification.find({
    user: req.user._id
  }).sort({ createdAt: -1 });

  res.json(notifications);
});


// ---------------- MARK AS READ ----------------
router.patch("/:id/read", protect, async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({ message: "Not found" });
  }

  if (notification.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not allowed" });
  }

  notification.isRead = true;
  await notification.save();

  res.json(notification);
});


// ---------------- MARK ALL AS READ ----------------
router.patch("/read-all", protect, async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true }
  );

  res.json({ message: "All marked as read" });
});

router.get("/unread-count", protect, async (req, res) => {
  const count = await Notification.countDocuments({
    user: req.user._id,
    isRead: false
  });

  res.json({ count });
});

module.exports = router;