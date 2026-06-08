import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";

// Get dashboard KPIs
export const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant context" });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalSites, totalOfficers, visitorsToday, incidentsToday, openIncidents, activeShifts] = await Promise.all([
    prisma.site.count({ where: { tenantId } }),
    prisma.user.count({ where: { tenantId, role: { in: ["SITE_MANAGER", "USER"] }, accountStatus: "ACTIVE" } }),
    prisma.visitor.count({ where: { tenantId, checkInTime: { gte: today } } }),
    prisma.incident.count({ where: { tenantId, createdAt: { gte: today } } }),
    prisma.incident.count({ where: { tenantId, status: { in: ["OPEN", "INVESTIGATING"] } } }),
    prisma.shift.count({ where: { tenantId, status: "IN_PROGRESS" } })
  ]);

  res.status(HttpStatus.OK).json({
    status: "success",
    data: {
      sites: totalSites,
      officers: totalOfficers,
      visitorsToday,
      incidentsToday,
      openIncidents,
      activeShifts,
      attendanceRate: "95%" // Placeholder until robust attendance calculation is added
    }
  });
});

// Update Organization Profile
export const updateTenantProfile = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { name } = req.body;

  if (!tenantId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant context" });

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: { name }
  });

  res.status(HttpStatus.OK).json({ status: "success", data: { tenant } });
});

// Get Audit Logs for Tenant
export const getTenantAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant context" });

  const logs = await prisma.auditLog.findMany({
    where: { user: { tenantId } },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  res.status(HttpStatus.OK).json({ status: "success", data: { logs } });
});
