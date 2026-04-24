const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,

  email: {
    type: String,
    unique: true,
    sparse: true
  },

  badgeNumber: {
    type: String,
    unique: true,
    sparse: true
  },

  department: String,
  rank: String,

  role: {
    type: String,
    enum: ["reporter", "security", "admin"],
    required: true
  },

  password: {
    type: String,
    required: true
  },

  isVerified: { type: Boolean, default: false },
  otp: String,
  otpExpires: Date,

  resetToken: String,
  resetTokenExpires: Date,

  isApproved: {
    type: Boolean,
    default: function () {
      // reporters are auto-approved, security needs approval
      return this.role === "reporter";
    }
  },
  
  approvalStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  approvalOtp: String,
  approvalOtpExpires: Date
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);