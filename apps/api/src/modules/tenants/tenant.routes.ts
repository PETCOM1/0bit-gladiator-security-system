import { Router } from "express";
import { protect, restrictTo } from "../../middleware/auth.middleware.js";
import * as tenantController from "./tenant.controller.js";
import { Role } from "@repo/types";

const router = Router();
router.use(protect);

router.route("/")
  .get(restrictTo(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNT_MANAGER), tenantController.getTenants)
  .post(restrictTo(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNT_MANAGER), tenantController.createTenant);

router.route("/:id")
  .get(restrictTo(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNT_MANAGER), tenantController.getTenantById);

// Suspending/reactivating a live tenant stays an Admin-only action —
// Staff Members can onboard tenants but not change status of existing ones.
router.route("/:id/status")
  .patch(restrictTo(Role.SUPER_ADMIN, Role.ADMIN), tenantController.updateTenantStatus);

export default router;
