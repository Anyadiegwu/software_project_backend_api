// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

// module.exports = transporter;

// src/config/mailer.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  // 1. Swap service for explicit host to bypass IPv6 network routing issues on Render
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use implicit SSL/TLS on port 465
  
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },

  // 2. Retain your custom optimization settings
  pool: true,
  maxConnections: 1,
  rateDelta: 1000, // 1 second between emails
  rateLimit: 5,    // Max 5 emails per second

  // 3. Add explicit network timeout fallbacks to prevent ENETUNREACH errors
  connectionTimeout: 10000, // Wait up to 10 seconds to connect
  greetingTimeout: 10000,
  socketTimeout: 10000,
  dnsTimeout: 5000
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter error:", error);
  } else {
    console.log("Email server is ready");
  }
});

module.exports = transporter;