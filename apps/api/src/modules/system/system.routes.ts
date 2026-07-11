import { Router } from "express";
import { getHealth, getDbInfo } from "./system.controller.js";

const router: Router = Router();


/**
 * @openapi
 * /api/v1/system/health:
 *  get:
 *    tags:
 *      - System
 *    summary: Health Check
 *    responses:
 *      200:
 *        description: Success
 */
router.get("/health", getHealth);

// TEMPORARY diagnostic - remove after use
router.get("/db-info", getDbInfo);

export default router;
