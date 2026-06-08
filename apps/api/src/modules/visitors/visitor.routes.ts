import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import * as visitorController from "./visitor.controller.js";

const router = Router();
router.use(protect);

router.route("/")
  .get(visitorController.getVisitors)
  .post(visitorController.checkInVisitor);

export default router;
