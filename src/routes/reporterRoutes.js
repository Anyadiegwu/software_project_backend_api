// router.get(
//   "/alerts",
//   protect,
//   authorize("reporter"),
//   async (req, res) => {
//     const Alert = require("../models/Alert");

//     const alerts = await Alert.find({ isActive: true });

//     res.json(alerts);
//   }
// );

// router.post(
//   "/distress",
//   protect,
//   authorize("reporter"),
//   async (req, res) => {
//     const Report = require("../models/Report");

//     const report = await Report.create({
//       reporter: req.user._id,
//       type: "emergency",
//       category: "suspicious_activity",
//       urgency: "critical",
//       description: "DISTRESS SIGNAL ACTIVATED",
//       status: "pending",
//       isActive: true
//     });

//     res.json({
//       message: "Distress signal sent",
//       report
//     });
//   }
// );

// router.post(
//   "/report",
//   protect,
//   authorize("reporter"),
//   async (req, res) => {
//     const Report = require("../models/Report");

//     const {
//       type,
//       category,
//       urgency,
//       description,
//       suspectsCount,
//       vehicles,
//       weapons,
//       location
//     } = req.body;

//     const report = await Report.create({
//       reporter: req.user._id,
//       type,
//       category,
//       urgency,
//       description,
//       suspectsCount,
//       vehicles,
//       weapons,
//       location
//     });

//     res.status(201).json({
//       message: "Report submitted successfully",
//       report
//     });
//   }
// );

// router.get(
//   "/my-reports",
//   protect,
//   authorize("reporter"),
//   async (req, res) => {
//     const Report = require("../models/Report");

//     const reports = await Report.find({
//       reporter: req.user._id
//     }).sort({ createdAt: -1 });

//     res.json(reports);
//   }
// );

// router.get(
//   "/community-watch",
//   protect,
//   authorize("reporter"),
//   async (req, res) => {
//     const Report = require("../models/Report");

//     const reports = await Report.find({
//       isActive: true
//     }).sort({ createdAt: -1 });

//     res.json(reports);
//   }
// );

// router.get(
//   "/analytics",
//   protect,
//   authorize("reporter"),
//   async (req, res) => {
//     const Report = require("../models/Report");

//     const total = await Report.countDocuments({
//       reporter: req.user._id
//     });

//     const pending = await Report.countDocuments({
//       reporter: req.user._id,
//       status: "pending"
//     });

//     const underReview = await Report.countDocuments({
//       reporter: req.user._id,
//       status: "under_review"
//     });

//     const inProgress = await Report.countDocuments({
//         reporter: req.user._id,
//         status: "in_progress"
//     });

//     const assigned = await Report.countDocuments({
//         reporter: req.user._id,
//         status: "assigned"
//     });

//     const resolved = await Report.countDocuments({
//       reporter: req.user._id,
//       status: "resolved"
//     });

//     res.json({
//       total,
//       pending,
//       underReview,
//       resolved
//     });
//   }
// );

// router.get(
//   "/report/:id/timeline",
//   protect,
//   authorize("reporter", "admin", "security"),
//   async (req, res) => {
//     const Report = require("../models/Report");

//     const report = await Report.findById(req.params.id)
//       .populate("timeline.updatedBy", "name role");

//     if (!report) {
//       return res.status(404).json({ message: "Report not found" });
//     }

//     res.json(report.timeline);
//   }
// );

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { sendNotification } = require("../service/notificationService");
const Report = require("../models/Report");
const Alert = require("../models/Alert");
const { protect, authorize } = require("../middleware/authMiddleware");


// ---------------- ALERTS ----------------
router.get(
  "/alerts",
  protect,
  authorize("reporter"),
  async (req, res) => {
    const alerts = await Alert.find({ isActive: true });
    res.json(alerts);
  }
);


// ---------------- DISTRESS ----------------
router.post(
  "/distress",
  protect,
  authorize("reporter"),
  async (req, res) => {
    try {
      // 1. CREATE REPORT
      const report = await Report.create({
        reporter: req.user._id,
        type: "emergency",
        category: "suspicious_activity",
        urgency: "critical",
        description: "DISTRESS SIGNAL ACTIVATED"
      });

      // 2. FIND ALL ADMINS
      const admins = await User.find({ role: "admin" });

      // 3. SEND NOTIFICATIONS (THIS IS YOUR BLOCK)
      for (const admin of admins) {
        await sendNotification({
          req,
          userId: admin._id,
          title: "🚨 Distress Alert",
          message: "A distress signal was triggered",
          type: "distress",
          metadata: { reportId: report._id }
        });
      }

      // 4. SEND RESPONSE
      res.json({
        message: "Distress signal sent",
        report
      });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ---------------- CREATE REPORT ----------------
router.post(
  "/report",
  protect,
  authorize("reporter"),
  async (req, res) => {
    const report = await Report.create({
      reporter: req.user._id,
      ...req.body
    });
    const io = req.app.get("io");

    io.emit("new-report", {
      message: "New incident reported",
      report
    });
    res.status(201).json(report);
  }
);


// ---------------- MY REPORTS ----------------
router.get(
  "/my-reports",
  protect,
  authorize("reporter"),
  async (req, res) => {
    const reports = await Report.find({
      reporter: req.user._id
    }).sort({ createdAt: -1 });

    res.json(reports);
  }
);


// ---------------- COMMUNITY WATCH ----------------
router.get(
  "/community-watch",
  protect,
  authorize("reporter"),
  async (req, res) => {
    const reports = await Report.find({ isActive: true });
    res.json(reports);
  }
);


// ---------------- ANALYTICS ----------------
router.get(
  "/analytics",
  protect,
  authorize("reporter"),
  async (req, res) => {
    const base = { reporter: req.user._id };

    const total = await Report.countDocuments(base);
    const pending = await Report.countDocuments({ ...base, status: "pending" });
    const underReview = await Report.countDocuments({ ...base, status: "under_review" });
    const inProgress = await Report.countDocuments({ ...base, status: "in_progress" });
    const assigned = await Report.countDocuments({ ...base, status: "assigned" });
    const resolved = await Report.countDocuments({ ...base, status: "resolved" });

    res.json({
      total,
      pending,
      underReview,
      inProgress,
      assigned,
      resolved
    });
  }
);


// ---------------- TIMELINE (SECURE) ----------------
router.get(
  "/report/:id/timeline",
  protect,
  authorize("reporter"),
  async (req, res) => {
    const report = await Report.findById(req.params.id)
      .populate("timeline.updatedBy", "name role");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // ownership check
    if (report.reporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    res.json(report.timeline);
  }
);


module.exports = router;