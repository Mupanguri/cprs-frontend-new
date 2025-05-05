import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt"
import { db } from "@/lib/db"

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
          // In a real app, you would query your database here
          const user = await db.query(
            "SELECT user_id, email, password_hash, role FROM users JOIN user_roles ON users.user_id = user_roles.user_id WHERE email = $1",
            [credentials.email],
          )

          if (!user.rows.length) {
            return null
          }

          const passwordMatch = await bcrypt.compare(credentials.password, user.rows[0].password_hash)

          if (!passwordMatch) {
            return null
          }

          return {
            id: user.rows[0].user_id.toString(),
            email: user.rows[0].email,
            role: user.rows[0].role,
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
