import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"

// Function to generate a random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if the user exists
    const userResult = await db.query("SELECT user_id, email FROM users WHERE email = $1", [email])

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate OTP
    const otp = generateOTP()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000) // OTP expires in 72 hours

    // Store OTP
    await db.query(
      "INSERT INTO otp_codes (email, otp, created_at, expires_at) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET otp = $2, created_at = $3, expires_at = $4",
      [email, otp, now, expiresAt],
    )

    // Send OTP via Email
    const emailSubject = "Your Login OTP"
    const emailHtml = `
      <p>Your OTP is: <b>${otp}</b>.</p>
      <p>This code will expire in 72 hours.</p>
      <p>If you did not request this OTP, please ignore this email.</p>
    `

    const emailSent = await sendEmail(email, emailSubject, emailHtml)

    if (!emailSent) {
      return NextResponse.json({ error: "Failed to send OTP email" }, { status: 500 })
    }

    return NextResponse.json({ message: "OTP sent successfully. Check your email." }, { status: 200 })
  } catch (error) {
    console.error("Error requesting OTP:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
