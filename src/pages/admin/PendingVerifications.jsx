import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import "./PendingVerifications.css";

import PendingDoctorModal from "./PendingDoctorModal";

import {
  getAdminDoctors,
  getAdminDoctorById,
  updateAdminDoctorVerification
} from "../../services/adminService";

const PAGE_SIZE = 9;

const getApiErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again."
) => {
  const data = error?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data?.message) {
    return data.message;
  }

  if (data?.reason) {
    return data.reason;
  }

  if (data && typeof data === "object") {
    const validationMessage = Object.values(data).find(
      (value) => typeof value === "string" && value.trim()
    );

    if (validationMessage) {
      return validationMessage;
    }
  }

  if (error?.message) {
    return error.message;
  }

  return fallback;
};

const formatFee = (fee) => {
  if (fee == null || Number.isNaN(Number(fee))) {
    return "Not provided";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(fee));
};

const formatDate = (value) => {
  if (value == null || value === "") {
    return "Not available";
  }

  const rawValue = String(value);

  if (/^\d{14}$/.test(rawValue)) {
    const year = Number(rawValue.slice(0, 4));
    const month = Number(rawValue.slice(4, 6)) - 1;
    const day = Number(rawValue.slice(6, 8));
    const hour = Number(rawValue.slice(8, 10));
    const minute = Number(rawValue.slice(10, 12));
    const second = Number(rawValue.slice(12, 14));

    const parsedDate = new Date(
      year,
      month,
      day,
      hour,
      minute,
      second
    );

    if (!Number.isNaN(parsedDate.getTime())) {
      return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).format(parsedDate);
    }
  }

  const date = new Date(Number(value));

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
};

const getInitials = (name) => {
  if (!name?.trim()) {
    return "DR";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const resolveProfileImageUrl = (url) => {
  if (!url || typeof url !== "string") {
    return "";
  }

  const normalizedUrl = url.trim();

  if (!normalizedUrl || normalizedUrl.startsWith("/src/")) {
    return "";
  }

  if (
    normalizedUrl.startsWith("http://") ||
    normalizedUrl.startsWith("https://") ||
    normalizedUrl.startsWith("blob:") ||
    normalizedUrl.startsWith("data:")
  ) {
    return normalizedUrl;
  }

  if (normalizedUrl.startsWith("/uploads/")) {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL ||
      "http://localhost:8080/api";

    const backendOrigin = apiBaseUrl
      .replace(/\/+$/, "")
      .replace(/\/api$/i, "");

    return `${backendOrigin}${normalizedUrl}`;
  }

  return "";
};

const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="pv-icon"
  >
    <path
      d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const RefreshIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="pv-icon"
  >
    <path
      d="M20 6v5h-5M4 18v-5h5m9.2-3A7 7 0 0 0 6.4 6.4L4 9m16 6-2.4 2.6A7 7 0 0 1 5.8 15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ArrowIcon = ({ direction = "right" }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={`pv-arrow-icon ${
      direction === "left" ? "pv-arrow-icon-left" : ""
    }`}
  >
    <path
      d="m9 18 6-6-6-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DoctorAvatar = ({ doctor, large = false }) => {
  const [failedImageUrl, setFailedImageUrl] = useState("");

  const imageUrl = resolveProfileImageUrl(
    doctor?.profileImageUrl
  );

  const imageFailed =
    Boolean(imageUrl) && failedImageUrl === imageUrl;

  if (imageUrl && !imageFailed) {
    return (
      <img
        className={`pv-avatar ${
          large ? "pv-avatar-large" : ""
        }`}
        src={imageUrl}
        alt={doctor?.fullName || "Doctor"}
        onError={() => setFailedImageUrl(imageUrl)}
      />
    );
  }

  return (
    <div
      className={`pv-avatar pv-avatar-fallback ${
        large ? "pv-avatar-large" : ""
      }`}
      aria-label={doctor?.fullName || "Doctor"}
    >
      {getInitials(doctor?.fullName)}
    </div>
  );
};

const PendingCardSkeleton = () => (
  <article className="pv-doctor-card pv-doctor-card-skeleton">
    <div className="pv-skeleton pv-skeleton-avatar" />

    <div className="pv-skeleton-content">
      <div className="pv-skeleton pv-skeleton-title" />
      <div className="pv-skeleton pv-skeleton-line" />
      <div className="pv-skeleton pv-skeleton-line pv-skeleton-line-short" />
    </div>

    <div className="pv-skeleton pv-skeleton-button" />
  </article>
);

const PendingVerifications = () => {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [summary, setSummary] = useState(null);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sortDirection, setSortDirection] = useState("DESC");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState("");

  const [openingDoctorId, setOpeningDoctorId] =
    useState(null);

  const [selectedDoctor, setSelectedDoctor] =
    useState(null);

  const [notice, setNotice] = useState(null);

  const showNotice = useCallback((type, message) => {
    setNotice({
      type,
      message
    });
  }, []);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setNotice(null);
    }, 4500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [notice]);

  const loadPendingDoctors = useCallback(
    async (targetPage, silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setPageError("");

      try {
        const response = await getAdminDoctors({
          search: appliedSearch,
          verificationStatus: "UNDER_REVIEW",
          accountStatus: "ALL",
          page: targetPage,
          size: PAGE_SIZE,
          sortBy: "reviewSubmittedAt",
          sortDirection
        });

        setPendingDoctors(
          Array.isArray(response?.content)
            ? response.content
            : []
        );

        setSummary(response?.summary || null);
        setTotalPages(Number(response?.totalPages || 0));
        setTotalElements(
          Number(response?.totalElements || 0)
        );

        if (
          Number.isInteger(response?.page) &&
          response.page !== targetPage
        ) {
          setPage(response.page);
        }
      } catch (error) {
        setPendingDoctors([]);
        setSummary(null);
        setTotalPages(0);
        setTotalElements(0);

        setPageError(
          getApiErrorMessage(
            error,
            "Unable to load pending doctor verifications."
          )
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [appliedSearch, sortDirection]
  );

  useEffect(() => {
    loadPendingDoctors(page);
  }, [page, loadPendingDoctors]);

  const summaryCards = useMemo(
    () => [
      {
        label: "Awaiting review",
        value: summary?.underReviewDoctors || 0,
        tone: "warning"
      },
      {
        label: "Verified doctors",
        value: summary?.verifiedDoctors || 0,
        tone: "success"
      },
      {
        label: "Rejected profiles",
        value: summary?.rejectedDoctors || 0,
        tone: "danger"
      },
      {
        label: "Pending drafts",
        value: summary?.pendingDoctors || 0,
        tone: "neutral"
      }
    ],
    [summary]
  );

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const normalizedSearch = searchInput.trim();

    if (
      normalizedSearch === appliedSearch &&
      page === 0
    ) {
      loadPendingDoctors(0, true);
      return;
    }

    setAppliedSearch(normalizedSearch);
    setPage(0);
  };

  const handleClearSearch = () => {
    setSearchInput("");

    if (!appliedSearch) {
      return;
    }

    setAppliedSearch("");
    setPage(0);
  };

  const handleOpenDoctor = async (doctorProfileId) => {
    if (!doctorProfileId || openingDoctorId) {
      return;
    }

    setOpeningDoctorId(doctorProfileId);

    try {
      const details = await getAdminDoctorById(
        doctorProfileId
      );

      setSelectedDoctor(details);
    } catch (error) {
      showNotice(
        "error",
        getApiErrorMessage(
          error,
          "Unable to load the doctor profile."
        )
      );
    } finally {
      setOpeningDoctorId(null);
    }
  };

  const updateSummaryAfterDecision = (decision) => {
    setSummary((currentSummary) => {
      if (!currentSummary) {
        return currentSummary;
      }

      const nextSummary = {
        ...currentSummary,
        underReviewDoctors: Math.max(
          0,
          Number(currentSummary.underReviewDoctors || 0) -
            1
        )
      };

      if (decision === "VERIFIED") {
        nextSummary.verifiedDoctors =
          Number(currentSummary.verifiedDoctors || 0) + 1;
      }

      if (decision === "REJECTED") {
        nextSummary.rejectedDoctors =
          Number(currentSummary.rejectedDoctors || 0) + 1;
      }

      return nextSummary;
    });
  };

  const synchronizeQueueAfterDecision = (
    doctorProfileId,
    decision
  ) => {
    setPendingDoctors((currentDoctors) =>
      currentDoctors.filter(
        (doctor) =>
          doctor.doctorProfileId !== doctorProfileId
      )
    );

    setTotalElements((currentTotal) =>
      Math.max(0, currentTotal - 1)
    );

    updateSummaryAfterDecision(decision);

    const wasOnlyItemOnPage =
      pendingDoctors.length === 1;

    if (wasOnlyItemOnPage && page > 0) {
      setPage((currentPage) =>
        Math.max(0, currentPage - 1)
      );
      return;
    }

    window.setTimeout(() => {
      loadPendingDoctors(page, true);
    }, 250);
  };

  const handleVerifyDoctor = async (
    doctorProfileId
  ) => {
    const response =
      await updateAdminDoctorVerification(
        doctorProfileId,
        {
          decision: "VERIFIED",
          reason: null
        }
      );

    synchronizeQueueAfterDecision(
      doctorProfileId,
      "VERIFIED"
    );

    showNotice(
      "success",
      `${response?.doctorName || "Doctor"} was verified successfully.`
    );

    return response;
  };

  const handleRejectDoctor = async (
    doctorProfileId,
    reason
  ) => {
    const response =
      await updateAdminDoctorVerification(
        doctorProfileId,
        {
          decision: "REJECTED",
          reason: reason.trim()
        }
      );

    synchronizeQueueAfterDecision(
      doctorProfileId,
      "REJECTED"
    );

    showNotice(
      "success",
      `${response?.doctorName || "Doctor"} was rejected and notified.`
    );

    return response;
  };

  const handlePreviousPage = () => {
    if (page > 0 && !loading) {
      setPage((currentPage) => currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (page + 1 < totalPages && !loading) {
      setPage((currentPage) => currentPage + 1);
    }
  };

  return (
    <main className="pending-verifications-page">
      <header className="pv-page-header">
        <div className="pv-page-heading">
          <div className="pv-eyebrow">
            Doctor onboarding
          </div>

          <h1>Pending verifications</h1>

          <p>
            Review submitted doctor profiles, registration
            details and professional documents before approval.
          </p>
        </div>

        <button
          type="button"
          className="pv-refresh-button"
          onClick={() => loadPendingDoctors(page, true)}
          disabled={loading || refreshing}
        >
          <RefreshIcon />

          <span>
            {refreshing ? "Refreshing..." : "Refresh"}
          </span>
        </button>
      </header>

      <section
        className="pv-summary-grid"
        aria-label="Verification summary"
      >
        {summaryCards.map((card) => (
          <article
            className={`pv-summary-card pv-summary-${card.tone}`}
            key={card.label}
          >
            <div className="pv-summary-indicator" />

            <div>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="pv-toolbar">
        <form
          className="pv-search-form"
          onSubmit={handleSearchSubmit}
        >
          <div className="pv-search-field">
            <SearchIcon />

            <input
              type="search"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder="Search by doctor, specialization or clinic"
              aria-label="Search pending doctors"
            />

            {(searchInput || appliedSearch) && (
              <button
                type="button"
                className="pv-search-clear"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <button
            type="submit"
            className="pv-search-button"
            disabled={loading}
          >
            Search
          </button>
        </form>

        <div className="pv-toolbar-right">
          <div className="pv-result-count">
            <strong>{totalElements}</strong>
            <span>
              {totalElements === 1
                ? "profile awaiting review"
                : "profiles awaiting review"}
            </span>
          </div>

          <label className="pv-sort-control">
            <span>Sort</span>

            <select
              value={sortDirection}
              onChange={(event) => {
                setSortDirection(event.target.value);
                setPage(0);
              }}
              aria-label="Sort pending verifications"
            >
              <option value="DESC">
                Newest submitted
              </option>

              <option value="ASC">
                Oldest submitted
              </option>
            </select>
          </label>
        </div>
      </section>

      {pageError && (
        <section
          className="pv-state-panel pv-error-panel"
          role="alert"
        >
          <div className="pv-state-symbol">!</div>

          <div>
            <h2>Unable to load verifications</h2>
            <p>{pageError}</p>
          </div>

          <button
            type="button"
            onClick={() => loadPendingDoctors(page)}
          >
            Try again
          </button>
        </section>
      )}

      {!pageError && loading && (
        <section
          className="pv-doctor-grid"
          aria-label="Loading pending doctors"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <PendingCardSkeleton key={index} />
          ))}
        </section>
      )}

      {!pageError &&
        !loading &&
        pendingDoctors.length === 0 && (
          <section className="pv-empty-state">
            <div className="pv-empty-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M8 12.5 10.6 15 16 9.5M12 3l7 3v5c0 4.5-2.8 8.1-7 10-4.2-1.9-7-5.5-7-10V6l7-3Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h2>
              {appliedSearch
                ? "No matching profiles found"
                : "Verification queue is clear"}
            </h2>

            <p>
              {appliedSearch
                ? "No submitted doctor profile matches the current search."
                : "There are currently no doctor profiles waiting for admin review."}
            </p>

            {appliedSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
              >
                Clear search
              </button>
            )}
          </section>
        )}

      {!pageError &&
        !loading &&
        pendingDoctors.length > 0 && (
          <>
            <section className="pv-doctor-grid">
              {pendingDoctors.map((doctor) => {
                const isOpening =
                  openingDoctorId ===
                  doctor.doctorProfileId;

                return (
                  <article
                    className="pv-doctor-card"
                    key={doctor.doctorProfileId}
                  >
                    <div className="pv-card-top">
                      <DoctorAvatar doctor={doctor} />

                      <div className="pv-card-identity">
                        <div className="pv-card-title-row">
                          <h2>{doctor.fullName}</h2>

                          <span className="pv-status-badge">
                            Under review
                          </span>
                        </div>

                        <p>
                          {doctor.primarySpecialization ||
                            doctor.specializations?.[0] ||
                            "Specialization not provided"}
                        </p>
                      </div>
                    </div>

                    <dl className="pv-card-details">
                      <div>
                        <dt>Experience</dt>
                        <dd>
                          {doctor.experienceYears != null
                            ? `${doctor.experienceYears} years`
                            : "Not provided"}
                        </dd>
                      </div>

                      <div>
                        <dt>Primary clinic</dt>
                        <dd>
                          {doctor.primaryClinicName ||
                            "Not provided"}
                        </dd>
                      </div>

                      <div>
                        <dt>Location</dt>
                        <dd>
                          {[doctor.area, doctor.city]
                            .filter(Boolean)
                            .join(", ") || "Not provided"}
                        </dd>
                      </div>

                      <div>
                        <dt>Consultation</dt>
                        <dd>
                          {formatFee(
                            doctor.consultationFee
                          )}
                        </dd>
                      </div>
                    </dl>

                    <div className="pv-card-meta">
                      <span>
                        Submitted profile
                      </span>

                      <span>
                        Updated{" "}
                        {formatDate(
                          doctor.lastProfileUpdatedAt
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="pv-review-button"
                      onClick={() =>
                        handleOpenDoctor(
                          doctor.doctorProfileId
                        )
                      }
                      disabled={
                        Boolean(openingDoctorId) || refreshing
                      }
                    >
                      {isOpening ? (
                        <>
                          <span className="pv-spinner" />
                          Loading profile...
                        </>
                      ) : (
                        <>
                          Review profile
                          <ArrowIcon />
                        </>
                      )}
                    </button>
                  </article>
                );
              })}
            </section>

            <nav
              className="pv-pagination"
              aria-label="Pending verification pagination"
            >
              <button
                type="button"
                onClick={handlePreviousPage}
                disabled={page === 0 || loading}
                aria-label="Previous page"
              >
                <ArrowIcon direction="left" />
                <span>Previous</span>
              </button>

              <div className="pv-page-information">
                <strong>
                  Page {page + 1}
                </strong>

                <span>
                  of {Math.max(totalPages, 1)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={
                  page + 1 >= totalPages || loading
                }
                aria-label="Next page"
              >
                <span>Next</span>
                <ArrowIcon />
              </button>
            </nav>
          </>
        )}

      {selectedDoctor && (
        <PendingDoctorModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          onVerify={handleVerifyDoctor}
          onReject={handleRejectDoctor}
        />
      )}

      {notice && (
        <div
          className={`pv-toast pv-toast-${notice.type}`}
          role="status"
        >
          <span className="pv-toast-indicator" />
          <p>{notice.message}</p>

          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}
    </main>
  );
};

export default PendingVerifications;