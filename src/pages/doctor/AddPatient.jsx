import React, { useEffect, useState } from "react";
import {
  FiUser,
  FiPhone,
  FiMail,
  FiActivity,
  FiAlertCircle,
  FiClipboard,
  FiMapPin,
  FiCalendar
} from "react-icons/fi";
import "./AddPatient.css";
import { createDoctorPatient, getDoctorProfile } from "../../services/doctorService";

const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDER_OPTIONS = ["MALE", "FEMALE", "OTHER"];

const initialFormData = {
  doctorClinicId: "",
  fullName: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  email: "",
  bloodGroup: "",
  symptoms: "",
  medicalHistory: "",
  allergies: "",
  chronicConditions: "",
  surgeries: "",
  medications: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  isCritical: false
};

const AddPatient = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [clinics, setClinics] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    loadDoctorClinics();
  }, []);

  const loadDoctorClinics = async () => {
    try {
      setLoadingClinics(true);
      const res = await getDoctorProfile();

      const profileData = res?.data || res || {};
      const clinicList =
        profileData?.clinics ||
        profileData?.doctorClinics ||
        profileData?.hospitalClinics ||
        [];

      const activeClinics = clinicList.filter((clinic) => clinic?.isActive !== false);
      setClinics(activeClinics);
    } catch (error) {
      console.error("Failed to load clinics", error);
      setClinics([]);
    } finally {
      setLoadingClinics(false);
    }
  };

  const validateField = (field, value) => {
    switch (field) {
      case "doctorClinicId":
        return "";

      case "fullName":
        return value.trim() ? "" : "Full name is required";

      case "dateOfBirth":
        if (!value) return "Date of birth is required";
        if (new Date(value) > new Date()) return "DOB cannot be in the future";
        return "";

      case "gender":
        return value ? "" : "Gender is required";

      case "phone":
        return /^\d{10}$/.test(value) ? "" : "Enter valid 10-digit phone number";

      case "email":
        if (!value) return "";
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Invalid email format";

      case "bloodGroup":
        if (!value) return "";
        return BLOOD_GROUP_OPTIONS.includes(value) ? "" : "Invalid blood group";

      case "emergencyContactPhone":
        if (!value) return "";
        return /^\d{10}$/.test(value) ? "" : "Enter valid 10-digit emergency phone";

      default:
        return "";
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, value)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    const requiredFields = [
      "fullName",
      "dateOfBirth",
      "gender",
      "phone"
    ];

    requiredFields.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    ["email", "bloodGroup", "emergencyContactPhone"].forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = () => {
    return {
      doctorClinicId: formData.doctorClinicId
        ? Number(formData.doctorClinicId)
        : null,
      fullName: formData.fullName.trim(),
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      phone: formData.phone.trim(),
      email: formData.email.trim() || null,
      bloodGroup: formData.bloodGroup || null,
      symptoms: formData.symptoms.trim() || null,
      medicalHistory: formData.medicalHistory.trim() || null,
      allergies: formData.allergies.trim() || null,
      chronicConditions: formData.chronicConditions.trim() || null,
      surgeries: formData.surgeries.trim() || null,
      medications: formData.medications.trim() || null,
      emergencyContactName: formData.emergencyContactName.trim() || null,
      emergencyContactPhone: formData.emergencyContactPhone.trim() || null,
      isCritical: formData.isCritical
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMessage("");

    if (!validateForm()) {
      setSubmitMessage("Please fix the highlighted errors before saving.");
      return;
    }

    try {
      setSaving(true);

      const payload = buildPayload();
      await createDoctorPatient(payload);

      setSubmitMessage("Patient record created successfully.");
      setFormData(initialFormData);
      setErrors({});
    } catch (error) {
      console.error("Create patient failed", error);

      const message =
        error?.message ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to save patient record.";

      setSubmitMessage(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="add-patient-container">
      <div className="form-page-header">
        <h2>Add New Patient</h2>
        <p>Fill in the details to create a professional medical record.</p>
      </div>

      <form className="add-patient-form" onSubmit={handleSubmit}>
        <div className="form-sections-wrapper">
          {/* LEFT COLUMN */}
          <div className="form-column">
            {/* Priority Status */}
            <div className="form-card">
              <h3><FiAlertCircle /> Priority Status</h3>
              <div className="form-group critical-checkbox">
                <div className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={formData.isCritical}
                    onChange={(e) => handleChange("isCritical", e.target.checked)}
                    id="isCritical"
                  />
                  <label htmlFor="isCritical">Mark as Critical Case</label>
                </div>
                <small>Helps prioritize appointments and urgent care</small>
              </div>
            </div>

            {/* Clinic Selection */}
            <div className="form-card">
              <h3><FiMapPin /> Clinic Information</h3>
              <div className="form-group">
                <label>Clinic <span className="mandatory">*</span></label>
                <select
                  value={formData.doctorClinicId}
                  onChange={(e) => handleChange("doctorClinicId", e.target.value)}
                  disabled={loadingClinics}
                >
                  <option value="">
                    {loadingClinics ? "Loading clinics..." : "Select clinic"}
                  </option>

                  {clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.clinicName || clinic.hospitalName || clinic.name}
                    </option>
                  ))}

                  <option value="OTHER">Other / Not Specified</option>
                </select>
                {errors.doctorClinicId && (
                  <span className="error-msg">{errors.doctorClinicId}</span>
                )}
              </div>
            </div>

            {/* Personal Details */}
            <div className="form-card">
              <h3><FiUser /> Personal Details</h3>
              <div className="personal-details-grid">
                <div className="form-group name-field">
                  <label>Full Name <span className="mandatory">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={formData.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    required
                  />
                  {errors.fullName && <span className="error-msg">{errors.fullName}</span>}
                </div>

                <div className="form-group age-field">
                  <label>Date of Birth <span className="mandatory">*</span></label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                    required
                    max={new Date().toISOString().split("T")[0]}
                  />
                  {errors.dateOfBirth && (
                    <span className="error-msg">{errors.dateOfBirth}</span>
                  )}
                </div>

                <div className="form-group gender-field">
                  <label>Gender <span className="mandatory">*</span></label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    required
                  >
                    <option value="">Select</option>
                    {GENDER_OPTIONS.map((gender) => (
                      <option key={gender} value={gender}>
                        {gender.charAt(0) + gender.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                  {errors.gender && <span className="error-msg">{errors.gender}</span>}
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="form-card">
              <h3><FiPhone /> Contact Info</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone <span className="mandatory">*</span></label>
                  <input
                    type="tel"
                    placeholder="10-digit number"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    required
                  />
                  {errors.phone && <span className="error-msg">{errors.phone}</span>}
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="patient@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                  {errors.email && <span className="error-msg">{errors.email}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="form-column">
            {/* Emergency Contact */}
            <div className="form-card">
              <h3><FiAlertCircle /> Emergency Contact</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Contact Name</label>
                  <input
                    type="text"
                    placeholder="Name"
                    value={formData.emergencyContactName}
                    onChange={(e) => handleChange("emergencyContactName", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="10-digit phone"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => handleChange("emergencyContactPhone", e.target.value)}
                  />
                  {errors.emergencyContactPhone && (
                    <span className="error-msg">{errors.emergencyContactPhone}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Medical Info */}
            <div className="form-card">
              <h3><FiActivity /> Medical Information</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => handleChange("bloodGroup", e.target.value)}
                  >
                    <option value="">Select</option>
                    {BLOOD_GROUP_OPTIONS.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                  {errors.bloodGroup && (
                    <span className="error-msg">{errors.bloodGroup}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Current Symptoms</label>
                  <input
                    type="text"
                    placeholder="Reason for visit"
                    value={formData.symptoms}
                    onChange={(e) => handleChange("symptoms", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Medical History / Notes</label>
                <textarea
                  placeholder="Past history, observations, old notes..."
                  value={formData.medicalHistory}
                  onChange={(e) => handleChange("medicalHistory", e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Known Allergies</label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin"
                    value={formData.allergies}
                    onChange={(e) => handleChange("allergies", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Chronic Conditions</label>
                  <input
                    type="text"
                    placeholder="Diabetes, Hypertension, etc."
                    value={formData.chronicConditions}
                    onChange={(e) => handleChange("chronicConditions", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Past Surgeries</label>
                  <input
                    type="text"
                    placeholder="Appendix, C-section, etc."
                    value={formData.surgeries}
                    onChange={(e) => handleChange("surgeries", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Medications</label>
                  <input
                    type="text"
                    placeholder="Current medications"
                    value={formData.medications}
                    onChange={(e) => handleChange("medications", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {submitMessage && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: submitMessage.toLowerCase().includes("success")
                ? "#ecfdf5"
                : "#fef2f2",
              color: submitMessage.toLowerCase().includes("success")
                ? "#065f46"
                : "#991b1b",
              border: submitMessage.toLowerCase().includes("success")
                ? "1px solid #a7f3d0"
                : "1px solid #fecaca"
            }}
          >
            {submitMessage}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="save-btn" disabled={saving}>
            <FiClipboard />
            {saving ? "Saving..." : "Save Patient Record"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPatient;