import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";

export const checkInVisitor = catchAsync(async (req: Request, res: Response) => {
  const { name, idNumber, company, personVisiting, vehicleReg, purpose, cellNumber, townVillage } = req.body;
  const tenantId = req.user!.tenantId;
  
  let siteId = req.user!.role === "MANAGER" ? req.body.siteId : req.user!.siteId;
  
  // Fallback: If siteId is not statically set on user, find their active in-progress shift
  if (!siteId && req.user!.role === "GUARD") {
    const activeShift = await prisma.shift.findFirst({
      where: { userId: req.user!.userId, status: "IN_PROGRESS" }
    });
    if (activeShift) {
      siteId = activeShift.siteId;
    }
  }
  
  if (!tenantId || !siteId) return res.status(403).json({ message: "No tenant/site context. Ensure you are clocked in to a shift." });

  const visitor = await prisma.visitor.create({
    data: { tenantId, siteId, loggedById: req.user!.userId, name, idNumber, company, personVisiting, vehicleReg, purpose, cellNumber, townVillage }
  });
  res.status(HttpStatus.CREATED).json({ status: "success", data: { visitor } });
});

export const checkOutVisitor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const tenantId = req.user!.tenantId;

  if (!tenantId) return res.status(403).json({ message: "No tenant context" });

  const visitor = await prisma.visitor.updateMany({
    where: { id, tenantId },
    data: { status: "CHECKED_OUT", checkOutTime: new Date() }
  });
  
  if (visitor.count === 0) {
    return res.status(404).json({ message: "Visitor not found or already checked out" });
  }

  res.status(HttpStatus.OK).json({ status: "success", message: "Visitor checked out" });
});

export const getVisitors = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const siteId = req.user!.role === "MANAGER" ? null : req.user!.siteId; // Manager sees all sites
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  if (!tenantId) return res.status(403).json({ message: "No tenant context" });

  const hasDateFilter = !!(startDate || endDate);

  const visitors = await prisma.visitor.findMany({
    where: {
      tenantId,
      ...(siteId && { siteId }),
      ...(hasDateFilter && {
        checkInTime: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(`${endDate}T23:59:59.999`) }),
        }
      })
    },
    orderBy: { checkInTime: 'desc' },
    // A date-filtered report needs the full range; the default recent-activity
    // view stays capped so it doesn't pull the entire visitor history.
    ...(!hasDateFilter && { take: 50 }),
    include: { loggedBy: { select: { firstName: true, lastName: true } }, site: { select: { name: true } } }
  });
  res.status(HttpStatus.OK).json({ status: "success", data: { visitors } });
});

export const searchVisitor = catchAsync(async (req: Request, res: Response) => {
  const { idNumber } = req.params;
  const tenantId = req.user!.tenantId;

  if (!tenantId) return res.status(403).json({ message: "No tenant context" });

  const visitor = await prisma.visitor.findFirst({
    where: { idNumber, tenantId },
    orderBy: { checkInTime: 'desc' }
  });

  if (!visitor) {
    return res.status(404).json({ message: "Visitor not found" });
  }

  res.status(HttpStatus.OK).json({
    surnameInitials: visitor.name,
    institution: visitor.company || "",
    townVillage: visitor.townVillage || "",
    cellNumber: visitor.cellNumber || "",
    vehicleReg: visitor.vehicleReg || ""
  });
});
