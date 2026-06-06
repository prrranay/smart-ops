import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  
  // const pwd = await bcrypt.hash('Password@123', 12);
  const pwd = await bcrypt.hash('Password@123', 10);
  
  const users = [
    {
      email: 'user@ops.com',
      name: 'Operations User',
      role: 'USER' as const,
      password: pwd,
    },
      {
          email: 'manager@ops.com',
          name: 'Operations Manager',
          role: 'MANAGER' as const,
          password: pwd,
      },
    {
      email: 'admin@ops.com',
      name: 'Operations Admin',
      role: 'ADMIN' as const,
      password: pwd,
    },
  ];

  console.log('Seeding users...');
  for (const u of users) {
    const exist = await prisma.user.findUnique({
      where: { email: u.email },
    });
    if (exist) {
      await prisma.user.update({
        where: { email: u.email },
        data: {
          name: u.name,
          role: u.role,
          password: u.password,
        },
      });
      console.log(`Updated user: ${u.email}`);
    } else {
      await prisma.user.create({
        data: u,
      });
      console.log(`Created user: ${u.email}`);
    }

  }
  console.log('Seeding completed successfully!');
}

main()
  .catch((err) => {
    console.error('Error during seeding:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
