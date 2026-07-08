import React, {
  useCallback,
  useEffect,
  useState
} from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowUpRight,
  FiCalendar,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiEye,
  FiLock,
  FiRefreshCw,
  FiShield,
  FiTrendingUp,
  FiUser,
  FiUsers
} from "react-icons/fi";
import {
  getDoctorProfileViewAccess,
  getDoctorProfileViews,
  getDoctorProfileViewSummary
} from "../../services/doctorService";
import "./ProfileViews.css";

const DEFAULT_ACCESS = {
  featureCode: "PROFILE_VIEWER_IDENTITY",
  active: false,
  status: "INACTIVE",
  startsAt: null,
  expiresAt: null
};

const DEFAULT_SUMMARY = {
  totalViews: 0,
  uniqueViewers: 0,
  viewsToday: 0,
  viewsThisWeek: 0,
  uniqueViewersThisWeek: 0,
  identityAccess: false
};

const PAGE_SIZE = 20;

const formatNumber = (value) => {
  const numericValue = Number(value || 0);

  return new Intl.NumberFormat("en-IN").format(
    numericValue
  );
};

const formatDateTime = (timestamp) => {
  if (!timestamp) {
    return "Date unavailable";
  }

  const parsedDate = new Date(timestamp);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};

const formatExpiryDate = (timestamp) => {
  if (!timestamp) {
    return "No fixed expiry";
  }

  const parsedDate = new Date(timestamp);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Expiry unavailable";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const getInitials = (name) => {
  return (name || "Patient")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const getAccessStatusLabel = (access) => {
  if (access?.active) {
    return "Active";
  }

  if (access?.status === "CANCELLED") {
    return "Inactive";
  }

  if (access?.status === "EXPIRED") {
    return "Expired";
  }

  return "Locked";
};

const ViewerAvatar = ({ view }) => {
  const [imageFailed, setImageFailed] =
    useState(false);

  if (view?.masked) {
    return (
      <div className="pvi-viewer-avatar pvi-viewer-avatar-locked">
        <FiLock />
      </div>
    );
  }

  const shouldShowImage =
    Boolean(view?.viewerProfileImageUrl) &&
    !imageFailed;

  return (
    <div className="pvi-viewer-avatar">
      {shouldShowImage ? (
        <img
          src={view.viewerProfileImageUrl}
          alt={view.viewerName || "Patient"}
          onError={() => {
            setImageFailed(true);
          }}
        />
      ) : (
        <span>
          {getInitials(view?.viewerName)}
        </span>
      )}
    </div>
  );
};

const ProfileViews = () => {
  const navigate = useNavigate();

  const [access, setAccess] =
    useState(DEFAULT_ACCESS);

  const [summary, setSummary] =
    useState(DEFAULT_SUMMARY);

  const [views, setViews] = useState([]);

  const [page, setPage] = useState(0);

  const [totalPages, setTotalPages] =
    useState(0);

  const [totalElements, setTotalElements] =
    useState(0);

  const [hasNext, setHasNext] =
    useState(false);

  const [hasPrevious, setHasPrevious] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [pageError, setPageError] =
    useState("");

  const loadProfileInsights = useCallback(
    async ({ refresh = false } = {}) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setPageError("");

        const [
          accessResponse,
          summaryResponse,
          listResponse
        ] = await Promise.all([
          getDoctorProfileViewAccess(),
          getDoctorProfileViewSummary(),
          getDoctorProfileViews({
            page,
            size: PAGE_SIZE
          })
        ]);

        setAccess(
          accessResponse || DEFAULT_ACCESS
        );

        setSummary(
          summaryResponse || DEFAULT_SUMMARY
        );

        setViews(
          Array.isArray(listResponse?.content)
            ? listResponse.content
            : []
        );

        setTotalPages(
          Number(listResponse?.totalPages || 0)
        );

        setTotalElements(
          Number(listResponse?.totalElements || 0)
        );

        setHasNext(
          Boolean(listResponse?.hasNext)
        );

        setHasPrevious(
          Boolean(listResponse?.hasPrevious)
        );
      } catch (error) {
        console.error(
          "Unable to load profile insights:",
          error
        );

        setPageError(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to load profile insights."
        );

        setViews([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page]
  );

  useEffect(() => {
    loadProfileInsights().catch(() => {});
  }, [loadProfileInsights]);

  const metrics = [
    {
      id: "total-views",
      label: "Total views",
      value: summary.totalViews,
      icon: FiEye,
      helper: "All-time profile activity"
    },
    {
      id: "unique-viewers",
      label: "Unique viewers",
      value: summary.uniqueViewers,
      icon: FiUsers,
      helper: "Individual patients"
    },
    {
      id: "today-views",
      label: "Views today",
      value: summary.viewsToday,
      icon: FiCalendar,
      helper: "Since midnight"
    },
    {
      id: "weekly-views",
      label: "Views this week",
      value: summary.viewsThisWeek,
      icon: FiTrendingUp,
      helper: `${
        summary.uniqueViewersThisWeek || 0
      } unique this week`
    }
  ];

  const accessStatus =
    getAccessStatusLabel(access);

  const handleRefresh = () => {
    loadProfileInsights({
      refresh: true
    }).catch(() => {});
  };

  const handlePreviousPage = () => {
    setPage((currentPage) =>
      Math.max(0, currentPage - 1)
    );
  };

  const handleNextPage = () => {
    setPage((currentPage) =>
      currentPage + 1
    );
  };

  const handleRequestAccess = () => {
    navigate("/doctor/feedback", {
      state: {
        subject:
          "Profile Insights access request"
      }
    });
  };

  return (
    <main className="pvi-page">
      <div className="pvi-container">
        <header className="pvi-header">
          <div className="pvi-header-copy">
            <span className="pvi-eyebrow">
              Profile performance
            </span>

            <h1>Profile Insights</h1>

            <p>
              Understand how patients are
              discovering and viewing your public
              doctor profile.
            </p>
          </div>

          <button
            type="button"
            className="pvi-refresh-button"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FiRefreshCw
              className={
                refreshing
                  ? "pvi-rotate"
                  : ""
              }
            />

            <span>
              {refreshing
                ? "Refreshing"
                : "Refresh"}
            </span>
          </button>
        </header>

        {pageError && (
          <section
            className="pvi-error"
            role="alert"
          >
            <div className="pvi-error-content">
              <strong>
                Profile insights could not be
                loaded
              </strong>

              <p>{pageError}</p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              Try again
            </button>
          </section>
        )}

        <section
          className="pvi-metrics"
          aria-label="Profile view summary"
        >
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <article
                key={metric.id}
                className="pvi-metric-card"
              >
                <div className="pvi-metric-top">
                  <span className="pvi-metric-icon">
                    <Icon />
                  </span>

                  <span className="pvi-metric-label">
                    {metric.label}
                  </span>
                </div>

                <strong className="pvi-metric-value">
                  {formatNumber(metric.value)}
                </strong>

                <p>{metric.helper}</p>
              </article>
            );
          })}
        </section>

        <section
          className={`pvi-access-card ${
            access.active
              ? "pvi-access-card-active"
              : "pvi-access-card-locked"
          }`}
        >
          <div className="pvi-access-main">
            <span className="pvi-access-icon">
              {access.active ? (
                <FiShield />
              ) : (
                <FiLock />
              )}
            </span>

            <div className="pvi-access-content">
              <div className="pvi-access-heading">
                <span
                  className={`pvi-status-badge ${
                    access.active
                      ? "pvi-status-active"
                      : "pvi-status-locked"
                  }`}
                >
                  {access.active ? (
                    <FiCheckCircle />
                  ) : (
                    <FiLock />
                  )}

                  {accessStatus}
                </span>

                <span className="pvi-plan-label">
                  Profile identity access
                </span>
              </div>

              <h2>
                {access.active
                  ? "Patient viewer identity is available"
                  : "Unlock patient viewer identity"}
              </h2>

              <p>
                {access.active
                  ? `Your paid profile insight access is active${
                      access.expiresAt
                        ? ` until ${formatExpiryDate(
                            access.expiresAt
                          )}`
                        : ""
                    }.`
                  : "View counts and timestamps are free. Patient names and profile details remain protected until paid access is active."}
              </p>
            </div>
          </div>

          {!access.active && (
            <button
              type="button"
              className="pvi-access-button"
              onClick={handleRequestAccess}
            >
              Request access
              <FiArrowUpRight />
            </button>
          )}

          {access.active && (
            <div className="pvi-access-expiry">
              <FiClock />

              <span>
                {access.expiresAt
                  ? `Valid until ${formatExpiryDate(
                      access.expiresAt
                    )}`
                  : "No fixed expiry"}
              </span>
            </div>
          )}
        </section>

        <section className="pvi-activity-card">
          <div className="pvi-activity-header">
            <div>
              <span className="pvi-section-label">
                Recent activity
              </span>

              <h2>Profile viewers</h2>

              <p>
                Repeat visits from the same patient
                are counted once per day.
              </p>
            </div>

            <div className="pvi-activity-count">
              <FiEye />

              <span>
                {formatNumber(totalElements)}
              </span>

              <small>
                {totalElements === 1
                  ? "record"
                  : "records"}
              </small>
            </div>
          </div>

          {loading ? (
            <div className="pvi-state">
              <span className="pvi-loader" />

              <h3>
                Loading profile activity
              </h3>

              <p>
                Fetching your latest profile view
                information.
              </p>
            </div>
          ) : views.length === 0 ? (
            <div className="pvi-state">
              <span className="pvi-state-icon">
                <FiEye />
              </span>

              <h3>No profile views yet</h3>

              <p>
                New patient profile activity will
                appear here automatically.
              </p>
            </div>
          ) : (
            <div className="pvi-view-list">
              {views.map((view) => (
                <article
                  key={view.viewId}
                  className="pvi-view-row"
                >
                  <ViewerAvatar view={view} />

                  <div className="pvi-view-content">
                    <div className="pvi-view-name-row">
                      <strong>
                        {view.masked
                          ? "Patient identity protected"
                          : view.viewerName ||
                            "Patient"}
                      </strong>

                      <span
                        className={`pvi-view-access-tag ${
                          view.masked
                            ? "pvi-view-access-tag-locked"
                            : "pvi-view-access-tag-visible"
                        }`}
                      >
                        {view.masked ? (
                          <>
                            <FiLock />
                            Locked
                          </>
                        ) : (
                          <>
                            <FiUser />
                            Visible
                          </>
                        )}
                      </span>
                    </div>

                    <p>
                      {view.masked
                        ? "A patient viewed your public doctor profile."
                        : "Viewed your public doctor profile."}
                    </p>
                  </div>

                  <div className="pvi-view-time">
                    <FiClock />

                    <time>
                      {formatDateTime(
                        view.viewedAt
                      )}
                    </time>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading &&
            views.length > 0 &&
            totalPages > 1 && (
              <footer className="pvi-pagination">
                <button
                  type="button"
                  onClick={handlePreviousPage}
                  disabled={!hasPrevious}
                >
                  <FiChevronLeft />
                  Previous
                </button>

                <span>
                  Page{" "}
                  <strong>{page + 1}</strong>{" "}
                  of{" "}
                  <strong>
                    {Math.max(totalPages, 1)}
                  </strong>
                </span>

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={!hasNext}
                >
                  Next
                  <FiChevronRight />
                </button>
              </footer>
            )}
        </section>
      </div>
    </main>
  );
};

export default ProfileViews;