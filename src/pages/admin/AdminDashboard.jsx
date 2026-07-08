import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  HelpCircle,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldCheck,
  Stethoscope,
  Ticket,
  UserRound,
  UsersRound,
  XCircle
} from "lucide-react";
import { getAdminDashboard } from "../../services/adminService";
import "./AdminDashboard.css";

const SUPPORTED_ADMIN_ROUTES = new Set([
  "/admin",
  "/admin/dashboard",
  "/admin/appointments",
  "/admin/doctors",
  "/admin/verify-doctors",
  "/admin/users",
  "/admin/hospitals",
  "/admin/labs",
  "/admin/feedback",
  "/admin/blogs",
  "/admin/notifications",
  "/admin/ads-management",
  "/admin/system-logs",
  "/admin/profile"
]);

const getRouteBase = (route) => {
  if (!route || typeof route !== "string") {
    return "";
  }

  return route.split("?")[0].split("#")[0];
};

const isSupportedAdminRoute = (route) => {
  const baseRoute = getRouteBase(route);
  return SUPPORTED_ADMIN_ROUTES.has(baseRoute);
};

const getSafeAdminRoute = (route) => {
  if (!route || typeof route !== "string") {
    return null;
  }

  return isSupportedAdminRoute(route) ? route : null;
};

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState({
    stats: {},
    pendingDoctors: [],
    recentFeedback: [],
    recentSupportTickets: [],
    recentAppointments: [],
    systemActivities: [],
    alerts: [],
    generatedAt: null
  });

  const [searchValue, setSearchValue] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const {
    stats = {},
    pendingDoctors = [],
    recentFeedback = [],
    recentSupportTickets = [],
    recentAppointments = [],
    systemActivities = [],
    alerts = [],
    generatedAt = null
  } = dashboard || {};

  const keyword = searchValue.toLowerCase().trim();

  const fetchDashboard = useCallback(async (initialLoad = false) => {
    try {
      if (initialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");
      const data = await getAdminDashboard();

      setDashboard({
        stats: data?.stats || {},
        pendingDoctors: data?.pendingDoctors || [],
        recentFeedback: data?.recentFeedback || [],
        recentSupportTickets: data?.recentSupportTickets || [],
        recentAppointments: data?.recentAppointments || [],
        systemActivities: data?.systemActivities || [],
        alerts: data?.alerts || [],
        generatedAt: data?.generatedAt || Date.now()
      });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Unable to load admin dashboard right now.";

      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(true);
  }, [fetchDashboard]);

  const goToRoute = (route) => {
    const safeRoute = getSafeAdminRoute(route);

    if (!safeRoute) {
      return;
    }

    navigate(safeRoute);
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "0";
    }

    return new Intl.NumberFormat("en-IN").format(Number(value));
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "—";

    const date = new Date(Number(timestamp));

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "—";

    const date = new Date(Number(timestamp));

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    const diffMs = Date.now() - date.getTime();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < 0) return formatDateTime(timestamp);
    if (diffMs < minute) return "Just now";
    if (diffMs < hour) return `${Math.floor(diffMs / minute)} min ago`;
    if (diffMs < day) return `${Math.floor(diffMs / hour)} hr ago`;

    return formatDateTime(timestamp);
  };

  const getStatusLabel = (value) => {
    if (!value) return "Unknown";

    return String(value)
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getInitials = (name) => {
    if (!name) return "NA";

    const parts = String(name).trim().split(" ").filter(Boolean);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const safeText = (value, fallback = "—") => {
    if (value === null || value === undefined || String(value).trim() === "") {
      return fallback;
    }

    return value;
  };

  const highlightText = (text) => {
    if (!keyword || !text) return text;

    const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = String(text).split(new RegExp(`(${safeKeyword})`, "gi"));

    return parts.map((part, index) =>
      part.toLowerCase() === keyword ? (
        <mark key={`${part}-${index}`} className="adh-search-highlight">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getPendingDoctorRoute = useCallback((doctorProfileId) => {
    if (!doctorProfileId) {
      return "/admin/verify-doctors";
    }

    return `/admin/verify-doctors?highlight=${doctorProfileId}`;
  }, []);

  const getFeedbackRoute = useCallback((feedbackId) => {
    if (!feedbackId) {
      return "/admin/feedback";
    }

    return `/admin/feedback?highlight=${feedbackId}`;
  }, []);

  const getAppointmentRoute = useCallback((appointmentId) => {
    if (!appointmentId) {
      return "/admin/appointments";
    }

    return `/admin/appointments?highlight=${appointmentId}`;
  }, []);

  const getAlertRoute = (alert) => {
    const backendRoute = getSafeAdminRoute(alert?.actionUrl);

    if (backendRoute) {
      return backendRoute;
    }

    const text = `${alert?.title || ""} ${alert?.message || ""}`.toLowerCase();

    if (text.includes("doctor") && text.includes("verification")) {
      return "/admin/verify-doctors";
    }

    if (text.includes("feedback")) {
      return "/admin/feedback?status=NEW";
    }

    if (text.includes("appointment")) {
      return "/admin/appointments";
    }

    return null;
  };

  const getActivityRoute = useCallback(
    (activity) => {
      const type = String(activity?.type || "").toUpperCase();
      const referenceId = activity?.referenceId;

      if (type.includes("SUPPORT") || type.includes("TICKET")) {
        return null;
      }

      if (type.includes("FEEDBACK")) {
        return getFeedbackRoute(referenceId);
      }

      if (type.includes("APPOINTMENT")) {
        return getAppointmentRoute(referenceId);
      }

      if (type.includes("LOGIN")) {
        return "/admin/system-logs";
      }

      return getSafeAdminRoute(activity?.actionUrl) || "/admin/system-logs";
    },
    [getAppointmentRoute, getFeedbackRoute]
  );

  const searchSource = useMemo(() => {
    const doctorItems = pendingDoctors.map((doctor) => ({
      id: `doctor-${doctor.doctorProfileId}`,
      type: "Doctor",
      label: doctor.fullName,
      searchable: [
        doctor.fullName,
        doctor.email,
        doctor.mobile,
        doctor.specialization,
        doctor.city,
        doctor.verificationStatus
      ]
        .filter(Boolean)
        .join(" "),
      route: getPendingDoctorRoute(doctor.doctorProfileId)
    }));

    const feedbackItems = recentFeedback.map((feedback) => ({
      id: `feedback-${feedback.id}`,
      type: "Feedback",
      label: feedback.message,
      searchable: [
        feedback.patientName,
        feedback.message,
        feedback.type,
        feedback.status,
        feedback.rating
      ]
        .filter(Boolean)
        .join(" "),
      route: getFeedbackRoute(feedback.id)
    }));

    const supportItems = recentSupportTickets.map((ticket) => ({
      id: `ticket-${ticket.id}`,
      type: "Support",
      label: ticket.subject,
      searchable: [
        ticket.patientName,
        ticket.subject,
        ticket.category,
        ticket.priority,
        ticket.status
      ]
        .filter(Boolean)
        .join(" "),
      route: null
    }));

    const appointmentItems = recentAppointments.map((appointment) => ({
      id: `appointment-${appointment.id}`,
      type: "Appointment",
      label: `${appointment.patientName} with ${appointment.doctorName}`,
      searchable: [
        appointment.patientName,
        appointment.doctorName,
        appointment.status,
        appointment.slotStartTime,
        appointment.slotEndTime
      ]
        .filter(Boolean)
        .join(" "),
      route: getAppointmentRoute(appointment.id)
    }));

    const activityItems = systemActivities.map((activity, index) => ({
      id: `activity-${activity.referenceId || index}`,
      type: activity.type || "Activity",
      label: activity.title,
      searchable: [
        activity.type,
        activity.title,
        activity.description,
        activity.actorName
      ]
        .filter(Boolean)
        .join(" "),
      route: getActivityRoute(activity)
    }));

    return [
      ...doctorItems,
      ...feedbackItems,
      ...supportItems,
      ...appointmentItems,
      ...activityItems
    ];
  }, [
    pendingDoctors,
    recentFeedback,
    recentSupportTickets,
    recentAppointments,
    systemActivities,
    getPendingDoctorRoute,
    getFeedbackRoute,
    getAppointmentRoute,
    getActivityRoute
  ]);

  const suggestions = useMemo(() => {
    if (!keyword) return [];

    return searchSource
      .filter((item) => item.searchable.toLowerCase().includes(keyword))
      .slice(0, 7);
  }, [keyword, searchSource]);

  const filteredDoctors = useMemo(() => {
    if (!keyword) return pendingDoctors;

    return pendingDoctors.filter((doctor) =>
      [
        doctor.fullName,
        doctor.email,
        doctor.mobile,
        doctor.specialization,
        doctor.city,
        doctor.verificationStatus
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [keyword, pendingDoctors]);

  const filteredFeedback = useMemo(() => {
    if (!keyword) return recentFeedback;

    return recentFeedback.filter((feedback) =>
      [
        feedback.patientName,
        feedback.message,
        feedback.type,
        feedback.status,
        feedback.rating
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [keyword, recentFeedback]);

  const filteredTickets = useMemo(() => {
    if (!keyword) return recentSupportTickets;

    return recentSupportTickets.filter((ticket) =>
      [
        ticket.patientName,
        ticket.subject,
        ticket.category,
        ticket.priority,
        ticket.status
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [keyword, recentSupportTickets]);

  const filteredAppointments = useMemo(() => {
    if (!keyword) return recentAppointments;

    return recentAppointments.filter((appointment) =>
      [
        appointment.patientName,
        appointment.doctorName,
        appointment.status,
        appointment.slotStartTime,
        appointment.slotEndTime
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [keyword, recentAppointments]);

  const filteredActivities = useMemo(() => {
    if (!keyword) return systemActivities;

    return systemActivities.filter((activity) =>
      [activity.type, activity.title, activity.description, activity.actorName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [keyword, systemActivities]);

  const handleSearchSelect = (item) => {
    const label = typeof item === "string" ? item : item?.label;

    if (!label) return;

    setSearchValue(label);
    setShowSuggestions(false);

    setRecentSearches((prev) => {
      const updated = [label, ...prev.filter((value) => value !== label)];
      return updated.slice(0, 5);
    });

    if (item?.route) {
      goToRoute(item.route);
    }
  };

  const clearSearch = () => {
    setSearchValue("");
    setShowSuggestions(false);
  };

  const statCards = [
    {
      title: "Total Doctors",
      value: stats.totalDoctors,
      helper: "Registered doctors",
      icon: Stethoscope,
      route: "/admin/doctors"
    },
    {
      title: "Active Doctors",
      value: stats.activeDoctors,
      helper: "Verified and active",
      icon: ShieldCheck,
      route: "/admin/doctors?status=active"
    },
    {
      title: "Pending Review",
      value: stats.pendingDoctors,
      helper: "Doctor verification",
      icon: Clock3,
      route: "/admin/verify-doctors",
      tone: "warning"
    },
    {
      title: "Patients",
      value: stats.totalPatients,
      helper: "Registered patients",
      icon: UsersRound,
      route: "/admin/users?role=patient"
    },
    {
      title: "Appointments",
      value: stats.totalAppointments,
      helper: `${formatNumber(stats.todayAppointments)} today`,
      icon: CalendarDays,
      route: "/admin/appointments"
    },
    {
      title: "Unread Feedback",
      value: stats.unreadFeedback,
      helper: "Needs review",
      icon: MessageSquare,
      route: "/admin/feedback?status=NEW",
      tone: "danger"
    },
    {
      title: "Open Tickets",
      value: stats.openSupportTickets,
      helper: "Support page coming soon",
      icon: Ticket,
      route: null,
      tone: "warning"
    },
    {
      title: "Rejected Doctors",
      value: stats.rejectedDoctors,
      helper: "Verification rejected",
      icon: XCircle,
      route: "/admin/doctors?status=rejected"
    }
  ];

  if (loading) {
    return (
      <div className="adh-page">
        <div className="adh-loading-card">
          <div className="adh-loading-icon">
            <RefreshCw size={22} />
          </div>
          <h3>Loading admin dashboard</h3>
          <p>Fetching live platform data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="adh-page">
      <div className="adh-header">
        <div>
          <p className="adh-kicker">Admin Control Center</p>
          <h1>Dashboard Overview</h1>
          <p className="adh-subtitle">
            Monitor doctors, patients, appointments, feedback and platform
            activity from one place.
          </p>
        </div>

        <div className="adh-header-actions">
          <div className="adh-updated">
            <span>Last updated</span>
            <strong>{formatDateTime(generatedAt)}</strong>
          </div>

          <button
            type="button"
            className="adh-refresh-btn"
            onClick={() => fetchDashboard(false)}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? "adh-spin" : ""} />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="adh-error-banner">
          <AlertTriangle size={18} />
          <div>
            <strong>Dashboard could not be loaded</strong>
            <p>{error}</p>
          </div>
          <button type="button" onClick={() => fetchDashboard(false)}>
            Try again
          </button>
        </div>
      )}

      <div className="adh-search-card">
        <div className="adh-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search doctors, feedback, tickets, appointments, logs..."
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
          />

          {searchValue && (
            <button
              type="button"
              className="adh-clear-search"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {showSuggestions &&
          (suggestions.length > 0 || recentSearches.length > 0) && (
            <div className="adh-search-suggestions">
              {!keyword && recentSearches.length > 0 && (
                <>
                  <p className="adh-suggestion-title">Recent searches</p>
                  {recentSearches.map((item, index) => (
                    <button
                      type="button"
                      key={`${item}-${index}`}
                      className="adh-suggestion-item"
                      onMouseDown={() => handleSearchSelect(item)}
                    >
                      <span className="adh-suggestion-type">Recent</span>
                      {item}
                    </button>
                  ))}
                </>
              )}

              {keyword &&
                suggestions.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className="adh-suggestion-item"
                    onMouseDown={() => handleSearchSelect(item)}
                  >
                    <span className="adh-suggestion-type">{item.type}</span>
                    <span>{highlightText(item.label)}</span>
                  </button>
                ))}
            </div>
          )}
      </div>

      <div className="adh-stats-grid">
        {statCards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={formatNumber(card.value)}
            helper={card.helper}
            icon={card.icon}
            tone={card.tone}
            onClick={() => goToRoute(card.route)}
          />
        ))}
      </div>

      {alerts.length > 0 && (
        <section className="adh-alert-strip">
          <div className="adh-section-heading">
            <div>
              <p>Priority</p>
              <h2>Admin Alerts</h2>
            </div>
          </div>

          <div className="adh-alert-grid">
            {alerts.map((alert, index) => {
              const alertRoute = getAlertRoute(alert);

              return (
                <button
                  type="button"
                  key={`${alert.title}-${index}`}
                  className={`adh-alert-card adh-alert-${String(
                    alert.severity || "INFO"
                  ).toLowerCase()}`}
                  onClick={() => goToRoute(alertRoute)}
                >
                  <div className="adh-alert-icon">
                    {getAlertIcon(alert.severity)}
                  </div>

                  <div>
                    <h3>{alert.title}</h3>
                    <p>{alert.message}</p>
                    <span>
                      {alertRoute
                        ? alert.actionLabel || "Open"
                        : "Page coming soon"}
                      {alertRoute && <ChevronRight size={14} />}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="adh-main-grid">
        <section className="adh-panel adh-large-panel">
          <div className="adh-section-heading">
            <div>
              <p>Verification Queue</p>
              <h2>Doctors Awaiting Verification</h2>
            </div>

            <button
              type="button"
              className="adh-link-btn"
              onClick={() => goToRoute("/admin/verify-doctors")}
            >
              View all
              <ChevronRight size={15} />
            </button>
          </div>

          {filteredDoctors.length === 0 ? (
            <EmptyState
              title="No doctors found"
              message={
                keyword
                  ? "No pending doctor matched your search."
                  : "No doctor verification is pending right now."
              }
            />
          ) : (
            <div className="adh-list">
              {filteredDoctors.map((doctor) => (
                <div
                  key={doctor.doctorProfileId}
                  className="adh-doctor-row"
                  onClick={() =>
                    goToRoute(getPendingDoctorRoute(doctor.doctorProfileId))
                  }
                >
                  <div className="adh-avatar">
                    {getInitials(doctor.fullName)}
                  </div>

                  <div className="adh-row-main">
                    <div className="adh-row-title-line">
                      <h3>{highlightText(doctor.fullName)}</h3>
                      <StatusBadge status={doctor.verificationStatus} />
                    </div>

                    <p>
                      {highlightText(
                        `${safeText(
                          doctor.specialization,
                          "General"
                        )} • ${safeText(doctor.city, "City not added")}`
                      )}
                    </p>

                    <div className="adh-row-meta">
                      <span>{highlightText(doctor.email)}</span>
                      <span>{safeText(doctor.mobile)}</span>
                      <span>
                        Submitted {formatRelativeTime(doctor.submittedAt)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="adh-icon-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      goToRoute(getPendingDoctorRoute(doctor.doctorProfileId));
                    }}
                  >
                    <Eye size={17} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="adh-panel">
          <div className="adh-section-heading">
            <div>
              <p>Feedback</p>
              <h2>Recent Feedback</h2>
            </div>

            <button
              type="button"
              className="adh-link-btn"
              onClick={() => goToRoute("/admin/feedback")}
            >
              View all
              <ChevronRight size={15} />
            </button>
          </div>

          {filteredFeedback.length === 0 ? (
            <EmptyState
              title="No feedback found"
              message={
                keyword
                  ? "No feedback matched your search."
                  : "No feedback has been submitted yet."
              }
            />
          ) : (
            <div className="adh-compact-list">
              {filteredFeedback.map((feedback) => (
                <button
                  type="button"
                  key={feedback.id}
                  className="adh-feedback-card"
                  onClick={() => goToRoute(getFeedbackRoute(feedback.id))}
                >
                  <div className="adh-feedback-top">
                    <span>{safeText(feedback.patientName, "Patient")}</span>
                    <StatusBadge status={feedback.status} />
                  </div>

                  <p>{highlightText(feedback.message)}</p>

                  <div className="adh-feedback-meta">
                    <span>{getStatusLabel(feedback.type)}</span>
                    <span>Rating {feedback.rating || "—"}</span>
                    <span>{formatRelativeTime(feedback.createdAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="adh-panel">
          <div className="adh-section-heading">
            <div>
              <p>Support</p>
              <h2>Support Tickets</h2>
            </div>

            <button
              type="button"
              className="adh-link-btn adh-disabled-btn"
              disabled
            >
              Page coming soon
            </button>
          </div>

          {filteredTickets.length === 0 ? (
            <EmptyState
              title="No tickets found"
              message={
                keyword
                  ? "No support ticket matched your search."
                  : "No support ticket is open right now."
              }
            />
          ) : (
            <div className="adh-compact-list">
              {filteredTickets.map((ticket) => (
                <button
                  type="button"
                  key={ticket.id}
                  className="adh-ticket-card"
                  onClick={(event) => event.preventDefault()}
                >
                  <div className="adh-ticket-top">
                    <span>{safeText(ticket.ticketNumber)}</span>
                    <StatusBadge status={ticket.status} />
                  </div>

                  <h3>{highlightText(ticket.subject)}</h3>

                  <div className="adh-ticket-meta">
                    <span>{safeText(ticket.patientName, "Patient")}</span>
                    <span>{getStatusLabel(ticket.category)}</span>
                    <span>{getStatusLabel(ticket.priority)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="adh-panel adh-large-panel">
          <div className="adh-section-heading">
            <div>
              <p>Appointments</p>
              <h2>Recent Appointments</h2>
            </div>

            <button
              type="button"
              className="adh-link-btn"
              onClick={() => goToRoute("/admin/appointments")}
            >
              View all
              <ChevronRight size={15} />
            </button>
          </div>

          {filteredAppointments.length === 0 ? (
            <EmptyState
              title="No appointments found"
              message={
                keyword
                  ? "No appointment matched your search."
                  : "No appointment records available yet."
              }
            />
          ) : (
            <>
              <div className="adh-table-wrap adh-desktop-table">
                <table className="adh-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Schedule</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAppointments.map((appointment) => (
                      <tr
                        key={appointment.id}
                        onClick={() =>
                          goToRoute(getAppointmentRoute(appointment.id))
                        }
                      >
                        <td>{highlightText(appointment.patientName)}</td>
                        <td>{highlightText(appointment.doctorName)}</td>
                        <td>
                          <span>
                            {formatDateTime(appointment.appointmentDateTime)}
                          </span>
                          <small>
                            {safeText(appointment.slotStartTime)} -{" "}
                            {safeText(appointment.slotEndTime)}
                          </small>
                        </td>
                        <td>
                          <StatusBadge status={appointment.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="adh-mobile-appointment-list">
                {filteredAppointments.map((appointment) => (
                  <button
                    type="button"
                    key={appointment.id}
                    className="adh-mobile-appointment-card"
                    onClick={() =>
                      goToRoute(getAppointmentRoute(appointment.id))
                    }
                  >
                    <div className="adh-mobile-card-top">
                      <div>
                        <span>Patient</span>
                        <strong>
                          {highlightText(appointment.patientName)}
                        </strong>
                      </div>

                      <StatusBadge status={appointment.status} />
                    </div>

                    <div className="adh-mobile-card-grid">
                      <div>
                        <span>Doctor</span>
                        <strong>
                          {highlightText(appointment.doctorName)}
                        </strong>
                      </div>

                      <div>
                        <span>Schedule</span>
                        <strong>
                          {formatDateTime(appointment.appointmentDateTime)}
                        </strong>
                      </div>

                      <div>
                        <span>Slot</span>
                        <strong>
                          {safeText(appointment.slotStartTime)} -{" "}
                          {safeText(appointment.slotEndTime)}
                        </strong>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="adh-panel adh-large-panel">
          <div className="adh-section-heading">
            <div>
              <p>Platform Timeline</p>
              <h2>System Activity</h2>
            </div>

            <button
              type="button"
              className="adh-link-btn"
              onClick={() => goToRoute("/admin/system-logs")}
            >
              View logs
              <ChevronRight size={15} />
            </button>
          </div>

          {filteredActivities.length === 0 ? (
            <EmptyState
              title="No activity found"
              message={
                keyword
                  ? "No system activity matched your search."
                  : "No platform activity available yet."
              }
            />
          ) : (
            <div className="adh-timeline">
              {filteredActivities.map((activity, index) => {
                const activityRoute = getActivityRoute(activity);

                return (
                  <button
                    type="button"
                    key={`${activity.type}-${activity.referenceId}-${index}`}
                    className="adh-timeline-item"
                    onClick={() => goToRoute(activityRoute)}
                  >
                    <div className="adh-timeline-dot">
                      {getActivityIcon(activity.type)}
                    </div>

                    <div>
                      <div className="adh-timeline-head">
                        <h3>{highlightText(activity.title)}</h3>
                        <span>{formatRelativeTime(activity.createdAt)}</span>
                      </div>

                      <p>{highlightText(activity.description)}</p>

                      <small>
                        {safeText(activity.actorName, "System")} •{" "}
                        {getStatusLabel(activity.type)}
                      </small>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, helper, icon: CardIcon, tone, onClick }) => (
  <button
    type="button"
    className={`adh-stat-card ${tone ? `adh-stat-${tone}` : ""}`}
    onClick={onClick}
  >
    <div className="adh-stat-icon">
      {CardIcon ? <CardIcon size={20} /> : null}
    </div>

    <div>
      <p>{title}</p>
      <h3>{value}</h3>
      <span>{helper}</span>
    </div>
  </button>
);

const StatusBadge = ({ status }) => {
  const normalized = String(status || "UNKNOWN").toLowerCase();

  return (
    <span className={`adh-status-badge adh-status-${normalized}`}>
      {String(status || "Unknown").replaceAll("_", " ")}
    </span>
  );
};

const EmptyState = ({ title, message }) => (
  <div className="adh-empty-state">
    <div>
      <HelpCircle size={22} />
    </div>
    <h3>{title}</h3>
    <p>{message}</p>
  </div>
);

const getAlertIcon = (severity) => {
  const value = String(severity || "INFO").toUpperCase();

  if (value === "WARNING") return <AlertTriangle size={18} />;
  if (value === "SUCCESS") return <CheckCircle2 size={18} />;
  if (value === "DANGER" || value === "ERROR") return <XCircle size={18} />;

  return <Activity size={18} />;
};

const getActivityIcon = (type) => {
  const value = String(type || "").toUpperCase();

  if (value.includes("LOGIN")) return <UserRound size={15} />;
  if (value.includes("FEEDBACK")) return <MessageSquare size={15} />;
  if (value.includes("TICKET") || value.includes("SUPPORT")) {
    return <Ticket size={15} />;
  }
  if (value.includes("APPOINTMENT")) return <CalendarDays size={15} />;

  return <Activity size={15} />;
};

export default AdminDashboard;