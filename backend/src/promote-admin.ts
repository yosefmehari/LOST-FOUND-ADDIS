import { prisma } from "./lib/prisma.js";
import { Role } from "@prisma/client";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    console.error("❌ Please provide a user email address: npm run promote-admin <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`❌ No account found with email "${email}". Register the user first.`);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { role: Role.ADMIN },
    select: { id: true, name: true, email: true, role: true },
  });

  console.log(`🎉 User "${updated.name}" (${updated.email}) is now an ${updated.role}!`);
}

main()
  .catch((e) => {
    console.error("Error promoting admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
