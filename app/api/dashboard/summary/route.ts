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
          select: { name: true, id: true } // Select guild name and id
        }
      }
    });

    let guildStatus = "No Guild Assigned";
    if (userGuild) {
      if (userGuild.isActive) {
        guildStatus = "Active Member";
      } else if (userGuild.isPending) {
        guildStatus = "Pending Approval";
      } else {
        guildStatus = "Inactive Member";
      }
    }

    // Fetch document count
    const documentCount = await prisma.document.count({
      where: {
        guildId: userGuild?.guild?.id, // Only count documents for the user's guild
      }
    });

    // Fetch payment status
    let balance = 0;
    let statusText = "Up to date";
    const payments = await prisma.payment.findMany({
      where: { userId: userId },
      orderBy: { paymentDate: 'desc' },
    });

    // Fetch all fees, including those not associated with a guild
    const fees = await prisma.fee.findMany({});

    payments.forEach(payment => {
      balance += Number(payment.amountPaid);
    });

    fees.forEach(fee => {
      balance -= Number(fee.amount);
    });

    if (balance < 0) {
      statusText = "Overdue";
    }

    const paymentStatus = {
      balance: balance,
      statusText: statusText,
    };

    // Fetch upcoming events
    const now = new Date();
    const upcomingEvents = await prisma.event.findMany({
      where: {
        guildId: userGuild?.guild?.id,
        startDate: {
          gte: now,
        },
      },
      orderBy: {
        startDate: 'asc',
      },
      take: 5, // Limit to 5 upcoming events
    });

    let upcomingEventsMessage = "";
    if (upcomingEvents.length === 0) {
      upcomingEventsMessage = "No upcoming events";
    }

    // Fetch guild announcements
    const guildAnnouncements = await prisma.announcement.findMany({
      where: {
        guildId: userGuild?.guild?.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 3, // Limit to 3 latest announcements
    });

    let guildAnnouncementsMessage = "";
    if (guildAnnouncements.length === 0) {
      guildAnnouncementsMessage = "No guild announcements";
    }

    const summaryData = {
      guildName: userGuild?.guild?.name || null, // User might not be in a guild
      guildStatus: guildStatus,
      documentCount: documentCount,
      paymentStatus: paymentStatus,
      upcomingEvents: upcomingEvents.length > 0 ? upcomingEvents : upcomingEventsMessage,
      guildAnnouncements: guildAnnouncements.length > 0 ? guildAnnouncements : guildAnnouncementsMessage,
    };

    return NextResponse.json(summaryData, { status: 200 })

  } catch (error) {
    console.error("Error fetching dashboard summary:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
