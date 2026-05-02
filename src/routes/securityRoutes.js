const express = require("express");
const router = express.Router();
const Report = require("../models/Report");
const AuditLog = require("../models/AuditLog");
const { protect, authorize } = require("../middleware/authMiddleware");


// ---------------- START REPORT ----------------
router.patch(
  "/report/:id/start",
  protect,
  authorize("security"),
  async (req, res) => {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (report.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not assigned to you" });
    }

    report.status = "in_progress";

    report.timeline.push({
      status: "in_progress",
      updatedBy: req.user._id,
      note: "Security started handling this case"
    });

    await report.save();
    await sendNotification({
      req,
      userId: report.reporter,
      title: "Report Update",
      message: "Your report is being handled",
      type: "report_started",
      metadata: { reportId: report._id }
    });
    const io = req.app.get("io");

    io.to(report.reporter.toString()).emit("report-started", {
      message: "Your report is now being handled",
      report
    });

    await AuditLog.create({
      actor: req.user._id,
      action: "START_REPORT",
      metadata: { reportId: report._id },
      ip: req.ip
    });

    res.json({ message: "Report started", report });
  }
);


// ---------------- RESOLVE REPORT ----------------
router.patch(
  "/report/:id/resolve",
  protect,
  authorize("security"),
  async (req, res) => {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (report.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not assigned to you" });
    }

    report.status = "resolved";

    report.timeline.push({
      status: "resolved",
      updatedBy: req.user._id,
      note: "Issue resolved"
    });

    await report.save();
    await sendNotification({
      req,
      userId: report.reporter,
      title: "Report Resolved",
      message: "Your report has been resolved",
      type: "report_resolved",
      metadata: { reportId: report._id }
    });

    const io = req.app.get("io");

    io.to(report.reporter.toString()).emit("report-resolved", {
      message: "Your report has been resolved",
      report
    });

    await AuditLog.create({
      actor: req.user._id,
      action: "RESOLVE_REPORT",
      metadata: { reportId: report._id },
      ip: req.ip
    });

    res.json({ message: "Report resolved", report });
  }
);


// ---------------- GET REPORT TIMELINE ----------------
router.get(
  "/report/:id/timeline",
  protect,
  authorize("security"),
  async (req, res) => {
    const report = await Report.findById(req.params.id)
      .populate("timeline.updatedBy", "name role");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json(report.timeline);
  }
);

router.get(
  "/report/:id/details",
  protect,
  authorize("security"),
  async (req, res) => {
    const Report = require("../models/Report");

    const report = await Report.findById(req.params.id)
      .populate("reporter", "name email");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // ensure it's assigned to this security
    if (report.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    res.json(report);
  }
);

module.exports = router;