import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";

import {
  getAdminFeedbackById,
  getAdminFeedbacks,
  updateAdminFeedbackStatus
} from "../../services/adminService";

import "./FeedbackPage.css";

/* =========================================================
   CONSTANTS
========================================================= */

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "NEW", label: "New" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" }
];

const TYPE_OPTIONS = [
  { value: "ALL", label: "All categories" },
  { value: "APPOINTMENT", label: "Appointment" },
  { value: "CONSULTATION", label: "Consultation" },
  { value: "LAB_REPORTS", label: "Lab reports" },
  { value: "APP_EXPERIENCE", label: "App experience" },
  { value: "DOCTOR_EXPERIENCE", label: "Doctor experience" },
  { value: "HOSPITAL_SERVICE", label: "Hospital service" },
  { value: "PAYMENT_BILLING", label: "Payment & billing" },
  { value: "TECHNICAL_ISSUE", label: "Technical issue" },
  { value: "OTHER", label: "Other" }
];

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

/*
 * Must match backend status-transition rules.
 * Current status is also included separately so admin can update only the note.
 */
const STATUS_TRANSITIONS = {
  NEW: ["REVIEWED", "IN_PROGRESS", "RESOLVED", "CLOSED"],
  REVIEWED: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  IN_PROGRESS: ["REVIEWED", "RESOLVED", "CLOSED"],
  RESOLVED: ["IN_PROGRESS", "CLOSED"],
  CLOSED: ["IN_PROGRESS"]
};

/* =========================================================
   HELPERS
========================================================= */

const getOptionLabel = (options, value) => {
  return (
    options.find((option) => option.value === value)?.label ||
    value ||
    "Not available"
  );
};

const getErrorMessage = (error, fallback) => {
  const responseData = error?.response?.data;

  if (responseData?.message) {
    return responseData.message;
  }

  if (responseData && typeof responseData === "object") {
    const validationMessage = Object.values(responseData).find(
      (value) => typeof value === "string" && value.trim()
    );

    if (validationMessage) {
      return validationMessage;
    }
  }

  return error?.message || fallback;
};

const formatDateTime = (timestamp) => {
  if (!timestamp) {
    return "Not recorded";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const getInitials = (name) => {
  if (!name?.trim()) {
    return "PT";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
};

const getAvailableStatusOptions = (currentStatus) => {
  if (!currentStatus) {
    return STATUS_OPTIONS.filter((option) => option.value !== "ALL");
  }

  const allowedStatuses = STATUS_TRANSITIONS[currentStatus] || [];
  const values = new Set([currentStatus, ...allowedStatuses]);

  return STATUS_OPTIONS.filter(
    (option) => option.value !== "ALL" && values.has(option.value)
  );
};

const isValidFilterValue = (options, value) => {
  return options.some((option) => option.value === value);
};

const normalizeNote = (value) => {
  return value?.trim() || "";
};

/* =========================================================
   ICONS
========================================================= */

const FeedbackIcon = ({ name, size = 20 }) => {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  };

  switch (name) {
    case "message":
      return (
        <svg {...commonProps}>
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
          <path d="M8 8h8" />
          <path d="M8 12h5" />
        </svg>
      );

    case "inbox":
      return (
        <svg {...commonProps}>
          <path d="M4 4h16l2 9v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z" />
          <path d="M2 13h5l2 3h6l2-3h5" />
        </svg>
      );

    case "check":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.5 2.5L16 9" />
        </svg>
      );

    case "star":
      return (
        <svg {...commonProps}>
          <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z" />
        </svg>
      );

    case "refresh":
      return (
        <svg {...commonProps}>
          <path d="M20 6v5h-5" />
          <path d="M4 18v-5h5" />
          <path d="M18.5 9A7 7 0 0 0 6.2 6.2L4 8" />
          <path d="M5.5 15A7 7 0 0 0 17.8 17.8L20 16" />
        </svg>
      );

    case "eye":
      return (
        <svg {...commonProps}>
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );

    case "close":
      return (
        <svg {...commonProps}>
          <path d="m6 6 12 12" />
          <path d="m18 6-12 12" />
        </svg>
      );

    case "filter":
      return (
        <svg {...commonProps}>
          <path d="M4 5h16" />
          <path d="M7 12h10" />
          <path d="M10 19h4" />
        </svg>
      );

    case "chevronLeft":
      return (
        <svg {...commonProps}>
          <path d="m15 18-6-6 6-6" />
        </svg>
      );

    case "chevronRight":
      return (
        <svg {...commonProps}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );

    case "user":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );

    case "clock":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );

    default:
      return null;
  }
};

/* =========================================================
   COMPONENT
========================================================= */

const FeedbackPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialStatus = searchParams.get("status")?.toUpperCase() || "ALL";
  const initialType = searchParams.get("type")?.toUpperCase() || "ALL";

  const [feedbacks, setFeedbacks] = useState([]);

  const [filters, setFilters] = useState({
    status: isValidFilterValue(STATUS_OPTIONS, initialStatus)
      ? initialStatus
      : "ALL",
    type: isValidFilterValue(TYPE_OPTIONS, initialType)
      ? initialType
      : "ALL"
  });

  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0
  });

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const [statusForm, setStatusForm] = useState({
    status: "",
    adminNote: ""
  });

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");
  const [detailError, setDetailError] = useState("");
  const [detailSuccess, setDetailSuccess] = useState("");

  const requestSequenceRef = useRef(0);

  /* =========================================================
     DATA LOADING
  ========================================================= */

  const loadFeedbacks = useCallback(
    async ({ silent = false } = {}) => {
      const requestSequence = ++requestSequenceRef.current;

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setPageError("");

        const data = await getAdminFeedbacks({
          status: filters.status,
          type: filters.type,
          page: pagination.page,
          size: pagination.size
        });

        if (requestSequence !== requestSequenceRef.current) {
          return;
        }

        const responsePage = Number(data?.page ?? pagination.page);
        const responseTotalPages = Number(data?.totalPages ?? 0);

        /*
         * If a filtered update removes the final item from the current page,
         * automatically move back to the previous valid page.
         */
        if (
          responseTotalPages > 0 &&
          responsePage >= responseTotalPages &&
          pagination.page > 0
        ) {
          setPagination((previous) => ({
            ...previous,
            page: Math.max(responseTotalPages - 1, 0)
          }));

          return;
        }

        setFeedbacks(Array.isArray(data?.feedbacks) ? data.feedbacks : []);

        setPagination((previous) => ({
          ...previous,
          page: responsePage,
          size: Number(data?.size ?? previous.size),
          totalElements: Number(data?.totalElements ?? 0),
          totalPages: responseTotalPages
        }));
      } catch (error) {
        if (requestSequence !== requestSequenceRef.current) {
          return;
        }

        setPageError(
          getErrorMessage(error, "Unable to load patient feedback.")
        );
      } finally {
        if (requestSequence === requestSequenceRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [
      filters.status,
      filters.type,
      pagination.page,
      pagination.size
    ]
  );

  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  const loadFeedbackDetail = useCallback(async (feedbackId) => {
    try {
      setDetailLoading(true);
      setDetailError("");
      setDetailSuccess("");

      const data = await getAdminFeedbackById(feedbackId);

      setSelectedFeedback(data);

      setStatusForm({
        status: data?.status || "NEW",
        adminNote: data?.adminNote || ""
      });
    } catch (error) {
      setSelectedFeedback(null);

      setDetailError(
        getErrorMessage(error, "Unable to load feedback details.")
      );
    } finally {
      setDetailLoading(false);
    }
  }, []);

  /* =========================================================
     MODAL CONTROL
  ========================================================= */

  const closeDetails = useCallback(() => {
    if (updating) {
      return;
    }

    setIsDetailOpen(false);
    setSelectedFeedbackId(null);
    setSelectedFeedback(null);
    setDetailError("");
    setDetailSuccess("");
  }, [updating]);

  useEffect(() => {
    if (!isDetailOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape" && !updating) {
        closeDetails();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isDetailOpen, updating, closeDetails]);

  const handleViewDetails = async (feedbackId) => {
    setSelectedFeedbackId(feedbackId);
    setSelectedFeedback(null);
    setIsDetailOpen(true);

    await loadFeedbackDetail(feedbackId);
  };

  /* =========================================================
     FILTERS
  ========================================================= */

  const updateUrlFilters = (nextFilters) => {
    const nextParams = new URLSearchParams();

    if (nextFilters.status !== "ALL") {
      nextParams.set("status", nextFilters.status);
    }

    if (nextFilters.type !== "ALL") {
      nextParams.set("type", nextFilters.type);
    }

    setSearchParams(nextParams, { replace: true });
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    const nextFilters = {
      ...filters,
      [name]: value
    };

    setFilters(nextFilters);

    setPagination((previous) => ({
      ...previous,
      page: 0
    }));

    setPageSuccess("");
    setPageError("");

    updateUrlFilters(nextFilters);
  };

  const handlePageSizeChange = (event) => {
    const nextSize = Number(event.target.value);

    setPagination((previous) => ({
      ...previous,
      page: 0,
      size: nextSize
    }));
  };

  const handleResetFilters = () => {
    const nextFilters = {
      status: "ALL",
      type: "ALL"
    };

    setFilters(nextFilters);

    setPagination((previous) => ({
      ...previous,
      page: 0,
      size: 10
    }));

    setSearchParams({}, { replace: true });
    setPageError("");
    setPageSuccess("");
  };

  const handleRefresh = async () => {
    await loadFeedbacks({ silent: true });
  };

  /* =========================================================
     STATUS UPDATE
  ========================================================= */

  const handleStatusFormChange = (event) => {
    const { name, value } = event.target;

    setStatusForm((previous) => ({
      ...previous,
      [name]: value
    }));

    setDetailSuccess("");
    setDetailError("");
  };

  const isActionDirty = useMemo(() => {
    if (!selectedFeedback) {
      return false;
    }

    return (
      statusForm.status !== selectedFeedback.status ||
      normalizeNote(statusForm.adminNote) !==
      normalizeNote(selectedFeedback.adminNote)
    );
  }, [selectedFeedback, statusForm]);

  const availableStatusOptions = useMemo(() => {
    return getAvailableStatusOptions(selectedFeedback?.status);
  }, [selectedFeedback?.status]);

  const handleUpdateStatus = async (event) => {
    event.preventDefault();

    if (!selectedFeedback?.id) {
      setDetailError("Select a feedback record before updating it.");
      return;
    }

    if (!isActionDirty) {
      setDetailError("No status or admin-note changes were detected.");
      return;
    }

    try {
      setUpdating(true);
      setDetailError("");
      setDetailSuccess("");

      const updatedFeedback = await updateAdminFeedbackStatus(
        selectedFeedback.id,
        {
          status: statusForm.status,
          adminNote: normalizeNote(statusForm.adminNote) || null
        }
      );

      setSelectedFeedback(updatedFeedback);

      setStatusForm({
        status: updatedFeedback?.status || statusForm.status,
        adminNote: updatedFeedback?.adminNote || ""
      });

      setDetailSuccess("Feedback action saved successfully.");
      setPageSuccess("Feedback record updated successfully.");

      await loadFeedbacks({ silent: true });
    } catch (error) {
      setDetailError(
        getErrorMessage(error, "Unable to update feedback.")
      );
    } finally {
      setUpdating(false);
    }
  };

  /* =========================================================
     PAGINATION
  ========================================================= */

  const handlePageChange = (nextPage) => {
    if (
      nextPage < 0 ||
      nextPage >= pagination.totalPages ||
      nextPage === pagination.page
    ) {
      return;
    }

    setPagination((previous) => ({
      ...previous,
      page: nextPage
    }));

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  /* =========================================================
     PAGE STATISTICS
  ========================================================= */

  const pageStatistics = useMemo(() => {
    const newOnPage = feedbacks.filter(
      (feedback) => feedback.status === "NEW"
    ).length;

    const completedOnPage = feedbacks.filter(
      (feedback) =>
        feedback.status === "RESOLVED" ||
        feedback.status === "CLOSED"
    ).length;

    const ratedFeedback = feedbacks.filter(
      (feedback) =>
        feedback.rating !== null &&
        feedback.rating !== undefined
    );

    const averageRating =
      ratedFeedback.length > 0
        ? (
          ratedFeedback.reduce(
            (total, feedback) =>
              total + Number(feedback.rating || 0),
            0
          ) / ratedFeedback.length
        ).toFixed(1)
        : "—";

    return {
      totalMatching: pagination.totalElements,
      newOnPage,
      completedOnPage,
      averageRating
    };
  }, [feedbacks, pagination.totalElements]);

  const firstVisibleRecord =
    pagination.totalElements === 0
      ? 0
      : pagination.page * pagination.size + 1;

  const lastVisibleRecord = Math.min(
    (pagination.page + 1) * pagination.size,
    pagination.totalElements
  );

  const filtersActive =
    filters.status !== "ALL" ||
    filters.type !== "ALL" ||
    pagination.size !== 10;

  /* =========================================================
     MODAL
  ========================================================= */

  const detailModal =
    isDetailOpen && typeof document !== "undefined"
      ? createPortal(
        <div
          className="afp-modal-root"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !updating
            ) {
              closeDetails();
            }
          }}
        >
          <section
            className="afp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="afp-detail-title"
          >
            <header className="afp-modal-header">
              <div>
                <span className="afp-modal-eyebrow">
                  Feedback review
                </span>

                <h2 id="afp-detail-title">
                  {selectedFeedback?.feedbackNumber ||
                    "Feedback details"}
                </h2>

                <p>
                  {selectedFeedback
                    ? `Submitted ${formatDateTime(
                      selectedFeedback.createdAt
                    )}`
                    : "Loading the selected feedback record"}
                </p>
              </div>

              <button
                type="button"
                className="afp-icon-button"
                onClick={closeDetails}
                disabled={updating}
                aria-label="Close feedback details"
              >
                <FeedbackIcon name="close" size={20} />
              </button>
            </header>

            <div className="afp-modal-body">
              {detailLoading ? (
                <div className="afp-detail-loading">
                  <span className="afp-spinner" />
                  <strong>Loading feedback details</strong>
                  <p>Please wait while the record is retrieved.</p>
                </div>
              ) : detailError && !selectedFeedback ? (
                <div className="afp-detail-failed">
                  <div className="afp-empty-icon">
                    <FeedbackIcon name="message" size={24} />
                  </div>

                  <strong>Unable to open feedback</strong>
                  <p>{detailError}</p>

                  <button
                    type="button"
                    className="afp-secondary-button"
                    onClick={() =>
                      loadFeedbackDetail(selectedFeedbackId)
                    }
                  >
                    Try again
                  </button>
                </div>
              ) : selectedFeedback ? (
                <div className="afp-detail-content">
                  {detailError && (
                    <div className="afp-notice afp-notice--error">
                      <span>{detailError}</span>

                      <button
                        type="button"
                        onClick={() => setDetailError("")}
                        aria-label="Dismiss error"
                      >
                        <FeedbackIcon name="close" size={16} />
                      </button>
                    </div>
                  )}

                  {detailSuccess && (
                    <div className="afp-notice afp-notice--success">
                      <span>{detailSuccess}</span>

                      <button
                        type="button"
                        onClick={() => setDetailSuccess("")}
                        aria-label="Dismiss success message"
                      >
                        <FeedbackIcon name="close" size={16} />
                      </button>
                    </div>
                  )}

                  <div className="afp-detail-summary">
                    <div className="afp-patient-summary">
                      <div className="afp-avatar afp-avatar--large">
                        {getInitials(selectedFeedback.patientName)}
                      </div>

                      <div>
                        <span>Submitted by</span>
                        <strong>
                          {selectedFeedback.patientName ||
                            "Unknown patient"}
                        </strong>

                        <p>
                          {selectedFeedback.patientEmail ||
                            "Email unavailable"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`afp-status afp-status--${selectedFeedback.status?.toLowerCase()}`}
                    >
                      {getOptionLabel(
                        STATUS_OPTIONS,
                        selectedFeedback.status
                      )}
                    </span>
                  </div>

                  <div className="afp-detail-grid">
                    <section className="afp-detail-section">
                      <div className="afp-section-heading">
                        <FeedbackIcon name="user" size={18} />

                        <div>
                          <h3>Patient information</h3>
                          <p>Contact and profile details</p>
                        </div>
                      </div>

                      <div className="afp-information-grid">
                        <div className="afp-information-item">
                          <span>Full name</span>
                          <strong>
                            {selectedFeedback.patientName || "—"}
                          </strong>
                        </div>

                        <div className="afp-information-item">
                          <span>Mobile number</span>
                          <strong>
                            {selectedFeedback.patientMobile || "—"}
                          </strong>
                        </div>

                        <div className="afp-information-item afp-information-item--wide">
                          <span>Email address</span>
                          <strong>
                            {selectedFeedback.patientEmail || "—"}
                          </strong>
                        </div>

                        <div className="afp-information-item afp-information-item--wide">
                          <span>Location</span>
                          <strong>
                            {[
                              selectedFeedback.patientCity,
                              selectedFeedback.patientState
                            ]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </strong>
                        </div>
                      </div>
                    </section>

                    <section className="afp-detail-section">
                      <div className="afp-section-heading">
                        <FeedbackIcon name="message" size={18} />

                        <div>
                          <h3>Feedback information</h3>
                          <p>Category, rating and consent</p>
                        </div>
                      </div>

                      <div className="afp-information-grid">
                        <div className="afp-information-item">
                          <span>Category</span>
                          <strong>
                            {getOptionLabel(
                              TYPE_OPTIONS,
                              selectedFeedback.type
                            )}
                          </strong>
                        </div>

                        <div className="afp-information-item">
                          <span>Rating</span>
                          <strong className="afp-rating-detail">
                            {selectedFeedback.rating
                              ? `${selectedFeedback.rating} / 5`
                              : "Not rated"}
                          </strong>
                        </div>

                        <div className="afp-information-item">
                          <span>Contact allowed</span>
                          <strong>
                            {selectedFeedback.allowContact
                              ? "Yes"
                              : "No"}
                          </strong>
                        </div>

                        <div className="afp-information-item">
                          <span>Related page</span>
                          <strong>
                            {selectedFeedback.relatedPage || "—"}
                          </strong>
                        </div>
                      </div>
                    </section>
                  </div>

                  <section className="afp-detail-section">
                    <div className="afp-section-heading">
                      <FeedbackIcon name="message" size={18} />

                      <div>
                        <h3>Patient message</h3>
                        <p>Original feedback submitted by the patient</p>
                      </div>
                    </div>

                    <div className="afp-message-panel">
                      {selectedFeedback.message ||
                        "No message was provided."}
                    </div>
                  </section>

                  <section className="afp-detail-section">
                    <div className="afp-section-heading">
                      <FeedbackIcon name="clock" size={18} />

                      <div>
                        <h3>Activity timeline</h3>
                        <p>Status-processing timestamps</p>
                      </div>
                    </div>

                    <div className="afp-timeline">
                      <div className="afp-timeline-item afp-timeline-item--complete">
                        <span className="afp-timeline-dot" />

                        <div>
                          <strong>Submitted</strong>
                          <p>
                            {formatDateTime(
                              selectedFeedback.createdAt
                            )}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`afp-timeline-item ${selectedFeedback.reviewedAt
                            ? "afp-timeline-item--complete"
                            : ""
                          }`}
                      >
                        <span className="afp-timeline-dot" />

                        <div>
                          <strong>Reviewed</strong>
                          <p>
                            {formatDateTime(
                              selectedFeedback.reviewedAt
                            )}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`afp-timeline-item ${selectedFeedback.resolvedAt
                            ? "afp-timeline-item--complete"
                            : ""
                          }`}
                      >
                        <span className="afp-timeline-dot" />

                        <div>
                          <strong>Resolved</strong>
                          <p>
                            {formatDateTime(
                              selectedFeedback.resolvedAt
                            )}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`afp-timeline-item ${selectedFeedback.closedAt
                            ? "afp-timeline-item--complete"
                            : ""
                          }`}
                      >
                        <span className="afp-timeline-dot" />

                        <div>
                          <strong>Closed</strong>
                          <p>
                            {formatDateTime(
                              selectedFeedback.closedAt
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="afp-last-updated">
                      Last updated:{" "}
                      <strong>
                        {formatDateTime(selectedFeedback.updatedAt)}
                      </strong>
                    </p>
                  </section>

                  <form
                    className="afp-action-panel"
                    onSubmit={handleUpdateStatus}
                  >
                    <div className="afp-action-heading">
                      <div>
                        <span>Administrative action</span>
                        <h3>Update feedback workflow</h3>
                        <p>
                          Select a permitted status and maintain an
                          internal note for the admin team.
                        </p>
                      </div>

                      <span
                        className={`afp-status afp-status--${selectedFeedback.status?.toLowerCase()}`}
                      >
                        Current:{" "}
                        {getOptionLabel(
                          STATUS_OPTIONS,
                          selectedFeedback.status
                        )}
                      </span>
                    </div>

                    <div className="afp-form-grid">
                      <label className="afp-field">
                        <span>Status</span>

                        <select
                          name="status"
                          value={statusForm.status}
                          onChange={handleStatusFormChange}
                          disabled={updating}
                        >
                          {availableStatusOptions.map((status) => (
                            <option
                              key={status.value}
                              value={status.value}
                            >
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="afp-field afp-field--wide">
                        <span>Internal admin note</span>

                        <textarea
                          name="adminNote"
                          value={statusForm.adminNote}
                          onChange={handleStatusFormChange}
                          placeholder="Add investigation notes, resolution details or follow-up information..."
                          maxLength={3000}
                          disabled={updating}
                        />

                        <small>
                          {statusForm.adminNote.length} / 3000
                          characters
                        </small>
                      </label>
                    </div>

                    <div className="afp-action-footer">
                      <p>
                        Notes are internal and stored in the
                        administrative audit history.
                      </p>

                      <div>
                        <button
                          type="button"
                          className="afp-secondary-button"
                          onClick={closeDetails}
                          disabled={updating}
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          className="afp-primary-button"
                          disabled={updating || !isActionDirty}
                        >
                          {updating ? (
                            <>
                              <span className="afp-button-spinner" />
                              Saving
                            </>
                          ) : (
                            "Save changes"
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              ) : null}
            </div>
          </section>
        </div>,
        document.body
      )
      : null;

  return (
    <>
      <main className="afp-page">
        <header className="afp-page-header">
          <div>
            <span className="afp-eyebrow">
              Administration / Patient experience
            </span>

            <h1>Feedback management</h1>

            <p>
              Review patient feedback, manage resolution workflows and
              maintain a complete administrative audit trail.
            </p>
          </div>

          <button
            type="button"
            className="afp-refresh-button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            aria-label={
              refreshing
                ? "Refreshing feedback data"
                : "Refresh feedback data"
            }
            title={
              refreshing
                ? "Refreshing feedback data"
                : "Refresh feedback data"
            }
          >
            <FeedbackIcon name="refresh" size={18} />
            <span>{refreshing ? "Refreshing" : "Refresh data"}</span>
          </button>
        </header>

        <section className="afp-stat-grid">
          <article className="afp-stat-card">
            <div className="afp-stat-icon">
              <FeedbackIcon name="message" />
            </div>

            <div>
              <span>Matching records</span>
              <strong>{pageStatistics.totalMatching}</strong>
              <p>Based on active filters</p>
            </div>
          </article>

          <article className="afp-stat-card">
            <div className="afp-stat-icon">
              <FeedbackIcon name="inbox" />
            </div>

            <div>
              <span>New on this page</span>
              <strong>{pageStatistics.newOnPage}</strong>
              <p>Awaiting initial review</p>
            </div>
          </article>

          <article className="afp-stat-card">
            <div className="afp-stat-icon">
              <FeedbackIcon name="check" />
            </div>

            <div>
              <span>Completed on page</span>
              <strong>{pageStatistics.completedOnPage}</strong>
              <p>Resolved or closed</p>
            </div>
          </article>

          <article className="afp-stat-card">
            <div className="afp-stat-icon">
              <FeedbackIcon name="star" />
            </div>

            <div>
              <span>Page average</span>
              <strong>{pageStatistics.averageRating}</strong>
              <p>Out of five stars</p>
            </div>
          </article>
        </section>

        {pageError && (
          <div className="afp-notice afp-notice--error">
            <span>{pageError}</span>

            <button
              type="button"
              onClick={() => setPageError("")}
              aria-label="Dismiss error"
            >
              <FeedbackIcon name="close" size={16} />
            </button>
          </div>
        )}

        {pageSuccess && (
          <div className="afp-notice afp-notice--success">
            <span>{pageSuccess}</span>

            <button
              type="button"
              onClick={() => setPageSuccess("")}
              aria-label="Dismiss success message"
            >
              <FeedbackIcon name="close" size={16} />
            </button>
          </div>
        )}

        <section className="afp-content-card">
          <div className="afp-card-header">
            <div>
              <h2>Patient feedback</h2>

              <p>
                {pagination.totalElements} record
                {pagination.totalElements === 1 ? "" : "s"} found
              </p>
            </div>

            <div className="afp-filter-indicator">
              <FeedbackIcon name="filter" size={17} />
              <span>
                {filtersActive
                  ? "Custom filters active"
                  : "Showing all feedback"}
              </span>
            </div>
          </div>

          <div className="afp-filter-bar">
            <label className="afp-filter-field">
              <span>Status</span>

              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                disabled={loading}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="afp-filter-field">
              <span>Category</span>

              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                disabled={loading}
              >
                {TYPE_OPTIONS.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="afp-filter-field afp-filter-field--size">
              <span>Rows</span>

              <select
                value={pagination.size}
                onChange={handlePageSizeChange}
                disabled={loading}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="afp-reset-button"
              onClick={handleResetFilters}
              disabled={!filtersActive || loading}
            >
              Reset filters
            </button>
          </div>

          {loading ? (
            <div className="afp-loading-state">
              <span className="afp-spinner" />
              <strong>Loading feedback records</strong>
              <p>Retrieving the latest patient feedback.</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="afp-empty-state">
              <div className="afp-empty-icon">
                <FeedbackIcon name="message" size={25} />
              </div>

              <strong>No feedback records found</strong>

              <p>
                No records match the selected status and category
                filters.
              </p>

              {filtersActive && (
                <button
                  type="button"
                  className="afp-secondary-button"
                  onClick={handleResetFilters}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="afp-table-wrapper">
                <table className="afp-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Patient</th>
                      <th>Category</th>
                      <th>Rating</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>

                  <tbody>
                    {feedbacks.map((feedback) => (
                      <tr key={feedback.id}>
                        <td>
                          <div className="afp-reference-cell">
                            <strong>
                              {feedback.feedbackNumber}
                            </strong>

                            <p>{feedback.message}</p>
                          </div>
                        </td>

                        <td>
                          <div className="afp-patient-cell">
                            <div className="afp-avatar">
                              {getInitials(feedback.patientName)}
                            </div>

                            <div>
                              <strong>
                                {feedback.patientName || "Patient"}
                              </strong>

                              <span>
                                {feedback.patientEmail ||
                                  "Email unavailable"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="afp-category">
                            {getOptionLabel(
                              TYPE_OPTIONS,
                              feedback.type
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="afp-rating">
                            <FeedbackIcon name="star" size={15} />

                            <strong>
                              {feedback.rating
                                ? feedback.rating.toFixed?.(1) ||
                                feedback.rating
                                : "—"}
                            </strong>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`afp-status afp-status--${feedback.status?.toLowerCase()}`}
                          >
                            {getOptionLabel(
                              STATUS_OPTIONS,
                              feedback.status
                            )}
                          </span>
                        </td>

                        <td>
                          <span className="afp-date">
                            {formatDateTime(feedback.createdAt)}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="afp-view-button"
                            onClick={() =>
                              handleViewDetails(feedback.id)
                            }
                          >
                            <FeedbackIcon name="eye" size={17} />
                            <span>Review</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="afp-mobile-list">
                {feedbacks.map((feedback) => (
                  <article
                    key={feedback.id}
                    className="afp-mobile-card"
                  >
                    <div className="afp-mobile-card-header">
                      <div className="afp-patient-cell">
                        <div className="afp-avatar">
                          {getInitials(feedback.patientName)}
                        </div>

                        <div>
                          <strong>
                            {feedback.patientName || "Patient"}
                          </strong>

                          <span>
                            {feedback.feedbackNumber}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`afp-status afp-status--${feedback.status?.toLowerCase()}`}
                      >
                        {getOptionLabel(
                          STATUS_OPTIONS,
                          feedback.status
                        )}
                      </span>
                    </div>

                    <p className="afp-mobile-message">
                      {feedback.message}
                    </p>

                    <div className="afp-mobile-meta">
                      <span>
                        {getOptionLabel(
                          TYPE_OPTIONS,
                          feedback.type
                        )}
                      </span>

                      <span>
                        Rating:{" "}
                        {feedback.rating
                          ? `${feedback.rating}/5`
                          : "Not rated"}
                      </span>

                      <span>
                        {formatDateTime(feedback.createdAt)}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="afp-mobile-review-button"
                      onClick={() =>
                        handleViewDetails(feedback.id)
                      }
                    >
                      <FeedbackIcon name="eye" size={17} />
                      Review feedback
                    </button>
                  </article>
                ))}
              </div>

              <footer className="afp-pagination">
                <p>
                  Showing <strong>{firstVisibleRecord}</strong>–
                  <strong>{lastVisibleRecord}</strong> of{" "}
                  <strong>{pagination.totalElements}</strong>
                </p>

                <div className="afp-pagination-controls">
                  <button
                    type="button"
                    onClick={() =>
                      handlePageChange(pagination.page - 1)
                    }
                    disabled={pagination.page <= 0 || loading}
                    aria-label="Previous page"
                  >
                    <FeedbackIcon
                      name="chevronLeft"
                      size={18}
                    />
                  </button>

                  <span>
                    Page{" "}
                    <strong>
                      {pagination.totalPages === 0
                        ? 0
                        : pagination.page + 1}
                    </strong>{" "}
                    of <strong>{pagination.totalPages}</strong>
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      handlePageChange(pagination.page + 1)
                    }
                    disabled={
                      pagination.page + 1 >=
                      pagination.totalPages || loading
                    }
                    aria-label="Next page"
                  >
                    <FeedbackIcon
                      name="chevronRight"
                      size={18}
                    />
                  </button>
                </div>
              </footer>
            </>
          )}
        </section>
      </main>

      {detailModal}
    </>
  );
};

export default FeedbackPage;