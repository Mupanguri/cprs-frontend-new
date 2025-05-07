import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const userId = session.user.id;

    // Fetch user's guild info (assuming one guild per user as per schema/profile page logic)
    const userGuild = await prisma.userGuild.findFirst({
      where: { userId: userId },
      include: {
        guild: {
          select: { name: true } // Select only the guild name
        }
      }
    });

    // Fetch document count
    const documentCount = await prisma.document.count({
      // Add where clause if filtering is needed (e.g., parish-wide vs guild-specific)
    });

    // TODO: Fetch payment status (requires more complex logic involving Fees and Payments)
    // TODO: Fetch upcoming events (requires Event model)
    // TODO: Fetch guild announcements (requires Announcement model)

    const summaryData = {
      guildName: userGuild?.guild?.name || null, // User might not be in a guild
      guildStatus: userGuild ? "Active Member" : "No Guild Assigned", // Example status
      documentCount: documentCount,
      paymentStatus: { // Placeholder
          balance: 0.00, 
          statusText: "Up to date" 
      }, 
      upcomingEvents: [], // Placeholder
      guildAnnouncements: [], // Placeholder
    };

    return NextResponse.json(summaryData, { status: 200 })

  } catch (error) {
    console.error("Error fetching dashboard summary:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
