import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus, Role } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";

// Site Manager schedules a shift
export const createShift = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const siteId = req.user!.role === "MANAGER" ? req.body.siteId : req.user!.siteId;
  
  if (!tenantId || !siteId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant/site context" });

  // Check if site is frozen
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (site?.isFrozen) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      message: "This site has been frozen by the Tenant Manager. Operational activities are locked."
    });
  }

  const { userId, startTime, endTime, postId, status } = req.body;

  const shift = await prisma.shift.create({
    data: { 
      tenantId, 
      siteId, 
      userId: userId || null, 
      startTime: new Date(startTime), 
      endTime: endTime ? new Date(endTime) : null, 
      postId: postId || null,
      status: status || "SCHEDULED" 
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

  // Check if site is frozen
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (site?.isFrozen) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      message: "This site has been frozen by the Tenant Manager. Operational activities are locked."
    });
  }

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
  if (req.user!.role === Role.GUARD) {
    whereClause.userId = req.user!.userId;
    whereClause.status = { not: "DRAFT" };
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

// Update a shift
export const updateShift = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, startTime, endTime, postId, status } = req.body;

  const updateData: any = {};
  if (userId !== undefined) updateData.userId = userId || null;
  if (startTime !== undefined) updateData.startTime = new Date(startTime);
  if (endTime !== undefined) updateData.endTime = endTime ? new Date(endTime) : null;
  if (postId !== undefined) updateData.postId = postId || null;
  if (status !== undefined) updateData.status = status;

  const shift = await prisma.shift.update({
    where: { id },
    data: updateData
  });

  res.status(HttpStatus.OK).json({ status: "success", data: { shift } });
});

// Delete a shift
export const deleteShift = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.shift.delete({ where: { id } });
  res.status(HttpStatus.NO_CONTENT).send();
});

// Publish draft shifts for a site/week
export const publishShifts = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const siteId = req.user!.role === "MANAGER" ? req.body.siteId : req.user!.siteId;
  
  if (!tenantId || !siteId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant/site context" });

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (site?.isFrozen) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      message: "This site has been frozen by the Tenant Manager. Operational activities are locked."
    });
  }

  const { startDate, endDate } = req.body;

  const result = await prisma.shift.updateMany({
    where: {
      tenantId,
      siteId,
      status: "DRAFT",
      startTime: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    },
    data: {
      status: "SCHEDULED"
    }
  });

  res.status(HttpStatus.OK).json({ status: "success", data: { count: result.count } });
});
