import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError }   from "../../utils/appError.js";
import { AuthService } from "../auth/auth.service.js";

const authService = new AuthService();

const PROFILE_SELECT = {
  id: true, email: true, role: true, accountStatus: true,
  firstName: true, lastName: true, displayName: true,
  avatarUrl: true, phone: true,
  city: true, country: true, language: true, dateOfBirth: true,
  lastActiveAt: true, createdAt: true,
  onLeave: true,
  siteId: true,
  postId: true,
  post: { select: { id: true, name: true } }
} as const;

// ── Get profile ────────────────────────────────────────────────────────────────

export const getProfile = catchAsync(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where:  { id: req.user!.userId },
    select: PROFILE_SELECT,
  });
  if (!user) throw new AppError("User not found", HttpStatus.NOT_FOUND);
  return res.status(HttpStatus.OK).json({ status: "success", data: { user } });
});

// ── Update profile ─────────────────────────────────────────────────────────────

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const { firstName, lastName, displayName, avatarUrl, phone, city, country, language, dateOfBirth } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data:  {
      firstName:   firstName   ?? undefined,
      lastName:    lastName    ?? undefined,
      displayName: displayName ?? undefined,
      avatarUrl:   avatarUrl   ?? undefined,
      phone:       phone       ?? undefined,
      city:        city        ?? undefined,
      country:     country     ?? undefined,
      language:    language    ?? undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    },
    select: PROFILE_SELECT,
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { user } });
});

// ── Change password ────────────────────────────────────────────────────────────

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    throw new AppError("Current and new password are required", HttpStatus.BAD_REQUEST);

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) throw new AppError("User not found", HttpStatus.NOT_FOUND);

  const match = await authService.verifyPassword(currentPassword, user.password);
  if (!match) throw new AppError("Current password is incorrect", HttpStatus.UNAUTHORIZED);

  const hashed = await authService.hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  await prisma.auditLog.create({
    data: { userId: user.id, action: "PASSWORD_CHANGED" },
  });
  req.auditLogged = true;

  return res.status(HttpStatus.OK).json({ status: "success", message: "Password changed successfully" });
});

// ── Invite user ───────────────────────────────────────────────────────────────

import { sendInviteEmail } from "../../services/mail.service.js";

export const inviteUser = catchAsync(async (req: Request, res: Response) => {
  const { email, firstName, lastName, siteId, role } = req.body;
  if (!email) throw new AppError("Email is required", HttpStatus.BAD_REQUEST);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError("User already exists", HttpStatus.CONFLICT);

  const tenantId = req.user!.tenantId;
  if (!tenantId) throw new AppError("No tenant context", HttpStatus.FORBIDDEN);

  const targetSiteId = req.user!.role === "SITE_MANAGER" ? req.user!.siteId : (siteId || req.user!.siteId);

  // Prevent creating ADMIN or SUPER_ADMIN
  const targetRole = role === "SITE_MANAGER" ? "SITE_MANAGER" : "GUARD";

  const code    = Math.random().toString(36).slice(2, 10).toUpperCase();
  const expires = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      email,
      password:            "",
      role:                targetRole,
      accountStatus:       "PENDING",
      firstName:           firstName ?? null,
      lastName:            lastName  ?? null,
      invitedById:         req.user!.userId,
      verificationCode:    code,
      verificationExpires: expires,
      tenantId:            tenantId,
      siteId:              targetSiteId || null,
    },
  });

  const inviteLink = `${process.env.FRONTEND_URL}/set-password?token=${code}&email=${encodeURIComponent(email)}`;
  await sendInviteEmail(email, inviteLink, firstName ?? "User");

  await prisma.auditLog.create({
    data: { userId: req.user!.userId, action: "USER_INVITED", meta: { email, siteId: targetSiteId, role: targetRole } },
  });
  req.auditLogged = true;

  return res.status(HttpStatus.CREATED).json({
    status:  "success",
    message: "User invited successfully",
    data:    { id: user.id, email: user.email },
  });
});

export const getTenantUsers = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const siteId = req.user!.role === "MANAGER" ? null : req.user!.siteId;
  if (!tenantId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant context" });

  const users = await prisma.user.findMany({
    where: { tenantId, role: { in: ["SITE_MANAGER", "GUARD"] }, accountStatus: { not: "DELETED" }, ...(siteId && { siteId }) },
    select: { ...PROFILE_SELECT, site: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" }
  });
  
  res.status(HttpStatus.OK).json({ status: "success", data: { users } });
});

export const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { id } = req.params;
  const { role } = req.body;

  if (!tenantId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant context" });
  if (!["SITE_MANAGER", "GUARD"].includes(role)) return res.status(HttpStatus.BAD_REQUEST).json({ message: "Invalid role" });

  const user = await prisma.user.findFirst({ where: { id, tenantId } });
  if (!user) return res.status(HttpStatus.NOT_FOUND).json({ message: "User not found" });

  await prisma.user.update({ where: { id }, data: { role } });

  res.status(HttpStatus.OK).json({ status: "success", message: "User role updated" });
});

export const assignToSite = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { id } = req.params;
  const { siteId } = req.body;

  if (!tenantId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant context" });

  const user = await prisma.user.findFirst({ where: { id, tenantId } });
  if (!user) return res.status(HttpStatus.NOT_FOUND).json({ message: "User not found" });

  await prisma.user.update({ where: { id }, data: { siteId } });

  res.status(HttpStatus.OK).json({ status: "success", message: "User site updated" });
});

export const disableUser = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { id } = req.params;

  if (!tenantId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant context" });

  const user = await prisma.user.findFirst({ where: { id, tenantId } });
  if (!user) return res.status(HttpStatus.NOT_FOUND).json({ message: "User not found" });

  const newStatus = user.accountStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

  await prisma.user.update({
    where: { id },
    data: { accountStatus: newStatus }
  });

  res.status(HttpStatus.OK).json({ status: "success", message: `User status changed to ${newStatus}` });
});

export const toggleUserLeave = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { id } = req.params;

  if (!tenantId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant context" });

  const user = await prisma.user.findFirst({ where: { id, tenantId } });
  if (!user) return res.status(HttpStatus.NOT_FOUND).json({ message: "User not found" });

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { onLeave: !user.onLeave }
  });

  res.status(HttpStatus.OK).json({ status: "success", message: "User leave status updated", data: { user: updatedUser } });
});

export const assignToPost = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { id } = req.params;
  const { postId } = req.body;

  if (!tenantId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant context" });

  const user = await prisma.user.findFirst({ where: { id, tenantId } });
  if (!user) return res.status(HttpStatus.NOT_FOUND).json({ message: "User not found" });

  // If Site Supervisor is calling, verify the post belongs to their site
  if (req.user!.role === "SITE_MANAGER") {
    if (user.siteId !== req.user!.siteId) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: "You can only assign posts to officers on your site" });
    }
    if (postId) {
      const post = await prisma.post.findFirst({ where: { id: postId, siteId: req.user!.siteId } });
      if (!post) return res.status(HttpStatus.BAD_REQUEST).json({ message: "Invalid post for your site" });
    }
  }

  await prisma.user.update({
    where: { id },
    data: { postId: postId || null }
  });

  res.status(HttpStatus.OK).json({ status: "success", message: "User post updated successfully" });
});