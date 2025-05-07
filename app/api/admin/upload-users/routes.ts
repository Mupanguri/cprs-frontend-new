import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client' // Corrected Prisma type import
import { sendEmail } from "@/lib/email"
import * as XLSX from "xlsx"
import bcrypt from "bcrypt"
import crypto from 'crypto' // For generating secure tokens

// Removed generateOTP function as we're moving to a different setup token mechanism

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

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
      const plainSetupToken = crypto.randomBytes(32).toString('hex')
      const hashedSetupToken = await bcrypt.hash(plainSetupToken, 10) // Salt rounds: 10
      const now = new Date()
      // Token expiry (e.g., 72 hours)
      const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000) 

      try {
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          // Create User
          const newUser = await tx.user.upsert({
            where: { email: row.email },
            update: {
              // If user exists, we might not want to overwrite passwordHash if it's already set by user
              // For initial upload, this implies setting it to null or a specific state
              // For simplicity here, if they exist, we're just ensuring their census/role data is updated
              // and a new setup token is issued if they haven't set a password.
              // This logic might need refinement based on exact requirements for existing users.
              // For now, we assume new users or users without a passwordHash get a setup token.
            },
            create: {
              email: row.email,
              passwordHash: null, // Password will be set by the user via the token
            },
          })

          // Assign default role
          await tx.userRole.upsert({
            where: { userId_role: { userId: newUser.id, role: 'member' } },
            update: {},
            create: {
              userId: newUser.id,
              role: 'member',
            },
          })

          // Create/Update Family Census Data
          await tx.familyCensus.upsert({
            where: { userId: newUser.id },
            update: {
              title: row.title || null,
              firstName: row.firstName,
              middleName: row.middleName || null,
              surname: row.surname,
              gender: row.gender || null,
              emailAddress: row.email, // Ensure email is consistent
              // Add other census fields from 'row' as needed
            },
            create: {
              userId: newUser.id,
              title: row.title || null,
              firstName: row.firstName,
              middleName: row.middleName || null,
              surname: row.surname,
              gender: row.gender || null,
              emailAddress: row.email,
              // Add other census fields from 'row' as needed
            },
          })

          // Store Password Setup Token
          // NOTE: Assumes PasswordSetupToken model exists in prisma.schema
          // and User model has a relation to it.
          // (This model was added to prisma.schema.prisma and client regenerated)

          await tx.passwordSetupToken.upsert({
            where: { userId: newUser.id },
            update: {
              token: hashedSetupToken,
              expiresAt: expiresAt,
              createdAt: now, // Prisma handles default createdAt, but explicit for upsert update
            },
            create: {
              userId: newUser.id,
              token: hashedSetupToken,
              expiresAt: expiresAt,
            }
          });
          
          // Remove the temporary OtpCode usage if it was solely for this.
          // If OtpCode is used for other actual OTP purposes, leave its logic elsewhere.
          // For this password setup flow, PasswordSetupToken is the correct model.


          // Send Password Setup Email
          // Use environment variable for base URL, fallback to localhost for dev
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const setupLink = `${appUrl}/set-password?token=${plainSetupToken}`
          const emailSubject = "Set Up Your St. Agnes Parish Account"
          const emailHtml = `
            <p>Hello ${row.firstName},</p>
            <p>Your account has been created for the St. Agnes Parish Management System.</p>
            <p>Please click the link below to set up your password:</p>
            <p><a href="${setupLink}">${setupLink}</a></p>
            <p>This link will expire in 72 hours.</p>
            <p>If you did not request this, please ignore this email.</p>
          `
          const emailSent = await sendEmail(row.email, emailSubject, emailHtml)

          if (emailSent) {
            results.success++
          } else {
            results.failed++
            results.errors.push(`Failed to send setup email to ${row.email}`)
            // If email fails, the transaction should ideally roll back.
            // Throwing an error here will cause the transaction to roll back.
            throw new Error(`Failed to send setup email to ${row.email}`); 
          }
        }) // End of transaction
      } catch (error) {
        console.error(`Error processing user ${row.email}:`, error)
        results.failed++
        // Ensure error is an instance of Error to access message property
        if (error instanceof Error) {
            results.errors.push(`Error processing user ${row.email}: ${error.message}`)
        } else {
            results.errors.push(`Error processing user ${row.email}: Unknown error`)
        }
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
