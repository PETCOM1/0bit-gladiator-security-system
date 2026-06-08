import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";

export const startShift = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const siteId = req.user!.siteId;
  
  if (!tenantId || !siteId) return res.status(403).json({ message: "No tenant/site context" });

  const shift = await prisma.shift.create({
    data: { tenantId, siteId, userId: req.user!.userId, startTime: new Date(), status: "IN_PROGRESS" }
  });
  res.status(HttpStatus.CREATED).json({ status: "success", data: { shift } });
});

export const endShift = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const shift = await prisma.shift.update({
    where: { id },
    data: { endTime: new Date(), status: "COMPLETED" }
  });
  res.status(HttpStatus.OK).json({ status: "success", data: { shift } });
});

export const getTenantShifts = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant context" });

  const shifts = await prisma.shift.findMany({
    where: { tenantId },
    orderBy: { startTime: 'desc' },
    include: { user: { select: { firstName: true, lastName: true } }, site: { select: { name: true } } }
  });

  res.status(HttpStatus.OK).json({ status: "success", data: { shifts } });
});
