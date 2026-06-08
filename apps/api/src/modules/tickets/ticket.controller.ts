import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError }   from "../../utils/appError.js";

// ── List Tickets ─────────────────────────────────────────────────────────────

export const getTickets = catchAsync(async (req: Request, res: Response) => {
  const { tenantId, status } = req.query;
  const where: any = {};
  
  if (req.user!.role === "MANAGER") {
    where.tenantId = req.user!.tenantId;
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

  if (req.user!.role === "MANAGER" && ticket.tenantId !== req.user!.tenantId) {
    throw new AppError("Not authorised", HttpStatus.FORBIDDEN);
  }

  return res.status(HttpStatus.OK).json({ status: "success", data: { ticket } });
});

// ── Create Ticket ────────────────────────────────────────────────────────────

export const createTicket = catchAsync(async (req: Request, res: Response) => {
  const { subject, description, priority } = req.body;
  if (!subject || !description) {
    throw new AppError("Subject and description required", HttpStatus.BAD_REQUEST);
  }

  const tenantId = req.user!.role === "MANAGER" ? req.user!.tenantId : req.body.tenantId;
  if (!tenantId) {
    throw new AppError("Tenant ID required", HttpStatus.BAD_REQUEST);
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

  if (req.user!.role === "MANAGER" && ticket.tenantId !== req.user!.tenantId) {
    throw new AppError("Not authorised", HttpStatus.FORBIDDEN);
  }

  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: id,
      senderId: req.user!.userId,
      content
    }
  });

  // Update ticket status depending on who replied
  const newStatus = req.user!.role === "MANAGER" ? "OPEN" : "WAITING_ON_CUSTOMER";
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

  // Managers can only close tickets. Admins can do anything.
  if (req.user!.role === "MANAGER") {
    if (ticket.tenantId !== req.user!.tenantId) throw new AppError("Not authorised", HttpStatus.FORBIDDEN);
    if (status !== "CLOSED" && status !== "RESOLVED") throw new AppError("Managers can only close tickets", HttpStatus.FORBIDDEN);
  }

  const updatedTicket = await prisma.supportTicket.update({
    where: { id },
    data: { status }
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { ticket: updatedTicket } });
});
