import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client" // Import Prisma type
import bcrypt from "bcrypt"

export async function POST(req: NextRequest) {
  try {
    const { token: plainToken, password: newPassword } = await req.json()

    if (!plainToken || !newPassword) {
      return NextResponse.json({ error: "Token and new password are required" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }

    // Find the password setup token record by hashing the plain token
    // This is not ideal as we have to iterate or fetch all tokens.
    // A better approach would be to have a non-unique plain token column for lookup,
    // or a way to query by a part of the token if security allows.
    // For now, we'll proceed with a less efficient lookup if the DB grows large.
    // The BEST approach is to hash the plainToken from the client and compare with stored hashed tokens.

    // Let's assume the plainToken is what we need to find the HASHED token in the DB.
    // This means the PasswordSetupToken table should store the PLAIN token, which is a security risk.
    // The plan was to store HASHED token. So, the client should send plain token,
    // and server should hash it for lookup, OR the PasswordSetupToken model needs adjustment.

    // Re-evaluating: The `PasswordSetupToken` model stores the HASHED token.
    // The client sends the PLAIN token. The server cannot directly find the hashed token
    // from the plain token without iterating and comparing one by one (bcrypt.compare).
    // This is inefficient.

    // A common pattern:
    // 1. User clicks link with PLAIN_TOKEN.
    // 2. Server receives PLAIN_TOKEN.
    // 3. Server looks up a *selector* part of the token in the DB (if token is split into selector:verifier).
    // 4. Server then hashes the *verifier* part of the PLAIN_TOKEN and compares with stored hashed verifier.
    // OR:
    // 1. Store a hash of the PLAIN_TOKEN in the database.
    // 2. When PLAIN_TOKEN is received, hash it again and find the match. This is viable.

    // Let's go with hashing the received plainToken and finding that hash in the DB.
    // This means the `PasswordSetupToken.token` field stores `bcrypt.hash(plainTokenSentInEmail, salt)`.
    // The `app/api/admin/upload-users/routes.ts` already does this (stores `hashedSetupToken`).

    const hashedPlainToken = await bcrypt.hash(plainToken, 10) // This is incorrect. We need to find the record by the *original* plain token.
                                                            // The DB stores the hash of the *original* plain token.
                                                            // So we need to iterate and compare.

    // Correct approach: Iterate and compare. This is inefficient for large numbers of tokens.
    // A better schema design would be to have an indexed, non-unique selector for tokens.
    // Given the current schema, we fetch all non-expired tokens and compare.
    
    const now = new Date();
    const setupTokenRecords = await prisma.passwordSetupToken.findMany({
        where: {
            expiresAt: {
                gt: now // Greater than now (not expired)
            }
        }
    });

    let foundTokenRecord = null;
    for (const record of setupTokenRecords) {
        const isMatch = await bcrypt.compare(plainToken, record.token);
        if (isMatch) {
            foundTokenRecord = record;
            break;
        }
    }

    if (!foundTokenRecord) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    // Token is valid, proceed to update password
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.user.update({
        where: { id: foundTokenRecord!.userId }, // Non-null assertion as we found it
        data: { passwordHash: newPasswordHash },
      })

      // Delete the used token
      await tx.passwordSetupToken.delete({
        where: { id: foundTokenRecord!.id },
      })
    })

    return NextResponse.json({ message: "Password set successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error setting password:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
