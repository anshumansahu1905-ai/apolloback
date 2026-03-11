import express from "express";
import { getDoctorDashboard } from "../controllers/doctorDashboardController.js";
import { verifyJWT } from "../middlewares/verifyJWT.js";

const doctorDashboardRouter = express.Router();

doctorDashboardRouter.get("/", verifyJWT, getDoctorDashboard);

export default doctorDashboardRouter;