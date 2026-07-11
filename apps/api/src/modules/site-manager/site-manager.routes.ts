import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role } from "@repo/types";
import * as siteManagerController from "./site-manager.controller.js";

const router = Router();
router.use(protect);
router.use(authorize([Role.SITE_MANAGER]));

router.get("/analytics", siteManagerController.getSiteAnalytics);

export default router;
