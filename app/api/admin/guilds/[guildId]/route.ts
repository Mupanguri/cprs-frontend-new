import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

interface RouteContext {
  params: {
    guildId: string
  }
}

// PUT handler for updating a guild
export async function PUT(req: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions)
  const { guildId } = context.params

  // Ensure user is authenticated and is an admin
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!guildId) {
     return NextResponse.json({ error: "Guild ID is required" }, { status: 400 })
  }

  try {
    const body = await req.json();
    const { name, description } = body;

    // Basic validation
    if (!name && !description) {
       return NextResponse.json({ error: "Name or description must be provided for update" }, { status: 400 });
    }
    if (name !== undefined && typeof name !== 'string') {
         return NextResponse.json({ error: "Invalid name format" }, { status: 400 });
    }
     if (description !== undefined && typeof description !== 'string') {
         return NextResponse.json({ error: "Invalid description format" }, { status: 400 });
    }

    // Let TS infer type from assignments
    const dataToUpdate: { name?: string; description?: string | null } = {}; 
    if (name) dataToUpdate.name = name;
    if (description !== undefined) dataToUpdate.description = description; // Allow setting description to empty string or null

    const updatedGuild = await prisma.guild.update({
      where: { id: guildId },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedGuild, { status: 200 });

  } catch (error: any) {
    console.error(`Error updating guild ${guildId}:`, error);
     if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
       return NextResponse.json({ error: "A guild with this name already exists" }, { status: 409 }); // Conflict
     }
     if (error.code === 'P2025') { // Record to update not found
        return NextResponse.json({ error: "Guild not found" }, { status: 404 });
     }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


// DELETE handler for deleting a guild
export async function DELETE(req: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions)
  const { guildId } = context.params

  // Ensure user is authenticated and is an admin
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  
   if (!guildId) {
     return NextResponse.json({ error: "Guild ID is required" }, { status: 400 })
  }
  
  try {
    // Schema relations handle cascading deletes or setting null where appropriate
    await prisma.guild.delete({
      where: { id: guildId },
    });

    return NextResponse.json({ message: "Guild deleted successfully" }, { status: 200 });

  } catch (error: any) {
    console.error(`Error deleting guild ${guildId}:`, error);
     if (error.code === 'P2025') { // Record to delete not found
        return NextResponse.json({ error: "Guild not found" }, { status: 404 });
     }
    // Handle other potential errors, e.g., foreign key constraints if cascading isn't fully set up
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
