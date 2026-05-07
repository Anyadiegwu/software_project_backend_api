const express = require("express");
const router = express.Router();
const TownHall = require("../models/Townhall");
const Notification = require("../models/Notification");
const { protect, authorize } = require("../middleware/authMiddleware");

// ---------------- GET UPCOMING TOWN HALLS ----------------
router.get(
  "/upcoming",
  protect,
  async (req, res) => {
    try {
      const townHalls = await TownHall.find({
        status: "upcoming",
        isActive: true
      })
      .populate("attendees.user", "name")
      .sort({ date: 1 });
      
      res.json(townHalls);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ---------------- GET PAST TOWN HALLS ----------------
router.get(
  "/past",
  protect,
  async (req, res) => {
    try {
      const townHalls = await TownHall.find({
        status: "completed",
        isActive: true
      })
      .populate("attendees.user", "name")
      .sort({ date: -1 })
      .limit(10);
      
      res.json(townHalls);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ---------------- GET TOWN HALL BY ID ----------------
router.get(
  "/:id",
  protect,
  async (req, res) => {
    try {
      const townHall = await TownHall.findById(req.params.id)
        .populate("attendees.user", "name email");
      
      if (!townHall) {
        return res.status(404).json({ message: "Town hall not found" });
      }
      
      res.json(townHall);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ---------------- REGISTER FOR TOWN HALL (RSVP) ----------------
router.post(
  "/:id/register",
  protect,
  async (req, res) => {
    try {
      const townHall = await TownHall.findById(req.params.id);
      
      if (!townHall) {
        return res.status(404).json({ message: "Town hall not found" });
      }
      
      if (townHall.status !== "upcoming") {
        return res.status(400).json({ message: "Town hall is not upcoming" });
      }
      
      // Check if user already registered
      const alreadyRegistered = townHall.attendees.some(
        a => a.user.toString() === req.user._id.toString()
      );
      
      if (alreadyRegistered) {
        return res.status(400).json({ message: "Already registered" });
      }
      
      // Check max attendees
      if (townHall.maxAttendees && townHall.attendees.length >= townHall.maxAttendees) {
        return res.status(400).json({ message: "Town hall is full" });
      }
      
      townHall.attendees.push({ user: req.user._id });
      await townHall.save();
      
      // Send notification
      await Notification.create({
        user: req.user._id,
        title: "Town Hall Registration Confirmed",
        message: `You're registered for "${townHall.title}" on ${new Date(townHall.date).toLocaleDateString()}`,
        type: "system",
        metadata: { townHallId: townHall._id }
      });
      
      // Return updated town hall with attendee count
      const updated = await TownHall.findById(req.params.id)
        .populate("attendees.user", "name");
      
      res.json({ 
        message: "Successfully registered", 
        townHall: updated,
        attendeeCount: updated.attendees.length
      });
      
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ---------------- UNREGISTER FROM TOWN HALL ----------------
router.post(
  "/:id/unregister",
  protect,
  async (req, res) => {
    try {
      const townHall = await TownHall.findById(req.params.id);
      
      if (!townHall) {
        return res.status(404).json({ message: "Town hall not found" });
      }
      
      townHall.attendees = townHall.attendees.filter(
        a => a.user.toString() !== req.user._id.toString()
      );
      
      await townHall.save();
      
      const updated = await TownHall.findById(req.params.id)
        .populate("attendees.user", "name");
      
      res.json({ 
        message: "Successfully unregistered", 
        townHall: updated 
      });
      
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ---------------- CHECK REGISTRATION STATUS ----------------
router.get(
  "/:id/registration-status",
  protect,
  async (req, res) => {
    try {
      const townHall = await TownHall.findById(req.params.id);
      
      if (!townHall) {
        return res.status(404).json({ message: "Town hall not found" });
      }
      
      const isRegistered = townHall.attendees.some(
        a => a.user.toString() === req.user._id.toString()
      );
      
      res.json({ 
        isRegistered,
        attendeeCount: townHall.attendees.length,
        maxAttendees: townHall.maxAttendees
      });
      
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ---------------- ADMIN: CREATE TOWN HALL ----------------
router.post(
  "/",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const townHall = await TownHall.create({
        ...req.body,
        createdBy: req.user._id
      });
      
      // Notify all verified users about new town hall
      const User = require("../models/User");
      const users = await User.find({ 
        isVerified: true,
        role: { $in: ["reporter", "security"] }
      });
      
      for (const user of users) {
        await Notification.create({
          user: user._id,
          title: "New Town Hall Scheduled",
          message: `"${townHall.title}" scheduled for ${new Date(townHall.date).toLocaleDateString()}`,
          type: "system",
          metadata: { townHallId: townHall._id }
        });
      }
      
      // Emit socket event
      const io = req.app.get("io");
      io.emit("new-town-hall", { townHall });
      
      res.status(201).json(townHall);
      
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ---------------- ADMIN: UPDATE TOWN HALL ----------------
router.patch(
  "/:id",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const townHall = await TownHall.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate("attendees.user", "name");
      
      if (!townHall) {
        return res.status(404).json({ message: "Town hall not found" });
      }
      
      res.json(townHall);
      
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ---------------- ADMIN: ADD SUMMARY ----------------
router.patch(
  "/:id/summary",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const { summary, summaryFileUrl } = req.body;
      
      const townHall = await TownHall.findById(req.params.id);
      
      if (!townHall) {
        return res.status(404).json({ message: "Town hall not found" });
      }
      
      townHall.summary = summary;
      if (summaryFileUrl) townHall.summaryFileUrl = summaryFileUrl;
      townHall.status = "completed";
      
      await townHall.save();
      
      res.json({ message: "Summary added", townHall });
      
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ---------------- ADMIN: DELETE TOWN HALL ----------------
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const townHall = await TownHall.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );
      
      if (!townHall) {
        return res.status(404).json({ message: "Town hall not found" });
      }
      
      res.json({ message: "Town hall removed" });
      
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;