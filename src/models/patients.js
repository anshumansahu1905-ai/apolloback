import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


const patientSchema = new mongoose.Schema(
  {
    username: {
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
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },

    age: {
      type: Number,
      required: true,
      min: 0,
      max: 120
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true
    },

    phone: {
      type: String,
      required: true,
      unique: true
    },

    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: true
    },

    address: {
      type: String,
      trim: true
    },

    emergencyContacts: [
      {
        name: { type: String, required: true },
        relation: { type: String },
        phone: { type: String, required: true }
      }
    ],

    medicalHistory: {
      diabetes: { type: Boolean, default: false },
      asthma: { type: Boolean, default: false },
      heartDisease: { type: Boolean, default: false },
      allergies: { type: String }
    },

    lastKnownLocation: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  { timestamps: true }
);

patientSchema.pre('save', function (next) {
  
    if (!this.isModified("password")) return next();

    const user = this;
    bcrypt.hash(user.password, 10, (err, hash) => {
        if (err) {
            return next(err);
        }
        user.password = hash;
        console.log(user)
        next();
    });
});

patientSchema.methods.isPasswordCorrect = async function (enteredPassword) {
    const user = this;
    return await bcrypt.compare(enteredPassword, user.password);
}

patientSchema.methods.generateRefreshToken = async function () {
    return jwt.sign(
        {
            userId: this._id
        },
        process.env.REFRESH_TOKEN_KEY
        ,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        });
}

patientSchema.methods.generateAccessToken = async function () {
    return jwt.sign(
        {
            userId: this._id,
            email: this.email,
            username: this.username,
            name: this.name
        },
        process.env.ACCESS_TOKEN_KEY
        ,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        });
}

patientSchema.methods.updatePassword = async function (newPassword) {
  const hash = await bcrypt.hash(newPassword, 10);
  this.password = hash;
  await this.save();
};

patientSchema.methods.toSafeObject = function () {
  const patient = this.toObject();
  delete patient.password;
  delete patient.refreshToken;
  return patient;
};

patientSchema.methods.addEmergencyContact = async function (contact) {
  this.emergencyContacts.push(contact);
  await this.save();
};

patientSchema.methods.getPrimaryEmergencyContact = function () {
  if (!this.emergencyContacts || this.emergencyContacts.length === 0) {
    return null;
  }

  return this.emergencyContacts[0];
};

patientSchema.methods.addEmergencyContact = async function (contact) {
  this.emergencyContacts.push(contact);
  await this.save();
};

patientSchema.methods.hasChronicCondition = function () {
  return (
    this.medicalHistory.diabetes ||
    this.medicalHistory.asthma ||
    this.medicalHistory.heartDisease
  );
};

patientSchema.methods.updateLocation = async function (lat, lng) {
  this.lastKnownLocation = { lat, lng };
  await this.save();
};

patientSchema.statics.findByLogin = async function (login) {
  return await this.findOne({
    $or: [
      { email: login.toLowerCase() },
      { username: login.toLowerCase() }
    ]
  });
};

patientSchema.statics.searchPatients = async function (query) {
  return await this.find({
    name: { $regex: query, $options: "i" }
  }).limit(20);
};

patientSchema.statics.getChronicPatients = async function () {
  return await this.find({
    $or: [
      { "medicalHistory.diabetes": true },
      { "medicalHistory.asthma": true },
      { "medicalHistory.heartDisease": true }
    ]
  });
};

patientSchema.virtual("ageGroup").get(function () {
  if (this.age < 18) return "Minor";
  if (this.age < 60) return "Adult";
  return "Senior";
});

//patientSchema.index({ email: 1 });
//patientSchema.index({ username: 1 });
//patientSchema.index({ phone: 1 });

const patients = mongoose.model("patients", patientSchema);
export default patients;
