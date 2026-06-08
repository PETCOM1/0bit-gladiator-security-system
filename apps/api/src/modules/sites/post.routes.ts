import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role } from "@repo/types";
import * as postController from "./post.controller.js";

const router = Router();
router.use(protect);

router.get("/tenant", authorize([Role.MANAGER, Role.SITE_MANAGER]), postController.getTenantPosts);
router.post("/", authorize([Role.MANAGER, Role.SITE_MANAGER]), postController.createPost);
router.patch("/:id", authorize([Role.MANAGER, Role.SITE_MANAGER]), postController.updatePost);

export default router;
