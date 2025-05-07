import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log(`Start seeding ...`)

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  // IMPORTANT: Use a strong password and consider setting it via environment variable
  const adminPassword = process.env.ADMIN_PASSWORD || 'password123'; 

  if (adminPassword.length < 8) {
      console.error("Admin password must be at least 8 characters long. Seeding aborted.");
      return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10); // Salt rounds: 10

  // Create or update the admin user
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
        // Optionally update password if user exists? For seeding, maybe not.
        // passwordHash: hashedPassword, 
    },
    create: {
      email: adminEmail,
      passwordHash: hashedPassword,
      // Add initial profile data if desired
      profile: {
          create: {
              firstName: 'Admin',
              surname: 'User',
              emailAddress: adminEmail, // Keep consistent
          }
      }
    },
     include: { profile: true } // Include profile to log name
  });

  console.log(`Upserted admin user: ${adminUser.profile?.firstName} ${adminUser.profile?.surname} (${adminUser.email})`);

  // Assign the 'admin' role
  await prisma.userRole.upsert({
      where: { userId_role: { userId: adminUser.id, role: 'admin' } },
      update: {},
      create: {
          userId: adminUser.id,
          role: 'admin'
      }
  });

  console.log(`Assigned 'admin' role to user ${adminUser.email}`);

  // You can add more seeding logic here (e.g., default guilds)

  console.log(`Seeding finished.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
