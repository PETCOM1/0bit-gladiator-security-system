import { Router } from "express";
import { protect, restrictTo } from "../../middleware/auth.middleware.js";
import * as tenantController from "./tenant.controller.js";
import { Role } from "@repo/types";

const router = Router();
router.use(protect);
router.use(restrictTo(Role.SUPER_ADMIN, Role.ADMIN));

router.route("/")
  .get(tenantController.getTenants)
  .post(tenantController.createTenant);

router.route("/:id")
  .get(tenantController.getTenantById);

router.route("/:id/status")
  .patch(tenantController.updateTenantStatus);

export default router;
