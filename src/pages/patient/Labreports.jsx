import React, { useState, useMemo, useCallback } from "react";
import { 
  Search, Upload, Download, Share2, FileText, 
  CheckCircle2, Building2, X, ChevronRight, Info
} from "lucide-react";
import "./Labreports.css";

// Helper functions (Component ke BAHAR taaki purity error na aaye)
const generateId = () => {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `report-${Math.random().toString(36).substr(2, 9)}`;
};

const getTodayDate = () => new Date().toISOString().split('T')[0];

const initialReports = [
  { id: 1, name: "Liver Function Test", labName: "Metropolis Diagnostics", date: "2026-03-15", source: "DOCTOR", shared: true, fileUrl: "#" },
  { id: 2, name: "Full Body Checkup", labName: "Apollo Health", date: "2026-03-10", source: "DOCTOR", shared: false, fileUrl: "#" },
  { id: 3, name: "Complete Blood Count", labName: "Manual Upload", date: "2026-03-05", source: "PATIENT", shared: true, fileUrl: "#" },
  { id: 4, name: "Thyroid Profile", labName: "Thyrocare", date: "2026-02-28", source: "DOCTOR", shared: false, fileUrl: "#" },
  { id: 5, name: "Vitamin D Test", labName: "Manual Upload", date: "2026-02-20", source: "PATIENT", shared: false, fileUrl: "#" },
];

const doctors = [
  { id: 101, name: "Dr. Sameer Malhotra", spec: "General Physician" },
  { id: 102, name: "Dr. Ananya Singh", spec: "Cardiologist" },
  { id: 103, name: "Dr. Rahul Verma", spec: "Gastroenterologist" },
];

const LabReports = () => {
  const [reports, setReports] = useState(initialReports);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [dateFilter, setDateFilter] = useState("ALL");
  const [sharingReport, setSharingReport] = useState(null);

  const filteredReports = useMemo(() => {
    return reports
      .filter((r) => {
        const searchText = search.toLowerCase();
        const matchesSearch =
          r.name.toLowerCase().includes(searchText) ||
          r.labName.toLowerCase().includes(searchText) ||
          r.date.includes(searchText);

        const matchesTab = activeTab === "ALL" || r.source === activeTab;

        let matchesDate = true;
        if (dateFilter !== "ALL") {
          const reportDate = new Date(r.date);
          const today = new Date();
          const diffDays = (today - reportDate) / (1000 * 60 * 60 * 24);
          matchesDate = diffDays <= Number(dateFilter);
        }
        return matchesSearch && matchesTab && matchesDate;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [reports, search, activeTab, dateFilter]);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPendingFile(file);
      setSharingReport(null); 
      setShowModal(true);
    }
    e.target.value = null; 
  };

  const handleDownload = (url, name) => {
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", name || "report.pdf");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openShareModal = async (report) => {
    // Agar patient ne upload kiya hai toh Doctor wala modal dikhao
    if (report.source === "PATIENT") {
      setPendingFile({ name: report.name }); 
      setSharingReport(report);
      setShowModal(true);
    } else {
      // Agar lab/doctor se aaya hai toh WhatsApp/System share kholo
      if (navigator.share) {
        try {
          await navigator.share({
            title: report.name,
            text: `Checking out my medical report: ${report.name} from ${report.labName}`,
            url: window.location.href, // Yahan aap report ka actual URL bhi daal sakte hain
          });
        } catch (err) {
          console.log("Share cancelled or failed", err);
        }
      } else {
        alert("Sharing not supported on this browser. You can download the file instead.");
      }
    }
  };

  const finalizeUpload = useCallback((doctorName = null) => {
    if (sharingReport) {
      setReports(prev => prev.map(r => 
        r.id === sharingReport.id ? { ...r, shared: !!doctorName, doctorName } : r
      ));
    } else if (pendingFile) {
      const newReport = {
        id: generateId(),
        name: pendingFile.name.split('.')[0],
        labName: "Manual Upload",
        date: getTodayDate(),
        source: "PATIENT",
        shared: !!doctorName,
        doctorName: doctorName,
        fileUrl: "#"
      };
      setReports(prev => [newReport, ...prev]);
    }
    
    setShowModal(false);
    setPendingFile(null);
    setSharingReport(null);
  }, [pendingFile, sharingReport]);

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div className="title-area">
          <h1>Securely manage and share your laboratory results.</h1>
         
        </div>
        <label className="primary-upload-btn" style={{ color: "white" }}>
          <Upload size={18} />
          <span>Upload Report</span>
          <input type="file" hidden onChange={onFileChange} />
        </label>
      </div>

      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-val">{reports.length}</span>
          <span className="stat-label">Total Reports</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-val">{reports.filter(r => r.source === "DOCTOR").length}</span>
          <span className="stat-label">Sent by Doctor</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-val">{reports.filter(r => r.shared).length}</span>
          <span className="stat-label">Shared by Me</span>
        </div>
      </div>

      <div className="controls-row">
        <div className="search-pill">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by test or lab name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="tab-pill">
          <button className={activeTab === "ALL" ? "active" : ""} onClick={() => setActiveTab("ALL")}>All</button>
          <button className={activeTab === "DOCTOR" ? "active" : ""} onClick={() => setActiveTab("DOCTOR")}>Sent by Doctor/Lab</button>
          <button className={activeTab === "PATIENT" ? "active" : ""} onClick={() => setActiveTab("PATIENT")}>Uploaded by Me</button>
        </div>
        <select
          className="date-filter"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        >
          <option value="ALL">All Time</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
        </select>
      </div>

      <div className="reports-container">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <div key={report.id} className="report-item-card">
              <div className="report-main-info">
                <div className={`file-icon-box ${report.source === "DOCTOR" ? "is-lab" : "is-user"}`}>
                  <FileText size={22} />
                </div>
                <div className="text-content">
                  <h3>{report.name}</h3>
                  <div className="sub-meta">
                    <span className="lab-tag"><Building2 size={13} /> {report.labName}</span>
                    <span className="dot" />
                    <span className="date-tag">{report.date}</span>
                  </div>
                </div>
                {report.shared && (
                  <div className="shared-status-chip">
                    <CheckCircle2 size={12} />
                    <span>Shared</span>
                  </div>
                )}
              </div>

              <div className="report-actions">
                <button className="view-link">Preview Report</button>
                <div className="btn-group">
                  <button 
                    className="icon-action-btn" 
                    title="Download"
                    onClick={() => handleDownload(report.fileUrl, report.name)}
                  >
                    <Download size={18} />
                  </button>
                  <button 
                    className="icon-action-btn" 
                    title="Share"
                    onClick={() => openShareModal(report)}
                  >
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-reports-state">
            <Info size={40} />
            <p>No reports found matching your search.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content">
            <div className="modal-header">
              <h3>Secure Share</h3>
              <button className="close-modal" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
          
            <div className="modal-body">
              <div className="file-preview-mini">
                <FileText size={16} />
                <span>{pendingFile?.name}</span>
              </div>
              <p className="modal-hint">Select a doctor to grant instant access to this report.</p>
              
              <div className="doctor-selection-list">
                {doctors.map(doc => (
                  <div key={doc.id} className="doctor-option-card" onClick={() => finalizeUpload(doc.name)}>
                    <div className="doc-avatar">{doc.name.split(' ')[1][0]}</div>
                    <div className="doc-info">
                      <h4>{doc.name}</h4>
                      <span>{doc.spec}</span>
                    </div>
                    <ChevronRight size={18} className="arrow" />
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="skip-btn" onClick={() => finalizeUpload()}>Skip & Save to Vault</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabReports;