// const express = require("express");
// const router = express.Router();
// const User = require("../models/User");
// const Report = require("../models/Report");
// const AuditLog = require("../models/AuditLog");
// const transporter = require("../config/mailer");
// const { protect, authorize } = require("../middleware/authMiddleware");


// // ---------------- DASHBOARD ----------------
// router.get(
//   "/dashboard",
//   protect,
//   authorize("admin"),
//   (req, res) => {
//     res.json({ message: "Admin dashboard", user: req.user });
//   }
// );


// // ---------------- PENDING SECURITY ----------------
// router.get(
//   "/pending-security",
//   protect,
//   authorize("admin"),
//   async (req, res) => {
//     const users = await User.find({
//       role: "security",
//       isApproved: false
//     });

//     res.json(users);
//   }
// );


// // ---------------- APPROVE SECURITY ----------------
// router.patch(
//   "/approve-security/:id",
//   protect,
//   authorize("admin"),
//   async (req, res) => {
//     try {
//       const user = await User.findById(req.params.id);

//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }

//       const otp = Math.floor(100000 + Math.random() * 900000).toString();

//       user.isApproved = true;
//       user.approvalStatus = "approved";

//       user.approvalOtp = otp;
//       user.approvalOtpExpires = Date.now() + 10 * 60 * 1000;

//       user.isVerified = false;

//       await user.save();

//       await transporter.sendMail({
//         to: user.email,
//         subject: "Account Approved - Verify OTP",
//         text: `
//           Your account has been approved.

//           Your verification OTP is: ${otp}

//           This expires in 10 minutes.
//         `
//       });

//       res.json({
//         message: "User approved and OTP sent"
//       });

//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   }
// );

// // ---------------- REJECT SECURITY ----------------
// router.patch(
//   "/reject-security/:id",
//   protect,
//   authorize("admin"),
//   async (req, res) => {
//     const user = await User.findById(req.params.id);

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     user.isApproved = false;
//     user.approvalStatus = "rejected";

//     await user.save();

//     await transporter.sendMail({
//       to: user.email,
//       subject: "Account Rejected",
//       text: "Your application was rejected."
//     });

//     await AuditLog.create({
//       actor: req.user._id,
//       action: "REJECT_SECURITY",
//       targetUser: user._id,
//       ip: req.ip
//     });

//     res.json({ message: "User rejected" });
//   }
// );


// // ---------------- ASSIGN REPORT ----------------
// router.patch(
//   "/report/:id/assign",
//   protect,
//   authorize("admin"),
//   async (req, res) => {
//     const { securityId } = req.body;

//     const report = await Report.findById(req.params.id);

//     if (!report) {
//       return res.status(404).json({ message: "Report not found" });
//     }

//     report.assignedTo = securityId;
//     report.status = "assigned";

//     report.timeline.push({
//       status: "assigned",
//       updatedBy: req.user._id,
//       note: `Assigned to security ${securityId}`
//     });

//     await report.save();
//     await sendNotification({
//       req,
//       userId: securityId,
//       title: "New Assignment",
//       message: "You have been assigned a report",
//       type: "report_assigned",
//       metadata: { reportId: report._id }
//     });

//     const io = req.app.get("io");
//     io.to(securityId.toString()).emit("assigned-report", {
//       message: "You have been assigned a report",
//       report
//     });


//     await AuditLog.create({
//       actor: req.user._id,
//       action: "ASSIGN_REPORT",
//       targetUser: securityId,
//       metadata: { reportId: report._id },
//       ip: req.ip
//     });

//     res.json({ message: "Report assigned", report });
//   }
// );

// router.get(
//   "/user/:id",
//   protect,
//   authorize("admin"),
//   async (req, res) => {
//     const user = await User.findById(req.params.id).select("-password");

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.json(user);
//   }
// );

// router.get(
//   "/users",
//   protect,
//   authorize("admin"),
//   async (req, res) => {
//     const users = await User.find().select("-password");

//     res.json(users);
//   }
// );

// module.exports = router;

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Report = require("../models/Report");
const AuditLog = require("../models/AuditLog");
const transporter = require("../config/mailer");
const { protect, authorize } = require("../middleware/authMiddleware");
// ✅ Fixed: import sendNotification (was missing — caused crash on assign)
const { sendNotification } = require("../service/notificationService");


// ---------------- DASHBOARD ----------------
router.get(
  "/dashboard",
  protect,
  authorize("admin"),
  (req, res) => {
    res.json({ message: "Admin dashboard", user: req.user });
  }
);


// ---------------- PENDING SECURITY ----------------
router.get(
  "/pending-security",
  protect,
  authorize("admin"),
  async (req, res) => {
    const users = await User.find({
      role: "security",
      isApproved: false
    });

    res.json(users);
  }
);


// ---------------- APPROVE SECURITY ----------------
router.patch(
  "/approve-security/:id",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      user.isApproved = true;
      user.approvalStatus = "approved";
      user.approvalOtp = otp;
      user.approvalOtpExpires = Date.now() + 10 * 60 * 1000;
      user.isVerified = false;

      await user.save();

      await transporter.sendMail({
        to: user.email,
        subject: "Account Approved - Verify OTP",
        text: `
          Your account has been approved.

          Your verification OTP is: ${otp}

          This expires in 10 minutes.
        `
      });

      res.json({ message: "User approved and OTP sent" });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);


// ---------------- REJECT SECURITY ----------------
router.patch(
  "/reject-security/:id",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.isApproved = false;
      user.approvalStatus = "rejected";

      await user.save();

      await transporter.sendMail({
        to: user.email,
        subject: "Account Rejected",
        text: "Your application was rejected."
      });

      await AuditLog.create({
        actor: req.user._id,
        action: "REJECT_SECURITY",
        targetUser: user._id,
        ip: req.ip
      });

      res.json({ message: "User rejected" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);


// ---------------- ASSIGN REPORT ----------------
router.patch(
  "/report/:id/assign",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const { securityId } = req.body;

      const report = await Report.findById(req.params.id);

      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      report.assignedTo = securityId;
      report.status = "assigned";

      report.timeline.push({
        status: "assigned",
        updatedBy: req.user._id,
        note: `Assigned to security ${securityId}`
      });

      await report.save();

      // ✅ sendNotification is now properly imported above
      await sendNotification({
        req,
        userId: securityId,
        title: "New Assignment",
        message: "You have been assigned a report",
        type: "report_assigned",
        metadata: { reportId: report._id }
      });

      const io = req.app.get("io");
      io.to(securityId.toString()).emit("assigned-report", {
        message: "You have been assigned a report",
        report
      });

      await AuditLog.create({
        actor: req.user._id,
        action: "ASSIGN_REPORT",
        targetUser: securityId,
        metadata: { reportId: report._id },
        ip: req.ip
      });

      res.json({ message: "Report assigned", report });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);


// ---------------- GET SINGLE USER ----------------
router.get(
  "/user/:id",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);


// ---------------- GET ALL USERS ----------------
router.get(
  "/users",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const users = await User.find().select("-password");
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);


// ---------------- GET ALL REPORTS (admin view) ----------------
router.get(
  "/reports",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const reports = await Report.find()
        .populate("reporter", "name email")
        .populate("assignedTo", "name email badgeNumber")
        .sort({ createdAt: -1 });

      res.json(reports);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;