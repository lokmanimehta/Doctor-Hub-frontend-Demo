
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Mail, Phone, GraduationCap, Lock, ArrowRight, Stethoscope, HeartPulse
} from "lucide-react";
import "./Signup.css";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { signupUser } from "../../services/authService";
// High-res images for premium look
import patientImg from "../../assets/images/patientlogin.png";
import doctorImg from "../../assets/images/doctorlogin.png";
import api from "../../services/api"
const SignupPage = () => {
  const navigate = useNavigate();
  const [signupStep, setSignupStep] = useState("form");
  const [emailForOtp, setEmailForOtp] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState("patient");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [specInput, setSpecInput] = useState("");
  const [credInput, setCredInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showFamilyForm, setShowFamilyForm] = useState(false);

  const [newMember, setNewMember] = useState({
    fullName: "",
    relation: "",
    gender: "",
    dateOfBirth: "",
    bloodGroup: "",
    mobileNumber: ""
  });
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    specialization: [],
    credentials: [],
    password: "",
    confirmPassword: ""
  });

  const [masterData, setMasterData] = useState({
    specializations: [],
    degrees: []
  });

  const [filteredSpecs, setFilteredSpecs] = useState([]);
  const [filteredCreds, setFilteredCreds] = useState([]);
  const [activeField, setActiveField] = useState(null);
  const [popup, setPopup] = useState({ message: "", type: "", visible: false });


  const showPopup = (message, type) => {
    setPopup({ message, type, visible: true });
    setTimeout(() => {
      setPopup(prev => ({ ...prev, visible: false }));
    }, 3000);
  };
  useEffect(() => {
    const fetchDoctorMasterData = async () => {
      try {
        const [degreeResponse, specializationResponse] = await Promise.all([
          api.get("/doctor/master/degrees"),
          api.get("/doctor/master/specializations")
        ]);

        setMasterData({
          degrees: Array.isArray(degreeResponse.data)
            ? degreeResponse.data.map((item) => item.name)
            : [],
          specializations: Array.isArray(specializationResponse.data)
            ? specializationResponse.data.map((item) => item.name)
            : []
        });
      } catch {
        showPopup("Failed to load doctor dropdown data", "error");
      }
    };

    fetchDoctorMasterData();
  }, []);

  const handleInputChange = (e, type) => {
    const value = e.target.value;

    if (type === "specialization") {
      setSpecInput(value);

      const filtered = masterData.specializations.filter((item) =>
        item.toLowerCase().includes(value.toLowerCase())
      );

      setFilteredSpecs(filtered);
      setActiveField("specialization");
    }

    if (type === "credentials") {
      setCredInput(value);

      const filtered = masterData.degrees.filter((item) =>
        item.toLowerCase().includes(value.toLowerCase())
      );

      setFilteredCreds(filtered);
      setActiveField("credentials");
    }
  };

  useEffect(() => {
    let interval;

    if (signupStep === "otp" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [signupStep, timer]);

  const validateForm = () => {
    const { fullName, email, mobile, password, confirmPassword, credentials, specialization } = formData;
    if (fullName.trim().length < 3) { showPopup("Full Name must be at least 3 characters", "error"); return false; }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { showPopup("Enter a valid email address", "error"); return false; }
    if (!/^[6-9]\d{9}$/.test(mobile.trim())) { showPopup("Mobile number must be 10 digits", "error"); return false; }
    if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@#$%^&+=!]).{8,}$/.test(password)) {
      showPopup("Password must contain uppercase, lowercase, number and special character", "error");
      return false;
    } if (password !== confirmPassword) { showPopup("Passwords do not match", "error"); return false; }
    if (role === "doctor") {

      if (credentials.length === 0) {
        showPopup("Please select at least one credential", "error");
        return false;
      }

      if (specialization.length === 0) {
        showPopup("Please select at least one specialization", "error");
        return false;
      }

    }
    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        password: formData.password,
        role: role.toUpperCase(),
        acceptedTerms: acceptedTerms,
        specialization:
          role === "doctor"
            ? formData.specialization.map(item => item.trim())
            : [],

        credentials:
          role === "doctor"
            ? formData.credentials.map(item => item.trim())
            : [],

        familyMembers:
          role === "patient"
            ? familyMembers.map((member) => ({
              fullName: member.fullName.trim(),
              relation: member.relation.trim(),
              gender: member.gender.trim(),
              dateOfBirth: member.dateOfBirth,
              bloodGroup: member.bloodGroup?.trim(),
              mobileNumber: member.mobileNumber?.trim()
            }))
            : []
      };

      await signupUser(payload);

      const maskedEmail = formData.email
        .trim()
        .replace(/(.{2}).+(@.+)/, "$1****$2");

      setEmailForOtp(formData.email);

      showPopup(`📧 OTP sent successfully to ${maskedEmail}`, "success");

      setSignupStep("otp");
      setTimer(60);


    } catch (err) {
      showPopup(err.message || "Signup failed", "error");
    } finally {
      setLoading(false);
    }
  };


  const verifyOtp = async () => {

    if (otpLoading) return;

    const trimmedOtp = otp.trim();

    if (!trimmedOtp) {
      showPopup("Please enter OTP", "error");
      return;
    }

    if (!/^[0-9]{6}$/.test(trimmedOtp)) {
      showPopup("OTP must be exactly 6 digits", "error");
      return;
    }

    try {

      setOtpLoading(true);

      await api.post("/auth/verify-otp", {
        identifier: emailForOtp.trim(),
        otp: trimmedOtp
      });

      showPopup(" Account verified successfully!", "success");

      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {
      showPopup(err.message || "OTP verification failed", "error");
    } finally {
      setOtpLoading(false);
    }
  };

  const resendOtp = async () => {
    if (timer > 0) return;

    try {
      await api.post("/auth/resend-otp", {
        identifier: emailForOtp.trim()
      });

      const maskedEmail = emailForOtp
        .trim()
        .replace(/(.{2}).+(@.+)/, "$1****$2");

      showPopup(`🔁 OTP resent to ${maskedEmail}`, "success");
      setTimer(60);



    } catch (err) {
      showPopup(err.message || "Error occurred", "error");
    }
  };

  return (
    <div className="auth-container">
      {popup.visible && (
        <div className={`popup-toast ${popup.type === "success" ? "success-toast" : "error-toast"}`}>
          {/* {popup.type === "success" ? <HeartPulse size={20}/> : <Lock size={20}/>} */}
          {popup.type === "success"
            ? <HeartPulse size={20} color="#fff" />
            : <Lock size={20} color="#fff" />
          }
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
              Are you a {role === "patient" ? "doctor" : "patient"} ? <span>Register here</span>
            </div>
          </div>

          <div className="form-header">
            <h1>Let's register you on <span>Doctor's Hub</span></h1>
            <p>Join our professional healthcare community today.</p>
          </div>

          {signupStep === "form" && (
            <form onSubmit={handleSignup}>
              <div className="input-group">
                <div className="input-wrapper full-width">
                  <User className="input-icon" size={18} />
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div className="input-wrapper full-width">
                  <Mail className="input-icon" size={18} />
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="input-wrapper full-width">
                  <Phone className="input-icon" size={18} />
                  <input
                    type="tel"
                    className="auth-input"
                    placeholder="Mobile Number"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  />
                </div>

                {role === "doctor" && (
                  <>
                    {/* Credentials */}

                    <div className="full-width">

                      <div className="selected-tags">
                        {formData.credentials.map((cred, index) => (
                          <span key={index} className="tag">
                            {cred}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  credentials: formData.credentials.filter((_, i) => i !== index)
                                })
                              }}
                            >
                              &#10005;
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="input-wrapper relative">
                        <GraduationCap className="input-icon" size={18} />

                        <input
                          type="text"
                          className="auth-input"
                          placeholder="Credentials (e.g. MBBS)"
                          value={credInput}
                          onChange={(e) => handleInputChange(e, "credentials")}
                          onFocus={() => {
                            setActiveField("credentials")
                            setFilteredCreds(masterData.degrees)
                          }}
                        />

                        {activeField === "credentials" && filteredCreds.length > 0 && (
                          <ul className="suggestions-list">
                            {filteredCreds.map((item, idx) => (
                              <li
                                key={idx}
                                onClick={() => {

                                  if (!formData.credentials.includes(item)) {
                                    setFormData({
                                      ...formData,
                                      credentials: [...formData.credentials, item]
                                    })
                                  }

                                  setCredInput("")
                                  setActiveField(null)

                                }}
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}

                      </div>

                    </div>


                    {/* Specialization */}

                    <div className="full-width">

                      <div className="selected-tags">
                        {formData.specialization.map((spec, index) => (
                          <span key={index} className="tag">
                            {spec}

                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  specialization: formData.specialization.filter((_, i) => i !== index)
                                })
                              }}
                            >
                              &#10005;
                            </button>

                          </span>
                        ))}
                      </div>

                      <div className="input-wrapper relative">
                        <Stethoscope className="input-icon" size={18} />

                        <input
                          type="text"
                          className="auth-input"
                          placeholder="Specialization"
                          value={specInput}
                          onChange={(e) => handleInputChange(e, "specialization")}
                          onFocus={() => {
                            setActiveField("specialization")
                            setFilteredSpecs(masterData.specializations)
                          }}
                        />

                        {activeField === "specialization" && filteredSpecs.length > 0 && (
                          <ul className="suggestions-list">

                            {filteredSpecs.map((item, idx) => (
                              <li
                                key={idx}
                                onClick={() => {

                                  if (!formData.specialization.includes(item)) {
                                    setFormData({
                                      ...formData,
                                      specialization: [...formData.specialization, item]
                                    })
                                  }

                                  setSpecInput("")
                                  setActiveField(null)

                                }}
                              >
                                {item}
                              </li>
                            ))}

                          </ul>
                        )}

                      </div>

                    </div>

                  </>
                )}

                <div className="input-wrapper full-width">
                  <Lock className="input-icon" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="auth-input"
                    placeholder="Create Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <span
                    className="show-hide-icon"
                    onClick={() => setShowPassword(prev => !prev)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </span>
                </div>

                <div className="input-wrapper full-width">
                  <Lock className="input-icon" size={18} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="auth-input"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                  <span
                    className="show-hide-icon"
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </span>
                </div>
              </div>
              <div className="terms-checkbox">
                <div className="checkbox-wrapper-12">
                  <div className="cbx">
                    <input
                      id="terms-cbx"
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={() => setAcceptedTerms(!acceptedTerms)}
                      required
                    />
                    <label htmlFor="terms-cbx"></label>
                    <svg width="15" height="14" viewBox="0 0 15 14" fill="none">
                      <path d="M2 8.36364L6.23077 12L13 2"></path>
                    </svg>
                  </div>
                </div>
                <label htmlFor="terms-cbx">
                  I agree to <span>Terms & Privacy Policy</span>
                </label>
              </div>
              <button type="submit" className="signup-btn" disabled={loading}>
                {loading ? "Creating Account..." : "Sign Up"} <ArrowRight size={20} />
              </button>

              <p className="footer-text">
                Already have an account? <span onClick={() => navigate("/login")}>Login Now</span>
              </p>

              {role === "patient" && (
                <div className="family-section">
                  <div className="family-header">
                    <h4>Family Members (Optional)</h4>
                    <button
                      type="button"
                      onClick={() => setShowFamilyForm(!showFamilyForm)}
                      className="add-family-btn"
                    >
                      + Add Member
                    </button>
                  </div>

                  {showFamilyForm && (
                    <div className="family-form">
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={newMember.fullName}
                        onChange={(e) =>
                          setNewMember({ ...newMember, fullName: e.target.value })
                        }
                      />

                      <input
                        type="date"
                        value={newMember.dateOfBirth}
                        onChange={(e) =>
                          setNewMember({ ...newMember, dateOfBirth: e.target.value })
                        }
                      />

                      <select
                        value={newMember.gender}
                        onChange={(e) =>
                          setNewMember({ ...newMember, gender: e.target.value })
                        }
                      >
                        <option value="">Gender</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>

                      <select
                        value={newMember.bloodGroup}
                        onChange={(e) =>
                          setNewMember({ ...newMember, bloodGroup: e.target.value })
                        }
                      >
                        <option value="">Blood Group (Optional)</option>
                        <option>A+</option>
                        <option>A-</option>
                        <option>B+</option>
                        <option>B-</option>
                        <option>AB+</option>
                        <option>AB-</option>
                        <option>O+</option>
                        <option>O-</option>
                      </select>

                      <select
                        value={newMember.relation}
                        onChange={(e) =>
                          setNewMember({ ...newMember, relation: e.target.value })
                        }
                      >
                        <option value="">Relation</option>
                        <option>Mother</option>
                        <option>Father</option>
                        <option>Brother</option>
                        <option>Sister</option>
                        <option>Spouse</option>
                        <option>Son</option>
                        <option>Daughter</option>
                        <option>Grandfather</option>
                        <option>Grandmother</option>
                        <option>Other</option>
                      </select>

                      <input
                        type="tel"
                        placeholder="Mobile Number (Optional)"
                        value={newMember.mobileNumber}
                        onChange={(e) =>
                          setNewMember({ ...newMember, mobileNumber: e.target.value })
                        }
                      />

                      <button
                        type="button"
                        onClick={() => {
                          if (
                            !newMember.fullName.trim() ||
                            !newMember.relation ||
                            !newMember.gender ||
                            !newMember.dateOfBirth
                          ) {
                            showPopup("Please fill all required family member details", "error");
                            return;
                          }
                          if (new Date(newMember.dateOfBirth) > new Date()) {
                            showPopup("Date of birth cannot be in the future", "error");
                            return;
                          }
                          if (
                            newMember.mobileNumber &&
                            !/^[6-9]\d{9}$/.test(newMember.mobileNumber)
                          ) {
                            showPopup("Family member mobile number must be a valid 10-digit Indian number", "error");
                            return;
                          }
                          const exists = familyMembers.some(
                            member =>
                              member.fullName.trim().toLowerCase() === newMember.fullName.trim().toLowerCase() &&
                              member.dateOfBirth === newMember.dateOfBirth
                          );

                          if (exists) {
                            showPopup("Family member already added", "error");
                            return;
                          }
                          setFamilyMembers([
                            ...familyMembers,
                            { ...newMember, id: Date.now(), type: "FAMILY" }
                          ]);

                          setNewMember({
                            fullName: "",
                            relation: "",
                            gender: "",
                            dateOfBirth: "",
                            bloodGroup: "",
                            mobileNumber: ""
                          });

                          setShowFamilyForm(false);
                        }}
                      >
                        Save Member
                      </button>
                    </div>
                  )}

                  {familyMembers.length > 0 && (
                    <div className="family-list">
                      {familyMembers.map((m) => (
                        <div key={m.id} className="family-chip">
                          {m.fullName} ({m.relation}) - {m.gender}
                          <span onClick={() => {
                            setFamilyMembers(familyMembers.filter(f => f.id !== m.id));
                          }}> ❌ </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </form>
          )}
          {signupStep === "otp" && (

            <div className="otp-section">

              <h3>Verify OTP</h3>
              <p>
                Enter OTP sent to {
                  emailForOtp
                    ?.trim()
                    .replace(/(.{2}).+(@.+)/, "$1****$2")
                }
              </p>

              <div className="input-wrapper">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Enter OTP"
                  value={otp}
                  maxLength={6}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "")
                    setOtp(value)
                  }}
                  className="auth-input"
                />
              </div>

              <button
                className="signup-btn"
                onClick={verifyOtp}
                disabled={otpLoading}
              >
                {otpLoading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                className="resend-btn"
                onClick={resendOtp}
                disabled={timer > 0}
              >
                {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
              </button>
              <button
                className="back-btn-premium group"
                type="button"
                onClick={() => setSignupStep("form")}
              >
                <div className="back-btn-icon-box">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1024 1024"
                    height="25px"
                    width="25px"
                  >
                    <path
                      d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z"
                      fill="#000000"
                    ></path>
                    <path
                      d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z"
                      fill="#000000"
                    ></path>
                  </svg>
                </div>
                <p className="back-btn-text">Go Back</p>
              </button>

            </div>

          )}
        </div>
      </div>
    </div>
  );
};

export default SignupPage;