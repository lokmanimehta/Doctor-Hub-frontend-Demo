import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  FiAlertTriangle,
  FiCalendar,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiEye,
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiX
} from "react-icons/fi";

import { useSearchParams } from "react-router-dom";

import ViewAppointmentModal from "./ViewAppointmentModal";
import CompleteAppointmentModal from "./CompleteAppointmentModal";

import { useNotifications } from "../../context/useNotifications";

import {
  getAllDoctorAppointments,
  cancelPatientAppointment,
  markAppointmentNoShow,
  markAppointmentCompleted,
  acceptDoctorAppointmentRequest,
  rejectDoctorAppointmentRequest
} from "../../services/doctorService";

import "./Appointments.css";

const PAGE_SIZE = 10;
const AUTO_REFRESH_INTERVAL = 10000;

const STATUS_OPTIONS = [
  "ALL",
  "REQUESTED",
  "SCHEDULED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW"
];

const REVIEW_STATUSES = new Set([
  "REQUESTED",
  "PENDING",
  "RESCHEDULED"
]);

const STATUS_META = {
  REQUESTED: {
    label: "Action required",
    className: "requested"
  },
  PENDING: {
    label: "Action required",
    className: "requested"
  },
  RESCHEDULED: {
    label: "Rescheduled",
    className: "rescheduled"
  },
  SCHEDULED: {
    label: "Scheduled",
    className: "scheduled"
  },
  COMPLETED: {
    label: "Completed",
    className: "completed"
  },
  CANCELLED: {
    label: "Cancelled",
    className: "cancelled"
  },
  REJECTED: {
    label: "Rejected",
    className: "rejected"
  },
  NO_SHOW: {
    label: "No show",
    className: "no-show"
  }
};

const normalizeStatus = (status) => {
  return String(status || "")
    .trim()
    .toUpperCase();
};

const isReviewRequired = (status) => {
  return REVIEW_STATUSES.has(normalizeStatus(status));
};

const formatDate = (timestamp) => {
  if (!timestamp) {
    return "Date unavailable";
  }

  const date = new Date(Number(timestamp));

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
};

const formatTime = (timestamp) => {
  if (!timestamp) {
    return "Time unavailable";
  }

  const date = new Date(Number(timestamp));

  if (Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(date);
};

const formatDateInputToTimestamp = (dateValue) => {
  if (!dateValue) {
    return null;
  }

  const localDate = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(localDate.getTime())) {
    return null;
  }

  return localDate.getTime();
};

const getActivityTimestamp = (appointment) => {
  return (
    Number(appointment?.updatedAt) ||
    Number(appointment?.createdAt) ||
    Number(appointment?.appointmentDateTime) ||
    Number(appointment?.id) ||
    0
  );
};

const sortAppointments = (items = []) => {
  return [...items].sort((first, second) => {
    const firstRequiresReview = isReviewRequired(first?.status) ? 1 : 0;
    const secondRequiresReview = isReviewRequired(second?.status) ? 1 : 0;

    if (firstRequiresReview !== secondRequiresReview) {
      return secondRequiresReview - firstRequiresReview;
    }

    return (
      getActivityTimestamp(second) -
      getActivityTimestamp(first)
    );
  });
};

const getStatusMeta = (status) => {
  const normalizedStatus = normalizeStatus(status);

  return (
    STATUS_META[normalizedStatus] || {
      label: normalizedStatus || "Unknown",
      className: "unknown"
    }
  );
};

const getErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

const Appointments = () => {
  const [searchParams] = useSearchParams();

  const {
    handleNotificationActionSuccess
  } = useNotifications();

  const [appointments, setAppointments] = useState([]);

  const [selectedAppointment, setSelectedAppointment] =
    useState(null);

  const [
    completeModalAppointment,
    setCompleteModalAppointment
  ] = useState(null);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [showCriticalOnly, setShowCriticalOnly] =
    useState(false);

  const [page, setPage] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] =
    useState(null);

  const [error, setError] = useState("");

  const [
    highlightAppointmentId,
    setHighlightAppointmentId
  ] = useState(null);

  const [listMeta, setListMeta] = useState({
    totalElements: 0,
    totalPages: 0,
    last: true,
    size: PAGE_SIZE
  });

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: "",
    appointmentId: null,
    title: "",
    message: "",
    confirmText: ""
  });

  const [feedbackModal, setFeedbackModal] = useState({
    open: false,
    title: "",
    message: "",
    tone: "error"
  });

  const openFeedbackModal = useCallback(
    ({
      title,
      message,
      tone = "error"
    }) => {
      setFeedbackModal({
        open: true,
        title,
        message,
        tone
      });
    },
    []
  );

  const closeFeedbackModal = useCallback(() => {
    setFeedbackModal({
      open: false,
      title: "",
      message: "",
      tone: "error"
    });
  }, []);

  const openConfirmModal = useCallback(
    ({
      type,
      appointmentId,
      title,
      message,
      confirmText
    }) => {
      setConfirmModal({
        open: true,
        type,
        appointmentId,
        title,
        message,
        confirmText
      });
    },
    []
  );

  const closeConfirmModal = useCallback(() => {
    if (actionLoadingId) {
      return;
    }

    setConfirmModal({
      open: false,
      type: "",
      appointmentId: null,
      title: "",
      message: "",
      confirmText: ""
    });
  }, [actionLoadingId]);

  useEffect(() => {
    const highlightValue =
      searchParams.get("highlight");

    if (!highlightValue) {
      setHighlightAppointmentId(null);
      return;
    }

    const parsedId = Number(highlightValue);

    setHighlightAppointmentId(
      Number.isFinite(parsedId)
        ? parsedId
        : null
    );
  }, [searchParams]);

  const fetchAppointments = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response =
          await getAllDoctorAppointments({
            search: appliedSearch,
            status: statusFilter,
            date: formatDateInputToTimestamp(
              dateFilter
            ),
            critical: showCriticalOnly
              ? true
              : undefined,
            page,
            size: PAGE_SIZE
          });

        const content = Array.isArray(
          response?.content
        )
          ? response.content
          : [];

        setAppointments(
          sortAppointments(content)
        );

        setListMeta({
          totalElements:
            Number(response?.totalElements) || 0,
          totalPages:
            Number(response?.totalPages) || 0,
          last:
            response?.last !== undefined
              ? Boolean(response.last)
              : true,
          size:
            Number(response?.size) ||
            PAGE_SIZE
        });
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to load appointments right now."
          )
        );

        if (!silent) {
          setAppointments([]);

          setListMeta({
            totalElements: 0,
            totalPages: 0,
            last: true,
            size: PAGE_SIZE
          });
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      appliedSearch,
      statusFilter,
      dateFilter,
      showCriticalOnly,
      page
    ]
  );

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const modalOpen =
        Boolean(selectedAppointment) ||
        Boolean(completeModalAppointment) ||
        confirmModal.open ||
        feedbackModal.open;

      if (!actionLoadingId && !modalOpen) {
        fetchAppointments({
          silent: true
        });
      }
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    fetchAppointments,
    actionLoadingId,
    selectedAppointment,
    completeModalAppointment,
    confirmModal.open,
    feedbackModal.open
  ]);

  useEffect(() => {
    if (!highlightAppointmentId || loading) {
      return;
    }

    const timerId = window.setTimeout(() => {
      const element = document.getElementById(
        `doctor-appointment-${highlightAppointmentId}`
      );

      element?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }, 200);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [
    highlightAppointmentId,
    loading,
    appointments
  ]);

  const visibleAppointments = useMemo(() => {
    return sortAppointments(appointments);
  }, [appointments]);

  const pendingReviewCount = useMemo(() => {
    return visibleAppointments.filter(
      (appointment) =>
        isReviewRequired(appointment?.status)
    ).length;
  }, [visibleAppointments]);

  const criticalCount = useMemo(() => {
    return visibleAppointments.filter(
      (appointment) =>
        Boolean(appointment?.isCritical)
    ).length;
  }, [visibleAppointments]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(0);
    setAppliedSearch(search.trim());
  };

  const handleStatusChange = (status) => {
    setPage(0);
    setStatusFilter(status);
  };

  const handleDateChange = (event) => {
    setPage(0);
    setDateFilter(event.target.value);
  };

  const handleCriticalChange = (event) => {
    setPage(0);
    setShowCriticalOnly(event.target.checked);
  };

  const handleResetFilters = () => {
    setSearch("");
    setAppliedSearch("");
    setStatusFilter("ALL");
    setDateFilter("");
    setShowCriticalOnly(false);
    setPage(0);
  };

  const handleView = (appointment) => {
    setSelectedAppointment(appointment);
  };

  const closeViewModal = () => {
    setSelectedAppointment(null);
  };

  const openAcceptConfirm = (appointmentId) => {
    openConfirmModal({
      type: "ACCEPT",
      appointmentId,
      title: "Accept appointment",
      message:
        "Confirm this appointment request and reserve the selected slot for the patient.",
      confirmText: "Accept appointment"
    });
  };

  const openRejectConfirm = (appointmentId) => {
    openConfirmModal({
      type: "REJECT",
      appointmentId,
      title: "Reject appointment",
      message:
        "Reject this appointment request. The patient will be notified about the decision.",
      confirmText: "Reject appointment"
    });
  };

  const openCancelConfirm = (appointmentId) => {
    openConfirmModal({
      type: "CANCEL",
      appointmentId,
      title: "Cancel appointment",
      message:
        "Cancel this scheduled appointment. This action updates the patient appointment record.",
      confirmText: "Cancel appointment"
    });
  };

  const openNoShowConfirm = (appointmentId) => {
    openConfirmModal({
      type: "NO_SHOW",
      appointmentId,
      title: "Mark as no show",
      message:
        "Confirm that the patient did not attend this appointment.",
      confirmText: "Mark no show"
    });
  };

  const openCompleteModal = (appointment) => {
    if (!appointment?.id) {
      return;
    }

    setCompleteModalAppointment(
      appointment
    );
  };

  const closeCompleteModal = () => {
    if (actionLoadingId) {
      return;
    }

    setCompleteModalAppointment(null);
  };

  const refreshNotificationState =
    useCallback(async () => {
      await handleNotificationActionSuccess?.({
        showToastOnNew: true
      });
    }, [handleNotificationActionSuccess]);

  const runAcceptAction = async (
    appointmentId
  ) => {
    const response =
      await acceptDoctorAppointmentRequest(
        appointmentId,
        {
          note: "Appointment accepted by doctor."
        }
      );

    await refreshNotificationState();

    await fetchAppointments({
      silent: true
    });

    openFeedbackModal({
      title: "Appointment accepted",
      message:
        response?.message ||
        "The appointment has been accepted successfully.",
      tone: "success"
    });
  };

  const runRejectAction = async (
    appointmentId
  ) => {
    const response =
      await rejectDoctorAppointmentRequest(
        appointmentId,
        {
          note: "Appointment rejected by doctor."
        }
      );

    await refreshNotificationState();

    await fetchAppointments({
      silent: true
    });

    openFeedbackModal({
      title: "Appointment rejected",
      message:
        response?.message ||
        "The appointment request has been rejected.",
      tone: "success"
    });
  };

  const runCancelAction = async (
    appointmentId
  ) => {
    await cancelPatientAppointment(
      appointmentId
    );

    await refreshNotificationState();

    await fetchAppointments({
      silent: true
    });

    openFeedbackModal({
      title: "Appointment cancelled",
      message:
        "The appointment has been cancelled successfully.",
      tone: "success"
    });
  };

  const runNoShowAction = async (
    appointmentId
  ) => {
    await markAppointmentNoShow(
      appointmentId
    );

    await refreshNotificationState();

    await fetchAppointments({
      silent: true
    });

    openFeedbackModal({
      title: "Appointment updated",
      message:
        "The appointment has been marked as no show.",
      tone: "success"
    });
  };

  const handleConfirmAction = async () => {
    const {
      type,
      appointmentId
    } = confirmModal;

    if (!type || !appointmentId) {
      return;
    }

    try {
      setActionLoadingId(
        appointmentId
      );

      if (type === "ACCEPT") {
        await runAcceptAction(
          appointmentId
        );
      }

      if (type === "REJECT") {
        await runRejectAction(
          appointmentId
        );
      }

      if (type === "CANCEL") {
        await runCancelAction(
          appointmentId
        );
      }

      if (type === "NO_SHOW") {
        await runNoShowAction(
          appointmentId
        );
      }

      setConfirmModal({
        open: false,
        type: "",
        appointmentId: null,
        title: "",
        message: "",
        confirmText: ""
      });
    } catch (actionError) {
      setConfirmModal({
        open: false,
        type: "",
        appointmentId: null,
        title: "",
        message: "",
        confirmText: ""
      });

      openFeedbackModal({
        title: "Action failed",
        message: getErrorMessage(
          actionError,
          "Unable to update the appointment."
        ),
        tone: "error"
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCompleteAppointmentSubmit =
    async (payload) => {
      if (!completeModalAppointment?.id) {
        return;
      }

      const appointmentId =
        completeModalAppointment.id;

      try {
        setActionLoadingId(
          appointmentId
        );

        const result =
          await markAppointmentCompleted(
            appointmentId,
            payload
          );

        setCompleteModalAppointment(null);
        setSelectedAppointment(null);

        await refreshNotificationState();

        await fetchAppointments({
          silent: true
        });

        openFeedbackModal({
          title: "Appointment completed",
          message:
            result?.message ||
            "The appointment has been completed successfully.",
          tone: "success"
        });
      } catch (actionError) {
        openFeedbackModal({
          title: "Unable to complete appointment",
          message: getErrorMessage(
            actionError,
            "Unable to complete the appointment."
          ),
          tone: "error"
        });
      } finally {
        setActionLoadingId(null);
      }
    };

  const showEmptyState =
    !loading &&
    !error &&
    visibleAppointments.length === 0;

  const destructiveConfirmation =
    ["REJECT", "CANCEL", "NO_SHOW"].includes(
      confirmModal.type
    );

  return (
    <main className="doctor-appointments-page">
      <section className="appointments-header">
        <div className="appointments-header-copy">
          <span className="appointments-kicker">
            Doctor portal
          </span>

          <h1>Appointment management</h1>

          <p>
            Review patient requests, monitor scheduled
            consultations and manage appointment outcomes.
          </p>
        </div>

        <button
          type="button"
          className="appointments-refresh-button"
          onClick={() =>
            fetchAppointments({
              silent: true
            })
          }
          disabled={refreshing || loading}
        >
          <FiRefreshCw
            className={
              refreshing
                ? "appointments-spinning"
                : ""
            }
          />

          <span>
            {refreshing
              ? "Refreshing"
              : "Refresh"}
          </span>
        </button>
      </section>

      <section className="appointments-metrics">
        <article className="appointment-metric-card">
          <span>Total appointments</span>
          <strong>
            {listMeta.totalElements}
          </strong>
        </article>

        <article className="appointment-metric-card">
          <span>Awaiting review</span>
          <strong>
            {pendingReviewCount}
          </strong>
        </article>

        <article className="appointment-metric-card">
          <span>Critical on this page</span>
          <strong>
            {criticalCount}
          </strong>
        </article>
      </section>

      <section className="appointments-controls">
        <form
          className="appointments-search"
          onSubmit={handleSearchSubmit}
        >
          <div className="appointments-search-field">
            <FiSearch />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search patient, phone, clinic or symptoms"
              aria-label="Search appointments"
            />
          </div>

          <button
            type="submit"
            className="appointment-primary-button"
          >
            Search
          </button>
        </form>

        <div className="appointments-date-control">
          <FiCalendar />

          <input
            type="date"
            value={dateFilter}
            onChange={handleDateChange}
            aria-label="Filter by appointment date"
          />
        </div>

        <button
          type="button"
          className="appointment-secondary-button"
          onClick={handleResetFilters}
        >
          Reset
        </button>
      </section>

      <section className="appointments-filter-panel">
        <div className="appointments-filter-title">
          <FiFilter />
          <span>Status</span>
        </div>

        <div className="appointments-status-filters">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              className={`appointment-filter-chip ${
                statusFilter === status
                  ? "is-active"
                  : ""
              }`}
              onClick={() =>
                handleStatusChange(status)
              }
            >
              {status === "ALL"
                ? "All"
                : getStatusMeta(status).label}
            </button>
          ))}
        </div>

        <label className="appointments-critical-filter">
          <input
            type="checkbox"
            checked={showCriticalOnly}
            onChange={handleCriticalChange}
          />

          <span className="appointments-checkbox" />

          <FiAlertTriangle />

          <span>
            Show only critical appointments
          </span>
        </label>
      </section>

      {error ? (
        <section className="appointments-state appointments-error-state">
          <FiAlertTriangle />

          <div>
            <h2>Unable to load appointments</h2>
            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() => fetchAppointments()}
            className="appointment-primary-button"
          >
            Retry
          </button>
        </section>
      ) : null}

      {loading ? (
        <section className="appointments-state">
          <div className="appointments-loader" />

          <div>
            <h2>Loading appointments</h2>
            <p>
              Please wait while appointment records are loaded.
            </p>
          </div>
        </section>
      ) : null}

      {showEmptyState ? (
        <section className="appointments-state">
          <FiCalendar />

          <div>
            <h2>No appointments found</h2>
            <p>
              No records match the selected filters.
            </p>
          </div>
        </section>
      ) : null}

      {!loading &&
      !error &&
      visibleAppointments.length > 0 ? (
        <>
          <section className="appointments-table-card">
            <div className="appointments-table-scroll">
              <table className="appointments-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Clinic</th>
                    <th>Date and time</th>
                    <th>Symptoms / notes</th>
                    <th>Status</th>
                    <th className="appointments-actions-heading">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleAppointments.map(
                    (appointment) => {
                      const status =
                        normalizeStatus(
                          appointment?.status
                        );

                      const statusMeta =
                        getStatusMeta(status);

                      const reviewRequired =
                        isReviewRequired(status);

                      const isHighlighted =
                        Number(
                          highlightAppointmentId
                        ) ===
                        Number(appointment.id);

                      const actionLoading =
                        Number(actionLoadingId) ===
                        Number(appointment.id);

                      return (
                        <tr
                          id={`doctor-appointment-${appointment.id}`}
                          key={appointment.id}
                          className={[
                            isHighlighted
                              ? "is-highlighted"
                              : "",
                            reviewRequired
                              ? "requires-review"
                              : ""
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          <td>
                            <div className="appointment-patient-cell">
                              <strong>
                                {appointment.patientName ||
                                  "Unknown patient"}
                              </strong>

                              <span>
                                {appointment.patientPhone ||
                                  "Phone unavailable"}
                              </span>

                              {appointment.isCritical ? (
                                <span className="appointment-critical-badge">
                                  <FiAlertTriangle />
                                  Critical
                                </span>
                              ) : null}
                            </div>
                          </td>

                          <td>
                            <span className="appointment-clinic-name">
                              {appointment.clinicName ||
                                "Clinic unavailable"}
                            </span>
                          </td>

                          <td>
                            <div className="appointment-datetime">
                              <span>
                                <FiCalendar />
                                {formatDate(
                                  appointment.appointmentDateTime
                                )}
                              </span>

                              <span>
                                <FiClock />
                                {formatTime(
                                  appointment.appointmentDateTime
                                )}
                              </span>
                            </div>
                          </td>

                          <td>
                            <p className="appointment-notes">
                              {appointment.symptoms ||
                                appointment.notes ||
                                "No symptoms or notes provided"}
                            </p>
                          </td>

                          <td>
                            <span
                              className={`appointment-status appointment-status-${statusMeta.className}`}
                            >
                              {statusMeta.label}
                            </span>

                            {reviewRequired ? (
                              <span className="appointment-review-caption">
                                Doctor response required
                              </span>
                            ) : null}
                          </td>

                          <td className="appointments-actions-cell">
                            <div className="appointment-action-group">
                              <button
                                type="button"
                                className="appointment-action appointment-action-view"
                                onClick={() =>
                                  handleView(
                                    appointment
                                  )
                                }
                              >
                                <FiEye />
                                <span>View</span>
                              </button>

                              {reviewRequired ? (
                                <>
                                  <button
                                    type="button"
                                    className="appointment-action appointment-action-accept"
                                    disabled={actionLoading}
                                    onClick={() =>
                                      openAcceptConfirm(
                                        appointment.id
                                      )
                                    }
                                  >
                                    <FiCheck />
                                    <span>
                                      {actionLoading
                                        ? "Working"
                                        : "Accept"}
                                    </span>
                                  </button>

                                  <button
                                    type="button"
                                    className="appointment-action appointment-action-reject"
                                    disabled={actionLoading}
                                    onClick={() =>
                                      openRejectConfirm(
                                        appointment.id
                                      )
                                    }
                                  >
                                    <FiX />
                                    <span>Reject</span>
                                  </button>
                                </>
                              ) : null}

                              {status === "SCHEDULED" ? (
                                <button
                                  type="button"
                                  className="appointment-action appointment-action-complete"
                                  disabled={actionLoading}
                                  onClick={() =>
                                    openCompleteModal(
                                      appointment
                                    )
                                  }
                                >
                                  <FiCheck />
                                  <span>Complete</span>
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="appointments-mobile-list">
            {visibleAppointments.map(
              (appointment) => {
                const status =
                  normalizeStatus(
                    appointment?.status
                  );

                const statusMeta =
                  getStatusMeta(status);

                const reviewRequired =
                  isReviewRequired(status);

                const isHighlighted =
                  Number(
                    highlightAppointmentId
                  ) === Number(appointment.id);

                const actionLoading =
                  Number(actionLoadingId) ===
                  Number(appointment.id);

                return (
                  <article
                    id={`doctor-appointment-mobile-${appointment.id}`}
                    key={appointment.id}
                    className={[
                      "appointment-mobile-card",
                      isHighlighted
                        ? "is-highlighted"
                        : "",
                      reviewRequired
                        ? "requires-review"
                        : ""
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <header className="appointment-mobile-header">
                      <div>
                        <h2>
                          {appointment.patientName ||
                            "Unknown patient"}
                        </h2>

                        <p>
                          {appointment.patientPhone ||
                            "Phone unavailable"}
                        </p>
                      </div>

                      <span
                        className={`appointment-status appointment-status-${statusMeta.className}`}
                      >
                        {statusMeta.label}
                      </span>
                    </header>

                    {appointment.isCritical ? (
                      <span className="appointment-critical-badge">
                        <FiAlertTriangle />
                        Critical patient
                      </span>
                    ) : null}

                    <dl className="appointment-mobile-details">
                      <div>
                        <dt>Clinic</dt>
                        <dd>
                          {appointment.clinicName ||
                            "Clinic unavailable"}
                        </dd>
                      </div>

                      <div>
                        <dt>Date</dt>
                        <dd>
                          {formatDate(
                            appointment.appointmentDateTime
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>Time</dt>
                        <dd>
                          {formatTime(
                            appointment.appointmentDateTime
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>Symptoms / notes</dt>
                        <dd>
                          {appointment.symptoms ||
                            appointment.notes ||
                            "No symptoms or notes provided"}
                        </dd>
                      </div>
                    </dl>

                    {reviewRequired ? (
                      <div className="appointment-review-notice">
                        Doctor approval is required for this appointment slot.
                      </div>
                    ) : null}

                    <footer className="appointment-mobile-actions">
                      <button
                        type="button"
                        className="appointment-action appointment-action-view"
                        onClick={() =>
                          handleView(appointment)
                        }
                      >
                        <FiEye />
                        View details
                      </button>

                      {reviewRequired ? (
                        <>
                          <button
                            type="button"
                            className="appointment-action appointment-action-accept"
                            disabled={actionLoading}
                            onClick={() =>
                              openAcceptConfirm(
                                appointment.id
                              )
                            }
                          >
                            <FiCheck />
                            {actionLoading
                              ? "Working"
                              : "Accept"}
                          </button>

                          <button
                            type="button"
                            className="appointment-action appointment-action-reject"
                            disabled={actionLoading}
                            onClick={() =>
                              openRejectConfirm(
                                appointment.id
                              )
                            }
                          >
                            <FiX />
                            Reject
                          </button>
                        </>
                      ) : null}

                      {status === "SCHEDULED" ? (
                        <button
                          type="button"
                          className="appointment-action appointment-action-complete"
                          disabled={actionLoading}
                          onClick={() =>
                            openCompleteModal(
                              appointment
                            )
                          }
                        >
                          <FiCheck />
                          Complete
                        </button>
                      ) : null}
                    </footer>
                  </article>
                );
              }
            )}
          </section>

          <section className="appointments-pagination">
            <div className="appointments-page-info">
              <span>
                Page{" "}
                <strong>{page + 1}</strong>
              </span>

              <span>
                Total pages{" "}
                <strong>
                  {listMeta.totalPages || 1}
                </strong>
              </span>

              <span>
                Records{" "}
                <strong>
                  {listMeta.totalElements}
                </strong>
              </span>
            </div>

            <div className="appointments-pagination-actions">
              <button
                type="button"
                disabled={page === 0}
                onClick={() =>
                  setPage((previousPage) =>
                    Math.max(
                      previousPage - 1,
                      0
                    )
                  )
                }
              >
                <FiChevronLeft />
                Previous
              </button>

              <button
                type="button"
                disabled={
                  listMeta.last ||
                  listMeta.totalPages === 0
                }
                onClick={() =>
                  setPage(
                    (previousPage) =>
                      previousPage + 1
                  )
                }
              >
                Next
                <FiChevronRight />
              </button>
            </div>
          </section>
        </>
      ) : null}

      {confirmModal.open ? (
        <div
          className="appointment-modal-overlay"
          onMouseDown={closeConfirmModal}
          role="presentation"
        >
          <section
            className="appointment-confirm-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="appointment-confirm-title"
          >
            <div
              className={`appointment-confirm-icon ${
                destructiveConfirmation
                  ? "is-danger"
                  : "is-success"
              }`}
            >
              {destructiveConfirmation ? (
                <FiAlertTriangle />
              ) : (
                <FiCheck />
              )}
            </div>

            <h2 id="appointment-confirm-title">
              {confirmModal.title}
            </h2>

            <p>{confirmModal.message}</p>

            <div className="appointment-modal-actions">
              <button
                type="button"
                className="appointment-modal-back"
                onClick={closeConfirmModal}
                disabled={Boolean(actionLoadingId)}
              >
                Back
              </button>

              <button
                type="button"
                className={
                  destructiveConfirmation
                    ? "appointment-modal-danger"
                    : "appointment-modal-success"
                }
                onClick={handleConfirmAction}
                disabled={Boolean(actionLoadingId)}
              >
                {actionLoadingId
                  ? "Updating..."
                  : confirmModal.confirmText}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {feedbackModal.open ? (
        <div
          className="appointment-modal-overlay"
          onMouseDown={closeFeedbackModal}
          role="presentation"
        >
          <section
            className="appointment-confirm-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
            role="dialog"
            aria-modal="true"
          >
            <div
              className={`appointment-confirm-icon ${
                feedbackModal.tone === "success"
                  ? "is-success"
                  : "is-danger"
              }`}
            >
              {feedbackModal.tone ===
              "success" ? (
                <FiCheck />
              ) : (
                <FiAlertTriangle />
              )}
            </div>

            <h2>{feedbackModal.title}</h2>
            <p>{feedbackModal.message}</p>

            <div className="appointment-modal-actions">
              <button
                type="button"
                className="appointment-modal-success"
                onClick={closeFeedbackModal}
              >
                Okay
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <ViewAppointmentModal
        appointment={selectedAppointment}
        onClose={closeViewModal}
        onCancel={openCancelConfirm}
        onMarkNoShow={openNoShowConfirm}
        onMarkCompleted={openCompleteModal}
        actionLoadingId={actionLoadingId}
      />

      {completeModalAppointment?.id ? (
        <CompleteAppointmentModal
          key={`${completeModalAppointment.id}-${completeModalAppointment.updatedAt || 0}`}
          appointment={
            completeModalAppointment
          }
          loading={
            Number(actionLoadingId) ===
            Number(
              completeModalAppointment.id
            )
          }
          onClose={closeCompleteModal}
          onSubmit={
            handleCompleteAppointmentSubmit
          }
        />
      ) : null}
    </main>
  );
};

export default Appointments;