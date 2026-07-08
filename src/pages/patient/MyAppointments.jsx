import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./MyAppointments.css";
import {
  FiAlertCircle,
  FiBell,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiDownload,
  FiFilter,
  FiMapPin,
  FiMessageCircle,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUser,
  FiX
} from "react-icons/fi";
import {
  cancelPatientAppointment,
  getPatientAppointments,
  reschedulePatientAppointment,
  updatePatientAppointmentReminders
} from "../../services/patientService";

const TAB_OPTIONS = [
  { key: "all", label: "Active", apiStatus: "ALL" }
];

const REMINDER_CHANNELS = [
  {
    key: "emailReminderEnabled",
    label: "Email",
    status: "Active",
    enabled: true
  },
  {
    key: "smsReminderEnabled",
    label: "SMS",
    status: "Coming soon",
    enabled: false
  },
  {
    key: "pushReminderEnabled",
    label: "Push",
    status: "Coming soon",
    enabled: false
  }
];

const ACTIVE_APPOINTMENT_STATUSES = new Set([
  "REQUESTED",
  "PENDING",
  "CONFIRMED",
  "APPROVED",
  "BOOKED",
  "SCHEDULED",
  "RESCHEDULED"
]);

const HIDDEN_APPOINTMENT_STATUSES = new Set([
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
  "REJECTED",
  "EXPIRED"
]);

const DEFAULT_SPECIALTIES = ["All"];

const safeText = (value, fallback = "Not available") => {
  if (value === null || value === undefined) {
    return fallback;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
};

const escapeHtml = (value) => {
  return safeText(value, "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
  const cleanedName = safeText(name, "Doctor").replace(/^dr\.?\s+/i, "");
  const parts = cleanedName.split(" ").filter(Boolean);

  if (parts.length === 0) {
    return "DR";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const getTodayInputDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  const date = `${today.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${date}`;
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

const formatSlot = (appointment) => {
  const start = formatTime(appointment?.slotStartTime);
  const end = appointment?.slotEndTime ? formatTime(appointment.slotEndTime) : null;

  return end ? `${start} - ${end}` : start;
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

const normalizeStatusLabel = (appointment) => {
  const rawStatus = safeText(appointment?.status, "SCHEDULED").toUpperCase();

  if (appointment?.tab === "past" && rawStatus === "SCHEDULED") {
    return "Past";
  }

  return rawStatus
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getVisualStatus = (appointment) => {
  const rawStatus = safeText(appointment?.status, "SCHEDULED").toLowerCase();

  if (appointment?.tab === "cancelled") {
    return "cancelled";
  }

  if (appointment?.tab === "past" && rawStatus === "scheduled") {
    return "past";
  }

  return rawStatus;
};

const getTabCount = (counts, tabKey) => {
  if (tabKey === "all") {
    return counts.allCount ?? 0;
  }

  if (tabKey === "upcoming") {
    return counts.upcomingCount ?? 0;
  }

  if (tabKey === "past") {
    return counts.pastCount ?? 0;
  }

  if (tabKey === "cancelled") {
    return counts.cancelledCount ?? 0;
  }

  return 0;
};

const isActiveAppointmentForPage = (appointment) => {
  const status = safeText(appointment?.status, "").toUpperCase();

  if (!status) {
    return false;
  }

  if (HIDDEN_APPOINTMENT_STATUSES.has(status)) {
    return false;
  }

  if (appointment?.tab === "past" || appointment?.tab === "cancelled") {
    return false;
  }

  return ACTIVE_APPOINTMENT_STATUSES.has(status);
};

const getRecentSortValue = (appointment) => {
  return (
    Number(appointment?.updatedAt) ||
    Number(appointment?.createdAt) ||
    Number(appointment?.appointmentDateTime) ||
    Number(appointment?.id) ||
    0
  );
};

const prepareVisibleAppointments = (items = []) => {
  return items
    .filter(isActiveAppointmentForPage)
    .sort((first, second) => getRecentSortValue(second) - getRecentSortValue(first));
};

const sanitizePhone = (phone) => {
  return safeText(phone, "").replace(/[^\d+]/g, "");
};

const buildInvoiceHtml = (appointment) => {
  const doctorName = getDoctorDisplayName(appointment?.doctorName);
  const invoiceNumber = `DH-INV-${appointment?.id || "NA"}`;

  const generatedAt = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(invoiceNumber)}</title>
  <style>
    body {
      margin: 0;
      padding: 32px;
      background: #f6f7f9;
      color: #111827;
      font-family: Arial, sans-serif;
    }

    .invoice {
      max-width: 780px;
      margin: auto;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 18px;
      padding: 30px;
    }

    .top {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 20px;
      margin-bottom: 22px;
    }

    .brand {
      color: #0f766e;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .1em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    h1 {
      margin: 0;
      font-size: 27px;
      line-height: 1.2;
    }

    .muted {
      color: #6b7280;
      font-size: 13px;
      line-height: 1.6;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-top: 18px;
    }

    .box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 14px;
    }

    .box span {
      display: block;
      color: #6b7280;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: .08em;
      margin-bottom: 7px;
    }

    .box strong {
      display: block;
      color: #111827;
      font-size: 15px;
      line-height: 1.45;
    }

    .total {
      margin-top: 22px;
      padding: 16px;
      border: 1px dashed #9ca3af;
      border-radius: 14px;
      display: flex;
      justify-content: space-between;
      font-size: 18px;
      font-weight: 800;
    }

    .footer {
      margin-top: 22px;
      color: #6b7280;
      font-size: 12px;
      line-height: 1.6;
      border-top: 1px solid #e5e7eb;
      padding-top: 16px;
    }
  </style>
</head>
<body>
  <main class="invoice">
    <div class="top">
      <div>
        <div class="brand">Sucura</div>
        <h1>Appointment Invoice</h1>
        <p class="muted">Generated appointment record for patient reference.</p>
      </div>
      <div class="muted">
        <strong>${escapeHtml(invoiceNumber)}</strong><br />
        Generated: ${escapeHtml(generatedAt)}
      </div>
    </div>

    <div class="grid">
      <div class="box">
        <span>Doctor</span>
        <strong>${escapeHtml(doctorName)}</strong>
      </div>
      <div class="box">
        <span>Specialty</span>
        <strong>${escapeHtml(appointment?.specialty || "General Physician")}</strong>
      </div>
      <div class="box">
        <span>Clinic</span>
        <strong>${escapeHtml(appointment?.clinicName || "Clinic unavailable")}</strong>
      </div>
      <div class="box">
        <span>Location</span>
        <strong>${escapeHtml(appointment?.location || "Location unavailable")}</strong>
      </div>
      <div class="box">
        <span>Date</span>
        <strong>${escapeHtml(formatDate(appointment?.appointmentDate))}</strong>
      </div>
      <div class="box">
        <span>Time</span>
        <strong>${escapeHtml(formatSlot(appointment))}</strong>
      </div>
      <div class="box">
        <span>Status</span>
        <strong>${escapeHtml(normalizeStatusLabel(appointment))}</strong>
      </div>
      <div class="box">
        <span>Payment</span>
        <strong>${escapeHtml(appointment?.paymentStatus || "Pay at clinic")}</strong>
      </div>
    </div>

    <div class="total">
      <span>Total</span>
      <span>${escapeHtml(formatFee(appointment?.fee))}</span>
    </div>

    <div class="footer">
      This invoice is generated from the appointment record. Online payments are not enabled in phase 1.
    </div>
  </main>
</body>
</html>
`;
};

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [counts, setCounts] = useState({
    allCount: 0,
    upcomingCount: 0,
    pastCount: 0,
    cancelledCount: 0
  });

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("All");

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState("");

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const [rescheduleForm, setRescheduleForm] = useState({
    appointmentDate: "",
    slotStartTime: "",
    slotEndTime: "",
    notes: ""
  });

  const [cancelReason, setCancelReason] = useState("");
  const [actionKey, setActionKey] = useState("");
  const [toast, setToast] = useState(null);

  const activeApiStatus = useMemo(() => {
    return TAB_OPTIONS.find((tab) => tab.key === activeTab)?.apiStatus || "ALL";
  }, [activeTab]);

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

  const updateCountsFromVisibleAppointments = (visibleAppointments) => {
    setCounts({
      allCount: visibleAppointments.length,
      upcomingCount: visibleAppointments.length,
      pastCount: 0,
      cancelledCount: 0
    });
  };

  const fetchAppointments = useCallback(
    async ({ manual = false } = {}) => {
      if (manual) {
        setRefreshing(true);
      }

      setPageError("");

      try {
        const response = await getPatientAppointments({
          status: activeApiStatus,
          search,
          specialty: specialty === "All" ? "" : specialty
        });

        const rawAppointments = Array.isArray(response?.appointments)
          ? response.appointments
          : [];

        const visibleAppointments = prepareVisibleAppointments(rawAppointments);

        setAppointments(visibleAppointments);
        updateCountsFromVisibleAppointments(visibleAppointments);

        if (manual) {
          showToast(
            "success",
            "Appointments refreshed",
            "Latest active appointments are now on top."
          );
        }
      } catch (error) {
        setAppointments([]);
        updateCountsFromVisibleAppointments([]);
        setPageError(error?.message || "Unable to load appointments.");

        if (manual) {
          showToast(
            "error",
            "Refresh failed",
            error?.message || "Unable to refresh appointments."
          );
        }
      } finally {
        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [activeApiStatus, search, specialty, showToast]
  );

  useEffect(() => {
    const debounce = window.setTimeout(() => {
      fetchAppointments();
    }, 320);

    return () => window.clearTimeout(debounce);
  }, [fetchAppointments]);

  const specialtyOptions = useMemo(() => {
    const values = new Set(DEFAULT_SPECIALTIES);

    appointments.forEach((appointment) => {
      if (appointment?.specialty) {
        values.add(appointment.specialty);
      }

      if (Array.isArray(appointment?.specializations)) {
        appointment.specializations.forEach((item) => {
          if (item) {
            values.add(item);
          }
        });
      }
    });

    return Array.from(values);
  }, [appointments]);

  const replaceAppointment = (updatedAppointment) => {
    setAppointments((previous) => {
      const withoutCurrent = previous.filter(
        (item) => item.id !== updatedAppointment.id
      );

      const nextAppointments = isActiveAppointmentForPage(updatedAppointment)
        ? prepareVisibleAppointments([updatedAppointment, ...withoutCurrent])
        : prepareVisibleAppointments(withoutCurrent);

      updateCountsFromVisibleAppointments(nextAppointments);

      return nextAppointments;
    });
  };

  const handleManualRefresh = () => {
    fetchAppointments({ manual: true });
  };

  const handleReset = () => {
    setSearch("");
    setSpecialty("All");
    setActiveTab("all");
    showToast("success", "Filters cleared", "Appointment list has been reset.");
  };

  const openReschedule = (appointment) => {
    setRescheduleTarget(appointment);
    setRescheduleForm({
      appointmentDate: appointment?.appointmentDate || "",
      slotStartTime: appointment?.slotStartTime || "",
      slotEndTime: appointment?.slotEndTime || "",
      notes: appointment?.notes || ""
    });
  };

  const closeReschedule = () => {
    if (actionKey) {
      return;
    }

    setRescheduleTarget(null);
    setRescheduleForm({
      appointmentDate: "",
      slotStartTime: "",
      slotEndTime: "",
      notes: ""
    });
  };

  const closeCancel = () => {
    if (actionKey) {
      return;
    }

    setCancelTarget(null);
    setCancelReason("");
  };

  const handleRescheduleSubmit = async (event) => {
    event.preventDefault();

    if (!rescheduleTarget?.id) {
      return;
    }

    if (!rescheduleForm.appointmentDate || !rescheduleForm.slotStartTime) {
      showToast("error", "Missing details", "Please select date and start time.");
      return;
    }

    setActionKey(`reschedule-${rescheduleTarget.id}`);

    try {
      const updated = await reschedulePatientAppointment(rescheduleTarget.id, {
        appointmentDate: rescheduleForm.appointmentDate,
        slotStartTime: rescheduleForm.slotStartTime,
        slotEndTime: rescheduleForm.slotEndTime || null,
        notes: rescheduleForm.notes?.trim() || null
      });

      replaceAppointment(updated);
      setRescheduleTarget(null);

      showToast(
        "success",
        "Appointment rescheduled",
        "Updated appointment moved to the top. Email notification will be sent if reminders are enabled."
      );

      fetchAppointments();
    } catch (error) {
      showToast(
        "error",
        "Reschedule failed",
        error?.message || "Unable to reschedule appointment."
      );
    } finally {
      setActionKey("");
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelTarget?.id) {
      return;
    }

    setActionKey(`cancel-${cancelTarget.id}`);

    const reason = cancelReason.trim();

    try {
      const updated = await cancelPatientAppointment(cancelTarget.id, {
        reason: reason || null,
        cancelReason: reason || null
      });

      setAppointments((previous) => {
        const nextAppointments = previous.filter((item) => item.id !== updated.id);
        updateCountsFromVisibleAppointments(nextAppointments);
        return nextAppointments;
      });

      setCancelTarget(null);
      setCancelReason("");

      showToast(
        "success",
        "Appointment cancelled",
        "Appointment removed from active list. Email notification will be sent if reminders are enabled."
      );

      fetchAppointments();
    } catch (error) {
      showToast(
        "error",
        "Cancel failed",
        error?.message || "Unable to cancel appointment."
      );
    } finally {
      setActionKey("");
    }
  };

  const handleEmailReminderChange = async (appointment, checked) => {
    const previousAppointments = appointments;

    setAppointments((previous) =>
      previous.map((item) =>
        item.id === appointment.id
          ? { ...item, emailReminderEnabled: checked }
          : item
      )
    );

    try {
      const updated = await updatePatientAppointmentReminders(appointment.id, {
        emailReminderEnabled: checked
      });

      replaceAppointment(updated);

      showToast(
        "success",
        checked ? "Email reminders enabled" : "Email reminders disabled",
        checked
          ? "You will receive appointment updates and reminders by email."
          : "Email reminders for this appointment are now turned off."
      );
    } catch (error) {
      setAppointments(previousAppointments);
      updateCountsFromVisibleAppointments(previousAppointments);

      showToast(
        "error",
        "Reminder update failed",
        error?.message || "Unable to update email reminder preference."
      );
    }
  };

  const handleDisabledReminderClick = (channelName) => {
    showToast(
      "error",
      `${channelName} not available yet`,
      `${channelName} delivery is not connected in this phase. Email reminders are active.`
    );
  };

  const handleCallClinic = (appointment) => {
    const phone = sanitizePhone(appointment?.clinicContactNumber);

    if (!phone) {
      showToast(
        "error",
        "Clinic number missing",
        "This clinic has not provided a contact number."
      );
      return;
    }

    window.location.href = `tel:${phone}`;

    showToast(
      "success",
      "Opening dialer",
      `Calling ${appointment?.clinicName || "clinic"}.`
    );
  };

  const handleMessageClinic = (appointment) => {
    const phone = sanitizePhone(appointment?.clinicContactNumber);

    if (!phone) {
      showToast(
        "error",
        "Clinic number missing",
        "Message cannot be started without clinic contact number."
      );
      return;
    }

    const message = `Hello, I want to discuss my appointment with ${getDoctorDisplayName(
      appointment?.doctorName
    )} on ${formatDate(appointment?.appointmentDate)} at ${formatSlot(appointment)}.`;

    window.location.href = `sms:${phone}?body=${encodeURIComponent(message)}`;

    showToast(
      "success",
      "Opening messages",
      "Your device message app is being opened."
    );
  };

  const handleDownloadInvoice = (appointment) => {
    try {
      const html = buildInvoiceHtml(appointment);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `DoctorsHub_Appointment_${appointment?.id || "Invoice"}.html`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      showToast(
        "success",
        "Invoice downloaded",
        "Appointment invoice file has been downloaded."
      );
    } catch {
      showToast(
        "error",
        "Download failed",
        "Unable to generate invoice right now."
      );
    }
  };

  const renderReminderControls = (appointment) => {
    return (
      <div className="apx-reminder-options">
        {REMINDER_CHANNELS.map((channel) => {
          if (channel.enabled) {
            return (
              <label className="apx-reminder-switch" key={channel.key}>
                <input
                  type="checkbox"
                  checked={Boolean(appointment.emailReminderEnabled)}
                  onChange={(event) =>
                    handleEmailReminderChange(appointment, event.target.checked)
                  }
                />
                <span className="apx-toggle-ui" aria-hidden="true" />
                <span className="apx-reminder-text">
                  <strong>{channel.label}</strong>
                  <small>{channel.status}</small>
                </span>
              </label>
            );
          }

          return (
            <button
              type="button"
              className="apx-reminder-chip apx-reminder-chip-disabled"
              key={channel.key}
              onClick={() => handleDisabledReminderClick(channel.label)}
            >
              <strong>{channel.label}</strong>
              <small>{channel.status}</small>
            </button>
          );
        })}
      </div>
    );
  };

  const renderContent = () => {
    if (initialLoading) {
      return (
        <div className="apx-state-card">
          <div className="apx-loader" />
          <h3>Loading appointments</h3>
          <p>Fetching your latest appointment records from Doctor&apos;s Hub.</p>
        </div>
      );
    }

    if (pageError) {
      return (
        <div className="apx-state-card apx-state-error">
          <FiAlertCircle />
          <h3>Unable to load appointments</h3>
          <p>{pageError}</p>
          <button type="button" onClick={handleManualRefresh}>
            Retry
          </button>
        </div>
      );
    }

    if (appointments.length === 0) {
      return (
        <div className="apx-state-card">
          <FiCalendar />
          <h3>No active appointments found</h3>
          <p>
            Cancelled and completed appointments are hidden from this page.
            Past consultations will be available in the Past Consultations section.
          </p>
          <button type="button" onClick={handleReset}>
            Clear filters
          </button>
        </div>
      );
    }

    return (
      <section className="apx-card-grid" aria-label="Appointment list">
        {appointments.map((appointment) => {
          const visualStatus = getVisualStatus(appointment);
          const canReschedule = Boolean(appointment.canReschedule);
          const canCancel = Boolean(appointment.canCancel);
          const isBusy =
            actionKey === `reschedule-${appointment.id}` ||
            actionKey === `cancel-${appointment.id}`;

          return (
            <article
              className={`apx-card apx-card-${visualStatus}`}
              key={appointment.id}
            >
              <div className="apx-card-top">
                <div className="apx-avatar">
                  {appointment.doctorImageUrl ? (
                    <img
                      src={appointment.doctorImageUrl}
                      alt={getDoctorDisplayName(appointment.doctorName)}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                  <span>{getInitials(appointment.doctorName)}</span>
                </div>

                <div className="apx-card-main">
                  <div className="apx-card-title-row">
                    <div className="apx-doctor-copy">
                      <h2>{getDoctorDisplayName(appointment.doctorName)}</h2>
                      <p>{appointment.specialty || "General Physician"}</p>
                    </div>

                    <span className={`apx-status apx-status-${visualStatus}`}>
                      {normalizeStatusLabel(appointment)}
                    </span>
                  </div>

                  <div className="apx-clinic">
                    <FiShield />
                    <span>{appointment.clinicName || "Clinic unavailable"}</span>
                  </div>

                  <div className="apx-info-grid">
                    <div>
                      <FiCalendar />
                      <span>{formatDate(appointment.appointmentDate)}</span>
                    </div>
                    <div>
                      <FiClock />
                      <span>{formatSlot(appointment)}</span>
                    </div>
                    <div>
                      <FiMapPin />
                      <span>{appointment.location || "Location unavailable"}</span>
                    </div>
                    <div>
                      <FiUser />
                      <span>{appointment.patientProfileType || "SELF"}</span>
                    </div>
                  </div>

                  <div className="apx-fee-row">
                    <strong>{formatFee(appointment.fee)}</strong>
                    <span>{appointment.paymentStatus || "Pay at clinic"}</span>
                  </div>
                </div>
              </div>

              <div className="apx-reminder-row">
                <div className="apx-reminder-label">
                  <FiBell />
                  <div>
                    <span>Reminder preferences</span>
                    <small>Email is connected. SMS/Push coming later.</small>
                  </div>
                </div>

                {renderReminderControls(appointment)}
              </div>

              <div className="apx-actions">
                <button
                  type="button"
                  className="apx-btn apx-btn-primary"
                  onClick={() => setSelectedAppointment(appointment)}
                  disabled={isBusy}
                >
                  View Details
                </button>

                <button
                  type="button"
                  className="apx-btn apx-btn-soft"
                  onClick={() => openReschedule(appointment)}
                  disabled={!canReschedule || isBusy}
                >
                  Reschedule
                </button>

                <button
                  type="button"
                  className="apx-btn apx-btn-danger"
                  onClick={() => {
                    setCancelTarget(appointment);
                    setCancelReason("");
                  }}
                  disabled={!canCancel || isBusy}
                >
                  Cancel
                </button>
              </div>
            </article>
          );
        })}
      </section>
    );
  };

  return (
    <div className="apx-page">
      <div className="apx-shell">
        <section className="apx-header-card">
          <div className="apx-title-block">
            <span>Patient appointments</span>
            <h1>My Appointments</h1>
            <p>
              Manage active bookings, email reminders, rescheduling and
              cancellation from one clean workspace.
            </p>
          </div>

          <button
            type="button"
            className="apx-refresh"
            onClick={handleManualRefresh}
            disabled={refreshing}
          >
            <FiRefreshCw className={refreshing ? "apx-spin" : ""} />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
        </section>

        <section className="apx-filter-card">
          <div className="apx-search">
            <FiSearch />
            <input
              type="text"
              placeholder="Search doctor, clinic, specialty, city or status"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="apx-select">
            <FiFilter />
            <select
              value={specialty}
              onChange={(event) => setSpecialty(event.target.value)}
              aria-label="Filter by specialty"
            >
              {specialtyOptions.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All Specialties" : item}
                </option>
              ))}
            </select>
            <FiChevronDown />
          </div>

          <button type="button" className="apx-reset" onClick={handleReset}>
            Reset
          </button>
        </section>

        <nav className="apx-tabs" aria-label="Appointment status filters">
          {TAB_OPTIONS.map((tab) => (
            <button
              type="button"
              key={tab.key}
              className={`apx-tab ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.label}</span>
              <strong>{getTabCount(counts, tab.key)}</strong>
            </button>
          ))}
        </nav>

        {renderContent()}
      </div>

      {selectedAppointment && (
        <div
          className="apx-modal-backdrop"
          role="presentation"
          onMouseDown={() => setSelectedAppointment(null)}
        >
          <section
            className="apx-modal apx-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Appointment details"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="apx-modal-header">
              <div>
                <span>Appointment details</span>
                <h2>{getDoctorDisplayName(selectedAppointment.doctorName)}</h2>
              </div>

              <button type="button" onClick={() => setSelectedAppointment(null)}>
                <FiX />
              </button>
            </div>

            <div className="apx-detail-grid">
              <div>
                <span>Specialty</span>
                <strong>
                  {selectedAppointment.specialty || "General Physician"}
                </strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{normalizeStatusLabel(selectedAppointment)}</strong>
              </div>
              <div>
                <span>Clinic</span>
                <strong>
                  {selectedAppointment.clinicName || "Clinic unavailable"}
                </strong>
              </div>
              <div>
                <span>Location</span>
                <strong>
                  {selectedAppointment.location || "Location unavailable"}
                </strong>
              </div>
              <div>
                <span>Date</span>
                <strong>{formatDate(selectedAppointment.appointmentDate)}</strong>
              </div>
              <div>
                <span>Time</span>
                <strong>{formatSlot(selectedAppointment)}</strong>
              </div>
              <div>
                <span>Fee</span>
                <strong>{formatFee(selectedAppointment.fee)}</strong>
              </div>
              <div>
                <span>Payment</span>
                <strong>
                  {selectedAppointment.paymentStatus || "Pay at clinic"}
                </strong>
              </div>
            </div>

            <div className="apx-note-box">
              <span>Notes</span>
              <p>
                {selectedAppointment.notes ||
                  "No notes added for this appointment."}
              </p>
            </div>

            {selectedAppointment.cancelReason && (
              <div className="apx-note-box apx-cancel-reason">
                <span>Cancellation reason</span>
                <p>{selectedAppointment.cancelReason}</p>
              </div>
            )}

            <div className="apx-modal-actions">
              <button
                type="button"
                onClick={() => handleCallClinic(selectedAppointment)}
              >
                <FiPhone />
                Call clinic
              </button>
              <button
                type="button"
                onClick={() => handleMessageClinic(selectedAppointment)}
              >
                <FiMessageCircle />
                Message
              </button>
              <button
                type="button"
                onClick={() => handleDownloadInvoice(selectedAppointment)}
              >
                <FiDownload />
                Invoice
              </button>
            </div>
          </section>
        </div>
      )}

      {rescheduleTarget && (
        <div
          className="apx-modal-backdrop"
          role="presentation"
          onMouseDown={closeReschedule}
        >
          <section
            className="apx-modal apx-form-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Reschedule appointment"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="apx-modal-header">
              <div>
                <span>Reschedule appointment</span>
                <h2>{getDoctorDisplayName(rescheduleTarget.doctorName)}</h2>
              </div>

              <button type="button" onClick={closeReschedule}>
                <FiX />
              </button>
            </div>

            <form className="apx-form" onSubmit={handleRescheduleSubmit}>
              <label>
                New date
                <input
                  type="date"
                  min={getTodayInputDate()}
                  value={rescheduleForm.appointmentDate}
                  onChange={(event) =>
                    setRescheduleForm((previous) => ({
                      ...previous,
                      appointmentDate: event.target.value
                    }))
                  }
                />
              </label>

              <div className="apx-form-grid">
                <label>
                  Start time
                  <input
                    type="time"
                    value={rescheduleForm.slotStartTime}
                    onChange={(event) =>
                      setRescheduleForm((previous) => ({
                        ...previous,
                        slotStartTime: event.target.value
                      }))
                    }
                  />
                </label>

                <label>
                  End time
                  <input
                    type="time"
                    value={rescheduleForm.slotEndTime}
                    onChange={(event) =>
                      setRescheduleForm((previous) => ({
                        ...previous,
                        slotEndTime: event.target.value
                      }))
                    }
                  />
                </label>
              </div>

              <label>
                Notes
                <textarea
                  rows="3"
                  placeholder="Optional note for clinic or doctor"
                  value={rescheduleForm.notes}
                  onChange={(event) =>
                    setRescheduleForm((previous) => ({
                      ...previous,
                      notes: event.target.value
                    }))
                  }
                />
              </label>

              <button
                type="submit"
                disabled={actionKey === `reschedule-${rescheduleTarget.id}`}
              >
                {actionKey === `reschedule-${rescheduleTarget.id}`
                  ? "Updating..."
                  : "Update appointment"}
              </button>
            </form>
          </section>
        </div>
      )}

      {cancelTarget && (
        <div
          className="apx-modal-backdrop"
          role="presentation"
          onMouseDown={closeCancel}
        >
          <section
            className="apx-modal apx-cancel-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Cancel appointment"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="apx-warning">
              <FiTrash2 />
            </div>

            <h2>Cancel appointment?</h2>
            <p>
              This will cancel your appointment with{" "}
              <strong>{getDoctorDisplayName(cancelTarget.doctorName)}</strong>.
              Email notification will be sent if email reminders are enabled.
            </p>

            <label>
              Reason
              <textarea
                rows="3"
                placeholder="Optional cancellation reason"
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
              />
            </label>

            <div className="apx-cancel-actions">
              <button type="button" className="apx-keep" onClick={closeCancel}>
                Keep appointment
              </button>
              <button
                type="button"
                className="apx-confirm-cancel"
                onClick={handleCancelSubmit}
                disabled={actionKey === `cancel-${cancelTarget.id}`}
              >
                {actionKey === `cancel-${cancelTarget.id}`
                  ? "Cancelling..."
                  : "Yes, cancel"}
              </button>
            </div>
          </section>
        </div>
      )}

      {toast && (
        <div className={`apx-toast apx-toast-${toast.type}`} role="status">
          <div className="apx-toast-icon">
            {toast.type === "success" ? <FiCheckCircle /> : <FiAlertCircle />}
          </div>
          <div className="apx-toast-copy">
            <strong>{toast.title}</strong>
            {toast.message && <span>{toast.message}</span>}
          </div>
          <button type="button" onClick={() => setToast(null)}>
            <FiX />
          </button>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;