

import React, { useState, useEffect } from "react";
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
  const [form, setForm] = useState(() => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser")) || {};

    return {
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
    };
  });
  // ✅ AB YE NICHE AAYEGA

  const [files, setFiles] = useState(() => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser")) || {};

    return storedUser.files || {
      signature: null,
      govtIds: [{ type: "", file: null }],
      certificates: [{ title: "", file: null }],
    };
  });
  const profileCompletion = calculateProfileCompletion(form, files);

  const isProfileComplete = profileCompletion >= 80;
  const isVerified = storedUser.adminApproved === true;

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
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFiles({
          ...files,
          [e.target.name]: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
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
      const file = e.target.files[0];

      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newArr[index].file = reader.result;

          setFiles(prev => ({
            ...prev,
            [category]: newArr
          }));
        };
        reader.readAsDataURL(file);
      }
    } else {
      const field = category === "govtIds" ? "type" : "title";
      newArr[index][field] = e.target.value;
    }
    setFiles({ ...files, [category]: newArr });
  };

  // --- SUBMIT: LOCAL STORAGE MEIN DATA SAVE KARNA ---
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fullName) {
      setPopup({
        show: true,
        type: "error",
        message: "Full Name is required"
      });
      return;
    }

    if (!form.email) {
      setPopup({
        show: true,
        type: "error",
        message: "Email is required"
      });
      return;
    }

    for (let clinic of form.clinics) {
      for (let slot of clinic.availability) {
        if (!slot.day || !slot.startTime || !slot.endTime) {
          setPopup({
            show: true,
            type: "error",
            message: "Please fill all availability fields"
          });
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
      ...form,
      files // 🔥 IMPORTANT
    };
    localStorage.setItem("currentUser", JSON.stringify(updatedUserData));

    window.dispatchEvent(new Event("storage"));

    setPopup({
      show: true,
      type: "success",
      message: "Profile updated successfully!"
    });

    setTimeout(() => {
      navigate("/doctor/dashboard");
    }, 2000);
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
  const [popup, setPopup] = useState({
    show: false,
    type: "", // success | error | warning
    message: ""
  });

  useEffect(() => {
    if (popup.show) {
      const timer = setTimeout(() => {
        setPopup(prev => ({ ...prev, show: false }));
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [popup.show]);
  return (
    <div className="doctor-profile-page">
      <div className="profile-top-header">
        <div>
          <h2>{isEditing ? "Edit Professional Profile" : "Doctor Profile"}</h2>
          <p className="profile-subtext">Manage your public identity and verification documents.</p>
        </div>
        {!isEditing && (
          <button
            className="edit-profile-btn"
            onClick={() => {
              setIsEditing(true);

              const storedUser = JSON.parse(localStorage.getItem("currentUser")) || {};
              setForm(prev => ({
                ...prev,
                ...storedUser
              }));
            }}
          >
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
          <div className="view-card">
            <div className="doctor-header-top">
              <div className="view-avatar">
                <img src={form.profilePic || "https://via.placeholder.com/150"} alt="Dr." className="avatar-img" />
              </div>
              <div className="view-title-group">
                <h3>
                  {form.fullName}
                  {isVerified && (
                    <span className="verified-check">✔ Verified</span>
                  )}
                </h3>
                <p className="view-spec">{form.specialization}</p>
                <div className="view-tags">
                  <span>{form.experience} Years Experience</span>
                  <span>{form.gender}</span>
                  <span>⭐ 4.8 Rating</span>
                </div>
              </div>
            </div>

            <div className="view-about">
              <h4>About</h4>
              <p>{form.about || "Experienced physician dedicated to patient care..."}</p>
            </div>
          </div>

          <div className="view-grid">
            <div className="view-card info-sub-card">
              <h4>Contact & Verification</h4>
              <div className="detail-row">📧 <strong>Email:</strong> {form.email}</div>
              <div className="detail-row">📞 <strong>Phone:</strong> {form.phone}</div>
              <hr style={{ border: '0', borderTop: '1px dashed #eee', margin: '15px 0' }} />
              <div className="detail-row"><strong>Council:</strong> {form.councilName}</div>
              <div className="detail-row"><strong>Reg No:</strong> {form.registrationNumber}</div>
              <div className="detail-row"><strong>Year:</strong> {form.registrationYear}</div>
            </div>

            <div className="view-card info-sub-card">
              <h4>Clinics ({form.clinics.length})</h4>
              {form.clinics.map((clinic, index) => (
                <div key={index} className="clinic-item">
                  <span className="fee-tag">₹{clinic.consultationFee}</span>
                  <strong>{clinic.clinicName}</strong>
                  <div style={{ fontSize: '12px', color: '#666' }}>{clinic.clinicAddress}</div>
                  <div style={{ fontSize: '11px', marginTop: '5px', color: '#10b981' }}>✔ CLINIC CERTIFIED</div>
                </div>
              ))}
            </div>

            <div className="view-card info-sub-card">
              <h4>Visiting Positions</h4>
              {form.visitingPositions.length > 0 ? form.visitingPositions.map((vp, index) => (
                <div key={index} className="clinic-item">
                  <strong>{vp.location}</strong>
                  <div style={{ fontSize: '12px', color: '#666' }}>Fee: ₹{vp.fees}</div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#10b981', marginTop: '5px' }}>HOSPITAL ENDORSED</div>
                </div>
              )) : <p className="subtext">No positions added.</p>}
            </div>
          </div>

          <div className="status-bar">
            ✔ {
              isProfileComplete
                ? "Your profile is ready for patients"
                : "Complete your profile to go live"
            } | Completion: {profileCompletion}%
          </div>
        </div>
      )}
      {popup.show && (
        <div className={`popup ${popup.type}`}>
          <div className="popup-content">
            <p>{popup.message}</p>
            <button onClick={() => setPopup({ ...popup, show: false })}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorProfile;