import { NextResponse, NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  // Require authentication to view documents
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const userId = session.user.id;

    // Fetch user's guild info (assuming one guild per user as per schema/profile page logic)
    const userGuild = await prisma.userGuild.findFirst({
      where: { userId: userId },
    });

    const guildId = userGuild?.guildId;

    // Implement pagination
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
    const pageSize = 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Fetch documents for the user's guild with pagination
    const documents = await prisma.document.findMany({
      where: {
        guildId: guildId, // Filter by user's guild
      },
      orderBy: {
        createdAt: 'desc', // Show newest first
      },
      skip: skip,
      take: take,
    });

    // Get total count for pagination
    const totalCount = await prisma.document.count({
      where: {
        guildId: guildId,
      },
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      documents: documents,
      totalPages: totalPages,
      currentPage: page,
    }, { status: 200 })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
