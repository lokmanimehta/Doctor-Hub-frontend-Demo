import React, { useEffect, useState } from "react";
import {
  FiUser, FiPhone, FiMail, FiActivity, FiAlertCircle,
  FiClipboard, FiEye, FiEyeOff, FiEdit2, FiCamera, FiPlus
} from "react-icons/fi";
import "./PatientProfile.css";

const UpdateProfile = () => {
  // --- Data Fetching ---
  const patientLoginData = JSON.parse(localStorage.getItem("currentUser")) || {};

  // --- States ---
  const [isEditing, setIsEditing] = useState(false);
  const [familyMembers, setFamilyMembers] = useState(() => {
    return JSON.parse(localStorage.getItem(`familyMembers_${patientLoginData.email}`)) || [];
  });

  const [formData, setFormData] = useState({
    fullName: patientLoginData.fullName || "",
    email: patientLoginData.email || "",
    phone: patientLoginData.phone || "",
    age: patientLoginData.age || "",
    gender: patientLoginData.gender || "",
    bloodGroup: patientLoginData.bloodGroup || "",
    symptoms: patientLoginData.symptoms || "",
    history: patientLoginData.history || "",
    allergies: patientLoginData.allergies || "",
    chronic: patientLoginData.chronic || "",
    surgeries: patientLoginData.surgeries || "",
    medications: patientLoginData.medications || "",
    emergencyName: patientLoginData.emergencyName || "",
    emergencyPhone: patientLoginData.emergencyPhone || "",
    profileImage: patientLoginData.profileImage || "https://i.pravatar.cc/150",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({
    fullName: "",
    age: "",
    gender: "",
    relation: "",
    bloodGroup: "",
    phone: "",
  });

  // --- Profile Selection Logic ---
  const selfProfile = {
    id: "self",
    fullName: patientLoginData.fullName || "Self",
    age: patientLoginData.age,
    gender: patientLoginData.gender,
    relation: "Primary Member",
    type: "SELF"
  };

  const allProfiles = [selfProfile, ...familyMembers];

  const [selectedProfile, setSelectedProfile] = useState(() => {
    const saved = JSON.parse(localStorage.getItem("selectedProfile"));
    if (saved) return saved;
    localStorage.setItem("selectedProfile", JSON.stringify(selfProfile));
    return selfProfile;
  });

  // --- Handlers & Validation ---
  const validate = (field, value) => {
    switch (field) {
      case "phone":
      case "emergencyPhone":
        return /^\d{10}$/.test(value) ? "" : "Enter 10-digit number";
      case "email":
        return value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Invalid email" : "";
      case "age":
        return value && (value <= 0 || value > 120) ? "Enter valid age" : "";
      case "confirmPassword":
        return value !== formData.newPassword ? "Passwords do not match" : "";
      default:
        return "";
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    const error = validate(field, value);
    setErrors({ ...errors, [field]: error });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    ["phone", "emergencyPhone", "email", "age", "confirmPassword"].forEach(f => {
      const err = validate(f, formData[f]);
      if (err) newErrors[f] = err;
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      localStorage.setItem("currentUser", JSON.stringify(formData));
      alert("Profile updated successfully!");
      setIsEditing(false);
    } else {
      alert("Fix errors before saving!");
    }
  };

  const handleMemberChange = (field, value) => {
    setNewMember({ ...newMember, [field]: value });
  };

  const handleAddMember = () => {
    if (!newMember.fullName || !newMember.relation || !newMember.age || !newMember.gender) {
      alert("Please fill all required fields (*)");
      return;
    }
    const updatedMembers = [...familyMembers, { ...newMember, id: Date.now() }];
    setFamilyMembers(updatedMembers);
    localStorage.setItem(`familyMembers_${patientLoginData.email}`, JSON.stringify(updatedMembers));
    setNewMember({ fullName: "", age: "", gender: "", relation: "", bloodGroup: "", phone: "" });
    setShowAddMember(false);
  };

  // --- Effects ---
  useEffect(() => {
    document.body.style.overflow = showAddMember ? "hidden" : "auto";
  }, [showAddMember]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") setShowAddMember(false); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <div className="update-profile-container">
      <div className="form-page-header">
        <h2>{isEditing ? "Update Profile" : "My Profile Settings"}</h2>
        <p>{isEditing ? "Edit your details and complete your medical profile." : "Manage your personal and medical information."}</p>
      </div>

      {/* --- VIEW MODE --- */}
      {!isEditing ? (
        <div className="profile-view-section">
          <div className="profile-header-card">
            <div className="view-avatar-wrapper">
              <img src={formData.profileImage} alt="Profile" className="view-avatar-img" />
            </div>
            <div className="view-user-info">
              <h3>{formData.fullName}</h3>
              <p>{formData.email}</p>
              <button className="edit-toggle-btn" onClick={() => setIsEditing(true)}>
                <FiEdit2 /> Edit Profile
              </button>
            </div>
          </div>

          <div className="profile-details-grid">
            <div className="view-card">
              <h4><FiUser /> Personal</h4>
              <p><strong>Age:</strong> {formData.age || "N/A"}</p>
              <p><strong>Gender:</strong> {formData.gender || "N/A"}</p>
              <p><strong>Blood Group:</strong> {formData.bloodGroup || "N/A"}</p>
            </div>
            <div className="view-card">
              <h4><FiPhone /> Contact</h4>
              <p><strong>Phone:</strong> {formData.phone || "N/A"}</p>
              <p><strong>Emergency:</strong> {formData.emergencyName || "N/A"} ({formData.emergencyPhone || "N/A"})</p>
            </div>
            <div className="view-card full-span">
              <h4><FiActivity /> Medical Summary</h4>
              <div className="medical-tags-grid">
                <div className="tag-item"><strong>Symptoms:</strong> {formData.symptoms || "None"}</div>
                <div className="tag-item"><strong>Conditions:</strong> {formData.chronic || "None"}</div>
                <div className="tag-item"><strong>Allergies:</strong> {formData.allergies || "None"}</div>
                <div className="tag-item"><strong>Medications:</strong> {formData.medications || "None"}</div>
              </div>
            </div>
          </div>

          {/* --- FIX: SELECTED MEMBER BANNER --- */}
          <div className="selected-member-banner">
            <span>Booking For:</span>
            <strong>{selectedProfile?.fullName}</strong>
            <p>
              {selectedProfile?.relation}
              {selectedProfile?.age && ` • ${selectedProfile.age} Yrs`}
              {selectedProfile?.gender && ` • ${selectedProfile.gender}`}
            </p>
          </div>

          {/* --- FAMILY MEMBERS VIEW SECTION --- */}
          <div className="family-view-section">
            <div className="family-header">
              <h3>👨‍👩‍👧 Family Members</h3>
              <button className="add-member-btn" onClick={() => setShowAddMember(true)}>
                <FiPlus /> Add Member
              </button>
            </div>

            <div className="family-grid">
              {allProfiles.map((m) => (
                <div key={m.id} className={`family-mini-card ${selectedProfile?.id === m.id ? "selected-border" : ""}`}>
                  <div className="member-main-info">
                    <div className={`member-icon ${selectedProfile?.id === m.id ? "active-icon" : ""}`}>
                      {m?.fullName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="member-info">
                      <h5>{m.fullName}</h5>
                      <span>{m.relation} • {m.age || "N/A"} Yrs</span>
                    </div>
                  </div>
                  <button
                    className={`select-member-action-btn ${selectedProfile?.id === m.id ? "active-btn" : ""}`}
                    onClick={() => {
                      setSelectedProfile(m);
                      localStorage.setItem("selectedProfile", JSON.stringify(m));
                    }}
                  >
                    {selectedProfile?.id === m.id ? "Selected ✅" : "Select"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* --- EDIT MODE --- */
        <form className="update-profile-form" onSubmit={handleSubmit}>
          <div className="form-card profile-image-edit">
            <div className="avatar-edit-container">
   <img src={formData.profileImage} alt="Preview" className="edit-avatar-preview" />
   <div className="avatar-name">{formData.fullName}</div> {/* <-- ADD THIS */}
   <label htmlFor="imageUpload" className="camera-icon-label">
      <FiCamera />
      <input type="file" id="imageUpload" hidden onChange={handleImageUpload} accept="image/*" />
   </label>
</div>
            <p>Click camera icon to change photo</p>
          </div>

          <div className="form-grid-layout">
            <div className="form-card">
              <h3><FiUser /> Personal Details</h3>
              <div className="form-group">
                <label>Full Name <span className="mandatory">*</span></label>
                <input
                  type="text"
                  value={formData.fullName}
                  required
                  onChange={(e) => handleChange("fullName", e.target.value)}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleChange("age", e.target.value)}
                  />
                  {errors.age && <span className="error-msg">{errors.age}</span>}
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select value={formData.gender} onChange={(e) => handleChange("gender", e.target.value)}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-card">
              <h3><FiPhone /> Contact Info</h3>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
                {errors.phone && <span className="error-msg">{errors.phone}</span>}
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
                {errors.email && <span className="error-msg">{errors.email}</span>}
              </div>
            </div>

            <div className="form-card full-span">
              <h3><FiActivity /> Medical Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Blood Group</label>
                  <select value={formData.bloodGroup} onChange={(e) => handleChange("bloodGroup", e.target.value)}>
                    <option value="">Select</option>
                    <option>A+</option><option>B+</option><option>O+</option><option>AB+</option>
                    <option>A-</option><option>B-</option><option>O-</option><option>AB-</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Current Symptoms</label>
                  <input type="text" value={formData.symptoms} onChange={(e) => handleChange("symptoms", e.target.value)} placeholder="e.g. Fever, Cough" />
                </div>
              </div>
              <div className="form-group">
                <label>Medical History / Notes</label>
                <textarea value={formData.history} onChange={(e) => handleChange("history", e.target.value)} placeholder="Any past illnesses..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Known Allergies</label>
                  <input type="text" value={formData.allergies} onChange={(e) => handleChange("allergies", e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Chronic Conditions</label>
                  <input type="text" value={formData.chronic} onChange={(e) => handleChange("chronic", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="form-card">
              <h3><FiAlertCircle /> Emergency Contact</h3>
              <div className="form-group">
                <label>Contact Name</label>
                <input type="text" value={formData.emergencyName} onChange={(e) => handleChange("emergencyName", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Contact Phone</label>
                <input type="tel" value={formData.emergencyPhone} onChange={(e) => handleChange("emergencyPhone", e.target.value)} />
                {errors.emergencyPhone && <span className="error-msg">{errors.emergencyPhone}</span>}
              </div>
            </div>

            <div className="form-card">
              <h3><FiMail /> Update Password</h3>
              <div className="form-group password-group">
                <label>New Password</label>
                <div className="pass-input-wrapper">
                  <input
                    type={showPassword.new ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => handleChange("newPassword", e.target.value)}
                  />
                  <span className="eye-icon" onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}>
                    {showPassword.new ? <FiEyeOff /> : <FiEye />}
                  </span>
                </div>
              </div>
              <div className="form-group password-group">
                <label>Confirm Password</label>
                <div className="pass-input-wrapper">
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  />
                  <span className="eye-icon" onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}>
                    {showPassword.confirm ? <FiEyeOff /> : <FiEye />}
                  </span>
                </div>
                {errors.confirmPassword && <span className="error-msg">{errors.confirmPassword}</span>}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
            <button type="submit" className="save-btn"><FiClipboard /> Save Profile</button>
          </div>
        </form>
      )}

      {/* --- ADD FAMILY MEMBER MODAL --- */}
      {showAddMember && (
        <div className="modal-overlay" onClick={() => setShowAddMember(false)}>
          <div className="modal-box advanced-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-content">
                <h3>Add Family Member</h3>
                <p>Complete details for bookings & records</p>
              </div>
              <button className="close-x" onClick={() => setShowAddMember(false)}>&times;</button>
            </div>

            <div className="modal-body-scroll">
              <div className="form-group">
                <label>Full Name <span className="mandatory">*</span></label>
                <input
                  type="text"
                  placeholder="Enter name"
                  value={newMember.fullName}
                  onChange={(e) => handleMemberChange("fullName", e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Age <span className="mandatory">*</span></label>
                  <input
                    type="number"
                    value={newMember.age}
                    onChange={(e) => handleMemberChange("age", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Gender <span className="mandatory">*</span></label>
                  <select value={newMember.gender} onChange={(e) => handleMemberChange("gender", e.target.value)}>
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Relation <span className="mandatory">*</span></label>
                  <select value={newMember.relation} onChange={(e) => handleMemberChange("relation", e.target.value)}>
                    <option value="">Select</option>
                    <option>Mother</option><option>Father</option><option>Wife</option>
                    <option>Husband</option><option>Child</option><option>Sibling</option><option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Blood Group</label>
                  <select value={newMember.bloodGroup} onChange={(e) => handleMemberChange("bloodGroup", e.target.value)}>
                    <option value="">Select</option>
                    <option>A+</option><option>B+</option><option>O+</option><option>AB+</option>
                    <option>A-</option><option>B-</option><option>O-</option><option>AB-</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="10 digit number"
                  value={newMember.phone}
                  onChange={(e) => handleMemberChange("phone", e.target.value)}
                />
              </div>

              <div className="info-box">
                <FiAlertCircle />
                <p>This member will be available for quick booking.</p>
              </div>
            </div>

            <div className="modal-actions-sticky">
              <button className="modal-cancel-btn" onClick={() => setShowAddMember(false)}>Cancel</button>
              <button className="modal-save-btn" onClick={handleAddMember}>Add Member</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateProfile;