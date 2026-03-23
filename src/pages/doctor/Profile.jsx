

import React, { useState } from "react";
import "./Profile.css";
import { calculateProfileCompletion } from "../../utils/profileCompletion";
import { useNavigate } from "react-router-dom";

const DoctorProfile = () => {
  // --- LOCAL STORAGE SE DATA NIKALNA ---
  // Login/Signup ka data 'currentUser' key mein hota hai
  const storedUser = JSON.parse(localStorage.getItem("currentUser")) || {};

  // --- TOGGLE STATE FOR VIEW/EDIT ---
  
  // --- FORM STATE ---
  // Yaha storedUser ka data direct initialize ho raha hai taaki Edit mein dikhe
  const [isEditing, setIsEditing] = useState(false);

const navigate = useNavigate();
// ✅ PEHLE FORM
const [form, setForm] = useState({
  fullName: storedUser.fullName || "",
  email: storedUser.email || "",
  phone: storedUser.phone || "",
  specialization: storedUser.specialization || "",
  experience: storedUser.experience || "",
  gender: storedUser.gender || "",
  about: storedUser.about || "",
  profilePic: storedUser.profilePic || null,
  clinics: storedUser.clinics || [{
    clinicName: "",
    clinicAddress: "",
    consultationFee: "",
    availability: [
      { day: "", startTime: "", endTime: "" }
    ]
  }],
  visitingPositions: (storedUser.visitingPositions || []).map(vp => ({
    location: vp.location || "",
    fees: vp.fees || "",
    availability: vp.availability || [
      { day: "", startTime: "", endTime: "" }
    ]
  })),
  councilName: storedUser.councilName || "",
  registrationNumber: storedUser.registrationNumber || "",
  registrationYear: storedUser.registrationYear || "",
});

// ✅ AB YE NICHE AAYEGA


const profileCompletion = calculateProfileCompletion(form);

  const addAvailability = (clinicIndex) => {
    const newClinics = [...form.clinics];
    newClinics[clinicIndex].availability.push({
      day: "",
      startTime: "",
      endTime: ""
    });
    setForm({ ...form, clinics: newClinics });
  };
  const handleAvailabilityChange = (clinicIndex, index, e) => {
    const newClinics = [...form.clinics];
    newClinics[clinicIndex].availability[index][e.target.name] = e.target.value;
    setForm({ ...form, clinics: newClinics });
  };
  // --- FILES STATE ---
  const [files, setFiles] = useState({
    signature: null,
    govtIds: [{ type: "", file: null }],
    certificates: [{ title: "", file: null }],
  });

  // --- HANDLERS ---
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, profilePic: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const addClinic = () => setForm({
    ...form, clinics: [...form.clinics, {
      clinicName: "",
      clinicAddress: "",
      consultationFee: "",
      availability: [
        { day: "", startTime: "", endTime: "" }
      ]
    }]
  });
  const addVisiting = () => setForm({
    ...form, visitingPositions: [...form.visitingPositions, {
      location: "",
      fees: "",
      availability: [
        { day: "", startTime: "", endTime: "" }
      ]
    }]
  });
  const addGovtId = () => setFiles({ ...files, govtIds: [...files.govtIds, { type: "", file: null }] });
  const addCert = () => setFiles({ ...files, certificates: [...files.certificates, { title: "", file: null }] });

  const handleClinicChange = (index, e) => {
    const newClinics = [...form.clinics];
    newClinics[index][e.target.name] = e.target.value;
    setForm({ ...form, clinics: newClinics });
  };
  const addVisitingAvailability = (vpIndex) => {
    const newPositions = [...form.visitingPositions];
    newPositions[vpIndex].availability.push({
      day: "",
      startTime: "",
      endTime: ""
    });
    setForm({ ...form, visitingPositions: newPositions });
  };
  const handleVisitingAvailabilityChange = (vpIndex, index, e) => {
    const newPositions = [...form.visitingPositions];
    newPositions[vpIndex].availability[index][e.target.name] = e.target.value;
    setForm({ ...form, visitingPositions: newPositions });
  };
  const handleVisitingChange = (index, e) => {
    const newPositions = [...form.visitingPositions];
    newPositions[index][e.target.name] = e.target.value;
    setForm({ ...form, visitingPositions: newPositions });
  };

  const handleFileArrayChange = (index, e, category) => {
    const newArr = [...files[category]];
    if (e.target.type === "file") {
      newArr[index].file = e.target.files[0];
    } else {
      const field = category === "govtIds" ? "type" : "title";
      newArr[index][field] = e.target.value;
    }
    setFiles({ ...files, [category]: newArr });
  };

  // --- SUBMIT: LOCAL STORAGE MEIN DATA SAVE KARNA ---
const handleSubmit = (e) => {
  e.preventDefault();

  for (let clinic of form.clinics) {
    for (let slot of clinic.availability) {
      if (!slot.day || !slot.startTime || !slot.endTime) {
        alert("Please fill all availability fields");
        return;
      }

      if (slot.startTime >= slot.endTime) {
        alert("Start time must be before end time");
        return;
      }
    }
  }

  // ✅ FIX: create updatedUserData
  const updatedUserData = {
  ...storedUser,
  ...form
};

localStorage.setItem("currentUser", JSON.stringify(updatedUserData));

  window.dispatchEvent(new Event("storage"));

  alert("Profile updated successfully!");
  setIsEditing(false);
  navigate("/doctor/dashboard");
};
  const removeAvailability = (clinicIndex, index) => {
    const newClinics = [...form.clinics];
    newClinics[clinicIndex].availability.splice(index, 1);
    setForm({ ...form, clinics: newClinics });
  };
  const removeVisitingAvailability = (vpIndex, index) => {
    const newPositions = [...form.visitingPositions];
    newPositions[vpIndex].availability.splice(index, 1);
    setForm({ ...form, visitingPositions: newPositions });
  };
  return (
    <div className="doctor-profile-page">
      <div className="profile-top-header">
        <div>
          <h2>{isEditing ? "Edit Professional Profile" : "Doctor Profile"}</h2>
          <p className="profile-subtext">Manage your public identity and verification documents.</p>
        </div>
        {!isEditing && (
          <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
            Edit Profile
          </button>
        )}
      </div>

      {isEditing ? (
        <form className="profile-form" onSubmit={handleSubmit}>
          {/* PROFILE IMAGE UPLOAD SECTION */}
          <div className="section photo-upload-section">
            <h4>Profile Picture</h4>
            <div className="photo-upload-container">
              <div className="photo-preview">
                {form.profilePic ? (
                  <img src={form.profilePic} alt="Profile" className="avatar-img" />
                ) : (
                  <span className="default-avatar">👨‍⚕️</span>
                )}
              </div>
              <div className="photo-input-group">
                <label className="custom-file-upload">
                  Choose Photo
                  <input type="file" accept="image/*" onChange={handleImageUpload} />
                </label>
                <p className="subtext">Upload a professional headshot (JPG/PNG).</p>
              </div>
            </div>
          </div>

          {/* BASIC INFORMATION */}
          <div className="section">
            <h4>Basic Information</h4>
            <div className="input-grid">
              <div>
                <label>Full Name *</label>
                <input name="fullName" value={form.fullName} onChange={handleChange} required />
              </div>
              <div>
                <label>Gender *</label>
                <select name="gender" value={form.gender} onChange={handleChange} required>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Transgender">Transgender</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
            <div className="input-grid">
              <div>
                <label>Specialization *</label>
                <input name="specialization" value={form.specialization} placeholder="e.g. Cardiologist" onChange={handleChange} required />
              </div>
              <div>
                <label>Experience (Years) *</label>
                <input type="number" name="experience" value={form.experience} onChange={handleChange} required />
              </div>
            </div>
            <div className="input-grid">
              <div>
                <label>Email Address *</label>
                <input name="email" value={form.email} onChange={handleChange} required />
              </div>
              <div>
                <label>Phone Number *</label>
                <input name="phone" value={form.phone} placeholder="+91" onChange={handleChange} required />
              </div>
            </div>
            <div>
              <label>About Me</label>
              <textarea name="about" value={form.about} placeholder="Brief about your medical career..." onChange={handleChange} />
            </div>
          </div>

          {/* CLINIC LOCATIONS */}
          <div className="section">
            <h4>Clinic Information</h4>
            {form.clinics.map((clinic, index) => (
              <div key={index} className="multi-entry-block">
                <p className="entry-tag">Clinic #{index + 1}</p>
                <label>Clinic Name *</label>
                <input name="clinicName" value={clinic.clinicName} onChange={(e) => handleClinicChange(index, e)} required />
                <label>Clinic Address *</label>
                <textarea name="clinicAddress" value={clinic.clinicAddress} onChange={(e) => handleClinicChange(index, e)} required />
                <label>Consultation Fee (₹) *</label>
                <input type="number" name="consultationFee" value={clinic.consultationFee} onChange={(e) => handleClinicChange(index, e)} required />
                <p className="sub-label-header">Availability</p>

                {clinic.availability.map((slot, i) => (
                  <div key={i} className="input-grid">

                    <div>
                      <label>Day</label>
                      <select
                        name="day"
                        value={slot.day}
                        onChange={(e) => handleAvailabilityChange(index, i, e)}
                      >
                        <option value="">Select Day</option>
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                      </select>
                    </div>

                    <div>
                      <label>Start Time</label>
                      <input
                        type="time"
                        name="startTime"
                        value={slot.startTime}
                        onChange={(e) => handleAvailabilityChange(index, i, e)}
                      />
                    </div>

                    <div>
                      <label>End Time</label>
                      <input
                        type="time"
                        name="endTime"
                        value={slot.endTime}
                        onChange={(e) => handleAvailabilityChange(index, i, e)}
                      />
                    </div>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeAvailability(index, i)}
                    >
                      ❌
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="add-more-btn"
                  onClick={() => addAvailability(index)}
                >
                  + Add Time Slot
                </button>
              </div>
            ))}
            <button type="button" className="add-more-btn" onClick={addClinic}>+ Add Another Clinic</button>
          </div>

          {/* VISITING FACULTY */}
          <div className="section">
            <h4>Visiting Faculty Info</h4>
            {form.visitingPositions.map((vp, index) => (
              <div key={index} className="multi-entry-block">
                <p className="entry-tag">Visiting Location #{index + 1}</p>

                {/* Location aur Fee ke liye alag grid */}
                <div className="input-grid-basic">
                  <div>
                    <label>Visiting Location</label>
                    <input name="location" value={vp.location} placeholder="Hospital Name" onChange={(e) => handleVisitingChange(index, e)} />
                  </div>
                  <div>
                    <label>Fee (₹)</label>
                    <input type="number" name="fees" value={vp.fees} onChange={(e) => handleVisitingChange(index, e)} />
                  </div>
                </div>

                <p className="sub-label-header">Availability</p>

                {/* Availability loop ab clean dikhega */}
                {(vp.availability || []).map((slot, i) => (
                  <div key={i} className="input-grid">
                    <div>
                      <label>Day</label>
                      <select name="day" value={slot.day} onChange={(e) => handleVisitingAvailabilityChange(index, i, e)}>
                        <option value="">Select Day</option>
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                      </select>
                    </div>
                    <div>
                      <label>Start Time</label>
                      <input type="time" name="startTime" value={slot.startTime} onChange={(e) => handleVisitingAvailabilityChange(index, i, e)} />
                    </div>
                    <div>
                      <label>End Time</label>
                      <input type="time" name="endTime" value={slot.endTime} onChange={(e) => handleVisitingAvailabilityChange(index, i, e)} />
                    </div>
                    <button type="button" className="remove-btn" onClick={() => removeVisitingAvailability(index, i)}>❌</button>
                  </div>
                ))}

                <button type="button" className="add-more-btn" onClick={() => addVisitingAvailability(index)}>
                  + Add Time Slot
                </button>
              </div>
            ))}
            <button type="button" className="add-more-btn" onClick={addVisiting}>+ Add Visiting Hospital</button>
          </div>

          {/* VERIFICATION & DOCUMENTS */}
          <div className="section">
            <h4>Professional Verification</h4>
            <div className="input-grid">
              <div>
                <label>Medical Council Name *</label>
                <input name="councilName" value={form.councilName} placeholder="Enter your Medical Council" onChange={handleChange} required />
              </div>
              <div>
                <label>Registration Year *</label>
                <input type="number" name="registrationYear" value={form.registrationYear} placeholder="YYYY" onChange={handleChange} required />
              </div>
            </div>
            <label>Medical Council Registration Number *</label>
            <input name="registrationNumber" value={form.registrationNumber} placeholder="Reg No." onChange={handleChange} required />

            <p className="sub-label-header">Government Identity Proofs</p>
            {files.govtIds.map((item, index) => (
              <div key={index} className="file-row">
                <select value={item.type} onChange={(e) => handleFileArrayChange(index, e, "govtIds")} required>
                  <option value="">Select ID Type</option>
                  <option value="AADHAAR">Aadhaar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="VOTER_ID">Voter ID</option>
                  <option value="DRIVING_LICENSE">Driving License</option>
                  <option value="OTHER">Other Govt ID</option>
                </select>
                <input type="file" onChange={(e) => handleFileArrayChange(index, e, "govtIds")} required />
              </div>
            ))}
            <button type="button" className="add-more-btn" onClick={addGovtId}>+ Add Another ID</button>

            <p className="sub-label-header">Certificates (Degree/Registration)</p>
            {files.certificates.map((item, index) => (
              <div key={index} className="file-row">
                <input placeholder="Name (e.g. MBBS, MD, Fellowship)" value={item.title} onChange={(e) => handleFileArrayChange(index, e, "certificates")} required />
                <input type="file" onChange={(e) => handleFileArrayChange(index, e, "certificates")} required />
              </div>
            ))}
            <button type="button" className="add-more-btn" onClick={addCert}>+ Add More Certificates</button>

            <div className="signature-box">
              <label>Digital Signature *</label>
              <input type="file" name="signature" onChange={handleFileChange} required />
              <p className="subtext">Upload image of signature on white background.</p>
            </div>
          </div>

          <div className="form-buttons-fixed">
            <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
            <button type="submit" className="save-btn">Save & Update Profile</button>
          </div>
        </form>
      ) : (
        /* --- VIEW MODE: DETAILED DOCTOR PROFILE --- */
        <div className="profile-view-container">
          <div className="view-card main-info-card">
            <div className="doctor-header-top">

              <div className="view-avatar">
                {form.profilePic ? (
                  <img src={form.profilePic} alt="Doctor" className="avatar-img" />
                ) : (
                  "👨‍⚕️"
                )}
              </div>

              <div className="view-title-group">
                <h3>
                  {form.fullName}
                  {form.councilName && form.registrationNumber && (
                    <span className="verified-check">✔ Verified</span>
                  )}
                </h3>

                <p className="view-spec">{form.specialization}</p>

                <div className="view-tags">
                  <span>{form.experience} Years Experience</span>
                  <span>{form.gender}</span>
                  <span>⭐ 4.5 Rating</span> {/* dummy */}
                </div>
              </div>
            </div>

            {form.about && (
              <div className="view-about">
                <p>{form.about}</p>
              </div>
            )}
          </div>

          <div className="view-grid">
            <div className="view-card">
              <h4>Contact & Verification</h4>
              <div className="view-details">
                <p><strong>📧 Email:</strong> {form.email}</p>
                <p><strong>📞 Phone:</strong> {form.phone || "Not Provided"}</p>
                <hr className="view-divider" />
                <p><strong>Council:</strong> {form.councilName || "N/A"}</p>
                <p><strong>Reg No:</strong> {form.registrationNumber || "N/A"}</p>
                <p><strong>Year:</strong> {form.registrationYear || "N/A"}</p>
              </div>
            </div>

            <div className="view-card">
              <h4>Clinics ({form.clinics.length})</h4>
              {form.clinics.map((c, i) => (
                <div key={i} className="view-entry-item">
                  <p className="view-entry-title">{c.clinicName || "Clinic Name"}</p>
                  <p className="view-entry-sub">{c.clinicAddress || "Address"}</p>
                  <p className="view-fee">Fee: ₹{c.consultationFee || "0"}</p>
                  {c.availability && c.availability.map((a, j) => (
                    <p key={j} className="view-entry-sub">
                      📅 {a.day} | ⏰ {a.startTime} - {a.endTime}
                    </p>
                  ))}
                </div>
              ))}
            </div>

            {form.visitingPositions.length > 0 && (
              <div className="view-card">
                <h4>Visiting Positions</h4>
                {form.visitingPositions.map((v, i) => (
                  <div key={i} className="view-entry-item">
                    <p className="view-entry-title">{v.location}</p>
                    {v.availability && v.availability.map((a, j) => (
                      <p key={j} className="view-entry-sub">
                        📅 {a.day} | ⏰ {a.startTime} - {a.endTime}
                      </p>
                    ))}
                    <p className="view-fee">Fee: ₹{v.fees}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {profileCompletion < 100 && (
  <div className="profile-warning">
    ⚠️ Your profile is {profileCompletion}% complete. Please complete it.
  </div>
)}

{profileCompletion === 100 && (
  <div className="profile-success">
    ✅ Your profile is live for patients
  </div>
)}
    </div>
  );
};

export default DoctorProfile;