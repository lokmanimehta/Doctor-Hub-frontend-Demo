
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import userlogin from "../../assets/images/userlogin.png";
import { forgotPassword, resetPassword, loginUser, getPatientProfiles } from "../../services/authService";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useProfile } from "../../context/useProfile";

const LoginPage = () => {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const { setCurrentUser } = useContext(AuthContext);
  const [password, setPassword] = useState("");
  const [resendDisabled, setResendDisabled] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpIdentifier, setOtpIdentifier] = useState(""); // NEW
  const [showForgotFlow, setShowForgotFlow] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingReset, setLoadingReset] = useState(false);
  const [otpDestination, setOtpDestination] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [resendActive, setResendActive] = useState(false);
  const { selectProfile } = useProfile();
  const showPopup = (message, type = "error") => {
  const safeMessage =
    typeof message === "string" && message.trim()
      ? message.trim()
      : type === "success"
        ? "Operation completed successfully."
        : "Something went wrong. Please try again.";

  setPopupMessage(safeMessage);
  setPopupType(type);

  setTimeout(() => {
    setPopupMessage("");
    setPopupType("");
  }, 3000);
};

  useEffect(() => {

    let interval;

    if (resendActive && resendTimer > 0) {

      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);

    }

    if (resendTimer === 0) {
      setResendDisabled(false);
      setResendActive(false);
    }

    return () => clearInterval(interval);

  }, [resendActive, resendTimer]);
  useEffect(() => {

    const handleEsc = (e) => {

      if (e.key === "Escape") {
        setShowProfileSelector(false);
      }

    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };

  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = password.trim();

    try {
      if (!trimmedIdentifier || !trimmedPassword) {
        throw new Error("Email/Mobile and password are required");
      }

      const user = await loginUser({
        identifier: trimmedIdentifier,
        password: trimmedPassword,
        rememberMe
      });

      if (!user) {
        throw new Error("User data not returned from login");
      }

      setCurrentUser(user);

      if (user.role === "PATIENT") {
        const profileResponse = await getPatientProfiles();
        const fetchedProfiles = profileResponse?.profiles || [];

        if (fetchedProfiles.length > 1) {
          setProfiles(fetchedProfiles);
          setShowProfileSelector(true);
          showPopup("👨‍👩‍👧 Select profile to continue", "success");
          return;
        }

        if (fetchedProfiles.length === 1) {
          handleProfileSelect(fetchedProfiles[0]);
          return;
        }
      }

      showPopup("🔓 Login successful! Welcome back.", "success");

      setTimeout(() => {
        if (user.role === "ADMIN") {
          navigate("/admin/dashboard");
        } else if (user.role === "DOCTOR") {
          navigate("/doctor/dashboard");
        } else {
          navigate("/");
        }
      }, 500);

    } catch (error) {
      showPopup(`❌ ${error.message || "Login failed"}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSelect = (profile) => {


    selectProfile(profile);

    showPopup(`🔓 Logged in as ${profile.fullName}`, "success");

    setTimeout(() => {
      navigate("/");
    }, 500);
  };

  const sendOtp = async () => {
    if (resendDisabled) return;

    const trimmedIdentifier = identifier.trim();

    if (!trimmedIdentifier) {
      showPopup("⚠️ Please enter your email or phone first", "error");
      return;
    }

    let destination = "";

    if (trimmedIdentifier.includes("@")) {
      destination = trimmedIdentifier.replace(/(.{2}).+(@.+)/, "$1****$2");
    } else {
      destination = trimmedIdentifier.replace(/.(?=.{2})/g, "*");
    }

    try {
      setResendDisabled(true);

      await forgotPassword(trimmedIdentifier);

      setOtpDestination(destination);
      setOtpSent(true);
      setOtpIdentifier(trimmedIdentifier);
      setResendTimer(30);

      showPopup(`🔐 OTP sent successfully to ${destination}`, "success");

      setResendActive(true);

    } catch (err) {
      setResendDisabled(false);
      showPopup(`❌ ${err.message || "Failed to send OTP"}`, "error");
    }
  };

  const resetPasswordHandler = async () => {
    if (loadingReset) return;       // prevent multiple clicks
    setLoadingReset(true);

    if (!otp || !newPassword || !confirmPassword) {
      showPopup("⚠️ Please fill all required fields", "error");
      setLoadingReset(false);
      return;
    }
    if (
      !/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@#$%^&+=!]).{8,}$/.test(newPassword)
    ) {
      showPopup(
        "Password must contain uppercase, lowercase, number and special character",
        "error"
      );
      setLoadingReset(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      showPopup("❌ Passwords do not match", "error");
      setLoadingReset(false);
      return;
    }

    const payload = {
      identifier: otpIdentifier.trim(),
      otp: otp.toString().trim(),
      newPassword: newPassword.trim()
    };

    setLoading(true);
    try {
      // console.log("Reset password payload:", payload);

      await resetPassword(payload)

      showPopup(" Password reset successful! You can login now.", "success");

      // Reset state & navigate
      setShowForgotFlow(false);
      setOtpSent(false);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      navigate("/login");

    } catch (err) {
      const msg =
  err.response?.data?.message ||
  err.message ||
  "Password reset failed. Please try again.";
      if (msg.includes("OTP expired")) {
        showPopup("⏳ OTP expired. Please request a new one.", "error");
      } else if (msg.includes("Invalid OTP")) {
        showPopup("❌ Invalid OTP entered. Try again.", "error");
      } else {
        showPopup(msg, "error");
      }
    } finally {
      setLoading(false);
      setLoadingReset(false);
    }
  };


  return (
    <div className="auth-wrapperr">

      {popupMessage && (
        <div className={`notification-toast ${popupType}`}>
          {popupMessage}
        </div>
      )}

      <div className="auth-main-card">

        <div className="auth-left-visual">
          <img src={userlogin} alt="Sucura Illustration" />
        </div>

        <div className="auth-right-form">

          <div className="form-inner-container">

            <h1 className="form-main-heading">
              Login to <span>Sucura</span>
            </h1>

            {!showForgotFlow && (

              <form onSubmit={handleLogin}>

                <div className="input-field-group">
                  <label>Username</label>
                  <div className="input-with-icon">
                    <span className="icon-slot">👤</span>
                    <input
                      type="text"
                      placeholder="Email or Phone Number"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="input-field-group">
                  <label>Password</label>
                  <div className="input-with-icon">
                    <span className="icon-slot">🔒</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <span
                      className="show-hide-icon"
                      onClick={() => setShowPassword(prev => !prev)}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </span>
                  </div>
                </div>

                <div className="form-action-links">
                  <div className="remember-me-section">
                    {/* Left Side: Checkbox + Text */}
                    <div className="checkbox-group" onClick={() => setRememberMe(!rememberMe)}>
                      <div className="checkbox-wrapper-12">
                        <div className="cbx">
                          <input
                            id="cbx-12"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={() => setRememberMe(!rememberMe)}
                          />
                          <label htmlFor="cbx-12"></label>
                          <svg width="15" height="14" viewBox="0 0 15 14" fill="none">
                            <path d="M2 8.36364L6.23077 12L13 2"></path>
                          </svg>
                        </div>
                      </div>
                      <span className="remember-text">Remember Me</span>
                    </div>

                    {/* Right Side: Forgot Password */}
                    <span className="forgot-pass-btn" onClick={() => setShowForgotFlow(true)}>
                      Forgot Password?
                    </span>
                  </div>
                </div>

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </button>

                <p className="footer-navigation-text">
                  Don't have an account?
                  <span onClick={() => navigate("/signup")}>Sign Up</span>
                </p>

              </form>

            )}

            {showForgotFlow && !otpSent && (

              <div>

                <div className="input-field-group">
                  <label>Enter your Email or Phone</label>

                  <div className="input-with-icon">
                    <span className="icon-slot">📩</span>
                    <input
                      type="text"
                      placeholder="Email or Phone"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      disabled={otpSent}
                    />
                  </div>
                </div>

                <button
                  className="auth-submit-btn"
                  onClick={sendOtp}
                  disabled={resendDisabled}
                >
                  {resendDisabled ? `Resend in ${resendTimer}s` : "Send OTP"}
                </button>

              </div>

            )}

            {otpSent && (

              <div>

                <div className="input-field-group">
                  <label>Enter OTP sent to {otpDestination}</label>

                  <div className="input-with-icon">
                    <span className="icon-slot">🔑</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "")
                        setOtp(value)
                      }}
                    />
                  </div>
                </div>

                <div className="input-field-group">
                  <label>New Password</label>

                  <div className="input-with-icon">
                    <span className="icon-slot">🔒</span>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <span
                      className="show-hide-icon"
                      onClick={() => setShowNewPassword(prev => !prev)}
                    >
                      {showNewPassword ? <FiEyeOff /> : <FiEye />}
                    </span>
                  </div>
                </div>

                <div className="input-field-group">
                  <label>Confirm Password</label>
                  <div className="input-with-icon">
                    <span className="icon-slot">🔒</span>

                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />

                    <span
                      className="show-hide-icon"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </span>
                  </div>
                </div>

                <button
                  className="auth-submit-btn"
                  onClick={resetPasswordHandler}
                  disabled={loadingReset}
                >
                  {loadingReset ? "Resetting..." : "Reset Password"}
                </button>
                <button
                  className="auth-submit-btn resend-btn"
                  style={{ marginTop: "10px", background: "#3b82f6" }}
                  onClick={sendOtp}
                >
                  Resend OTP
                </button>
                <p className="otp-info">
                  OTP valid for 5 minutes
                </p>
              </div>

            )}
            {showProfileSelector && (
              <div
                className="profile-modal-overlay"
                onClick={() => setShowProfileSelector(false)}
              >
                <div
                  className="profile-selector-popup"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3>Select Profile to Continue</h3>

                  {profiles.map((p) => (
                    <div
                      key={`${p.type}-${p.id}`}
                      className="profile-card"
                      onClick={() => handleProfileSelect(p)}
                    >
                      <div className="profile-left">
                        <div className="profile-avatar">
                          {p.fullName?.charAt(0).toUpperCase()}
                        </div>

                        <div className="profile-info">
                          <div className="profile-info-name">{p.fullName}</div>
                          <span className="profile-info-relation">{p.relation}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};

export default LoginPage;