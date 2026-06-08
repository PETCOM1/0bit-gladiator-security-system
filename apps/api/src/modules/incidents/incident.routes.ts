import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import * as incidentController from "./incident.controller.js";

const router = Router();
router.use(protect);

router.route("/")
  .get(incidentController.getIncidents)
  .post(incidentController.reportIncident);

router.route("/:id")
  .patch(incidentController.updateIncidentStatus);

export default router;
