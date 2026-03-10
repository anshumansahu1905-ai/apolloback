import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "patients",
      required: true,
      index: true
    },

    riskLogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RiskLog",
      required: true
    },

    vitalsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vitals"
    },

    alertType: {
      type: String,
      enum: [
        "HighRiskPrediction",
        "VitalAnomaly",
        "EmergencyPrediction",
        "ManualDoctorAlert"
      ],
      required: true
    },

    severity: {
      type: String,
      enum: ["Low", "Moderate", "High", "Critical"],
      default: "Low",
      index: true
    },

    message: {
      type: String,
      required: true
    },

    recommendedAction: {
      type: String
    },

    notificationChannels: {
      doctor: {
        type: Boolean,
        default: true
      },
      caregiver: {
        type: Boolean,
        default: false
      },
      patient: {
        type: Boolean,
        default: true
      }
    },

    acknowledged: {
      type: Boolean,
      default: false
    },

    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor"
    },

    acknowledgedAt: {
      type: Date
    },

    resolved: {
      type: Boolean,
      default: false
    },

    resolvedAt: {
      type: Date
    },

    escalationLevel: {
      type: Number,
      default: 0
    },

    triggeredAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

alertSchema.index({ patientId: 1, triggeredAt: -1 });
alertSchema.index({ severity: 1, resolved: 1 });

alertSchema.statics.createFromRiskLog = async function (
  patientId,
  riskLog,
  vitalsId
) {
  const severity = riskLog.severityLevel;

  const existingAlert = await this.findOne({
        patientId,
        severityLevel: riskLog.severityLevel,
        resolved: false
    });

    if (existingAlert) {
        return existingAlert; // avoid duplicate alerts
    }


  if (severity === "Low") return null;

  let message = "Health risk detected.";
  let action = "Monitor patient vitals.";

  if (severity === "High") {
    message = "Patient showing high risk indicators.";
    action = "Doctor review recommended.";
  }

  if (severity === "Critical") {
    message = "Critical health risk predicted.";
    action = "Immediate medical attention required.";
  }

  return await this.create({
    patientId,
    riskLogId: riskLog._id,
    vitalsId,
    alertType: "HighRiskPrediction",
    severity,
    message,
    recommendedAction: action
  });
};

alertSchema.statics.getActiveAlerts = async function (patientId) {
  return await this.find({
    patientId,
    resolved: false
  }).sort({ triggeredAt: -1 });
};

alertSchema.statics.getCriticalAlerts = async function () {
  return await this.find({
    severity: "Critical",
    resolved: false
  })
    .populate("patientId")
    .sort({ triggeredAt: -1 });
};

alertSchema.methods.escalate = async function () {
  this.escalationLevel += 1;

  if (this.escalationLevel >= 2) {
    this.severity = "Critical";
  }

  await this.save();
};

alertSchema.pre("save", function (next) {
  if (!this.recommendedAction) {
    if (this.severity === "Critical") {
      this.recommendedAction = "Immediate medical intervention required.";
    } else if (this.severity === "High") {
      this.recommendedAction = "Doctor should review patient vitals.";
    } else {
      this.recommendedAction = "Monitor patient condition.";
    }
  }

  next();
});

const Alert = mongoose.model("Alert", alertSchema);

export default Alert;