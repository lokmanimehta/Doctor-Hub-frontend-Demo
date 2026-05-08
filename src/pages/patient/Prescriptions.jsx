import React, { useMemo, useState } from "react";
import "./Prescriptions.css";
import {
  FiSearch,
  FiEye,
  FiDownload,
  FiShare2,
  FiX,
  FiCalendar,
  FiMapPin,
  FiMic,
  FiClock,
  FiFileText,
  FiShoppingBag,
  FiCheckCircle,
  FiUser,
  FiActivity
} from "react-icons/fi";

const prescriptionData = [
  {
    id: 1,
    doctorName: "Dr. Aisha Khan",
    specialization: "Cardiologist",
    clinic: "City Heart Hospital",
    date: "24 Feb 2026",
    status: "Active",
    diagnosis: "Chronic Hypertension",
    symptoms:
      "Mild chest tightness, occasional headache, elevated blood pressure readings.",
    voiceSummary:
      "Patient reports mild chest tightness and elevated blood pressure. Continue anti-hypertensive management and lifestyle control.",
    treatmentPlan:
      "Continue blood pressure medicines regularly, monitor BP daily, reduce salt intake, and maintain a 30-minute walk routine.",
    patientInstructions:
      "Check blood pressure every morning, avoid excessive salt, and do not skip medicines without consulting your doctor.",
    medicines: [
      {
        name: "Telmisartan 40mg",
        dosage: "1-0-0",
        duration: "30 Days",
        timing: "Before breakfast",
        info: "Take at the same time daily. Continue unless doctor advises otherwise."
      },
      {
        name: "Amlodipine 5mg",
        dosage: "0-0-1",
        duration: "30 Days",
        timing: "After dinner",
        info: "May cause mild swelling in some patients. Inform doctor if swelling increases."
      }
    ],
    followUps: [
      { task: "BP Checkup", date: "02 Mar 2026", status: "Upcoming" },
      { task: "Diet Review", date: "10 Mar 2026", status: "Pending" }
    ]
  },
  {
    id: 2,
    doctorName: "Dr. Sameer Verma",
    specialization: "General Physician",
    clinic: "Apex Family Care",
    date: "10 Jan 2026",
    status: "Past",
    diagnosis: "Severe Viral Flu",
    symptoms: "High fever, throat pain, weakness, body ache.",
    voiceSummary:
      "High fever for two days with weakness and throat irritation. Symptomatic treatment and rest advised.",
    treatmentPlan:
      "Bed rest, oral hydration, fever management, warm fluids, and observation of fever pattern for 3 to 5 days.",
    patientInstructions:
      "Drink warm fluids, take proper rest, and return for review if fever continues beyond 3 days.",
    medicines: [
      {
        name: "Paracetamol 650mg",
        dosage: "1-1-1",
        duration: "5 Days",
        timing: "After meal",
        info: "Do not exceed advised dose. Use only as prescribed."
      },
      {
        name: "Vitamin C 500mg",
        dosage: "1-0-0",
        duration: "10 Days",
        timing: "After breakfast",
        info: "Supportive supplement for recovery."
      }
    ],
    followUps: [
      { task: "Recovery Check", date: "15 Jan 2026", status: "Completed" }
    ]
  },
  {
    id: 3,
    doctorName: "Dr. Raj Patel",
    specialization: "Orthopedic",
    clinic: "Ortho Spine Center",
    date: "15 Dec 2025",
    status: "Past",
    diagnosis: "Mechanical Lower Back Pain",
    symptoms: "Lower back pain during movement, stiffness after long sitting.",
    voiceSummary:
      "Mechanical lower back pain with posture-related stiffness. Pain relief and activity modification advised.",
    treatmentPlan:
      "Pain control, posture correction, stretching exercises, and avoiding heavy weight lifting for at least one week.",
    patientInstructions:
      "Avoid bending suddenly, do stretching exercises, and consult again if pain spreads to the leg.",
    medicines: [
      {
        name: "Etoshine 90mg",
        dosage: "0-0-1",
        duration: "7 Days",
        timing: "After dinner",
        info: "Take only after food and avoid self-extending the course."
      },
      {
        name: "Pantocid 40mg",
        dosage: "1-0-0",
        duration: "7 Days",
        timing: "30 min before breakfast",
        info: "Helps reduce stomach irritation with pain medicine."
      }
    ],
    followUps: [
      { task: "Physiotherapy Review", date: "20 Dec 2025", status: "Missed" }
    ]
  }
];

const Prescriptions = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const filteredPrescriptions = useMemo(() => {
    return prescriptionData.filter((item) => {
      const query = search.toLowerCase();

      const matchesSearch =
        item.doctorName.toLowerCase().includes(query) ||
        item.diagnosis.toLowerCase().includes(query) ||
        item.clinic.toLowerCase().includes(query) ||
        item.specialization.toLowerCase().includes(query);

      const matchesFilter = filter === "All" || item.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [search, filter]);

  const activePrescription =
    prescriptionData.find((item) => item.status === "Active") || prescriptionData[0];

  return (
    <div className="prescriptions-page">
      <div className="prescriptions-shell">
        <header className="page-header">
          <div className="page-header-text">
            <h1>My Prescriptions</h1>
            <p>
              View your doctor-approved prescriptions, medicines, treatment plan,
              and follow-up instructions in one place.
            </p>
          </div>
        </header>

        <section className="toolbar-card">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by doctor, diagnosis, clinic"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-tabs">
            {["All", "Active", "Past"].map((tab) => (
              <button
                key={tab}
                type="button"
                className={filter === tab ? "filter-tab active" : "filter-tab"}
                onClick={() => setFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </section>

        <section className="hero-card">
          <div className="hero-top">
            <div className="hero-left">
              <span className="hero-label">Current treatment</span>
              <h2>{activePrescription.diagnosis}</h2>

              <div className="hero-doctor-details">
                <p className="hero-meta">
                  <FiUser />
                  <span>
                    {activePrescription.doctorName} •{" "}
                    {activePrescription.specialization}
                  </span>
                </p>

                <p className="hero-meta">
                  <FiMapPin />
                  <span>{activePrescription.clinic}</span>
                </p>
              </div>
            </div>

            <div className="hero-status-wrap">
              <span className="status-pill active">
                {activePrescription.status}
              </span>
            </div>
          </div>

          <div className="hero-grid">
            <div className="hero-info-card">
              <span className="info-title">Symptoms</span>
              <p>{activePrescription.symptoms}</p>
            </div>

            <div className="hero-info-card">
              <span className="info-title">Treatment plan</span>
              <p>{activePrescription.treatmentPlan}</p>
            </div>

            <div className="hero-info-card">
              <span className="info-title">Next follow-up</span>
              <p>
                {activePrescription.followUps.length > 0
                  ? `${activePrescription.followUps[0].task} • ${activePrescription.followUps[0].date}`
                  : "No follow-up scheduled"}
              </p>
            </div>
          </div>
        </section>

        <section className="list-section">
          <div className="section-head">
            <div>
              <h3>Prescription History</h3>
              <p>All your current and past doctor-approved prescriptions.</p>
            </div>
          </div>

          <div className="prescription-grid">
            {filteredPrescriptions.length > 0 ? (
              filteredPrescriptions.map((item) => (
                <article className="prescription-card" key={item.id}>
                  <div className="card-head">
                    <div className="card-head-left">
                      <h4>{item.diagnosis}</h4>
                      <p className="doctor-text">
                        {item.doctorName} • {item.specialization}
                      </p>
                    </div>

                    <span
                      className={
                        item.status === "Active"
                          ? "status-pill active"
                          : "status-pill past"
                      }
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="card-meta">
                    <span>
                      <FiCalendar />
                      {item.date}
                    </span>
                    <span>
                      <FiMapPin />
                      {item.clinic}
                    </span>
                  </div>

                  <div className="content-block">
                    <span className="content-label">Symptoms</span>
                    <p>{item.symptoms}</p>
                  </div>

                  <div className="content-block voice-summary">
                    <span className="content-label with-icon">
                      <FiMic />
                      Voice Summary
                    </span>
                    <p>{item.voiceSummary}</p>
                  </div>

                  <div className="medicine-preview-list">
                    {item.medicines.slice(0, 2).map((med, index) => (
                      <div className="medicine-preview-item" key={index}>
                        <strong>{med.name}</strong>
                        <span>
                          {med.dosage} • {med.timing}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="card-actions">
                    <button
                      type="button"
                      className="action-btn"
                      onClick={() => setSelectedPrescription(item)}
                    >
                      <FiEye />
                      <span>View Details</span>
                    </button>

                    <button
                      type="button"
                      className="action-btn"
                      onClick={() =>
                        showToast("Download feature can be connected here")
                      }
                    >
                      <FiDownload />
                      <span>Download</span>
                    </button>

                    <button
                      type="button"
                      className="action-btn"
                      onClick={() =>
                        showToast("Share feature can be connected here")
                      }
                    >
                      <FiShare2 />
                      <span>Share</span>
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <p>No prescriptions found for your search.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {selectedPrescription && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedPrescription(null)}
        >
          <div
            className="prescription-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-left">
                <h2>{selectedPrescription.diagnosis}</h2>
                <p>
                  {selectedPrescription.doctorName} •{" "}
                  {selectedPrescription.specialization}
                </p>
                <p>{selectedPrescription.clinic}</p>
              </div>

              <button
                type="button"
                className="close-btn"
                onClick={() => setSelectedPrescription(null)}
              >
                <FiX />
              </button>
            </div>

            <div className="modal-scroll">
              <div className="detail-section">
                <span className="detail-label">Symptoms</span>
                <p>{selectedPrescription.symptoms}</p>
              </div>

              <div className="detail-section voice-section">
                <span className="detail-label with-icon">
                  <FiMic />
                  Voice Summary
                </span>
                <p>{selectedPrescription.voiceSummary}</p>
              </div>

              <div className="detail-section">
                <span className="detail-label with-icon">
                  <FiActivity />
                  Treatment Plan
                </span>
                <p>{selectedPrescription.treatmentPlan}</p>
              </div>

              <div className="detail-section">
                <span className="detail-label with-icon">
                  <FiFileText />
                  Patient Instructions
                </span>
                <p>{selectedPrescription.patientInstructions}</p>
              </div>

              <div className="detail-section">
                <span className="detail-label">Medicines</span>

                <div className="medicine-list">
                  {selectedPrescription.medicines.map((med, index) => (
                    <div className="medicine-card" key={index}>
                      <div className="medicine-card-top">
                        <div className="medicine-card-info">
                          <h4>{med.name}</h4>
                          <p>{med.dosage}</p>
                        </div>

                        <span className="duration-badge">{med.duration}</span>
                      </div>

                      <div className="medicine-card-body">
                        <p>
                          <strong>Timing:</strong> {med.timing}
                        </p>
                        <p>
                          <strong>Notes:</strong> {med.info}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <span className="detail-label with-icon">
                  <FiClock />
                  Follow-ups
                </span>

                {selectedPrescription.followUps.length > 0 ? (
                  <div className="followup-list">
                    {selectedPrescription.followUps.map((item, index) => (
                      <div className="followup-card" key={index}>
                        <div className="followup-card-left">
                          <h5>{item.task}</h5>
                          <p>{item.date}</p>
                        </div>
                        <span className="followup-status">{item.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No follow-up scheduled.</p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="secondary-btn"
                onClick={() =>
                  showToast("Full record page can be connected here")
                }
              >
                View Full Record
              </button>

              <button
                type="button"
                className="primary-btn"
                onClick={() =>
                  showToast("Medicine order integration can be connected here")
                }
              >
                <FiShoppingBag />
                <span>Order Medicines</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast">
          <FiCheckCircle />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};

export default Prescriptions;