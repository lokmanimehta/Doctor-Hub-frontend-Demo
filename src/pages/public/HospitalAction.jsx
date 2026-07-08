import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  confirmHospitalAction,
  getHospitalActionDetails,
  rejectHospitalAction
} from "../../services/hospitalActionService";
import "./HospitalAction.css";

const getErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again."
) => {
  const data = error?.response?.data;

  if (typeof data === "string") {
    return data;
  }

  return data?.message || data?.error || error?.message || fallback;
};

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
};

const formatTime = (value) => {
  if (!value) {
    return "--";
  }

  const [hourText, minuteText] = String(value).split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText || 0);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return value;
  }

  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const getStatusClassName = (status) => {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "confirmed") {
    return "confirmed";
  }

  if (normalized === "rejected") {
    return "rejected";
  }

  if (normalized === "requested") {
    return "requested";
  }

  return "neutral";
};

export default function HospitalAction() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [decisionType, setDecisionType] = useState("confirm");
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [decisionResult, setDecisionResult] = useState(null);

  const statusClassName = useMemo(() => {
    return getStatusClassName(decisionResult?.status || details?.status);
  }, [decisionResult, details]);

  const canTakeAction = useMemo(() => {
    return !decisionResult && details?.status === "REQUESTED";
  }, [decisionResult, details]);

  const selectedActionCopy = useMemo(() => {
    if (decisionType === "confirm") {
      return {
        title: "Confirm bed availability",
        description:
          "Confirm this request only if the selected bed type and time slot can be handled by your hospital.",
        button: "Confirm request",
        placeholder:
          "Example: Bed is available. Please ask the patient to report 15 minutes before the selected time."
      };
    }

    return {
      title: "Reject / cannot confirm",
      description:
        "Use this option if the selected bed, department, date or time is not available.",
      button: "Reject request",
      placeholder:
        "Example: Selected bed is not available for this time. Please choose another slot or contact hospital support."
    };
  }, [decisionType]);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setLoading(true);
        setPageError("");

        if (!token) {
          setPageError("Hospital action token is missing.");
          return;
        }

        const data = await getHospitalActionDetails(token);
        setDetails(data);

        if (data?.hospitalResponseNote) {
          setNote(data.hospitalResponseNote);
        }
      } catch (error) {
        setPageError(
          getErrorMessage(
            error,
            "This hospital action link is invalid, expired, or already used."
          )
        );
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [token]);

  const handleDecision = async () => {
    if (!token || !details) {
      return;
    }

    setNoteError("");

    const cleanNote = note.trim();

    if (decisionType === "reject" && !cleanNote) {
      setNoteError("Please enter a reason before rejecting this request.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        note: cleanNote
      };

      const response =
        decisionType === "confirm"
          ? await confirmHospitalAction(token, payload)
          : await rejectHospitalAction(token, payload);

      setDecisionResult(response);
      setDetails((current) => ({
        ...current,
        status: response.status,
        hospitalResponseNote: response.hospitalResponseNote
      }));
    } catch (error) {
      setPageError(
        getErrorMessage(error, "Unable to submit this hospital decision.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = async () => {
    try {
      setLoading(true);
      setPageError("");
      setDecisionResult(null);

      const data = await getHospitalActionDetails(token);
      setDetails(data);
    } catch (error) {
      setPageError(
        getErrorMessage(
          error,
          "This hospital action link is invalid, expired, or already used."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ha-page">
      <main className="ha-shell">
        <section className="ha-brand-card">
          <div>
            <span className="ha-kicker">Sucura</span>
            <h1>Hospital request review</h1>
            <p>
              Review the patient’s hospital bed request and submit the final
              availability decision.
            </p>
          </div>

          <div className={`ha-status-pill ${statusClassName}`}>
            {decisionResult?.status || details?.status || "Loading"}
          </div>
        </section>

        {loading && (
          <section className="ha-state-card">
            <div className="ha-spinner"></div>
            <h2>Loading request details</h2>
            <p>Please wait while we verify this secure hospital link.</p>
          </section>
        )}

        {!loading && pageError && (
          <section className="ha-state-card error">
            <div className="ha-state-icon">!</div>
            <h2>Unable to open request</h2>
            <p>{pageError}</p>

            <div className="ha-state-actions">
              <button type="button" onClick={handleRetry}>
                Try again
              </button>

              <button type="button" className="secondary" onClick={() => navigate("/")}>
                Go to home
              </button>
            </div>
          </section>
        )}

        {!loading && !pageError && details && (
          <>
            {decisionResult && (
              <section className={`ha-result-card ${statusClassName}`}>
                <div className="ha-result-mark">
                  {decisionResult.status === "CONFIRMED" ? "✓" : "×"}
                </div>

                <div>
                  <h2>
                    {decisionResult.status === "CONFIRMED"
                      ? "Request confirmed"
                      : "Request rejected"}
                  </h2>
                  <p>{decisionResult.message}</p>
                </div>
              </section>
            )}

            <section className="ha-content-grid">
              <div className="ha-details-card">
                <div className="ha-card-head">
                  <span>Request details</span>
                  <h2>{details.hospitalName}</h2>
                  <p>
                    Appointment No:{" "}
                    <strong>{details.appointmentNumber || "Not available"}</strong>
                  </p>
                </div>

                <div className="ha-info-grid">
                  <div className="ha-info-item">
                    <span>Patient</span>
                    <strong>{details.patientName || "Patient"}</strong>
                  </div>

                  <div className="ha-info-item">
                    <span>Profile Type</span>
                    <strong>{details.patientProfileType || "SELF"}</strong>
                  </div>

                  <div className="ha-info-item">
                    <span>Department</span>
                    <strong>{details.departmentName || "Not available"}</strong>
                  </div>

                  <div className="ha-info-item">
                    <span>Bed Type</span>
                    <strong>{details.bedType || "Not available"}</strong>
                  </div>

                  <div className="ha-info-item">
                    <span>Date</span>
                    <strong>{formatDate(details.appointmentDate)}</strong>
                  </div>

                  <div className="ha-info-item">
                    <span>Time</span>
                    <strong>
                      {formatTime(details.slotStartTime)} -{" "}
                      {formatTime(details.slotEndTime)}
                    </strong>
                  </div>
                </div>

                <div className="ha-note-block">
                  <span>Reason</span>
                  <p>{details.reason || "No reason provided."}</p>
                </div>

                <div className="ha-note-block">
                  <span>Patient Note</span>
                  <p>{details.patientNote || "No patient note provided."}</p>
                </div>

                {details.hospitalResponseNote && (
                  <div className="ha-note-block response">
                    <span>Hospital Response</span>
                    <p>{details.hospitalResponseNote}</p>
                  </div>
                )}
              </div>

              <aside className="ha-action-card">
                {canTakeAction ? (
                  <>
                    <div className="ha-card-head compact">
                      <span>Decision</span>
                      <h2>Submit availability update</h2>
                      <p>
                        Your decision will update the patient request and send
                        an email notification to the patient.
                      </p>
                    </div>

                    <div className="ha-choice-row">
                      <button
                        type="button"
                        className={decisionType === "confirm" ? "active" : ""}
                        onClick={() => {
                          setDecisionType("confirm");
                          setNoteError("");
                        }}
                      >
                        <strong>Confirm</strong>
                        <span>Bed is available</span>
                      </button>

                      <button
                        type="button"
                        className={decisionType === "reject" ? "active reject" : ""}
                        onClick={() => {
                          setDecisionType("reject");
                          setNoteError("");
                        }}
                      >
                        <strong>Reject</strong>
                        <span>Cannot confirm</span>
                      </button>
                    </div>

                    <div className="ha-decision-copy">
                      <h3>{selectedActionCopy.title}</h3>
                      <p>{selectedActionCopy.description}</p>
                    </div>

                    <div className="ha-form-group">
                      <label>
                        Hospital note
                        {decisionType === "reject" && <em>Required</em>}
                      </label>

                      <textarea
                        value={note}
                        rows="6"
                        placeholder={selectedActionCopy.placeholder}
                        onChange={(event) => {
                          setNote(event.target.value);
                          setNoteError("");
                        }}
                      />

                      {noteError && <small>{noteError}</small>}
                    </div>

                    <button
                      type="button"
                      className={`ha-submit-btn ${
                        decisionType === "reject" ? "danger" : ""
                      }`}
                      disabled={submitting}
                      onClick={handleDecision}
                    >
                      {submitting ? "Submitting..." : selectedActionCopy.button}
                    </button>

                    <p className="ha-security-note">
                      This link is secure and single-use. Once submitted, the
                      same link cannot be used again.
                    </p>
                  </>
                ) : (
                  <div className={`ha-closed-card ${statusClassName}`}>
                    <div>{details.status === "CONFIRMED" ? "✓" : "i"}</div>

                    <h2>Request already handled</h2>

                    <p>
                      This request status is currently{" "}
                      <strong>{details.status}</strong>. No further action is
                      available from this link.
                    </p>

                    {details.hospitalResponseNote && (
                      <blockquote>{details.hospitalResponseNote}</blockquote>
                    )}

                    <button type="button" onClick={() => navigate("/")}>
                      Go to Sucura
                    </button>
                  </div>
                )}
              </aside>
            </section>
          </>
        )}
      </main>
    </div>
  );
}