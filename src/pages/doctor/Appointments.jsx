
import React, { useState } from "react";
import "./Appointments.css";
import AddAppointmentModal from "./AddAppointmentModal";

const Appointments = () => {
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [appointmentsData, setAppointmentsData] = useState([
    {
      id: 1,
      patient_name: "Rahul Sharma",
      hospital: "City Care Clinic",
      city: "Pune",
      date: "2026-03-20",
      slot: "10:00 AM",
      complaint: "Fever & Cold",
      is_critical: false,
      status: "PENDING",
    },
    {
      id: 2,
      patient_name: "Anita Verma",
      hospital: "Ortho Plus Hospital",
      city: "Mumbai",
      date: "2026-03-21",
      slot: "11:30 AM",
      complaint: "Back Pain",
      is_critical: true,
      status: "APPROVED",
    },
    {
      id: 3,
      patient_name: "Sunil Gupta",
      hospital: "Heart Care Center",
      city: "Delhi",
      date: "2026-03-18",
      slot: "01:00 PM",
      complaint: "Chest Pain",
      is_critical: false,
      status: "REJECTED",
    },
  ]);

  const handleStatusChange = (id, newStatus) => {
    const updated = appointmentsData.map((app) =>
      app.id === id ? { ...app, status: newStatus } : app
    );
    setAppointmentsData(updated);
  };

  const handleView = (appointment) => {
    setSelectedAppointment(appointment);
  };

  const closeViewModal = () => {
    setSelectedAppointment(null);
  };

  const filteredAppointments =
    filterStatus === "ALL"
      ? appointmentsData
      : appointmentsData.filter((app) => app.status === filterStatus);

  return (
    <div className="appointments-page-wrapper">
      <div className="page-header-flex">
        <h2 className="appointments-title">All Appointments</h2>
        {/* New Appointment button removed */}
      </div>

      {/* FILTER BUTTONS WITH COUNT */}
      <div className="filter-container">
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((status) => {
          const count =
            status === "ALL"
              ? appointmentsData.length
              : appointmentsData.filter((app) => app.status === status).length;
          return (
            <button
              key={status}
              className={`filter-btn ${filterStatus === status ? "active-filter" : ""}`}
              onClick={() => setFilterStatus(status)}
            >
              {status} ({count})
            </button>
          );
        })}
      </div>

      {/* DESKTOP TABLE */}
      <div className="desktop-view-container">
        <table className="modern-doctor-table">
          <thead>
            <tr>
              <th>PATIENT NAME</th>
              <th>HOSPITAL</th>
              <th>CITY</th>
              <th>DATE</th>
              <th>SLOT</th>
              <th>CURRENT STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.map((app) => (
              <tr key={app.id}>
                <td className="patient-cell">{app.patient_name}</td>
                <td>{app.hospital}</td>
                <td>{app.city}</td>
                <td>{app.date}</td>
                <td>
                  <span className="time-tag">{app.slot}</span>
                </td>
                <td>
                  <span className={`status-pill ${app.status.toLowerCase()}`}>
                    {app.status}
                  </span>
                </td>
                <td className="actions-cell">
                  <button className="" onClick={() => handleView(app)}>
                    👁️‍🗨️
                  </button>
                  <button
                    className="btn-approve"
                    disabled={app.status === "APPROVED"}
                    onClick={() => handleStatusChange(app.id, "APPROVED")}
                  >
                    ✔️
                  </button>
                  <button
                    className="btn-reject"
                    disabled={app.status === "REJECTED"}
                    onClick={() => handleStatusChange(app.id, "REJECTED")}
                  >
                    ✖️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE VIEW */}
      <div className="mobile-view-container">
        {filteredAppointments.map((app) => (
          <div key={app.id} className="appointment-card-mobile">
            <div className="card-top">
              <div className="card-user-info">
                <h4>{app.patient_name}</h4>
                <p>{app.hospital}, {app.city}</p>
                <p>
                  {app.date} | <span className="time-tag">{app.slot}</span>
                </p>
              </div>
              <span className={`status-pill ${app.status.toLowerCase()}`}>
                {app.status}
              </span>
            </div>

            <div className="card-footer-btns">
              <button className="m-btn view" onClick={() => handleView(app)}>
                View Details
              </button>

              <div className="m-action-row">
                <button
                  className="m-btn approve"
                  disabled={app.status === "APPROVED"}
                  onClick={() => handleStatusChange(app.id, "APPROVED")}
                >
                  Approve
                </button>

                <button
                  className="m-btn reject"
                  disabled={app.status === "REJECTED"}
                  onClick={() => handleStatusChange(app.id, "REJECTED")}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* VIEW MODAL */}
      {selectedAppointment && (
        <div className="view-modal-overlay" onClick={closeViewModal}>
          <div className="view-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Appointment Details</h3>
            <p><strong>Patient:</strong> {selectedAppointment.patient_name}</p>
            <p><strong>Hospital:</strong> {selectedAppointment.hospital}</p>
            <p><strong>City:</strong> {selectedAppointment.city}</p>
            <p><strong>Date:</strong> {selectedAppointment.date}</p>
            <p><strong>Slot:</strong> {selectedAppointment.slot}</p>
            <p><strong>Complaint:</strong></p>
            <div className="complaint-box">{selectedAppointment.complaint}</div>
            <p>
              <strong>Critical:</strong>{" "}
              <span style={{ color: selectedAppointment.is_critical ? "red" : "green" }}>
                {selectedAppointment.is_critical ? "Yes" : "No"}
              </span>
            </p>
            <button className="btn-reject" onClick={closeViewModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
