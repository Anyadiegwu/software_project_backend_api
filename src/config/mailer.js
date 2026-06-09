// src/config/mailer.js
const nodemailer = require("nodemailer");

// Create a placeholder transporter variable
let transporter;

// Asynchronously configure the secure email sandbox channel
const initMailer = async () => {
  try {
    // Generate an instant, free test account on Ethereal
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass  // generated ethereal password
      }
    });

    // Intercept the default sendMail method to print a live check URL to Render's logs
    const originalSendMail = transporter.sendMail.bind(transporter);
    transporter.sendMail = async (mailOptions) => {
      const info = await originalSendMail(mailOptions);
      
      // ⚠️ CRITICAL FOR YOUR SCHOOL DEMO:
      // This prints a live website URL into your Render log dashboard.
      // Opening that URL lets you show the panel the actual sent email!
      console.log("-----------------------------------------");
      console.log("📬 TEST EMAIL SENT SUCCESSFULLY!");
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      console.log("-----------------------------------------");
      
      return info;
    };

    console.log("⚡ Ethereal Mailer sandbox initialized successfully!");
  } catch (error) {
    console.error("❌ Failed to initialize Ethereal mailer:", error.message);
  }
};

// Execute the generation immediately
initMailer();

// Export an object wrapper that waits for the transporter to initialize
module.exports = {
  sendMail: async (options) => {
    if (!transporter) {
      // Small timeout buffer to ensure asynchronous registration completes if hit instantly
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    return await transporter.sendMail(options);
  }
};