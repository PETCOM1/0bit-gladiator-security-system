import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";

export const getSites = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) return res.status(403).json({ message: "No tenant context" });
  
  const whereClause: any = { tenantId };
  if (req.user!.role === "SITE_MANAGER") {
    whereClause.id = req.user!.siteId;
  }

  const sites = await prisma.site.findMany({ where: whereClause, orderBy: { name: 'asc' } });
  res.status(HttpStatus.OK).json({ status: "success", data: { sites } });
});

export const getSiteById = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { id } = req.params;

  if (!tenantId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant context" });

  const site = await prisma.site.findFirst({
    where: { id, tenantId },
    include: {
      users: {
        select: { id: true, firstName: true, lastName: true, email: true, role: true, accountStatus: true }
      },
      incidents: {
        orderBy: { createdAt: 'desc' },
        include: { reportedBy: { select: { firstName: true, lastName: true } } }
      },
      visitors: {
        orderBy: { checkInTime: 'desc' }
      },
      shifts: {
        orderBy: { startTime: 'desc' },
        include: { user: { select: { firstName: true, lastName: true } } }
      }
    }
  });

  if (!site) {
    return res.status(HttpStatus.NOT_FOUND).json({ message: "Site not found" });
  }

  // If role is SITE_MANAGER, verify they are assigned to this site
  if (req.user!.role === "SITE_MANAGER" && req.user!.siteId !== id) {
    return res.status(HttpStatus.FORBIDDEN).json({ message: "Access denied to this site" });
  }

  res.status(HttpStatus.OK).json({ status: "success", data: { site } });
});

export const createSite = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { name, address } = req.body;
  if (!tenantId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant context" });

  const site = await prisma.site.create({ data: { tenantId, name, address } });
  res.status(HttpStatus.CREATED).json({ status: "success", data: { site } });
});

export const updateSite = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { id } = req.params;
  const { name, address } = req.body;

  if (!tenantId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant context" });

  const existing = await prisma.site.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== tenantId) {
    return res.status(HttpStatus.NOT_FOUND).json({ message: "Site not found" });
  }

  const site = await prisma.site.update({
    where: { id },
    data: { name, address },
  });

  res.status(HttpStatus.OK).json({ status: "success", data: { site } });
});

export const deleteSite = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { id } = req.params;

  if (!tenantId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant context" });

  const existing = await prisma.site.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== tenantId) {
    return res.status(HttpStatus.NOT_FOUND).json({ message: "Site not found" });
  }

  await prisma.site.delete({ where: { id } });

  res.status(HttpStatus.NO_CONTENT).send();
});
