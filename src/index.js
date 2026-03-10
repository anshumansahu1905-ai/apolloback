import mongoose from "mongoose";
import express from "express";
import { verifyjwt } from "./middlewares/verifyJWT.js";
import patientRouter from "./routes/patientRouter.js";
import doctorRouter from "./routes/doctorRouter.js";
import vitalsRouter from "./routes/vitalsRouter.js";
import riskLogRouter from "./routes/riskLogRouter.js";
import alertRouter from "./routes/alertRouter.js";
import doctorDashboardRouter from "./routes/doctorDashboardRouter.js";


import cors from "cors";

const app = express();
const PORT = process.env.PORT;

app.use(cors({
    origin: process.env.CORS_ORIGINS,
    credentials: true
}))

//app.use('/', patientRouter);
const getUser = (req, res, next) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ user: undefined });
    }
    return res.status(200).json({ user });
}
app.get('/getuser', verifyjwt, getUser);

app.use("/patients", patientRouter);
app.use("/doctors", doctorRouter);
app.use("/vitals", vitalsRouter);
app.use("/risk", riskLogRouter);
app.use("/alerts", alertRouter);
app.use("/doctor/dashboard", doctorDashboardRouter);






mongoose.connect(`${process.env.DB_PATH}/${process.env.DB_NAME}`)
    .then(async () => {
        console.log("✅ MongoDB Connected Successfully!");
        console.log("📌 Database:", mongoose.connection.name);
        app.listen(PORT, () => {
            console.log("http://localhost:" + PORT);
        })

        
    })
    .catch(err => {
        console.log(err);
        console.log("❌ MongoDB Connection Failed!");
        console.log(error.message);
    })