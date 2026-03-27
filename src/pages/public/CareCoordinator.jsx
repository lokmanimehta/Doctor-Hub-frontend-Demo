import React from "react";
import { MapPin, Stethoscope, Hotel, PhoneCall, ShieldCheck, Globe, MessageCircle } from "lucide-react";
import "./CareCoordinator.css";

const CareCoordinator = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Request Submitted! Our coordinator will contact you shortly.");
  };

  return (
    <div className="care-container">
      {/* HERO SECTION */}
      <section className="care-hero">
        <div className="badge">Global Patient Support</div>
        <h1>Your Personal Care Coordinator</h1>
        <p>
          Planning treatment in India? From finding top surgeons to booking 
          your recovery stay, we manage your entire medical journey.
        </p>
      </section>

      <div className="care-content-grid">
        {/* LEFT COLUMN */}
        <div className="care-info">
          <div className="info-card">
            <h3><Globe size={20} /> Why Trust Us?</h3>
            <div className="feature-list">
              <div className="feature-item">
                <ShieldCheck className="icon-green" size={18} />
                <span>Verified JCI & NABH Accredited Hospitals.</span>
              </div>
              <div className="feature-item">
                <PhoneCall className="icon-blue" size={18} />
                <span>24/7 Ground Support for Patients & Families.</span>
              </div>
            </div>
          </div>

          <div className="process-steps">
            <h3>Execution Plan</h3>
            <div className="step">
              <div className="step-num">1</div>
              <div>
                <h4>Case Evaluation</h4>
                <p>Submit reports; get expert opinions from 3 top specialists.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <div>
                <h4>Travel & Stay</h4>
                <p>Visa assistance, airport pickup, and sanitized hotel bookings.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <div>
                <h4>In-Hospital Support</h4>
                <p>A dedicated buddy to handle billing and communication.</p>
              </div>
            </div>
          </div>

          {/* NEW: BEYOND MEDICAL SECTION */}
          <div className="extra-benefits">
            <h3>Additional Logistics</h3>
            <div className="benefits-grid">
              <div className="benefit-box">
                <div className="benefit-icon">📱</div>
                <h4>Local SIM</h4>
                <p>Instant connectivity on arrival.</p>
              </div>
              <div className="benefit-box">
                <div className="benefit-icon">💱</div>
                <h4>Forex</h4>
                <p>Easy currency exchange.</p>
              </div>
              <div className="benefit-box">
                <div className="benefit-icon">🗣️</div>
                <h4>Translator</h4>
                <p>Language support (Arabic, French, etc.)</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FORM */}
        <div className="care-form-container">
          <h2>Request Assistance</h2>
          <p>Get a response within 2 working hours.</p>
          <form className="care-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Patient Full Name</label>
              <input type="text" placeholder="John Doe" required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Origin Country</label>
                <input type="text" placeholder="e.g. Bangladesh" required />
              </div>
              <div className="form-group">
                <label>Expected Visit</label>
                <input type="date" required />
              </div>
            </div>
            <div className="form-group">
              <label>Specialty Required</label>
              <select required>
                <option value="">Select Specialty</option>
                <option value="cardio">Cardiology</option>
                <option value="ortho">Orthopedics</option>
                <option value="neuro">Neurology</option>
                <option value="other">General Surgery</option>
              </select>
            </div>
            <div className="form-group">
              <label>WhatsApp / Phone</label>
              <input type="tel" placeholder="+00 000-000-000" required />
            </div>
            <button type="submit" className="btn-submit">
              Confirm Consultation →
            </button>
          </form>
          <div className="whatsapp-notice">
            <MessageCircle size={14} /> Quick connect via WhatsApp available.
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareCoordinator;