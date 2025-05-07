import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      role?: string | null; // Or string, depending on how you handle it
    } & DefaultSession["user"]; // Keep the default properties
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   * Also the shape of the user object returned by the `authorize` callback of the Credentials provider.
   */
  interface User extends DefaultUser {
    role?: string | null; // Or string
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    id?: string;
    role?: string | null; // Or string
  }
}
