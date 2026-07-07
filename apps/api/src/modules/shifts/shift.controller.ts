import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus, Role } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";

// Site Manager schedules a shift
export const createShift = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const siteId = req.user!.role === "MANAGER" ? req.body.siteId : req.user!.siteId;
  
  if (!tenantId || !siteId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant/site context" });

  const { userId, startTime, endTime, postId } = req.body;

  const shift = await prisma.shift.create({
    data: { 
      tenantId, 
      siteId, 
      userId, 
      startTime: new Date(startTime), 
      endTime: new Date(endTime), 
      postId,
      status: "SCHEDULED" 
    }
  });
  
  res.status(HttpStatus.CREATED).json({ status: "success", data: { shift } });
});

// Guard checks into a scheduled shift (or ad-hoc)
export const startShift = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const siteId = req.user!.siteId;
  const { shiftId } = req.body; // if shiftId provided, clock into scheduled shift
  
  if (!tenantId || !siteId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant/site context" });

  let shift;
  if (shiftId) {
    const existingShift = await prisma.shift.findUnique({ where: { id: shiftId } });
    if (!existingShift) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: "Shift not found" });
    }

    // A guard cannot clock in to a shift starting more than 15 minutes in the future
    const earlyThreshold = new Date(Date.now() + 15 * 60 * 1000);
    if (new Date(existingShift.startTime) > earlyThreshold) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: "Cannot clock in to a future shift. You can only clock in up to 15 minutes before the shift starts."
      });
    }

    shift = await prisma.shift.update({
      where: { id: shiftId },
      data: { actualStartTime: new Date(), status: "IN_PROGRESS" }
    });
  } else {
    // Ad-hoc shift
    shift = await prisma.shift.create({
      data: { 
        tenantId, 
        siteId, 
        userId: req.user!.userId, 
        startTime: new Date(), 
        actualStartTime: new Date(), 
        status: "IN_PROGRESS" 
      }
    });
  }
  
  res.status(HttpStatus.OK).json({ status: "success", data: { shift } });
});

// Guard checks out
export const endShift = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const shift = await prisma.shift.update({
    where: { id },
    data: { actualEndTime: new Date(), status: "COMPLETED" }
  });
  res.status(HttpStatus.OK).json({ status: "success", data: { shift } });
});

// Get shifts (with post data)
export const getTenantShifts = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const siteId = req.user!.role === Role.MANAGER ? null : req.user!.siteId;
  
  if (!tenantId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant context" });

  let whereClause: any = { tenantId };
  if (siteId) {
    whereClause.siteId = siteId;
  }
  if (req.user!.role === Role.USER) {
    whereClause.userId = req.user!.userId;
  }

  const shifts = await prisma.shift.findMany({
    where: whereClause,
    orderBy: { startTime: 'desc' },
    include: { 
      user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } }, 
      site: { select: { name: true } },
      post: { select: { name: true } }
    }
  });

  res.status(HttpStatus.OK).json({ status: "success", data: { shifts } });
});
