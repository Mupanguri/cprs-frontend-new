import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt"
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          console.log(`Attempting login for email: ${credentials.email}`); // Log attempt
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              roles: {
                select: { role: true },
                // If you expect multiple roles and want to pass them all, adjust this.
                // For now, taking the first role to somewhat match original logic.
              },
            },
          })

          if (!user) {
            console.log(`Login failed: User not found for email ${credentials.email}`);
            return null // User not found
          }
          
          if (!user.passwordHash) {
             console.log(`Login failed: User ${credentials.email} found but passwordHash is null.`);
             return null // Password not set (e.g., pending setup)
          }

          console.log(`User found for ${credentials.email}, comparing password...`);
          const passwordMatch = await bcrypt.compare(credentials.password, user.passwordHash)

          if (!passwordMatch) {
            console.log(`Login failed: Password mismatch for email ${credentials.email}`);
            return null // Password doesn't match
          }
          
          console.log(`Login successful for email ${credentials.email}`);

          // Determine the role to pass. If multiple roles, decide on a strategy.
          // For simplicity, using the first role if available, or a default/null.
          const userRole = user.roles.length > 0 ? user.roles[0].role : "member" // Default to 'member' or handle as needed

          return {
            id: user.id,
            email: user.email,
            role: userRole, // Pass the determined role
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
}
