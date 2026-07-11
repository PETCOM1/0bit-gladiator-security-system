import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";

const DEFAULT_TEMPLATES = [
  { name: "Day Shift",    startTime: "07:00", endTime: "19:00", color: "#f59e0b" },
  { name: "Night Shift",  startTime: "19:00", endTime: "07:00", color: "#6366f1" },
  { name: "Patrol Shift", startTime: "08:00", endTime: "16:00", color: "#10b981" },
  { name: "Relief Shift", startTime: "12:00", endTime: "20:00", color: "#3b82f6" },
];

export const getTenantShiftTemplates = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant context" });

  let templates = await prisma.shiftTemplate.findMany({
    where:   { tenantId },
    orderBy: { createdAt: "asc" },
  });

  // First time this tenant opens the templates tab — seed the same starter
  // set the UI used to show as hardcoded mock data, now persisted for real.
  if (templates.length === 0) {
    await prisma.shiftTemplate.createMany({
      data: DEFAULT_TEMPLATES.map((t) => ({ ...t, tenantId })),
    });
    templates = await prisma.shiftTemplate.findMany({
      where:   { tenantId },
      orderBy: { createdAt: "asc" },
    });
  }

  res.status(HttpStatus.OK).json({ status: "success", data: { templates } });
});

export const createShiftTemplate = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant context" });

  const { name, startTime, endTime, color } = req.body;
  if (!name || !startTime || !endTime) {
    throw new AppError("Name, start time, and end time are required", HttpStatus.BAD_REQUEST);
  }

  const template = await prisma.shiftTemplate.create({
    data: { tenantId, name, startTime, endTime, color: color || "#3b82f6" },
  });

  res.status(HttpStatus.CREATED).json({ status: "success", data: { template } });
});

export const updateShiftTemplate = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { id } = req.params;
  if (!tenantId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant context" });

  const existing = await prisma.shiftTemplate.findFirst({ where: { id, tenantId } });
  if (!existing) return res.status(HttpStatus.NOT_FOUND).json({ message: "Shift template not found" });

  const { name, startTime, endTime, color } = req.body;
  const template = await prisma.shiftTemplate.update({
    where: { id },
    data:  { name, startTime, endTime, color },
  });

  res.status(HttpStatus.OK).json({ status: "success", data: { template } });
});

export const deleteShiftTemplate = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { id } = req.params;
  if (!tenantId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant context" });

  const existing = await prisma.shiftTemplate.findFirst({ where: { id, tenantId } });
  if (!existing) return res.status(HttpStatus.NOT_FOUND).json({ message: "Shift template not found" });

  await prisma.shiftTemplate.delete({ where: { id } });

  res.status(HttpStatus.OK).json({ status: "success", message: "Shift template deleted" });
});
