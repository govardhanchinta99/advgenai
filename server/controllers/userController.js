const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/db');
const { sendVerificationEmail, sendEmail} = require("../services/sendermail")
const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone_number, role } = req.body;
        
        // Input validation
        if (!email || !password || !name) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }
        
        if (email.length > 255 || !email.includes('@')) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        
        const db = getDB();
        const normalizedEmail = email.toLowerCase();
        const existingUser = await db.collection('users').findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }   
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.collection('users').insertOne({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            phone_number: phone_number || "",
            role : role || 'user',
            isVerified: false,
            createdAt: new Date()
        });
        const token = jwt.sign(
            {
                 id: result.insertedId,
                email: normalizedEmail
            },
             process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        await sendVerificationEmail(normalizedEmail, name, token);
        res.status(201).json({ message: 'User registered successfully.please check your email for verify account'});
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const generateAccessToken = (user) => {
    return jwt.sign({ 
        id: user._id, 
        email: user.email, 
        role: user.role 
    }, 
    process.env.ACCESS_SECRET_KEY || "access_secret_key", 
    { expiresIn: '15m' });
};

const generateRefreshToken = (user) => {
    return jwt.sign({ 
        id: user._id, 
        email: user.email, 
        role: user.role 
    }, 
    process.env.REFRESH_SECRET_KEY || "refresh_secret_key", 
    { expiresIn: '7d' });
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Input validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        const db = getDB();
        const normalizedEmail = email.toLowerCase();
        const user = await db.collection('users').findOne({ 
            email: normalizedEmail 
        });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        // Validate password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        if (!user.isVerified) {
            return res.status(401).json({ message: 'Please verify your email before logging in' });
        }
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { refresh_token: refreshToken }}
        );
        res.status(200).json({ message: 'Login successful', accessToken, refreshToken, user: { _id: user._id, email: user.email, role: user.role, name: user.name } });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

const refreshUserToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
           return res.status(401).json({message: "Refresh Token is required"});
        }
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY || "refresh_secret_key");
        } catch (err) {
            return res.status(401).json({message: "Invalid or expired refresh token."});
        }
        const db = getDB();
        const normalizedEmail = decoded.email.toLowerCase();
        const user = await db.collection("users").findOne({email: normalizedEmail, refresh_token: refreshToken});

        if (!user) {
            return res.status(401).json({message: "Refresh token not valid or user not found"});
        }

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        await db.collection("users").updateOne(
            {_id: user._id},
            {$set: {refresh_token: newRefreshToken}}
        );
        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error during refresh",
            error: error.message
        });
    }
};

const sendPasswordResetOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }
        const db = getDB();
        const usersCollection = db.collection('users');

        const normalizedEmail = email.toLowerCase();
        const user = await usersCollection.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ message: 'No account found for this email.' });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        console.log(`Forget password requested for ${normalizedEmail}. Generated OTP: ${otp}`);

        await usersCollection.updateOne(
            {_id: user._id },
            {
                $set: {
                    reset_password_otp_hash: otpHash,
                    reset_password_otp_expires_at: expiresAt,
                    updated_at: new Date(),
                },
            }
        );
        const emailResult = await sendEmail({
            to: normalizedEmail,
            subject: 'ShopMATE password Reset OTP',
            text: `Your password reset OTP is: ${otp}. It expires in 15 minutes.`,
            html: `<p>Your password reset OTP is:</p><h2>${otp}</h2><p>This code expires in 15 minutes.</p>`,
        });
        console.log('Forget password email sent:',emailResult && emailResult.response);

        return res.status(200).json({ message: 'OTP sent to your email address. '});
    }catch (error) {
        console.error('Forget password error:',error);
        return res.status(500).json({ message: 'Could not send OTP.',error: error.message })
    }
    };

const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword, confirmPassword } = req.body;

        if (!email || !otp || !newPassword || !confirmPassword) {
            return res.status(400).json({message: "All fiels are required."});
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "New password and confirm password must match"});
        }

        const db = getDB();
        const userCollection = db.collection("users");

        const normalizedEmail = email.toLowerCase();
        const user = await userCollection.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ message: "No account found for this email. "});
        }

        if (!user.reset_password_otp_hash || !user.reset_password_otp_expires_at) {
            return res.status(400).json({ message: "No pending password reset request found."});
        }

        const otpExpired = new Date() > new Date(user.reset_password_otp_expires_at);
        if (otpExpired) {
            return res.status(400).json({ message: "The OTP has expired. Please request a new one."});
        }

        const validOtp = await bcrypt.compare(otp, user.reset_password_otp_hash);
        if (!validOtp) {
            return res.status(400).json({ message: "Invalid OTP provided" });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userCollection.updateOne(
            { _id: user._id },
            {
                $set: {
                    password: hashedPassword,
                    refresh_token: null,
                    reset_password_otp_hash: null,
                    reset_password_otp_expires_at: null,
                    updated_at: new Date(),
                }
            }
        );
        return res.status(200).json({ message: "Password updated successfully. Please login with your new password."});
    } catch (error) {
        console.error("Reset Password error:", error);
        return res.status(500).json({ message: "Password reset failed.", error: error.message });
    }
};

module.exports = {
    registerUser,
    refreshUserToken,
    loginUser,
    sendPasswordResetOTP,
    resetPassword
};