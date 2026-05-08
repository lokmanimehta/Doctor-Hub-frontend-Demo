import React, { useEffect, useMemo, useState } from "react";
import "./AddVisitModal.css";

const formatDateTimeForInput = (value) => {
  if (!value) return "";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "";

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  const hours = String(parsedDate.getHours()).padStart(2, "0");
  const minutes = String(parsedDate.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const AddVisitModal = ({ onClose, onSave, editingData = null }) => {
  const initialVisitDate = useMemo(
    () => formatDateTimeForInput(editingData?.visitDate),
    [editingData]
  );

  const [visitDate, setVisitDate] = useState(initialVisitDate);
  const [chiefComplaint, setChiefComplaint] = useState(
    editingData?.chiefComplaint || ""
  );
  const [doctorNotes, setDoctorNotes] = useState(
    editingData?.doctorNotes || ""
  );
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = Boolean(editingData?.id);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow || "auto";
    };
  }, []);

  const handleSave = async () => {
    try {
      setError("");

      if (!visitDate) {
        setError("Visit date is required");
        return;
      }

      if (!chiefComplaint.trim()) {
        setError("Chief complaint is required");
        return;
      }

      if (!doctorNotes.trim()) {
        setError("Doctor notes are required");
        return;
      }

      const selectedDate = new Date(visitDate);
      const now = new Date();

      if (Number.isNaN(selectedDate.getTime())) {
        setError("Invalid visit date and time");
        return;
      }

      if (selectedDate.getTime() > now.getTime()) {
        setError("Visit date cannot be in the future");
        return;
      }

      const payload = {
        visitDate: selectedDate.getTime(),
        chiefComplaint: chiefComplaint.trim(),
        doctorNotes: doctorNotes.trim()
      };

      setIsSaving(true);
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save visit"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="visit-modal-overlay" onClick={onClose}>
      <div
        className="visit-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="visit-modal-header">
          <div>
            <p className="visit-modal-eyebrow">Patient Visit</p>
            <h3>{isEditMode ? "Edit Visit" : "Add New Visit"}</h3>
            <p className="visit-modal-subtext">
              {isEditMode
                ? "Update consultation details for this recorded visit."
                : "Record a consultation entry for this patient in a clean and structured way."}
            </p>
          </div>
        </div>

        {error && <div className="visit-modal-error">{error}</div>}

        <div className="visit-modal-body">
          <div className="visit-form-group">
            <label htmlFor="visitDate">Visit Date & Time</label>
            <input
              id="visitDate"
              type="datetime-local"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
            />
          </div>

          <div className="visit-form-group">
            <label htmlFor="chiefComplaint">Chief Complaint</label>
            <input
              id="chiefComplaint"
              type="text"
              placeholder="Eg. Fever, headache, body pain"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
            />
          </div>

          <div className="visit-form-group">
            <label htmlFor="doctorNotes">Doctor Notes</label>
            <textarea
              id="doctorNotes"
              rows="6"
              placeholder="Write consultation notes, findings, advice, and observations"
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="visit-modal-actions">
          <button
            type="button"
            className="visit-cancel-btn"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="visit-save-btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving
              ? isEditMode
                ? "Updating..."
                : "Saving..."
              : isEditMode
                ? "Update Visit"
                : "Save Visit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddVisitModal;