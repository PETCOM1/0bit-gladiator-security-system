import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { getProfile, updateProfile, changePassword, inviteUser, getTenantUsers, updateUserRole, assignToSite, disableUser } from "./user.controller.js";

const router = Router();
router.use(protect);

/**
 * @openapi
 * /api/v1/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     security:
 *       - cookieAuth: []
 */
router.get("/me", getProfile);

/**
 * @openapi
 * /api/v1/users/me:
 *   patch:
 *     tags: [Users]
 *     summary: Update current user profile
 *     security:
 *       - cookieAuth: []
 */
router.patch("/me", updateProfile);

/**
 * @openapi
 * /api/v1/users/me/password:
 *   patch:
 *     tags: [Users]
 *     summary: Change password
 *     security:
 *       - cookieAuth: []
 */
router.patch("/me/password", changePassword);

import { authorize } from "../../middleware/role.middleware.js";
import { Role } from "@repo/types";

/**
 * @openapi
 * /api/v1/users/tenant:
 *   get:
 *     tags: [Users]
 *     summary: Get all users within the tenant
 */
router.get(
  "/tenant",
  authorize([Role.MANAGER]),
  getTenantUsers
);

/**
 * @openapi
 * /api/v1/users/invite:
 *   post:
 *     tags: [Users]
 *     summary: Invite a new user
 */
router.post(
  "/invite",
  authorize([Role.MANAGER, Role.SITE_MANAGER]),
  inviteUser
);

/**
 * @openapi
 * /api/v1/users/{id}/role:
 *   patch:
 *     tags: [Users]
 *     summary: Update a user's role
 */
router.patch(
  "/:id/role",
  authorize([Role.MANAGER]),
  updateUserRole
);

/**
 * @openapi
 * /api/v1/users/{id}/site:
 *   patch:
 *     tags: [Users]
 *     summary: Assign a user to a site
 */
router.patch(
  "/:id/site",
  authorize([Role.MANAGER]),
  assignToSite
);

/**
 * @openapi
 * /api/v1/users/{id}/status:
 *   patch:
 *     tags: [Users]
 *     summary: Disable a user
 */
router.patch(
  "/:id/status",
  authorize([Role.MANAGER]),
  disableUser
);

export default router;