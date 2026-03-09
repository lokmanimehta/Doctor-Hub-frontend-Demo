// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import "./Signup.css";

// const SignupPage = () => {
//   const navigate = useNavigate();
//   const [role, setRole] = useState("patient");
//   const [fullName, setFullName] = useState("");
//   const [email, setEmail] = useState("");
//   const [mobile, setMobile] = useState("");
//   const [specialization, setSpecialization] = useState("");
//   const [credentials, setCredentials] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");

//   const suggestionsData = {
//     specialization: ["Cardiology", "Dermatology", "Neurology", "Pediatrics", "Orthopedics", "General Physician", "Psychiatry", "Radiology", "Oncology", "Gastroenterology"],
//     credentials: ["MBBS", "MD", "MS", "BDS", "DNB", "FRCS", "PhD", "MCh"]
//   };

//   const [filteredSpecs, setFilteredSpecs] = useState([]);
//   const [filteredCreds, setFilteredCreds] = useState([]);
//   const [activeField, setActiveField] = useState(null);

//   const [popupMessage, setPopupMessage] = useState("");
//   const [popupType, setPopupType] = useState("");

//   const handleInputChange = (value, type) => {
//     if (type === "specialization") {
//       setSpecialization(value);
//       const filtered = suggestionsData.specialization.filter(item =>
//         item.toLowerCase().includes(value.toLowerCase())
//       );
//       setFilteredSpecs(value ? filtered : []);
//     } else {
//       setCredentials(value);
//       const filtered = suggestionsData.credentials.filter(item =>
//         item.toLowerCase().includes(value.toLowerCase())
//       );
//       setFilteredCreds(value ? filtered : []);
//     }
//     setActiveField(type);
//   };

//   // ✅ VALIDATION FUNCTION ADDED
//   const validateForm = () => {

//     if (fullName.trim().length < 3) {
//       showPopup("Full Name must be at least 3 characters", "error");
//       return false;
//     }

//     const emailRegex = /^\S+@\S+\.\S+$/;
//     if (!emailRegex.test(email)) {
//       showPopup("Enter a valid email address", "error");
//       return false;
//     }

//     const mobileRegex = /^[0-9]{10}$/;
//     if (!mobileRegex.test(mobile)) {
//       showPopup("Mobile number must be 10 digits", "error");
//       return false;
//     }

//     if (password.length < 6) {
//       showPopup("Password must be at least 6 characters", "error");
//       return false;
//     }

//     if (password !== confirmPassword) {
//       showPopup("Passwords do not match", "error");
//       return false;
//     }

//     if (role === "doctor") {
//       if (credentials.trim() === "") {
//         showPopup("Credentials are required for doctor", "error");
//         return false;
//       }

//       if (specialization.trim() === "") {
//         showPopup("Specialization is required for doctor", "error");
//         return false;
//       }
//     }

//     return true;
//   };

//   const handleSignup = async (e) => {
//     e.preventDefault();

//     // ✅ CALL VALIDATION HERE
//     if (!validateForm()) return;

//     const newUser = {
//       fullName,
//       email,
//       mobile,
//       password,
//       role: role.toUpperCase(),
//       specialization: role === "doctor" ? specialization : null,
//       credentials: role === "doctor" ? credentials : null,
//     };

//     try {
//       const response = await fetch("http://localhost:8080/api/auth/signup", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(newUser),
//       });

//       if (!response.ok) {
//         const errorMsg = await response.text();
//         showPopup(errorMsg, "error");
//         return;
//       }

//       showPopup("Signup successful! Redirecting to login...", "success");
//       setTimeout(() => navigate("/login"), 2500);

//     } catch {
//       showPopup("Server not reachable. Try again later.", "error");
//     }
//   };

//   const showPopup = (message, type) => {
//     setPopupMessage(message);
//     setPopupType(type);
//     setTimeout(() => setPopupMessage(""), 2500);
//   };

//   return (
//     <div className="signup-wrapper">
//       <div className="signup-page">
//         <div className="signup-left">
//           <img
//             src={role === "patient" ? "src/assets/images/patientlogin.png" : "src/assets/images/doctorlogin.png"}
//             alt="Signup Illustration"
//             className="auth-img"
//           />
//         </div>

//         <div className="signup-right">
//           {popupMessage && (
//             <div className={`popup-card ${popupType}`}>
//               <p>{popupMessage}</p>
//             </div>
//           )}

//           <form className="signup-card" onSubmit={handleSignup}>
//             <h2>Sign Up</h2>

//             <p className="switch-role">
//               Are you a {role === "patient" ? "doctor" : "patient"}?{" "}
//               <span onClick={() => setRole(role === "patient" ? "doctor" : "patient")}>
//                 Register here
//               </span>
//             </p>

//             <div className="form-grid">
//               <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
//               <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
//               <input type="text" placeholder="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value)} />

//               {role === "doctor" && (
//                 <>
//                   <div className="specialization-wrapper">
//                     <input
//                       type="text"
//                       placeholder="Credentials (e.g., MBBS, MD)"
//                       value={credentials}
//                       onChange={(e) => handleInputChange(e.target.value, "credentials")}
//                       onFocus={() => setActiveField("credentials")}
//                     />
//                     {activeField === "credentials" && filteredCreds.length > 0 && (
//                       <ul className="suggestions-list">
//                         {filteredCreds.map((item, idx) => (
//                           <li key={idx} onClick={() => { setCredentials(item); setActiveField(null); }}>
//                             {item}
//                           </li>
//                         ))}
//                       </ul>
//                     )}
//                   </div>

//                   <div className="specialization-wrapper">
//                     <input
//                       type="text"
//                       placeholder="Specialization (e.g., Cardiology)"
//                       value={specialization}
//                       onChange={(e) => handleInputChange(e.target.value, "specialization")}
//                       onFocus={() => setActiveField("specialization")}
//                     />
//                     {activeField === "specialization" && filteredSpecs.length > 0 && (
//                       <ul className="suggestions-list">
//                         {filteredSpecs.map((item, idx) => (
//                           <li key={idx} onClick={() => { setSpecialization(item); setActiveField(null); }}>
//                             {item}
//                           </li>
//                         ))}
//                       </ul>
//                     )}
//                   </div>
//                 </>
//               )}

//               <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
//               <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
//             </div>

//             <button type="submit" className="signup-btn">Sign Up</button>

//             <p className="login-text">
//               Already have an account?{" "}
//               <span onClick={() => navigate("/login")}>Login</span>
//             </p>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SignupPage;


 

// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import "./Signup.css";

// import patientImg from "../../assets/images/patientlogin.png";
// import doctorImg from "../../assets/images/doctorlogin.png";

// const SignupPage = () => {
//   const navigate = useNavigate();
//   const [role, setRole] = useState("patient");
//   const [fullName, setFullName] = useState("");
//   const [email, setEmail] = useState("");
//   const [mobile, setMobile] = useState("");
//   const [specialization, setSpecialization] = useState("");
//   const [credentials, setCredentials] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");

//   const suggestionsData = {
//     specialization: [
//       "Cardiology", "Dermatology", "Neurology", "Pediatrics",
//       "Orthopedics", "General Physician", "Psychiatry",
//       "Radiology", "Oncology", "Gastroenterology"
//     ],
//     credentials: ["MBBS", "MD", "MS", "BDS", "DNB", "FRCS", "PhD", "MCh"]
//   };

//   const [filteredSpecs, setFilteredSpecs] = useState([]);
//   const [filteredCreds, setFilteredCreds] = useState([]);
//   const [activeField, setActiveField] = useState(null);

//   const [popupMessage, setPopupMessage] = useState("");
//   const [popupType, setPopupType] = useState("");

//   const showPopup = (message, type) => {
//     setPopupMessage(message);
//     setPopupType(type);
//     setTimeout(() => setPopupMessage(""), 2500);
//   };

//   const handleInputChange = (value, type) => {
//     if (type === "specialization") {
//       setSpecialization(value);
//       const filtered = suggestionsData.specialization.filter(item =>
//         item.toLowerCase().includes(value.toLowerCase())
//       );
//       setFilteredSpecs(value ? filtered : []);
//     } else {
//       setCredentials(value);
//       const filtered = suggestionsData.credentials.filter(item =>
//         item.toLowerCase().includes(value.toLowerCase())
//       );
//       setFilteredCreds(value ? filtered : []);
//     }
//     setActiveField(type);
//   };

//   const validateForm = () => {
//     if (fullName.trim().length < 3) {
//       showPopup("Full Name must be at least 3 characters", "error");
//       return false;
//     }

//     const emailRegex = /^\S+@\S+\.\S+$/;
//     if (!emailRegex.test(email)) {
//       showPopup("Enter a valid email address", "error");
//       return false;
//     }

//     const mobileRegex = /^[0-9]{10}$/;
//     if (!mobileRegex.test(mobile)) {
//       showPopup("Mobile number must be 10 digits", "error");
//       return false;
//     }

//     if (password.length < 6) {
//       showPopup("Password must be at least 6 characters", "error");
//       return false;
//     }

//     if (password !== confirmPassword) {
//       showPopup("Passwords do not match", "error");
//       return false;
//     }

//     if (role === "doctor") {
//       if (!credentials.trim()) {
//         showPopup("Credentials required for doctor", "error");
//         return false;
//       }

//       if (!specialization.trim()) {
//         showPopup("Specialization required for doctor", "error");
//         return false;
//       }
//     }

//     return true;
//   };

//   const handleSignup = (e) => {
//     e.preventDefault();
//     if (!validateForm()) return;

//     const users = JSON.parse(localStorage.getItem("users")) || [];

//     if (users.find((u) => u.email === email)) {
//       showPopup("User already exists!", "error");
//       return;
//     }

//     const newUser = {
//       fullName,
//       email,
//       mobile,
//       password,
//       role: role.toUpperCase(),
//       specialization: role === "doctor" ? specialization : null,
//       credentials: role === "doctor" ? credentials : null,
//     };

//     users.push(newUser);
//     localStorage.setItem("users", JSON.stringify(users));

//     showPopup("Signup successful! Redirecting to login...", "success");

//     setTimeout(() => navigate("/login"), 2500);
//   };

//   return (
//     <div className="signup-wrapper">
//       <div className="signup-page">

//         {/* LEFT IMAGE */}
//         <div className="signup-left">
//           <img
//             src={role === "patient" ? patientImg : doctorImg}
//             alt="Signup Illustration"
//             className="auth-img"
//           />
//         </div>

//         {/* RIGHT FORM */}
//         <div className="signup-right">

//           {/* POPUP MESSAGE */}
//           {popupMessage && (
//             <div className={`popup-card ${popupType}`}>
//               {popupMessage}
//             </div>
//           )}

//           <form className="signup-card" onSubmit={handleSignup}>
//             <h2>Sign Up</h2>

//             <p className="switch-role">
//               Are you a {role === "patient" ? "doctor" : "patient"}?{" "}
//               <span onClick={() => setRole(role === "patient" ? "doctor" : "patient")}>
//                 Register here
//               </span>
//             </p>

//             <div className="form-grid">
//               <input type="text" placeholder="Full Name"
//                 value={fullName}
//                 onChange={(e) => setFullName(e.target.value)} />

//               <input type="email" placeholder="Email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)} />

//               <input type="text" placeholder="Mobile Number"
//                 value={mobile}
//                 onChange={(e) => setMobile(e.target.value)} />

//               {role === "doctor" && (
//                 <>
//                   <div className="specialization-wrapper">
//                     <input
//                       type="text"
//                       placeholder="Credentials (e.g., MBBS, MD)"
//                       value={credentials}
//                       onChange={(e) => handleInputChange(e.target.value, "credentials")}
//                       onFocus={() => setActiveField("credentials")}
//                     />
//                     {activeField === "credentials" && filteredCreds.length > 0 && (
//                       <ul className="suggestions-list">
//                         {filteredCreds.map((item, idx) => (
//                           <li key={idx} onClick={() => { setCredentials(item); setActiveField(null); }}>
//                             {item}
//                           </li>
//                         ))}
//                       </ul>
//                     )}
//                   </div>

//                   <div className="specialization-wrapper">
//                     <input
//                       type="text"
//                       placeholder="Specialization (e.g., Cardiology)"
//                       value={specialization}
//                       onChange={(e) => handleInputChange(e.target.value, "specialization")}
//                       onFocus={() => setActiveField("specialization")}
//                     />
//                     {activeField === "specialization" && filteredSpecs.length > 0 && (
//                       <ul className="suggestions-list">
//                         {filteredSpecs.map((item, idx) => (
//                           <li key={idx} onClick={() => { setSpecialization(item); setActiveField(null); }}>
//                             {item}
//                           </li>
//                         ))}
//                       </ul>
//                     )}
//                   </div>
//                 </>
//               )}

//               <input type="password" placeholder="Password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)} />

//               <input type="password" placeholder="Confirm Password"
//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)} />
//             </div>

//             <button type="submit" className="signup-btn">Sign Up</button>

//             <p className="login-text">
//               Already have an account? <span onClick={() => navigate("/login")}>Login</span>
//             </p>
//           </form>

//         </div>
//       </div>
//     </div>
//   );
// };

// export default SignupPage;





import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, Mail, Phone, Briefcase, GraduationCap, Lock, ArrowRight, Stethoscope, HeartPulse 
} from "lucide-react";
import "./Signup.css"; 

// High-res images for premium look
import patientImg from "../../assets/images/patientlogin.png";
import doctorImg from "../../assets/images/doctorlogin.png";

const SignupPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("patient");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    specialization: "",
    credentials: "",
    password: "",
    confirmPassword: ""
  });

  const suggestionsData = {
    specialization: [
      "Cardiology", "Dermatology", "Neurology", "Pediatrics",
      "Orthopedics", "General Physician", "Psychiatry",
      "Radiology", "Oncology", "Gastroenterology"
    ],
    credentials: ["MBBS", "MD", "MS", "BDS", "DNB", "FRCS", "PhD", "MCh"]
  };

  const [filteredSpecs, setFilteredSpecs] = useState([]);
  const [filteredCreds, setFilteredCreds] = useState([]);
  const [activeField, setActiveField] = useState(null);
  const [popup, setPopup] = useState({ message: "", type: "", visible: false });

  const showPopup = (message, type) => {
    setPopup({ message, type, visible: true });
    setTimeout(() => setPopup({ ...popup, visible: false }), 3000);
  };

  const handleInputChange = (e, type) => {
    const value = e.target.value;
    setFormData({ ...formData, [type]: value });

    if (type === "specialization" || type === "credentials") {
      const dataKey = type === "specialization" ? "specialization" : "credentials";
      const filtered = suggestionsData[dataKey].filter(item =>
        item.toLowerCase().includes(value.toLowerCase())
      );
      if (type === "specialization") setFilteredSpecs(value ? filtered : []);
      else setFilteredCreds(value ? filtered : []);
      setActiveField(type);
    }
  };

  const validateForm = () => {
    const { fullName, email, mobile, password, confirmPassword, credentials, specialization } = formData;
    if (fullName.trim().length < 3) { showPopup("Full Name must be at least 3 characters", "error"); return false; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { showPopup("Enter a valid email address", "error"); return false; }
    if (!/^[0-9]{10}$/.test(mobile)) { showPopup("Mobile number must be 10 digits", "error"); return false; }
    if (password.length < 6) { showPopup("Password must be at least 6 characters", "error"); return false; }
    if (password !== confirmPassword) { showPopup("Passwords do not match", "error"); return false; }
    if (role === "doctor") {
      if (!credentials.trim()) { showPopup("Credentials required for doctor", "error"); return false; }
      if (!specialization.trim()) { showPopup("Specialization required for doctor", "error"); return false; }
    }
    return true;
  };

  const handleSignup = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const users = JSON.parse(localStorage.getItem("users")) || [];
    if (users.find((u) => u.email === formData.email)) { 
      showPopup("User already exists!", "error"); 
      return; 
    }

    const newUser = {
      ...formData,
      role: role.toUpperCase(),
      specialization: role === "doctor" ? formData.specialization : null,
      credentials: role === "doctor" ? formData.credentials : null,
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    showPopup("Account created successfully! ✨", "success");

    setTimeout(() => navigate("/login"), 2500);
  };

  return (
    <div className="auth-container">
      {popup.visible && (
        <div className={`popup-toast ${popup.type === "success" ? "success-toast" : "error-toast"}`}>
          {popup.type === "success" ? <HeartPulse size={20}/> : <Lock size={20}/>}
          {popup.message}
        </div>
      )}

      <div className="auth-wrapper">
        <div className="auth-visual">
          <div className="auth-visual-content">
            <img 
              src={role === "patient" ? patientImg : doctorImg} 
              alt="Healthcare" 
              className="auth-image"
            />
          </div>
        </div>

        <div className="auth-form-section">
          <div className="role-badge-container">
            <div className="role-toggle-btn" onClick={() => setRole(role === "patient" ? "doctor" : "patient")}>
              Are you a {role === "patient" ? "doctor" : "patient"}? <span>Register here</span>
            </div>
          </div>

          <div className="form-header">
            <h1>Let's register you on <span>Doctor's Hub</span></h1>
            <p>Join our professional healthcare community today.</p>
          </div>

          <form onSubmit={handleSignup}>
            <div className="input-group">
              <div className="input-wrapper full-width">
                <User className="input-icon" size={18} />
                <input 
                  type="text" 
                  className="auth-input"
                  placeholder="Full Name" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>

              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input 
                  type="email" 
                  className="auth-input"
                  placeholder="Email Address" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="input-wrapper">
                <Phone className="input-icon" size={18} />
                <input 
                  type="text" 
                  className="auth-input"
                  placeholder="Mobile Number" 
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                />
              </div>

              {role === "doctor" && (
                <>
                  <div className="input-wrapper relative">
                    <GraduationCap className="input-icon" size={18} />
                    <input 
                      type="text" 
                      className="auth-input"
                      placeholder="Credentials (e.g. MBBS)" 
                      value={formData.credentials} 
                      onChange={(e) => handleInputChange(e, "credentials")}
                      onFocus={() => setActiveField("credentials")}
                    />
                    {activeField === "credentials" && filteredCreds.length > 0 && (
                      <ul className="suggestions-list">
                        {filteredCreds.map((item, idx) => (
                          <li key={idx} onClick={() => { setFormData({...formData, credentials: item}); setActiveField(null); }}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="input-wrapper relative">
                    <Stethoscope className="input-icon" size={18} />
                    <input 
                      type="text" 
                      className="auth-input"
                      placeholder="Specialization" 
                      value={formData.specialization} 
                      onChange={(e) => handleInputChange(e, "specialization")}
                      onFocus={() => setActiveField("specialization")}
                    />
                    {activeField === "specialization" && filteredSpecs.length > 0 && (
                      <ul className="suggestions-list">
                        {filteredSpecs.map((item, idx) => (
                          <li key={idx} onClick={() => { setFormData({...formData, specialization: item}); setActiveField(null); }}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}

              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input 
                  type="password" 
                  className="auth-input"
                  placeholder="Create Password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input 
                  type="password" 
                  className="auth-input"
                  placeholder="Confirm Password" 
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </div>
            </div>
              <div className="terms-checkbox">
  <input type="checkbox" id="terms" required />
  <label htmlFor="terms">
    I agree to <span>Terms & Privacy Policy</span>
  </label>
</div>
            <button type="submit" className="signup-btn">
              Sign Up <ArrowRight size={20} />
            </button>

            <p className="footer-text">
              Already have an account? <span onClick={() => navigate("/login")}>Login Now</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;