import React, { useState, useEffect } from "react";
import "./AddVisitModal.css"; 

const AddAppointmentModal = ({ onClose, onSave  }) => {
  const [patientName, setPatientName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleSave = () => {
  if (!patientName || !date || !time) return;

 const newAppointment = {
  id: Date.now(),
  date,
  time,
  patientName,   // 🔥 ADD THIS
  status: "Scheduled"
};

  onSave(newAppointment);
  onClose();
};

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Schedule New Appointment</h3>
        </div>
        
        <div className="modal-form">
          <label>Patient Name</label>
          <input
            type="text"
            placeholder="Enter Patient Name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
          />

          <label>Appointment Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <label>Appointment Time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="save-btn" onClick={handleSave}>Save Appointment</button>
        </div>
      </div>
    </div>
  );
};

export default AddAppointmentModal;