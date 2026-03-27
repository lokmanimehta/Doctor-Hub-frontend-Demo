
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import userlogin from "../../assets/images/userlogin.png";
import { forgotPassword, resetPassword  } from "../../services/authService";
// import { loginUser } from "../../services/authService";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { FiEye, FiEyeOff } from "react-icons/fi";
const LoginPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
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


  const showPopup = (message, type) => {
  setPopupMessage(message);
  setPopupType(type);

  setTimeout(() => {
    setPopupMessage("")
setPopupType( "")
  }, 2500);
};

  // const handleLogin = async (e) => {

  // e.preventDefault();
  // setLoading(true);

  // const trimmedEmail = email.trim();
  // const trimmedPassword = password.trim();

//   try {

//     const user = await loginUser({
//       identifier: trimmedEmail,
//       password: trimmedPassword,
//       rememberMe
//     });
//     setCurrentUser(user);
//     console.log("LOGIN USER:", user)
//     if (!user) {
//       throw new Error("User data not returned from login");
//     }

//     showPopup("🎉 Login successful! Welcome back.", "success");

//     setTimeout(() => {

//       if (user?.role === "ADMIN") navigate("/admin/dashboard");
//       else if (user.role === "DOCTOR") navigate("/doctor/dashboard");
//       else if (user.role === "PATIENT") navigate("/");
//       else navigate("/");

//     }, 500);

//   } catch (error) {

//     showPopup(`❌ ${error.message || "Login failed"}`, "error");

//   }

//   setLoading(false);
  

// };

const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);

  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();

  try {
    if (!trimmedEmail || !trimmedPassword) {
      throw new Error("Email and password required");
    }

    // ✅ Dummy users
    const defaultUsers = [
  {
    email: "admin@test.com",
    password: "123456",
    role: "ADMIN",
  },
  {
    email: "doctor@test.com",
    password: "123456",
    role: "DOCTOR",
  },
  {
    email: "patient@test.com",
    password: "123456",
    role: "PATIENT",
  },
];

// ✅ get users from signup (localStorage)
const storedUsers = JSON.parse(localStorage.getItem("dummyUsers")) || [];

// ✅ merge both
const dummyUsers = [...defaultUsers, ...storedUsers];
    // ✅ Match user
    const user = dummyUsers.find(
      (u) =>
        u.email === trimmedEmail &&
        u.password === trimmedPassword
    );

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // ✅ Simulated user object
    const loggedInUser = {
      email: user.email,
      role: user.role,
    };

    setCurrentUser(loggedInUser);

    showPopup("🎉 Login successful! Welcome back.", "success");

    setTimeout(() => {
      if (loggedInUser.role === "ADMIN") navigate("/admin/dashboard");
      else if (loggedInUser.role === "DOCTOR") navigate("/doctor/dashboard");
      else if (loggedInUser.role === "PATIENT") navigate("/");
      else navigate("/");
    }, 500);

  } catch (error) {
    showPopup(`❌ ${error.message}`, "error");
  }

  setLoading(false);
};

  const sendOtp = async () => {

  if (resendDisabled) return;

  if (!email) {
    showPopup("⚠️ Please enter your email or phone first", "error");
    return;
  }

  setResendDisabled(true);
  setResendTimer(30);
  let destination = "";

  if (email.includes("@")) {
    destination = email.replace(/(.{2}).+(@.+)/, "$1****$2");
  } else {
    destination = email.replace(/.(?=.{2})/g, "*");
  }

  setOtpDestination(destination);
  setOtpSent(true);
  setOtpIdentifier(email.trim());

  // ⭐ popup instantly
  showPopup(`📩 Sending OTP to ${destination}...`, "success");
 const countdown = setInterval(() => {

    setResendTimer(prev => {

      if (prev === 1) {
        clearInterval(countdown);
        setResendDisabled(false);
        return 0;
      }

      return prev - 1;

    });

  }, 1000);

  try {

    await forgotPassword(email.trim());

    showPopup(`🔐 OTP sent successfully to ${destination}`, "success");

  } catch (err) {

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

    showPopup("🎉 Password reset successful! You can login now.", "success");

    // Reset state & navigate
    setShowForgotFlow(false);
    setOtpSent(false);
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    navigate("/login");

  } catch (err) {
    const msg = err.response?.data?.message || err.message;
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
          <img src={userlogin} alt="Doctor's Hub Illustration" />
        </div>

        <div className="auth-right-form">

          <div className="form-inner-container">

            <h1 className="form-main-heading">
              Login to <span>Doctor's Hub</span>
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
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
  value={email}
  onChange={(e)=>setEmail(e.target.value)}
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
  onChange={(e)=>{
  const value = e.target.value.replace(/\D/g,"")
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
      style={{marginTop: "10px", background: "#3b82f6"}}
      onClick={sendOtp}
    >
      Resend OTP
    </button>
    <p className="otp-info">
OTP valid for 5 minutes
</p>
  </div>

)}


          </div>

        </div>

      </div>

    </div>
  );
};

export default LoginPage;