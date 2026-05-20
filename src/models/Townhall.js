const mongoose = require("mongoose");

const townHallSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    
    description: {
      type: String,
      required: true
    },
    
    location: {
      type: String,
      required: true
    },
    
    date: {
      type: Date,
      required: true
    },
    
    startTime: {
      type: String,
      required: true
    },
    
    endTime: {
      type: String
    },
    
    status: {
      type: String,
      enum: ["upcoming", "live", "completed", "cancelled"],
      default: "upcoming"
    },
    
    type: {
      type: String,
      enum: ["physical", "online", "hybrid"],
      default: "physical"
    },
    
    onlineLink: {
      type: String
    },
    
    maxAttendees: {
      type: Number
    },
    
    attendees: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        registeredAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    
    summary: {
      type: String
    },
    
    summaryFileUrl: {
      type: String
    },
    
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("TownHall", townHallSchema);