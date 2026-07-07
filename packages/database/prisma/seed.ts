import { prisma } from "@repo/database";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Starting expanded database seeding...");

  const passwordHash = await bcrypt.hash("Password123!", 12);
  const superAdminHash = await bcrypt.hash("SuperAdmin123!", 12);

  // 1. Create Subscription Tiers
  console.log("🌱 Seeding subscription tiers...");
  const pilotPlan = await prisma.subscriptionTier.upsert({
    where: { name: 'Pilot' },
    update: {},
    create: {
      name: 'Pilot',
      price: 0,
      maxUsers: 50,
      maxSites: 10,
      features: { trial: true, description: 'Pilot plan for testing' },
    },
  });

  // 2. Create Platform Admins
  console.log("🌱 Seeding platform admins...");
  await prisma.user.upsert({
    where: { email: "superadmin@example.com" },
    update: { role: "SUPER_ADMIN" },
    create: {
      email: "superadmin@example.com",
      password: superAdminHash,
      role: "SUPER_ADMIN",
      accountStatus: "ACTIVE",
      firstName: "Super",
      lastName: "Admin",
      displayName: "Super Admin",
    },
  });
  console.log("✅ Super Admin created: superadmin@example.com / SuperAdmin123!");

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { role: "ADMIN" },
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

  // 3. Define Companies Configuration
  const companiesConfig = [
    {
      id: "mock-tenant-id",
      name: "Gladiator Pro Security",
      prefix: "gladiator",
      managerEmail: "manager@example.com",
      managerFirstName: "Tenant",
      managerLastName: "Manager",
      supervisor1Email: "sitemanager@example.com", // preserves default account
      guard1Email: "guard@example.com"             // preserves default account
    },
    {
      id: "tenant-titan-shield",
      name: "Titan Shield Security",
      prefix: "titan",
      managerEmail: "manager.titan@gladiator.com",
      managerFirstName: "Thabo",
      managerLastName: "Nkosi",
      supervisor1Email: "supervisor1.titan@gladiator.com",
      guard1Email: "guard1.titan@gladiator.com"
    },
    {
      id: "tenant-aegis-tactical",
      name: "Aegis Tactical Guarding",
      prefix: "aegis",
      managerEmail: "manager.aegis@gladiator.com",
      managerFirstName: "Johan",
      managerLastName: "Pretorius",
      supervisor1Email: "supervisor1.aegis@gladiator.com",
      guard1Email: "guard1.aegis@gladiator.com"
    },
    {
      id: "tenant-vanguard-patrol",
      name: "Vanguard Patrol Solutions",
      prefix: "vanguard",
      managerEmail: "manager.vanguard@gladiator.com",
      managerFirstName: "Sarah",
      managerLastName: "Connor",
      supervisor1Email: "supervisor1.vanguard@gladiator.com",
      guard1Email: "guard1.vanguard@gladiator.com"
    },
    {
      id: "tenant-sentry-safe",
      name: "Sentry Safe Security",
      prefix: "sentry",
      managerEmail: "manager.sentry@gladiator.com",
      managerFirstName: "Elena",
      managerLastName: "Fisher",
      supervisor1Email: "supervisor1.sentry@gladiator.com",
      guard1Email: "guard1.sentry@gladiator.com"
    },
    {
      id: "tenant-sentinel-vip",
      name: "Sentinel VIP Protection",
      prefix: "sentinel",
      managerEmail: "manager.sentinel@gladiator.com",
      managerFirstName: "Arthur",
      managerLastName: "Morgan",
      supervisor1Email: "supervisor1.sentinel@gladiator.com",
      guard1Email: "guard1.sentinel@gladiator.com"
    },
    {
      id: "tenant-ironclad-cyber",
      name: "Ironclad Cyber Guarding",
      prefix: "ironclad",
      managerEmail: "manager.ironclad@gladiator.com",
      managerFirstName: "Gordon",
      managerLastName: "Freeman",
      supervisor1Email: "supervisor1.ironclad@gladiator.com",
      guard1Email: "guard1.ironclad@gladiator.com"
    },
    {
      id: "tenant-falcon-eye",
      name: "Falcon Eye Surveillance",
      prefix: "falcon",
      managerEmail: "manager.falcon@gladiator.com",
      managerFirstName: "Lara",
      managerLastName: "Croft",
      supervisor1Email: "supervisor1.falcon@gladiator.com",
      guard1Email: "guard1.falcon@gladiator.com"
    }
  ];

  // 4. Run loop to create multiple sites, posts, supervisors, and guards
  for (const comp of companiesConfig) {
    console.log(`🏢 Seeding company: ${comp.name}...`);

    // A. Upsert Tenant
    const tenant = await prisma.tenant.upsert({
      where: { id: comp.id },
      update: { name: comp.name },
      create: {
        id: comp.id,
        name: comp.name,
        subscriptionStatus: "ACTIVE",
        subscriptionTierId: pilotPlan.id,
        billingCycle: "MONTHLY",
        allowedUsers: 50
      }
    });

    // B. Create Site Alpha & Site Beta
    const siteAlphaId = `${comp.id}-site-alpha`;
    const siteBetaId = `${comp.id}-site-beta`;

    const siteAlpha = await prisma.site.upsert({
      where: { id: siteAlphaId },
      update: { name: `${comp.name} Alpha HQ` },
      create: {
        id: siteAlphaId,
        tenantId: tenant.id,
        name: `${comp.name} Alpha HQ`,
        address: `100 Alpha Boulevard, ${comp.name} Park`
      }
    });

    const siteBeta = await prisma.site.upsert({
      where: { id: siteBetaId },
      update: { name: `${comp.name} Beta Logistics` },
      create: {
        id: siteBetaId,
        tenantId: tenant.id,
        name: `${comp.name} Beta Logistics`,
        address: `250 Beta Industrial Way, Sector 9`
      }
    });

    // C. Create Posts for Site Alpha
    const postsAlpha = ["Front Entrance Gate", "CCTV Control Desk"];
    for (const pName of postsAlpha) {
      const pId = `${siteAlphaId}-${pName.toLowerCase().replace(/\s+/g, '-')}`;
      await prisma.post.upsert({
        where: { id: pId },
        update: { name: pName },
        create: {
          id: pId,
          tenantId: tenant.id,
          siteId: siteAlpha.id,
          name: pName,
          isActive: true
        }
      });
    }

    // D. Create Posts for Site Beta
    const postsBeta = ["Loading Dock Area", "Perimeter Patrol Way"];
    for (const pName of postsBeta) {
      const pId = `${siteBetaId}-${pName.toLowerCase().replace(/\s+/g, '-')}`;
      await prisma.post.upsert({
        where: { id: pId },
        update: { name: pName },
        create: {
          id: pId,
          tenantId: tenant.id,
          siteId: siteBeta.id,
          name: pName,
          isActive: true
        }
      });
    }

    // E. Create Manager (Tenant Owner)
    await prisma.user.upsert({
      where: { email: comp.managerEmail },
      update: { role: "MANAGER", tenantId: tenant.id },
      create: {
        email: comp.managerEmail,
        password: passwordHash,
        role: "MANAGER",
        accountStatus: "ACTIVE",
        firstName: comp.managerFirstName,
        lastName: comp.managerLastName,
        displayName: `${comp.managerFirstName} ${comp.managerLastName}`,
        tenantId: tenant.id
      }
    });

    // F. Create 2 Site Managers (Supervisors)
    const supervisor2Email = `supervisor2.${comp.prefix}@gladiator.com`;

    // Supervisor 1 (assigned to Site Alpha)
    await prisma.user.upsert({
      where: { email: comp.supervisor1Email },
      update: { role: "SITE_MANAGER", tenantId: tenant.id, siteId: siteAlpha.id },
      create: {
        email: comp.supervisor1Email,
        password: passwordHash,
        role: "SITE_MANAGER",
        accountStatus: "ACTIVE",
        firstName: "Site A",
        lastName: "Supervisor",
        displayName: `Site A Supervisor (${comp.prefix})`,
        tenantId: tenant.id,
        siteId: siteAlpha.id
      }
    });

    // Supervisor 2 (assigned to Site Beta)
    await prisma.user.upsert({
      where: { email: supervisor2Email },
      update: { role: "SITE_MANAGER", tenantId: tenant.id, siteId: siteBeta.id },
      create: {
        email: supervisor2Email,
        password: passwordHash,
        role: "SITE_MANAGER",
        accountStatus: "ACTIVE",
        firstName: "Site B",
        lastName: "Supervisor",
        displayName: `Site B Supervisor (${comp.prefix})`,
        tenantId: tenant.id,
        siteId: siteBeta.id
      }
    });

    // G. Create 3 Security Guards (Users)
    const guard2Email = `guard2.${comp.prefix}@gladiator.com`;
    const guard3Email = `guard3.${comp.prefix}@gladiator.com`;

    // Guard 1 (assigned to Site Alpha)
    await prisma.user.upsert({
      where: { email: comp.guard1Email },
      update: { role: "USER", tenantId: tenant.id, siteId: siteAlpha.id },
      create: {
        email: comp.guard1Email,
        password: passwordHash,
        role: "USER",
        accountStatus: "ACTIVE",
        firstName: "Guard A1",
        lastName: "Active",
        displayName: `Guard A1 (${comp.prefix})`,
        tenantId: tenant.id,
        siteId: siteAlpha.id
      }
    });

    // Guard 2 (assigned to Site Alpha)
    await prisma.user.upsert({
      where: { email: guard2Email },
      update: { role: "USER", tenantId: tenant.id, siteId: siteAlpha.id },
      create: {
        email: guard2Email,
        password: passwordHash,
        role: "USER",
        accountStatus: "ACTIVE",
        firstName: "Guard A2",
        lastName: "Duty",
        displayName: `Guard A2 (${comp.prefix})`,
        tenantId: tenant.id,
        siteId: siteAlpha.id
      }
    });

    // Guard 3 (assigned to Site Beta)
    await prisma.user.upsert({
      where: { email: guard3Email },
      update: { role: "USER", tenantId: tenant.id, siteId: siteBeta.id },
      create: {
        email: guard3Email,
        password: passwordHash,
        role: "USER",
        accountStatus: "ACTIVE",
        firstName: "Guard B1",
        lastName: "OnDuty",
        displayName: `Guard B1 (${comp.prefix})`,
        tenantId: tenant.id,
        siteId: siteBeta.id
      }
    });

    console.log(`   ✅ Seeded Manager, 2 Supervisors, 3 Guards, 2 Sites, and 4 Posts.`);
  }

  console.log("🎉 Expanded database seeding complete successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
