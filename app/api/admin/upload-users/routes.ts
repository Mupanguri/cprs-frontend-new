import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import * as XLSX from "xlsx"
import bcrypt from "bcrypt"

// Function to generate a random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Check file extension
    const fileExt = file.name.split(".").pop()?.toLowerCase()
    if (fileExt !== "xls" && fileExt !== "xlsx") {
      return NextResponse.json({ error: "Only Excel files (.xls or .xlsx) are allowed" }, { status: 400 })
    }

    // Read the Excel file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(worksheet)

    // Validate the data structure
    if (!data.length) {
      return NextResponse.json({ error: "Excel file is empty" }, { status: 400 })
    }

    // Check if the required columns exist
    const firstRow = data[0] as any
    if (!firstRow.email || !firstRow.firstName || !firstRow.surname) {
      return NextResponse.json(
        { error: "Excel file must contain email, firstName, and surname columns" },
        { status: 400 },
      )
    }

    // Process each user
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const row of data as any[]) {
      try {
        // Generate OTP for the user
        const otp = generateOTP()
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(otp, salt)
        const now = new Date()
        const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000) // OTP expires in 72 hours

        // Insert or update the user
        const userResult = await db.query(
          "INSERT INTO users (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET password_hash = $2 RETURNING user_id",
          [row.email, hashedPassword],
        )

        const userId = userResult.rows[0].user_id

        // Assign a default role (e.g., 'member')
        await db.query("INSERT INTO user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING", [
          userId,
          "member",
        ])

        // Store OTP
        await db.query(
          "INSERT INTO otp_codes (email, otp, created_at, expires_at) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET otp = $2, created_at = $3, expires_at = $4",
          [row.email, otp, now, expiresAt],
        )

        // Insert or update family census data
        await db.query(
          `
          INSERT INTO family_census (
            title, first_name, middle_name, surname, gender, email_address, user_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (user_id) DO UPDATE SET
            title = $1, first_name = $2, middle_name = $3, surname = $4, gender = $5, email_address = $6
        `,
          [
            row.title || null,
            row.firstName,
            row.middleName || null,
            row.surname,
            row.gender || null,
            row.email,
            userId,
          ],
        )

        // Send OTP via Email
        const emailSubject = "Your St. Agnes Parish Account"
        const emailHtml = `
          <p>Hello ${row.firstName},</p>
          <p>Your account has been created in the St. Agnes Parish Management System.</p>
          <p>Your temporary password is: <b>${otp}</b></p>
          <p>This password will expire in 72 hours. Please log in and set up your new password.</p>
        `

        const emailSent = await sendEmail(row.email, emailSubject, emailHtml)

        if (emailSent) {
          results.success++
        } else {
          results.failed++
          results.errors.push(`Failed to send email to ${row.email}`)
        }
      } catch (error) {
        console.error(`Error processing user ${row.email}:`, error)
        results.failed++
        results.errors.push(`Error processing user ${row.email}: ${(error as Error).message}`)
      }
    }

    return NextResponse.json(
      {
        message: `Processed ${data.length} users. Success: ${results.success}, Failed: ${results.failed}`,
        details: results,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error uploading users:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
