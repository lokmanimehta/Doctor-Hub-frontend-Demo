import React, { useState, useEffect } from "react";
import "./AddReportModal.css";

const AddReportModal = ({ onClose, onSave }) => {
  const [reportName, setReportName] = useState("");
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    // lock background scroll
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

 const handleSave = () => {
  if (!reportName) return;

  const newReports = {
  id: Date.now(),
  date: new Date().toLocaleDateString(),
  name: reportName,
   notes: notes ,
   files:file  // 🔥 FIX HERE
}

  onSave(newReports);
  onClose();
};

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>Add Medical Report</h3>

        <label>Report Name</label>
        <input
          type="text"
          placeholder="Eg. Blood Test, X-Ray"
          value={reportName}
          onChange={(e) => setReportName(e.target.value)}
        />

        <label>Upload File</label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />

        {file && (
          <p className="file-preview">
            Selected: <strong>{file.name}</strong>
          </p>
        )}

        <label>Doctor Notes (optional)</label>
        <textarea
          placeholder="Any remarks about this report"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="save-btn" onClick={handleSave}>
            Save Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddReportModal;
