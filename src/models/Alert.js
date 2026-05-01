const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  title: String,
  message: String,

  type: {
    type: String,
    enum: ["crime", "emergency", "warning"]
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Alert", alertSchema);