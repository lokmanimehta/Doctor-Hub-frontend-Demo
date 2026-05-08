import React, { useEffect, useMemo, useState } from "react";
import "./CompleteAppointmentModal.css";

const formatDateTimeInputValue = (timestamp) => {
  if (!timestamp) {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");

    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  const date = new Date(timestamp);
  const pad = (value) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const CompleteAppointmentModal = ({
  appointment,
  loading,
  onClose,
  onSubmit
}) => {
  const initialVisitDate = useMemo(
    () => formatDateTimeInputValue(appointment?.appointmentDateTime),
    [appointment?.appointmentDateTime]
  );

  const initialChiefComplaint = useMemo(
    () => appointment?.symptoms || "",
    [appointment?.symptoms]
  );

  const initialDoctorNotes = useMemo(
    () => appointment?.notes || "",
    [appointment?.notes]
  );

  const [createVisit, setCreateVisit] = useState(false);
  const [visitDate, setVisitDate] = useState(initialVisitDate);
  const [chiefComplaint, setChiefComplaint] = useState(initialChiefComplaint);
  const [doctorNotes, setDoctorNotes] = useState(initialDoctorNotes);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [loading, onClose]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!appointment || !appointment.id) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!createVisit) {
      await onSubmit({
        createVisit: false
      });
      return;
    }

    if (!visitDate) {
      setFormError("Visit date is required.");
      return;
    }

    if (!chiefComplaint.trim()) {
      setFormError("Chief complaint is required.");
      return;
    }

    if (!doctorNotes.trim()) {
      setFormError("Doctor notes are required.");
      return;
    }

    setFormError("");

    await onSubmit({
      createVisit: true,
      visitDate: new Date(visitDate).getTime(),
      chiefComplaint: chiefComplaint.trim(),
      doctorNotes: doctorNotes.trim()
    });
  };

  return (
    <div
      className="complete-appointment-modal-overlay"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="complete-appointment-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="complete-appointment-modal-header">
          <div>
            <p className="complete-modal-kicker">Appointment completion</p>
            <h2>Mark Appointment as Completed</h2>
            <p className="complete-modal-subtitle">
              {appointment.patientName || "Unknown Patient"} • {appointment.clinicName || "N/A"}
            </p>
          </div>

          <button
            type="button"
            className="complete-modal-close"
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form className="complete-appointment-form" onSubmit={handleSubmit}>
          <div className="complete-modal-section">
            <label className="complete-checkbox-label">
              <input
                type="checkbox"
                checked={createVisit}
                onChange={(event) => setCreateVisit(event.target.checked)}
                disabled={loading}
              />
              <span>Create visit record also</span>
            </label>
          </div>

          {createVisit && (
            <div className="complete-modal-section complete-visit-fields">
              <div className="complete-form-field">
                <label>Visit Date & Time</label>
                <input
                  type="datetime-local"
                  value={visitDate}
                  onChange={(event) => setVisitDate(event.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="complete-form-field">
                <label>Chief Complaint</label>
                <textarea
                  rows="3"
                  value={chiefComplaint}
                  onChange={(event) => setChiefComplaint(event.target.value)}
                  placeholder="Enter chief complaint"
                  disabled={loading}
                />
              </div>

              <div className="complete-form-field">
                <label>Doctor Notes</label>
                <textarea
                  rows="4"
                  value={doctorNotes}
                  onChange={(event) => setDoctorNotes(event.target.value)}
                  placeholder="Enter doctor notes"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {formError ? <p className="complete-form-error">{formError}</p> : null}

          <div className="complete-modal-actions">
            <button
              type="button"
              className="complete-modal-btn secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="complete-modal-btn primary"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : createVisit
                ? "Complete + Add Visit"
                : "Complete Only"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteAppointmentModal;