// src/config/mailer.js
const transporter = {
  sendMail: async ({ from, to, subject, html, text }) => {
    try {
      const emailHtml = html || text;

      if (!emailHtml) {
        throw new Error("Email body content (html or text) is required.");
      }

      // Convert the recipient string/array to Brevo's object layout format
      const recipientArray = Array.isArray(to) ? to : [to];
      const brevoTo = recipientArray.map(email => ({ email: email }));

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          // You can type your personal email here as the sender, Brevo allows it for testing!
          sender: { 
            name: "Aegis Safety System", 
            email: "aegisteamnews@gmail.com" 
          },
          to: brevoTo,
          subject: subject,
          htmlContent: emailHtml,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to send email via Brevo API");
      }
      
      return data;
    } catch (error) {
      console.error("Email API Error:", error.message);
      throw error;
    }
  }
};

module.exports = transporter;