import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'alajagusiteslim@gmail.com'; // Your email
  const plainPassword = 'myNewPassword123'; // Choose a password you want
  
  // 1. Hash the new password
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // 2. Update the user in the database
  const user = await prisma.user.update({
    where: { email: email },
    data: { password: hashedPassword },
  });

  console.log(`✅ Password for ${user.email} has been reset to: ${plainPassword}`);
  console.log('You can now log in with this new password.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });