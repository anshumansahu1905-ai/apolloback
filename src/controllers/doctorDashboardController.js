import Doctor from "../models/Doctor.js";
import Vitals from "../models/Vitals.js";
import RiskLog from "../models/RiskLog.js";
import Alert from "../models/Alert.js";

import ErrorHandler from "../utils/ErrorHandler.js";
import ErrorWrapper from "../utils/ErrorWrapper.js";


export const getDoctorDashboard = ErrorWrapper(async (req, res) => {

    const doctorId = req.user.userId;

    const doctor = await Doctor.findById(doctorId)
        .populate("assignedPatients", "name age gender");

    if (!doctor) {
        throw new ErrorHandler(404, "Doctor not found");
    }

    const patientIds = doctor.assignedPatients.map(p => p._id);

    // High risk patients
    const highRiskPatients = await RiskLog.find({
        patientId: { $in: patientIds },
        severityLevel: { $in: ["High", "Critical"] }
    })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("patientId", "name age");


    // Critical alerts
    const criticalAlerts = await Alert.find({
        patientId: { $in: patientIds },
        severityLevel: "Critical",
        resolved: false
    })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("patientId", "name age");


    // Recent alerts
    const recentAlerts = await Alert.find({
        patientId: { $in: patientIds }
    })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("patientId", "name age");


    // Recent vitals
    const recentVitals = await Vitals.find({
        patientId: { $in: patientIds }
    })
        .sort({ recordedAt: -1 })
        .limit(10)
        .populate("patientId", "name age");


    res.status(200).json({
        success: true,
        dashboard: {
            assignedPatients: doctor.assignedPatients.length,
            highRiskPatients,
            criticalAlerts,
            recentAlerts,
            recentVitals
        }
    });

});