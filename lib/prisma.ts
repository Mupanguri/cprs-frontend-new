import { PrismaClient } from '@prisma/client'

// Declare a global variable to hold the Prisma client instance
// This prevents creating multiple instances in development due to hot reloading
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Initialize Prisma Client
// Use the global instance if it exists, otherwise create a new one
export const prisma =
  global.prisma ||
  new PrismaClient({
    // Optionally log database queries
    // log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

// Assign the Prisma client to the global variable in development
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
