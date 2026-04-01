import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MyDoctors.css";
import { DOCTORS } from "../../utils/doctorsDummyprofileData";

const TIME_SLOTS = [
  "10:00 AM", "10:30 AM", "11:00 AM",
  "05:00 PM", "05:30 PM", "06:00 PM"
];

// Dummy recent visits
const RECENT_VISITS = DOCTORS.slice(0, 10).map((doc, i) => ({
  ...doc,
  lastVisitDate: `2026-02-${10 + (i % 15)}`,
  feePaid: doc.fee,
  complaint: ["Headache", "Fever", "Back Pain", "Chest Pain"][i % 4],
}));

export default function MyDoctors() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showBooking, setShowBooking] = useState(false);

  // Booking states
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTime, setSelectedTime] = useState("");
  const selectedProfile = JSON.parse(localStorage.getItem("selectedProfile"));

  // Prevent scroll
  useEffect(() => {
    if (selected) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";

    return () => (document.body.style.overflow = "auto");
  }, [selected]);

  /* Drag Scroll */


  const filteredDoctors = useMemo(() => {
    return RECENT_VISITS.filter((d) => {
      const text = `${d.name} ${d.specialty} ${d.city} ${d.complaint}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [search]);

  const closeModals = () => {
    setSelected(null);
    setShowBooking(false);
  };

  const handleConfirmBooking = () => {

    // ✅ STEP 1: Profile check
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

    // ✅ STEP 3: Proper date
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() + selectedDate);

    // ✅ STEP 4: Create booking
    const booking = {
      doctorId: selected.id,
      doctorName: selected.name,
      patientId: selectedProfile.id,
      patientName: selectedProfile.fullName,
      relation: selectedProfile.relation,
      time: selectedTime,
      date: dateObj.toISOString(),
    };

    // ✅ STEP 5: Get existing bookings
    const existing = JSON.parse(localStorage.getItem("appointments")) || [];

    // ✅ STEP 6: Duplicate check
    const alreadyBooked = existing.some(
      (a) =>
        a.doctorId === booking.doctorId &&
        a.time === booking.time &&
        a.date === booking.date
    );

    if (alreadyBooked) {
      alert("Slot already booked ❌");
      return;
    }

    // ✅ STEP 7: Save
    localStorage.setItem("appointments", JSON.stringify([...existing, booking]));

    alert("Appointment Booked ✅");

    // ✅ STEP 8: Reset
    setSelectedTime("");
    setSelectedDate(0);

    closeModals();
  };
  const chunkDoctors = (arr, size) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

  const doctorRows = chunkDoctors(filteredDoctors, 4);
  return (
    <div className="find-doctor-container">
      <h1>My Doctors</h1>

      <div className="search-wrapper">
        <input
          className="doctor-search"
          placeholder="Search doctor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="doctor-grid">
        {doctorRows.map((row, index) => (
          <div className="doctor-row" key={index}>
            {row.map((doc) => (
              <div
                key={doc.id}
                className="premium-v3-card"
                onClick={() => setSelected(doc)}
              >
                <div className="v3-card-top">
                  <img src={doc.image} alt={doc.name} />
                  <div className="v3-rating">⭐ {doc.rating}</div>
                </div>

                <div className="v3-card-body">
                  <h3>{doc.name}</h3>
                  <p className="v3-spec">{doc.specialty}</p>
                  <p className="v3-loc">📍 {doc.city}</p>
                  <p className="v3-exp">💼 {doc.experience} yrs</p>
                  <p className="v3-fee">💰 ₹{doc.feePaid}</p>

                  <button
                    className="v3-btn secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(doc);
                      setShowBooking(true);
                    }}
                  >
                    Book Again
                  </button>
                </div>

                <span className="v3-badge">
                  Last Visit: {doc.lastVisitDate}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 🔥 SAME MODAL AS FIND DOCTORS */}
      {selected && !showBooking && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>

            <button className="modal-close-x" onClick={closeModals}>×</button>

            <div className="modal-header-top">
              <img src={selected.image} className="modal-avatar" />

              <div className="modal-title-info">
                <h2>{selected.name}</h2>
                <span className="modal-spec-badge">{selected.specialty}</span>
                <p>⭐ {selected.rating}</p>
              </div>
            </div>

            <div className="modal-body-content">
              <div className="info-row"><strong>📍 Clinic:</strong> {selected.clinicName}</div>
              <div className="info-row"><strong>📍 Address:</strong> {selected.clinicAddress}</div>
              <div className="info-row"><strong>💼 Experience:</strong> {selected.experience} yrs</div>
              <div className="info-row"><strong>💰 Fee:</strong> ₹{selected.feePaid}</div>
              <div className="info-row"><strong>⚕️ Last Issue:</strong> {selected.complaint}</div>

              <div className="modal-bio-box">
                <strong>About Doctor:</strong>
                <p>{selected.about}</p>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="primary-modal-btn"
                onClick={() => setShowBooking(true)}
              >
                Book Appointment
              </button>

              <button
                className="secondary-btn"
                onClick={() =>
                  navigate(`/patient/doctorsprofile/${selected.id}`)
                }
              >
                Full Profile
              </button>
            </div>

          </div>
        </div>
      )} {selected && showBooking && (
        <div className="booking-modal-overlay" onClick={() => setShowBooking(false)}>
          <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>

            <button className="modal-close" onClick={() => setShowBooking(false)}>✕</button>

            <div className="booking-scroll">

              <h2>Book Appointment</h2>

              <div className="booking-doctor">
                <img src={selected.image} />
                <div>
                  <h3>{selected.name}</h3>
                  <p>{selected.clinicName}</p>
                </div>
              </div>

              {/* DATE */}
              <div className="booking-section">
                <p>Select Date</p>
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

              {/* TIME */}
              <div className="booking-section">
                <p>Select Time</p>
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

              <button className="primary-btn confirm-btn" onClick={handleConfirmBooking}>
                Confirm Appointment
              </button>

              <button
                className="secondary-btn confirm-btn"
                onClick={() => setShowBooking(false)}
              >
                Go Back
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}