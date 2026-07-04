import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

const ForgotPassword = () => {
  const navigate = useNavigate();

  // step 1 = enter email, step 2 = enter OTP + new password, step 3 = success
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: request an OTP for the given email
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required.');
      return;
    }
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const response = await api.post('/users/forgot-password', { email });
      setInfo(response.data.message || 'OTP sent to your email address.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: submit OTP + new password to actually reset the password
  const handleResetSubmit = async (e) => {
    e.preventDefault();

    if (!otp || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password must match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setInfo('');
    try {
      const response = await api.post('/users/reset-password', {
        email,
        otp,
        newPassword,
        confirmPassword,
      });
      setInfo(response.data.message || 'Password updated successfully.');
      setStep(3);

      // auto-redirect to login shortly after success, same pattern as Logout.jsx
      setTimeout(() => {
        navigate('/login', { state: { message: 'Password reset successful. Please sign in.' } });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please check your OTP and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const response = await api.post('/users/forgot-password', { email });
      setInfo(response.data.message || 'A new OTP has been sent to your email address.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- Step 3: success screen, styled to match Logout.jsx ---
  if (step === 3) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.brand}>ShopMATE</h1>
          <h2 style={styles.title}>Password updated</h2>
          <p style={styles.subtitle}>
            Your password has been reset successfully. Redirecting you to the login page...
          </p>
          <div style={styles.pill}>Redirecting</div>
          <p style={styles.footer}>
            Not redirected?{' '}
            <Link to="/login" style={styles.link}>Go to login</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.brand}>ShopMATE</h1>
        <h2 style={styles.title}>
          {step === 1 ? 'Forgot your password?' : 'Reset your password'}
        </h2>
        <p style={styles.subtitle}>
          {step === 1
            ? 'Enter your email and we will send you a one-time code.'
            : `Enter the OTP sent to ${email} and choose a new password.`}
        </p>

        {error && <div style={styles.error}>{error}</div>}
        {info && <div style={styles.info}>{info}</div>}

        {step === 1 && (
          <form onSubmit={handleEmailSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={styles.input}
              />
            </div>

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>OTP Code</label>
              <input
                type="text"
                name="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder="6-digit code"
                maxLength={6}
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={styles.input}
              />
            </div>

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
              style={styles.secondaryButton}
            >
              Resend OTP
            </button>
          </form>
        )}

        <p style={styles.footer}>
          Remembered your password?{' '}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
    padding: "20px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
    padding: "40px 36px",
    width: "100%",
    maxWidth: "420px",
    textAlign: "center",
  },
  brand: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#111827",
    marginBottom: "8px",
    letterSpacing: "-0.5px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#111827",
    marginBottom: "4px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "24px",
  },
  error: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fca5a5",
    color: "#dc2626",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "14px",
    marginBottom: "16px",
    textAlign: "left",
  },
  info: {
    backgroundColor: "#ecfdf5",
    border: "1px solid #a7f3d0",
    color: "#059669",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "14px",
    marginBottom: "16px",
    textAlign: "left",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    textAlign: "left",
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    padding: "10px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "15px",
    color: "#111827",
    outline: "none",
    backgroundColor: "#f9fafb",
  },
  button: {
    marginTop: "8px",
    padding: "12px",
    backgroundColor: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "10px",
    backgroundColor: "transparent",
    color: "#111827",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 16px",
    backgroundColor: "#111827",
    color: "#ffffff",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "8px",
  },
  footer: {
    marginTop: "20px",
    fontSize: "14px",
    color: "#6b7280",
  },
  link: {
    color: "#111827",
    fontWeight: "600",
    textDecoration: "none",
  },
};

export default ForgotPassword;