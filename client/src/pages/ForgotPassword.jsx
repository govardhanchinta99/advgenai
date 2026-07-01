import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [loading, setLoading] = useState(false);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            setError("Email is required.");
            return;
        }
        setLoading(true);
        setError('');
        setInfo("");
        try {
            const response = await axios.post("https://localhost:3001/api/users/forgot-password", { email });
            setInfo(response.data.message || "OTP sent to your email address.");
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send otp. Please try again.");
        } finally {
            setLoading(false);
        }
    };
}

export default ForgotPassword;