import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { sendEmail } from "@/lib/email"
import * as XLSX from "xlsx"
import bcrypt from "bcrypt"
import crypto from 'crypto'
import { z } from "zod";

// Define a Zod schema for the user data
const userSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  surname: z.string().min(1),
  title: z.string().optional(),
  middleName: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(), // Consider using z.date() and parsing the date string
  maritalStatus: z.string().optional(),
  typeOfMarriage: z.string().optional(),
  placeOfMarriage: z.string().optional(),
  marriageNumber: z.string().optional(),
  marriedTo: z.string().optional(),
  address: z.string().optional(),
  phoneCellNumber: z.string().optional(),
  sectionName: z.string().optional(),
  placeOfBaptism: z.string().optional(),
  baptismNumber: z.string().optional(),
  groupsGuild: z.string().optional(),
  occupation: z.string().optional(),
  skills: z.string().optional(),
  profession: z.string().optional(),
  churchSupportCard: z.string().optional(),
  lastPaid: z.string().optional(), // Consider using z.date() and parsing the date string
  anyOtherComments: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Implement rate limiting here to prevent abuse

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

    // Process each user
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const row of data as any[]) {
      try {
        // Validate the row data against the Zod schema
        const validatedRow = userSchema.parse(row);

        const plainSetupToken = crypto.randomBytes(32).toString('hex')
        const hashedSetupToken = await bcrypt.hash(plainSetupToken, 10) // Salt rounds: 10
        const now = new Date()
        // Token expiry (e.g., 72 hours)
        const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000)

        try {
          await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Create User
            const newUser = await tx.user.upsert({
              where: { email: validatedRow.email },
              update: {}, // Add update logic here if needed
              create: {
                email: validatedRow.email,
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
                title: validatedRow.title || null,
                firstName: validatedRow.firstName,
                middleName: validatedRow.middleName || null,
                surname: validatedRow.surname,
                gender: validatedRow.gender || null,
                emailAddress: validatedRow.email, // Ensure email is consistent
                dateOfBirth: validatedRow.dateOfBirth ? new Date(validatedRow.dateOfBirth) : null,
                maritalStatus: validatedRow.maritalStatus || null,
                typeOfMarriage: validatedRow.typeOfMarriage || null,
                placeOfMarriage: validatedRow.placeOfMarriage || null,
                marriageNumber: validatedRow.marriageNumber || null,
                marriedTo: validatedRow.marriedTo || null,
                address: validatedRow.address || null,
                phoneCellNumber: validatedRow.phoneCellNumber || null,
                sectionName: validatedRow.sectionName || null,
                placeOfBaptism: validatedRow.placeOfBaptism || null,
                baptismNumber: validatedRow.baptismNumber || null,
                groupsGuild: validatedRow.groupsGuild || null,
                occupation: validatedRow.occupation || null,
                skills: validatedRow.skills || null,
                profession: validatedRow.profession || null,
                churchSupportCard: validatedRow.churchSupportCard || null,
              },
              create: {
                userId: newUser.id,
                title: validatedRow.title || null,
                firstName: validatedRow.firstName,
                middleName: validatedRow.middleName || null,
                surname: validatedRow.surname,
                gender: validatedRow.gender || null,
                emailAddress: validatedRow.email,
                dateOfBirth: validatedRow.dateOfBirth ? new Date(validatedRow.dateOfBirth) : null,
                maritalStatus: validatedRow.maritalStatus || null,
                typeOfMarriage: validatedRow.typeOfMarriage || null,
                placeOfMarriage: validatedRow.placeOfMarriage || null,
                marriageNumber: validatedRow.marriageNumber || null,
                marriedTo: validatedRow.marriedTo || null,
                address: validatedRow.address || null,
                phoneCellNumber: validatedRow.phoneCellNumber || null,
                sectionName: validatedRow.sectionName || null,
                placeOfBaptism: validatedRow.placeOfBaptism || null,
                baptismNumber: validatedRow.baptismNumber || null,
                groupsGuild: validatedRow.groupsGuild || null,
                occupation: validatedRow.occupation || null,
                skills: validatedRow.skills || null,
                profession: validatedRow.profession || null,
                churchSupportCard: validatedRow.churchSupportCard || null,
              },
            })

            // Store Password Setup Token
            await tx.passwordSetupToken.create({
              data: {
                userId: newUser.id,
                token: hashedSetupToken,
                expiresAt: expiresAt,
              }
            });

            // Send Password Setup Email
            // Use environment variable for base URL, fallback to localhost for dev
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const setupLink = `${appUrl}/set-password?token=${plainSetupToken}`
            const emailSubject = "Set Up Your St. Agnes Parish Account"
            const emailHtml = `
              <p>Hello ${validatedRow.firstName},</p>
              <p>Your account has been created for the St. Agnes Parish Management System.</p>
              <p>Please click the link below to set up your password:</p>
              <p><a href="${setupLink}">${setupLink}</a></p>
              <p>This link will expire in 72 hours.</p>
              <p>If you did not request this, please ignore this email.</p>
            `
            const emailSent = await sendEmail(validatedRow.email, emailSubject, emailHtml)

            if (emailSent) {
              results.success++
            } else {
              results.failed++
              results.errors.push(`Failed to send setup email to ${validatedRow.email}: Please check the email configuration and try again.`)
              throw new Error(`Failed to send setup email to ${validatedRow.email}`);
            }
          }) // End of transaction
        } catch (error) {
          console.error(`Error processing user ${validatedRow.email}:`, error)
          results.failed++
          if (error instanceof Error) {
              results.errors.push(`Error processing user ${validatedRow.email}: ${error.message}`)
          } else {
              results.errors.push(`Error processing user ${validatedRow.email}: Unknown error`)
          }
        }
      } catch (error: any) {
        console.error(`Validation error for user:`, error);
        results.failed++;
        results.errors.push(`Validation error: ${error.message}`);
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
