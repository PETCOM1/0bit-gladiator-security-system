import { Router } from "express";
import { protect, restrictTo } from "../../middleware/auth.middleware.js";
import { Role } from "@repo/types";
import {
  getTickets, getTicketById, createTicket, replyToTicket, updateTicketStatus
} from "./ticket.controller.js";

const router = Router();
router.use(protect);

router.route("/")
  .get(getTickets)
  .post(createTicket);

router.route("/:id")
  .get(getTicketById);

router.route("/:id/reply")
  .post(replyToTicket);

router.route("/:id/status")
  .patch(updateTicketStatus);

export default router;
