import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./FindDoctors.css";
import { DOCTORS } from "../../utils/doctorsDummyprofileData";

const SPECIALTIES = [
  "All", "Physician", "Dermatologist", "Neurologist", "Cardiologist",
  "Dentist", "ENT", "Gynecologist", "Psychiatrist", "Pediatrician"
];

const TIME_SLOTS = [
  "10:00 AM", "10:30 AM", "11:00 AM", "05:00 PM", "05:30 PM", "06:00 PM"
];

export default function FindDoctors() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeSpec, setActiveSpec] = useState("All");
  const [selected, setSelected] = useState(null);
  const [showBooking, setShowBooking] = useState(false);

  // Booking States
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTime, setSelectedTime] = useState("");
  const selectedProfile = JSON.parse(localStorage.getItem("selectedProfile"));
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (selected) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [selected]);


  /* --- Filtering --- */
  const filteredDoctors = useMemo(() => {
    return DOCTORS.filter((d) => {
      const searchText = `${d.name} ${d.specialty} ${d.location} ${d.city} ${d.clinicName}`.toLowerCase();
      return (
        searchText.includes(search.toLowerCase()) &&
        (activeSpec === "All" || d.specialty === activeSpec)
      );
    });
  }, [search, activeSpec]);

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

  const doctorRows = chunkDoctors(filteredDoctors, isMobile ? 5 : 4);


  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="find-doctor-container">
      

      <div className="search-wrapper">
        <input
          className="doctor-search"
          placeholder="Search name, specialty, area..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="specialty-tabs">
        {SPECIALTIES.map((s) => (
          <button
            key={s}
            className={`spec-chip ${activeSpec === s ? "active" : ""}`}
            onClick={() => setActiveSpec(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Doctor Grid */}
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
                  <p className="v3-loc">📍 {doc.location}, {doc.city}</p>
                  <p className="v3-exp">💼 {doc.experience} yrs experience</p>
                  <p className="v3-fee">💰 ₹{doc.fee}</p>

                  <button
                    className="v3-btn secondary"
                    onClick={(e) => {
                      e.stopPropagation(); // 🔥 important
                      setSelected(doc);
                      setShowBooking(true);
                    }}
                  >
                    Book Appointment
                  </button>
                </div>

                {doc.availableToday && (
                  <span className="v3-badge">Available Today</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* --- UNIFIED MODAL SYSTEM --- */}
      {selected && !showBooking && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>

            <button className="modal-close-x" onClick={closeModals}>×</button>

            <div className="modal-header-top">
              <img src={selected.image} className="modal-avatar" />

              <div className="modal-title-info">
                <h2>{selected.name}</h2>
                <span className="modal-spec-badge">{selected.specialty}</span>
                <p>⭐ {selected.rating} ({selected.experience} yrs)</p>
              </div>
            </div>

            <div className="modal-body-content">
              <div className="info-row"><strong>🏥 Clinic:</strong> {selected.clinicName}</div>
              <div className="info-row"><strong>📍 Address:</strong> {selected.clinicAddress}</div>
              <div className="info-row"><strong>🗣 Languages:</strong> {selected.languages?.join(", ")}</div>
              <div className="info-row"><strong>💰 Fee:</strong> ₹{selected.fee}</div>

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
      )}{selected && showBooking && (
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
  )
}

    </div >
  );
}