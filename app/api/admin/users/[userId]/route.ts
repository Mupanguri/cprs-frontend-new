import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { z } from "zod";

interface RouteContext {
  params: {
    userId: string
  }
}

// Define a Zod schema for user profile update
const updateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  surname: z.string().min(1).optional(),
  title: z.string().optional().nullable(),
  middleName: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phoneCellNumber: z.string().optional().nullable(),
  placeOfBaptism: z.string().optional().nullable(),
  baptismNumber: z.string().optional().nullable(),
  typeOfMarriage: z.string().optional().nullable(),
  placeOfMarriage: z.string().optional().nullable(),
  marriageNumber: z.string().optional().nullable(),
  marriedTo: z.string().optional().nullable(),
  sectionName: z.string().optional().nullable(),
  churchSupportCard: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  skills: z.string().optional().nullable(),
  profession: z.string().optional().nullable(),
  anyOtherComments: z.string().optional().nullable(),
});

// PUT handler for updating a user
export async function PUT(req: NextRequest, context: RouteContext) {
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
    const body = await req.json();

    // Validate the request body against the Zod schema
    const validatedData = updateUserSchema.parse(body);

    // Prevent admin from updating their own role
    if (session.user.id === userId && body.role) {
      return NextResponse.json({ error: "Cannot update your own role" }, { status: 400 });
    }

    // Prepare data for update
    const userDataToUpdate: { email?: string } = {};
    if (validatedData.email) userDataToUpdate.email = validatedData.email; // Be cautious allowing email updates

    const profileDataToUpdate = {
      title: validatedData.title,
      firstName: validatedData.firstName,
      middleName: validatedData.middleName,
      surname: validatedData.surname,
      gender: validatedData.gender,
      dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
      maritalStatus: validatedData.maritalStatus,
      address: validatedData.address,
      phoneCellNumber: validatedData.phoneCellNumber,
      placeOfBaptism: validatedData.placeOfBaptism,
      baptismNumber: validatedData.baptismNumber,
      typeOfMarriage: validatedData.typeOfMarriage,
      placeOfMarriage: validatedData.placeOfMarriage,
      marriageNumber: validatedData.marriageNumber,
      marriedTo: validatedData.marriedTo,
      sectionName: validatedData.sectionName,
      churchSupportCard: validatedData.churchSupportCard,
      occupation: validatedData.occupation,
      skills: validatedData.skills,
      profession: validatedData.profession,
      anyOtherComments: validatedData.anyOtherComments,
    };

    // Use transaction to update user and profile
    const updatedUser = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const userUpdate = await tx.user.update({
        where: { id: userId },
        data: userDataToUpdate,
      });

      await tx.familyCensus.upsert({
        where: { userId: userId },
        update: profileDataToUpdate,
        create: {
          userId: userId,
          emailAddress: userUpdate.email, // Use potentially updated email
          firstName: validatedData.firstName || '', // Required field
          surname: validatedData.surname || '', // Required field
          title: validatedData.title,
          middleName: validatedData.middleName,
          gender: validatedData.gender,
          dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
          maritalStatus: validatedData.maritalStatus,
          address: validatedData.address,
          phoneCellNumber: validatedData.phoneCellNumber,
          placeOfBaptism: validatedData.placeOfBaptism,
          baptismNumber: validatedData.baptismNumber,
          typeOfMarriage: validatedData.typeOfMarriage,
          placeOfMarriage: validatedData.placeOfMarriage,
          marriageNumber: validatedData.marriageNumber,
          marriedTo: validatedData.marriedTo,
          sectionName: validatedData.sectionName,
          churchSupportCard: validatedData.churchSupportCard,
          occupation: validatedData.occupation,
          skills: validatedData.skills,
          profession: validatedData.profession,
          anyOtherComments: validatedData.anyOtherComments,
        },
      });

      return userUpdate; // Return the updated user object
    });

    return NextResponse.json(updatedUser, { status: 200 });

  } catch (error: any) {
    console.error(`Error updating user ${userId}:`, error);
     if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
     }
     if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
       return NextResponse.json({ error: "Email already exists" }, { status: 409 }); // Conflict
     }
     if (error.code === 'P2025') {
       return NextResponse.json({ error: "User not found" }, { status: 404 });
     }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


// DELETE handler for deleting a user
export async function DELETE(req: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions)
  const { userId } = context.params

  // Ensure user is authenticated and is an admin
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
   
   if (!userId) {
     return NextResponse.json({ error: "User ID is required" }, { status: 400 })
  }
   
  // Prevent admin from deleting themselves?
  if (session.user.id === userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  try {
    // Prisma schema should have cascading deletes set up for related data
    // (UserRole, UserGuild, Payment, FamilyCensus, PasswordSetupToken, OtpCode)
    // If not, related data needs manual deletion within a transaction.
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });

  } catch (error: any) {
    console.error(`Error deleting user ${userId}:`, error);
     if (error.code === 'P2025') { // Record to delete not found
        return NextResponse.json({ error: "User not found" }, { status: 404 });
     }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
