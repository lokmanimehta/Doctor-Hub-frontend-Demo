import React, { useState, useMemo, useRef, useEffect } from "react";
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
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [reason, setReason] = useState("");

  // Prevent scroll
  useEffect(() => {
    if (selected) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";

    return () => (document.body.style.overflow = "auto");
  }, [selected]);

  /* Drag Scroll */
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e) => {
    isDown.current = true;
    startX.current = e.pageX - e.currentTarget.offsetLeft;
    scrollLeft.current = e.currentTarget.scrollLeft;
  };

  const handleMouseUpLeave = () => {
    isDown.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDown.current) return;
    const x = e.pageX - e.currentTarget.offsetLeft;
    const walk = (x - startX.current) * 1.2;
    e.currentTarget.scrollLeft = scrollLeft.current - walk;
  };

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
    if (!selectedTime || !patientName) {
      alert("Fill name & time slot");
      return;
    }
    alert("Appointment Booked ✅");
    closeModals();
  };

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

      <div className="doctor-rows">
        {[0, 1].map((row) => (
          <div
            key={row}
            className="doctor-row"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUpLeave}
            onMouseLeave={handleMouseUpLeave}
            onMouseMove={handleMouseMove}
          >
            {filteredDoctors.slice(row * 5, row * 5 + 5).map((doc) => (
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
                  <div className="row">⭐ {doc.rating}</div>
                  <div className="row">📍 {doc.city}</div>
                  <div className="row fee">₹ {doc.feePaid}</div>
                </div>

                <span className="badge">Last: {doc.lastVisitDate}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 🔥 SAME MODAL AS FIND DOCTORS */}
      {selected && (
        <div className="doctor-modal-overlay" onClick={closeModals}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModals}>✕</button>

            <div className="modal-scroll-content">
              {!showBooking ? (
                <>
                  <img src={selected.image} className="modal-doc-img" />
                  <h2>{selected.name}</h2>
                  <p className="spec">{selected.specialty}</p>
                  <p className="about">{selected.about}</p>

                  <div className="modal-meta">
                    <span>🏥 {selected.clinicName}</span>
                    <span>📍 {selected.clinicAddress}</span>
                    <span>⭐ {selected.rating}</span>
                    <span>💰 ₹ {selected.feePaid}</span>
                    <span>⚕️ {selected.complaint}</span>
                  </div>

                  <div className="modal-actions">
                    <button
                      className="primary-btn"
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
                </>
              ) : (
                <>
                  <h2>Book Appointment</h2>

                  <div className="booking-doctor">
                    <img src={selected.image} />
                    <div>
                      <h3>{selected.name}</h3>
                      <p>{selected.clinicName}</p>
                    </div>
                  </div>

                  <div className="booking-section">
                    <p>Select Date</p>
                    {[0,1,2,3,4].map((d)=>(
                      <button
                        key={d}
                        className={`date-chip ${selectedDate===d?"active":""}`}
                        onClick={()=>setSelectedDate(d)}
                      >
                        {new Date().toDateString()}
                      </button>
                    ))}
                  </div>

                  <div className="booking-section">
                    <p>Select Time</p>
                    {TIME_SLOTS.map((t)=>(
                      <button
                        key={t}
                        className={`slot ${selectedTime===t?"active":""}`}
                        onClick={()=>setSelectedTime(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <div className="booking-section">
                    <input placeholder="Name" onChange={(e)=>setPatientName(e.target.value)} />
                    <input
  placeholder="Age"
  value={age}
  onChange={(e) => setAge(e.target.value)}
/>
                   <select
  value={gender}
  onChange={(e) => setGender(e.target.value)}
>
  <option value="">Gender</option>
  <option>Male</option>
  <option>Female</option>
</select>

<textarea
  placeholder="Reason"
  value={reason}
  onChange={(e) => setReason(e.target.value)}
/>
                  </div>

                  <button className="primary-btn confirm-btn" onClick={handleConfirmBooking}>
                    Confirm
                  </button>

                  <button className="secondary-btn confirm-btn" onClick={()=>setShowBooking(false)}>
                    Back
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