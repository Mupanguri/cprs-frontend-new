import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import jwt from "jsonwebtoken"

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json()

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 })
    }

    // Check if the OTP is valid and has not expired
    const otpResult = await db.query("SELECT email FROM otp_codes WHERE email = $1 AND otp = $2 AND expires_at > $3", [
      email,
      otp,
      new Date(),
    ])

    if (otpResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 })
    }

    // Delete the used OTP
    await db.query("DELETE FROM otp_codes WHERE email = $1", [email])

    // Check if the user has a password_hash
    const userResult = await db.query("SELECT user_id, password_hash FROM users WHERE email = $1", [email])

    const user = userResult.rows[0]

    if (!user.password_hash) {
      // Generate a JWT token that indicates the user needs to set up their password
      const token = jwt.sign(
        { userId: user.user_id, email: email, needsPasswordSetup: true },
        process.env.JWT_SECRET || "defaultSecret",
        { expiresIn: "1h" },
      )

      return NextResponse.json({ message: "OTP verified. Please set up your new password.", token }, { status: 200 })
    }

    // If the user has a password, log them in (generate a JWT token)
    const roleResult = await db.query("SELECT role from user_roles WHERE user_id = $1", [user.user_id])

    const roles = roleResult.rows.map((r) => r.role)

    const token = jwt.sign(
      { userId: user.user_id, email: email, role: roles },
      process.env.JWT_SECRET || "defaultSecret",
      { expiresIn: "1h" },
    )

    return NextResponse.json({ message: "Login successful", token }, { status: 200 })
  } catch (error) {
    console.error("Error verifying OTP:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
