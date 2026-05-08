import React, { useEffect, useMemo, useState } from "react";
import "./AddReportModal.css";

const AddReportModal = ({
  onClose,
  onSave,
  saving = false,
  visits = [],
  prescriptions = [],
  defaultVisitId = null,
  defaultPrescriptionId = null
}) => {
  const initialVisitId = defaultVisitId ?? "";
  const initialPrescriptionId = defaultPrescriptionId ?? "";

  const [reportName, setReportName] = useState("");
  const [reportType, setReportType] = useState("BLOOD_TEST");
  const [reportDate, setReportDate] = useState("");
  const [labName, setLabName] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [visitId, setVisitId] = useState(initialVisitId);
  const [prescriptionId, setPrescriptionId] = useState(initialPrescriptionId);
  const [formError, setFormError] = useState("");

  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const maxDate = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setFormError("Only PDF, JPG, JPEG, PNG, and WEBP files are allowed.");
      setFile(null);
      e.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setFormError("File size cannot exceed 10 MB.");
      setFile(null);
      e.target.value = "";
      return;
    }

    setFormError("");
    setFile(selectedFile);
  };

  const handleSubmit = async () => {
    setFormError("");

    if (!reportName.trim()) {
      setFormError("Report name is required.");
      return;
    }

    if (!reportDate) {
      setFormError("Report date is required.");
      return;
    }

    if (!file) {
      setFormError("Please upload a report file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFormError("File size cannot exceed 10 MB.");
      return;
    }

    const selectedDate = new Date(reportDate);
    const now = new Date();

    if (selectedDate > now) {
      setFormError("Report date cannot be in the future.");
      return;
    }

    const payload = {
      reportName: reportName.trim(),
      reportType: reportType.trim(),
      reportDate: selectedDate.getTime(),
      labName: labName.trim(),
      notes: notes.trim(),
      visitId: visitId ? Number(visitId) : null,
      prescriptionId: prescriptionId ? Number(prescriptionId) : null,
      file
    };

    try {
      await onSave(payload);
    } catch (error) {
      setFormError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to upload report."
      );
    }
  };

  return (
    <div
      className="report-modal-overlay"
      onClick={!saving ? onClose : undefined}
    >
      <div
        className="report-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="report-modal-header">
          <div>
            <p className="report-modal-eyebrow">Medical Reports</p>
            <h3>Upload New Report</h3>
            <p className="report-modal-subtext">
              Add a clinical report for this patient with clean metadata and file attachment.
            </p>
          </div>
        </div>

        {formError && (
          <div className="report-modal-error">
            {formError}
          </div>
        )}

        <div className="report-modal-form">
          <div className="report-form-group">
            <label htmlFor="reportName">Report Name</label>
            <input
              id="reportName"
              type="text"
              placeholder="Eg. Blood Test Report"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="report-form-grid">
            <div className="report-form-group">
              <label htmlFor="reportType">Report Type</label>
              <select
                id="reportType"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                disabled={saving}
              >
                <option value="BLOOD_TEST">Blood Test</option>
                <option value="X_RAY">X-Ray</option>
                <option value="MRI">MRI</option>
                <option value="CT_SCAN">CT Scan</option>
                <option value="ECG">ECG</option>
                <option value="ULTRASOUND">Ultrasound</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="report-form-group">
              <label htmlFor="reportDate">Report Date</label>
              <input
                id="reportDate"
                type="date"
                max={maxDate}
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="report-form-grid">
            <div className="report-form-group">
              <label htmlFor="linkedVisit">Link Visit (Optional)</label>
              <select
                id="linkedVisit"
                value={visitId}
                onChange={(e) => setVisitId(e.target.value)}
                disabled={saving}
              >
                <option value="">Not linked</option>
                {visits.map((visit) => (
                  <option key={visit.id} value={visit.id}>
                    {new Date(visit.visitDate).toLocaleDateString()} - {visit.chiefComplaint || "Visit"}
                  </option>
                ))}
              </select>
            </div>

            <div className="report-form-group">
              <label htmlFor="linkedPrescription">Link Prescription (Optional)</label>
              <select
                id="linkedPrescription"
                value={prescriptionId}
                onChange={(e) => setPrescriptionId(e.target.value)}
                disabled={saving}
              >
                <option value="">Not linked</option>
                {prescriptions.map((prescription) => (
                  <option key={prescription.id} value={prescription.id}>
                    {new Date(prescription.prescriptionDate).toLocaleDateString()} - {prescription.diagnosis || "Prescription"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="report-form-group">
            <label htmlFor="labName">Lab / Source Name</label>
            <input
              id="labName"
              type="text"
              placeholder="Eg. Bharat Labs, Thyrocare, Metropolis"
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="report-form-group">
            <label htmlFor="reportFile">Upload File</label>
            <input
              id="reportFile"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              disabled={saving}
            />

            <p className="report-file-helper-text">
              Supported files: PDF, JPG, JPEG, PNG, WEBP. Maximum size: 10 MB.
            </p>

            {file && (
              <div className="report-file-preview">
                <span className="report-file-name">{file.name}</span>
                <span className="report-file-size">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            )}
          </div>

          <div className="report-form-group">
            <label htmlFor="notes">Doctor Notes</label>
            <textarea
              id="notes"
              rows="5"
              placeholder="Add optional remarks about this report..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <div className="report-modal-actions">
          <button
            type="button"
            className="report-cancel-btn"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="report-save-btn"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Uploading..." : "Upload Report"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddReportModal;