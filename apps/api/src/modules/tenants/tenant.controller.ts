import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendInviteEmail } from "../../services/mail.service.js";
import { AppError } from "../../utils/appError.js";

export const getTenants = catchAsync(async (req: Request, res: Response) => {
  // Account Managers see every tenant on the platform (so they can pick up
  // work and stay aware of the whole book), with createdBy included so the
  // UI can flag which ones they personally onboarded.
  const tenants = await prisma.tenant.findMany({
    orderBy: { name: 'asc' },
    include: {
      subscriptionTier: { select: { name: true, price: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      _count: { select: { users: true, sites: true, incidents: true, shifts: true, patrolLogs: true } }
    }
  });
  res.status(HttpStatus.OK).json({ status: "success", data: { tenants } });
});

export const getTenantById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      users: {
        select: { id: true, firstName: true, lastName: true, email: true, role: true, accountStatus: true, createdAt: true }
      },
      sites: true,
      payments: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!tenant) {
    return res.status(HttpStatus.NOT_FOUND).json({ message: "Tenant not found" });
  }

  res.status(HttpStatus.OK).json({ status: "success", data: { tenant } });
});

// ── My onboarding stats (Account Manager's own dashboard analytics) ────────────

export const getMyTenantStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const tenants = await prisma.tenant.findMany({
    where:   { createdById: userId },
    select:  {
      id: true, name: true, subscriptionStatus: true, createdAt: true,
      subscriptionTier: { select: { name: true } },
      _count: { select: { users: true, sites: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalTenants     = tenants.length;
  const suspendedCount   = tenants.filter((t) => t.subscriptionStatus === "SUSPENDED").length;
  const activeCount      = totalTenants - suspendedCount;
  const totalUsersReached = tenants.reduce((sum, t) => sum + t._count.users, 0);
  const totalSitesReached = tenants.reduce((sum, t) => sum + t._count.sites, 0);

  const planCounts: Record<string, number> = {};
  for (const t of tenants) {
    const plan = t.subscriptionTier?.name ?? "Unknown";
    planCounts[plan] = (planCounts[plan] ?? 0) + 1;
  }

  const now = new Date();
  const monthlyOnboarding = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const count = tenants.filter((t) => {
      const tc = new Date(t.createdAt);
      return tc.getFullYear() === d.getFullYear() && tc.getMonth() === d.getMonth();
    }).length;
    return { month: d.toLocaleDateString("en-US", { month: "short" }), count };
  });

  // Helpdesk is a shared queue across all Account Managers, so ticket counts
  // are platform-wide rather than scoped to this user's own tenants.
  const [ticketsSolved, ticketsOpen] = await Promise.all([
    prisma.supportTicket.count({ where: { status: { in: ["RESOLVED", "CLOSED"] } } }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER"] } } }),
  ]);

  return res.status(HttpStatus.OK).json({
    status: "success",
    data: {
      totalTenants, activeCount, suspendedCount,
      totalUsersReached, totalSitesReached,
      ticketsSolved, ticketsOpen,
      planBreakdown: Object.entries(planCounts).map(([plan, count]) => ({ plan, count })),
      monthlyOnboarding,
      recentTenants: tenants.slice(0, 8).map((t) => ({
        id: t.id, name: t.name, subscriptionStatus: t.subscriptionStatus,
        plan: t.subscriptionTier?.name ?? "Unknown", createdAt: t.createdAt,
        userCount: t._count.users, siteCount: t._count.sites,
      })),
    },
  });
});

export const createTenant = catchAsync(async (req: Request, res: Response) => {
  const { 
    name, orgType, registrationNumber, physicalAddress, countryRegion,
    contactEmail, contactPhone, expectedSites, timeZone,
    subscriptionTierId, billingCycle, allowedUsers,
    adminEmail, adminFirstName, adminLastName,
  } = req.body;

  if (!name || !contactEmail || !subscriptionTierId || !adminEmail) {
    throw new AppError("Missing required fields", HttpStatus.BAD_REQUEST);
  }

  const inviteCode = Math.random().toString(36).slice(2, 10).toUpperCase();
  const expires = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const result = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name, orgType, registrationNumber, physicalAddress, countryRegion,
        contactEmail, contactPhone, 
        expectedSites: expectedSites ? parseInt(expectedSites) : null, 
        timeZone,
        subscriptionTierId, billingCycle,
        allowedUsers: allowedUsers ? parseInt(allowedUsers) : 50,
        subscriptionStatus: "TRIAL",
        createdById: req.user!.userId,
      }
    });

    const adminUser = await tx.user.create({
      data: {
        email: adminEmail,
        password: "",
        role: "MANAGER",
        accountStatus: "PENDING",
        firstName: adminFirstName,
        lastName: adminLastName,
        tenantId: tenant.id,
        verificationCode: inviteCode,
        verificationExpires: expires,
        invitedById: req.user!.userId,
      }
    });

    return { tenant, adminUser };
  });

  const inviteLink = `${process.env.FRONTEND_URL}/set-password?token=${inviteCode}&email=${encodeURIComponent(adminEmail)}`;
  await sendInviteEmail(adminEmail, inviteLink, adminFirstName || "Admin");

  res.status(HttpStatus.CREATED).json({ status: "success", data: result });
});

export const updateTenantStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: "Status is required" });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) {
    return res.status(HttpStatus.NOT_FOUND).json({ message: "Tenant not found" });
  }

  const updatedTenant = await prisma.tenant.update({
    where: { id },
    data: { subscriptionStatus: status }
  });

  res.status(HttpStatus.OK).json({ status: "success", data: { tenant: updatedTenant } });
});
