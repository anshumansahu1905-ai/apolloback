import RiskLog from "../models/RiskLog.js";
import Patient from "../models/patients.js";
import Doctor from "../models/Doctor.js";

import ErrorHandler from "../utils/ErrorHandler.js";
import ErrorWrapper from "../utils/ErrorWrapper.js";

export const getLatestRisk = ErrorWrapper(async (req, res) => {

    const patientId = req.user.userId;

    const risk = await RiskLog.findOne({ patientId })
        .sort({ createdAt: -1 });

    if (!risk) {
        throw new ErrorHandler(404, "No risk data found");
    }

    res.status(200).json({
        success: true,
        risk
    });

});

export const getPatientRiskHistory = ErrorWrapper(async (req, res) => {

    const patientId = req.user.userId;

    const risks = await RiskLog.find({ patientId })
        .sort({ createdAt: -1 })
        .limit(50);

    res.status(200).json({
        success: true,
        risks
    });

});

export const getDoctorPatientRiskHistory = ErrorWrapper(async (req, res) => {

    const doctorId = req.user.userId;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
        throw new ErrorHandler(404, "Doctor not found");
    }

    const patients = await Patient.find({ doctor: doctorId });
    const patientIds = patients.map(p => p._id);

    const risks = await RiskLog.find({ patientId: { $in: patientIds } })
        .sort({ createdAt: -1 })
        .limit(50);

    res.status(200).json({
        success: true,
        risks
    });

}); 

export const getHighRiskPatients = ErrorWrapper(async (req, res) => {

    const doctorId = req.user.userId;

    const doctor = await Doctor.findById(doctorId)
        .populate("assignedPatients");

    const patientIds = doctor.assignedPatients.map(p => p._id);

    const highRiskLogs = await RiskLog.find({
        patientId: { $in: patientIds },
        severityLevel: { $in: ["High", "Critical"] }
    })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("patientId", "name age");

    res.status(200).json({
        success: true,
        highRiskLogs
    });

});

export const getCriticalPatients = ErrorWrapper(async (req, res) => {

    const doctorId = req.user.userId;

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
        throw new ErrorHandler(404, "Doctor not found");
    }

    const patientIds = doctor.assignedPatients;

    const criticalRisks = await RiskLog.find({
        patientId: { $in: patientIds },
        severityLevel: "Critical"
    })
        .sort({ createdAt: -1 })
        .populate("patientId", "name age");

    res.status(200).json({
        success: true,
        criticalRisks
    });

});

export const getPatientRiskSummary = ErrorWrapper(async (req, res) => {

    const patientId = req.user.userId;

    const latestRisk = await RiskLog.findOne({ patientId })
        .sort({ createdAt: -1 });

    const totalLogs = await RiskLog.countDocuments({ patientId });

    if (!latestRisk) {
        throw new ErrorHandler(404, "No risk data found");
    }

    res.status(200).json({
        success: true,
        summary: {
            latestRiskScore: latestRisk.riskScore,
            severityLevel: latestRisk.severityLevel,
            totalLogs
        }
    });

});

export const getRiskTrend = ErrorWrapper(async (req, res) => {

    const patientId = req.user.userId;

    const riskLogs = await RiskLog.find({ patientId })
        .sort({ createdAt: 1 })
        .select("riskScore severityLevel createdAt");

    res.status(200).json({
        success: true,
        trend: riskLogs
    });

});

export const deleteRiskLog = ErrorWrapper(async (req, res) => {

    const { riskLogId } = req.params;

    const riskLog = await RiskLog.findByIdAndDelete(riskLogId);

    if (!riskLog) {
        throw new ErrorHandler(404, "Risk log not found");
    }

    res.status(200).json({
        success: true,
        message: "Risk log deleted"
    });

});