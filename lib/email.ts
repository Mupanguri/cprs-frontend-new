import nodemailer from "nodemailer"

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    // Create a Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail", // Replace with your provider
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: html,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent:", info.response)
    return true
  } catch (error) {
    console.error("Error sending email:", error)
    return false
  }
}
