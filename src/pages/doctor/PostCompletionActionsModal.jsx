import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./PostCompletionActionsModal.css";

const PostCompletionActionsModal = ({ context, onClose }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!context) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow || "auto";
    };
  }, [context]);

  if (!context) return null;

  const goToPatientTab = (tab) => {
    const params = new URLSearchParams();
    params.set("tab", tab);

    if (tab === "visits" && context.createdVisitId) {
      params.set("highlight", context.createdVisitId);
    }

    if (context.createdVisitId) {
      params.set("linkedVisitId", context.createdVisitId);
    }

    navigate(`/doctor/patients/${context.patientId}?${params.toString()}`);
    onClose();
  };

  return (
    <div className="post-complete-overlay" onClick={onClose}>
      <div
        className="post-complete-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="post-complete-header">
          <p className="post-complete-eyebrow">Consultation next steps</p>
          <h3>What would you like to do next?</h3>
          <p className="post-complete-subtext">
            Appointment completed successfully. You can continue the clinical workflow from here.
          </p>
        </div>

        <div className="post-complete-actions">
          {context.canCreatePrescription && (
            <button type="button" onClick={() => goToPatientTab("prescriptions")}>
              Create Prescription
            </button>
          )}

          {context.canUploadReport && (
            <button type="button" onClick={() => goToPatientTab("reports")}>
              Upload Report
            </button>
          )}

          {context.canAddDoctorNote && (
            <button type="button" onClick={() => goToPatientTab("notes")}>
              Add Doctor Note
            </button>
          )}

          {context.canScheduleFollowUp && (
            <button type="button" onClick={() => goToPatientTab("appointments")}>
              Schedule Follow-up
            </button>
          )}

          <button type="button" onClick={() => goToPatientTab("visits")}>
            View Patient Visit
          </button>
        </div>

        <div className="post-complete-footer">
          <button type="button" onClick={onClose}>
            Done for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCompletionActionsModal;