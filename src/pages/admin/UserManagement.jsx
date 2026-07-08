import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiEye,
  FiHash,
  FiLoader,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiRotateCcw,
  FiSearch,
  FiSettings,
  FiShield,
  FiSlash,
  FiUnlock,
  FiUserCheck,
  FiUserPlus,
  FiUsers,
  FiUserX,
  FiX
} from "react-icons/fi";

import {
  bulkUpdateAdminUserAccountStatus,
  exportAdminUsers,
  getAdminUserById,
  getAdminUsers,
  resetAdminUserLoginSecurity,
  updateAdminUserAccountStatus
} from "../../services/adminService";

import fallbackAvatar from "../../assets/images/avtar.png";
import "./UserManagement.css";

const EMPTY_SUMMARY = {
  totalUsers: 0,
  activeUsers: 0,
  activePatients: 0,
  activeDoctors: 0,
  inactiveAccounts: 0,
  blockedAccounts: 0,
  unverifiedUsers: 0,
  newUsersLast7Days: 0
};

const PAGE_SIZES = [10, 20, 50, 100];

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080/api";

const resolveBackendOrigin = () => {
  try {
    return new URL(
      API_BASE_URL,
      window.location.origin
    ).origin;
  } catch {
    return window.location.origin;
  }
};

const BACKEND_ORIGIN = resolveBackendOrigin();

const normalizeImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== "string") {
    return fallbackAvatar;
  }

  const trimmedUrl = imageUrl.trim();

  if (
    !trimmedUrl ||
    trimmedUrl.startsWith("/src/")
  ) {
    return fallbackAvatar;
  }

  if (trimmedUrl.startsWith("/uploads/")) {
    return `${BACKEND_ORIGIN}${trimmedUrl}`;
  }

  if (/^https?:\/\//i.test(trimmedUrl)) {
    try {
      const parsedUrl = new URL(trimmedUrl);

      if (
        parsedUrl.hostname === "localhost" ||
        parsedUrl.hostname === "127.0.0.1"
      ) {
        return `${BACKEND_ORIGIN}${parsedUrl.pathname}${parsedUrl.search}`;
      }
    } catch {
      return fallbackAvatar;
    }

    return trimmedUrl;
  }

  return fallbackAvatar;
};

const parseApplicationTimestamp = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const rawValue = String(value).trim();

  /*
   * Legacy DB format:
   * yyyyMMddHHmmss
   */
  if (/^\d{14}$/.test(rawValue)) {
    const year = rawValue.slice(0, 4);
    const month = rawValue.slice(4, 6);
    const day = rawValue.slice(6, 8);
    const hour = rawValue.slice(8, 10);
    const minute = rawValue.slice(10, 12);
    const second = rawValue.slice(12, 14);

    const legacyDate = new Date(
      `${year}-${month}-${day}T${hour}:${minute}:${second}+05:30`
    );

    return Number.isNaN(legacyDate.getTime())
      ? null
      : legacyDate;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  const date = new Date(numericValue);

  return Number.isNaN(date.getTime())
    ? null
    : date;
};

const formatDate = (value) => {
  const date = parseApplicationTimestamp(value);

  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
};

const formatDateTime = (value) => {
  const date = parseApplicationTimestamp(value);

  if (!date) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
};

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN");

const getStatusLabel = (status) => {
  switch (status) {
    case "ACTIVE":
      return "Active";

    case "INACTIVE":
      return "Inactive";

    case "BLOCKED":
      return "Blocked";

    default:
      return status || "Unknown";
  }
};

const getVerificationLabel = (user) => {
  if (user.role === "DOCTOR") {
    return (
      user.doctorVerificationStatus ||
      (user.verified
        ? "VERIFIED"
        : "UNVERIFIED")
    );
  }

  return user.verified
    ? "VERIFIED"
    : "UNVERIFIED";
};

const buildPaginationItems = (
  currentPage,
  totalPages
) => {
  if (totalPages <= 7) {
    return Array.from(
      { length: totalPages },
      (_, index) => index
    );
  }

  const items = [0];

  const start = Math.max(
    1,
    currentPage - 1
  );

  const end = Math.min(
    totalPages - 2,
    currentPage + 1
  );

  if (start > 1) {
    items.push("left-ellipsis");
  }

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (end < totalPages - 2) {
    items.push("right-ellipsis");
  }

  items.push(totalPages - 1);

  return items;
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState(
    EMPTY_SUMMARY
  );

  const [searchInput, setSearchInput] =
    useState("");

  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const [role, setRole] = useState("ALL");

  const [accountStatus, setAccountStatus] =
    useState("ALL");

  const [
    verificationStatus,
    setVerificationStatus
  ] = useState("ALL");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [sortBy, setSortBy] =
    useState("createdAt");

  const [sortDirection, setSortDirection] =
    useState("DESC");

  const [page, setPage] = useState(0);

  const [pageSize, setPageSize] =
    useState(10);

  const [pagination, setPagination] =
    useState({
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedUserIds, setSelectedUserIds] =
    useState(new Set());

  const [detailsState, setDetailsState] =
    useState({
      open: false,
      loading: false,
      data: null,
      error: ""
    });

  const [manageUser, setManageUser] =
    useState(null);

  const [actionDialog, setActionDialog] =
    useState(null);

  const [actionReason, setActionReason] =
    useState("");

  const [actionSubmitting, setActionSubmitting] =
    useState(false);

  const [exporting, setExporting] =
    useState(false);

  const [notification, setNotification] =
    useState({
      show: false,
      message: "",
      type: "success"
    });

  const requestSequenceRef = useRef(0);
  const notificationTimerRef = useRef(null);
  const selectAllRef = useRef(null);

  const dateRangeInvalid =
    Boolean(fromDate) &&
    Boolean(toDate) &&
    toDate < fromDate;

  const queryParameters = useMemo(
    () => ({
      search: debouncedSearch,
      role,
      accountStatus,
      verificationStatus,
      fromDate,
      toDate,
      page,
      size: pageSize,
      sortBy,
      sortDirection
    }),
    [
      debouncedSearch,
      role,
      accountStatus,
      verificationStatus,
      fromDate,
      toDate,
      page,
      pageSize,
      sortBy,
      sortDirection
    ]
  );

  const notify = useCallback(
    (message, type = "success") => {
      if (notificationTimerRef.current) {
        clearTimeout(
          notificationTimerRef.current
        );
      }

      setNotification({
        show: true,
        message,
        type
      });

      notificationTimerRef.current =
        setTimeout(() => {
          setNotification({
            show: false,
            message: "",
            type: "success"
          });
        }, 3500);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(
          notificationTimerRef.current
        );
      }
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(
        searchInput.trim()
      );
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadUsers = useCallback(
    async (silent = false) => {
      if (dateRangeInvalid) {
        setLoading(false);
        setError(
          "To date cannot be before from date."
        );
        return;
      }

      const requestId =
        ++requestSequenceRef.current;

      if (!silent) {
        setLoading(true);
      }

      setError("");

      try {
        const response =
          await getAdminUsers(
            queryParameters
          );

        if (
          requestId !==
          requestSequenceRef.current
        ) {
          return;
        }

        const responseUsers =
          Array.isArray(response?.content)
            ? response.content
            : [];

        if (
          responseUsers.length === 0 &&
          page > 0 &&
          Number(response?.totalElements) > 0
        ) {
          setPage((currentPage) =>
            Math.max(0, currentPage - 1)
          );
          return;
        }

        setUsers(responseUsers);

        setSummary({
          ...EMPTY_SUMMARY,
          ...(response?.summary || {})
        });

        setPagination({
          totalElements:
            Number(
              response?.totalElements
            ) || 0,

          totalPages:
            Number(
              response?.totalPages
            ) || 0,

          first:
            Boolean(response?.first),

          last:
            Boolean(response?.last)
        });

        setSelectedUserIds(new Set());
      } catch (requestError) {
        if (
          requestId !==
          requestSequenceRef.current
        ) {
          return;
        }

        setUsers([]);

        setError(
          requestError?.message ||
          "Unable to load users."
        );
      } finally {
        if (
          requestId ===
          requestSequenceRef.current
        ) {
          setLoading(false);
        }
      }
    },
    [
      dateRangeInvalid,
      page,
      queryParameters
    ]
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const manageableUsers = useMemo(
    () =>
      users.filter(
        (user) => user.role !== "ADMIN"
      ),
    [users]
  );

  const selectedCount =
    selectedUserIds.size;

  const allManageableSelected =
    manageableUsers.length > 0 &&
    manageableUsers.every((user) =>
      selectedUserIds.has(user.userId)
    );

  const partiallySelected =
    selectedCount > 0 &&
    !allManageableSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        partiallySelected;
    }
  }, [partiallySelected]);

  const paginationItems = useMemo(
    () =>
      buildPaginationItems(
        page,
        pagination.totalPages
      ),
    [page, pagination.totalPages]
  );

  const firstResult =
    pagination.totalElements === 0
      ? 0
      : page * pageSize + 1;

  const lastResult = Math.min(
    (page + 1) * pageSize,
    pagination.totalElements
  );

  const resetFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setRole("ALL");
    setAccountStatus("ALL");
    setVerificationStatus("ALL");
    setFromDate("");
    setToDate("");
    setSortBy("createdAt");
    setSortDirection("DESC");
    setPage(0);
  };

  const updateSearch = (event) => {
    setSearchInput(event.target.value);
    setPage(0);
  };

  const toggleUserSelection = (user) => {
    if (user.role === "ADMIN") {
      return;
    }

    setSelectedUserIds(
      (previousSelection) => {
        const updatedSelection =
          new Set(previousSelection);

        if (
          updatedSelection.has(
            user.userId
          )
        ) {
          updatedSelection.delete(
            user.userId
          );
        } else {
          updatedSelection.add(
            user.userId
          );
        }

        return updatedSelection;
      }
    );
  };

  const toggleSelectAll = () => {
    if (allManageableSelected) {
      setSelectedUserIds(new Set());
      return;
    }

    setSelectedUserIds(
      new Set(
        manageableUsers.map(
          (user) => user.userId
        )
      )
    );
  };

  const openUserDetails = async (userId) => {
    setManageUser(null);

    setDetailsState({
      open: true,
      loading: true,
      data: null,
      error: ""
    });

    try {
      const details =
        await getAdminUserById(userId);

      setDetailsState({
        open: true,
        loading: false,
        data: details,
        error: ""
      });
    } catch (requestError) {
      setDetailsState({
        open: true,
        loading: false,
        data: null,
        error:
          requestError?.message ||
          "Unable to load user details."
      });
    }
  };

  const closeDetails = useCallback(() => {
    setDetailsState({
      open: false,
      loading: false,
      data: null,
      error: ""
    });
  }, []);

  const startSingleStatusAction = (
    user,
    requestedStatus
  ) => {
    setManageUser(null);

    setActionReason("");

    setActionDialog({
      type: "STATUS",
      mode: "SINGLE",
      user,
      requestedStatus
    });
  };

  const startBulkStatusAction = (requestedStatus) => {
    const selectedIds = Array.from(selectedUserIds);

    if (selectedIds.length === 0) {
      notify(
        "Select at least one user first.",
        "error"
      );
      return;
    }

    setActionReason("");


    setActionDialog({
      type: "STATUS",
      mode: "BULK",
      requestedStatus,
      userIds: selectedIds,
      selectedCount: selectedIds.length
    });
  };

  const startSecurityReset = (user) => {
    setManageUser(null);

    setActionReason("");

    setActionDialog({
      type: "RESET_SECURITY",
      mode: "SINGLE",
      user
    });
  };

  const closeActionDialog = useCallback(() => {
    if (actionSubmitting) {
      return;
    }

    setActionDialog(null);
    setActionReason("");
  }, [actionSubmitting]);

  const submitAdministrativeAction =
    async () => {
      const normalizedReason =
        actionReason.trim();

      if (normalizedReason.length < 5) {
        notify(
          "Reason must contain at least 5 characters.",
          "error"
        );
        return;
      }

      setActionSubmitting(true);

      try {
        if (
          actionDialog?.type ===
          "RESET_SECURITY"
        ) {
          await resetAdminUserLoginSecurity(
            actionDialog.user.userId,
            {
              reason: normalizedReason
            }
          );

          notify(
            `Login security reset for ${actionDialog.user.fullName}.`
          );
        } else if (
          actionDialog?.mode === "BULK"
        ) {
          const response =
            await bulkUpdateAdminUserAccountStatus(
              {
                userIds: actionDialog.userIds,

                status:
                  actionDialog.requestedStatus,

                reason: normalizedReason
              }
            );

          if (response.updatedCount === 0) {
            notify(
              `Selected account(s) are already ${getStatusLabel(
                actionDialog.requestedStatus
              ).toLowerCase()}.`,
              "info"
            );
          } else {
            notify(
              `${response.updatedCount} user account(s) updated successfully.`,
              "success"
            );
          }

          setSelectedUserIds(new Set());
        } else {
          const response =
            await updateAdminUserAccountStatus(
              actionDialog.user.userId,
              {
                status:
                  actionDialog.requestedStatus,

                reason: normalizedReason
              }
            );

          const actionMessage =
            response.changed
              ? `${response.fullName} is now ${getStatusLabel(
                response.currentStatus
              ).toLowerCase()}.`
              : `${response.fullName} already has this status.`;

          notify(actionMessage);
        }

        setActionDialog(null);
        setActionReason("");

        await loadUsers(true);
      } catch (requestError) {
        notify(
          requestError?.message ||
          "Administrative action failed.",
          "error"
        );
      } finally {
        setActionSubmitting(false);
      }
    };

  const handleExport = async () => {
    if (dateRangeInvalid) {
      notify(
        "To date cannot be before from date.",
        "error"
      );
      return;
    }

    setExporting(true);

    try {
      const result =
        await exportAdminUsers({
          search: debouncedSearch,
          role,
          accountStatus,
          verificationStatus,
          fromDate,
          toDate,
          sortBy,
          sortDirection
        });

      const downloadUrl =
        URL.createObjectURL(result.blob);

      const downloadLink =
        document.createElement("a");

      downloadLink.href = downloadUrl;
      downloadLink.download =
        result.fileName ||
        "doctor-hub-users.csv";

      document.body.appendChild(
        downloadLink
      );

      downloadLink.click();
      downloadLink.remove();

      URL.revokeObjectURL(
        downloadUrl
      );

      notify(
        "Filtered user report exported successfully."
      );
    } catch (requestError) {
      notify(
        requestError?.message ||
        "Unable to export users.",
        "error"
      );
    } finally {
      setExporting(false);
    }
  };

  const anyModalOpen =
    detailsState.open ||
    Boolean(manageUser) ||
    Boolean(actionDialog);

  useEffect(() => {
    if (!anyModalOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleEscape = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      if (actionDialog) {
        closeActionDialog();
      } else if (manageUser) {
        setManageUser(null);
      } else if (detailsState.open) {
        closeDetails();
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [
    actionDialog,
    anyModalOpen,
    closeActionDialog,
    closeDetails,
    detailsState.open,
    manageUser
  ]);

  const renderUserAvatar = (
    user,
    className
  ) => (
    <img
      src={normalizeImageUrl(
        user.profileImageUrl
      )}
      alt={`${user.fullName || "User"} profile`}
      className={className}
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src =
          fallbackAvatar;
      }}
    />
  );

  const renderStatusBadge = (status) => (
    <span
      className={`aum-status-badge aum-status-${String(
        status || "UNKNOWN"
      ).toLowerCase()}`}
    >
      <span className="aum-status-dot" />
      {getStatusLabel(status)}
    </span>
  );

  const renderVerificationBadge = (user) => {
    const verification =
      getVerificationLabel(user);

    return (
      <span
        className={`aum-verification-badge aum-verification-${String(
          verification
        ).toLowerCase()}`}
      >
        {verification.replaceAll("_", " ")}
      </span>
    );
  };

  return (
    <section className="aum-page">
      {notification.show && (
        <div
          className={`aum-toast aum-toast-${notification.type}`}
          role={
            notification.type === "error"
              ? "alert"
              : "status"
          }
          aria-live={
            notification.type === "error"
              ? "assertive"
              : "polite"
          }
        >
          <span className="aum-toast-icon">
            {notification.type === "success" ? (
              <FiCheckCircle />
            ) : notification.type === "info" ? (
              <FiAlertCircle />
            ) : (
              <FiAlertCircle />
            )}
          </span>

          <span>{notification.message}</span>
        </div>
      )}

      <header className="aum-page-header">
        <div>
          <p className="aum-eyebrow">
            Administration
          </p>

          <h1>User Management</h1>

          <p className="aum-page-description">
            Review user accounts, control access
            and inspect account security activity.
          </p>
        </div>

        <button
          type="button"
          className="aum-primary-button"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <FiLoader className="aum-spin" />
          ) : (
            <FiDownload />
          )}

          {exporting
            ? "Exporting..."
            : "Export users"}
        </button>
      </header>

      <div className="aum-stats-grid">
        <article className="aum-stat-card">
          <div className="aum-stat-icon">
            <FiUsers />
          </div>

          <div>
            <span>Total users</span>
            <strong>
              {formatNumber(
                summary.totalUsers
              )}
            </strong>
          </div>
        </article>

        <article className="aum-stat-card">
          <div className="aum-stat-icon aum-stat-icon-success">
            <FiUserCheck />
          </div>

          <div>
            <span>Active accounts</span>
            <strong>
              {formatNumber(
                summary.activeUsers
              )}
            </strong>
          </div>
        </article>

        <article className="aum-stat-card">
          <div className="aum-stat-icon aum-stat-icon-patient">
            <FiUserPlus />
          </div>

          <div>
            <span>Active patients</span>
            <strong>
              {formatNumber(
                summary.activePatients
              )}
            </strong>
          </div>
        </article>

        <article className="aum-stat-card">
          <div className="aum-stat-icon aum-stat-icon-doctor">
            <FiShield />
          </div>

          <div>
            <span>Active doctors</span>
            <strong>
              {formatNumber(
                summary.activeDoctors
              )}
            </strong>
          </div>
        </article>

        <article className="aum-stat-card">
          <div className="aum-stat-icon aum-stat-icon-muted">
            <FiSlash />
          </div>

          <div>
            <span>Inactive accounts</span>
            <strong>
              {formatNumber(
                summary.inactiveAccounts
              )}
            </strong>
          </div>
        </article>

        <article className="aum-stat-card">
          <div className="aum-stat-icon aum-stat-icon-danger">
            <FiLock />
          </div>

          <div>
            <span>Blocked accounts</span>
            <strong>
              {formatNumber(
                summary.blockedAccounts
              )}
            </strong>
          </div>
        </article>

        <article className="aum-stat-card">
          <div className="aum-stat-icon aum-stat-icon-warning">
            <FiUserX />
          </div>

          <div>
            <span>Unverified users</span>
            <strong>
              {formatNumber(
                summary.unverifiedUsers
              )}
            </strong>
          </div>
        </article>

        <article className="aum-stat-card">
          <div className="aum-stat-icon aum-stat-icon-new">
            <FiClock />
          </div>

          <div>
            <span>New in 7 days</span>
            <strong>
              {formatNumber(
                summary.newUsersLast7Days
              )}
            </strong>
          </div>
        </article>
      </div>

      <section className="aum-filter-card">
        <div className="aum-search-field">
          <FiSearch />

          <input
            type="search"
            value={searchInput}
            onChange={updateSearch}
            placeholder="Search name, email, mobile, username or user ID"
            maxLength={120}
            aria-label="Search users"
          />
        </div>

        <div className="aum-filter-grid">
          <label className="aum-field">
            <span>Role</span>

            <select
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                setPage(0);
              }}
            >
              <option value="ALL">
                All roles
              </option>

              <option value="PATIENT">
                Patients
              </option>

              <option value="DOCTOR">
                Doctors
              </option>

              <option value="ADMIN">
                Administrators
              </option>
            </select>
          </label>

          <label className="aum-field">
            <span>Account status</span>

            <select
              value={accountStatus}
              onChange={(event) => {
                setAccountStatus(
                  event.target.value
                );
                setPage(0);
              }}
            >
              <option value="ALL">
                All statuses
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>

              <option value="BLOCKED">
                Blocked
              </option>
            </select>
          </label>

          <label className="aum-field">
            <span>Verification</span>

            <select
              value={verificationStatus}
              onChange={(event) => {
                setVerificationStatus(
                  event.target.value
                );
                setPage(0);
              }}
            >
              <option value="ALL">
                All verification
              </option>

              <option value="VERIFIED">
                Verified
              </option>

              <option value="UNVERIFIED">
                Unverified
              </option>
            </select>
          </label>

          <label className="aum-field">
            <span>Joined from</span>

            <div className="aum-date-input">
              <FiCalendar />

              <input
                type="date"
                value={fromDate}
                onChange={(event) => {
                  setFromDate(
                    event.target.value
                  );
                  setPage(0);
                }}
              />
            </div>
          </label>

          <label className="aum-field">
            <span>Joined to</span>

            <div className="aum-date-input">
              <FiCalendar />

              <input
                type="date"
                value={toDate}
                onChange={(event) => {
                  setToDate(
                    event.target.value
                  );
                  setPage(0);
                }}
              />
            </div>
          </label>

          <div className="aum-filter-actions">
            <button
              type="button"
              className="aum-secondary-button"
              onClick={resetFilters}
            >
              <FiRotateCcw />
              Reset
            </button>
          </div>
        </div>

        {dateRangeInvalid && (
          <p className="aum-inline-error">
            <FiAlertCircle />
            To date cannot be before from date.
          </p>
        )}
      </section>

      <section className="aum-table-card">
        <div className="aum-table-toolbar">
          <div>
            <h2>User directory</h2>

            <p>
              {formatNumber(
                pagination.totalElements
              )}{" "}
              matching account(s)
            </p>
          </div>

          <div className="aum-table-controls">
            <label>
              <span>Sort</span>

              <select
                value={`${sortBy}:${sortDirection}`}
                onChange={(event) => {
                  const [
                    nextSortBy,
                    nextSortDirection
                  ] =
                    event.target.value.split(
                      ":"
                    );

                  setSortBy(nextSortBy);
                  setSortDirection(
                    nextSortDirection
                  );
                  setPage(0);
                }}
              >
                <option value="createdAt:DESC">
                  Newest joined
                </option>

                <option value="createdAt:ASC">
                  Oldest joined
                </option>

                <option value="fullName:ASC">
                  Name A–Z
                </option>

                <option value="fullName:DESC">
                  Name Z–A
                </option>

                <option value="email:ASC">
                  Email A–Z
                </option>
              </select>
            </label>

            <label>
              <span>Rows</span>

              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(
                    Number(
                      event.target.value
                    )
                  );
                  setPage(0);
                }}
              >
                {PAGE_SIZES.map(
                  (sizeOption) => (
                    <option
                      key={sizeOption}
                      value={sizeOption}
                    >
                      {sizeOption}
                    </option>
                  )
                )}
              </select>
            </label>

            <button
              type="button"
              className="aum-icon-button"
              onClick={() =>
                loadUsers(false)
              }
              disabled={loading}
              title="Refresh users"
            >
              <FiRefreshCw
                className={
                  loading
                    ? "aum-spin"
                    : ""
                }
              />
            </button>
          </div>
        </div>

        {selectedCount > 0 && (
          <div className="aum-bulk-toolbar">
            <div>
              <strong>
                {selectedCount}
              </strong>{" "}
              user(s) selected
            </div>

            <div className="aum-bulk-actions">
              <button
                type="button"
                onClick={() =>
                  startBulkStatusAction(
                    "ACTIVE"
                  )
                }
              >
                <FiUnlock />
                Activate
              </button>

              <button
                type="button"
                onClick={() =>
                  startBulkStatusAction(
                    "INACTIVE"
                  )
                }
              >
                <FiSlash />
                Set inactive
              </button>

              <button
                type="button"
                className="aum-danger-action"
                onClick={() =>
                  startBulkStatusAction(
                    "BLOCKED"
                  )
                }
              >
                <FiLock />
                Block
              </button>

              <button
                type="button"
                className="aum-bulk-clear"
                onClick={() =>
                  setSelectedUserIds(
                    new Set()
                  )
                }
              >
                Clear selection
              </button>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="aum-error-state">
            <FiAlertCircle />

            <h3>Unable to load users</h3>

            <p>{error}</p>

            <button
              type="button"
              onClick={() =>
                loadUsers(false)
              }
            >
              <FiRefreshCw />
              Try again
            </button>
          </div>
        )}

        {!error && (
          <>
            <div className="aum-desktop-table-wrapper">
              <table className="aum-user-table">
                <thead>
                  <tr>
                    <th className="aum-checkbox-column">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={
                          allManageableSelected
                        }
                        onChange={
                          toggleSelectAll
                        }
                        disabled={
                          manageableUsers.length ===
                          0
                        }
                        aria-label="Select all manageable users"
                      />
                    </th>

                    <th>User</th>
                    <th>Contact</th>
                    <th>Role</th>
                    <th>Verification</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Last login</th>

                    <th className="aum-actions-column">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="aum-loading-cell"
                      >
                        <FiLoader className="aum-spin" />
                        Loading user accounts...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="aum-empty-cell"
                      >
                        <FiUsers />

                        <strong>
                          No users found
                        </strong>

                        <span>
                          Adjust the filters or
                          search text and try
                          again.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const isAdmin =
                        user.role ===
                        "ADMIN";

                      return (
                        <tr
                          key={user.userId}
                          className={
                            selectedUserIds.has(
                              user.userId
                            )
                              ? "aum-selected-row"
                              : ""
                          }
                        >
                          <td className="aum-checkbox-column">
                            <input
                              type="checkbox"
                              checked={selectedUserIds.has(
                                user.userId
                              )}
                              disabled={isAdmin}
                              onChange={() =>
                                toggleUserSelection(
                                  user
                                )
                              }
                              aria-label={`Select ${user.fullName}`}
                            />
                          </td>

                          <td>
                            <div className="aum-user-identity">
                              {renderUserAvatar(
                                user,
                                "aum-user-avatar"
                              )}

                              <div>
                                <strong>
                                  {user.fullName ||
                                    "Unnamed user"}
                                </strong>

                                <span>
                                  ID #
                                  {user.userId}
                                  {user.username
                                    ? ` · @${user.username}`
                                    : ""}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div className="aum-contact-cell">
                              <span>
                                {user.email ||
                                  "No email"}
                              </span>

                              <small>
                                {user.mobile ||
                                  "No mobile"}
                              </small>
                            </div>
                          </td>

                          <td>
                            <span
                              className={`aum-role-badge aum-role-${String(
                                user.role
                              ).toLowerCase()}`}
                            >
                              {user.role}
                            </span>
                          </td>

                          <td>
                            {renderVerificationBadge(
                              user
                            )}
                          </td>

                          <td>
                            {renderStatusBadge(
                              user.accountStatus
                            )}
                          </td>

                          <td>
                            <span className="aum-date-value">
                              {formatDate(
                                user.joinedAt
                              )}
                            </span>
                          </td>

                          <td>
                            <span className="aum-date-value">
                              {formatDateTime(
                                user.lastSuccessfulLoginAt
                              )}
                            </span>
                          </td>

                          <td className="aum-actions-column">
                            <div className="aum-row-actions">
                              <button
                                type="button"
                                onClick={() =>
                                  openUserDetails(
                                    user.userId
                                  )
                                }
                                title="View account details"
                              >
                                <FiEye />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setManageUser(
                                    user
                                  )
                                }
                                title="Manage account"
                              >
                                <FiSettings />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="aum-mobile-list">
              {loading ? (
                <div className="aum-mobile-loading">
                  <FiLoader className="aum-spin" />
                  Loading users...
                </div>
              ) : users.length === 0 ? (
                <div className="aum-mobile-empty">
                  <FiUsers />
                  No users found
                </div>
              ) : (
                users.map((user) => {
                  const isAdmin =
                    user.role ===
                    "ADMIN";

                  return (
                    <article
                      key={user.userId}
                      className={`aum-mobile-user-card ${selectedUserIds.has(
                        user.userId
                      )
                        ? "aum-mobile-user-selected"
                        : ""
                        }`}
                    >
                      <div className="aum-mobile-user-header">
                        <div className="aum-user-identity">
                          {renderUserAvatar(
                            user,
                            "aum-user-avatar"
                          )}

                          <div>
                            <strong>
                              {user.fullName ||
                                "Unnamed user"}
                            </strong>

                            <span>
                              ID #{user.userId}
                            </span>
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={selectedUserIds.has(
                            user.userId
                          )}
                          disabled={isAdmin}
                          onChange={() =>
                            toggleUserSelection(
                              user
                            )
                          }
                          aria-label={`Select ${user.fullName}`}
                        />
                      </div>

                      <div className="aum-mobile-badges">
                        <span
                          className={`aum-role-badge aum-role-${String(
                            user.role
                          ).toLowerCase()}`}
                        >
                          {user.role}
                        </span>

                        {renderStatusBadge(
                          user.accountStatus
                        )}
                      </div>

                      <div className="aum-mobile-user-details">
                        <span>
                          <FiMail />
                          {user.email ||
                            "No email"}
                        </span>

                        <span>
                          <FiPhone />
                          {user.mobile ||
                            "No mobile"}
                        </span>

                        <span>
                          <FiCalendar />
                          Joined{" "}
                          {formatDate(
                            user.joinedAt
                          )}
                        </span>

                        <span>
                          <FiClock />
                          Last login{" "}
                          {formatDateTime(
                            user.lastSuccessfulLoginAt
                          )}
                        </span>
                      </div>

                      <div className="aum-mobile-actions">
                        <button
                          type="button"
                          onClick={() =>
                            openUserDetails(
                              user.userId
                            )
                          }
                        >
                          <FiEye />
                          View details
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setManageUser(
                              user
                            )
                          }
                        >
                          <FiSettings />
                          Manage
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            <footer className="aum-table-footer">
              <p>
                Showing {firstResult}–
                {lastResult} of{" "}
                {formatNumber(
                  pagination.totalElements
                )}
              </p>

              <nav
                className="aum-pagination"
                aria-label="User pagination"
              >
                <button
                  type="button"
                  disabled={
                    page === 0 ||
                    loading
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.max(
                        0,
                        current - 1
                      )
                    )
                  }
                  aria-label="Previous page"
                >
                  <FiChevronLeft />
                </button>

                {paginationItems.map(
                  (item) =>
                    typeof item ===
                      "string" ? (
                      <span
                        key={item}
                        className="aum-pagination-ellipsis"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        type="button"
                        key={item}
                        className={
                          item === page
                            ? "aum-page-active"
                            : ""
                        }
                        onClick={() =>
                          setPage(item)
                        }
                        disabled={loading}
                      >
                        {item + 1}
                      </button>
                    )
                )}

                <button
                  type="button"
                  disabled={
                    pagination.last ||
                    pagination.totalPages ===
                    0 ||
                    loading
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.min(
                        pagination.totalPages -
                        1,
                        current + 1
                      )
                    )
                  }
                  aria-label="Next page"
                >
                  <FiChevronRight />
                </button>
              </nav>
            </footer>
          </>
        )}
      </section>

      {manageUser && (
        <div
          className="aum-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setManageUser(null);
            }
          }}
        >
          <div
            className="aum-modal aum-manage-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-user-title"
          >
            <div className="aum-modal-header">
              <div>
                <p>Account controls</p>

                <h2 id="manage-user-title">
                  Manage user
                </h2>
              </div>

              <button
                type="button"
                className="aum-modal-close"
                onClick={() =>
                  setManageUser(null)
                }
                aria-label="Close manage user modal"
              >
                <FiX />
              </button>
            </div>

            <div className="aum-modal-body">
              <div className="aum-manage-user-summary">
                {renderUserAvatar(
                  manageUser,
                  "aum-manage-avatar"
                )}

                <div>
                  <h3>
                    {manageUser.fullName}
                  </h3>

                  <p>
                    {manageUser.email}
                  </p>

                  <div className="aum-manage-badges">
                    <span
                      className={`aum-role-badge aum-role-${String(
                        manageUser.role
                      ).toLowerCase()}`}
                    >
                      {manageUser.role}
                    </span>

                    {renderStatusBadge(
                      manageUser.accountStatus
                    )}
                  </div>
                </div>
              </div>

              {manageUser.role ===
                "ADMIN" ? (
                <div className="aum-protected-account-notice">
                  <FiShield />

                  <div>
                    <strong>
                      Protected administrator
                      account
                    </strong>

                    <p>
                      Administrator accounts
                      cannot be modified from
                      User Management.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="aum-account-action-list">
                  {manageUser.accountStatus !==
                    "ACTIVE" && (
                      <button
                        type="button"
                        className="aum-account-action"
                        onClick={() =>
                          startSingleStatusAction(
                            manageUser,
                            "ACTIVE"
                          )
                        }
                      >
                        <span className="aum-action-icon aum-action-icon-success">
                          <FiUnlock />
                        </span>

                        <span>
                          <strong>
                            {manageUser.accountStatus ===
                              "BLOCKED"
                              ? "Unblock and activate"
                              : "Activate account"}
                          </strong>

                          <small>
                            Restore login and
                            account access.
                          </small>
                        </span>
                      </button>
                    )}

                  {manageUser.accountStatus !==
                    "INACTIVE" && (
                      <button
                        type="button"
                        className="aum-account-action"
                        onClick={() =>
                          startSingleStatusAction(
                            manageUser,
                            "INACTIVE"
                          )
                        }
                      >
                        <span className="aum-action-icon aum-action-icon-muted">
                          <FiSlash />
                        </span>

                        <span>
                          <strong>
                            Set account inactive
                          </strong>

                          <small>
                            Temporarily disable
                            login access.
                          </small>
                        </span>
                      </button>
                    )}

                  {manageUser.accountStatus !==
                    "BLOCKED" && (
                      <button
                        type="button"
                        className="aum-account-action"
                        onClick={() =>
                          startSingleStatusAction(
                            manageUser,
                            "BLOCKED"
                          )
                        }
                      >
                        <span className="aum-action-icon aum-action-icon-danger">
                          <FiLock />
                        </span>

                        <span>
                          <strong>
                            Block account
                          </strong>

                          <small>
                            Block account access
                            and revoke the active
                            session.
                          </small>
                        </span>
                      </button>
                    )}

                  <button
                    type="button"
                    className="aum-account-action"
                    onClick={() =>
                      startSecurityReset(
                        manageUser
                      )
                    }
                  >
                    <span className="aum-action-icon">
                      <FiRefreshCw />
                    </span>

                    <span>
                      <strong>
                        Reset login security
                      </strong>

                      <small>
                        Clear failed login
                        counters without changing
                        account status.
                      </small>
                    </span>
                  </button>
                </div>
              )}

              <button
                type="button"
                className="aum-modal-secondary-action"
                onClick={() =>
                  openUserDetails(
                    manageUser.userId
                  )
                }
              >
                <FiEye />
                Open complete account details
              </button>
            </div>
          </div>
        </div>
      )}

      {detailsState.open && (
        <div
          className="aum-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDetails();
            }
          }}
        >
          <div
            className="aum-modal aum-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-details-title"
          >
            <div className="aum-modal-header">
              <div>
                <p>Account review</p>

                <h2 id="user-details-title">
                  User details
                </h2>
              </div>

              <button
                type="button"
                className="aum-modal-close"
                onClick={closeDetails}
                aria-label="Close user details"
              >
                <FiX />
              </button>
            </div>

            <div className="aum-modal-body">
              {detailsState.loading ? (
                <div className="aum-modal-loading">
                  <FiLoader className="aum-spin" />
                  Loading account details...
                </div>
              ) : detailsState.error ? (
                <div className="aum-modal-error">
                  <FiAlertCircle />

                  <h3>
                    Unable to load details
                  </h3>

                  <p>
                    {detailsState.error}
                  </p>
                </div>
              ) : detailsState.data ? (
                <>
                  <div className="aum-details-profile">
                    {renderUserAvatar(
                      detailsState.data,
                      "aum-details-avatar"
                    )}

                    <div>
                      <h3>
                        {
                          detailsState.data
                            .fullName
                        }
                      </h3>

                      <p>
                        {
                          detailsState.data
                            .email
                        }
                      </p>

                      <div className="aum-details-badges">
                        <span
                          className={`aum-role-badge aum-role-${String(
                            detailsState.data
                              .role
                          ).toLowerCase()}`}
                        >
                          {
                            detailsState.data
                              .role
                          }
                        </span>

                        {renderStatusBadge(
                          detailsState.data
                            .accountStatus
                        )}

                        {renderVerificationBadge(
                          detailsState.data
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="aum-detail-grid">
                    <div className="aum-detail-item">
                      <span>
                        <FiHash />
                        User ID
                      </span>

                      <strong>
                        {
                          detailsState.data
                            .userId
                        }
                      </strong>
                    </div>

                    <div className="aum-detail-item">
                      <span>
                        <FiShield />
                        Profile type
                      </span>

                      <strong>
                        {
                          detailsState.data
                            .profileType
                        }
                      </strong>
                    </div>

                    <div className="aum-detail-item">
                      <span>
                        <FiMail />
                        Email
                      </span>

                      <strong>
                        {
                          detailsState.data
                            .email
                        }
                      </strong>
                    </div>

                    <div className="aum-detail-item">
                      <span>
                        <FiPhone />
                        Mobile
                      </span>

                      <strong>
                        {detailsState.data
                          .mobile || "—"}
                      </strong>
                    </div>

                    <div className="aum-detail-item">
                      <span>
                        <FiUserCheck />
                        Username
                      </span>

                      <strong>
                        {detailsState.data
                          .username || "—"}
                      </strong>
                    </div>

                    <div className="aum-detail-item">
                      <span>
                        <FiMapPin />
                        City
                      </span>

                      <strong>
                        {detailsState.data
                          .city || "—"}
                      </strong>
                    </div>

                    <div className="aum-detail-item">
                      <span>
                        <FiCalendar />
                        Joined
                      </span>

                      <strong>
                        {formatDateTime(
                          detailsState.data
                            .joinedAt
                        )}
                      </strong>
                    </div>

                    <div className="aum-detail-item">
                      <span>
                        <FiClock />
                        Last login
                      </span>

                      <strong>
                        {formatDateTime(
                          detailsState.data
                            .lastSuccessfulLoginAt
                        )}
                      </strong>
                    </div>

                    <div className="aum-detail-item">
                      <span>
                        <FiAlertCircle />
                        Failed attempts
                      </span>

                      <strong>
                        {
                          detailsState.data
                            .failedLoginAttempts
                        }
                      </strong>
                    </div>

                    <div className="aum-detail-item">
                      <span>
                        <FiClock />
                        Last failed login
                      </span>

                      <strong>
                        {formatDateTime(
                          detailsState.data
                            .lastFailedLoginAt
                        )}
                      </strong>
                    </div>

                    <div className="aum-detail-item">
                      <span>
                        <FiCheckCircle />
                        Successful logins
                      </span>

                      <strong>
                        {formatNumber(
                          detailsState.data
                            .successfulLoginCount
                        )}
                      </strong>
                    </div>

                    <div className="aum-detail-item">
                      <span>
                        <FiUserX />
                        Failed logins
                      </span>

                      <strong>
                        {formatNumber(
                          detailsState.data
                            .failedLoginCount
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="aum-login-section">
                    <div className="aum-section-heading">
                      <div>
                        <h3>
                          Recent login activity
                        </h3>

                        <p>
                          Latest successful and
                          failed authentication
                          attempts.
                        </p>
                      </div>
                    </div>

                    {Array.isArray(
                      detailsState.data
                        .recentLogins
                    ) &&
                      detailsState.data
                        .recentLogins.length >
                      0 ? (
                      <div className="aum-login-list">
                        {detailsState.data.recentLogins.map(
                          (login) => (
                            <article
                              key={login.id}
                              className="aum-login-item"
                            >
                              <span
                                className={`aum-login-result ${login.successful
                                  ? "aum-login-success"
                                  : "aum-login-failed"
                                  }`}
                              >
                                {login.successful
                                  ? "Success"
                                  : "Failed"}
                              </span>

                              <div>
                                <strong>
                                  {login.browserName ||
                                    "Unknown browser"}
                                </strong>

                                <small>
                                  {login.deviceType ||
                                    "Unknown device"}{" "}
                                  ·{" "}
                                  {login.ipAddress ||
                                    "Unknown IP"}
                                </small>
                              </div>

                              <time>
                                {formatDateTime(
                                  login.loginAt
                                )}
                              </time>
                            </article>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="aum-no-login-history">
                        No login history
                        available.
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {actionDialog && (
        <div
          className="aum-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget &&
              !actionSubmitting
            ) {
              closeActionDialog();
            }
          }}
        >
          <div
            className="aum-modal aum-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="administrative-action-title"
          >
            <div className="aum-modal-header">
              <div>
                <p>
                  Administrative action
                </p>

                <h2 id="administrative-action-title">
                  {actionDialog.type ===
                    "RESET_SECURITY"
                    ? "Reset login security"
                    : actionDialog.mode ===
                      "BULK"
                      ? `${getStatusLabel(
                        actionDialog.requestedStatus
                      )} selected users`
                      : actionDialog.requestedStatus ===
                        "ACTIVE"
                        ? actionDialog.user
                          .accountStatus ===
                          "BLOCKED"
                          ? "Unblock and activate account"
                          : "Activate account"
                        : actionDialog.requestedStatus ===
                          "INACTIVE"
                          ? "Set account inactive"
                          : "Block account"}
                </h2>
              </div>

              <button
                type="button"
                className="aum-modal-close"
                onClick={closeActionDialog}
                disabled={actionSubmitting}
                aria-label="Close confirmation"
              >
                <FiX />
              </button>
            </div>

            <div className="aum-modal-body">
              <div className="aum-confirm-notice">
                <FiAlertCircle />

                <p>
                  {actionDialog.type ===
                    "RESET_SECURITY"
                    ? `Failed login counters for ${actionDialog.user.fullName} will be reset. The account status will not change.`
                    : actionDialog.mode ===
                      "BULK"
                      ? `${actionDialog.selectedCount} selected account(s) will be changed to ${getStatusLabel(
                        actionDialog.requestedStatus
                      ).toLowerCase()}.`
                      : `${actionDialog.user.fullName}'s account will be changed from ${getStatusLabel(
                        actionDialog.user
                          .accountStatus
                      ).toLowerCase()} to ${getStatusLabel(
                        actionDialog.requestedStatus
                      ).toLowerCase()}.`}
                </p>
              </div>

              <label className="aum-reason-field">
                <span>
                  Administrative reason
                </span>

                <textarea
                  value={actionReason}
                  onChange={(event) =>
                    setActionReason(
                      event.target.value
                    )
                  }
                  maxLength={500}
                  rows={4}
                  placeholder="Enter a clear reason for this account action..."
                  autoFocus
                />

                <small>
                  {actionReason.trim().length}
                  /500 characters · minimum
                  5 characters
                </small>
              </label>

              <div className="aum-confirm-actions">
                <button
                  type="button"
                  className="aum-secondary-button"
                  onClick={closeActionDialog}
                  disabled={actionSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className={`aum-primary-button ${actionDialog.requestedStatus === "BLOCKED"
                    ? "aum-destructive-button"
                    : ""
                    }`}
                  onClick={submitAdministrativeAction}
                  disabled={
                    actionSubmitting ||
                    actionReason.trim().length < 5 ||
                    (
                      actionDialog.mode === "BULK" &&
                      (!actionDialog.userIds ||
                        actionDialog.userIds.length === 0)
                    )
                  }
                >
                  {actionSubmitting ? (
                    <FiLoader className="aum-spin" />
                  ) : actionDialog.type ===
                    "RESET_SECURITY" ? (
                    <FiRefreshCw />
                  ) : actionDialog.requestedStatus ===
                    "ACTIVE" ? (
                    <FiUnlock />
                  ) : actionDialog.requestedStatus ===
                    "BLOCKED" ? (
                    <FiLock />
                  ) : (
                    <FiSlash />
                  )}

                  {actionSubmitting
                    ? "Processing..."
                    : "Confirm action"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default UserManagement;