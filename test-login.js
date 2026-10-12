const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "alajagusiteslim@gmail.com"; // change if needed
  const password = "123456789"; // ← put your real password

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log("❌ User not found:", email);
    return;
  }

  console.log("✅ User found:", user.email);
  console.log("   Has password:", !!user.password);
  console.log("   Password hash starts:", user.password?.slice(0, 10));

  const valid = await bcrypt.compare(password, user.password || "");
  console.log("   Password match:", valid);
}

main().finally(() => prisma.$disconnect());