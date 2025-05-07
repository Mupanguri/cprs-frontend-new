import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Fetch user profile data from FamilyCensus linked to the user ID
    const userProfile = await prisma.familyCensus.findUnique({
      where: { userId: session.user.id },
      // Optionally select specific fields if not all are needed
    })

    if (!userProfile) {
      // If no census data, maybe return basic user info or an indicator
      // For now, returning 404 might be appropriate if profile is expected
      // Or return basic user email from session? Let's return null for now.
       return NextResponse.json(null, { status: 200 }); // Or return basic user info
      // return NextResponse.json({ error: "Profile data not found" }, { status: 404 })
    }

    // We might also want to include basic user info like email from the User model
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true } // Only select email
    });

    // Combine data - ensure email from User model is used if census email differs?
    const profileData = {
        ...userProfile,
        email: user?.email || userProfile.emailAddress // Prefer email from User model
    };


    return NextResponse.json(profileData, { status: 200 })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}


// Handler for PUT/PATCH requests to update the user profile
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()

    // Basic validation (more robust validation with Zod is recommended)
    if (!body || typeof body !== 'object') {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }
    
    // Extract relevant fields from body, ensuring types match schema
    // Need to be careful about which fields are allowed to be updated
    // Example: Allowing update of title, names, gender, dob, maritalStatus, address, phone
    const { 
        title, 
        firstName, 
        middleName, 
        surname, 
        gender, 
        dateOfBirth, // Ensure this is handled as Date or ISO string
        maritalStatus,
        address,
        phoneCellNumber,
        // Church info - assuming these can be updated too
        placeOfBaptism,
        baptismNumber,
        typeOfMarriage,
        placeOfMarriage,
        marriageNumber,
        marriedTo,
        sectionName,
        churchSupportCard,
        // Guild info - usually managed separately, maybe not here?
        // groupsGuild, 
        occupation,
        skills,
        profession,
        anyOtherComments
     } = body;

     // Convert dateOfBirth if it's a string
     const dobDate = dateOfBirth ? new Date(dateOfBirth) : null;
     if (dobDate && isNaN(dobDate.getTime())) {
        return NextResponse.json({ error: "Invalid date format for dateOfBirth" }, { status: 400 });
     }

    // Use upsert to handle cases where the profile might not exist yet
    const updatedProfile = await prisma.familyCensus.upsert({
      where: { userId: session.user.id },
      update: {
        // Only include fields that are present in the request body
        ...(title !== undefined && { title }),
        ...(firstName !== undefined && { firstName }),
        ...(middleName !== undefined && { middleName }),
        ...(surname !== undefined && { surname }),
        ...(gender !== undefined && { gender }),
        ...(dobDate !== undefined && { dateOfBirth: dobDate }), // Use converted date
        ...(maritalStatus !== undefined && { maritalStatus }),
        ...(address !== undefined && { address }),
        ...(phoneCellNumber !== undefined && { phoneCellNumber }),
        ...(placeOfBaptism !== undefined && { placeOfBaptism }),
        ...(baptismNumber !== undefined && { baptismNumber }),
        ...(typeOfMarriage !== undefined && { typeOfMarriage }),
        ...(placeOfMarriage !== undefined && { placeOfMarriage }),
        ...(marriageNumber !== undefined && { marriageNumber }),
        ...(marriedTo !== undefined && { marriedTo }),
        ...(sectionName !== undefined && { sectionName }),
        ...(churchSupportCard !== undefined && { churchSupportCard }),
        ...(occupation !== undefined && { occupation }),
        ...(skills !== undefined && { skills }),
        ...(profession !== undefined && { profession }),
        ...(anyOtherComments !== undefined && { anyOtherComments }),
        // emailAddress should likely be updated via a separate verification flow if changed
      },
      create: {
        userId: session.user.id,
        emailAddress: session.user.email!, // Use email from session for creation
        title: title || null,
        firstName: firstName || '', // Required field
        middleName: middleName || null,
        surname: surname || '', // Required field
        gender: gender || null,
        dateOfBirth: dobDate,
        maritalStatus: maritalStatus || null,
        address: address || null,
        phoneCellNumber: phoneCellNumber || null,
        placeOfBaptism: placeOfBaptism || null,
        baptismNumber: baptismNumber || null,
        typeOfMarriage: typeOfMarriage || null,
        placeOfMarriage: placeOfMarriage || null,
        marriageNumber: marriageNumber || null,
        marriedTo: marriedTo || null,
        sectionName: sectionName || null,
        churchSupportCard: churchSupportCard || null,
        occupation: occupation || null,
        skills: skills || null,
        profession: profession || null,
        anyOtherComments: anyOtherComments || null,
      },
    })

    return NextResponse.json(updatedProfile, { status: 200 })
  } catch (error) {
    console.error("Error updating user profile:", error)
    // Handle potential Prisma errors like unique constraint violations if necessary
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
