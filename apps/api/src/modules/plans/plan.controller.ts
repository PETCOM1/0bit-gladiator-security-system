import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError }   from "../../utils/appError.js";

// ── List Plans ───────────────────────────────────────────────────────────────

export const getPlans = catchAsync(async (_req: Request, res: Response) => {
  const plans = await prisma.subscriptionTier.findMany({
    orderBy: { price: "asc" }
  });
  return res.status(HttpStatus.OK).json({ status: "success", data: { plans } });
});

// ── Get Single Plan ──────────────────────────────────────────────────────────

export const getPlanById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const plan = await prisma.subscriptionTier.findUnique({ where: { id } });
  if (!plan) throw new AppError("Plan not found", HttpStatus.NOT_FOUND);
  return res.status(HttpStatus.OK).json({ status: "success", data: { plan } });
});

// ── Create Plan ──────────────────────────────────────────────────────────────

export const createPlan = catchAsync(async (req: Request, res: Response) => {
  const { name, price, maxUsers, maxSites, features } = req.body;
  if (!name || price === undefined) {
    throw new AppError("Name and price required", HttpStatus.BAD_REQUEST);
  }

  const existing = await prisma.subscriptionTier.findUnique({ where: { name } });
  if (existing) throw new AppError("Plan with this name already exists", HttpStatus.CONFLICT);

  const plan = await prisma.subscriptionTier.create({
    data: { name, price, maxUsers, maxSites, features }
  });

  return res.status(HttpStatus.CREATED).json({ status: "success", data: { plan } });
});

// ── Update Plan ──────────────────────────────────────────────────────────────

export const updatePlan = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, price, maxUsers, maxSites, features } = req.body;

  const plan = await prisma.subscriptionTier.update({
    where: { id },
    data: { name, price, maxUsers, maxSites, features }
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { plan } });
});
