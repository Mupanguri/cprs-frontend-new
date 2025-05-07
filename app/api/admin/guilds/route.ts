import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET handler for fetching all guilds
export async function GET() {
  const session = await getServerSession(authOptions)

  // Ensure user is authenticated and is an admin
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const guilds = await prisma.guild.findMany({
      orderBy: {
        name: 'asc', // Order alphabetically by name
      },
      // Include count of users for display
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    // Define type based on the Prisma query result structure
    type GuildQueryResult = typeof guilds[number];

    // Map to include user count directly
    const formattedGuilds = guilds.map((guild: GuildQueryResult) => ({
        ...guild,
        memberCount: guild._count.users
    }));

    return NextResponse.json(formattedGuilds, { status: 200 })

  } catch (error) {
    console.error("Error fetching guilds:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST handler for adding a new guild
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  // Ensure user is authenticated and is an admin
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json();
    const { name, description } = body;

    // Basic validation
    if (!name) {
      return NextResponse.json({ error: "Guild name is required" }, { status: 400 });
    }

    const newGuild = await prisma.guild.create({
      data: {
        name: name,
        description: description || null,
      },
    });

    return NextResponse.json(newGuild, { status: 201 });

  } catch (error: any) {
    console.error("Error creating guild:", error);
     if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
       return NextResponse.json({ error: "A guild with this name already exists" }, { status: 409 }); // Conflict
     }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
