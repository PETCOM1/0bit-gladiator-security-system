import { prisma } from "@repo/database";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding mock users...");

  const passwordHash = await bcrypt.hash("Password123!", 12);

  // 1. Create a Platform Admin
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: passwordHash,
      role: "ADMIN",
      accountStatus: "ACTIVE",
      firstName: "Platform",
      lastName: "Admin",
      displayName: "Platform Admin",
    },
  });
  console.log("✅ Platform Admin created: admin@example.com / Password123!");

  // 2. Create a Mock Tenant and Site
  const tenant = await prisma.tenant.upsert({
    where: { id: "mock-tenant-id" },
    update: {},
    create: {
      id: "mock-tenant-id",
      name: "SecureGuard Solutions",
    },
  });

  const site = await prisma.site.upsert({
    where: { id: "mock-site-id" },
    update: {},
    create: {
      id: "mock-site-id",
      tenantId: tenant.id,
      name: "Main Office Complex",
      address: "123 Business Rd",
    },
  });

  // 3. Create a Manager (Tenant Owner)
  await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      email: "manager@example.com",
      password: passwordHash,
      role: "MANAGER",
      accountStatus: "ACTIVE",
      firstName: "Tenant",
      lastName: "Manager",
      displayName: "Tenant Manager",
      tenantId: tenant.id,
    },
  });
  console.log("✅ Tenant Manager created: manager@example.com / Password123!");

  // 4. Create a Guard (User)
  await prisma.user.upsert({
    where: { email: "guard@example.com" },
    update: {},
    create: {
      email: "guard@example.com",
      password: passwordHash,
      role: "USER",
      accountStatus: "ACTIVE",
      firstName: "Security",
      lastName: "Guard",
      displayName: "Security Guard",
      tenantId: tenant.id,
      siteId: site.id,
    },
  });
  console.log("✅ Security Guard created: guard@example.com / Password123!");

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
