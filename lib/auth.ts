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

          if (!user || !user.passwordHash) {
            // User not found or password not set
            return null
          }

          const passwordMatch = await bcrypt.compare(credentials.password, user.passwordHash)

          if (!passwordMatch) {
            return null
          }

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
