import React, {
  useEffect,
  useMemo,
  useState
} from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  BadgeCheck,
  Ban,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Eye,
  FileText,
  GraduationCap,
  IndianRupee,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Power,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Stethoscope,
  UserRound,
  Users,
  X
} from "lucide-react";

import defaultDoctorAvatar from "../../assets/images/avtar.png";

import {
  getAdminDoctorById,
  getAdminDoctorFilterOptions,
  getAdminDoctors,
  updateAdminDoctorAccountStatus
} from "../../services/adminService";

import "./Doctors.css";

const DEFAULT_SUMMARY = {
  totalDoctors: 0,
  verifiedDoctors: 0,
  pendingDoctors: 0,
  underReviewDoctors: 0,
  rejectedDoctors: 0,
  activeAccounts: 0,
  inactiveAccounts: 0,
  blockedAccounts: 0
};

const DEFAULT_FILTER_OPTIONS = {
  specializations: [],
  cities: [],
  verificationStatuses: [],
  accountStatuses: []
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080/api";

const API_ORIGIN = API_BASE_URL.replace(
  /\/api\/?$/,
  ""
);

const formatEnumLabel = (value) => {
  if (!value) {
    return "Not available";
  }

  return String(value)
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
};

const formatCurrency = (value) => {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "Not specified";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value));
};

const formatCompactTimestamp = (value) => {
  const rawValue = String(value);

  if (!/^\d{14}$/.test(rawValue)) {
    return null;
  }

  const year = Number(rawValue.slice(0, 4));
  const month = Number(rawValue.slice(4, 6)) - 1;
  const day = Number(rawValue.slice(6, 8));
  const hour = Number(rawValue.slice(8, 10));
  const minute = Number(rawValue.slice(10, 12));
  const second = Number(rawValue.slice(12, 14));

  return new Date(
    year,
    month,
    day,
    hour,
    minute,
    second
  );
};

const formatDate = (value, includeTime = false) => {
  if (!value) {
    return "Not available";
  }

  const compactDate =
    formatCompactTimestamp(value);

  const parsedDate =
    compactDate ||
    new Date(Number(value));

  if (
    !parsedDate ||
    Number.isNaN(parsedDate.getTime())
  ) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit"
        }
      : {})
  }).format(parsedDate);
};

const formatBytes = (value) => {
  const bytes = Number(value);

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "Size unavailable";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
};

const resolveMediaUrl = (url) => {
  if (!url || typeof url !== "string") {
    return defaultDoctorAvatar;
  }

  const cleanUrl = url.trim();

  if (
    !cleanUrl ||
    cleanUrl.includes("/src/assets/")
  ) {
    return defaultDoctorAvatar;
  }

  if (/^https?:\/\//i.test(cleanUrl)) {
    try {
      const parsedUrl = new URL(cleanUrl);

      const mediaIsLocal =
        parsedUrl.hostname === "localhost" ||
        parsedUrl.hostname === "127.0.0.1";

      const browserIsLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      if (mediaIsLocal && !browserIsLocal) {
        return `${API_ORIGIN}${parsedUrl.pathname}`;
      }

      return cleanUrl;
    } catch {
      return defaultDoctorAvatar;
    }
  }

  if (cleanUrl.startsWith("/")) {
    return `${API_ORIGIN}${cleanUrl}`;
  }

  return `${API_ORIGIN}/${cleanUrl}`;
};

const getVerificationClass = (status) => {
  switch (status) {
    case "VERIFIED":
      return "is-verified";

    case "UNDER_REVIEW":
      return "is-review";

    case "REJECTED":
      return "is-rejected";

    case "PENDING":
    default:
      return "is-pending";
  }
};

const getAccountClass = (status) => {
  switch (status) {
    case "ACTIVE":
      return "is-active";

    case "BLOCKED":
      return "is-blocked";

    case "INACTIVE":
    default:
      return "is-inactive";
  }
};

const buildVisiblePages = (
  currentPage,
  totalPages
) => {
  if (totalPages <= 1) {
    return [0];
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
      (pageNumber) =>
        pageNumber >= 0 &&
        pageNumber < totalPages
    )
    .sort((a, b) => a - b);
};

const EmptyValue = ({ children }) => (
  <span className="admin-doctors-muted-value">
    {children || "Not available"}
  </span>
);

const InfoItem = ({
  icon,
  label,
  value,
  children
}) => (
  <div className="admin-doctors-info-item">
    <div className="admin-doctors-info-label">
      {icon}
      <span>{label}</span>
    </div>

    <div className="admin-doctors-info-value">
      {children || value || (
        <EmptyValue />
      )}
    </div>
  </div>
);

const Doctors = () => {
  const [searchInput, setSearchInput] =
    useState("");

  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const [
    verificationStatus,
    setVerificationStatus
  ] = useState("ALL");

  const [
    accountStatus,
    setAccountStatus
  ] = useState("ALL");

  const [
    specializationId,
    setSpecializationId
  ] = useState("");

  const [city, setCity] = useState("");

  const [sortBy, setSortBy] =
    useState("name");

  const [sortDirection, setSortDirection] =
    useState("ASC");

  const [page, setPage] = useState(0);

  const [size, setSize] = useState(10);

  const [refreshKey, setRefreshKey] =
    useState(0);

  const [doctors, setDoctors] = useState([]);

  const [summary, setSummary] = useState(
    DEFAULT_SUMMARY
  );

  const [
    filterOptions,
    setFilterOptions
  ] = useState(DEFAULT_FILTER_OPTIONS);

  const [
    pagination,
    setPagination
  ] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true
  });

  const [loading, setLoading] =
    useState(true);

  const [
    filtersLoading,
    setFiltersLoading
  ] = useState(true);

  const [error, setError] = useState("");

  const [
    selectedDoctorId,
    setSelectedDoctorId
  ] = useState(null);

  const [
    doctorDetails,
    setDoctorDetails
  ] = useState(null);

  const [
    detailsLoading,
    setDetailsLoading
  ] = useState(false);

  const [
    detailsError,
    setDetailsError
  ] = useState("");

  const [
    actionDialog,
    setActionDialog
  ] = useState({
    open: false,
    targetStatus: "",
    reason: "",
    submitting: false,
    error: ""
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(
        searchInput.trim()
      );

      setPage(0);
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  useEffect(() => {
    let isMounted = true;

    const loadFilterOptions = async () => {
      try {
        setFiltersLoading(true);

        const response =
          await getAdminDoctorFilterOptions();

        if (!isMounted) {
          return;
        }

        setFilterOptions({
          specializations:
            response?.specializations || [],
          cities: response?.cities || [],
          verificationStatuses:
            response?.verificationStatuses || [],
          accountStatuses:
            response?.accountStatuses || []
        });
      } catch  {
        if (!isMounted) {
          return;
        }

        setFilterOptions(
          DEFAULT_FILTER_OPTIONS
        );
      } finally {
        if (isMounted) {
          setFiltersLoading(false);
        }
      }
    };

    loadFilterOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadDoctors = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getAdminDoctors({
          search: debouncedSearch,
          verificationStatus,
          accountStatus,
          specializationId,
          city,
          page,
          size,
          sortBy,
          sortDirection
        });

        if (!isMounted) {
          return;
        }

        setDoctors(response?.content || []);

        setSummary(
          response?.summary ||
            DEFAULT_SUMMARY
        );

        setPagination({
          page: response?.page ?? page,
          size: response?.size ?? size,
          totalElements:
            response?.totalElements ?? 0,
          totalPages:
            response?.totalPages ?? 0,
          first: response?.first ?? true,
          last: response?.last ?? true
        });
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setDoctors([]);
        setSummary(DEFAULT_SUMMARY);

        setPagination({
          page: 0,
          size,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true
        });

        setError(
          requestError?.message ||
            "Unable to load doctors."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDoctors();

    return () => {
      isMounted = false;
    };
  }, [
    debouncedSearch,
    verificationStatus,
    accountStatus,
    specializationId,
    city,
    page,
    size,
    sortBy,
    sortDirection,
    refreshKey
  ]);

  useEffect(() => {
    if (!selectedDoctorId) {
      setDoctorDetails(null);
      setDetailsError("");
      return undefined;
    }

    let isMounted = true;

    const loadDoctorDetails = async () => {
      try {
        setDetailsLoading(true);
        setDetailsError("");

        const response =
          await getAdminDoctorById(
            selectedDoctorId
          );

        if (!isMounted) {
          return;
        }

        setDoctorDetails(response);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setDetailsError(
          requestError?.message ||
            "Unable to load doctor details."
        );
      } finally {
        if (isMounted) {
          setDetailsLoading(false);
        }
      }
    };

    loadDoctorDetails();

    return () => {
      isMounted = false;
    };
  }, [selectedDoctorId]);

  useEffect(() => {
    if (
      !selectedDoctorId &&
      !actionDialog.open
    ) {
      return undefined;
    }

    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        originalOverflow;
    };
  }, [
    selectedDoctorId,
    actionDialog.open
  ]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      if (actionDialog.open) {
        setActionDialog((previous) => ({
          ...previous,
          open: false,
          error: ""
        }));

        return;
      }

      setSelectedDoctorId(null);
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [actionDialog.open]);

  const visiblePages = useMemo(
    () =>
      buildVisiblePages(
        pagination.page,
        pagination.totalPages
      ),
    [
      pagination.page,
      pagination.totalPages
    ]
  );

  const pendingReviewCount =
    Number(summary.pendingDoctors || 0) +
    Number(summary.underReviewDoctors || 0);

  const hasActiveFilters =
    Boolean(searchInput.trim()) ||
    verificationStatus !== "ALL" ||
    accountStatus !== "ALL" ||
    Boolean(specializationId) ||
    Boolean(city) ||
    sortBy !== "name" ||
    sortDirection !== "ASC";

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setVerificationStatus("ALL");
    setAccountStatus("ALL");
    setSpecializationId("");
    setCity("");
    setSortBy("name");
    setSortDirection("ASC");
    setPage(0);
    setSize(10);
  };

  const refreshDoctors = () => {
    setRefreshKey((previous) => previous + 1);
  };

  const openDoctorDetails = (
    doctorProfileId
  ) => {
    setSelectedDoctorId(doctorProfileId);
    setDoctorDetails(null);
    setDetailsError("");
  };

  const closeDoctorDetails = () => {
    if (actionDialog.open) {
      return;
    }

    setSelectedDoctorId(null);
    setDoctorDetails(null);
    setDetailsError("");
  };

  const openActionDialog = (
    targetStatus
  ) => {
    setActionDialog({
      open: true,
      targetStatus,
      reason: "",
      submitting: false,
      error: ""
    });
  };

  const closeActionDialog = () => {
    if (actionDialog.submitting) {
      return;
    }

    setActionDialog({
      open: false,
      targetStatus: "",
      reason: "",
      submitting: false,
      error: ""
    });
  };

  const submitAccountStatus = async () => {
    const cleanReason =
      actionDialog.reason.trim();

    if (
      actionDialog.targetStatus !== "ACTIVE" &&
      cleanReason.length < 5
    ) {
      setActionDialog((previous) => ({
        ...previous,
        error:
          "Please enter a reason of at least 5 characters."
      }));

      return;
    }

    try {
      setActionDialog((previous) => ({
        ...previous,
        submitting: true,
        error: ""
      }));

      await updateAdminDoctorAccountStatus(
        doctorDetails.doctorProfileId,
        {
          status:
            actionDialog.targetStatus,
          reason:
            cleanReason ||
            "Administrative review completed"
        }
      );

      const refreshedDetails =
        await getAdminDoctorById(
          doctorDetails.doctorProfileId
        );

      setDoctorDetails(refreshedDetails);

      setActionDialog({
        open: false,
        targetStatus: "",
        reason: "",
        submitting: false,
        error: ""
      });

      refreshDoctors();
    } catch (requestError) {
      setActionDialog((previous) => ({
        ...previous,
        submitting: false,
        error:
          requestError?.message ||
          "Unable to update account status."
      }));
    }
  };

  const renderPageButtons = () => {
    const buttons = [];

    visiblePages.forEach(
      (pageNumber, index) => {
        const previousPage =
          visiblePages[index - 1];

        if (
          previousPage !== undefined &&
          pageNumber - previousPage > 1
        ) {
          buttons.push(
            <span
              className="admin-doctors-page-gap"
              key={`gap-${pageNumber}`}
            >
              …
            </span>
          );
        }

        buttons.push(
          <button
            type="button"
            key={pageNumber}
            className={`admin-doctors-page-number ${
              pagination.page === pageNumber
                ? "is-current"
                : ""
            }`}
            onClick={() => setPage(pageNumber)}
            aria-current={
              pagination.page === pageNumber
                ? "page"
                : undefined
            }
          >
            {pageNumber + 1}
          </button>
        );
      }
    );

    return buttons;
  };

  const actionDialogTitle =
    actionDialog.targetStatus === "ACTIVE"
      ? "Activate doctor account"
      : actionDialog.targetStatus ===
        "INACTIVE"
      ? "Deactivate doctor account"
      : "Block doctor account";

  const actionDialogDescription =
    actionDialog.targetStatus === "ACTIVE"
      ? "The doctor will be allowed to access the platform again."
      : actionDialog.targetStatus ===
        "INACTIVE"
      ? "The doctor will temporarily lose access to the platform."
      : "The doctor account will be blocked and its active session will be revoked.";

  const detailsPortal =
    selectedDoctorId &&
    createPortal(
      <div
        className="admin-doctors-modal-overlay"
        onMouseDown={closeDoctorDetails}
      >
        <section
          className="admin-doctors-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Doctor details"
          onMouseDown={(event) =>
            event.stopPropagation()
          }
        >
          <header className="admin-doctors-modal-header">
            <div>
              <span className="admin-doctors-modal-eyebrow">
                Doctor profile
              </span>

              <h2>Professional details</h2>

              <p>
                Account, practice, clinic and
                verification information.
              </p>
            </div>

            <button
              type="button"
              className="admin-doctors-icon-button"
              onClick={closeDoctorDetails}
              aria-label="Close doctor details"
            >
              <X size={20} />
            </button>
          </header>

          <div className="admin-doctors-modal-scroll">
            {detailsLoading && (
              <div className="admin-doctors-modal-state">
                <LoaderCircle
                  className="admin-doctors-spinner"
                  size={28}
                />

                <p>Loading doctor details…</p>
              </div>
            )}

            {!detailsLoading &&
              detailsError && (
                <div className="admin-doctors-modal-state is-error">
                  <CircleAlert size={28} />

                  <h3>
                    Doctor details could not be
                    loaded
                  </h3>

                  <p>{detailsError}</p>

                  <button
                    type="button"
                    className="admin-doctors-secondary-button"
                    onClick={() => {
                      const currentId =
                        selectedDoctorId;

                      setSelectedDoctorId(null);

                      window.setTimeout(() => {
                        setSelectedDoctorId(
                          currentId
                        );
                      }, 0);
                    }}
                  >
                    <RefreshCw size={16} />
                    Try again
                  </button>
                </div>
              )}

            {!detailsLoading &&
              !detailsError &&
              doctorDetails && (
                <>
                  <div className="admin-doctors-profile-summary">
                    <div className="admin-doctors-profile-identity">
                      <img
                        src={resolveMediaUrl(
                          doctorDetails.profileImageUrl
                        )}
                        alt={
                          doctorDetails.fullName ||
                          "Doctor"
                        }
                        onError={(event) => {
                          event.currentTarget.src =
                            defaultDoctorAvatar;
                        }}
                      />

                      <div>
                        <div className="admin-doctors-profile-title-row">
                          <h3>
                            {doctorDetails.fullName ||
                              "Doctor"}
                          </h3>

                          {doctorDetails.verificationStatus ===
                            "VERIFIED" && (
                            <ShieldCheck
                              size={21}
                              aria-label="Verified doctor"
                            />
                          )}
                        </div>

                        <p>
                          {doctorDetails
                            .specializations
                            ?.join(", ") ||
                            "Specialization not specified"}
                        </p>

                        <div className="admin-doctors-profile-badges">
                          <span
                            className={`admin-doctors-status-badge ${getVerificationClass(
                              doctorDetails.verificationStatus
                            )}`}
                          >
                            {formatEnumLabel(
                              doctorDetails.verificationStatus
                            )}
                          </span>

                          <span
                            className={`admin-doctors-status-badge ${getAccountClass(
                              doctorDetails.accountStatus
                            )}`}
                          >
                            {formatEnumLabel(
                              doctorDetails.accountStatus
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="admin-doctors-profile-metrics">
                      <div>
                        <strong>
                          {doctorDetails.totalPatients ||
                            0}
                        </strong>
                        <span>Patients</span>
                      </div>

                      <div>
                        <strong>
                          {doctorDetails.totalAppointments ||
                            0}
                        </strong>
                        <span>Appointments</span>
                      </div>

                      <div>
                        <strong>
                          {doctorDetails.experienceYears ||
                            0}
                        </strong>
                        <span>Years experience</span>
                      </div>
                    </div>
                  </div>

                  <section className="admin-doctors-detail-section">
                    <div className="admin-doctors-section-heading">
                      <UserRound size={18} />

                      <div>
                        <h3>
                          Account information
                        </h3>

                        <p>
                          Identity and platform
                          account details.
                        </p>
                      </div>
                    </div>

                    <div className="admin-doctors-info-grid">
                      <InfoItem
                        icon={<Mail size={15} />}
                        label="Email"
                        value={
                          doctorDetails.email
                        }
                      />

                      <InfoItem
                        icon={<Phone size={15} />}
                        label="Mobile"
                        value={
                          doctorDetails.mobile
                        }
                      />

                      <InfoItem
                        icon={
                          <UserRound size={15} />
                        }
                        label="Username"
                        value={
                          doctorDetails.username
                        }
                      />

                      <InfoItem
                        icon={
                          <CalendarDays
                            size={15}
                          />
                        }
                        label="Joined"
                        value={formatDate(
                          doctorDetails.joinedAt
                        )}
                      />

                      <InfoItem
                        icon={
                          <Activity size={15} />
                        }
                        label="Gender"
                        value={formatEnumLabel(
                          doctorDetails.gender
                        )}
                      />

                      <InfoItem
                        icon={
                          <RefreshCw size={15} />
                        }
                        label="Last profile update"
                        value={formatDate(
                          doctorDetails.lastProfileUpdatedAt,
                          true
                        )}
                      />
                    </div>
                  </section>

                  <section className="admin-doctors-detail-section">
                    <div className="admin-doctors-section-heading">
                      <Stethoscope size={18} />

                      <div>
                        <h3>
                          Professional information
                        </h3>

                        <p>
                          Registration,
                          qualifications and fees.
                        </p>
                      </div>
                    </div>

                    <div className="admin-doctors-info-grid">
                      <InfoItem
                        icon={
                          <Briefcase size={15} />
                        }
                        label="Experience"
                        value={
                          doctorDetails.experienceYears !==
                          null
                            ? `${doctorDetails.experienceYears} years`
                            : null
                        }
                      />

                      <InfoItem
                        icon={
                          <BadgeCheck size={15} />
                        }
                        label="Medical council"
                        value={
                          doctorDetails.councilName
                        }
                      />

                      <InfoItem
                        icon={
                          <ShieldCheck
                            size={15}
                          />
                        }
                        label="Registration number"
                        value={
                          doctorDetails.registrationNumber
                        }
                      />

                      <InfoItem
                        icon={
                          <CalendarDays
                            size={15}
                          />
                        }
                        label="Registration year"
                        value={
                          doctorDetails.registrationYear
                        }
                      />

                      <InfoItem
                        icon={
                          <IndianRupee
                            size={15}
                          />
                        }
                        label="Base consultation fee"
                        value={formatCurrency(
                          doctorDetails.consultationFee
                        )}
                      />

                      <InfoItem
                        icon={
                          <GraduationCap
                            size={15}
                          />
                        }
                        label="Degrees"
                        value={
                          doctorDetails.degrees
                            ?.length
                            ? doctorDetails.degrees.join(
                                ", "
                              )
                            : null
                        }
                      />

                      <InfoItem
                        icon={
                          <Stethoscope
                            size={15}
                          />
                        }
                        label="Specializations"
                        value={
                          doctorDetails
                            .specializations
                            ?.length
                            ? doctorDetails.specializations.join(
                                ", "
                              )
                            : null
                        }
                      />

                      <InfoItem
                        icon={
                          <Activity size={15} />
                        }
                        label="Review submission"
                        value={formatDate(
                          doctorDetails.reviewSubmittedAt,
                          true
                        )}
                      />
                    </div>

                    {doctorDetails.description && (
                      <div className="admin-doctors-description-box">
                        <strong>
                          Professional summary
                        </strong>

                        <p>
                          {
                            doctorDetails.description
                          }
                        </p>
                      </div>
                    )}

                    {doctorDetails.verificationRejectionReason && (
                      <div className="admin-doctors-warning-box">
                        <CircleAlert size={18} />

                        <div>
                          <strong>
                            Verification rejection
                            reason
                          </strong>

                          <p>
                            {
                              doctorDetails.verificationRejectionReason
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="admin-doctors-detail-section">
                    <div className="admin-doctors-section-heading">
                      <Building2 size={18} />

                      <div>
                        <h3>Clinics</h3>

                        <p>
                          Active clinic locations and
                          availability.
                        </p>
                      </div>
                    </div>

                    {doctorDetails.clinics?.length ? (
                      <div className="admin-doctors-card-list">
                        {doctorDetails.clinics.map(
                          (clinic) => (
                            <article
                              className="admin-doctors-sub-card"
                              key={clinic.id}
                            >
                              <div className="admin-doctors-sub-card-header">
                                <div>
                                  <div className="admin-doctors-sub-card-title">
                                    <h4>
                                      {clinic.clinicName}
                                    </h4>

                                    {clinic.primary && (
                                      <span>
                                        Primary
                                      </span>
                                    )}
                                  </div>

                                  <p>
                                    {[
                                      clinic.addressLine1,
                                      clinic.addressLine2,
                                      clinic.area,
                                      clinic.city,
                                      clinic.state,
                                      clinic.pincode
                                    ]
                                      .filter(Boolean)
                                      .join(", ")}
                                  </p>
                                </div>

                                <strong>
                                  {formatCurrency(
                                    clinic.consultationFee
                                  )}
                                </strong>
                              </div>

                              <div className="admin-doctors-sub-card-meta">
                                {clinic.contactNumber && (
                                  <span>
                                    <Phone size={14} />
                                    {
                                      clinic.contactNumber
                                    }
                                  </span>
                                )}

                                {clinic.landmark && (
                                  <span>
                                    <MapPin size={14} />
                                    {
                                      clinic.landmark
                                    }
                                  </span>
                                )}
                              </div>

                              {clinic
                                .availabilitySlots
                                ?.length > 0 && (
                                <div className="admin-doctors-slot-list">
                                  {clinic.availabilitySlots.map(
                                    (slot) => (
                                      <span
                                        key={slot.id}
                                      >
                                        {formatEnumLabel(
                                          slot.dayOfWeek
                                        )}{" "}
                                        {slot.startTime}–
                                        {slot.endTime}
                                      </span>
                                    )
                                  )}
                                </div>
                              )}
                            </article>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="admin-doctors-inline-empty">
                        No clinic information is
                        available.
                      </div>
                    )}
                  </section>

                  <section className="admin-doctors-detail-section">
                    <div className="admin-doctors-section-heading">
                      <Building2 size={18} />

                      <div>
                        <h3>
                          Visiting positions
                        </h3>

                        <p>
                          Associated hospitals and
                          institutions.
                        </p>
                      </div>
                    </div>

                    {doctorDetails
                      .visitingPositions?.length ? (
                      <div className="admin-doctors-card-list">
                        {doctorDetails.visitingPositions.map(
                          (position) => (
                            <article
                              className="admin-doctors-sub-card"
                              key={position.id}
                            >
                              <div className="admin-doctors-sub-card-header">
                                <div>
                                  <h4>
                                    {
                                      position.institutionName
                                    }
                                  </h4>

                                  <p>
                                    {[
                                      position.designation,
                                      position.departmentName
                                    ]
                                      .filter(Boolean)
                                      .join(" • ") ||
                                      "Position details not specified"}
                                  </p>
                                </div>

                                <strong>
                                  {formatCurrency(
                                    position.consultationFee
                                  )}
                                </strong>
                              </div>

                              <div className="admin-doctors-sub-card-meta">
                                <span>
                                  <MapPin size={14} />
                                  {[
                                    position.addressLine1,
                                    position.area,
                                    position.city,
                                    position.state,
                                    position.pincode
                                  ]
                                    .filter(Boolean)
                                    .join(", ") ||
                                    "Location unavailable"}
                                </span>
                              </div>

                              {position
                                .availabilitySlots
                                ?.length > 0 && (
                                <div className="admin-doctors-slot-list">
                                  {position.availabilitySlots.map(
                                    (slot) => (
                                      <span
                                        key={slot.id}
                                      >
                                        {formatEnumLabel(
                                          slot.dayOfWeek
                                        )}{" "}
                                        {slot.startTime}–
                                        {slot.endTime}
                                      </span>
                                    )
                                  )}
                                </div>
                              )}
                            </article>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="admin-doctors-inline-empty">
                        No visiting position is
                        available.
                      </div>
                    )}
                  </section>

                  <section className="admin-doctors-detail-section">
                    <div className="admin-doctors-section-heading">
                      <FileText size={18} />

                      <div>
                        <h3>
                          Verification documents
                        </h3>

                        <p>
                          Uploaded identity and
                          professional documents.
                        </p>
                      </div>
                    </div>

                    {doctorDetails.documents?.length ? (
                      <div className="admin-doctors-document-list">
                        {doctorDetails.documents.map(
                          (document) => (
                            <article
                              className="admin-doctors-document-card"
                              key={document.id}
                            >
                              <div className="admin-doctors-document-icon">
                                <FileText
                                  size={19}
                                />
                              </div>

                              <div className="admin-doctors-document-copy">
                                <strong>
                                  {document.documentLabel ||
                                    formatEnumLabel(
                                      document.documentType
                                    )}
                                </strong>

                                <span>
                                  {document.fileName}
                                </span>

                                <small>
                                  {formatBytes(
                                    document.fileSizeBytes
                                  )}{" "}
                                  •{" "}
                                  {formatEnumLabel(
                                    document.verificationStatus
                                  )}
                                </small>
                              </div>

                              {document.fileUrl ? (
                                <a
                                  href={resolveMediaUrl(
                                    document.fileUrl
                                  )}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  View
                                </a>
                              ) : (
                                <span className="admin-doctors-document-unavailable">
                                  Unavailable
                                </span>
                              )}
                            </article>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="admin-doctors-inline-empty">
                        No verification documents
                        are available.
                      </div>
                    )}
                  </section>

                  <section className="admin-doctors-detail-section admin-doctors-account-section">
                    <div className="admin-doctors-section-heading">
                      <LockKeyhole size={18} />

                      <div>
                        <h3>
                          Account administration
                        </h3>

                        <p>
                          Change account access
                          without deleting medical
                          records.
                        </p>
                      </div>
                    </div>

                    <div className="admin-doctors-account-actions">
                      {doctorDetails.accountStatus !==
                        "ACTIVE" && (
                        <button
                          type="button"
                          className="admin-doctors-action-button is-activate"
                          onClick={() =>
                            openActionDialog(
                              "ACTIVE"
                            )
                          }
                        >
                          <Power size={17} />
                          Activate account
                        </button>
                      )}

                      {doctorDetails.accountStatus !==
                        "INACTIVE" && (
                        <button
                          type="button"
                          className="admin-doctors-action-button is-deactivate"
                          onClick={() =>
                            openActionDialog(
                              "INACTIVE"
                            )
                          }
                        >
                          <RotateCcw
                            size={17}
                          />
                          Deactivate account
                        </button>
                      )}

                      {doctorDetails.accountStatus !==
                        "BLOCKED" && (
                        <button
                          type="button"
                          className="admin-doctors-action-button is-block"
                          onClick={() =>
                            openActionDialog(
                              "BLOCKED"
                            )
                          }
                        >
                          <Ban size={17} />
                          Block account
                        </button>
                      )}
                    </div>
                  </section>
                </>
              )}
          </div>
        </section>
      </div>,
      document.body
    );

  const actionPortal =
    actionDialog.open &&
    createPortal(
      <div
        className="admin-doctors-confirm-overlay"
        onMouseDown={closeActionDialog}
      >
        <section
          className="admin-doctors-confirm-dialog"
          role="alertdialog"
          aria-modal="true"
          onMouseDown={(event) =>
            event.stopPropagation()
          }
        >
          <div
            className={`admin-doctors-confirm-icon is-${actionDialog.targetStatus.toLowerCase()}`}
          >
            {actionDialog.targetStatus ===
            "ACTIVE" ? (
              <CheckCircle2 size={23} />
            ) : actionDialog.targetStatus ===
              "INACTIVE" ? (
              <RotateCcw size={23} />
            ) : (
              <Ban size={23} />
            )}
          </div>

          <h3>{actionDialogTitle}</h3>

          <p>{actionDialogDescription}</p>

          <label htmlFor="doctor-status-reason">
            Administrative reason
            {actionDialog.targetStatus !==
              "ACTIVE" && (
              <span> *</span>
            )}
          </label>

          <textarea
            id="doctor-status-reason"
            rows={4}
            value={actionDialog.reason}
            onChange={(event) =>
              setActionDialog(
                (previous) => ({
                  ...previous,
                  reason:
                    event.target.value,
                  error: ""
                })
              )
            }
            placeholder={
              actionDialog.targetStatus ===
              "ACTIVE"
                ? "Administrative review completed"
                : "Enter the reason for this action"
            }
            maxLength={500}
          />

          <div className="admin-doctors-character-count">
            {actionDialog.reason.length}/500
          </div>

          {actionDialog.error && (
            <div className="admin-doctors-form-error">
              <CircleAlert size={15} />
              {actionDialog.error}
            </div>
          )}

          <div className="admin-doctors-confirm-actions">
            <button
              type="button"
              className="admin-doctors-secondary-button"
              onClick={closeActionDialog}
              disabled={
                actionDialog.submitting
              }
            >
              Cancel
            </button>

            <button
              type="button"
              className={`admin-doctors-primary-action is-${actionDialog.targetStatus.toLowerCase()}`}
              onClick={submitAccountStatus}
              disabled={
                actionDialog.submitting
              }
            >
              {actionDialog.submitting ? (
                <>
                  <LoaderCircle
                    className="admin-doctors-spinner"
                    size={16}
                  />
                  Updating…
                </>
              ) : (
                <>Confirm action</>
              )}
            </button>
          </div>
        </section>
      </div>,
      document.body
    );

  return (
    <div className="admin-doctors-page">
      <header className="admin-doctors-page-header">
        <div>
          <span className="admin-doctors-eyebrow">
            Doctor administration
          </span>

          <h1>All doctors</h1>

          <p>
            Review doctor profiles, professional
            information and account access.
          </p>
        </div>

        <button
          type="button"
          className="admin-doctors-refresh-button"
          onClick={refreshDoctors}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={
              loading
                ? "admin-doctors-spinner"
                : ""
            }
          />

          Refresh
        </button>
      </header>

      <section className="admin-doctors-summary-grid">
        <article className="admin-doctors-summary-card">
          <div className="admin-doctors-summary-icon">
            <Users size={20} />
          </div>

          <div>
            <span>Total doctors</span>

            <strong>
              {summary.totalDoctors || 0}
            </strong>

            <small>
              All registered doctor profiles
            </small>
          </div>
        </article>

        <article className="admin-doctors-summary-card">
          <div className="admin-doctors-summary-icon is-verified">
            <BadgeCheck size={20} />
          </div>

          <div>
            <span>Verified</span>

            <strong>
              {summary.verifiedDoctors || 0}
            </strong>

            <small>
              Approved professional profiles
            </small>
          </div>
        </article>

        <article className="admin-doctors-summary-card">
          <div className="admin-doctors-summary-icon is-review">
            <Activity size={20} />
          </div>

          <div>
            <span>Awaiting review</span>

            <strong>
              {pendingReviewCount}
            </strong>

            <small>
              Pending and under review
            </small>
          </div>
        </article>

        <article className="admin-doctors-summary-card">
          <div className="admin-doctors-summary-icon is-blocked">
            <Ban size={20} />
          </div>

          <div>
            <span>Blocked accounts</span>

            <strong>
              {summary.blockedAccounts || 0}
            </strong>

            <small>
              Accounts with restricted access
            </small>
          </div>
        </article>
      </section>

      <section className="admin-doctors-filter-panel">
        <div className="admin-doctors-filter-heading">
          <div>
            <SlidersHorizontal size={18} />

            <span>Search and filters</span>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
            >
              Clear all
            </button>
          )}
        </div>

        <div className="admin-doctors-filter-grid">
          <label className="admin-doctors-search-field">
            <Search size={18} />

            <input
              type="search"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              placeholder="Search name, email, mobile, registration, clinic or city"
            />
          </label>

          <label className="admin-doctors-select-field">
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
                All verification statuses
              </option>

              {filterOptions.verificationStatuses.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {formatEnumLabel(status)}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="admin-doctors-select-field">
            <span>Account</span>

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
                All account statuses
              </option>

              {filterOptions.accountStatuses.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {formatEnumLabel(status)}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="admin-doctors-select-field">
            <span>Specialization</span>

            <select
              value={specializationId}
              disabled={filtersLoading}
              onChange={(event) => {
                setSpecializationId(
                  event.target.value
                );

                setPage(0);
              }}
            >
              <option value="">
                All specializations
              </option>

              {filterOptions.specializations.map(
                (specialization) => (
                  <option
                    key={
                      specialization.id
                    }
                    value={
                      specialization.id
                    }
                  >
                    {
                      specialization.name
                    }
                  </option>
                )
              )}
            </select>
          </label>

          <label className="admin-doctors-select-field">
            <span>City</span>

            <select
              value={city}
              disabled={filtersLoading}
              onChange={(event) => {
                setCity(event.target.value);
                setPage(0);
              }}
            >
              <option value="">
                All cities
              </option>

              {filterOptions.cities.map(
                (cityOption) => (
                  <option
                    key={cityOption}
                    value={cityOption}
                  >
                    {formatEnumLabel(
                      cityOption
                    )}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="admin-doctors-select-field">
            <span>Sort by</span>

            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(
                  event.target.value
                );

                setPage(0);
              }}
            >
              <option value="name">
                Doctor name
              </option>

              <option value="id">
                Recently added
              </option>

              <option value="experienceYears">
                Experience
              </option>

              <option value="lastProfileUpdatedAt">
                Last profile update
              </option>

              <option value="registrationYear">
                Registration year
              </option>
            </select>
          </label>

          <label className="admin-doctors-select-field">
            <span>Direction</span>

            <select
              value={sortDirection}
              onChange={(event) => {
                setSortDirection(
                  event.target.value
                );

                setPage(0);
              }}
            >
              <option value="ASC">
                Ascending
              </option>

              <option value="DESC">
                Descending
              </option>
            </select>
          </label>
        </div>
      </section>

      <section className="admin-doctors-table-panel">
        <div className="admin-doctors-table-toolbar">
          <div>
            <h2>Doctor directory</h2>

            <p>
              {pagination.totalElements}{" "}
              {pagination.totalElements === 1
                ? "doctor"
                : "doctors"}{" "}
              found
            </p>
          </div>

          <label>
            Rows

            <select
              value={size}
              onChange={(event) => {
                setSize(
                  Number(event.target.value)
                );

                setPage(0);
              }}
            >
              {PAGE_SIZE_OPTIONS.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                )
              )}
            </select>
          </label>
        </div>

        {loading && (
          <div className="admin-doctors-loading-panel">
            <LoaderCircle
              className="admin-doctors-spinner"
              size={28}
            />

            <p>Loading doctors…</p>
          </div>
        )}

        {!loading && error && (
          <div className="admin-doctors-error-panel">
            <CircleAlert size={26} />

            <h3>
              Doctor directory could not be
              loaded
            </h3>

            <p>{error}</p>

            <button
              type="button"
              className="admin-doctors-secondary-button"
              onClick={refreshDoctors}
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          doctors.length === 0 && (
            <div className="admin-doctors-empty-panel">
              <Stethoscope size={30} />

              <h3>No doctors found</h3>

              <p>
                Change the search criteria or
                clear the active filters.
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="admin-doctors-secondary-button"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

        {!loading &&
          !error &&
          doctors.length > 0 && (
            <>
              <div className="admin-doctors-table-wrapper">
                <table className="admin-doctors-table">
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Specialization</th>
                      <th>Registration</th>
                      <th>Clinic</th>
                      <th>Verification</th>
                      <th>Account</th>
                      <th>Activity</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>

                  <tbody>
                    {doctors.map((doctor) => (
                      <tr
                        key={
                          doctor.doctorProfileId
                        }
                      >
                        <td data-label="Doctor">
                          <div className="admin-doctors-doctor-cell">
                            <img
                              src={resolveMediaUrl(
                                doctor.profileImageUrl
                              )}
                              alt={
                                doctor.fullName ||
                                "Doctor"
                              }
                              onError={(
                                event
                              ) => {
                                event.currentTarget.src =
                                  defaultDoctorAvatar;
                              }}
                            />

                            <div>
                              <strong>
                                {doctor.fullName}
                              </strong>

                              <span>
                                {doctor.email}
                              </span>

                              <small>
                                {doctor.mobile ||
                                  "Mobile unavailable"}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td data-label="Specialization">
                          <strong className="admin-doctors-primary-value">
                            {doctor.primarySpecialization ||
                              "Not specified"}
                          </strong>

                          <span className="admin-doctors-secondary-value">
                            {doctor.experienceYears !==
                            null
                              ? `${doctor.experienceYears} years experience`
                              : "Experience unavailable"}
                          </span>
                        </td>

                        <td data-label="Registration">
                          <strong className="admin-doctors-code-value">
                            {doctor.registrationNumber ||
                              "Not submitted"}
                          </strong>

                          <span className="admin-doctors-secondary-value">
                            {doctor.councilName ||
                              "Council unavailable"}
                          </span>
                        </td>

                        <td data-label="Clinic">
                          <strong className="admin-doctors-primary-value">
                            {doctor.primaryClinicName ||
                              "No clinic"}
                          </strong>

                          <span className="admin-doctors-secondary-value">
                            {[
                              doctor.area,
                              doctor.city
                            ]
                              .filter(Boolean)
                              .join(", ") ||
                              "Location unavailable"}
                          </span>

                          <small className="admin-doctors-fee-value">
                            {formatCurrency(
                              doctor.consultationFee
                            )}
                          </small>
                        </td>

                        <td data-label="Verification">
                          <span
                            className={`admin-doctors-status-badge ${getVerificationClass(
                              doctor.verificationStatus
                            )}`}
                          >
                            {formatEnumLabel(
                              doctor.verificationStatus
                            )}
                          </span>
                        </td>

                        <td data-label="Account">
                          <span
                            className={`admin-doctors-status-badge ${getAccountClass(
                              doctor.accountStatus
                            )}`}
                          >
                            {formatEnumLabel(
                              doctor.accountStatus
                            )}
                          </span>
                        </td>

                        <td data-label="Activity">
                          <strong className="admin-doctors-primary-value">
                            {doctor.totalPatients ||
                              0}{" "}
                            patients
                          </strong>

                          <span className="admin-doctors-secondary-value">
                            {doctor.totalAppointments ||
                              0}{" "}
                            appointments
                          </span>
                        </td>

                        <td data-label="Action">
                          <button
                            type="button"
                            className="admin-doctors-view-button"
                            onClick={() =>
                              openDoctorDetails(
                                doctor.doctorProfileId
                              )
                            }
                          >
                            <Eye size={17} />
                            View details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <footer className="admin-doctors-pagination">
                <p>
                  Showing{" "}
                  {pagination.totalElements ===
                  0
                    ? 0
                    : pagination.page *
                        pagination.size +
                      1}
                  –
                  {Math.min(
                    (pagination.page + 1) *
                      pagination.size,
                    pagination.totalElements
                  )}{" "}
                  of{" "}
                  {pagination.totalElements}
                </p>

                <div>
                  <button
                    type="button"
                    className="admin-doctors-pagination-button"
                    disabled={
                      pagination.first
                    }
                    onClick={() =>
                      setPage((previous) =>
                        Math.max(
                          previous - 1,
                          0
                        )
                      )
                    }
                  >
                    <ChevronLeft size={17} />
                    Previous
                  </button>

                  <div className="admin-doctors-page-numbers">
                    {renderPageButtons()}
                  </div>

                  <button
                    type="button"
                    className="admin-doctors-pagination-button"
                    disabled={
                      pagination.last ||
                      pagination.totalPages ===
                        0
                    }
                    onClick={() =>
                      setPage((previous) =>
                        Math.min(
                          previous + 1,
                          Math.max(
                            pagination.totalPages -
                              1,
                            0
                          )
                        )
                      )
                    }
                  >
                    Next
                    <ChevronRight
                      size={17}
                    />
                  </button>
                </div>
              </footer>
            </>
          )}
      </section>

      {detailsPortal}
      {actionPortal}
    </div>
  );
};

export default Doctors;