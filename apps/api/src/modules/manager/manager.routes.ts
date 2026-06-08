import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role } from "@repo/types";
import * as managerController from "./manager.controller.js";

const router = Router();
router.use(protect);
router.use(authorize([Role.MANAGER]));

router.get("/stats", managerController.getDashboardStats);
router.patch("/profile", managerController.updateTenantProfile);
router.get("/audit", managerController.getTenantAuditLogs);

export default router;
