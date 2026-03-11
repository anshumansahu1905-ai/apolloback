import express from "express";

import {
  postDoctorSignup,
  postDoctorLogin,
  logoutDoctor,
  getDoctorProfile,
  updateDoctorProfile,
  assignPatient,
  unassignPatient,
  getAssignedPatients
} from "../controllers/doctorsController.js";

import { verifyJWT } from "../middlewares/verifyJWT.js";

const router = express.Router();


// Authentication
router.post("/signup", postDoctorSignup);
router.post("/login", postDoctorLogin);
router.post("/logout", verifyJWT, logoutDoctor);


// Doctor Profile
router.get("/profile", verifyJWT, getDoctorProfile);
router.put("/profile", verifyJWT, updateDoctorProfile);


// Patient Management
router.post("/assign-patient", verifyJWT, assignPatient);
router.post("/unassign-patient", verifyJWT, unassignPatient);


// Doctor Dashboard
router.get("/patients", verifyJWT, getAssignedPatients);


export default router;