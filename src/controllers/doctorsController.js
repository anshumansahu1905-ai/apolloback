import Doctor from "../models/Doctor.js";
//import Patient from "../models/patients.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import ErrorWrapper from "../utils/ErrorWrapper.js";

export const postDoctorSignup = ErrorWrapper(async (req, res) => {

    const { username, password, email, name, licenseNumber, specialization, phone } = req.body;

    if (!username || !password || !email || !name || !licenseNumber || !specialization || !phone) {
        throw new ErrorHandler(400, "Please provide all required fields");
    }

    const existingDoctor = await Doctor.findOne({
        $or: [{ username }, { email }, { licenseNumber }]
    });

    if (existingDoctor) {
        throw new ErrorHandler(400, "Doctor already exists");
    }

    const doctor = await Doctor.create({
        username,
        password,
        email,
        name,
        phone,
        licenseNumber,
        specialization
    });

    const newDoctor = await Doctor.findById(doctor._id)
        .select("-password -refreshToken");

    res.status(201).json({
        success: true,
        doctor: newDoctor
    });
});

const generateAccessTokenAndRefreshToken = async (doctorId) => {

    try {

        const doctor = await Doctor.findById(doctorId);

        const accessToken = await doctor.generateAccessToken();
        const refreshToken = await doctor.generateRefreshToken();

        doctor.refreshToken = refreshToken;

        await doctor.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {

        throw new ErrorHandler(500, "Error generating tokens");

    }
};

export const postDoctorLogin = ErrorWrapper(async (req, res) => {

    const { username, licenseNumber, password } = req.body;

    if (!username && !licenseNumber) {
        throw new ErrorHandler(400, "Enter username or email");
    }

    if (!password) {
        throw new ErrorHandler(400, "Enter password");
    }

    let doctor = await Doctor.findOne({
        $or: [{ username }, { licenseNumber }]
    });

    if (!doctor) {
        throw new ErrorHandler(400, "Invalid credentials");
    }

    const passwordMatch = await doctor.isPasswordCorrect(password);

    if (!passwordMatch) {
        throw new ErrorHandler(400, "Invalid password");
    }

    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(doctor._id);

    doctor = await Doctor.findById(doctor._id)
        .select("-password -refreshToken");

    res.status(200)
        .cookie("AccessToken", accessToken)
        .cookie("RefreshToken", refreshToken)
        .json({
            success: true,
            message: "Login successful",
            doctor
        });
});

export const logoutDoctor = ErrorWrapper(async (req, res) => {

    await Doctor.findByIdAndUpdate(
        req.user.userId,
        { $unset: { refreshToken: "" } }
    );

    res.status(200)
        .clearCookie("AccessToken")
        .clearCookie("RefreshToken")
        .json({
            success: true,
            message: "Logout successful"
        });
});

export const getDoctorProfile = ErrorWrapper(async (req, res) => {

    const doctor = await Doctor.findById(req.user.userId)
        .select("-password -refreshToken");

    if (!doctor) {
        throw new ErrorHandler(404, "Doctor not found");
    }

    res.status(200).json({
        success: true,
        doctor
    });
});

export const updateDoctorProfile = ErrorWrapper(async (req, res) => {

    const doctor = await Doctor.findByIdAndUpdate(
        req.user.userId,
        req.body,
        { new: true }
    ).select("-password -refreshToken");

    res.status(200).json({
        success: true,
        doctor
    });
});

export const assignPatient = ErrorWrapper(async (req, res) => {

    const { patientId } = req.body;

    const doctor = await Doctor.assignPatient(req.user.userId, patientId);

    res.status(200).json({
        success: true,
        doctor
    });
});

export const unassignPatient = ErrorWrapper(async (req, res) => {

    const { patientId } = req.body;

    await Doctor.unassignPatient(req.user.userId, patientId);

    res.status(200).json({
        success: true,
        message: "Patient unassigned successfully"
    });
});

export const getAssignedPatients = ErrorWrapper(async (req, res) => {

    const doctor = await Doctor.findById(req.user.userId)
        .populate("assignedPatients");

    res.status(200).json({
        success: true,
        patients: doctor.assignedPatients
    });
});