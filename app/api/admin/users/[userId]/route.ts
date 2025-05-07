import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client" // Import Prisma namespace for types

interface RouteContext {
  params: {
    userId: string
  }
}

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
    // Basic validation (Zod recommended)
    const { email, name, role, guild, status, ...profileData } = body; // Separate core fields from profile

    // TODO: Add more robust validation here

    // Prepare data for update - Explicitly type objects to guide TS
    const userDataToUpdate: { email?: string } = {}; 
    if (email) userDataToUpdate.email = email; // Be cautious allowing email updates

    // Define structure for profile update data
    const profileDataToUpdate: {
        firstName?: string;
        surname?: string;
        title?: string | null;
        middleName?: string | null;
        gender?: string | null;
        dateOfBirth?: Date | null;
        maritalStatus?: string | null;
        address?: string | null;
        phoneCellNumber?: string | null;
        // Add other relevant fields from FamilyCensus model here
        placeOfBaptism?: string | null;
        baptismNumber?: string | null;
        typeOfMarriage?: string | null;
        placeOfMarriage?: string | null;
        marriageNumber?: string | null;
        marriedTo?: string | null;
        sectionName?: string | null;
        churchSupportCard?: string | null;
        occupation?: string | null;
        skills?: string | null;
        profession?: string | null;
        anyOtherComments?: string | null;
    } = {}; 
    // Map received profile fields to the update object
    if (profileData.firstName !== undefined) profileDataToUpdate.firstName = profileData.firstName;
    if (profileData.surname !== undefined) profileDataToUpdate.surname = profileData.surname;
    if (profileData.title !== undefined) profileDataToUpdate.title = profileData.title;
    // ... add all other updatable profile fields from FamilyCensus model ...
     if (profileData.middleName !== undefined) profileDataToUpdate.middleName = profileData.middleName;
     if (profileData.gender !== undefined) profileDataToUpdate.gender = profileData.gender;
     if (profileData.dateOfBirth !== undefined) profileDataToUpdate.dateOfBirth = profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : null;
     if (profileData.maritalStatus !== undefined) profileDataToUpdate.maritalStatus = profileData.maritalStatus;
     if (profileData.address !== undefined) profileDataToUpdate.address = profileData.address;
     if (profileData.phoneCellNumber !== undefined) profileDataToUpdate.phoneCellNumber = profileData.phoneCellNumber;
     if (profileData.placeOfBaptism !== undefined) profileDataToUpdate.placeOfBaptism = profileData.placeOfBaptism;
     if (profileData.baptismNumber !== undefined) profileDataToUpdate.baptismNumber = profileData.baptismNumber;
     if (profileData.typeOfMarriage !== undefined) profileDataToUpdate.typeOfMarriage = profileData.typeOfMarriage;
     if (profileData.placeOfMarriage !== undefined) profileDataToUpdate.placeOfMarriage = profileData.placeOfMarriage;
     if (profileData.marriageNumber !== undefined) profileDataToUpdate.marriageNumber = profileData.marriageNumber;
     if (profileData.marriedTo !== undefined) profileDataToUpdate.marriedTo = profileData.marriedTo;
     if (profileData.sectionName !== undefined) profileDataToUpdate.sectionName = profileData.sectionName;
     if (profileData.churchSupportCard !== undefined) profileDataToUpdate.churchSupportCard = profileData.churchSupportCard;
     if (profileData.occupation !== undefined) profileDataToUpdate.occupation = profileData.occupation;
     if (profileData.skills !== undefined) profileDataToUpdate.skills = profileData.skills;
     if (profileData.profession !== undefined) profileDataToUpdate.profession = profileData.profession;
     if (profileData.anyOtherComments !== undefined) profileDataToUpdate.anyOtherComments = profileData.anyOtherComments;
     // Note: emailAddress is handled via userDataToUpdate if email changes

    // Role update logic (handle carefully) - Explicitly type
    const roleDataToUpdate: { where: { userId: string }, data: { role: string } } | null = role ? { 
        where: { userId: userId }, // Condition to update roles for this user
        data: { role: role } // New role data
        // Note: This simple update assumes one role or overwrites existing roles.
        // More complex logic needed for multiple roles (delete existing, create new).
    } : null;


    // Use transaction to update user, profile, and potentially role
    const updatedUser = await prisma.$transaction(async (tx: Prisma.TransactionClient) => { // Add type for tx
        const userUpdate = await tx.user.update({
            where: { id: userId },
            data: userDataToUpdate,
        });

        if (Object.keys(profileDataToUpdate).length > 0) {
             await tx.familyCensus.upsert({ // Use upsert in case profile doesn't exist
                where: { userId: userId },
                update: profileDataToUpdate,
                create: {
                    userId: userId,
                    emailAddress: userUpdate.email, // Use potentially updated email
                    firstName: profileData.firstName || '', // Required field
                    surname: profileData.surname || '', // Required field
                    ...profileDataToUpdate // Spread validated profile data (includes optional fields)
                }
            });
        }
        
        // Update role if provided (simple overwrite example)
        if (roleDataToUpdate) {
             // First delete existing roles for the user
             await tx.userRole.deleteMany({ where: { userId: userId } });
             // Then create the new role
             await tx.userRole.create({ data: { userId: userId, role: role } });
        }

        return userUpdate; // Return the updated user object
    });


    return NextResponse.json(updatedUser, { status: 200 });

  } catch (error: any) {
    console.error(`Error updating user ${userId}:`, error);
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
