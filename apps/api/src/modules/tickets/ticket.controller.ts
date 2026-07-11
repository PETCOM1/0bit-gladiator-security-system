import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError }   from "../../utils/appError.js";

// Account Managers only get to act on tickets for tenants they personally
// onboarded — not the whole platform's tickets.
async function assertOwnsTenant(tenantId: string, userId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { createdById: true } });
  if (!tenant || tenant.createdById !== userId) {
    throw new AppError("Not authorised", HttpStatus.FORBIDDEN);
  }
}

// ── List Tickets ─────────────────────────────────────────────────────────────

export const getTickets = catchAsync(async (req: Request, res: Response) => {
  const { tenantId, status } = req.query;
  const where: any = {};

  if (req.user!.role === "MANAGER" || req.user!.role === "SITE_MANAGER") {
    where.tenantId = req.user!.tenantId;
    if (req.user!.role === "SITE_MANAGER") {
      where.createdById = req.user!.userId;
    }
  } else if (req.user!.role === "ACCOUNT_MANAGER") {
    where.tenant = { createdById: req.user!.userId };
  } else if (tenantId) {
    where.tenantId = tenantId;
  }

  if (status) {
    where.status = status;
  }

  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      createdBy: { select: { firstName: true, lastName: true, email: true } },
      tenant: { select: { name: true } },
      _count: { select: { messages: true } }
    }
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { tickets } });
});

// ── Get Single Ticket ────────────────────────────────────────────────────────

export const getTicketById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      createdBy: { select: { firstName: true, lastName: true, email: true } },
      tenant: { select: { name: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { firstName: true, lastName: true, role: true } } }
      }
    }
  });

  if (!ticket) throw new AppError("Ticket not found", HttpStatus.NOT_FOUND);

  if (req.user!.role === "MANAGER" || req.user!.role === "SITE_MANAGER") {
    if (ticket.tenantId !== req.user!.tenantId) throw new AppError("Not authorised", HttpStatus.FORBIDDEN);
    if (req.user!.role === "SITE_MANAGER" && ticket.createdById !== req.user!.userId) {
      throw new AppError("Not authorised", HttpStatus.FORBIDDEN);
    }
  } else if (req.user!.role === "ACCOUNT_MANAGER") {
    await assertOwnsTenant(ticket.tenantId, req.user!.userId);
  }

  return res.status(HttpStatus.OK).json({ status: "success", data: { ticket } });
});

// ── Create Ticket ────────────────────────────────────────────────────────────

export const createTicket = catchAsync(async (req: Request, res: Response) => {
  const { subject, description, priority } = req.body;
  if (!subject || !description) {
    throw new AppError("Subject and description required", HttpStatus.BAD_REQUEST);
  }

  const tenantId = (req.user!.role === "MANAGER" || req.user!.role === "SITE_MANAGER") ? req.user!.tenantId : req.body.tenantId;
  if (!tenantId) {
    throw new AppError("Tenant ID required", HttpStatus.BAD_REQUEST);
  }

  if (req.user!.role === "ACCOUNT_MANAGER") {
    await assertOwnsTenant(tenantId, req.user!.userId);
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      subject,
      description,
      priority: priority || "MEDIUM",
      status: "OPEN",
      tenantId,
      createdById: req.user!.userId
    }
  });

  // Initial message
  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      senderId: req.user!.userId,
      content: description
    }
  });

  return res.status(HttpStatus.CREATED).json({ status: "success", data: { ticket } });
});

// ── Reply to Ticket ──────────────────────────────────────────────────────────

export const replyToTicket = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;
  if (!content) throw new AppError("Content required", HttpStatus.BAD_REQUEST);

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) throw new AppError("Ticket not found", HttpStatus.NOT_FOUND);

  if (req.user!.role === "MANAGER" || req.user!.role === "SITE_MANAGER") {
    if (ticket.tenantId !== req.user!.tenantId) throw new AppError("Not authorised", HttpStatus.FORBIDDEN);
    if (req.user!.role === "SITE_MANAGER" && ticket.createdById !== req.user!.userId) {
      throw new AppError("Not authorised", HttpStatus.FORBIDDEN);
    }
  } else if (req.user!.role === "ACCOUNT_MANAGER") {
    await assertOwnsTenant(ticket.tenantId, req.user!.userId);
  }

  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: id,
      senderId: req.user!.userId,
      content
    }
  });

  // Update ticket status depending on who replied
  const newStatus = (req.user!.role === "MANAGER" || req.user!.role === "SITE_MANAGER") ? "OPEN" : "WAITING_ON_CUSTOMER";
  await prisma.supportTicket.update({
    where: { id },
    data: { status: newStatus as any, updatedAt: new Date() }
  });

  return res.status(HttpStatus.CREATED).json({ status: "success", data: { message } });
});

// ── Update Ticket Status ─────────────────────────────────────────────────────

export const updateTicketStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) throw new AppError("Status required", HttpStatus.BAD_REQUEST);

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) throw new AppError("Ticket not found", HttpStatus.NOT_FOUND);

  // Managers can only close tickets. Admins and Account Managers can do anything
  // on tickets they're authorised to see.
  if (req.user!.role === "MANAGER" || req.user!.role === "SITE_MANAGER") {
    if (ticket.tenantId !== req.user!.tenantId) throw new AppError("Not authorised", HttpStatus.FORBIDDEN);
    if (req.user!.role === "SITE_MANAGER" && ticket.createdById !== req.user!.userId) {
      throw new AppError("Not authorised", HttpStatus.FORBIDDEN);
    }
    if (status !== "CLOSED" && status !== "RESOLVED") throw new AppError("Managers can only close/resolve tickets", HttpStatus.FORBIDDEN);
  } else if (req.user!.role === "ACCOUNT_MANAGER") {
    await assertOwnsTenant(ticket.tenantId, req.user!.userId);
  }

  const updatedTicket = await prisma.supportTicket.update({
    where: { id },
    data: { status }
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { ticket: updatedTicket } });
});
