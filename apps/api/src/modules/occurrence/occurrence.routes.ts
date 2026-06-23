import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role } from "@repo/types";
import * as occurrenceController from "./occurrence.controller.js";

const router = Router();
router.use(protect);

router.get("/", authorize([Role.MANAGER, Role.SITE_MANAGER, Role.USER]), occurrenceController.getEntries);
router.post("/", authorize([Role.MANAGER, Role.SITE_MANAGER, Role.USER]), occurrenceController.createEntry);

export default router;
