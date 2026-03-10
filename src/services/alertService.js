import Alert from "../models/Alert.js";


/*
Check if an unresolved alert already exists
for the same patient and severity
*/
export const checkExistingAlert = async (patientId, severityLevel) => {

    const existingAlert = await Alert.findOne({
        patientId,
        severityLevel,
        resolved: false
    });

    return existingAlert;

};



/*
Create a new alert
*/
export const createAlert = async ({
    patientId,
    vitalsId,
    riskLogId,
    severityLevel,
    message
}) => {

    const alert = await Alert.create({
        patientId,
        vitalsId,
        riskLogId,
        severityLevel,
        message
    });

    return alert;

};



/*
Main alert handler
Called after RiskLog creation
*/
export const handleAlertFromRisk = async ({
    patientId,
    vitalsId,
    riskLogId,
    severityLevel
}) => {

    // Only generate alerts for serious cases
    if (severityLevel !== "High" && severityLevel !== "Critical") {
        return null;
    }

    // Check for existing unresolved alert
    const existingAlert = await checkExistingAlert(patientId, severityLevel);

    if (existingAlert) {
        return existingAlert;
    }

    // Create new alert
    const message = `Health risk detected: ${severityLevel}`;

    const alert = await createAlert({
        patientId,
        vitalsId,
        riskLogId,
        severityLevel,
        message
    });

    return alert;

};