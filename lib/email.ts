import nodemailer from "nodemailer"

// Configure Nodemailer transporter for Mailtrap Sandbox
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER, // Read from .env
    pass: process.env.MAILTRAP_PASS, // Read from .env
  },
});

// Define a default FROM address (optional, can be overridden)
// Using a generic Mailtrap address often works for testing.
const EMAIL_FROM = process.env.EMAIL_FROM || '"St Agnes Parish System" <mailtrap@demomailtrap.com>'; 

export async function sendEmail(to: string, subject: string, html: string) {
  // Basic check for credentials
  if (!process.env.MAILTRAP_USER || !process.env.MAILTRAP_PASS) {
    console.error('Error sending email: MAILTRAP_USER or MAILTRAP_PASS environment variables not set.')
    // In development, maybe throw an error or return false depending on desired behavior
    return false; 
  }

  try {
    const mailOptions = {
      from: EMAIL_FROM, // Use configured FROM address
      to: to,
      subject: subject,
      html: html,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent via Mailtrap:", info.messageId)
    // You can check info.response for more details from Mailtrap if needed
    return true // Indicate success
  } catch (error) {
    console.error("Error sending email via Mailtrap:", error)
    return false // Indicate failure
  }
}
