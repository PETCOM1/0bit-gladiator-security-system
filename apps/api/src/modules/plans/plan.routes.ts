import { Router } from "express";
import { protect, restrictTo } from "../../middleware/auth.middleware.js";
import { Role } from "@repo/types";
import {
  getPlans, getPlanById, createPlan, updatePlan
} from "./plan.controller.js";

const router = Router();
router.use(protect);

router.route("/")
  .get(getPlans)
  .post(restrictTo(Role.SUPER_ADMIN, Role.ADMIN), createPlan);

router.route("/:id")
  .get(getPlanById)
  .patch(restrictTo(Role.SUPER_ADMIN, Role.ADMIN), updatePlan);

export default router;
