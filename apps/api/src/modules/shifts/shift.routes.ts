import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role } from "@repo/types";
import * as shiftController from "./shift.controller.js";

const router = Router();
router.use(protect);

router.get("/tenant", authorize([Role.MANAGER, Role.SITE_MANAGER, Role.GUARD]), shiftController.getTenantShifts);

router.post("/", authorize([Role.MANAGER, Role.SITE_MANAGER]), shiftController.createShift);
router.post("/publish", authorize([Role.MANAGER, Role.SITE_MANAGER]), shiftController.publishShifts);
router.patch("/:id", authorize([Role.MANAGER, Role.SITE_MANAGER]), shiftController.updateShift);
router.delete("/:id", authorize([Role.MANAGER, Role.SITE_MANAGER]), shiftController.deleteShift);
router.post("/start", shiftController.startShift);
router.post("/:id/end", shiftController.endShift);

export default router;
