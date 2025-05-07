import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)

  // Require authentication to view documents
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Fetch all documents for now. 
    // TODO: Consider filtering by user's guild or other criteria if needed.
    const documents = await prisma.document.findMany({
      orderBy: {
        createdAt: 'desc', // Show newest first
      },
      // Optionally include guild info if needed for display
      // include: { guild: { select: { name: true } } } 
    });

    return NextResponse.json(documents, { status: 200 })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
