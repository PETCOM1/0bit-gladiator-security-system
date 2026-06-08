import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus, Role } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";

export const getTenantPosts = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const siteId = req.user!.role === Role.SITE_MANAGER ? req.user!.siteId : req.query.siteId as string | undefined;

  if (!tenantId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant context" });

  const posts = await prisma.post.findMany({
    where: { 
      tenantId, 
      ...(siteId && { siteId }),
      isActive: true
    },
    orderBy: { name: 'asc' },
    include: { site: { select: { name: true } } }
  });

  res.status(HttpStatus.OK).json({ status: "success", data: { posts } });
});

export const createPost = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const siteId = req.user!.role === Role.SITE_MANAGER ? req.user!.siteId : req.body.siteId;
  
  if (!tenantId || !siteId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant/site context" });

  const { name } = req.body;

  const post = await prisma.post.create({
    data: { tenantId, siteId, name, isActive: true }
  });

  res.status(HttpStatus.CREATED).json({ status: "success", data: { post } });
});

export const updatePost = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { id } = req.params;
  const { name, isActive } = req.body;

  if (!tenantId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant context" });

  const existing = await prisma.post.findFirst({ where: { id, tenantId } });
  if (!existing) return res.status(HttpStatus.NOT_FOUND).json({ message: "Post not found" });

  if (req.user!.role === Role.SITE_MANAGER && existing.siteId !== req.user!.siteId) {
    return res.status(HttpStatus.FORBIDDEN).json({ message: "Access denied to this post" });
  }

  const post = await prisma.post.update({
    where: { id },
    data: { name, isActive },
  });

  res.status(HttpStatus.OK).json({ status: "success", data: { post } });
});
