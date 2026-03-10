import axios from "axios";

/*
AI service base URL
Example:
http://localhost:8000
*/
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export const checkAIServiceHealth = async () => {
  try {
    const res = await axios.get(`${AI_SERVICE_URL}/health`);
    return res.data;
  } catch (error) {
    return { status: "AI service unavailable" };
  }
};



/*
Format vitals before sending to AI service
*/
export const formatVitalsForAI = (vitals) => {

    return {
        heartRate: vitals.heartRate,
        spo2: vitals.spo2,
        systolicBP: vitals.bloodPressure?.systolic,
        diastolicBP: vitals.bloodPressure?.diastolic,
        respiratoryRate: vitals.respiratoryRate,
        bodyTemperature: vitals.bodyTemperature,
        bloodSugar: vitals.bloodSugar,
        bmi: vitals.bmi,
        sleepHours: vitals.sleepHours
    };

};



/*
Fallback risk calculation if AI service fails
Prevents system crash if Python server is down
*/
export const handleAIFailureFallback = (vitals) => {

    let riskScore = 0;

    if (vitals.heartRate > 100) riskScore += 20;

    if (vitals.spo2 < 92) riskScore += 30;

    if (vitals.bloodPressure?.systolic > 150) riskScore += 20;

    if (vitals.bloodSugar > 180) riskScore += 15;

    if (vitals.bodyTemperature > 38) riskScore += 10;

    riskScore = Math.min(riskScore, 100);

    let severityLevel = "Low";

    if (riskScore >= 80) severityLevel = "Critical";
    else if (riskScore >= 60) severityLevel = "High";
    else if (riskScore >= 40) severityLevel = "Moderate";

    return {
        riskScore,
        severityLevel,
        emergencyProbability: riskScore / 100
    };

};



/*
Main AI prediction function
Sends vitals to Python microservice
*/
export const predictRisk = async (vitals) => {

    try {

        const payload = formatVitalsForAI(vitals);

        const response = await axios.post(
            `${AI_SERVICE_URL}/predict`,
            payload,
            {
                timeout: 5000
            }
        );

        const prediction = response.data;

        return {
            riskScore: prediction.riskScore,
            severityLevel: prediction.severityLevel,
            emergencyProbability: prediction.emergencyProbability
        };

    } catch (error) {

        console.error("AI service error:", error.message);

        // fallback prediction
        return handleAIFailureFallback(vitals);

    }

};