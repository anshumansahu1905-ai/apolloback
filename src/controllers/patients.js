import patients from "../models/patients.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import ErrorWrapper from "../utils/ErrorWrapper.js";
import Vitals from "../models/Vitals.js";
import RiskLog from "../models/RiskLog.js";
import Alert from "../models/Alert.js";
//import uploadOnCloudinary from "../utils/uploadOnCloudinary.js";

export const postSignup = ErrorWrapper(async function (req, res, next) {
    const { username, password, email, name } = req.body;
    const incomingFields = Object.keys(req.body);
    // How to identify the missingFields?
    const requiredFields = ["username", "password", "email", "name","age","gender","phone","bloodGroup","address","emergencyContacts"];
    const missingFields = requiredFields.filter((field) => !incomingFields.includes(field));
    // To read image we need to use multer
    if (missingFields.length > 0) {
        // Status codes are necessary to throw errors
        throw new ErrorHandler(401, `Provide missing fields ${missingFields.join(',')} to signup`);
    }

    let existingUser = await patients.findOne({
        $or: [
            { username },
            { email }
        ]
    })
    if (existingUser) {
        throw new ErrorHandler(401, `User with username ${username} or email ${email} already exists`);
    }

    /*
    let cloudinaryResponse;
    try {
        cloudinaryResponse = await uploadOnCloudinary(req.file.path);
    } catch (error) {
        throw new ErrorHandler(500, `Error while uploading image ${error.message}`);
    }*/

    try {
        const user = await patients.create({
            username,
            password,
            email,
            name,
            age,    
            gender,
            phone,
            bloodGroup,
            address,
            emergencyContacts
            //image: cloudinaryResponse.secure_url
        });

        let newUser = await patients.findOne({
            _id: user._id
        }).select("-password");

        res.status(201).json({
            success: true,
            user: newUser
        });

    } catch (error) {
        throw new ErrorHandler(500, `Error while creating new user`);
    }
})

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        let user = await patients.findOne({
            _id: userId
        });
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return {
            accessToken,
            refreshToken
        }
    } catch (error) {
        throw new ErrorHandler(500, `Error while generating access token and refresh token`);
    }
}

export const updatePatientProfile = ErrorWrapper(async (req, res) => {

    const updatedPatient = await patients.findByIdAndUpdate(
        req.user.userId,
        req.body,
        { new: true }
    ).select("-password -refreshToken");

    res.status(200).json({
        success: true,
        patient: updatedPatient
    });
});

export const postLogin = ErrorWrapper(async function (req, res, next) {
    const { username, email, password } = req.body;
    if (!username && !email) {
        throw new ErrorHandler(400, "Please enter either username or email");
    }
    if (!password) {
        throw new ErrorHandler(400, "Please enter password");
    }
    let user = await patients.findOne({
        $or: [{ username }, { email }]
    });
    if (!user) {
        throw new ErrorHandler(400, "Invalid username or email");
    }

    const passwordMatch = await user.isPasswordCorrect(password);
    if (!passwordMatch) {
        throw new ErrorHandler(400, "Invalid password");
    }
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);
    user.refreshToken = refreshToken;
    // console.log(user);
    await user.save();
    user = await patients.findOne({
        $or: [
            { username },
            { email }
        ]
    }).select("-password -refreshToken")

    res.status(200)
        .cookie("RefreshToken", refreshToken)
        .cookie("AccessToken", accessToken)
        .json({
            success: true,
            message: "Login Successfull",
            user
        });
})

export const getPatientProfile = ErrorWrapper(async (req, res) => {

    const patient = await patients.findById(req.user.userId)
        .select("-password -refreshToken");

    if (!patient) {
        throw new ErrorHandler(404, "Patient not found");
    }

    res.status(200).json({
        success: true,
        patient
    });
});

export const getPatientDashboard = ErrorWrapper(async (req, res) => {

    const patientId = req.user.userId;

    const latestVitals = await Vitals.findOne({ patientId })
        .sort({ recordedAt: -1 });

    const latestRisk = await RiskLog.getLatestRisk(patientId);

    const activeAlerts = await Alert.getActiveAlerts(patientId);

    res.status(200).json({
        success: true,
        vitals: latestVitals,
        risk: latestRisk,
        alerts: activeAlerts
    });
});

export const getChronicPatients = ErrorWrapper(async (req, res) => {

    const chronicPatients = await patients.getChronicPatients();

    res.status(200).json({
        success: true,
        patients: chronicPatients
    });
});

export const logoutPatient = ErrorWrapper(async (req, res) => {

    await patients.findByIdAndUpdate(
        req.user.userId,
        { $unset: { refreshToken: "" } }
    );

    res.status(200)
        .clearCookie("AccessToken")
        .clearCookie("RefreshToken")
        .json({
            success: true,
            message: "Logged out successfully"
        });
});



