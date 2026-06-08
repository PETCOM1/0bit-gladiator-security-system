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

  const shifts = await prisma.shift.findMany({
    where: { tenantId, ...(siteId && { siteId }) },
    orderBy: { startTime: 'desc' },
    include: { 
      user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } }, 
      site: { select: { name: true } },
      post: { select: { name: true } }
    }
  });

  res.status(HttpStatus.OK).json({ status: "success", data: { shifts } });
});
