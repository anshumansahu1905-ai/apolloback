import Vitals from "../models/Vitals.js";
import Patient from "../models/patients.js";
import Doctor from "../models/Doctor.js";
import RiskLog from "../models/RiskLog.js";
import Alert from "../models/Alert.js";

import ErrorHandler from "../utils/ErrorHandler.js";
import ErrorWrapper from "../utils/ErrorWrapper.js";

import { predictRisk } from "../services/aiService.js";
import { handleAlertFromRisk } from "../services/alertService.js";

export const recordVitals = ErrorWrapper(async (req, res) => {

    const patientId = req.user.userId;

    const {
        heartRate,
        bloodPressure,
        spo2,
        respiratoryRate,
        bodyTemperature,
        bloodSugar,
        bmi,
        sleepHours
    } = req.body;
    

    if (!heartRate || !bloodPressure || !spo2) {
        throw new ErrorHandler(400, "Missing required vitals data");
    }

    const patient = await Patient.findById(patientId);

    if (!patient) {
        throw new ErrorHandler(404, "Patient not found");
    }

    const vitals = await Vitals.create({
        patientId,
        heartRate,
        bloodPressure,
        spo2,
        respiratoryRate,
        bodyTemperature,
        bloodSugar,
        bmi,
        sleepHours
    });

    //const prediction = await predictRisk(vitals);

    const prediction = await predictRisk({
        heartRate,
        bloodPressure,
        spo2,
        respiratoryRate,
        bodyTemperature,
        bloodSugar,
        bmi,
        sleepHours
    });

    // --- Basic Risk Score Logic (temporary until AI service) ---
    let riskScore = 0;

    if (heartRate > 100) riskScore += 20;
    if (spo2 < 92) riskScore += 30;
    if (bloodPressure.systolic > 150) riskScore += 20;
    if (bloodSugar > 180) riskScore += 15;

    // chronic condition multiplier
    if (patient.hasChronicCondition()) {
        riskScore *= 1.2;
    }

    riskScore = Math.min(Math.round(riskScore), 100);

    const riskLog = await RiskLog.create({
        patientId,
        vitalsId: vitals._id,
        riskScore,
        emergencyProbability: riskScore / 100,
        vitalsSnapshot: {
            heartRate,
            systolicBP: bloodPressure.systolic,
            diastolicBP: bloodPressure.diastolic,
            spo2,
            bloodSugar,
            bodyTemperature,
            respiratoryRate
        }
    });

        /*
    if (riskLog.severityLevel === "High" || riskLog.severityLevel === "Critical") {

        await Alert.createFromRiskLog(
            patientId,
            riskLog,
            vitals._id
        );

    }*/

    await handleAlertFromRisk({
        patientId,
        vitalsId: vitals._id,
        riskLogId: riskLog._id,
        severityLevel: riskLog.severityLevel
    });


    res.status(201).json({
        success: true,
        vitals,
        riskScore
    });

});

export const getLatestVitals = ErrorWrapper(async (req, res) => {

    const patientId = req.user.userId;

    const vitals = await Vitals.findOne({ patientId })
        .sort({ recordedAt: -1 });

    if (!vitals) {
        throw new ErrorHandler(404, "No vitals found");
    }

    res.status(200).json({
        success: true,
        vitals
    });

});

export const getPatientVitalsHistory = ErrorWrapper(async (req, res) => {

    const patientId = req.user.userId;

    const vitals = await Vitals.find({ patientId })
        .sort({ recordedAt: -1 })
        .limit(50);

    res.status(200).json({
        success: true,
        vitals
    });

});

export const updateVitals = ErrorWrapper(async (req, res) => {

    const { vitalsId } = req.params;

    const vitals = await Vitals.findByIdAndUpdate(
        vitalsId,
        req.body,
        { new: true }
    );

    if (!vitals) {
        throw new ErrorHandler(404, "Vitals not found");
    }

    res.status(200).json({
        success: true,
        vitals
    });

});

export const deleteVitals = ErrorWrapper(async (req, res) => {

    const { vitalsId } = req.params;

    const vitals = await Vitals.findByIdAndDelete(vitalsId);

    if (!vitals) {
        throw new ErrorHandler(404, "Vitals not found");
    }

    res.status(200).json({
        success: true,
        message: "Vitals deleted"
    });

});

export const getDoctorPatientVitals = ErrorWrapper(async (req, res) => {

    const doctorId = req.user.userId;
    const { patientId } = req.params;

    const doctor = await Doctor.findById(doctorId);

    if (!doctor.assignedPatients.includes(patientId)) {
        throw new ErrorHandler(403, "Access denied to this patient");
    }

    const vitals = await Vitals.find({ patientId })
        .sort({ recordedAt: -1 })
        .limit(50);

    res.status(200).json({
        success: true,
        vitals
    });

});