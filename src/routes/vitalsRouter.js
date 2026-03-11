import express from "express";

import {
  recordVitals,
  getLatestVitals,
  getPatientVitalsHistory,
  updateVitals,
  deleteVitals,
  getDoctorPatientVitals
} from "../controllers/vitalsController.js";

import { verifyJWT } from "../middlewares/verifyJWT.js";

const router = express.Router();

router.post("/record", verifyJWT, recordVitals);

router.get("/latest", verifyJWT, getLatestVitals);

router.get("/history", verifyJWT, getPatientVitalsHistory);

router.put("/:vitalsId", verifyJWT, updateVitals);

router.delete("/:vitalsId", verifyJWT, deleteVitals);

router.get("/doctor/:patientId", verifyJWT, getDoctorPatientVitals);

export default router;