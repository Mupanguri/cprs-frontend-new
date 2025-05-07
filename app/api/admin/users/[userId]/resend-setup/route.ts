import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import crypto from 'crypto'
import bcrypt from "bcrypt"
import type { Prisma } from "@prisma/client"

interface RouteContext {
  params: {
    userId: string
  }
}

// POST handler for resending password setup link
export async function POST(req: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions)
  const { userId } = context.params

  // Ensure user is authenticated and is an admin
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!userId) {
     return NextResponse.json({ error: "User ID is required" }, { status: 400 })
  }

  try {
    // Find the user to ensure they exist
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true } // Select necessary fields from related profile
    });
    
    // Fetch profile separately as it's a 1-to-1 relation
     const profile = await prisma.familyCensus.findUnique({
         where: { userId: userId },
         select: { firstName: true }
     });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Optional: Check if user already has a password set? 
    // Maybe allow resend even if password exists, effectively acting as a password reset trigger?
    // For now, let's allow it.

    // Generate new password setup token
    const plainSetupToken = crypto.randomBytes(32).toString('hex');
    const hashedSetupToken = await bcrypt.hash(plainSetupToken, 10);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours expiry

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Delete any existing token for this user first
        await tx.passwordSetupToken.deleteMany({
            where: { userId: userId }
        });

        // Create the new token
        await tx.passwordSetupToken.create({
            data: {
                userId: userId,
                token: hashedSetupToken,
                expiresAt: expiresAt,
            }
        });

        // Send Password Setup Email
        const userFirstName = profile?.firstName || 'User'; // Use profile name or fallback
        // TODO: Update your domain and path for the set-password page
        const setupLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/set-password?token=${plainSetupToken}`;
        const emailSubject = "Set Up Your St. Agnes Parish Account Password";
        const emailHtml = `
            <p>Hello ${userFirstName},</p>
            <p>A request was made to set up or reset the password for your account in the St. Agnes Parish Management System.</p>
            <p>Please click the link below to set your password:</p>
            <p><a href="${setupLink}">${setupLink}</a></p>
            <p>This link will expire in 72 hours. If you did not request this, please ignore this email.</p>
        `;
        
        const emailSent = await sendEmail(user.email, emailSubject, emailHtml);
        if (!emailSent) {
            // If email fails, roll back the transaction
            throw new Error(`Failed to send setup email to ${user.email}`);
        }
    }); // End transaction

    return NextResponse.json({ message: "Password setup email sent successfully." }, { status: 200 });

  } catch (error: any) {
    console.error(`Error resending setup link for user ${userId}:`, error);
     if (error.code === 'P2025') { // Record not found during transaction (shouldn't happen if user check passed)
        return NextResponse.json({ error: "User not found during operation" }, { status: 404 });
     }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
