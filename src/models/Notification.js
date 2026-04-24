const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    title: String,
    message: String,

    type: {
      type: String,
      enum: [
        "report_assigned",
        "report_started",
        "report_resolved",
        "distress",
        "system"
      ]
    },

    isRead: {
      type: Boolean,
      default: false
    },

    metadata: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);