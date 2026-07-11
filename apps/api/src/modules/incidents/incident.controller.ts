import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";

export const reportIncident = catchAsync(async (req: Request, res: Response) => {
  const { title, description, severity, category } = req.body;
  const tenantId = req.user!.tenantId;
  const siteId = req.user!.siteId;

  if (!tenantId || !siteId) return res.status(403).json({ message: "No tenant/site context" });

  const incident = await prisma.incident.create({
    data: { tenantId, siteId, reportedById: req.user!.userId, title, description, severity, category: category || null }
  });
  res.status(HttpStatus.CREATED).json({ status: "success", data: { incident } });
});

export const getIncidents = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const siteId = req.user!.role === "MANAGER" ? null : req.user!.siteId; // Manager sees all sites
  if (!tenantId) return res.status(403).json({ message: "No tenant context" });

  const incidents = await prisma.incident.findMany({ 
    where: { tenantId, ...(siteId && { siteId }) },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { reportedBy: { select: { firstName: true, lastName: true } }, site: { select: { name: true } } }
  });
  res.status(HttpStatus.OK).json({ status: "success", data: { incidents } });
});

export const updateIncidentStatus = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { id } = req.params;
  const { status, severity } = req.body;

  if (!tenantId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant context" });

  const existing = await prisma.incident.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== tenantId) {
    return res.status(HttpStatus.NOT_FOUND).json({ message: "Incident not found" });
  }

  const isNowResolved = status && ["RESOLVED", "CLOSED"].includes(status);
  const wasResolved = ["RESOLVED", "CLOSED"].includes(existing.status);

  const incident = await prisma.incident.update({
    where: { id },
    data: {
      status: status ?? undefined,
      severity: severity ?? undefined,
      // Stamp resolvedAt the moment it first becomes resolved/closed; clear it
      // if the incident is reopened back to OPEN/INVESTIGATING.
      ...(isNowResolved && !wasResolved ? { resolvedAt: new Date() } : {}),
      ...(status && !isNowResolved && wasResolved ? { resolvedAt: null } : {})
    }
  });

  res.status(HttpStatus.OK).json({ status: "success", data: { incident } });
});
