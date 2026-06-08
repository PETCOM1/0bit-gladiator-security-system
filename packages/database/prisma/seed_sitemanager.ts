import { prisma } from "@repo/database";
import bcrypt from "bcryptjs";

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);
  
  await prisma.user.upsert({
    where: { email: "sitemanager@example.com" },
    update: {},
    create: {
      email: "sitemanager@example.com",
      password: passwordHash,
      role: "SITE_MANAGER",
      accountStatus: "ACTIVE",
      firstName: "Site",
      lastName: "Manager",
      displayName: "Site Manager",
      tenantId: "mock-tenant-id",
      siteId: "mock-site-id",
    },
  });
  console.log("✅ Site Manager created: sitemanager@example.com / Password123!");
}

main().finally(() => prisma.$disconnect());
