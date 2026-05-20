const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { sendNotification } = require("../service/notificationService");
const Report = require("../models/Report");
const Alert = require("../models/Alert");
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../config/uploader");

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
// router.post(
//   "/distress",
//   protect,
//   authorize("reporter"),
//   async (req, res) => {
//     try {
//       const report = await Report.create({
//         reporter: req.user._id,
//         type: "emergency",
//         category: "suspicious_activity",
//         urgency: "critical",
//         description: "DISTRESS SIGNAL ACTIVATED"
//       });

//       const admins = await User.find({ role: "admin" });

//       for (const admin of admins) {
//         await sendNotification({
//           req,
//           userId: admin._id,
//           title: "🚨 Distress Alert",
//           message: "A distress signal was triggered",
//           type: "distress",
//           metadata: { reportId: report._id }
//         });
//       }

//       res.json({
//         message: "Distress signal sent",
//         report
//       });

//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   }
// );

// ---------------- DISTRESS ----------------
router.post(
  "/distress",
  protect,
  authorize("reporter"),
  async (req, res) => {
    try {
      const report = await Report.create({
        reporter: req.user._id,
        type: "emergency",
        category: "suspicious_activity",
        urgency: "critical",
        description: "DISTRESS SIGNAL ACTIVATED"
      });

      // Find all admins AND security officers
      const admins = await User.find({ role: "admin" });
      const securityOfficers = await User.find({ 
        role: "security", 
        isApproved: true, 
        isVerified: true 
      });

      // Notify all admins
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

      // Notify all verified security officers
      for (const officer of securityOfficers) {
        await sendNotification({
          req,
          userId: officer._id,
          title: "🚨 SOS Emergency",
          message: "A citizen has triggered a distress signal. Immediate response required.",
          type: "distress",
          metadata: { reportId: report._id }
        });
      }

      // Emit socket event to all security officers
      const io = req.app.get("io");
      for (const officer of securityOfficers) {
        io.to(officer._id.toString()).emit("new-distress", {
          message: "🚨 SOS Emergency Alert",
          report
        });
      }

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
    try {
      const {
        type,
        category,
        urgency,
        description,
        suspectsCount,
        vehicles,
        weapons,
        location,
        isAnonymous,  // ← now accepted from frontend
      } = req.body;

      const report = await Report.create({
        reporter: req.user._id,
        type,
        category,
        urgency,
        description,
        suspectsCount,
        vehicles,
        weapons,
        location,
        isAnonymous: isAnonymous || false,
      });

      // Notify all admins of new report
      const admins = await User.find({ role: "admin" });
      for (const admin of admins) {
        await sendNotification({
          req,
          userId: admin._id,
          title: "New Report",
          message: `A new ${type} report has been submitted`,
          type: "system",
          metadata: { reportId: report._id }
        });
      }

      const io = req.app.get("io");
      io.emit("new-report", {
        message: "New incident reported",
        report
      });

      res.status(201).json(report);

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);
router.post(
  "/report/:id/evidence",
  protect,
  authorize("reporter"),
  upload.array("files", 5),          // max 5 files per upload
  async (req, res) => {
    try {
      const report = await Report.findById(req.params.id);

      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Only the reporter who created it can add evidence
      if (report.reporter.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not allowed" });
      }

      // req.files is populated by multer — each file has a .path (Cloudinary URL)
      const urls = req.files.map(file => file.path);

      report.evidence.push(...urls);
      await report.save();

      res.json({ message: "Evidence uploaded", evidence: report.evidence });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
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
// Accepts optional ?lat=&lng= query params to filter by 5km radius.
// Falls back to all active reports if no coords are provided.
// Anonymous reports have their reporter field stripped from the response.
// router.get(
//   "/community-watch",
//   protect,
//   authorize("reporter"),
//   async (req, res) => {
//     try {
//       const { lat, lng } = req.query;

//       let reports;

//       if (!lat || !lng) {
//         // No coords — return all active reports
//         reports = await Report.find({ isActive: true })
//           .populate("reporter", "name");
//       } else {
//         const userLat = parseFloat(lat);
//         const userLng = parseFloat(lng);

//         // Rough bounding box (~5km) to reduce DB scan
//         const delta = 0.045;

//         const candidates = await Report.find({
//           isActive: true,
//           "location.lat": { $gte: userLat - delta, $lte: userLat + delta },
//           "location.lng": { $gte: userLng - delta, $lte: userLng + delta },
//         }).populate("reporter", "name");

//         // Precise Haversine filter to enforce exact 5km circle
//         const RADIUS_KM = 5;

//         reports = candidates.filter(report => {
//           if (!report.location?.lat || !report.location?.lng) return false;

//           const R = 6371;
//           const dLat = ((report.location.lat - userLat) * Math.PI) / 180;
//           const dLng = ((report.location.lng - userLng) * Math.PI) / 180;
//           const a =
//             Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//             Math.cos((userLat * Math.PI) / 180) *
//             Math.cos((report.location.lat * Math.PI) / 180) *
//             Math.sin(dLng / 2) * Math.sin(dLng / 2);
//           const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//           const distance = R * c;

//           return distance <= RADIUS_KM;
//         });
//       }

//       // Strip reporter identity for anonymous reports before sending to client
//       const sanitized = reports.map(report => {
//         const obj = report.toObject();
//         if (obj.isAnonymous) {
//           obj.reporter = { name: "Anonymous" };
//         }
//         return obj;
//       });

//       res.json(sanitized);

//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   }
// );

// ---------------- COMMUNITY WATCH ----------------
// Accepts optional ?lat=&lng= query params to filter by 5km radius.
// Falls back to all active reports if no coords are provided.
// Anonymous reports have their reporter field stripped from the response.
router.get(
  "/community-watch",
  protect,
  authorize("reporter"),
  async (req, res) => {
    try {
      const { lat, lng } = req.query;

      let reports;

      if (!lat || !lng) {
        // No coords — return all active reports
        reports = await Report.find({ isActive: true })
          .populate("reporter", "name");
      } else {
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);

        // Rough bounding box (~5km) to reduce DB scan
        const delta = 0.045;

        const candidates = await Report.find({
          isActive: true,
          "location.lat": { $gte: userLat - delta, $lte: userLat + delta },
          "location.lng": { $gte: userLng - delta, $lte: userLng + delta },
        }).populate("reporter", "name");

        // Precise Haversine filter to enforce exact 5km circle
        const RADIUS_KM = 5;

        reports = candidates.filter(report => {
          if (!report.location?.lat || !report.location?.lng) return false;

          const R = 6371;
          const dLat = ((report.location.lat - userLat) * Math.PI) / 180;
          const dLng = ((report.location.lng - userLng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((userLat * Math.PI) / 180) *
            Math.cos((report.location.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          return distance <= RADIUS_KM;
        });
      }

      // Strip reporter identity for anonymous reports before sending to client
      const sanitized = reports.map(report => {
        const obj = report.toObject();
        if (obj.isAnonymous) {
          obj.reporter = { name: "Anonymous" };
        }
        return obj;
      });

      res.json(sanitized);

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
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

    if (report.reporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    res.json(report.timeline);
  }
);

// ---------------- SAFETY MAP ----------------
// Returns all active reports with location data for the map view.
// Accepts optional ?lat=&lng= query params to filter by 10km radius.
router.get(
  "/safety-map",
  protect,
  authorize("reporter"),
  async (req, res) => {
    try {
      const { lat, lng } = req.query;

      let reports;

      if (!lat || !lng) {
        // No coords — return all active reports with location
        reports = await Report.find({ 
          isActive: true,
          "location.lat": { $exists: true },
          "location.lng": { $exists: true }
        })
        .select("type category urgency description location status createdAt isAnonymous")
        .populate("reporter", "name")
        .sort({ createdAt: -1 })
        .limit(50);
      } else {
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);

        // Rough bounding box (~10km) to reduce DB scan
        const delta = 0.09;

        const candidates = await Report.find({
          isActive: true,
          "location.lat": { $gte: userLat - delta, $lte: userLat + delta },
          "location.lng": { $gte: userLng - delta, $lte: userLng + delta },
        })
        .select("type category urgency description location status createdAt isAnonymous")
        .populate("reporter", "name")
        .sort({ createdAt: -1 })
        .limit(50);

        // Precise Haversine filter to enforce exact 10km circle
        const RADIUS_KM = 10;

        reports = candidates.filter(report => {
          if (!report.location?.lat || !report.location?.lng) return false;

          const R = 6371;
          const dLat = ((report.location.lat - userLat) * Math.PI) / 180;
          const dLng = ((report.location.lng - userLng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((userLat * Math.PI) / 180) *
            Math.cos((report.location.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          return distance <= RADIUS_KM;
        });
      }

      // Format for map consumption
      const pins = reports.map(report => {
        const obj = report.toObject();
        
        // Determine pin type based on urgency/status
        let pinType = 'alerts';
        let pinColor = '#FFB347';
        
        if (obj.urgency === 'critical' || obj.urgency === 'high') {
          pinType = 'high_risk';
          pinColor = '#FF4B4B';
        } else if (obj.status === 'resolved') {
          pinType = 'resolved';
          pinColor = '#45D0B1';
        } else if (obj.urgency === 'medium') {
          pinType = 'alerts';
          pinColor = '#FFB347';
        }

        // Strip reporter identity for anonymous reports
        if (obj.isAnonymous) {
          obj.reporter = { name: "Anonymous" };
        }

        return {
          id: obj._id,
          latitude: obj.location.lat,
          longitude: obj.location.lng,
          type: pinType,
          color: pinColor,
          title: obj.description ? obj.description.slice(0, 60) : obj.category || 'Incident',
          category: obj.category,
          urgency: obj.urgency,
          status: obj.status,
          address: obj.location.address || 'Unknown location',
          createdAt: obj.createdAt,
          reporter: obj.reporter?.name || 'Unknown',
          isAnonymous: obj.isAnonymous,
        };
      });

      res.json(pins);

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);


module.exports = router;