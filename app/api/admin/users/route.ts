import { type NextRequest, NextResponse } from "next/server" // Import NextRequest
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client" // Import Prisma type
import { sendEmail } from "@/lib/email" // Import sendEmail

export async function GET() {
  const session = await getServerSession(authOptions)

  // Ensure user is authenticated and is an admin
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    // Fetch all users with relevant related data for display
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        passwordHash: true, // Select passwordHash to determine status
        createdAt: true,
        updatedAt: true,
        // Include profile data (FamilyCensus) for name
        profile: {
          select: {
            firstName: true,
            surname: true,
          }
        },
        // Include roles
        roles: {
          select: {
            role: true
          }
        },
        // Include guild membership (assuming one guild per user for simplicity here)
        guilds: {
          select: {
            guild: {
              select: {
                name: true
              }
            }
          },
          take: 1 // Assuming we only display one primary guild on the list
        },
        // TODO: Add a 'status' field to the User model or derive it
        // For now, we don't have a status field to select
      },
      orderBy: {
        createdAt: 'desc', // Or order by name/email
      }
    });

    // Format the data slightly for easier frontend consumption
    // Define a basic type for the user object structure returned by Prisma select
    type UserQueryResult = typeof users[number]; 

    const formattedUsers = users.map((user: UserQueryResult) => ({
        id: user.id,
        name: `${user.profile?.firstName || ''} ${user.profile?.surname || ''}`.trim() || user.email, // Fallback to email if no name
        email: user.email,
        // Combine roles into a string or use the first one
        role: user.roles.map((r: { role: string }) => r.role).join(', ') || 'N/A', 
        guild: user.guilds[0]?.guild?.name || 'N/A',
        // Derive status based on presence of passwordHash
        status: user.passwordHash ? 'Active' : 'Pending Setup', 
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    }));

    return NextResponse.json(formattedUsers, { status: 200 })

  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Moved crypto and bcrypt imports higher up
import crypto from 'crypto' 
import bcrypt from "bcrypt" 

// POST handler for adding a single user
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  // Ensure user is authenticated and is an admin
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json();

    // Basic validation (Zod recommended for production)
    const { email, firstName, surname, role, ...censusData } = body; // Extract basic info + census data
    if (!email || !firstName || !surname) {
      return NextResponse.json({ error: "Email, firstName, and surname are required" }, { status: 400 });
    }

    // Generate password setup token
    const plainSetupToken = crypto.randomBytes(32).toString('hex');
    const hashedSetupToken = await bcrypt.hash(plainSetupToken, 10);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours expiry

    let createdUser;

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => { // Added type for tx
      // Create User
      createdUser = await tx.user.create({
        data: {
          email: email,
          passwordHash: null, // User sets password via token
        },
      });

      // Assign role (default to 'member' if not provided or invalid)
      await tx.userRole.create({
        data: {
          userId: createdUser.id,
          role: role === 'admin' ? 'admin' : 'member', // Allow setting admin role? Or default only?
        },
      });

      // Create Family Census Data
      await tx.familyCensus.create({
        data: {
          userId: createdUser.id,
          emailAddress: email, // Ensure email consistency
          firstName: firstName,
          surname: surname,
          // Add other census fields from the request body if provided
          title: censusData.title || null,
          middleName: censusData.middleName || null,
          gender: censusData.gender || null,
          dateOfBirth: censusData.dateOfBirth ? new Date(censusData.dateOfBirth) : null,
          maritalStatus: censusData.maritalStatus || null,
          address: censusData.address || null,
          phoneCellNumber: censusData.phoneCellNumber || null,
          placeOfBaptism: censusData.placeOfBaptism || null,
          baptismNumber: censusData.baptismNumber || null,
          typeOfMarriage: censusData.typeOfMarriage || null,
          placeOfMarriage: censusData.placeOfMarriage || null,
          marriageNumber: censusData.marriageNumber || null,
          marriedTo: censusData.marriedTo || null,
          sectionName: censusData.sectionName || null,
          churchSupportCard: censusData.churchSupportCard || null,
          occupation: censusData.occupation || null,
          skills: censusData.skills || null,
          profession: censusData.profession || null,
          anyOtherComments: censusData.anyOtherComments || null,
        },
      });

      // Store Password Setup Token
      await tx.passwordSetupToken.create({
        data: {
          userId: createdUser.id,
          token: hashedSetupToken,
          expiresAt: expiresAt,
        }
      });

      // Send Password Setup Email
      // Use environment variable for base URL, fallback to localhost for dev
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const setupLink = `${appUrl}/set-password?token=${plainSetupToken}`;
      const emailSubject = "Set Up Your St. Agnes Parish Account";
      const emailHtml = `
        <p>Hello ${firstName},</p>
        <p>An account has been created for you in the St. Agnes Parish Management System.</p>
        <p>Please click the link below to set up your password:</p>
        <p><a href="${setupLink}">${setupLink}</a></p>
        <p>This link will expire in 72 hours.</p>
      `;
      
      const emailSent = await sendEmail(email, emailSubject, emailHtml);
      if (!emailSent) {
         // If email fails, roll back the transaction
         throw new Error(`Failed to send setup email to ${email}`);
      }
    }); // End transaction

    return NextResponse.json(createdUser, { status: 201 }); // Return created user info

  } catch (error: any) {
    console.error("Error creating user:", error);
    // Handle potential Prisma errors (e.g., unique constraint violation on email)
     if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
       return NextResponse.json({ error: "Email already exists" }, { status: 409 }); // Conflict
     }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
