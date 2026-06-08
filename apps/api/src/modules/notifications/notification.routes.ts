import { Router } from "express";
import { protect, restrictTo } from "../../middleware/auth.middleware.js";
import { Role } from "@repo/types";
import {
  listNotifications, markRead, markAllRead, deleteNotification, broadcastNotification
} from "./notification.controller.js";

const router = Router();
router.use(protect);

router.post("/broadcast", restrictTo(Role.SUPER_ADMIN, Role.ADMIN), broadcastNotification);

router.get("/",               listNotifications);
router.patch("/read-all",     markAllRead);
router.patch("/:id/read",     markRead);
router.delete("/:id",         deleteNotification);

export default router;
