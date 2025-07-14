import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import authConfig from "./auth.config"
import { prisma } from "./prisma"

// Initialize NextAuth with proper type handling
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma as any) as any, // Type assertion needed until upstream types are fixed
  session: { strategy: "jwt" } // Use JWT strategy to avoid database queries in edge runtime
}) 