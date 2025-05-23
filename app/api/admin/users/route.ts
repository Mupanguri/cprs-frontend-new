import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { sendEmail } from "@/lib/email"
import crypto from 'crypto'
import bcrypt from "bcrypt"
import { z } from "zod";

// Define a Zod schema for user creation
const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  surname: z.string().min(1),
  role: z.enum(['admin', 'member']).default('member'), // Restrict to valid roles
  title: z.string().optional(),
  middleName: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  maritalStatus: z.string().optional(),
  address: z.string().optional(),
  phoneCellNumber: z.string().optional(),
  placeOfBaptism: z.string().optional(),
  baptismNumber: z.string().optional(),
  typeOfMarriage: z.string().optional(),
  placeOfMarriage: z.string().optional(),
  marriageNumber: z.string().optional(),
  marriedTo: z.string().optional(),
  sectionName: z.string().optional(),
  churchSupportCard: z.string().optional(),
  occupation: z.string().optional(),
  skills: z.string().optional(),
  profession: z.string().optional(),
  anyOtherComments: z.string().optional(),
});

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

// POST handler for adding a single user
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  // Ensure user is authenticated and is an admin
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json();

    // Validate the request body against the Zod schema
    const validatedData = createUserSchema.parse(body);

    // Generate password setup token
    const plainSetupToken = crypto.randomBytes(32).toString('hex');
    const hashedSetupToken = await bcrypt.hash(plainSetupToken, 10);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours expiry

    let createdUser;

    try {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Create User
        createdUser = await tx.user.create({
          data: {
            email: validatedData.email,
            passwordHash: null, // User sets password via token
          },
        });

        // Assign role (default to 'member' if not provided or invalid)
        await tx.userRole.create({
          data: {
            userId: createdUser.id,
            role: validatedData.role, // Use validated role
          },
        });

        // Create Family Census Data
        await tx.familyCensus.create({
          data: {
            userId: createdUser.id,
            emailAddress: validatedData.email, // Ensure email consistency
            firstName: validatedData.firstName,
            surname: validatedData.surname,
            title: validatedData.title || null,
            middleName: validatedData.middleName || null,
            gender: validatedData.gender || null,
            dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
            maritalStatus: validatedData.maritalStatus || null,
            address: validatedData.address || null,
            phoneCellNumber: validatedData.phoneCellNumber || null,
            placeOfBaptism: validatedData.placeOfBaptism || null,
            baptismNumber: validatedData.baptismNumber || null,
            typeOfMarriage: validatedData.typeOfMarriage || null,
            placeOfMarriage: validatedData.placeOfMarriage || null,
            marriageNumber: validatedData.marriageNumber || null,
            marriedTo: validatedData.marriedTo || null,
            sectionName: validatedData.sectionName || null,
            churchSupportCard: validatedData.churchSupportCard || null,
            occupation: validatedData.occupation || null,
            skills: validatedData.skills || null,
            profession: validatedData.profession || null,
            anyOtherComments: validatedData.anyOtherComments || null,
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
          <p>Hello ${validatedData.firstName},</p>
          <p>An account has been created for you in the St. Agnes Parish Management System.</p>
          <p>Please click the link below to set up your password:</p>
          <p><a href="${setupLink}">${setupLink}</a></p>
          <p>This link will expire in 72 hours.</p>
        `;
        
        const emailSent = await sendEmail(validatedData.email, emailSubject, emailHtml);
        if (!emailSent) {
           // If email fails, roll back the transaction
           throw new Error(`Failed to send setup email to ${validatedData.email}`);
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

  } catch (error: any) {
    console.error("Validation error:", error);
    return NextResponse.json({ error: `Validation error: ${error.message}` }, { status: 400 });
  }
}
