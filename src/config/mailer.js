const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  // 1. Switch to Port 587 (Render leaves this open for outward web apps)
  port: 587,
  // 2. Set secure to false because port 587 starts unencrypted, then upgrades
  secure: false, 
  
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },

  // Retain your optimization rules
  pool: true,
  maxConnections: 1,
  rateDelta: 1000, 
  rateLimit: 5,    

  // Retain connection fallback buffers
  connectionTimeout: 10000, 
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