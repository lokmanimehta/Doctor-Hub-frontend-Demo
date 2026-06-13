import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiMapPin,
  FiRefreshCw,
  FiSearch,
  FiUser,
  FiX
} from "react-icons/fi";
import "./MyDoctors.css";
import { getPatientPastConsultations } from "../../services/patientService";
import { useProfile } from "../../context/useProfile";

const safeText = (value, fallback = "Not available") => {
  if (value === null || value === undefined) {
    return fallback;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
};

const getDoctorDisplayName = (name) => {
  const cleanName = safeText(name, "Doctor unavailable");

  if (cleanName.toLowerCase().startsWith("dr.")) {
    return cleanName;
  }

  if (cleanName === "Doctor unavailable") {
    return cleanName;
  }

  return `Dr. ${cleanName}`;
};

const getInitials = (name = "") => {
  const cleanName = safeText(name, "Doctor").replace(/^dr\.?\s+/i, "");
  const parts = cleanName.split(" ").filter(Boolean);

  if (parts.length === 0) {
    return "DR";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "Date not available";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
};

const formatTime = (timeValue) => {
  if (!timeValue) {
    return "Time not available";
  }

  const [hours, minutes] = String(timeValue).split(":");

  if (hours === undefined || minutes === undefined) {
    return timeValue;
  }

  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  if (Number.isNaN(date.getTime())) {
    return timeValue;
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  })
    .format(date)
    .toUpperCase();
};

const formatSlot = (consultation) => {
  const start = formatTime(consultation?.slotStartTime);
  const end = consultation?.slotEndTime
    ? formatTime(consultation.slotEndTime)
    : null;

  return end ? `${start} - ${end}` : start;
};

const formatDateTime = (timestamp) => {
  if (!timestamp) {
    return "Not available";
  }

  const date = new Date(Number(timestamp));

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
};

const formatFee = (fee) => {
  if (fee === null || fee === undefined || fee === "") {
    return "Fee not available";
  }

  const amount = Number(fee);

  if (Number.isNaN(amount)) {
    return `₹${fee}`;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
};

const getSafeImageUrl = (url) => {
  if (!url || typeof url !== "string") {
    return "";
  }

  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return "";
  }

  const isLocalBrowser =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (!isLocalBrowser && trimmedUrl.includes("localhost:8080")) {
    return "";
  }

  return trimmedUrl;
};

const buildLocation = (consultation) => {
  if (consultation?.location) {
    return consultation.location;
  }

  const parts = [
    consultation?.area,
    consultation?.city,
    consultation?.state
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "Location unavailable";
};

const resolveSelectedProfile = (selectedProfile) => {
  if (!selectedProfile) {
    return {
      id: undefined,
      type: undefined,
      name: "All patient profiles",
      label: "All profiles"
    };
  }

  const id =
    selectedProfile.id ||
    selectedProfile.profileId ||
    selectedProfile.patientProfileId ||
    selectedProfile.memberId;

  const rawType =
    selectedProfile.profileType ||
    selectedProfile.type ||
    selectedProfile.patientProfileType ||
    selectedProfile.relation;

  let type = rawType ? String(rawType).toUpperCase() : undefined;

  if (type && type !== "SELF" && type !== "FAMILY") {
    type = type === "ME" ? "SELF" : "FAMILY";
  }

  const name =
    selectedProfile.fullName ||
    selectedProfile.name ||
    selectedProfile.patientName ||
    "Selected patient";

  const label = type ? `${name} • ${type}` : name;

  return {
    id,
    type,
    name,
    label
  };
};

const chunkItems = (items, size) => {
  const rows = [];

  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }

  return rows;
};

const MyDoctors = () => {
  const navigate = useNavigate();
  const profileContext = useProfile();
  const selectedProfile = profileContext?.selectedProfile || null;

  const [consultations, setConsultations] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [pageError, setPageError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [toast, setToast] = useState(null);

  const activeProfile = useMemo(
    () => resolveSelectedProfile(selectedProfile),
    [selectedProfile]
  );

  const showToast = useCallback((type, title, message = "") => {
    setToast({
      id: Date.now(),
      type,
      title,
      message
    });
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 4200);

    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (selectedConsultation) {
      const oldOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = oldOverflow;
      };
    }

    return undefined;
  }, [selectedConsultation]);

  const fetchPastConsultations = useCallback(
    async ({ manual = false } = {}) => {
      if (manual) {
        setRefreshing(true);
      }

      setPageError("");

      try {
        const shouldSendProfile =
          activeProfile?.id !== undefined &&
          activeProfile?.id !== null &&
          activeProfile?.type;

        const response = await getPatientPastConsultations({
          profileId: shouldSendProfile ? activeProfile.id : undefined,
          profileType: shouldSendProfile ? activeProfile.type : undefined,
          search: search.trim()
        });

        const list = Array.isArray(response?.consultations)
          ? response.consultations
          : [];

        setConsultations(list);
        setTotalCount(response?.totalCount ?? list.length);

        if (manual) {
          showToast(
            "success",
            "Past consultations refreshed",
            "Latest completed consultations have been loaded."
          );
        }
      } catch (error) {
        setConsultations([]);
        setTotalCount(0);
        setPageError(
          error?.message || "Unable to load past consultations right now."
        );

        if (manual) {
          showToast(
            "error",
            "Refresh failed",
            error?.message || "Unable to refresh consultations."
          );
        }
      } finally {
        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [activeProfile?.id, activeProfile?.type, search, showToast]
  );

  useEffect(() => {
    const debounce = window.setTimeout(() => {
      fetchPastConsultations();
    }, 320);

    return () => window.clearTimeout(debounce);
  }, [fetchPastConsultations]);

  const rows = useMemo(() => {
    return chunkItems(consultations, 10);
  }, [consultations]);

  const completedWithVisitCount = useMemo(() => {
    return consultations.filter((item) => Boolean(item?.hasVisit)).length;
  }, [consultations]);

  const withPrescriptionCount = useMemo(() => {
    return consultations.filter((item) => Boolean(item?.hasPrescription)).length;
  }, [consultations]);

  const handleManualRefresh = () => {
    fetchPastConsultations({ manual: true });
  };

  const handleReset = () => {
    setSearch("");
    showToast("success", "Search cleared", "Past consultations list reset.");
  };

  const handleBookFollowUp = (consultation) => {
    if (!consultation?.doctorProfileId) {
      showToast(
        "error",
        "Doctor unavailable",
        "This consultation does not have a valid doctor profile."
      );
      return;
    }

    navigate(`/patient/finddoctors?doctorProfileId=${consultation.doctorProfileId}`);
  };

  const handleViewFullProfile = (consultation) => {
    if (!consultation?.doctorProfileId) {
      showToast(
        "error",
        "Profile unavailable",
        "Doctor profile is not available for this consultation."
      );
      return;
    }

    navigate(`/patient/doctorsprofile/${consultation.doctorProfileId}`);
  };

  const renderAvatar = (consultation, className = "pcx-avatar") => {
    const imageUrl = getSafeImageUrl(consultation?.doctorImageUrl);
    const doctorName = getDoctorDisplayName(consultation?.doctorName);

    return (
      <div className={className}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={doctorName}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : null}
        <span>{getInitials(doctorName)}</span>
      </div>
    );
  };

  const renderState = () => {
    if (initialLoading) {
      return (
        <div className="pcx-state-card">
          <FiRefreshCw className="pcx-spin" />
          <h3>Loading past consultations</h3>
          <p>Please wait while we fetch your completed consultations.</p>
        </div>
      );
    }

    if (pageError) {
      return (
        <div className="pcx-state-card">
          <FiAlertCircle />
          <h3>Unable to load consultations</h3>
          <p>{pageError}</p>
          <button type="button" onClick={handleManualRefresh}>
            Try Again
          </button>
        </div>
      );
    }

    if (consultations.length === 0) {
      return (
        <div className="pcx-state-card">
          <FiFileText />
          <h3>No past consultations yet</h3>
          <p>
            Completed doctor consultations will appear here after your doctor
            marks an appointment as completed.
          </p>
          <button
            type="button"
            onClick={() => navigate("/patient/finddoctors")}
          >
            Find Doctors
          </button>
        </div>
      );
    }

    return null;
  };

  const stateView = renderState();

  return (
    <div className="pcx-page">
      <div className="pcx-shell">
        <section className="pcx-header-card">
          <div className="pcx-title-block">
            <span>Patient care history</span>
            <h1>Past Consultations</h1>
            <p>
              Review your completed doctor consultations, clinic details, visit
              status, notes and follow-up actions in one clean timeline.
            </p>
          </div>

          <button
            type="button"
            className="pcx-refresh-btn"
            onClick={handleManualRefresh}
            disabled={refreshing}
          >
            <FiRefreshCw className={refreshing ? "pcx-spin" : ""} />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
        </section>

        <section className="pcx-summary-grid">
          <div className="pcx-summary-card">
            <span>Total completed</span>
            <strong>{totalCount}</strong>
            <small>Consultations</small>
          </div>

          <div className="pcx-summary-card">
            <span>Visit linked</span>
            <strong>{completedWithVisitCount}</strong>
            <small>Doctor visit records</small>
          </div>

          <div className="pcx-summary-card">
            <span>Prescription</span>
            <strong>{withPrescriptionCount}</strong>
            <small>Available now</small>
          </div>

          <div className="pcx-summary-card">
            <span>Profile</span>
            <strong>{activeProfile.name}</strong>
            <small>{activeProfile.label}</small>
          </div>
        </section>

        <section className="pcx-filter-card">
          <div className="pcx-search-box">
            <FiSearch />
            <input
              type="text"
              value={search}
              placeholder="Search by doctor, specialty, clinic, city, notes..."
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <button
            type="button"
            className="pcx-reset-btn"
            onClick={handleReset}
            disabled={!search}
          >
            Clear
          </button>
        </section>

        {!stateView && (
          <section className="pcx-content">
            {rows.map((row, rowIndex) => (
              <div className="pcx-row" key={`consultation-row-${rowIndex}`}>
                {row.map((consultation) => {
                  const doctorName = getDoctorDisplayName(
                    consultation?.doctorName
                  );
                  const location = buildLocation(consultation);

                  return (
                    <article
                      className="pcx-card"
                      key={consultation.id}
                      onClick={() => setSelectedConsultation(consultation)}
                    >
                      <div className="pcx-card-top">
                        {renderAvatar(consultation)}

                        <div className="pcx-card-main">
                          <div className="pcx-title-row">
                            <div>
                              <h2>{doctorName}</h2>
                              <p>{safeText(consultation?.specialty, "General Physician")}</p>
                            </div>

                            <span className="pcx-status">
                              <FiCheckCircle />
                              Completed
                            </span>
                          </div>

                          <div className="pcx-clinic">
                            <FiMapPin />
                            <span>{safeText(consultation?.clinicName, "Clinic unavailable")}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pcx-info-grid">
                        <div>
                          <FiCalendar />
                          <span>{formatDate(consultation?.appointmentDate)}</span>
                        </div>

                        <div>
                          <FiClock />
                          <span>{formatSlot(consultation)}</span>
                        </div>

                        <div>
                          <FiMapPin />
                          <span>{location}</span>
                        </div>

                        <div>
                          <FiUser />
                          <span>
                            {consultation?.experienceYears
                              ? `${consultation.experienceYears}+ yrs exp`
                              : "Experience N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="pcx-fee-row">
                        <div>
                          <span>Consultation fee</span>
                          <strong>{formatFee(consultation?.fee)}</strong>
                        </div>

                        <small>
                          Completed at{" "}
                          {consultation?.completedAt
                            ? formatDateTime(consultation.completedAt)
                            : "clinic"}
                        </small>
                      </div>

                      <div className="pcx-feature-row">
                        <span className={consultation?.hasVisit ? "active" : ""}>
                          Visit {consultation?.hasVisit ? "linked" : "pending"}
                        </span>
                        <span className={consultation?.hasPrescription ? "active" : ""}>
                          Prescription{" "}
                          {consultation?.hasPrescription ? "ready" : "soon"}
                        </span>
                        <span className={consultation?.hasReports ? "active" : ""}>
                          Reports {consultation?.hasReports ? "ready" : "soon"}
                        </span>
                      </div>

                      <div className="pcx-notes">
                        <span>Patient notes</span>
                        <p>{safeText(consultation?.notes, "No notes added.")}</p>
                      </div>

                      <div className="pcx-actions">
                        <button
                          type="button"
                          className="pcx-btn pcx-btn-primary"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedConsultation(consultation);
                          }}
                        >
                          View Summary
                        </button>

                        <button
                          type="button"
                          className="pcx-btn pcx-btn-soft"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleBookFollowUp(consultation);
                          }}
                        >
                          Book Follow-up
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ))}
          </section>
        )}

        {stateView}

        {selectedConsultation && (
          <div
            className="pcx-modal-overlay"
            onClick={() => setSelectedConsultation(null)}
          >
            <section
              className="pcx-modal"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Past consultation summary"
            >
              <button
                type="button"
                className="pcx-modal-close"
                onClick={() => setSelectedConsultation(null)}
                aria-label="Close consultation summary"
              >
                <FiX />
              </button>

              <div className="pcx-modal-scroll">
                <div className="pcx-modal-head">
                  {renderAvatar(selectedConsultation, "pcx-modal-avatar")}

                  <div>
                    <span>Completed consultation</span>
                    <h2>
                      {getDoctorDisplayName(selectedConsultation?.doctorName)}
                    </h2>
                    <p>
                      {safeText(
                        selectedConsultation?.specialty,
                        "General Physician"
                      )}
                    </p>
                  </div>
                </div>

                <div className="pcx-modal-status-row">
                  <span>
                    <FiCheckCircle />
                    Status: Completed
                  </span>
                  <span>
                    <FiCalendar />
                    {formatDate(selectedConsultation?.appointmentDate)}
                  </span>
                  <span>
                    <FiClock />
                    {formatSlot(selectedConsultation)}
                  </span>
                </div>

                <div className="pcx-detail-grid">
                  <div>
                    <span>Clinic</span>
                    <strong>
                      {safeText(
                        selectedConsultation?.clinicName,
                        "Clinic unavailable"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Location</span>
                    <strong>{buildLocation(selectedConsultation)}</strong>
                  </div>

                  <div>
                    <span>Clinic contact</span>
                    <strong>
                      {safeText(
                        selectedConsultation?.clinicContactNumber,
                        "Not available"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Fee</span>
                    <strong>{formatFee(selectedConsultation?.fee)}</strong>
                  </div>

                  <div>
                    <span>Patient profile</span>
                    <strong>
                      {safeText(
                        selectedConsultation?.patientProfileType,
                        "Not available"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Completed at</span>
                    <strong>
                      {formatDateTime(selectedConsultation?.completedAt)}
                    </strong>
                  </div>

                  <div>
                    <span>Visit ID</span>
                    <strong>
                      {selectedConsultation?.doctorPatientVisitId || "Not linked"}
                    </strong>
                  </div>

                  <div>
                    <span>Appointment ID</span>
                    <strong>
                      {selectedConsultation?.patientPublicAppointmentId ||
                        selectedConsultation?.id ||
                        "Not available"}
                    </strong>
                  </div>
                </div>

                <div className="pcx-summary-box">
                  <span>Patient notes</span>
                  <p>{safeText(selectedConsultation?.notes, "No notes added.")}</p>
                </div>

                <div className="pcx-summary-box">
                  <span>Doctor response note</span>
                  <p>
                    {safeText(
                      selectedConsultation?.doctorResponseNote,
                      "No doctor response note added."
                    )}
                  </p>
                </div>

                <div className="pcx-modal-feature-grid">
                  <div className={selectedConsultation?.hasVisit ? "active" : ""}>
                    <strong>Visit details</strong>
                    <span>
                      {selectedConsultation?.hasVisit
                        ? "Linked"
                        : "Not linked yet"}
                    </span>
                  </div>

                  <div
                    className={
                      selectedConsultation?.hasPrescription ? "active" : ""
                    }
                  >
                    <strong>Prescription</strong>
                    <span>
                      {selectedConsultation?.hasPrescription
                        ? "Available"
                        : "Coming soon"}
                    </span>
                  </div>

                  <div className={selectedConsultation?.hasReports ? "active" : ""}>
                    <strong>Reports</strong>
                    <span>
                      {selectedConsultation?.hasReports
                        ? "Available"
                        : "Coming soon"}
                    </span>
                  </div>
                </div>

                <div className="pcx-modal-actions">
                  <button
                    type="button"
                    className="pcx-btn pcx-btn-primary"
                    onClick={() => handleBookFollowUp(selectedConsultation)}
                  >
                    Book Follow-up
                  </button>

                  <button
                    type="button"
                    className="pcx-btn pcx-btn-soft"
                    onClick={() => handleViewFullProfile(selectedConsultation)}
                  >
                    View Doctor Profile
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {toast && (
          <div className={`pcx-toast pcx-toast-${toast.type}`}>
            <strong>{toast.title}</strong>
            {toast.message ? <span>{toast.message}</span> : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDoctors;