import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError }   from "../../utils/appError.js";

// ── List own notifications ─────────────────────────────────────────────────────

export const listNotifications = catchAsync(async (req: Request, res: Response) => {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where:   { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      take:    50,
    }),
    prisma.notification.count({
      where: { userId: req.user!.userId, read: false },
    }),
  ]);

  return res.status(HttpStatus.OK).json({
    status: "success",
    data:   { notifications, unreadCount },
  });
});

// ── Mark one as read ───────────────────────────────────────────────────────────

export const markRead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification)
    throw new AppError("Notification not found", HttpStatus.NOT_FOUND);
  if (notification.userId !== req.user!.userId)
    throw new AppError("Not authorised", HttpStatus.FORBIDDEN);

  await prisma.notification.update({ where: { id }, data: { read: true } });

  return res.status(HttpStatus.OK).json({ status: "success" });
});

// ── Mark all as read ───────────────────────────────────────────────────────────

export const markAllRead = catchAsync(async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, read: false },
    data:  { read: true },
  });

  return res.status(HttpStatus.OK).json({ status: "success" });
});

// ── Delete one ─────────────────────────────────────────────────────────────────

export const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification)
    throw new AppError("Notification not found", HttpStatus.NOT_FOUND);
  if (notification.userId !== req.user!.userId)
    throw new AppError("Not authorised", HttpStatus.FORBIDDEN);

  await prisma.notification.delete({ where: { id } });

  return res.status(HttpStatus.OK).json({ status: "success" });
});

// ── Broadcast notification ───────────────────────────────────────────────────────

export const broadcastNotification = catchAsync(async (req: Request, res: Response) => {
  const { title, message } = req.body;
  if (!title || !message) {
    throw new AppError("Title and message are required", HttpStatus.BAD_REQUEST);
  }

  // Get all active tenant managers
  const managers = await prisma.user.findMany({
    where: { role: "MANAGER", accountStatus: "ACTIVE" },
    select: { id: true }
  });

  if (managers.length > 0) {
    const notifications = managers.map(m => ({
      userId: m.id,
      title,
      message,
      type: "SYSTEM_ALERT"
    }));

    await prisma.notification.createMany({
      data: notifications
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      action: "BROADCAST_NOTIFICATION_SENT",
      meta: { title, count: managers.length }
    }
  });
  req.auditLogged = true;

  return res.status(HttpStatus.OK).json({ 
    status: "success", 
    message: `Broadcast sent to ${managers.length} managers.` 
  });
});
