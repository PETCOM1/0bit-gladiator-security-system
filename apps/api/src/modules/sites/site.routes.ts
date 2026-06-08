import { Router } from "express";
import { protect, restrictTo } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import * as siteController from "./site.controller.js";
import { Role } from "@repo/types";

const router = Router();
router.use(protect);
router.use(restrictTo(Role.ADMIN, Role.MANAGER, Role.SITE_MANAGER));

router.route("/")
  .get(siteController.getSites)
  .post(authorize([Role.ADMIN, Role.MANAGER]), siteController.createSite);

router.route("/:id")
  .get(siteController.getSiteById)
  .put(authorize([Role.ADMIN, Role.MANAGER]), siteController.updateSite)
  .delete(authorize([Role.ADMIN, Role.MANAGER]), siteController.deleteSite);

export default router;
