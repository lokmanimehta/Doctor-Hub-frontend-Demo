import React, { useState, useMemo, useRef, useEffect } from "react";
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
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [reason, setReason] = useState("");

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (selected) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [selected]);

  /* --- Drag Scroll Logic --- */
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e) => {
    isDown.current = true;
    startX.current = e.pageX - e.currentTarget.offsetLeft;
    scrollLeft.current = e.currentTarget.scrollLeft;
    e.currentTarget.classList.add("dragging");
  };

  const handleMouseUpLeave = (e) => {
    isDown.current = false;
    e.currentTarget.classList.remove("dragging");
  };

  const handleMouseMove = (e) => {
    if (!isDown.current) return;
    e.preventDefault();
    const x = e.pageX - e.currentTarget.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    e.currentTarget.scrollLeft = scrollLeft.current - walk;
  };

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
    if (!selectedTime || !patientName) {
      alert("Please fill in the patient name and select a time slot.");
      return;
    }
    alert("Appointment Booked Successfully! ✅");
    closeModals();
  };

  return (
    <div className="find-doctor-container">
      <h1>Find Doctors</h1>

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

      <div className="doctor-rows">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="doctor-row"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUpLeave}
            onMouseLeave={handleMouseUpLeave}
            onMouseMove={handleMouseMove}
          >
            {filteredDoctors.slice(row * 8, row * 8 + 8).map((doc) => (
              <div
                key={doc.id}
                className="doctor-card"
                onClick={() => setSelected(doc)}
              >
                <div className="card-left">
                  <img src={doc.image} alt={doc.name} />
                </div>
                <div className="card-right">
                  <h3 className="doc-name">{doc.name}</h3>
                  <p className="spec">{doc.specialty}</p>
                  <div className="row">⭐ {doc.rating} • {doc.experience} yrs</div>
                  <div className="row">📍 {doc.location}, {doc.city}</div>
                  <div className="row fee">₹ {doc.fee}</div>
                </div>
                {doc.availableToday && <span className="badge">Today</span>}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* --- UNIFIED MODAL SYSTEM --- */}
      {selected && (
        <div className="doctor-modal-overlay" onClick={closeModals}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModals}>✕</button>
            
            <div className="modal-scroll-content">
              {!showBooking ? (
                /* Profile View */
                <>
                  <img src={selected.image} alt={selected.name} className="modal-doc-img" />
                  <h2>{selected.name}</h2>
                  <p className="spec">{selected.specialty}</p>
                  <p className="about">{selected.about}</p>

                  <div className="modal-meta">
                    <span>🏥 <b>Clinic:</b> {selected.clinicName}</span>
                    <span>📍 <b>Address:</b> {selected.clinicAddress}</span>
                    <span>🗣 <b>Languages:</b> {selected.languages?.join(", ")}</span>
                    <span>⭐ <b>Rating:</b> {selected.rating} ({selected.experience} yrs exp)</span>
                    <span>💰 <b>Fee:</b> ₹ {selected.fee}</span>
                  </div>

                  <div className="modal-actions">
                    <button className="primary-btn" onClick={() => setShowBooking(true)}>
                      Book Appointment
                    </button>
                    <button className="secondary-btn" onClick={() => navigate(`/patient/doctorsprofile/${selected.id}`)}>
                      Full Profile
                    </button>
                  </div>
                </>
              ) : (
                /* Booking View */
                <>
                  <h2>Book Appointment</h2>
                  <div className="booking-doctor">
                    <img src={selected.image} alt={selected.name} />
                    <div>
                      <h3 style={{margin:0}}>{selected.name}</h3>
                      <p style={{margin:0, fontSize:'13px', color:'var(--text-muted)'}}>{selected.clinicName}</p>
                    </div>
                  </div>

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

                  <div className="booking-section">
                    <p>Patient Information</p>
                    <input placeholder="Full Name" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
                    <div style={{display:'flex', gap:'10px'}}>
                      <input placeholder="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
                      <select value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="">Gender</option>
                        <option>Male</option>
                        <option>Female</option>
                      </select>
                    </div>
                    <textarea placeholder="Reason / Symptoms" value={reason} onChange={(e) => setReason(e.target.value)} />
                  </div>

                  <button className="primary-btn confirm-btn" onClick={handleConfirmBooking}>
                    Confirm Appointment
                  </button>
                  <button className="secondary-btn confirm-btn" onClick={() => setShowBooking(false)} style={{marginTop:'8px'}}>
                    Go Back
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}