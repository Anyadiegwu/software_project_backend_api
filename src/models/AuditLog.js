// const mongoose = require("mongoose");

// const auditLogSchema = new mongoose.Schema({
//   actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//   action: String,
//   targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//   metadata: Object,
//   ip: String
// }, { timestamps: true });

// module.exports = mongoose.model("AuditLog", auditLogSchema);

const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    action: {
      type: String,
      required: true
    },

    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    metadata: {
      type: Object,
      default: {}
    },

    ip: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);