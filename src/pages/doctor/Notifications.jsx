import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBell,
  FiCalendar,
  FiChevronRight,
  FiClock,
  FiFileText,
  FiFilter,
  FiInfo,
  FiRefreshCw,
  FiUser,
  FiActivity,
FiEye
} from "react-icons/fi";
import { useNotifications } from "../../context/useNotifications";
import { consumeDoctorNotification, getDoctorNotifications } from "../../services/doctorService";
import "./Notifications.css";

const NOTIFICATION_ICON_MAP = {
  APPOINTMENT: <FiCalendar />,
  PATIENT: <FiUser />,
  PRESCRIPTION: <FiFileText />,
  REPORT: <FiFileText />,
  VISIT: <FiClock />,
  NOTE: <FiFileText />,
  PROFILE: <FiInfo />,
  PROFILE_VIEW: <FiEye />,
  SYSTEM: <FiBell />,
  CRITICAL_ALERT: <FiBell />,
  LAB_ORDER: <FiActivity />
};

const TYPE_FILTERS = [
  "ALL",
  "APPOINTMENT",
  "PATIENT",
  "PRESCRIPTION",
  "REPORT",
  "VISIT",
  "LAB_ORDER",
  "PROFILE_VIEW"
];

const PRIORITY_FILTERS = ["ALL", "CRITICAL", "HIGH", "NORMAL", "LOW"];

const formatDateTime = (timestamp) => {
  if (!timestamp) return "—";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).format(new Date(timestamp));
  } catch {
    return "—";
  }
};

const DoctorNotifications = () => {
  const navigate = useNavigate();

  const {
    unreadCount,
    notificationsError,
    handleNotificationActionSuccess,
    checkForNewNotifications
  } = useNotifications();

  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");

  const loadNotifications = async ({ silentUnreadRefresh = true } = {}) => {
    try {
      setNotificationsLoading(true);
      setPageError("");

      const response = await getDoctorNotifications({
        page: 0,
        size: 20,
        type: selectedType,
        priority: selectedPriority
      });

      const content = Array.isArray(response?.content) ? response.content : [];
      setNotifications(content);

      if (silentUnreadRefresh) {
        await checkForNewNotifications({ silent: true });
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to load notifications right now.";

      setPageError(message);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications({ silentUnreadRefresh: true }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, selectedPriority]);

  const groupedNotifications = useMemo(() => {
    const groups = {};

    notifications.forEach((notification) => {
      const key = notification?.type || "SYSTEM";

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(notification);
    });

    return groups;
  }, [notifications]);

  const handleNotificationClick = async (notification) => {
    if (!notification?.id || actionLoadingId) return;

    try {
      setActionLoadingId(notification.id);

      const response = await consumeDoctorNotification(notification.id);

      setNotifications((prev) =>
        prev.filter((item) => item.id !== notification.id)
      );

      await handleNotificationActionSuccess();

      const targetRoute =
        response?.targetRoute ||
        notification?.targetRoute ||
        "/doctor/dashboard";

      navigate(targetRoute);
    } catch (error) {
      console.error("Failed to consume notification:", error);
      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to open notification right now."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRefresh = async () => {
    try {
      await loadNotifications({ silentUnreadRefresh: true });
    } catch (error) {
      console.error("Failed to refresh notifications:", error);
    }
  };

  const effectiveError = pageError || notificationsError;

  return (
    <div className="doctor-notifications-page">
      <div className="notif-page-header">
        <div className="notif-header-left">
          <p className="notif-eyebrow">Inbox</p>
          <h2>Notifications</h2>
          <p className="notif-subtext">
            You have <strong>{unreadCount}</strong> active unread notification
            {unreadCount === 1 ? "" : "s"}.
          </p>
        </div>

        <button
          type="button"
          className="notif-refresh-btn"
          onClick={handleRefresh}
          disabled={notificationsLoading}
        >
          <FiRefreshCw />
          <span>{notificationsLoading ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      <div className="notif-filters-bar">
        <div className="notif-filter-group">
          <div className="notif-filter-label">
            <FiFilter />
            <span>Type</span>
          </div>

          <div className="notif-filter-chips">
            {TYPE_FILTERS.map((type) => (
              <button
                key={type}
                type="button"
                className={`notif-filter-chip ${selectedType === type ? "active" : ""}`}
                onClick={() => setSelectedType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="notif-filter-group">
          <div className="notif-filter-label">
            <FiFilter />
            <span>Priority</span>
          </div>

          <div className="notif-filter-chips">
            {PRIORITY_FILTERS.map((priority) => (
              <button
                key={priority}
                type="button"
                className={`notif-filter-chip ${selectedPriority === priority ? "active" : ""}`}
                onClick={() => setSelectedPriority(priority)}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>
      </div>

      {notificationsLoading && notifications.length === 0 ? (
        <div className="notif-state-card">
          <p>Loading notifications...</p>
        </div>
      ) : effectiveError ? (
        <div className="notif-state-card notif-state-error">
          <h3>Unable to load notifications</h3>
          <p>{effectiveError}</p>
          <button type="button" onClick={handleRefresh}>
            Try Again
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="notif-empty-state">
          <div className="notif-empty-icon">
            <FiBell />
          </div>
          <h3>No active notifications</h3>
          <p>
            There are no notifications matching the selected filters right now.
          </p>
        </div>
      ) : (
        <div className="notif-groups-wrapper">
          {Object.entries(groupedNotifications).map(([type, items]) => (
            <section key={type} className="notif-group-section">
              <div className="notif-group-head">
                <h3>{type.replace(/_/g, " ")}</h3>
                <span>{items.length}</span>
              </div>

              <div className="notif-list">
                {items.map((notification) => {
                  const isActionLoading = actionLoadingId === notification.id;

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      className="notif-card-item"
                      onClick={() => handleNotificationClick(notification)}
                      disabled={isActionLoading}
                    >
                      <div className="notif-icon-box">
                        {NOTIFICATION_ICON_MAP[notification.type] || <FiBell />}
                      </div>

                      <div className="notif-content-wrapper">
                        <div className="notif-main-row">
                          <div className="notif-text-block">
                            <h4 className="notif-title">
                              {notification.title || "Notification"}
                            </h4>
                            <p className="notif-msg">
                              {notification.message || "No message available"}
                            </p>
                          </div>

                          <span className="notif-timestamp">
                            <FiClock className="time-icon" />
                            {formatDateTime(notification.createdAt)}
                          </span>
                        </div>

                        <div className="notif-meta-row">
                          <span
                            className={`notif-type-pill type-${(
                              notification.type || ""
                            ).toLowerCase()}`}
                          >
                            {notification.type || "SYSTEM"}
                          </span>

                          {notification.priority && (
                            <span
                              className={`notif-priority-pill priority-${notification.priority.toLowerCase()}`}
                            >
                              {notification.priority}
                            </span>
                          )}
                        </div>
                      </div>

                      <FiChevronRight className="notif-arrow" />
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorNotifications;