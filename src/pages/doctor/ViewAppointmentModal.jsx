import React, { useEffect } from "react";
import "./ViewAppointmentModal.css";

const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";

  return new Date(timestamp).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
};

const formatTime = (timestamp) => {
  if (!timestamp) return "N/A";

  return new Date(timestamp).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};

const ViewAppointmentModal = ({
  appointment,
  onClose,
  onCancel,
  onMarkNoShow,
  onMarkCompleted,
  actionLoadingId
}) => {
  useEffect(() => {
    if (!appointment) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [appointment, onClose]);

  useEffect(() => {
    if (!appointment) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [appointment]);

  if (!appointment) return null;

  const isActionLoading = actionLoadingId === appointment.id;
  const isScheduled = appointment.status === "SCHEDULED";
  const isCompleted = appointment.status === "COMPLETED";
  const isCancelled = appointment.status === "CANCELLED";
  const isNoShow = appointment.status === "NO_SHOW";

  return (
    <div
      className="appointment-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="appointment-modal-title"
    >
      <div
        className="appointment-modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="appointment-modal-header">
          <div className="appointment-modal-header-left">
            <span className="appointment-modal-kicker">Appointment overview</span>

            <div className="appointment-modal-title-row">
              <h2 id="appointment-modal-title" className="appointment-modal-title">
                {appointment.patientName || "Unknown Patient"}
              </h2>

              <span
                className={`appointment-modal-status ${
                  appointment.status?.toLowerCase().replace("_", "-") || ""
                }`}
              >
                {appointment.status || "N/A"}
              </span>
            </div>

            <p className="appointment-modal-subtitle">
              {appointment.patientPhone || "No phone available"}
            </p>
          </div>

          <button
            type="button"
            className="appointment-modal-close"
            onClick={onClose}
            aria-label="Close appointment details"
          >
            <span>×</span>
          </button>
        </div>

        <div className="appointment-modal-body">
          <div className="appointment-summary-grid">
            <div className="appointment-summary-card">
              <span className="summary-label">Clinic</span>
              <span className="summary-value">
                {appointment.clinicName || "N/A"}
              </span>
            </div>

            <div className="appointment-summary-card">
              <span className="summary-label">Date</span>
              <span className="summary-value">
                {formatDate(appointment.appointmentDateTime)}
              </span>
            </div>

            <div className="appointment-summary-card">
              <span className="summary-label">Time</span>
              <span className="summary-value">
                {formatTime(appointment.appointmentDateTime)}
              </span>
            </div>

            <div className="appointment-summary-card">
              <span className="summary-label">Critical</span>
              <span
                className={`critical-chip ${
                  appointment.isCritical ? "critical-yes" : "critical-no"
                }`}
              >
                {appointment.isCritical ? "Yes" : "No"}
              </span>
            </div>
          </div>

          <div className="appointment-content-grid">
            <section className="appointment-content-card">
              <div className="appointment-content-card-header">
                <h3>Symptoms</h3>
              </div>

              <div className="appointment-content-text">
                {appointment.symptoms || "No symptoms added for this appointment."}
              </div>
            </section>

            <section className="appointment-content-card">
              <div className="appointment-content-card-header">
                <h3>Notes</h3>
              </div>

              <div className="appointment-content-text">
                {appointment.notes || "No appointment notes available."}
              </div>
            </section>
          </div>

          {isCompleted && (
            <div className="appointment-modal-info-banner success">
              This appointment has already been marked as completed.
            </div>
          )}

          {isCancelled && (
            <div className="appointment-modal-info-banner danger">
              This appointment has already been cancelled.
            </div>
          )}

          {isNoShow && (
            <div className="appointment-modal-info-banner warning">
              This appointment has already been marked as no show.
            </div>
          )}
        </div>

        <div className="appointment-modal-footer">
          <button
            type="button"
            className="appointment-footer-btn secondary"
            onClick={onClose}
          >
            Close
          </button>

          {isScheduled && (
            <div className="appointment-footer-actions">
              <button
                type="button"
                className="appointment-footer-btn danger"
                disabled={isActionLoading}
                onClick={() => onCancel?.(appointment.id)}
              >
                {isActionLoading ? "Updating..." : "Cancel Appointment"}
              </button>

              <button
                type="button"
                className="appointment-footer-btn warning"
                disabled={isActionLoading}
                onClick={() => onMarkNoShow?.(appointment.id)}
              >
                {isActionLoading ? "Updating..." : "Mark No Show"}
              </button>

              <button
                type="button"
                className="appointment-footer-btn success"
                disabled={isActionLoading}
                onClick={() => onMarkCompleted?.(appointment)}
              >
                {isActionLoading ? "Updating..." : "Mark Completed"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewAppointmentModal;