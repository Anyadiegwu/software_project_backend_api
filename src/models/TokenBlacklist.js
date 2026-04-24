const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  token: String,
  expiresAt: Date
});

module.exports = mongoose.model("TokenBlacklist", schema);