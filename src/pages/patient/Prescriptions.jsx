import React, { useState, useMemo } from "react";
import "./Prescriptions.css";
import { 
    FiSearch, FiDownload, FiShare2, FiEye, FiActivity, FiX, 
    FiCheckCircle, FiInfo, FiShoppingBag, FiExternalLink, FiCalendar, 
    FiMapPin, FiMic, FiAlertTriangle, FiClock, FiShield 
} from "react-icons/fi";

const dummyPrescriptions = [
    { 
        id: 1, docName: "Dr. Aisha Khan", docImg: "https://i.pravatar.cc/150?u=aisha", 
        date: "24 Feb 2026", diagnosis: "Chronic Hypertension", status: "Active", 
        clinic: "City Heart Hospital", specialization: "Cardiologist",
        // AI Feature: Voice-to-Prescription Summary
        aiVoiceSummary: "Patient reports mild chest tightness. BP recorded 150/95. Suggesting salt-free diet and 30-min morning walk.",
        // AI Feature: Automated Follow-ups
        followUps: [
            { task: "BP Checkup", date: "02 Mar 2026", status: "Upcoming" },
            { task: "Salt-Free Diet Review", date: "10 Mar 2026", status: "Pending" }
        ],
        medicines: [
            { 
                name: "Telmisartan 40mg", dose: "1-0-0", dur: "30 Days", instr: "Empty Stomach",
                // AI Feature: Smart Drug Recommendation / Interaction Info
                aiDrugInfo: "Effective for hypertension. No interactions found with current EHR history."
            },
            { 
                name: "Amlodipine 5mg", dose: "0-0-1", dur: "30 Days", instr: "After Meal",
                aiDrugInfo: "Avoid grapefruit juice. AI flagged: Slight edema risk monitored."
            }
        ], 
        notes: "Monitor BP every morning. Reduce salt intake and walk for 30 mins daily." 
    },
    { 
        id: 2, docName: "Dr. Sameer Verma", docImg: "https://i.pravatar.cc/150?u=sameer", 
        date: "10 Jan 2026", diagnosis: "Severe Viral Flu", status: "Past", 
        clinic: "Apex Family Care", specialization: "General Physician",
        aiVoiceSummary: "High fever for 2 days. Dictated Paracetamol and bed rest.",
        followUps: [{ task: "Recovery Check", date: "15 Jan 2026", status: "Completed" }],
        medicines: [
            { name: "Paracetamol 650mg", dose: "1-1-1", dur: "5 Days", instr: "After Meal", aiDrugInfo: "Safe for short term. Max 4g per day." },
            { name: "Vitamin C 500mg", dose: "1-0-0", dur: "10 Days", instr: "After Breakfast", aiDrugInfo: "Immunity booster." }
        ], 
        notes: "Complete bed rest for 3 days. Drink plenty of warm fluids like soup." 
    },
    { 
        id: 3, docName: "Dr. Raj Patel", docImg: "https://i.pravatar.cc/150?u=raj", 
        date: "15 Dec 2025", diagnosis: "Lower Back Pain", status: "Past", 
        clinic: "Ortho Spine Center", specialization: "Orthopedic",
        aiVoiceSummary: "Mechanical back pain. Suggested stretching and posture correction.",
        followUps: [{ task: "Physiotherapy Session", date: "20 Dec 2025", status: "Missed" }],
        medicines: [
            { name: "Etoshine 90mg", dose: "0-0-1", dur: "7 Days", instr: "After Meal", aiDrugInfo: "NSAID. Take only when pain is severe." },
            { name: "Pantocid 40mg", dose: "1-0-0", dur: "7 Days", instr: "30 min Before Food", aiDrugInfo: "Gastro-protection for Etoshine." }
        ], 
        notes: "Avoid lifting heavy weights. Daily light stretching exercises recommended." 
    },
    { 
        id: 4, docName: "Dr. Meera Joshi", docImg: "https://i.pravatar.cc/150?u=meera", 
        date: "05 Nov 2025", diagnosis: "Skin Allergy", status: "Past", 
        clinic: "Dermacare Clinic", specialization: "Dermatologist",
        aiVoiceSummary: "Urticaria symptoms. Dictated Levocetirizine for itching.",
        followUps: [],
        medicines: [
            { name: "Levocetirizine 5mg", dose: "0-0-1", dur: "14 Days", instr: "At Night", aiDrugInfo: "May cause drowsiness." },
            { name: "Mometasone Cream", dose: "Apply", dur: "7 Days", instr: "Affected area", aiDrugInfo: "Topical steroid. Use thin layer." }
        ], 
        notes: "Avoid harsh soaps. Apply calamine if itching persists. No dairy for 1 week." 
    }
];

const Prescriptions = () => {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");
    const [selectedPres, setSelectedPres] = useState(null);
    const [toast, setToast] = useState("");

    const showToast = (msg) => { 
        setToast(msg); 
        setTimeout(() => setToast(""), 3000); 
    };

    const filteredData = useMemo(() => {
        return dummyPrescriptions.filter(p => {
            const matchesSearch = p.docName.toLowerCase().includes(search.toLowerCase()) || 
                                 p.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
                                 p.clinic.toLowerCase().includes(search.toLowerCase());
            const matchesTab = filter === "All" || p.status === filter;
            return matchesSearch && matchesTab;
        });
    }, [search, filter]);

    return (
        <div className="pres-container">
            {/* Header Section */}
            <header className="pres-header-premium">
                <div className="header-titles">
                    <h1>Prescriptions Vault</h1>
                    <p>AI-Powered medical history and instant digital prescriptions</p>
                </div>
                
                <div className="search-controls">
                    <div className="premium-search">
                        <FiSearch className="s-icon" />
                        <input 
                            type="text" 
                            placeholder="Search records, doctors, or clinics..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="filter-pills">
                        {["All", "Active", "Past"].map(tab => (
                            <button 
                                key={tab} 
                                className={`pill ${filter === tab ? "active" : ""}`}
                                onClick={() => setFilter(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* AI Banner: EHR Timeline & Automation Info */}
            <div className="ai-insight-banner">
                <div className="ai-icon-box">
                    <FiShield className="shield-icon" />
                </div>
                <div className="ai-banner-text">
                    <h4>EHR Connectivity Active</h4>
                    <p>Your history is being monitored for drug interactions and automated refill reminders.</p>
                </div>
            </div>

            {/* Featured Section: Ongoing Medication & Automated Follow-ups */}
            <section className="ongoing-highlight">
                <div className="highlight-content">
                    <div className="highlight-text">
                        <h3><FiActivity className="pulse-icon" /> Live Treatment Plan</h3>
                        <p>Based on your latest EHR and Voice-to-Prescription data</p>
                    </div>
                    <div className="medication-grid-mini">
                        {dummyPrescriptions[0].medicines.map((m, i) => (
                            <div key={i} className="mini-med-card">
                                <div className="med-info">
                                    <span className="med-name">{m.name}</span>
                                    <span className="med-dosage">{m.dose} • {m.instr}</span>
                                </div>
                                <button className="alert-btn" onClick={() => showToast(`AI Reminder set for ${m.name}`)}>
                                    Auto-Remind
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    {/* New Addition: Automated Follow-up Reminders */}
                    <div className="follow-up-section">
                        <span className="follow-label"><FiClock /> Automated Follow-ups</span>
                        <div className="follow-up-pills">
                            {dummyPrescriptions[0].followUps.map((f, i) => (
                                <div key={i} className="follow-pill">
                                    {f.task} - <strong>{f.date}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Records Grid */}
            <div className="records-grid">
                {filteredData.length > 0 ? filteredData.map(pres => (
                    <div key={pres.id} className="premium-record-card">
                        <div className="card-status-indicator" data-status={pres.status}></div>
                        <div className="card-main-info">
                            <div className="doctor-profile">
                                <img src={pres.docImg} alt={pres.docName} />
                                <div className="doc-details">
                                    <h4>{pres.docName}</h4>
                                    <span>{pres.specialization}</span>
                                </div>
                            </div>
                            <div className="diagnosis-info">
                                <span className="label">Diagnosis</span>
                                <p>{pres.diagnosis}</p>
                            </div>
                            
                            {/* AI Voice Summary Preview */}
                            <div className="voice-summary-preview">
                                <FiMic className="mic-icon" />
                                <span>{pres.aiVoiceSummary}</span>
                            </div>

                            <div className="meta-footer">
                                <span><FiMapPin /> {pres.clinic}</span>
                                <span><FiCalendar /> {pres.date}</span>
                            </div>
                        </div>
                        <div className="card-actions">
                            <button className="btn-icon" title="View Details" onClick={() => setSelectedPres(pres)}>
                                <FiEye />
                            </button>
                            <button className="btn-icon" title="Download PDF" onClick={() => showToast("Preparing Digital Prescription...")}>
                                <FiDownload />
                            </button>
                            <button className="btn-icon" title="Share with Clinic" onClick={() => showToast("EHR Access Shared!")}>
                                <FiShare2 />
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="no-results" style={{textAlign: 'center', padding: '40px'}}>
                        <p>No health records found for "{search}"</p>
                    </div>
                )}
            </div>

            {/* Professional Modal / Bottom Sheet */}
            {selectedPres && (
  <div className="modal-backdrop" onClick={() => setSelectedPres(null)}>
    <div className="premium-modal" onClick={e => e.stopPropagation()}>
      <div className="modal-head">
        <div className="title-grp">
          <h2>Medical Record Detail</h2>
          <p>{selectedPres.clinic} • {selectedPres.date}</p>
        </div>
        <button className="close-btn" onClick={() => setSelectedPres(null)}><FiX /></button>
      </div>
      
      <div className="modal-scroll-area">
        {/* AI Voice Section */}
        <div className="ai-voice-card">
          <h4><FiMic /> AI Voice Transcription</h4>
          <p>{selectedPres.aiVoiceSummary}</p>
        </div>

        {/* Diagnosis Summary */}
        <div className="doc-notes-minimal">
          <span className="label">Diagnosis</span>
          <h4>{selectedPres.diagnosis}</h4>
        </div>

        {/* Medicines as Cards (No Table) */}
        <h4 className="section-title">Verified Medication</h4>
        <div className="meds-list-container">
          {selectedPres.medicines.map((m, i) => (
            <div key={i} className="med-detail-card">
              <div className="med-card-header">
                <span className="med-card-name">{m.name}</span>
                <span className="dose-badge">{m.dose}</span>
              </div>
              <div className="med-card-body">
                <div className="med-meta-row">
                  <span><strong>Duration:</strong> {m.dur}</span>
                  <span><strong>Timing:</strong> {m.instr}</span>
                </div>
                <div className="ai-drug-info-box">
                  <FiInfo /> <span>{m.aiDrugInfo}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Clinical Notes */}
        <div className="doc-notes-card">
    <div className="notes-header">
        <FiActivity className="pulse-icon" /> 
        <h4>Doctor's Clinical Notes</h4>
    </div>
    <div className="notes-content">
        <p>{selectedPres.notes}</p>
    </div>
    {/* Optional: Agar tum recommendations ko separate badges mein dikhana chaho */}
    <div className="lifestyle-tags">
        <span className="tag">Daily Walk</span>
        <span className="tag">Low Salt</span>
    </div>
</div>
      </div>

      <div className="modal-footer-btns">
        <button className="btn-reports" onClick={() => showToast("Fetching EHR Documents...")}>
          <FiExternalLink /> Full EHR
        </button>
        <button className="btn-order" onClick={() => showToast("Syncing with Pharmacy...")}>
          <FiShoppingBag /> Order Medicines
        </button>
      </div>
    </div>
  </div>
)}

            {/* Custom Toast */}
            {toast && (
                <div className="premium-toast">
                    <FiCheckCircle className="toast-icon" />
                    <span>{toast}</span>
                </div>
            )}
        </div>
    );
};

export default Prescriptions;