import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendInviteEmail } from "../../services/mail.service.js";
import { AppError } from "../../utils/appError.js";

export const getTenants = catchAsync(async (req: Request, res: Response) => {
  const tenants = await prisma.tenant.findMany({
    orderBy: { name: 'asc' },
    include: {
      subscriptionTier: { select: { name: true, price: true } },
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
