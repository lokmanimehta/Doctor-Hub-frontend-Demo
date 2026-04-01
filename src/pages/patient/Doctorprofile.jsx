import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DOCTORS } from "../../utils/doctorsDummyprofileData";
import "./Doctorprofile.css";
import { useLocation } from "react-router-dom";

const TIME_SLOTS = [
  "10:00 AM", "10:30 AM", "11:00 AM",
  "05:00 PM", "05:30 PM", "06:00 PM"
];

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const doctorFromState = location.state;
  const [showBooking, setShowBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTime, setSelectedTime] = useState("");
  const selectedProfile = JSON.parse(localStorage.getItem("selectedProfile")) || null;
  const bookingDate = new Date();
  bookingDate.setDate(bookingDate.getDate() + selectedDate);
  const doctor = doctorFromState || DOCTORS.find((d) => d.id === Number(id));

  if (!doctor) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Doctor not found</h2>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="doctor-profile-page">

      {/* HERO */}
      <div className="profile-hero">
        <img src={doctor.image || doctor.profileImage} alt={doctor.name} />

        <div className="hero-info">
          <h1>{doctor.name}</h1>
          <p className="degree">{doctor.degree}</p>
          <p className="spec">{doctor.specialty}</p>

          <div className="hero-meta">
            ⭐ {doctor.rating} ({doctor.reviews} reviews)
            <span>• {doctor.experience} yrs</span>
          </div>

          <p className="clinic">
            🏥 {doctor.clinicName}, {doctor.city}
          </p>

          <button
            className="book-btn"
            onClick={() => {
              if (!selectedProfile) {
                alert("Please select patient profile first");
                navigate("/patient/profile");
                return;
              }
              setShowBooking(true);
            }}
          >
            Book Appointment • ₹{doctor.fee}
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="profile-content">
        <section className="profile-section">
          <h2>About Doctor</h2>
          <p>{doctor.about}</p>
        </section>

        <section className="profile-section">
          <h2>Clinic & Location</h2>
          <div className="clinic-card">
            <strong>{doctor.clinicName}</strong>
            <p>{doctor.clinicAddress}</p>
            <p>{doctor.city}</p>
          </div>
        </section>

        <section className="profile-section grid">
          <div>
            <span>Consultation Fee</span>
            <strong>₹ {doctor.fee}</strong>
          </div>
          <div>
            <span>Languages</span>
            <strong>{doctor.languages?.join(", ") || "Not Available"}</strong>
          </div>
          <div>
            <span>Registration No</span>
            <strong>{doctor.registrationNo}</strong>
          </div>
          <div>
            <span>Availability</span>
            <strong>{doctor.availability}</strong>
          </div>
        </section>

        <section className="profile-section">
          <h2>Conditions Treated</h2>
          <div className="symptoms">
            {doctor.symptoms?.length > 0 ? (
              doctor.symptoms.map((s, i) => (
                <span key={i}>{s}</span>
              ))
            ) : (
              <p>No data available</p>
            )}
          </div>
        </section>

        <div className="profile-actions">
          <button
            className="primary-btn"
            onClick={() => {
              if (!selectedProfile) {
                alert("Please select patient profile first");
                navigate("/patient/profile");
                return;
              }

              setShowBooking(true);
            }}
          >
            Book Appointment
          </button>

          <button
            className="secondary-btn"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* 🔥 BOOKING MODAL */}
      {showBooking && (
        <div
          className="doctor-modal-overlay"
          onClick={() => setShowBooking(false)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowBooking(false)}
            >
              ✕
            </button>

            <div className="modal-scroll-content">

              <h2>Book Appointment</h2>

              <div className="booking-doctor">
                <img src={doctor.image} alt={doctor.name} />
                <div>
                  <h3>{doctor.name}</h3>
                  <p>{doctor.clinicName}</p>
                </div>
              </div>

              {/* DATE */}
              <div className="booking-section">
                <p>Select Date</p>
                <div className="date-list">
                  {[0, 1, 2, 3, 4].map((d) => {
                    const date = new Date();
                    date.setDate(date.getDate() + d);

                    return (
                      <button
                        key={d}
                        className={`date-chip ${selectedDate === d ? "active" : ""}`}
                        onClick={() => setSelectedDate(d)}
                      >
                        {date.toDateString().slice(0, 10)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TIME */}
              <div className="booking-section">
                <p>Select Time Slot</p>
                <div className="slot-list">
                  {TIME_SLOTS.map((t) => (
                    <button
                      key={t}
                      className={`slot ${selectedTime === t ? "active" : ""}`}
                      onClick={() => setSelectedTime(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* FORM */}
               <div className="booking-section">
                <p className="section-label">Patient Info</p>

                {selectedProfile ? (
                  <div className="selected-patient-card">
                    <h4>{selectedProfile.fullName}</h4>
                    <p>
                      {selectedProfile.relation} • {selectedProfile.age || "N/A"} yrs • {selectedProfile.gender}
                    </p>
                  </div>
                ) : (
                  <div className="selected-patient-card" style={{ borderColor: '#fee2e2' }}>
                    <p style={{ color: "#ef4444", margin: 0 }}>No profile selected</p>
                  </div>
                )}
              </div>

              <button
                className="primary-btn confirm-btn"
                onClick={() => {

                  // ✅ STEP 1: Profile check (FIRST)
                  if (!selectedProfile) {
                    alert("Please select patient profile first");
                    navigate("/patient/profile");
                    return;
                  }

                  // ✅ STEP 2: Time check
                  if (!selectedTime) {
                    alert("Please select time slot");
                    return;
                  }

                  // ✅ STEP 3: Create booking
                  const booking = {
                    doctorId: doctor.id,
                    doctorName: doctor.name,
                    patientId: selectedProfile.id,
                    patientName: selectedProfile.fullName,
                    relation: selectedProfile.relation,
                    time: selectedTime,
                    date: bookingDate.toDateString(),
                  };

                  const existing = JSON.parse(localStorage.getItem("appointments")) || [];

                  localStorage.setItem("appointments", JSON.stringify([...existing, booking]));

                  alert("Appointment Booked ✅");
                  setShowBooking(false);
                }}
              >
                Confirm Appointment
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}