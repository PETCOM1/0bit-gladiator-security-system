import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus, Role } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";

export const getEntries = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const siteId = req.user!.role === Role.MANAGER ? req.query.siteId as string | undefined : req.user!.siteId;

  if (!tenantId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant context" });

  const entries = await prisma.occurrenceBookEntry.findMany({
    where: { 
      tenantId, 
      ...(siteId && { siteId })
    },
    orderBy: { createdAt: 'desc' },
    include: { 
      user: { select: { firstName: true, lastName: true } },
      site: { select: { name: true } } 
    }
  });

  const mappedEntries = entries.map(entry => ({
    ...entry,
    description: entry.entryText,
    incidentType: entry.category
  }));

  res.status(HttpStatus.OK).json({ status: "success", data: { entries: mappedEntries } });
});

export const createEntry = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  
  let siteId = req.user!.role === Role.MANAGER ? req.body.siteId : req.user!.siteId;
  
  // Fallback: If siteId is not statically set on user, find their active in-progress shift
  if (!siteId && req.user!.role === Role.USER) {
    const activeShift = await prisma.shift.findFirst({
      where: { userId: req.user!.userId, status: "IN_PROGRESS" }
    });
    if (activeShift) {
      siteId = activeShift.siteId;
    }
  }
  
  if (!tenantId || !siteId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant/site context. Ensure you are clocked in to a shift." });

  const { entryText, category, description, incidentType, location, severity, image } = req.body;

  const finalEntryText = entryText || description;
  const finalCategory = category || incidentType || "ROUTINE";

  if (!finalEntryText) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: "Description/entry text is required" });
  }

  const entry = await prisma.occurrenceBookEntry.create({
    data: { 
      tenantId, 
      siteId, 
      userId: req.user!.userId,
      entryText: finalEntryText, 
      category: finalCategory,
      location: location || null,
      severity: severity || "low",
      image: image || null
    }
  });

  res.status(HttpStatus.CREATED).json({
    status: "success",
    data: {
      entry: {
        ...entry,
        description: entry.entryText,
        incidentType: entry.category
      }
    }
  });
});
