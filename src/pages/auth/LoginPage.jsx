

// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import MessageCard from "../../components/common/MessageCard";
// import "./Login.css";

// const LoginPage = () => {
//   const navigate = useNavigate();
//   const [identifier, setIdentifier] = useState(""); // username or email
//   const [password, setPassword] = useState("");
//   const [message, setMessage] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const handleLogin = async (e) => {
//     e.preventDefault();

//     if (!identifier) {
//       setMessage({ text: "Please enter username/email", type: "error" });
//       return;
//     }
//     if (!password) {
//       setMessage({ text: "Password cannot be empty", type: "error" });
//       return;
//     }

//     setLoading(true);
//     setMessage(null);

//     try {
//       const response = await fetch("http://localhost:8080/api/auth/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ identifier, password }),
//       });

//       if (!response.ok) {
//         const errorMsg = await response.text();
//         setMessage({ text: errorMsg, type: "error" });
//         setLoading(false);
//         return;
//       }

//       const user = await response.json();
//       localStorage.setItem("currentUser", JSON.stringify(user));

//       setMessage({ text: `Welcome back, ${user.fullName || user.username || user.email}!`, type: "success" });

//       setTimeout(() => {
//         setLoading(false);
//         if (user.role === "ADMIN") navigate("/admin/dashboard");
//         else if (user.role === "DOCTOR") navigate("/doctor/dashboard");
//         else navigate("/patient/dashboard");
//       }, 1000);

//     } catch {
//       setMessage({ text: "Server not reachable. Try later.", type: "error" });
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="login-wrapper">
//       <div className="login-page">
//         <div className="login-left">
//           <img src="src/assets/images/userlogin.png" alt="Login" className="auth-img" />
//         </div>
//         <div className="login-right">
//           <form className="login-card" onSubmit={handleLogin}>
//             <h2>Login</h2>

//             {message && <MessageCard message={message.text} type={message.type} onClose={() => setMessage(null)} />}

//             <div className="input-field">
//               <input
//                 type="text"
//                 placeholder="Username or Email"
//                 value={identifier}
//                 onChange={(e) => setIdentifier(e.target.value)}
//                 required
//               />
//             </div>
//             <div className="input-field">
//               <input
//                 type="password"
//                 placeholder="Password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//               />
//             </div>

//             <button type="submit" className="login-btn" disabled={loading}>
//               {loading ? "Logging in..." : "Login"}
//             </button>

//             <p className="forgot-pass" onClick={() => alert("Send OTP flow")}>Forgot Password?</p>
//             <p className="signup-text">
//               Don't have an account? <span onClick={() => navigate("/signup")}>Sign Up</span>
//             </p>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LoginPage;


// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import "./Login.css";

// import userlogin from "../../assets/images/userlogin.png";

// const LoginPage = () => {
//   const navigate = useNavigate();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [popupMessage, setPopupMessage] = useState("");
//   const [popupType, setPopupType] = useState("");
//   const [loading, setLoading] = useState(false);

//   const showPopup = (message, type) => {
//     setPopupMessage(message);
//     setPopupType(type);

//     setTimeout(() => {
//       setPopupMessage("");
//     }, 2300);
//   };

//   const handleLogin = (e) => {
//     e.preventDefault();
//     setLoading(true);

//     // Get dummy users from localStorage or create default ones
//     let users = JSON.parse(localStorage.getItem("users"));
//     if (!users) {
//       users = [
//         { role: "ADMIN", email: "admin@demo.com", password: "admin123", fullName: "Admin User" },
//         { role: "DOCTOR", email: "doctor@demo.com", password: "doctor123", fullName: "Dr. Demo" },
//         { role: "PATIENT", email: "patient@demo.com", password: "patient123", fullName: "Patient Demo" },
//       ];
//       localStorage.setItem("users", JSON.stringify(users));
//     }

//     const validUser = users.find(
//       (u) => u.email === email && u.password === password
//     );

//     if (!validUser) {
//       showPopup("Invalid email or password", "error");
//       setLoading(false);
//       return;
//     }

//     localStorage.setItem("currentUser", JSON.stringify(validUser));

//     showPopup("Login successful! Redirecting...", "success");

//     setTimeout(() => {
//       setLoading(false);
//       if (validUser.role === "ADMIN") navigate("/admin/dashboard");
//       else if (validUser.role === "DOCTOR") navigate("/doctor/dashboard");
//       else navigate("/");
//     }, 800);
//   };

//   return (
//     <div className="login-wrapper">
//       <div className="login-page">

//         {/* LEFT IMAGE */}
//         <div className="login-left">
//           <img src={userlogin} alt="Login" />
//         </div>

//         {/* RIGHT FORM */}
//         <div className="login-right">

//           {/* POPUP MESSAGE */}
//           {popupMessage && (
//             <div className={`popup-card ${popupType}`}>
//               {popupMessage}
//             </div>
//           )}

//           <form onSubmit={handleLogin} className="login-card">
//             <h2>Login</h2>

//             <input
//               type="email"
//               placeholder="Email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//             />

//             <input
//               type="password"
//               placeholder="Password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//             />

//             <button type="submit" disabled={loading}>
//               {loading ? "Logging in..." : "Login"}
//             </button>

//             <p className="signup-text">
//               Don't have an account?{" "}
//               <span onClick={() => navigate("/signup")}>Signup</span>
//             </p>
//           </form>

//         </div>
//       </div>
//     </div>
//   );
// };

// export default LoginPage;




// ye wala login without authentication ka h 
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import userlogin from "../../assets/images/userlogin.png";

const LoginPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(false);

  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");
  const [loading, setLoading] = useState(false);

  const [showForgotFlow, setShowForgotFlow] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otpDestination, setOtpDestination] = useState("");

  const showPopup = (message, type) => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => setPopupMessage(""), 2300);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    let users = JSON.parse(localStorage.getItem("users"));
    if (!users) {
      users = [
        { role: "ADMIN", email: "admin@demo.com", phone:"9999999999", password: "admin123", fullName: "Admin User" },
        { role: "DOCTOR", email: "doctor@demo.com", phone:"8888888888", password: "doctor123", fullName: "Dr. Demo" },
        { role: "PATIENT", email: "patient@demo.com", phone:"7777777777", password: "patient123", fullName: "Patient Demo" },
      ];
      localStorage.setItem("users", JSON.stringify(users));
    }

    const validUser = users.find(
      u =>
        (u.email === email || u.phone === email) &&
        u.password === password
    );

    setTimeout(() => {
      setLoading(false);

      if (!validUser) {
        showPopup("Invalid username or password", "error");
        return;
      }

      if (rememberMe) {
        localStorage.setItem("currentUser", JSON.stringify(validUser));
      } else {
        sessionStorage.setItem("currentUser", JSON.stringify(validUser));
      }

      showPopup("Login successful! Redirecting...", "success");

      setTimeout(() => {
        if (validUser.role === "ADMIN") navigate("/admin/dashboard");
        else if (validUser.role === "DOCTOR") navigate("/doctor/dashboard");
        else navigate("/");
      }, 800);

    }, 1200);
  };

  const sendOtp = () => {

    if (!email) {
      showPopup("Please enter your email or phone first", "error");
      return;
    }

    let destination = "";

    if (email.includes("@")) {
      destination = email.replace(/(.{2}).+(@.+)/, "$1****$2");
    } else {
      destination = email.replace(/.(?=.{2})/g, "*");
    }

    setOtpDestination(destination);
    setOtpSent(true);

    showPopup(`OTP sent to ${destination}`, "success");
  };

  const verifyOtp = () => {

    if (!otp) {
      showPopup("Please enter OTP", "error");
      return;
    }

    setOtpVerified(true);
    showPopup("OTP verified successfully", "success");

  };

  const resetPassword = () => {

    if (!newPassword || !confirmPassword) {
      showPopup("Please enter new password", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showPopup("Passwords do not match", "error");
      return;
    }

    let users = JSON.parse(localStorage.getItem("users")) || [];

    const updatedUsers = users.map(user => {
      if (user.email === email || user.phone === email) {
        return { ...user, password: newPassword };
      }
      return user;
    });

    localStorage.setItem("users", JSON.stringify(updatedUsers));

    showPopup("Password reset successful! Please login.", "success");

    setTimeout(() => {
      setShowForgotFlow(false);
      setOtpSent(false);
      setOtpVerified(false);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    }, 1500);

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
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-action-links">

                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>

                  <label style={{fontSize:"13px",color:"#64748b"}}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={()=>setRememberMe(!rememberMe)}
                      style={{marginRight:"6px"}}
                    />
                    Remember Me
                  </label>

                  <span
                    className="forgot-pass-btn"
                    onClick={()=>setShowForgotFlow(true)}
                  >
                    Forgot Password?
                  </span>

                </div>

              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? "Verifying..." : "Login"}
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
                    />
                  </div>
                </div>

                <button
                  className="auth-submit-btn"
                  onClick={sendOtp}
                >
                  Send OTP
                </button>

              </div>

            )}

            {otpSent && !otpVerified && (

              <div>

                <div className="input-field-group">
                  <label>Enter OTP sent to {otpDestination}</label>

                  <div className="input-with-icon">
                    <span className="icon-slot">🔑</span>
                    <input
                      type="text"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e)=>setOtp(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  className="auth-submit-btn"
                  onClick={verifyOtp}
                >
                  Verify OTP
                </button>

              </div>

            )}

            {otpVerified && (

              <div>

                <div className="input-field-group">
                  <label>New Password</label>

                  <div className="input-with-icon">
                    <span className="icon-slot">🔒</span>
                    <input
                      type="password"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e)=>setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-field-group">
                  <label>Confirm Password</label>

                  <div className="input-with-icon">
                    <span className="icon-slot">🔒</span>
                    <input
                      type="password"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e)=>setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  className="auth-submit-btn"
                  onClick={resetPassword}
                >
                  Reset Password
                </button>

              </div>

            )}

          </div>

        </div>

      </div>

    </div>
  );
};

export default LoginPage;