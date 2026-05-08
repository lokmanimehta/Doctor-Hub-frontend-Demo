import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiFileText,
  FiClock,
  FiInfo,
  FiCheckCircle,
  FiLock,
  FiActivity,
  FiExternalLink,
  FiPlusCircle,
  FiThumbsUp,
  FiAlertTriangle,
  FiArrowRight,
  FiUserCheck,
  FiHome
} from "react-icons/fi";
import { patientAppointmentsDummyData } from "../../utils/patientAppointmentsDummyData";
import { prescriptionsDummyData } from "../../utils/prescriptionsDummyData";
import { patientDashboardData } from "../../utils/patientDashboardDummyData";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isRecovered, setIsRecovered] = useState(false);
  const [symptomText, setSymptomText] = useState("");
const [triageResult, setTriageResult] = useState(null);
  const { welcomeMessage, upcomingAppointment, healthSummary } = patientDashboardData;

  const wellnessTips = [
    "Stay hydrated! Drinking at least 8 glasses of water daily helps maintain energy.",
    "A 30-minute walk today can significantly improve your cardiovascular health.",
    "Prioritize 7-8 hours of sleep tonight to boost your immune system.",
    "Limit your salt intake to help maintain healthy blood pressure levels.",
    "Deep breathing for 5 minutes can help reduce stress and improve focus."
  ];
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const dailyTip = wellnessTips[dayOfYear % wellnessTips.length];

  const pendingLabTests = [
    { id: 1, testName: "CBC & Lipid Profile", lab: "City Diagnostic", date: "24 Feb" },
  ];
 const handleSymptomCheck = () => {
  const text = symptomText.toLowerCase().trim();

  if (!text) {
    setTriageResult({
      level: "info",
      title: "Enter symptoms first",
      message: "Please type your symptoms to get guidance.",
      cta: null,
      specialty: null,
      reason: null
    });
    return;
  }

  // Emergency symptoms
  if (
    text.includes("chest pain") ||
    text.includes("breathing problem") ||
    text.includes("breathlessness") ||
    text.includes("stroke") ||
    text.includes("unconscious") ||
    text.includes("severe bleeding")
  ) {
    setTriageResult({
      level: "urgent",
      title: "Urgent Care Recommended",
      message:
        "Your symptoms may need urgent medical attention. Please check nearby hospitals or emergency care immediately.",
      cta: "hospital",
      specialty: null,
      reason: "Emergency warning symptoms detected"
    });
    return;
  }

  // Specialty mapping
  if (text.includes("rash") || text.includes("itching") || text.includes("skin allergy")) {
    setTriageResult({
      level: "doctor",
      title: "Dermatologist Recommended",
      message:
        "Your symptoms look related to skin concerns. You may consult a Dermatologist.",
      cta: "doctor",
      specialty: "Dermatologist",
      reason: "Matched symptoms: rash / itching / skin allergy"
    });
    return;
  }

  if (text.includes("headache") || text.includes("migraine") || text.includes("dizziness")) {
    setTriageResult({
      level: "doctor",
      title: "Neurologist / Physician Recommended",
      message:
        "Your symptoms may need consultation with a Neurologist or General Physician.",
      cta: "doctor",
      specialty: "Neurologist",
      reason: "Matched symptoms: headache / migraine / dizziness"
    });
    return;
  }

  if (text.includes("bp") || text.includes("blood pressure")) {
    setTriageResult({
      level: "doctor",
      title: "Cardiologist Recommended",
      message:
        "Your symptoms may be related to blood pressure or heart health. A Cardiologist may be suitable.",
      cta: "doctor",
      specialty: "Cardiologist",
      reason: "Matched symptoms: BP / blood pressure"
    });
    return;
  }

  if (text.includes("diabetes") || text.includes("fever") || text.includes("cough") || text.includes("cold") || text.includes("vomiting") || text.includes("stomach pain")) {
    setTriageResult({
      level: "doctor",
      title: "Physician Recommended",
      message:
        "Your symptoms look suitable for a General Physician consultation.",
      cta: "doctor",
      specialty: "Physician",
      reason: "Matched symptoms: general illness / fever / cough / diabetes"
    });
    return;
  }

  setTriageResult({
    level: "home",
    title: "Basic Care Guidance",
    message:
      "Your symptoms may be mild, but if they continue or worsen, please consult a doctor. You can also use Help & Support for more guidance.",
    cta: "help",
    specialty: null,
    reason: "No strong specialty match found"
  });
};
  return (
    <div className="patient-dashboard-container">
      {/* --- HEADER --- */}
      <header className="dashboard-header-premium">
        <div className="hero-main-text">
          <h1>{welcomeMessage} 👋</h1>
          <p className="hero-subtitle"></p>
        </div>
        <div className="daily-tip-card">
          <div className="tip-header"><FiInfo /> <span>Wellness Insight</span></div>
          <p>"{dailyTip}"</p>
        </div>
      </header>
      <div className="ai-symptom-card">
  <div className="ai-symptom-card-top">
    <div>
      <p className="ai-symptom-label">AI TRIAGE ASSIST</p>
      <h2>AI Symptom Checker</h2>
      <p className="ai-symptom-subtext">
        Enter your symptoms and get quick guidance on whether you may need home care, a doctor, or urgent hospital support.
      </p>
    </div>

    <div className="ai-triage-badge">
      <FiAlertTriangle />
      <span>Preliminary Guidance Only</span>
    </div>
  </div>

  <div className="ai-symptom-input-wrap">
    <textarea
      className="ai-symptom-textarea"
      placeholder="Example: fever, cough, headache, chest pain..."
      value={symptomText}
      onChange={(e) => setSymptomText(e.target.value)}
    />

    <div className="ai-symptom-actions">
      <button className="ai-check-btn" onClick={handleSymptomCheck}>
        Check Symptoms
      </button>

      <button
        className="ai-clear-btn"
        onClick={() => {
          setSymptomText("");
          setTriageResult(null);
        }}
      >
        Clear
      </button>
    </div>
  </div>

  {triageResult && (
    <div className={`ai-triage-result ${triageResult.level}`}>
      <div className="ai-result-header">
        <h3>{triageResult.title}</h3>
      </div>

      <p>{triageResult.message}</p>
      {triageResult.specialty && (
  <div className="ai-specialty-box">
    <strong>Recommended Specialty:</strong> {triageResult.specialty}
    <br />
    <span>{triageResult.reason}</span>
  </div>
)}

      <div className="ai-result-actions">
       {triageResult.cta === "doctor" && (
  <button
    className="ai-result-btn"
    onClick={() =>
      navigate("/patient/finddoctors", {
        state: {
          recommendedSpecialty: triageResult.specialty,
          symptomQuery: symptomText,
          triageTitle: triageResult.title
        }
      })
    }
  >
    <FiUserCheck /> Find Matching Doctors
  </button>
)}

        {triageResult.cta === "hospital" && (
          <button
            className="ai-result-btn urgent"
            onClick={() => navigate("/patient/hospitals")}
          >
            <FiAlertTriangle /> Emergency Hospitals
          </button>
        )}

        {triageResult.cta === "help" && (
          <button
            className="ai-result-btn secondary"
            onClick={() => navigate("/patient/help")}
          >
            <FiHome /> Get More Help
          </button>
        )}
      </div>
    </div>
  )}
</div>

      {/* --- UPCOMING APPOINTMENT --- */}
      {upcomingAppointment && (
        <div className="priority-apt-card-top">
          <div className="apt-header-top">
            <span className="p-badge">Upcoming Appointment</span>
            <FiExternalLink style={{cursor: 'pointer'}} />
          </div>
          <div className="apt-content-horizontal">
            <div className="doc-profile-main">
              <div className="doc-avatar-large">{upcomingAppointment.doctorName.charAt(0)}</div>
              <div className="doc-meta-info">
                <h3 style={{margin: 0}}>{upcomingAppointment.doctorName}</h3>
                <p style={{margin: '5px 0 0', opacity: 0.8}}>{upcomingAppointment.specialty}</p>
              </div>
            </div>
            <div className="apt-details-box">
              <div className="detail-item">
                <FiCalendar /> <span>{upcomingAppointment.date}</span>
              </div>
              <div className="detail-item">
                <FiClock /> <span>{upcomingAppointment.time}</span>
              </div>
            </div>
            <button className="manage-btn-top" onClick={() => navigate("/patient/appointments")}>
              Manage Visit
            </button>
          </div>
        </div>
      )}

      {/* --- RECOVERY BANNER --- */}
      {!isRecovered && (
        <div className="recovery-feedback-banner">
          <div className="feedback-info">
            <div className="feedback-icon-ring"><FiThumbsUp size={24} /></div>
            <div className="feedback-text">
              <h4 style={{margin: 0}}>How are you feeling today?</h4>
              <p style={{margin: '5px 0 0', opacity: 0.9}}>Your medication course is ending. Please update your status.</p>
            </div>
          </div>
          <div className="feedback-btns">
            <button className="btn-confirm-recovery" onClick={() => setIsRecovered(true)}>I'm Feeling Great!</button>
            <button className="btn-still-unwell" onClick={() => navigate("/patient/help")}>Still Unwell</button>
          </div>
        </div>
      )}

      <div className="dashboard-main-grid">
        {/* --- LEFT SIDE --- */}
        <div className="grid-left">
          <div className="premium-card-white">
            <div className="card-header-flex" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
              <h2 style={{margin: 0}}>Health Journey</h2>
              <span className={`status-pill ${isRecovered ? "recovered" : "active"}`} 
                    style={{
                      padding: '6px 16px', 
                      borderRadius: '20px', 
                      fontSize: '12px', 
                      fontWeight: 'bold',
                      background: isRecovered ? '#dcfce7':'#e0f2fe',
                      color: isRecovered ? '#166534' : '#0369a1'
                    }}>
                {isRecovered ? "Fully Recovered" : "Under Treatment"}
              </span>
            </div>
            <div className="timeline-container">
              <div className="timeline-item">
                <div className="timeline-icon"><FiCheckCircle color="#10b981" /></div>
                <div className="timeline-content">
                  <h4 style={{margin: 0}}>Consultation</h4>
                  <p style={{margin: '4px 0 0', color: '#64748b'}}>Completed on {healthSummary.lastVisit}</p>
                </div>
              </div>
              <div className={`timeline-item ${isRecovered ? "" : "current"}`}>
                <div className="timeline-icon"><FiActivity color={isRecovered ? "#10b981" : "#3b82f6"} /></div>
                <div className="timeline-content">
                  <h4 style={{margin: 0}}>Current Phase</h4>
                  <p style={{margin: '4px 0 0', color: '#64748b'}}>{healthSummary.recentPrescription}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="premium-card-white">
            <h2 style={{marginBottom: '15px'}}>Pending Lab Tests</h2>
            {pendingLabTests.map(test => (
              <div key={test.id} className="test-item-card premium-hover">
                <div className="test-info">
                  <h4 style={{margin: 0}}>{test.testName}</h4>
                  <span style={{fontSize:'13px', color:'#64748b'}}>{test.lab} • {test.date}</span>
                </div>
                <button className="manage-btn-top" style={{padding:'8px 15px', fontSize:'12px'}}>Details</button>
              </div>
            ))}
          </div>
        </div>

        {/* --- RIGHT SIDE --- */}
        <div className="grid-right">
          <div className="premium-card-white">
            <div className="card-header-flex" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
              <h2 style={{margin: 0}}>Medical Vault</h2>
              <FiLock color="#64748b" />
            </div>
            <div className="vault-grid">
              <div className="vault-card" onClick={() => navigate("/patient/lab-reports")}>
                <FiFileText size={24} color="var(--p-primary)" />
                <p style={{marginTop:'10px', fontWeight:'600'}}>Reports</p>
              </div>
              <div className="vault-card" onClick={() => navigate("/patient/prescriptions")}>
                <FiPlusCircle size={24} color="var(--p-primary)" />
                <p style={{marginTop:'10px', fontWeight:'600'}}>Scripts</p>
              </div>
            </div>
          </div>

          <div className="summary-stats-mini">
             <div className="mini-stat premium-bounce">
                <span style={{fontSize:'13px', color:'#64748b', fontWeight: '500'}}>Active Meds</span>
                <h3 style={{margin:'5px 0 0', fontSize: '24px'}}>{prescriptionsDummyData.length}</h3>
             </div>
             <div className="mini-stat premium-bounce">
                <span style={{fontSize:'13px', color:'#64748b', fontWeight: '500'}}>Total Visits</span>
                <h3 style={{margin:'5px 0 0', fontSize: '24px'}}>{patientAppointmentsDummyData.past.length}</h3>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;