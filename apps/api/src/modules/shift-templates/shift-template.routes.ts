import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role } from "@repo/types";
import * as shiftTemplateController from "./shift-template.controller.js";

const router = Router();
router.use(protect);
router.use(authorize([Role.MANAGER, Role.SITE_MANAGER]));

router.get("/tenant",   shiftTemplateController.getTenantShiftTemplates);
router.post("/",        shiftTemplateController.createShiftTemplate);
router.patch("/:id",    shiftTemplateController.updateShiftTemplate);
router.delete("/:id",   shiftTemplateController.deleteShiftTemplate);

export default router;
