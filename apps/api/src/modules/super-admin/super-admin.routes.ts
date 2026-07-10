import { Router } from "express";
import { protect }   from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role }      from "@repo/types";
import {
  platformStats, listAdmins, inviteAdmin,
  removeAdmin, getSettings, updateSetting, auditLog,
  listAllUsers, hardDeleteUser,
} from "./super-admin.controller.js";

const router = Router();
router.use(protect);

/**
 * @openapi
 * /api/v1/super-admin/stats:
 *   get:
 *     tags: [SuperAdmin]
 *     summary: Platform-wide stats
 *     security:
 *       - cookieAuth: []
 */
router.get("/stats", authorize([Role.SUPER_ADMIN, Role.ADMIN]), platformStats);

/**
 * @openapi
 * /api/v1/super-admin/admins:
 *   get:
 *     tags: [SuperAdmin]
 *     summary: List all admins
 *     security:
 *       - cookieAuth: []
 */
router.get("/admins", authorize([Role.SUPER_ADMIN]), listAdmins);

/**
 * @openapi
 * /api/v1/super-admin/admins/invite:
 *   post:
 *     tags: [SuperAdmin]
 *     summary: Invite a new admin (sends email with set-password link)
 *     security:
 *       - cookieAuth: []
 */
router.post("/admins/invite", authorize([Role.SUPER_ADMIN]), inviteAdmin);

/**
 * @openapi
 * /api/v1/super-admin/admins/{id}:
 *   delete:
 *     tags: [SuperAdmin]
 *     summary: Remove an admin
 *     security:
 *       - cookieAuth: []
 */
router.delete("/admins/:id", authorize([Role.SUPER_ADMIN]), removeAdmin);

/**
 * @openapi
 * /api/v1/super-admin/users:
 *   get:
 *     tags: [SuperAdmin]
 *     summary: List all platform users, any role or tenant
 *     security:
 *       - cookieAuth: []
 */
router.get("/users", authorize([Role.SUPER_ADMIN]), listAllUsers);

/**
 * @openapi
 * /api/v1/super-admin/users/{id}:
 *   delete:
 *     tags: [SuperAdmin]
 *     summary: Permanently delete a user (not a status change)
 *     security:
 *       - cookieAuth: []
 */
router.delete("/users/:id", authorize([Role.SUPER_ADMIN]), hardDeleteUser);

/**
 * @openapi
 * /api/v1/super-admin/settings:
 *   get:
 *     tags: [SuperAdmin]
 *     summary: Get all system settings
 *     security:
 *       - cookieAuth: []
 */
router.get("/audit", authorize([Role.SUPER_ADMIN, Role.ADMIN]), auditLog);
router.get("/settings", authorize([Role.SUPER_ADMIN, Role.ADMIN]), getSettings);

/**
 * @openapi
 * /api/v1/super-admin/settings:
 *   put:
 *     tags: [SuperAdmin]
 *     summary: Update a system setting
 *     security:
 *       - cookieAuth: []
 */
router.put("/settings", authorize([Role.SUPER_ADMIN, Role.ADMIN]), updateSetting);

export default router;