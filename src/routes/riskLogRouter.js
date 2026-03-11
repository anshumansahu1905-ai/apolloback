import express from "express";

import {
  getLatestRisk,
  getPatientRiskHistory,
  getDoctorPatientRiskHistory,
  getHighRiskPatients,
  getCriticalPatients,
  getPatientRiskSummary,
  getRiskTrend,
  deleteRiskLog
} from "../controllers/riskLogController.js";

import { verifyJWT }from "../middlewares/verifyJWT.js";

const riskLogRouter = express.Router();


// Patient Routes
riskLogRouter.get("/latest", verifyJWT, getLatestRisk);

riskLogRouter.get("/history", verifyJWT, getPatientRiskHistory);

riskLogRouter.get("/summary", verifyJWT, getPatientRiskSummary);

riskLogRouter.get("/trend", verifyJWT, getRiskTrend);


// Doctor Routes
riskLogRouter.get("/doctor/:patientId", verifyJWT, getDoctorPatientRiskHistory);

riskLogRouter.get("/high-risk", verifyJWT, getHighRiskPatients);

riskLogRouter.get("/critical", verifyJWT, getCriticalPatients);


// Admin / Maintenance
riskLogRouter.delete("/:riskLogId", verifyJWT, deleteRiskLog);


export default riskLogRouter;