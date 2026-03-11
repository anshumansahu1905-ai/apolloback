import express from "express";

import {
  postSignup,
  postLogin,
  logoutPatient,
  getPatientProfile,
  updatePatientProfile,
  getChronicPatients
} from "../controllers/patients.js";

import { verifyJWT } from "../middlewares/verifyJWT.js";

const router = express.Router();


// Authentication
router.post("/signup", postSignup);
router.post("/login", postLogin);
router.post("/logout", verifyJWT, logoutPatient);


// Patient Profile
router.get("/profile", verifyJWT, getPatientProfile);
router.put("/profile", verifyJWT, updatePatientProfile);


// Chronic patients query (optional)
router.get("/chronic", verifyJWT, getChronicPatients);


export default router;