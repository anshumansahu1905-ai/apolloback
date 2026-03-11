import express from "express";

import {
  getPatientAlerts,
  getDoctorAlerts,
  getActiveAlerts,
  getCriticalAlerts,
  getAlertById,
  acknowledgeAlert,
  resolveAlert,
  deleteAlert
} from "../controllers/alertController.js";

import { verifyJWT } from "../middlewares/verifyJWT.js";

const alertRouter = express.Router();


// Patient Alerts
alertRouter.get("/patient", verifyJWT, getPatientAlerts);

alertRouter.get("/active", verifyJWT, getActiveAlerts);


// Doctor Alerts
alertRouter.get("/doctor", verifyJWT, getDoctorAlerts);

alertRouter.get("/critical", verifyJWT, getCriticalAlerts);


// Alert Details
alertRouter.get("/:alertId", verifyJWT, getAlertById);


// Alert Management
alertRouter.patch("/:alertId/acknowledge", verifyJWT, acknowledgeAlert);

alertRouter.patch("/:alertId/resolve", verifyJWT, resolveAlert);


// Optional maintenance
alertRouter.delete("/:alertId", verifyJWT, deleteAlert);


export default alertRouter;