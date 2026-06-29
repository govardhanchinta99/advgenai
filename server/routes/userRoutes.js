const express=require('express');
const router=express.Router();
const { registerUser, loginUser, refreshUserToken, sendPasswordResetOTP, resetPassword }=require('../controllers/userController');
const verifyEmail = require("../services/verify");

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get("/verify-email/:token", verifyEmail);
router.post("/refresh", refreshUserToken);
router.post("/forgot-password", sendPasswordResetOTP);
router.post("/reset-password", resetPassword);

module.exports=router;