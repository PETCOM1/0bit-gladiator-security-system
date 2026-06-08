import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role } from "@repo/types";
import * as shiftController from "./shift.controller.js";

const router = Router();
router.use(protect);

router.get("/tenant", authorize([Role.MANAGER]), shiftController.getTenantShifts);

router.post("/start", shiftController.startShift);
router.post("/:id/end", shiftController.endShift);

export default router;
