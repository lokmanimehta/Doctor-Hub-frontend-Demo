import React, {
  useCallback,
  useEffect,
  useState
} from "react";

import { useNavigate } from "react-router-dom";

import {
  FiAlertCircle,
  FiArrowRight,
  FiBell,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw
} from "react-icons/fi";

import {
  consumeAdminNotification,
  getAdminNotifications,
  getAdminUnreadNotificationCount
} from "../../services/adminService";

import "./AdminNotifications.css";

const TYPES = [
  "ALL",
  "DOCTOR_VERIFICATION",
  "APPOINTMENT",
  "USER",
  "HOSPITAL",
  "LAB",
  "FEEDBACK",
  "SUPPORT",
  "CONTACT",
  "CARE_COORDINATOR",
  "BLOG",
  "SECURITY",
  "SYSTEM"
];

const PRIORITIES = [
  "ALL",
  "CRITICAL",
  "HIGH",
  "NORMAL",
  "LOW"
];

const AdminNotifications = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [page, setPage] = useState(0);
  const [size] = useState(20);

  const [totalPages, setTotalPages] =
    useState(0);

  const [totalElements, setTotalElements] =
    useState(0);

  const [selectedType, setSelectedType] =
    useState("ALL");

  const [selectedPriority, setSelectedPriority] =
    useState("ALL");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [consumeLoadingId, setConsumeLoadingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const getErrorMessage = (requestError) =>
    requestError?.response?.data?.message ||
    requestError?.response?.data?.error ||
    requestError?.message ||
    "Unable to load admin notifications.";

  const loadNotifications = useCallback(
    async (showFullLoader = true) => {
      if (showFullLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      try {
        const [
          notificationResponse,
          unreadResponse
        ] = await Promise.all([
          getAdminNotifications({
            page,
            size,
            type: selectedType,
            priority: selectedPriority
          }),

          getAdminUnreadNotificationCount()
        ]);

        setNotifications(
          Array.isArray(notificationResponse?.content)
            ? notificationResponse.content
            : []
        );

        setTotalPages(
          Number(notificationResponse?.totalPages || 0)
        );

        setTotalElements(
          Number(notificationResponse?.totalElements || 0)
        );

        setUnreadCount(
          Number(unreadResponse?.unreadCount || 0)
        );
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      page,
      size,
      selectedType,
      selectedPriority
    ]
  );

  useEffect(() => {
    loadNotifications(true);
  }, [loadNotifications]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadNotifications(false);
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadNotifications]);

  const handleTypeChange = (event) => {
    setPage(0);
    setSelectedType(event.target.value);
  };

  const handlePriorityChange = (event) => {
    setPage(0);
    setSelectedPriority(event.target.value);
  };

  const handleOpenNotification = async (
    notification
  ) => {
    if (!notification?.id) {
      return;
    }

    setConsumeLoadingId(notification.id);
    setError("");

    try {
      const response =
        await consumeAdminNotification(
          notification.id
        );

      const targetRoute =
        response?.targetRoute ||
        notification?.targetRoute ||
        "/admin/notifications";

      setNotifications((current) =>
        current.filter(
          (item) => item.id !== notification.id
        )
      );

      setUnreadCount((current) =>
        Math.max(0, current - 1)
      );

      navigate(targetRoute);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setConsumeLoadingId(null);
    }
  };

  const formatLabel = (value) =>
    String(value || "")
      .toLowerCase()
      .split("_")
      .map(
        (part) =>
          part.charAt(0).toUpperCase() +
          part.slice(1)
      )
      .join(" ");

  const formatDateTime = (timestamp) => {
    if (!timestamp) {
      return "Time unavailable";
    }

    return new Date(timestamp).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short"
      }
    );
  };

  return (
    <div className="admin-notifications-page">
      <section className="admin-notifications-header">
        <div>
          <span className="admin-notifications-eyebrow">
            Admin Center
          </span>

          <h1>Notifications</h1>

          <p>
            Review important activity, security alerts
            and platform updates.
          </p>
        </div>

        <button
          type="button"
          className="admin-notifications-refresh"
          disabled={refreshing}
          onClick={() => loadNotifications(false)}
        >
          <FiRefreshCw
            className={
              refreshing
                ? "admin-notifications-spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </section>

      <section className="admin-notifications-summary">
        <article>
          <span>Unread</span>
          <strong>{unreadCount}</strong>
        </article>

        <article>
          <span>Total Results</span>
          <strong>{totalElements}</strong>
        </article>

        <article>
          <span>Current Page</span>
          <strong>
            {totalPages === 0 ? 0 : page + 1}
          </strong>
        </article>
      </section>

      <section className="admin-notifications-filters">
        <div>
          <label htmlFor="notification-type">
            Type
          </label>

          <select
            id="notification-type"
            value={selectedType}
            onChange={handleTypeChange}
          >
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="notification-priority">
            Priority
          </label>

          <select
            id="notification-priority"
            value={selectedPriority}
            onChange={handlePriorityChange}
          >
            {PRIORITIES.map((priority) => (
              <option
                key={priority}
                value={priority}
              >
                {formatLabel(priority)}
              </option>
            ))}
          </select>
        </div>
      </section>

      {error && (
        <div className="admin-notifications-error">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="admin-notifications-state">
          <FiRefreshCw className="admin-notifications-spin" />
          <h3>Loading notifications</h3>
        </div>
      ) : notifications.length === 0 ? (
        <div className="admin-notifications-state">
          <FiBell />
          <h3>No notifications found</h3>
          <p>
            New admin notifications will appear here.
          </p>
        </div>
      ) : (
        <section className="admin-notifications-list">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`admin-notification-card priority-${String(
                notification.priority || "NORMAL"
              ).toLowerCase()}`}
            >
              <div className="admin-notification-icon">
                <FiBell />
              </div>

              <div className="admin-notification-content">
                <div className="admin-notification-heading">
                  <div>
                    <h3>{notification.title}</h3>

                    <span>
                      {formatDateTime(
                        notification.createdAt
                      )}
                    </span>
                  </div>

                  <span
                    className={`admin-notification-priority priority-${String(
                      notification.priority ||
                        "NORMAL"
                    ).toLowerCase()}`}
                  >
                    {formatLabel(
                      notification.priority
                    )}
                  </span>
                </div>

                <p>{notification.message}</p>

                <div className="admin-notification-meta">
                  <span>
                    {formatLabel(notification.type)}
                  </span>

                  {notification.referenceEntityType && (
                    <span>
                      {formatLabel(
                        notification.referenceEntityType
                      )}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="admin-notification-open"
                disabled={
                  consumeLoadingId === notification.id
                }
                onClick={() =>
                  handleOpenNotification(notification)
                }
              >
                {consumeLoadingId === notification.id
                  ? "Opening..."
                  : "Review"}

                <FiArrowRight />
              </button>
            </article>
          ))}
        </section>
      )}

      {totalPages > 1 && (
        <section className="admin-notifications-pagination">
          <button
            type="button"
            disabled={page <= 0}
            onClick={() =>
              setPage((current) =>
                Math.max(0, current - 1)
              )
            }
          >
            <FiChevronLeft />
            Previous
          </button>

          <span>
            Page {page + 1} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page + 1 >= totalPages}
            onClick={() =>
              setPage((current) => current + 1)
            }
          >
            Next
            <FiChevronRight />
          </button>
        </section>
      )}
    </div>
  );
};

export default AdminNotifications;