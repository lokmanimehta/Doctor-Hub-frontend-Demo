import React, { useState } from "react";
import {
  CalendarDays,
  CheckCircle,
  Globe,
  Hotel,
  Languages,
  MapPin,
  MessageCircle,
  PhoneCall,
  Plane,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import api from "../../services/api";
import "./CareCoordinator.css";
import { useNavigate } from "react-router-dom";
const CareCoordinator = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    patientFullName: "",
    originCountry: "",
    originCity: "",
    expectedVisitDate: "",
    specialtyRequired: "",
    whatsappOrPhone: "",
    email: "",
    treatmentDescription: "",
    needsStaySupport: false,
    needsTravelSupport: false,
    needsTranslator: false,
    budgetRange: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    setSuccessMessage("");
    setErrorMessage("");
  };

  const convertDateToTimestamp = (dateValue) => {
    if (!dateValue) return null;

    const selectedDate = new Date(`${dateValue}T00:00:00`);
    return selectedDate.getTime();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setSuccessMessage("");
      setErrorMessage("");

      await api.post("/public/care-coordinator-requests", {
        patientFullName: formData.patientFullName.trim(),
        originCountry: formData.originCountry.trim(),
        originCity: formData.originCity.trim(),
        expectedVisitDate: convertDateToTimestamp(formData.expectedVisitDate),
        specialtyRequired: formData.specialtyRequired,
        whatsappOrPhone: formData.whatsappOrPhone.trim(),
        email: formData.email.trim() || null,
        treatmentDescription: formData.treatmentDescription.trim() || null,
        needsStaySupport: formData.needsStaySupport,
        needsTravelSupport: formData.needsTravelSupport,
        needsTranslator: formData.needsTranslator,
        budgetRange: formData.budgetRange || null,
      });

      setSuccessMessage(
        "Request submitted successfully. Our care team will contact you soon."
      );

      setFormData({
        patientFullName: "",
        originCountry: "",
        originCity: "",
        expectedVisitDate: "",
        specialtyRequired: "",
        whatsappOrPhone: "",
        email: "",
        treatmentDescription: "",
        needsStaySupport: false,
        needsTravelSupport: false,
        needsTranslator: false,
        budgetRange: "",
      });
    } catch (error) {
      setErrorMessage(error?.message || "Unable to submit request right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="care-page">
      <section className="care-hero">
        <button
          type="button"
          className="care-back-btn"
          onClick={() => navigate("/all-services")}
        >
          ← Back to Services
        </button>
        <div className="care-hero-inner">
          <span className="care-badge">Premium Patient Support</span>

          <h1>Your Personal Care Coordinator</h1>

          <p>
            Planning treatment in Mumbai or another city? Our coordinator helps
            with hospital options, doctor appointments, travel support, stay
            planning, and on-ground assistance.
          </p>

          <div className="care-hero-stats">
            <div>
              <strong>2 hrs</strong>
              <span>Response target</span>
            </div>
            <div>
              <strong>3+</strong>
              <span>Hospital options</span>
            </div>
            <div>
              <strong>360°</strong>
              <span>Patient journey help</span>
            </div>
          </div>
        </div>
      </section>

      <section className="care-main-section">
        <div className="care-layout">
          <div className="care-left">
            <div className="care-card care-trust-card">
              <div className="care-section-title">
                <span>Why patients choose this</span>
                <h2>One coordinator for the full treatment journey.</h2>
              </div>

              <div className="care-feature-list">
                <div className="care-feature-item">
                  <div className="care-feature-icon green">
                    <ShieldCheck size={21} />
                  </div>
                  <div>
                    <h3>Verified hospital guidance</h3>
                    <p>
                      We help shortlist suitable hospitals and specialists based
                      on treatment requirement, city preference, and budget.
                    </p>
                  </div>
                </div>

                <div className="care-feature-item">
                  <div className="care-feature-icon blue">
                    <PhoneCall size={21} />
                  </div>
                  <div>
                    <h3>Call and WhatsApp coordination</h3>
                    <p>
                      A care coordinator contacts the patient or family to
                      understand reports, travel timeline, and required support.
                    </p>
                  </div>
                </div>

                <div className="care-feature-item">
                  <div className="care-feature-icon purple">
                    <Globe size={21} />
                  </div>
                  <div>
                    <h3>Outstation and international support</h3>
                    <p>
                      Useful for patients coming from another state, city, or
                      country for planned treatment.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="care-process-card">
              <div className="care-section-title">
                <span>Execution plan</span>
                <h2>How the coordinator helps.</h2>
              </div>

              <div className="care-steps">
                <div className="care-step">
                  <div className="care-step-number">1</div>
                  <div>
                    <h3>Case review</h3>
                    <p>
                      Patient shares treatment need, location, expected visit
                      date, and available medical reports.
                    </p>
                  </div>
                </div>

                <div className="care-step">
                  <div className="care-step-number">2</div>
                  <div>
                    <h3>Hospital and doctor options</h3>
                    <p>
                      Coordinator prepares suitable options and helps patient
                      compare treatment path, availability, and estimated cost.
                    </p>
                  </div>
                </div>

                <div className="care-step">
                  <div className="care-step-number">3</div>
                  <div>
                    <h3>Travel, stay, and hospital support</h3>
                    <p>
                      If required, the team assists with stay planning, local
                      travel, translator support, and appointment coordination.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="care-benefits">
              <h2>Additional logistics</h2>

              <div className="care-benefits-grid">
                <div className="care-benefit-box">
                  <div className="care-benefit-icon">
                    <Plane size={22} />
                  </div>
                  <h3>Travel help</h3>
                  <p>Airport pickup and local transport guidance.</p>
                </div>

                <div className="care-benefit-box">
                  <div className="care-benefit-icon">
                    <Hotel size={22} />
                  </div>
                  <h3>Stay support</h3>
                  <p>Nearby hotel or recovery stay suggestions.</p>
                </div>

                <div className="care-benefit-box">
                  <div className="care-benefit-icon">
                    <Languages size={22} />
                  </div>
                  <h3>Translator</h3>
                  <p>Language support for patient and family.</p>
                </div>

                <div className="care-benefit-box">
                  <div className="care-benefit-icon">
                    <MapPin size={22} />
                  </div>
                  <h3>Local guidance</h3>
                  <p>City, hospital, and appointment coordination.</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="care-form-card">
            <div className="care-form-header">
              <span>Request assistance</span>
              <h2>Tell us what support you need.</h2>
              <p>Submit your details. Our coordinator will review and contact you.</p>
            </div>

            <form className="care-form" onSubmit={handleSubmit}>
              <div className="care-form-group">
                <label>Patient Full Name</label>
                <input
                  type="text"
                  name="patientFullName"
                  placeholder="Enter Full Name "
                  value={formData.patientFullName}
                  onChange={handleChange}
                  required
                  minLength={2}
                  maxLength={120}
                />
              </div>

              <div className="care-form-row">
                <div className="care-form-group">
                  <label>Origin Country / State</label>
                  <input
                    type="text"
                    name="originCountry"
                    placeholder="India, Nepal, UAE..."
                    value={formData.originCountry}
                    onChange={handleChange}
                    required
                    maxLength={100}
                  />
                </div>

                <div className="care-form-group">
                  <label>Origin City</label>
                  <input
                    type="text"
                    name="originCity"
                    placeholder="Mumbai, Gujrat, Punjab..."
                    value={formData.originCity}
                    onChange={handleChange}
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="care-form-row">
                <div className="care-form-group">
                  <label>Expected Visit Date</label>
                  <input
                    type="date"
                    name="expectedVisitDate"
                    value={formData.expectedVisitDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="care-form-group">
                  <label>Specialty Required</label>
                  <select
                    name="specialtyRequired"
                    value={formData.specialtyRequired}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Specialty</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Oncology">Oncology</option>
                    <option value="General Surgery">General Surgery</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="care-form-group">
                <label>WhatsApp / Phone</label>
                <input
                  type="tel"
                  name="whatsappOrPhone"
                  placeholder="+91 **********"
                  value={formData.whatsappOrPhone}
                  onChange={handleChange}
                  required
                  minLength={8}
                  maxLength={30}
                />
              </div>

              <div className="care-form-group">
                <label>Email Address Optional</label>
                <input
                  type="email"
                  name="email"
                  placeholder="patient@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  maxLength={160}
                />
              </div>

              <div className="care-form-group">
                <label>Treatment Requirement</label>
                <textarea
                  name="treatmentDescription"
                  placeholder="Tell us about the treatment need, diagnosis, reports available, preferred city, or hospital preference."
                  value={formData.treatmentDescription}
                  onChange={handleChange}
                  maxLength={3000}
                  rows="4"
                />
              </div>

              <div className="care-form-group">
                <label>Budget Range Optional</label>
                <select
                  name="budgetRange"
                  value={formData.budgetRange}
                  onChange={handleChange}
                >
                  <option value="">Select budget range</option>
                  <option value="Below ₹1L">Below ₹1L</option>
                  <option value="₹1L - ₹3L">₹1L - ₹3L</option>
                  <option value="₹3L - ₹5L">₹3L - ₹5L</option>
                  <option value="₹5L - ₹10L">₹5L - ₹10L</option>
                  <option value="Above ₹10L">Above ₹10L</option>
                  <option value="Need estimate first">Need estimate first</option>
                </select>
              </div>

              <div className="care-support-options">
                <label className="care-checkbox">
                  <input
                    type="checkbox"
                    name="needsTravelSupport"
                    checked={formData.needsTravelSupport}
                    onChange={handleChange}
                  />
                  <span>
                    <Plane size={16} />
                    Travel support
                  </span>
                </label>

                <label className="care-checkbox">
                  <input
                    type="checkbox"
                    name="needsStaySupport"
                    checked={formData.needsStaySupport}
                    onChange={handleChange}
                  />
                  <span>
                    <Hotel size={16} />
                    Stay support
                  </span>
                </label>

                <label className="care-checkbox">
                  <input
                    type="checkbox"
                    name="needsTranslator"
                    checked={formData.needsTranslator}
                    onChange={handleChange}
                  />
                  <span>
                    <Languages size={16} />
                    Translator
                  </span>
                </label>
              </div>

              {successMessage && (
                <div className="care-alert success">
                  <CheckCircle size={18} />
                  {successMessage}
                </div>
              )}

              {errorMessage && <div className="care-alert error">{errorMessage}</div>}

              <button type="submit" className="care-submit-btn" disabled={submitting}>
                {submitting ? "Submitting..." : "Confirm Consultation"}
                <Stethoscope size={17} />
              </button>
            </form>

            <div className="care-whatsapp-note">
              <MessageCircle size={15} />
              Quick connect via WhatsApp available after request review.
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default CareCoordinator;