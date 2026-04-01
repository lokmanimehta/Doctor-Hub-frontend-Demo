
import React, { useState } from "react";
import "./PatientDetails.css";
import AddVisitModal from "./AddVisitModal";
import AddPrescriptionModal from "./AddPrescriptionModal";
import AddReportModal from "./AddReportModal";
import { useParams, useNavigate } from "react-router-dom";
import AddAppointmentModal from "./AddAppointmentModal";
import { useEffect } from "react";
import {
  getPatientById,
  getPatientPrescriptions
} from "../../services/doctorService";
const PatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate(); 

  

  const [activeTab, setActiveTab] = useState("visits");
  
  const [showVisitModal, setShowVisitModal] = useState(false);
const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
const [showReportModal, setShowReportModal] = useState(false);
const [showAppointment, setShowAppointment] = useState(false);
  
  const [openVisitId, setOpenVisitId] = useState(null);
const [openPrescriptionId, setOpenPrescriptionId] = useState(null);
const [openReportId, setOpenReportId] = useState(null);
const [openAppointmentId, setOpenAppointmentId] = useState(null);
const [editingPrescription, setEditingPrescription] = useState(null);
  const [visits, setVisits] = useState([
  { id: 1, date: "10 Jan 2026", complaint: "Fever", notes: "Paracetamol advised" }
]);

const [reports,setReports] = useState([
  { id: 1, date: "11 Jan 2026", name: "Blood Test Report" }
]);

const [appointments, setAppointments]  = useState([
  { id: 1, date: "10 Jan 2026", time: "10:00 AM", status: "Completed" }
]);
  
 const [patient, setPatient] = useState(null);
const [prescriptions, setPrescriptions] = useState([]);
useEffect(() => {
  const loadData = async () => {
    const p = await getPatientById(patientId);
    const pres = await getPatientPrescriptions(patientId);

    setPatient(p);
    setPrescriptions(pres);
  };

  loadData();
}, [patientId]);

if (!patient) return <div className="loading">Loading patient data...</div>;
const handleAddPrescription = (newPrescription, isEdit = false) => {
  if (isEdit) {
    setPrescriptions((prev) =>
      prev.map((p) =>
        p.id === newPrescription.id ? newPrescription : p
      )
    );
  } else {
    setPrescriptions((prev) => [newPrescription, ...prev]);
  }
};
const handleEditPrescription = (prescription) => {
  setEditingPrescription(prescription);
  setShowPrescriptionModal(true);
};


const handleAddVisit = (newVisit) => {
  setVisits((prev) => [newVisit, ...prev]);
};

const handleAddReports = (newReports) => {
  setReports((prev) => [newReports, ...prev]);
};
const handleAddAppointment = (newAppointment) => {
  setAppointments((prev) => [newAppointment, ...prev]);
};
  return (
    <div className="patient-details-page">
      {/* TOP HEADER WITH BACK BUTTON */}
      <div className="details-top-nav">
        <button className="back-link-btn" onClick={() => navigate("/doctor/patients")}>
            ← Back to Patients
        </button>
      </div>

      <div className="details-main-container">
        {/* LEFT SUMMARY SIDEBAR */}
        <div className="patient-summary">
          <div className="avatar">
            {patient.full_name.split(" ").map((n) => n[0]).join("")}
          </div>
          <h3>{patient.full_name}</h3>
          
          <div className="patient-info-list">
            <div className="info-item">
              <span className="info-label">Patient ID</span>
              <span className="info-value">{patient.id}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Age</span>
              <span className="info-value">{patient.age} Yrs</span>
            </div>
            <div className="info-item">
              <span className="info-label">Gender</span>
              <span className="info-value">{patient.gender}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Phone</span>
              <span className="info-value">{patient.phone || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* RIGHT RECORDS SECTION */}
        <div className="patient-records">
          <div className="patient-tabs">
            {["visits", "prescriptions", "reports", "appointments"].map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? "active" : ""}
                onClick={() => setActiveTab(tab)}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {/* --- VISITS TAB --- */}
            {activeTab === "visits" && (
              <>
                <div className="tab-header">
                  <h3>Visit History</h3>
                  <button className="add-btn" onClick={() => setShowVisitModal(true)}>
                    + Add New Visit
                  </button>
                </div>
                {visits.map((v) => (
  <div
    key={v.id}
    className="record-card"
   onClick={() =>
  setOpenVisitId(openVisitId === v.id ? null : v.id)
}
  >
    <span className="record-date">{v.date}</span>
    <p><strong>Complaint:</strong> {v.complaint}</p>

    {openVisitId === v.id  && (
      <p><strong>Notes:</strong> {v.notes}</p>
    )}
  </div>
))}
              </>
            )}

            {/* --- PRESCRIPTIONS TAB --- */}
            {activeTab === "prescriptions" && (
              <>
                <div className="tab-header">
                  <h3>Active Prescriptions</h3>
                  <button className="add-btn" onClick={() => setShowPrescriptionModal(true)}>
                    + New Prescription
                  </button>
                </div>
                
               {prescriptions.map((p) => (
  <div
    key={p.id}
    className="record-card"
    onClick={() =>
  setOpenPrescriptionId(openPrescriptionId === p.id ? null : p.id)
}
  >
    <span className="record-date">{p.date}</span>
    <p><strong>Diagnosis:</strong> {p.diagnosis}</p>

    {openPrescriptionId === p.id  && (
      <div>
        <p><strong>Doctor:</strong> {p.doctorName}</p>
        {p.medicines?.map((m, i) =>  (
          <p key={i}>
            {m.name} - {m.dosage} ({m.duration})
          </p>
        ))}
      </div>
      
    )}
    <button
  onClick={(e) => {
    e.stopPropagation();  // 🔥 VERY IMPORTANT
    handleEditPrescription(p);
  }}
>
  Edit
</button>
  </div>
))}
                
              </>
            )}

            {/* --- REPORTS TAB --- */}
            {activeTab === "reports" && (
  <>
    <div className="tab-header">
      <h3>Medical Reports</h3>
      <button className="add-btn" onClick={() => setShowReportModal(true)}>
        + Upload Report
      </button>
    </div>

    {reports.length === 0 ? (
      <div className="empty-state">No lab reports available.</div>
    ) : (
      <>
        {reports.map((r) => (
          <div
            key={r.id}
            className="record-card"
           onClick={() =>
  setOpenReportId(openReportId === r.id ? null : r.id)
}

          >
            <span className="record-date">{r.date}</span>
            <p><strong>Report Name:</strong> {r.name}</p>

            {openReportId === r.id && (
              <p><strong>Details:</strong> {r.notes || "No extra notes"}</p>
            )}
          </div>
        ))}
      </>
    )}
  </>
)}

            {/* --- APPOINTMENTS TAB (FIXED) --- */}
           {activeTab === "appointments" && (
  <>
    <div className="tab-header">
      <h3>Appointments</h3>
      <button className="add-btn" onClick={() => setShowAppointment(true)}>
        + New Appointment
      </button>
    </div>

    {appointments.length === 0 ? (
      <div className="empty-state">No appointments found.</div>
    ) : (
      <>
        {appointments.map((a) => (
          <div
            key={a.id}
            className="record-card"
            onClick={() =>
  setOpenAppointmentId(openAppointmentId === a.id ? null : a.id)
}

          >
            <span className="record-date">{a.date}</span>
            <p><strong>Patient:</strong> {a.patientName}</p>

            {openAppointmentId === a.id && (
              <>
              <p><strong>Time:</strong> {a.time}</p>
             <p><strong>Status:</strong> {a.status}</p>
    
    </>
            )}
          </div>
        ))}
      </>
    )}
  </>
)}
          </div>
        </div>
      </div>

      {/* --- ALL MODALS --- */}
     {showVisitModal && (
  <AddVisitModal
    onClose={() => setShowVisitModal(false)}
    onSave={handleAddVisit}
  />
)}
   {showPrescriptionModal && (
  <AddPrescriptionModal
    key={editingPrescription?.id || "new"}   // 🔥 MAGIC LINE
    patientId={patientId}
    onClose={() => {
      setShowPrescriptionModal(false);
      setEditingPrescription(null);
    }}
    onSave={handleAddPrescription}
    editingData={editingPrescription}
  />
)}

{showReportModal && (
  <AddReportModal
    patientId={patientId}
    onClose={() => setShowReportModal(false)}
    onSave={handleAddReports}  // 🔥 IMPORTANT
  />
)}
      {showAppointment && (
  <AddAppointmentModal
    patientId={patientId}
    onClose={() => setShowAppointment(false)}
    onSave={handleAddAppointment}  // 🔥 IMPORTANT
  />
)}
      
 
    </div>
  );
};

export default PatientDetails;