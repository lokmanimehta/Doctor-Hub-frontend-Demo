import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useLocation } from "react-router-dom";

import {
  addAdminAppointmentNote,
  cancelAdminAppointment,
  getAdminAppointmentByKey,
  getAdminAppointmentFilterOptions,
  getAdminAppointments,
  rescheduleAdminAppointment,
  updateAdminAppointmentStatus
} from "../../services/adminService";

import "./Appointments.css";

const EMPTY_SUMMARY = {
  totalAppointments: 0,
  todayAppointments: 0,
  requestedAppointments: 0,
  scheduledAppointments: 0,
  completedAppointments: 0,
  cancelledAppointments: 0,
  rejectedAppointments: 0,
  noShowAppointments: 0,
  criticalAppointments: 0
};

const EMPTY_FILTER_OPTIONS = {
  doctors: [],
  clinics: [],
  statuses: [],
  sources: [],
  modes: []
};

const INITIAL_FILTERS = {
  search: "",
  source: "ALL",
  status: "ALL",
  mode: "ALL",
  doctorProfileId: "",
  clinicId: "",
  critical: "ALL",
  fromDate: "",
  toDate: ""
};

const INITIAL_ACTION_FORM = {
  reason: "",
  clinicId: "",
  appointmentDate: "",
  slotStartTime: "",
  slotEndTime: "",
  notifyPatient: true,
  notifyDoctor: true
};

const STATUS_LABELS = {
  REQUESTED: "Requested",
  PENDING: "Pending",
  SCHEDULED: "Scheduled",
  CONFIRMED: "Confirmed",
  APPROVED: "Approved",
  BOOKED: "Booked",
  RESCHEDULED: "Rescheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
  NO_SHOW: "No show",
  EXPIRED: "Expired",
  UNKNOWN: "Unknown"
};

const ACTION_CONFIG = {
  confirm: {
    title: "Confirm appointment",
    description:
      "Confirm this appointment request on behalf of the administrator.",
    submitLabel: "Confirm appointment",
    reasonLabel: "Confirmation note",
    reasonPlaceholder:
      "Explain why this appointment is being confirmed.",
    tone: "positive"
  },
  reject: {
    title: "Reject appointment",
    description:
      "Reject this pending appointment request. A reason is required.",
    submitLabel: "Reject appointment",
    reasonLabel: "Rejection reason",
    reasonPlaceholder:
      "Explain why the appointment request is being rejected.",
    tone: "danger"
  },
  cancel: {
    title: "Cancel appointment",
    description:
      "Cancel this appointment permanently. This action is audited.",
    submitLabel: "Cancel appointment",
    reasonLabel: "Cancellation reason",
    reasonPlaceholder:
      "Enter the reason for cancelling this appointment.",
    tone: "danger"
  },
  reschedule: {
    title: "Reschedule appointment",
    description:
      "Move this appointment to an available doctor and clinic slot.",
    submitLabel: "Reschedule appointment",
    reasonLabel: "Reschedule reason",
    reasonPlaceholder:
      "Explain why this appointment is being rescheduled.",
    tone: "primary"
  },
  noShow: {
    title: "Mark as no-show",
    description:
      "Mark the patient as absent for this past scheduled appointment.",
    submitLabel: "Mark no-show",
    reasonLabel: "No-show note",
    reasonPlaceholder:
      "Add a short operational note for this no-show.",
    tone: "warning"
  }
};

const useDebouncedValue = (value, delay) => {
  const [debouncedValue, setDebouncedValue] =
    useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

const normalizeStatus = (status) => {
  if (!status) {
    return "UNKNOWN";
  }

  return String(status)
    .trim()
    .replace(/\s+/g, "_")
    .toUpperCase();
};

const formatStatus = (status) => {
  const normalized = normalizeStatus(status);

  return (
    STATUS_LABELS[normalized] ||
    normalized
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      )
  );
};

const formatSource = (source) => {
  return source === "MANUAL"
    ? "Doctor created"
    : "Patient booking";
};

const formatNumber = (value) => {
  return new Intl.NumberFormat("en-IN").format(
    Number(value || 0)
  );
};

const formatDateValue = (dateValue) => {
  if (!dateValue) {
    return "Not available";
  }

  const parts = String(dateValue).split("-");

  if (parts.length !== 3) {
    return dateValue;
  }

  const [year, month, day] = parts;

  return `${day}/${month}/${year}`;
};

const formatTimeValue = (timeValue) => {
  if (!timeValue) {
    return "Time unavailable";
  }

  const [hourValue, minuteValue] =
    String(timeValue).split(":");

  const hour = Number(hourValue);
  const minute = minuteValue || "00";

  if (Number.isNaN(hour)) {
    return timeValue;
  }

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${suffix}`;
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) {
    return "Not available";
  }

  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata"
    }).format(new Date(timestamp));
  } catch {
    return "Not available";
  }
};

const getErrorMessage = (
  error,
  fallback = "Something went wrong."
) => {
  const responseData = error?.response?.data;

  if (typeof responseData === "string") {
    return responseData;
  }

  if (responseData?.message) {
    return responseData.message;
  }

  if (
    responseData?.errors &&
    typeof responseData.errors === "object"
  ) {
    const messages = Object.values(
      responseData.errors
    ).filter(Boolean);

    if (messages.length > 0) {
      return messages.join(", ");
    }
  }

  if (error?.message) {
    return error.message;
  }

  return fallback;
};

const escapeCsvValue = (value) => {
  const stringValue =
    value === null || value === undefined
      ? ""
      : String(value);

  return `"${stringValue.replace(/"/g, '""')}"`;
};

const getVisiblePages = (
  currentPage,
  totalPages
) => {
  if (totalPages <= 7) {
    return Array.from(
      { length: totalPages },
      (_, index) => index
    );
  }

  const pages = new Set([
    0,
    totalPages - 1,
    currentPage - 1,
    currentPage,
    currentPage + 1
  ]);

  return [...pages]
    .filter(
      (page) =>
        page >= 0 &&
        page < totalPages
    )
    .sort((first, second) => first - second);
};

const ModalShell = ({
  children,
  onClose,
  size = "large",
  className = ""
}) => {
  return (
    <div
      className="aap-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className={`aap-modal aap-modal--${size} ${className}`}
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        {children}
      </section>
    </div>
  );
};

const Appointment = () => {
  const location = useLocation();

  const [appointments, setAppointments] =
    useState([]);

  const [summary, setSummary] =
    useState(EMPTY_SUMMARY);

  const [filterOptions, setFilterOptions] =
    useState(EMPTY_FILTER_OPTIONS);

  const [filters, setFilters] =
    useState(INITIAL_FILTERS);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const [sortBy, setSortBy] = useState(
    "appointmentDateTime"
  );

  const [sortDirection, setSortDirection] =
    useState("DESC");

  const [pageMeta, setPageMeta] = useState({
    totalElements: 0,
    totalPages: 0,
    last: true
  });

  const [loading, setLoading] =
    useState(true);

  const [filterOptionsLoading, setFilterOptionsLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [detailsLoading, setDetailsLoading] =
    useState(false);

  const [details, setDetails] =
    useState(null);

  const [noteText, setNoteText] =
    useState("");

  const [noteSubmitting, setNoteSubmitting] =
    useState(false);

  const [actionModal, setActionModal] =
    useState(null);

  const [actionForm, setActionForm] =
    useState(INITIAL_ACTION_FORM);

  const [actionError, setActionError] =
    useState("");

  const [actionSubmitting, setActionSubmitting] =
    useState(false);

  const [toast, setToast] = useState(null);

  const requestIdRef = useRef(0);
  const toastTimerRef = useRef(null);
  const highlightedKeyRef = useRef("");

  const debouncedSearch = useDebouncedValue(
    filters.search,
    450
  );

  const activeModal =
    detailsOpen || Boolean(actionModal);

  const pushToast = useCallback(
    (type, message) => {
      if (toastTimerRef.current) {
        window.clearTimeout(
          toastTimerRef.current
        );
      }

      setToast({
        type,
        message
      });

      toastTimerRef.current =
        window.setTimeout(() => {
          setToast(null);
        }, 4200);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(
          toastTimerRef.current
        );
      }
    };
  }, []);

  useEffect(() => {
    if (!activeModal) {
      document.body.style.overflow = "";
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [activeModal]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      if (actionModal) {
        setActionModal(null);
        setActionError("");
        return;
      }

      if (detailsOpen) {
        setDetailsOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [actionModal, detailsOpen]);

  const fetchFilterOptions =
    useCallback(async () => {
      setFilterOptionsLoading(true);

      try {
        const data =
          await getAdminAppointmentFilterOptions();

        setFilterOptions({
          doctors: Array.isArray(data?.doctors)
            ? data.doctors
            : [],
          clinics: Array.isArray(data?.clinics)
            ? data.clinics
            : [],
          statuses: Array.isArray(data?.statuses)
            ? data.statuses
            : [],
          sources: Array.isArray(data?.sources)
            ? data.sources
            : [],
          modes: Array.isArray(data?.modes)
            ? data.modes
            : []
        });
      } catch (requestError) {
        pushToast(
          "error",
          getErrorMessage(
            requestError,
            "Unable to load appointment filter options."
          )
        );
      } finally {
        setFilterOptionsLoading(false);
      }
    }, [pushToast]);

  const fetchAppointments =
    useCallback(async () => {
      const currentRequestId =
        requestIdRef.current + 1;

      requestIdRef.current =
        currentRequestId;

      setLoading(true);
      setError("");

      try {
        const data =
          await getAdminAppointments({
            search: debouncedSearch,
            source: filters.source,
            status: filters.status,
            mode: filters.mode,
            doctorProfileId:
              filters.doctorProfileId,
            clinicId: filters.clinicId,
            critical:
              filters.critical === "ALL"
                ? ""
                : filters.critical === "TRUE",
            fromDate: filters.fromDate,
            toDate: filters.toDate,
            page,
            size,
            sortBy,
            sortDirection
          });

        if (
          requestIdRef.current !==
          currentRequestId
        ) {
          return;
        }

        const content = Array.isArray(
          data?.content
        )
          ? data.content
          : [];

        setAppointments(content);

        setSummary({
          ...EMPTY_SUMMARY,
          ...(data?.summary || {})
        });

        const totalElements = Number(
          data?.totalElements || 0
        );

        const totalPages = Number(
          data?.totalPages || 0
        );

        setPageMeta({
          totalElements,
          totalPages,
          last:
            data?.last === undefined
              ? true
              : Boolean(data.last)
        });

        if (
          totalPages > 0 &&
          page >= totalPages
        ) {
          setPage(totalPages - 1);
        }
      } catch (requestError) {
        if (
          requestIdRef.current !==
          currentRequestId
        ) {
          return;
        }

        setAppointments([]);
        setSummary(EMPTY_SUMMARY);

        setPageMeta({
          totalElements: 0,
          totalPages: 0,
          last: true
        });

        setError(
          getErrorMessage(
            requestError,
            "Unable to load appointments."
          )
        );
      } finally {
        if (
          requestIdRef.current ===
          currentRequestId
        ) {
          setLoading(false);
        }
      }
    }, [
      debouncedSearch,
      filters.source,
      filters.status,
      filters.mode,
      filters.doctorProfileId,
      filters.clinicId,
      filters.critical,
      filters.fromDate,
      filters.toDate,
      page,
      size,
      sortBy,
      sortDirection
    ]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const openDetails = useCallback(
    async (appointmentKey) => {
      if (!appointmentKey) {
        return;
      }

      setDetailsOpen(true);
      setDetailsLoading(true);
      setDetails(null);
      setNoteText("");

      try {
        const data =
          await getAdminAppointmentByKey(
            appointmentKey
          );

        setDetails(data);
      } catch (requestError) {
        setDetailsOpen(false);

        pushToast(
          "error",
          getErrorMessage(
            requestError,
            "Unable to load appointment details."
          )
        );
      } finally {
        setDetailsLoading(false);
      }
    },
    [pushToast]
  );

  useEffect(() => {
    const searchParams =
      new URLSearchParams(location.search);

    const highlight =
      searchParams.get("highlight");

    if (!highlight) {
      highlightedKeyRef.current = "";
      return;
    }

    const normalizedHighlight =
      /^(PUBLIC|MANUAL)-\d+$/i.test(
        highlight
      )
        ? highlight.toUpperCase()
        : `PUBLIC-${highlight}`;

    if (
      highlightedKeyRef.current ===
      normalizedHighlight
    ) {
      return;
    }

    highlightedKeyRef.current =
      normalizedHighlight;

    openDetails(normalizedHighlight);
  }, [location.search, openDetails]);

  const updateFilter = (
    field,
    value
  ) => {
    setFilters((previous) => ({
      ...previous,
      [field]: value
    }));

    setPage(0);
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSortBy("appointmentDateTime");
    setSortDirection("DESC");
    setPage(0);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (filters.search.trim()) count += 1;
    if (filters.source !== "ALL") count += 1;
    if (filters.status !== "ALL") count += 1;
    if (filters.mode !== "ALL") count += 1;
    if (filters.doctorProfileId) count += 1;
    if (filters.clinicId) count += 1;
    if (filters.critical !== "ALL") count += 1;
    if (filters.fromDate) count += 1;
    if (filters.toDate) count += 1;

    return count;
  }, [filters]);

  const summaryCards = useMemo(
    () => [
      {
        key: "total",
        label: "Total appointments",
        value: summary.totalAppointments,
        helper: "All active records",
        active:
          filters.status === "ALL" &&
          filters.critical === "ALL",
        onClick: () => {
          updateFilter("status", "ALL");
          setFilters((previous) => ({
            ...previous,
            status: "ALL",
            critical: "ALL"
          }));
        }
      },
      {
        key: "today",
        label: "Today",
        value: summary.todayAppointments,
        helper: "Scheduled for today",
        active: false
      },
      {
        key: "requested",
        label: "Requested",
        value: summary.requestedAppointments,
        helper: "Needs decision",
        active:
          filters.status === "REQUESTED",
        onClick: () =>
          updateFilter(
            "status",
            "REQUESTED"
          )
      },
      {
        key: "scheduled",
        label: "Scheduled",
        value: summary.scheduledAppointments,
        helper: "Upcoming and active",
        active:
          filters.status === "SCHEDULED",
        onClick: () =>
          updateFilter(
            "status",
            "SCHEDULED"
          )
      },
      {
        key: "completed",
        label: "Completed",
        value: summary.completedAppointments,
        helper: "Consultation completed",
        active:
          filters.status === "COMPLETED",
        onClick: () =>
          updateFilter(
            "status",
            "COMPLETED"
          )
      },
      {
        key: "cancelled",
        label: "Cancelled",
        value: summary.cancelledAppointments,
        helper: "Cancelled records",
        active:
          filters.status === "CANCELLED",
        onClick: () =>
          updateFilter(
            "status",
            "CANCELLED"
          )
      },
      {
        key: "no-show",
        label: "No show",
        value: summary.noShowAppointments,
        helper: "Missed consultations",
        active:
          filters.status === "NO_SHOW",
        onClick: () =>
          updateFilter(
            "status",
            "NO_SHOW"
          )
      },
      {
        key: "critical",
        label: "Critical",
        value: summary.criticalAppointments,
        helper: "Priority patients",
        active:
          filters.critical === "TRUE",
        onClick: () =>
          updateFilter(
            "critical",
            "TRUE"
          )
      }
    ],
    [
      summary,
      filters.status,
      filters.critical
    ]
  );

  const openAction = (
    type,
    appointment,
    fromDetails = false
  ) => {
    if (!appointment) {
      return;
    }

    setActionModal({
      type,
      appointment,
      fromDetails
    });

    setActionError("");

    setActionForm({
      reason: "",
      clinicId:
        appointment.clinicId
          ? String(appointment.clinicId)
          : "",
      appointmentDate:
        appointment.appointmentDate || "",
      slotStartTime:
        appointment.slotStartTime || "",
      slotEndTime:
        appointment.slotEndTime || "",
      notifyPatient: true,
      notifyDoctor: true
    });
  };

  const closeActionModal = () => {
    if (actionSubmitting) {
      return;
    }

    setActionModal(null);
    setActionError("");
    setActionForm(INITIAL_ACTION_FORM);
  };

  const submitAction = async (
    event
  ) => {
    event.preventDefault();

    if (
      !actionModal ||
      actionSubmitting
    ) {
      return;
    }

    const appointment =
      actionModal.appointment;

    const reason =
      actionForm.reason.trim();

    if (!reason) {
      setActionError(
        "A clear reason or operational note is required."
      );
      return;
    }

    if (
      actionModal.type === "reschedule" &&
      (!actionForm.appointmentDate ||
        !actionForm.slotStartTime)
    ) {
      setActionError(
        "Appointment date and start time are required."
      );
      return;
    }

    setActionSubmitting(true);
    setActionError("");

    try {
      let response;

      const commonPayload = {
        reason,
        notifyPatient:
          actionForm.notifyPatient,
        notifyDoctor:
          actionForm.notifyDoctor
      };

      switch (actionModal.type) {
        case "cancel":
          response =
            await cancelAdminAppointment(
              appointment.appointmentKey,
              commonPayload
            );
          break;

        case "reschedule":
          response =
            await rescheduleAdminAppointment(
              appointment.appointmentKey,
              {
                ...commonPayload,
                clinicId:
                  actionForm.clinicId
                    ? Number(
                        actionForm.clinicId
                      )
                    : undefined,
                appointmentDate:
                  actionForm.appointmentDate,
                slotStartTime:
                  actionForm.slotStartTime,
                slotEndTime:
                  actionForm.slotEndTime ||
                  undefined
              }
            );
          break;

        case "confirm":
          response =
            await updateAdminAppointmentStatus(
              appointment.appointmentKey,
              {
                ...commonPayload,
                status: "SCHEDULED"
              }
            );
          break;

        case "reject":
          response =
            await updateAdminAppointmentStatus(
              appointment.appointmentKey,
              {
                ...commonPayload,
                status: "REJECTED"
              }
            );
          break;

        case "noShow":
          response =
            await updateAdminAppointmentStatus(
              appointment.appointmentKey,
              {
                ...commonPayload,
                status: "NO_SHOW"
              }
            );
          break;

        default:
          throw new Error(
            "Unsupported appointment action."
          );
      }

      if (
        actionModal.fromDetails &&
        response
      ) {
        setDetails(response);
      }

      pushToast(
        "success",
        `${
          ACTION_CONFIG[actionModal.type]
            ?.submitLabel ||
          "Appointment action"
        } completed successfully.`
      );

      setActionModal(null);
      setActionForm(INITIAL_ACTION_FORM);

      await fetchAppointments();
    } catch (requestError) {
      setActionError(
        getErrorMessage(
          requestError,
          "Unable to update appointment."
        )
      );
    } finally {
      setActionSubmitting(false);
    }
  };

  const submitNote = async (
    event
  ) => {
    event.preventDefault();

    const appointment =
      details?.appointment;

    const cleanedNote =
      noteText.trim();

    if (
      !appointment ||
      !cleanedNote ||
      noteSubmitting
    ) {
      return;
    }

    setNoteSubmitting(true);

    try {
      await addAdminAppointmentNote(
        appointment.appointmentKey,
        {
          note: cleanedNote
        }
      );

      const refreshedDetails =
        await getAdminAppointmentByKey(
          appointment.appointmentKey
        );

      setDetails(refreshedDetails);
      setNoteText("");

      pushToast(
        "success",
        "Administrative note added successfully."
      );
    } catch (requestError) {
      pushToast(
        "error",
        getErrorMessage(
          requestError,
          "Unable to add appointment note."
        )
      );
    } finally {
      setNoteSubmitting(false);
    }
  };

  const exportCurrentPageCsv = () => {
    if (appointments.length === 0) {
      pushToast(
        "error",
        "There are no appointments on this page to export."
      );
      return;
    }

    const headers = [
      "Appointment Key",
      "Source",
      "Patient",
      "Patient Phone",
      "Patient Email",
      "Doctor",
      "Speciality",
      "Clinic",
      "Appointment Date",
      "Start Time",
      "End Time",
      "Mode",
      "Status",
      "Critical"
    ];

    const rows = appointments.map(
      (appointment) => [
        appointment.appointmentKey,
        formatSource(appointment.source),
        appointment.patientName,
        appointment.patientPhone,
        appointment.patientEmail,
        appointment.doctorName,
        appointment.specialty,
        appointment.clinicName,
        appointment.appointmentDate,
        appointment.slotStartTime,
        appointment.slotEndTime,
        appointment.mode,
        appointment.status,
        appointment.critical
          ? "Yes"
          : "No"
      ]
    );

    const csvContent = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) =>
        row.map(escapeCsvValue).join(",")
      )
    ].join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;"
      }
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download =
      `admin-appointments-page-${
        page + 1
      }.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  };

  const visiblePages = useMemo(
    () =>
      getVisiblePages(
        page,
        pageMeta.totalPages
      ),
    [page, pageMeta.totalPages]
  );

  const pageStart =
    pageMeta.totalElements === 0
      ? 0
      : page * size + 1;

  const pageEnd = Math.min(
    (page + 1) * size,
    pageMeta.totalElements
  );

  const currentDetailAppointment =
    details?.appointment || null;

  const currentDetailNotes =
    Array.isArray(details?.adminNotes)
      ? details.adminNotes
      : [];

  const actionConfiguration =
    actionModal
      ? ACTION_CONFIG[actionModal.type]
      : null;

  return (
    <main className="aap-page">
      <section className="aap-page-header">
        <div className="aap-page-header__content">
          <span className="aap-eyebrow">
            Operations
          </span>

          <h1>Appointment Management</h1>

          <p>
            Review patient bookings, monitor
            consultation activity and perform
            controlled administrative actions.
          </p>
        </div>

        <div className="aap-page-header__actions">
          <button
            type="button"
            className="aap-button aap-button--secondary"
            onClick={exportCurrentPageCsv}
            disabled={
              loading ||
              appointments.length === 0
            }
          >
            Export page
          </button>

          <button
            type="button"
            className="aap-button aap-button--primary"
            onClick={fetchAppointments}
            disabled={loading}
          >
            {loading
              ? "Refreshing..."
              : "Refresh data"}
          </button>
        </div>
      </section>

      {toast && (
        <div
          className={`aap-toast aap-toast--${toast.type}`}
          role="status"
        >
          <span className="aap-toast__indicator" />

          <span>{toast.message}</span>

          <button
            type="button"
            aria-label="Close notification"
            onClick={() => setToast(null)}
          >
            ×
          </button>
        </div>
      )}

      <section
        className="aap-summary-grid"
        aria-label="Appointment summary"
      >
        {summaryCards.map((card) => (
          <button
            key={card.key}
            type="button"
            className={`aap-summary-card ${
              card.active
                ? "aap-summary-card--active"
                : ""
            }`}
            onClick={card.onClick}
            disabled={!card.onClick}
          >
            <span className="aap-summary-card__label">
              {card.label}
            </span>

            <strong>
              {formatNumber(card.value)}
            </strong>

            <span className="aap-summary-card__helper">
              {card.helper}
            </span>
          </button>
        ))}
      </section>

      <section className="aap-panel aap-filter-panel">
        <div className="aap-panel-header">
          <div>
            <h2>Search and filters</h2>

            <p>
              Results update automatically when
              a filter changes.
            </p>
          </div>

          <div className="aap-panel-header__meta">
            {activeFilterCount > 0 && (
              <span className="aap-filter-count">
                {activeFilterCount} active
              </span>
            )}

            <button
              type="button"
              className="aap-text-button"
              onClick={resetFilters}
              disabled={activeFilterCount === 0}
            >
              Clear filters
            </button>
          </div>
        </div>

        <div className="aap-search-row">
          <div className="aap-search-field">
            <label htmlFor="appointment-search">
              Search appointments
            </label>

            <div className="aap-search-input">
              <span aria-hidden="true">
                ⌕
              </span>

              <input
                id="appointment-search"
                type="search"
                value={filters.search}
                placeholder="Search by reference, patient, doctor, phone or clinic"
                onChange={(event) =>
                  updateFilter(
                    "search",
                    event.target.value
                  )
                }
              />

              {filters.search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() =>
                    updateFilter(
                      "search",
                      ""
                    )
                  }
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="aap-sort-controls">
            <div className="aap-field">
              <label htmlFor="appointment-sort">
                Sort by
              </label>

              <select
                id="appointment-sort"
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value);
                  setPage(0);
                }}
              >
                <option value="appointmentDateTime">
                  Appointment date
                </option>
                <option value="createdAt">
                  Created date
                </option>
                <option value="updatedAt">
                  Updated date
                </option>
                <option value="patientName">
                  Patient name
                </option>
                <option value="doctorName">
                  Doctor name
                </option>
                <option value="clinicName">
                  Clinic name
                </option>
                <option value="status">
                  Status
                </option>
              </select>
            </div>

            <button
              type="button"
              className="aap-sort-direction"
              aria-label={`Sort ${
                sortDirection === "ASC"
                  ? "ascending"
                  : "descending"
              }`}
              onClick={() => {
                setSortDirection(
                  (previous) =>
                    previous === "ASC"
                      ? "DESC"
                      : "ASC"
                );

                setPage(0);
              }}
            >
              <span>
                {sortDirection === "ASC"
                  ? "Ascending"
                  : "Descending"}
              </span>

              <strong aria-hidden="true">
                {sortDirection === "ASC"
                  ? "↑"
                  : "↓"}
              </strong>
            </button>
          </div>
        </div>

        <div className="aap-filter-grid">
          <div className="aap-field">
            <label htmlFor="filter-source">
              Booking source
            </label>

            <select
              id="filter-source"
              value={filters.source}
              onChange={(event) =>
                updateFilter(
                  "source",
                  event.target.value
                )
              }
              disabled={filterOptionsLoading}
            >
              <option value="ALL">
                All sources
              </option>

              {filterOptions.sources.map(
                (source) => (
                  <option
                    key={source}
                    value={source}
                  >
                    {formatSource(source)}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="aap-field">
            <label htmlFor="filter-status">
              Status
            </label>

            <select
              id="filter-status"
              value={filters.status}
              onChange={(event) =>
                updateFilter(
                  "status",
                  event.target.value
                )
              }
              disabled={filterOptionsLoading}
            >
              <option value="ALL">
                All statuses
              </option>

              {filterOptions.statuses.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {formatStatus(status)}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="aap-field">
            <label htmlFor="filter-doctor">
              Doctor
            </label>

            <select
              id="filter-doctor"
              value={
                filters.doctorProfileId
              }
              onChange={(event) =>
                updateFilter(
                  "doctorProfileId",
                  event.target.value
                )
              }
              disabled={filterOptionsLoading}
            >
              <option value="">
                All doctors
              </option>

              {filterOptions.doctors.map(
                (doctor) => (
                  <option
                    key={doctor.value}
                    value={doctor.value}
                  >
                    {doctor.label}
                    {doctor.secondaryLabel
                      ? ` — ${doctor.secondaryLabel}`
                      : ""}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="aap-field">
            <label htmlFor="filter-clinic">
              Clinic
            </label>

            <select
              id="filter-clinic"
              value={filters.clinicId}
              onChange={(event) =>
                updateFilter(
                  "clinicId",
                  event.target.value
                )
              }
              disabled={filterOptionsLoading}
            >
              <option value="">
                All clinics
              </option>

              {filterOptions.clinics.map(
                (clinic) => (
                  <option
                    key={clinic.value}
                    value={clinic.value}
                  >
                    {clinic.label}
                    {clinic.secondaryLabel
                      ? ` — ${clinic.secondaryLabel}`
                      : ""}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="aap-field">
            <label htmlFor="filter-critical">
              Priority
            </label>

            <select
              id="filter-critical"
              value={filters.critical}
              onChange={(event) =>
                updateFilter(
                  "critical",
                  event.target.value
                )
              }
            >
              <option value="ALL">
                All priorities
              </option>

              <option value="TRUE">
                Critical only
              </option>

              <option value="FALSE">
                Normal only
              </option>
            </select>
          </div>

          <div className="aap-field">
            <label htmlFor="filter-mode">
              Consultation mode
            </label>

            <select
              id="filter-mode"
              value={filters.mode}
              onChange={(event) =>
                updateFilter(
                  "mode",
                  event.target.value
                )
              }
              disabled={filterOptionsLoading}
            >
              <option value="ALL">
                All modes
              </option>

              {filterOptions.modes.map(
                (mode) => (
                  <option
                    key={mode}
                    value={mode}
                  >
                    {mode === "CLINIC"
                      ? "Clinic consultation"
                      : formatStatus(mode)}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="aap-field">
            <label htmlFor="filter-from-date">
              From date
            </label>

            <input
              id="filter-from-date"
              type="date"
              value={filters.fromDate}
              max={filters.toDate || undefined}
              onChange={(event) =>
                updateFilter(
                  "fromDate",
                  event.target.value
                )
              }
            />
          </div>

          <div className="aap-field">
            <label htmlFor="filter-to-date">
              To date
            </label>

            <input
              id="filter-to-date"
              type="date"
              value={filters.toDate}
              min={
                filters.fromDate ||
                undefined
              }
              onChange={(event) =>
                updateFilter(
                  "toDate",
                  event.target.value
                )
              }
            />
          </div>
        </div>
      </section>

      <section className="aap-panel aap-results-panel">
        <div className="aap-results-header">
          <div>
            <h2>Appointments</h2>

            <p>
              Showing {formatNumber(pageStart)}–
              {formatNumber(pageEnd)} of{" "}
              {formatNumber(
                pageMeta.totalElements
              )} records
            </p>
          </div>

          <div className="aap-page-size">
            <label htmlFor="appointment-page-size">
              Rows
            </label>

            <select
              id="appointment-page-size"
              value={size}
              onChange={(event) => {
                setSize(
                  Number(event.target.value)
                );

                setPage(0);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {error && (
          <div
            className="aap-error-state"
            role="alert"
          >
            <div>
              <strong>
                Appointments could not be loaded
              </strong>

              <span>{error}</span>
            </div>

            <button
              type="button"
              className="aap-button aap-button--secondary"
              onClick={fetchAppointments}
            >
              Try again
            </button>
          </div>
        )}

        {!error && (
          <>
            <div className="aap-desktop-table">
              <div className="aap-table-scroll">
                <table className="aap-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Patient</th>
                      <th>Doctor and clinic</th>
                      <th>Schedule</th>
                      <th>Source</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>

                  <tbody>
                    {loading
                      ? Array.from(
                          { length: size > 10 ? 10 : size },
                          (_, index) => (
                            <tr
                              key={`skeleton-${index}`}
                              className="aap-skeleton-row"
                            >
                              <td colSpan={8}>
                                <span />
                              </td>
                            </tr>
                          )
                        )
                      : appointments.map(
                          (appointment) => (
                            <tr
                              key={
                                appointment.appointmentKey
                              }
                            >
                              <td>
                                <button
                                  type="button"
                                  className="aap-reference-button"
                                  onClick={() =>
                                    openDetails(
                                      appointment.appointmentKey
                                    )
                                  }
                                >
                                  {
                                    appointment.appointmentKey
                                  }
                                </button>

                                <span className="aap-row-subtext">
                                  {appointment.mode ===
                                  "CLINIC"
                                    ? "Clinic consultation"
                                    : appointment.mode}
                                </span>
                              </td>

                              <td>
                                <div className="aap-person-cell">
                                  <strong>
                                    {
                                      appointment.patientName
                                    }
                                  </strong>

                                  <span>
                                    Age{" "}
                                    {appointment.patientAge ??
                                      "—"}{" "}
                                    ·{" "}
                                    {
                                      appointment.patientPhone
                                    }
                                  </span>
                                </div>
                              </td>

                              <td>
                                <div className="aap-person-cell">
                                  <strong>
                                    {
                                      appointment.doctorName
                                    }
                                  </strong>

                                  <span>
                                    {
                                      appointment.specialty
                                    }
                                  </span>

                                  <span>
                                    {
                                      appointment.clinicName
                                    }
                                  </span>
                                </div>
                              </td>

                              <td>
                                <div className="aap-schedule-cell">
                                  <strong>
                                    {formatDateValue(
                                      appointment.appointmentDate
                                    )}
                                  </strong>

                                  <span>
                                    {formatTimeValue(
                                      appointment.slotStartTime
                                    )}

                                    {appointment.slotEndTime
                                      ? ` – ${formatTimeValue(
                                          appointment.slotEndTime
                                        )}`
                                      : ""}
                                  </span>
                                </div>
                              </td>

                              <td>
                                <span
                                  className={`aap-source-badge aap-source-badge--${String(
                                    appointment.source
                                  ).toLowerCase()}`}
                                >
                                  {formatSource(
                                    appointment.source
                                  )}
                                </span>
                              </td>

                              <td>
                                <span
                                  className={`aap-status aap-status--${normalizeStatus(
                                    appointment.status
                                  ).toLowerCase()}`}
                                >
                                  {formatStatus(
                                    appointment.status
                                  )}
                                </span>
                              </td>

                              <td>
                                {appointment.critical ? (
                                  <span className="aap-priority aap-priority--critical">
                                    Critical
                                  </span>
                                ) : (
                                  <span className="aap-priority">
                                    Normal
                                  </span>
                                )}
                              </td>

                              <td>
                                <div className="aap-table-actions">
                                  {appointment.canConfirm && (
                                    <button
                                      type="button"
                                      className="aap-inline-action aap-inline-action--positive"
                                      onClick={() =>
                                        openAction(
                                          "confirm",
                                          appointment
                                        )
                                      }
                                    >
                                      Confirm
                                    </button>
                                  )}

                                  {appointment.canMarkNoShow && (
                                    <button
                                      type="button"
                                      className="aap-inline-action"
                                      onClick={() =>
                                        openAction(
                                          "noShow",
                                          appointment
                                        )
                                      }
                                    >
                                      No-show
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    className="aap-inline-action"
                                    onClick={() =>
                                      openDetails(
                                        appointment.appointmentKey
                                      )
                                    }
                                  >
                                    Details
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        )}

                    {!loading &&
                      appointments.length === 0 && (
                        <tr>
                          <td colSpan={8}>
                            <div className="aap-empty-state">
                              <div className="aap-empty-state__icon">
                                0
                              </div>

                              <strong>
                                No appointments found
                              </strong>

                              <span>
                                Change or clear the active
                                filters to view more
                                appointments.
                              </span>

                              {activeFilterCount > 0 && (
                                <button
                                  type="button"
                                  className="aap-button aap-button--secondary"
                                  onClick={resetFilters}
                                >
                                  Clear filters
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="aap-mobile-list">
              {loading
                ? Array.from(
                    { length: 4 },
                    (_, index) => (
                      <div
                        key={`mobile-skeleton-${index}`}
                        className="aap-mobile-card aap-mobile-card--skeleton"
                      >
                        <span />
                        <span />
                        <span />
                      </div>
                    )
                  )
                : appointments.map(
                    (appointment) => (
                      <article
                        key={
                          appointment.appointmentKey
                        }
                        className="aap-mobile-card"
                      >
                        <div className="aap-mobile-card__top">
                          <div>
                            <button
                              type="button"
                              className="aap-reference-button"
                              onClick={() =>
                                openDetails(
                                  appointment.appointmentKey
                                )
                              }
                            >
                              {
                                appointment.appointmentKey
                              }
                            </button>

                            <span className="aap-mobile-card__source">
                              {formatSource(
                                appointment.source
                              )}
                            </span>
                          </div>

                          <span
                            className={`aap-status aap-status--${normalizeStatus(
                              appointment.status
                            ).toLowerCase()}`}
                          >
                            {formatStatus(
                              appointment.status
                            )}
                          </span>
                        </div>

                        <div className="aap-mobile-card__patient">
                          <strong>
                            {
                              appointment.patientName
                            }
                          </strong>

                          <span>
                            Age{" "}
                            {appointment.patientAge ??
                              "—"}{" "}
                            ·{" "}
                            {
                              appointment.patientPhone
                            }
                          </span>
                        </div>

                        <dl className="aap-mobile-card__details">
                          <div>
                            <dt>Doctor</dt>
                            <dd>
                              {
                                appointment.doctorName
                              }
                            </dd>
                          </div>

                          <div>
                            <dt>Clinic</dt>
                            <dd>
                              {
                                appointment.clinicName
                              }
                            </dd>
                          </div>

                          <div>
                            <dt>Date</dt>
                            <dd>
                              {formatDateValue(
                                appointment.appointmentDate
                              )}
                            </dd>
                          </div>

                          <div>
                            <dt>Time</dt>
                            <dd>
                              {formatTimeValue(
                                appointment.slotStartTime
                              )}
                            </dd>
                          </div>
                        </dl>

                        <div className="aap-mobile-card__footer">
                          <span
                            className={
                              appointment.critical
                                ? "aap-priority aap-priority--critical"
                                : "aap-priority"
                            }
                          >
                            {appointment.critical
                              ? "Critical"
                              : "Normal priority"}
                          </span>

                          <div>
                            {appointment.canConfirm && (
                              <button
                                type="button"
                                className="aap-inline-action aap-inline-action--positive"
                                onClick={() =>
                                  openAction(
                                    "confirm",
                                    appointment
                                  )
                                }
                              >
                                Confirm
                              </button>
                            )}

                            <button
                              type="button"
                              className="aap-inline-action"
                              onClick={() =>
                                openDetails(
                                  appointment.appointmentKey
                                )
                              }
                            >
                              View and manage
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  )}

              {!loading &&
                appointments.length === 0 && (
                  <div className="aap-empty-state">
                    <div className="aap-empty-state__icon">
                      0
                    </div>

                    <strong>
                      No appointments found
                    </strong>

                    <span>
                      Change or clear your active
                      filters.
                    </span>

                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        className="aap-button aap-button--secondary"
                        onClick={resetFilters}
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                )}
            </div>

            <div className="aap-pagination">
              <span>
                Page{" "}
                {pageMeta.totalPages === 0
                  ? 0
                  : page + 1}{" "}
                of{" "}
                {pageMeta.totalPages}
              </span>

              <div className="aap-pagination__buttons">
                <button
                  type="button"
                  onClick={() =>
                    setPage((previous) =>
                      Math.max(
                        previous - 1,
                        0
                      )
                    )
                  }
                  disabled={
                    page === 0 ||
                    loading ||
                    pageMeta.totalPages === 0
                  }
                >
                  Previous
                </button>

                {visiblePages.map(
                  (pageNumber, index) => {
                    const previousPage =
                      visiblePages[index - 1];

                    const showEllipsis =
                      index > 0 &&
                      pageNumber -
                        previousPage >
                        1;

                    return (
                      <React.Fragment
                        key={pageNumber}
                      >
                        {showEllipsis && (
                          <span className="aap-pagination__ellipsis">
                            …
                          </span>
                        )}

                        <button
                          type="button"
                          className={
                            pageNumber === page
                              ? "aap-pagination__page aap-pagination__page--active"
                              : "aap-pagination__page"
                          }
                          onClick={() =>
                            setPage(pageNumber)
                          }
                          disabled={loading}
                        >
                          {pageNumber + 1}
                        </button>
                      </React.Fragment>
                    );
                  }
                )}

                <button
                  type="button"
                  onClick={() =>
                    setPage((previous) =>
                      Math.min(
                        previous + 1,
                        Math.max(
                          pageMeta.totalPages -
                            1,
                          0
                        )
                      )
                    )
                  }
                  disabled={
                    loading ||
                    pageMeta.totalPages === 0 ||
                    page >=
                      pageMeta.totalPages - 1
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {detailsOpen && (
        <ModalShell
          onClose={() =>
            setDetailsOpen(false)
          }
          size="large"
        >
          <header className="aap-modal-header">
            <div>
              <span className="aap-modal-eyebrow">
                Appointment record
              </span>

              <h2>
                {currentDetailAppointment
                  ?.appointmentKey ||
                  "Appointment details"}
              </h2>

              {currentDetailAppointment && (
                <p>
                  Created{" "}
                  {formatTimestamp(
                    currentDetailAppointment.createdAt
                  )}
                </p>
              )}
            </div>

            <button
              type="button"
              className="aap-modal-close"
              aria-label="Close appointment details"
              onClick={() =>
                setDetailsOpen(false)
              }
            >
              ×
            </button>
          </header>

          {detailsLoading ? (
            <div className="aap-modal-loading">
              <span className="aap-spinner" />

              <strong>
                Loading appointment
              </strong>

              <p>
                Retrieving the complete
                appointment record.
              </p>
            </div>
          ) : currentDetailAppointment ? (
            <>
              <div className="aap-modal-body">
                <div className="aap-detail-status-row">
                  <span
                    className={`aap-status aap-status--${normalizeStatus(
                      currentDetailAppointment.status
                    ).toLowerCase()}`}
                  >
                    {formatStatus(
                      currentDetailAppointment.status
                    )}
                  </span>

                  <span
                    className={`aap-source-badge aap-source-badge--${String(
                      currentDetailAppointment.source
                    ).toLowerCase()}`}
                  >
                    {formatSource(
                      currentDetailAppointment.source
                    )}
                  </span>

                  <span
                    className={
                      currentDetailAppointment.critical
                        ? "aap-priority aap-priority--critical"
                        : "aap-priority"
                    }
                  >
                    {currentDetailAppointment.critical
                      ? "Critical priority"
                      : "Normal priority"}
                  </span>
                </div>

                <div className="aap-detail-grid">
                  <section className="aap-detail-card">
                    <div className="aap-detail-card__header">
                      <h3>Patient</h3>
                    </div>

                    <dl className="aap-definition-list">
                      <div>
                        <dt>Name</dt>
                        <dd>
                          {
                            currentDetailAppointment.patientName
                          }
                        </dd>
                      </div>

                      <div>
                        <dt>Age</dt>
                        <dd>
                          {currentDetailAppointment.patientAge ??
                            "Not available"}
                        </dd>
                      </div>

                      <div>
                        <dt>Date of birth</dt>
                        <dd>
                          {formatDateValue(
                            currentDetailAppointment.patientDateOfBirth
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>Phone</dt>
                        <dd>
                          {currentDetailAppointment.patientPhone ||
                            "Not available"}
                        </dd>
                      </div>

                      <div>
                        <dt>Email</dt>
                        <dd className="aap-break-text">
                          {currentDetailAppointment.patientEmail ||
                            "Not available"}
                        </dd>
                      </div>

                      <div>
                        <dt>Profile</dt>
                        <dd>
                          {currentDetailAppointment.patientProfileType ||
                            "Manual patient"}
                        </dd>
                      </div>
                    </dl>
                  </section>

                  <section className="aap-detail-card">
                    <div className="aap-detail-card__header">
                      <h3>Doctor and clinic</h3>
                    </div>

                    <dl className="aap-definition-list">
                      <div>
                        <dt>Doctor</dt>
                        <dd>
                          {
                            currentDetailAppointment.doctorName
                          }
                        </dd>
                      </div>

                      <div>
                        <dt>Speciality</dt>
                        <dd>
                          {
                            currentDetailAppointment.specialty
                          }
                        </dd>
                      </div>

                      <div>
                        <dt>Clinic</dt>
                        <dd>
                          {
                            currentDetailAppointment.clinicName
                          }
                        </dd>
                      </div>

                      <div>
                        <dt>Location</dt>
                        <dd>
                          {currentDetailAppointment.location ||
                            "Not available"}
                        </dd>
                      </div>

                      <div>
                        <dt>Doctor profile ID</dt>
                        <dd>
                          {currentDetailAppointment.doctorProfileId ??
                            "—"}
                        </dd>
                      </div>

                      <div>
                        <dt>Clinic ID</dt>
                        <dd>
                          {currentDetailAppointment.clinicId ??
                            "—"}
                        </dd>
                      </div>
                    </dl>
                  </section>

                  <section className="aap-detail-card">
                    <div className="aap-detail-card__header">
                      <h3>Schedule</h3>
                    </div>

                    <dl className="aap-definition-list">
                      <div>
                        <dt>Date</dt>
                        <dd>
                          {formatDateValue(
                            currentDetailAppointment.appointmentDate
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>Start time</dt>
                        <dd>
                          {formatTimeValue(
                            currentDetailAppointment.slotStartTime
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>End time</dt>
                        <dd>
                          {currentDetailAppointment.slotEndTime
                            ? formatTimeValue(
                                currentDetailAppointment.slotEndTime
                              )
                            : "Not specified"}
                        </dd>
                      </div>

                      <div>
                        <dt>Mode</dt>
                        <dd>
                          {currentDetailAppointment.mode ===
                          "CLINIC"
                            ? "Clinic consultation"
                            : currentDetailAppointment.mode}
                        </dd>
                      </div>

                      <div>
                        <dt>Last updated</dt>
                        <dd>
                          {formatTimestamp(
                            currentDetailAppointment.updatedAt
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>Completed</dt>
                        <dd>
                          {currentDetailAppointment.completedAt
                            ? formatTimestamp(
                                currentDetailAppointment.completedAt
                              )
                            : "Not completed"}
                        </dd>
                      </div>
                    </dl>
                  </section>
                </div>

                <section className="aap-detail-card aap-detail-card--wide">
                  <div className="aap-detail-card__header">
                    <h3>
                      Appointment information
                    </h3>
                  </div>

                  <div className="aap-notes-grid">
                    <div>
                      <span className="aap-content-label">
                        Booking note
                      </span>

                      <p>
                        {currentDetailAppointment.notes ||
                          "No booking note was provided."}
                      </p>
                    </div>

                    <div>
                      <span className="aap-content-label">
                        Doctor response
                      </span>

                      <p>
                        {currentDetailAppointment.doctorResponseNote ||
                          "No doctor response note is available."}
                      </p>
                    </div>

                    <div>
                      <span className="aap-content-label">
                        Cancellation reason
                      </span>

                      <p>
                        {currentDetailAppointment.cancelReason ||
                          "This appointment has no cancellation reason."}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="aap-detail-card aap-detail-card--wide">
                  <div className="aap-detail-card__header aap-detail-card__header--notes">
                    <div>
                      <h3>
                        Administrative notes
                      </h3>

                      <p>
                        Internal operational notes
                        recorded by administrators.
                      </p>
                    </div>

                    <span className="aap-note-count">
                      {currentDetailNotes.length}
                    </span>
                  </div>

                  <form
                    className="aap-note-form"
                    onSubmit={submitNote}
                  >
                    <label htmlFor="admin-appointment-note">
                      Add internal note
                    </label>

                    <textarea
                      id="admin-appointment-note"
                      value={noteText}
                      maxLength={2000}
                      placeholder="Add a concise operational note. Clinical notes should not be stored here."
                      onChange={(event) =>
                        setNoteText(
                          event.target.value
                        )
                      }
                    />

                    <div className="aap-note-form__footer">
                      <span>
                        {noteText.length}/2000
                      </span>

                      <button
                        type="submit"
                        className="aap-button aap-button--primary"
                        disabled={
                          noteSubmitting ||
                          !noteText.trim()
                        }
                      >
                        {noteSubmitting
                          ? "Adding note..."
                          : "Add note"}
                      </button>
                    </div>
                  </form>

                  <div className="aap-note-timeline">
                    {currentDetailNotes.length ===
                    0 ? (
                      <div className="aap-note-empty">
                        No administrative notes have
                        been added.
                      </div>
                    ) : (
                      currentDetailNotes.map(
                        (note) => (
                          <article
                            key={note.id}
                            className="aap-note-item"
                          >
                            <span className="aap-note-item__marker" />

                            <div>
                              <div className="aap-note-item__meta">
                                <strong>
                                  {note.adminName ||
                                    "Administrator"}
                                </strong>

                                <span>
                                  {formatTimestamp(
                                    note.createdAt
                                  )}
                                </span>

                                {note.systemGenerated && (
                                  <span className="aap-system-note">
                                    System action
                                  </span>
                                )}
                              </div>

                              <p>{note.note}</p>
                            </div>
                          </article>
                        )
                      )
                    )}
                  </div>
                </section>
              </div>

              <footer className="aap-modal-footer">
                <div className="aap-modal-footer__message">
                  {!currentDetailAppointment.canCancel &&
                    !currentDetailAppointment.canReschedule &&
                    !currentDetailAppointment.canConfirm &&
                    !currentDetailAppointment.canReject &&
                    !currentDetailAppointment.canMarkNoShow && (
                      <span>
                        No administrative actions are
                        available for this appointment
                        status.
                      </span>
                    )}
                </div>

                <div className="aap-modal-footer__actions">
                  {currentDetailAppointment.canReject && (
                    <button
                      type="button"
                      className="aap-button aap-button--danger-ghost"
                      onClick={() =>
                        openAction(
                          "reject",
                          currentDetailAppointment,
                          true
                        )
                      }
                    >
                      Reject
                    </button>
                  )}

                  {currentDetailAppointment.canMarkNoShow && (
                    <button
                      type="button"
                      className="aap-button aap-button--secondary"
                      onClick={() =>
                        openAction(
                          "noShow",
                          currentDetailAppointment,
                          true
                        )
                      }
                    >
                      Mark no-show
                    </button>
                  )}

                  {currentDetailAppointment.canReschedule && (
                    <button
                      type="button"
                      className="aap-button aap-button--secondary"
                      onClick={() =>
                        openAction(
                          "reschedule",
                          currentDetailAppointment,
                          true
                        )
                      }
                    >
                      Reschedule
                    </button>
                  )}

                  {currentDetailAppointment.canCancel && (
                    <button
                      type="button"
                      className="aap-button aap-button--danger"
                      onClick={() =>
                        openAction(
                          "cancel",
                          currentDetailAppointment,
                          true
                        )
                      }
                    >
                      Cancel
                    </button>
                  )}

                  {currentDetailAppointment.canConfirm && (
                    <button
                      type="button"
                      className="aap-button aap-button--primary"
                      onClick={() =>
                        openAction(
                          "confirm",
                          currentDetailAppointment,
                          true
                        )
                      }
                    >
                      Confirm
                    </button>
                  )}

                  <button
                    type="button"
                    className="aap-button aap-button--secondary"
                    onClick={() =>
                      setDetailsOpen(false)
                    }
                  >
                    Close
                  </button>
                </div>
              </footer>
            </>
          ) : (
            <div className="aap-modal-loading">
              <strong>
                Appointment unavailable
              </strong>

              <p>
                The appointment record could not
                be loaded.
              </p>
            </div>
          )}
        </ModalShell>
      )}

      {actionModal && actionConfiguration && (
        <ModalShell
          onClose={closeActionModal}
          size={
            actionModal.type === "reschedule"
              ? "medium"
              : "small"
          }
          className="aap-action-modal"
        >
          <header className="aap-modal-header">
            <div>
              <span className="aap-modal-eyebrow">
                Administrative action
              </span>

              <h2>
                {actionConfiguration.title}
              </h2>

              <p>
                {
                  actionModal.appointment
                    .appointmentKey
                }
              </p>
            </div>

            <button
              type="button"
              className="aap-modal-close"
              aria-label="Close action dialog"
              onClick={closeActionModal}
            >
              ×
            </button>
          </header>

          <form onSubmit={submitAction}>
            <div className="aap-modal-body">
              <div
                className={`aap-action-notice aap-action-notice--${actionConfiguration.tone}`}
              >
                <strong>
                  {
                    actionConfiguration.description
                  }
                </strong>

                <span>
                  Patient:{" "}
                  {
                    actionModal.appointment
                      .patientName
                  }
                </span>
              </div>

              {actionModal.type ===
                "reschedule" && (
                <div className="aap-action-grid">
                  <div className="aap-field aap-field--full">
                    <label htmlFor="action-clinic">
                      Clinic
                    </label>

                    <select
                      id="action-clinic"
                      value={
                        actionForm.clinicId
                      }
                      onChange={(event) =>
                        setActionForm(
                          (previous) => ({
                            ...previous,
                            clinicId:
                              event.target.value
                          })
                        )
                      }
                      required
                    >
                      <option value="">
                        Select clinic
                      </option>

                      {filterOptions.clinics.map(
                        (clinic) => (
                          <option
                            key={clinic.value}
                            value={clinic.value}
                          >
                            {clinic.label}
                            {clinic.secondaryLabel
                              ? ` — ${clinic.secondaryLabel}`
                              : ""}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="aap-field">
                    <label htmlFor="action-date">
                      Appointment date
                    </label>

                    <input
                      id="action-date"
                      type="date"
                      value={
                        actionForm.appointmentDate
                      }
                      onChange={(event) =>
                        setActionForm(
                          (previous) => ({
                            ...previous,
                            appointmentDate:
                              event.target.value
                          })
                        )
                      }
                      required
                    />
                  </div>

                  <div className="aap-field">
                    <label htmlFor="action-start-time">
                      Start time
                    </label>

                    <input
                      id="action-start-time"
                      type="time"
                      value={
                        actionForm.slotStartTime
                      }
                      onChange={(event) =>
                        setActionForm(
                          (previous) => ({
                            ...previous,
                            slotStartTime:
                              event.target.value
                          })
                        )
                      }
                      required
                    />
                  </div>

                  <div className="aap-field">
                    <label htmlFor="action-end-time">
                      End time
                    </label>

                    <input
                      id="action-end-time"
                      type="time"
                      value={
                        actionForm.slotEndTime
                      }
                      onChange={(event) =>
                        setActionForm(
                          (previous) => ({
                            ...previous,
                            slotEndTime:
                              event.target.value
                          })
                        )
                      }
                    />
                  </div>
                </div>
              )}

              <div className="aap-field aap-field--full">
                <label htmlFor="action-reason">
                  {
                    actionConfiguration.reasonLabel
                  }
                </label>

                <textarea
                  id="action-reason"
                  value={actionForm.reason}
                  maxLength={1000}
                  placeholder={
                    actionConfiguration.reasonPlaceholder
                  }
                  onChange={(event) =>
                    setActionForm(
                      (previous) => ({
                        ...previous,
                        reason:
                          event.target.value
                      })
                    )
                  }
                  required
                />

                <span className="aap-field-helper">
                  {actionForm.reason.length}
                  /1000 characters
                </span>
              </div>

              <div className="aap-notification-options">
                <label>
                  <input
                    type="checkbox"
                    checked={
                      actionForm.notifyPatient
                    }
                    onChange={(event) =>
                      setActionForm(
                        (previous) => ({
                          ...previous,
                          notifyPatient:
                            event.target.checked
                        })
                      )
                    }
                  />

                  <span>
                    Notify patient
                  </span>
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={
                      actionForm.notifyDoctor
                    }
                    onChange={(event) =>
                      setActionForm(
                        (previous) => ({
                          ...previous,
                          notifyDoctor:
                            event.target.checked
                        })
                      )
                    }
                  />

                  <span>
                    Notify doctor
                  </span>
                </label>
              </div>

              {actionError && (
                <div
                  className="aap-form-error"
                  role="alert"
                >
                  {actionError}
                </div>
              )}
            </div>

            <footer className="aap-modal-footer">
              <div />

              <div className="aap-modal-footer__actions">
                <button
                  type="button"
                  className="aap-button aap-button--secondary"
                  onClick={closeActionModal}
                  disabled={actionSubmitting}
                >
                  Go back
                </button>

                <button
                  type="submit"
                  className={`aap-button ${
                    actionConfiguration.tone ===
                    "danger"
                      ? "aap-button--danger"
                      : actionConfiguration.tone ===
                        "warning"
                      ? "aap-button--warning"
                      : "aap-button--primary"
                  }`}
                  disabled={actionSubmitting}
                >
                  {actionSubmitting
                    ? "Processing..."
                    : actionConfiguration.submitLabel}
                </button>
              </div>
            </footer>
          </form>
        </ModalShell>
      )}
    </main>
  );
};

export default Appointment;