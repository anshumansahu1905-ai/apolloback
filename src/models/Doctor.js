import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const doctorSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      unique: true
    },

    specialization: {
      type: String,
      required: true
    },

    hospital: {
      type: String
    },

    licenseNumber: {
      type: String,
      required: true,
      unique: true
    },

    experienceYears: {
      type: Number,
      min: 0
    },

    assignedPatients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "patients"
      }
    ],

    availabilityStatus: {
      type: String,
      enum: ["Available", "Busy", "Offline"],
      default: "Available"
    },

    refreshToken: {
      type: String
    }
  },
  { timestamps: true }
);

doctorSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();

  const doctor = this;

  bcrypt.hash(doctor.password, 10, (err, hash) => {
    if (err) {
      return next(err);
    }

    doctor.password = hash;
    next();
  });
});

doctorSchema.methods.isPasswordCorrect = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

doctorSchema.methods.updatePassword = async function (newPassword) {
  const hash = await bcrypt.hash(newPassword, 10);
  this.password = hash;
  await this.save();
};

doctorSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      userId: this._id,
      email: this.email,
      username: this.username,
      role: "doctor"
    },
    process.env.ACCESS_TOKEN_KEY,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  );
};

doctorSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      userId: this._id
    },
    process.env.REFRESH_TOKEN_KEY,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  );
};

doctorSchema.statics.assignPatient = async function (doctorId, patientId) {
  const Doctor = this;

  const doctor = await Doctor.findByIdAndUpdate(
    doctorId,
    {
      $addToSet: { assignedPatients: patientId }
    },
    { new: true }
  );

  await mongoose.model("patients").findByIdAndUpdate(
    patientId,
    {
      assignedDoctor: doctorId
    }
  );

  return doctor;
};

doctorSchema.statics.getPatients = async function (doctorId) {
  return await this.findById(doctorId)
    .populate("assignedPatients")
    .select("assignedPatients");
};

doctorSchema.statics.getAvailableDoctors = async function () {
  return await this.find({
    availabilityStatus: "Available"
  });
};

doctorSchema.methods.getPatientCount = function () {
  return this.assignedPatients.length;
};

//doctorSchema.index({ email: 1 });
//doctorSchema.index({ licenseNumber: 1 });

const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;