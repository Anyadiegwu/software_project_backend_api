const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  type: {
    type: String,
    enum: ["crime", "incident", "emergency"],
    required: true
  },

  category: {
    type: String,
    enum: [
      "theft",
      "assault",
      "kidnapping",
      "robbery",
      "accident",
      "fire",
      "suspicious_activity",
      "other"
    ]
  },

  urgency: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "medium"
  },

  description: String,

  suspectsCount: Number,

  vehicles: String,

  weapons: String,

  location: {
    lat: Number,
    lng: Number,
    address: String
  },

  status: {
    type: String,
    enum: [
        "pending",
        "under_review",
        "assigned",
        "in_progress",
        "resolved",
        "rejected"
    ],
    default: "pending"
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
    },

    timeline: [
    {
        status: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: String,
        date: { type: Date, default: Date.now }
    }
    ],

  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Report", reportSchema);