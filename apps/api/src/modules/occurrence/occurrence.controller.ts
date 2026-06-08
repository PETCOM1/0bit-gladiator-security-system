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

  res.status(HttpStatus.OK).json({ status: "success", data: { entries } });
});

export const createEntry = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const siteId = req.user!.role === Role.MANAGER ? req.body.siteId : req.user!.siteId;
  
  if (!tenantId || !siteId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant/site context" });

  const { entryText, category } = req.body;

  const entry = await prisma.occurrenceBookEntry.create({
    data: { 
      tenantId, 
      siteId, 
      userId: req.user!.userId,
      entryText, 
      category: category || "ROUTINE"
    }
  });

  res.status(HttpStatus.CREATED).json({ status: "success", data: { entry } });
});
