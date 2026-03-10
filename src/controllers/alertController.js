import Alert from "../models/Alert.js";
import Doctor from "../models/Doctor.js";

import ErrorHandler from "../utils/ErrorHandler.js";
import ErrorWrapper from "../utils/ErrorWrapper.js";

export const getPatientAlerts = ErrorWrapper(async (req, res) => {

    const patientId = req.user.userId;

    const alerts = await Alert.find({ patientId })
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        alerts
    });

});

export const getDoctorAlerts = ErrorWrapper(async (req, res) => {

    const doctorId = req.user.userId;

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
        throw new ErrorHandler(404, "Doctor not found");
    }

    const patientIds = doctor.assignedPatients;

    const alerts = await Alert.find({
        patientId: { $in: patientIds }
    })
        .sort({ createdAt: -1 })
        .populate("patientId", "name age");

    res.status(200).json({
        success: true,
        alerts
    });

});

export const getAlertById = ErrorWrapper(async (req, res) => {

    const { alertId } = req.params;

    const alert = await Alert.findById(alertId)
        .populate("patientId", "name age")
        .populate("vitalsId")
        .populate("riskLogId");

    if (!alert) {
        throw new ErrorHandler(404, "Alert not found");
    }

    res.status(200).json({
        success: true,
        alert
    });

});

export const getActiveAlerts = ErrorWrapper(async (req, res) => {

    const patientId = req.user.userId;

    const alerts = await Alert.find({
        patientId,
        resolved: false
    })
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        alerts
    });

});

export const getCriticalAlerts = ErrorWrapper(async (req, res) => {

    const doctorId = req.user.userId;

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
        throw new ErrorHandler(404, "Doctor not found");
    }

    const patientIds = doctor.assignedPatients;

    const alerts = await Alert.find({
        patientId: { $in: patientIds },
        severityLevel: "Critical",
        resolved: false
    })
        .sort({ createdAt: -1 })
        .populate("patientId", "name age");

    res.status(200).json({
        success: true,
        alerts
    });

});

export const acknowledgeAlert = ErrorWrapper(async (req, res) => {

    const { alertId } = req.params;

    const alert = await Alert.findById(alertId);

    if (!alert) {
        throw new ErrorHandler(404, "Alert not found");
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = req.user.userId;
    alert.acknowledgedAt = new Date();

    await alert.save();

    res.status(200).json({
        success: true,
        message: "Alert acknowledged",
        alert
    });

});

export const resolveAlert = ErrorWrapper(async (req, res) => {

    const { alertId } = req.params;

    const alert = await Alert.findById(alertId);

    if (!alert) {
        throw new ErrorHandler(404, "Alert not found");
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();

    await alert.save();

    res.status(200).json({
        success: true,
        message: "Alert resolved",
        alert
    });

});

export const deleteAlert = ErrorWrapper(async (req, res) => {

    const { alertId } = req.params;

    const alert = await Alert.findByIdAndDelete(alertId);

    if (!alert) {
        throw new ErrorHandler(404, "Alert not found");
    }

    res.status(200).json({
        success: true,
        message: "Alert deleted"
    });

});