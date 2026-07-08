import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  Archive,
  BadgeCheck,
  Ban,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleOff,
  Clock3,
  Edit3,
  Eye,
  Image as ImageIcon,
  ListChecks,
  Loader2,
  MapPin,
  MoreHorizontal,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Siren,
  Star,
  Trash2,
  X
} from "lucide-react";

import {
  archiveAdminHospital,
  archiveAdminHospitalDepartment,
  archiveAdminHospitalImage,
  createAdminHospital,
  createAdminHospitalDepartment,
  createAdminHospitalImage,
  getAdminHospitalActivity,
  getAdminHospitalAppointments,
  getAdminHospitalById,
  getAdminHospitalFilterOptions,
  getAdminHospitals,
  restoreAdminHospital,
  updateAdminHospital,
  updateAdminHospitalDepartment,
  updateAdminHospitalDepartmentStatus,
  updateAdminHospitalFeatured,
  updateAdminHospitalImage,
  updateAdminHospitalStatus,
  updateAdminHospitalVerification
} from "../../services/adminService";

import "./HospitalsModule.css";

/* =========================================================
   CONSTANTS
========================================================= */

const DEFAULT_FILTERS = {
  search: "",
  verificationStatus: "ALL",
  operationalStatus: "ALL",
  hospitalType: "ALL",
  city: "",
  emergencyAvailable: "ALL",
  featured: "ALL",
  includeArchived: false,
  page: 0,
  size: 10,
  sortBy: "updatedAt",
  sortDirection: "DESC"
};

const EMPTY_HOSPITAL_FORM = {
  hospitalName: "",
  hospitalType: "HOSPITAL",
  registrationNumber: "",
  licenseNumber: "",
  city: "",
  area: "",
  address: "",
  state: "",
  pincode: "",
  hospitalEmail: "",
  phone: "",
  emergencyPhone: "",
  description: "",
  totalBeds: "0",
  availableBeds: "0",
  emergencyAvailable: false,
  imageUrl: "",
  adminNote: ""
};

const EMPTY_DEPARTMENT_FORM = {
  departmentName: "",
  description: "",
  consultationFee: "",
  availableBeds: "",
  active: true
};

const EMPTY_IMAGE_FORM = {
  imageUrl: "",
  altText: "",
  displayOrder: "0",
  primaryImage: false,
  active: true
};

const DEFAULT_FILTER_OPTIONS = {
  hospitalTypes: [],
  verificationStatuses: [],
  operationalStatuses: [],
  cities: []
};

const APPOINTMENT_STATUS_OPTIONS = [
  "ALL",
  "REQUESTED",
  "CONFIRMED",
  "SCHEDULED",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW"
];

const ACTION_CONFIG = {
  UNDER_REVIEW: {
    title: "Move hospital under review",
    description:
      "The hospital will remain unavailable for public activation until verification is completed.",
    confirmLabel: "Move under review",
    reasonRequired: false,
    tone: "neutral"
  },

  VERIFY: {
    title: "Verify hospital",
    description:
      "Confirm that the hospital registration and submitted information have been reviewed.",
    confirmLabel: "Verify hospital",
    reasonRequired: false,
    tone: "positive"
  },

  CHANGES_REQUIRED: {
    title: "Request changes",
    description:
      "Mention the corrections required before the hospital can be verified.",
    confirmLabel: "Request changes",
    reasonRequired: true,
    tone: "warning"
  },

  REJECT: {
    title: "Reject verification",
    description:
      "The rejection reason will be stored in the hospital record and audit history.",
    confirmLabel: "Reject verification",
    reasonRequired: true,
    tone: "danger"
  },

  ACTIVATE: {
    title: "Activate hospital",
    description:
      "The hospital will become visible in the public hospital search and booking flow.",
    confirmLabel: "Activate hospital",
    reasonRequired: false,
    tone: "positive"
  },

  DEACTIVATE: {
    title: "Deactivate hospital",
    description:
      "The hospital will be removed from public discovery until activated again.",
    confirmLabel: "Deactivate hospital",
    reasonRequired: false,
    tone: "warning"
  },

  SOFT_SUSPEND: {
    title: "Soft suspend hospital",
    description:
      "The hospital will be hidden from public operations while historical information remains available.",
    confirmLabel: "Soft suspend",
    reasonRequired: true,
    tone: "warning"
  },

  SUSPEND: {
    title: "Suspend hospital",
    description:
      "Public operations will remain blocked until an administrator changes the status.",
    confirmLabel: "Suspend hospital",
    reasonRequired: true,
    tone: "danger"
  },

  FEATURE: {
    title: "Feature hospital",
    description:
      "The hospital will appear in the public featured-hospitals section.",
    confirmLabel: "Feature hospital",
    reasonRequired: false,
    tone: "positive"
  },

  UNFEATURE: {
    title: "Remove featured status",
    description:
      "The hospital will no longer appear in the featured-hospitals section.",
    confirmLabel: "Remove feature",
    reasonRequired: false,
    tone: "warning"
  },

  ARCHIVE: {
    title: "Archive hospital",
    description:
      "The hospital will be removed from normal administration lists. Active future bookings can block this action.",
    confirmLabel: "Archive hospital",
    reasonRequired: true,
    tone: "danger"
  },

  RESTORE: {
    title: "Restore hospital",
    description:
      "The hospital will return as inactive. Activation must be performed separately.",
    confirmLabel: "Restore hospital",
    reasonRequired: true,
    tone: "positive"
  },

  ACTIVATE_DEPARTMENT: {
    title: "Activate department",
    description:
      "The department will become available in hospital operations.",
    confirmLabel: "Activate department",
    reasonRequired: false,
    tone: "positive"
  },

  DEACTIVATE_DEPARTMENT: {
    title: "Deactivate department",
    description:
      "The department will be unavailable for new hospital requests.",
    confirmLabel: "Deactivate department",
    reasonRequired: false,
    tone: "warning"
  },

  ARCHIVE_DEPARTMENT: {
    title: "Archive department",
    description:
      "Departments with active or future appointment requests cannot be archived.",
    confirmLabel: "Archive department",
    reasonRequired: true,
    tone: "danger"
  },

  SET_PRIMARY_IMAGE: {
    title: "Set primary image",
    description:
      "This image will become the main hospital image used in public and featured listings.",
    confirmLabel: "Set as primary",
    reasonRequired: false,
    tone: "positive"
  },

  ARCHIVE_IMAGE: {
    title: "Archive image",
    description:
      "The image will be removed from the active hospital gallery.",
    confirmLabel: "Archive image",
    reasonRequired: true,
    tone: "danger"
  }
};

/* =========================================================
   UTILITIES
========================================================= */

const humanize = (value) => {
  if (!value) {
    return "—";
  }

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const formatNumber = (value) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return "0";
  }

  return new Intl.NumberFormat("en-IN").format(parsed);
};

const formatCurrency = (value) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(parsed);
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
};

const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

  const date =
    typeof value === "number"
      ? new Date(value)
      : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
};

const formatTime = (value) => {
  if (!value) {
    return "—";
  }

  const match = String(value).match(
    /^(\d{1,2}):(\d{2})/
  );

  if (!match) {
    return String(value);
  }

  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
};

const toBooleanFilter = (value) => {
  if (value === "TRUE") {
    return true;
  }

  if (value === "FALSE") {
    return false;
  }

  return undefined;
};

const toOptionalNumber = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
};

const getErrorMessage = (
  error,
  fallback = "Unable to process the request"
) => {
  const responseData = error?.response?.data;

  if (
    typeof responseData?.message === "string" &&
    responseData.message.trim()
  ) {
    return responseData.message;
  }

  if (
    responseData &&
    typeof responseData === "object"
  ) {
    const validationMessage = Object.values(
      responseData
    ).find(
      (value) =>
        typeof value === "string" &&
        value.trim()
    );

    if (validationMessage) {
      return validationMessage;
    }
  }

  if (
    typeof error?.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallback;
};

const normalizeHospitalForm = (
  hospital = null
) => {
  if (!hospital) {
    return {
      ...EMPTY_HOSPITAL_FORM
    };
  }

  return {
    hospitalName:
      hospital.hospitalName || "",

    hospitalType:
      hospital.hospitalType || "HOSPITAL",

    registrationNumber:
      hospital.registrationNumber || "",

    licenseNumber:
      hospital.licenseNumber || "",

    city:
      hospital.city || "",

    area:
      hospital.area || "",

    address:
      hospital.address || "",

    state:
      hospital.state || "",

    pincode:
      hospital.pincode || "",

    hospitalEmail:
      hospital.hospitalEmail || "",

    phone:
      hospital.phone || "",

    emergencyPhone:
      hospital.emergencyPhone || "",

    description:
      hospital.description || "",

    totalBeds:
      String(hospital.totalBeds ?? 0),

    availableBeds:
      String(hospital.availableBeds ?? 0),

    emergencyAvailable:
      Boolean(hospital.emergencyAvailable),

    imageUrl:
      hospital.imageUrl || "",

    adminNote:
      hospital.adminNote || ""
  };
};

const buildHospitalPayload = (
  form,
  expectedVersion = undefined,
  mode = "create"
) => {
  const payload = {
    hospitalName:
      form.hospitalName.trim(),

    hospitalType:
      form.hospitalType,

    registrationNumber:
      form.registrationNumber.trim() || null,

    licenseNumber:
      form.licenseNumber.trim() || null,

    city:
      form.city.trim(),

    area:
      form.area.trim() || null,

    address:
      form.address.trim() || null,

    state:
      form.state.trim() || null,

    pincode:
      form.pincode.trim() || null,

    hospitalEmail:
      form.hospitalEmail.trim() || null,

    phone:
      form.phone.trim() || null,

    emergencyPhone:
      form.emergencyPhone.trim() || null,

    description:
      form.description.trim() || null,

    totalBeds:
      Number(form.totalBeds),

    availableBeds:
      Number(form.availableBeds),

    emergencyAvailable:
      Boolean(form.emergencyAvailable),

    adminNote:
      form.adminNote.trim() || null
  };

  if (mode === "create") {
    payload.imageUrl =
      form.imageUrl.trim() || null;
  }

  if (mode === "edit") {
    payload.expectedVersion =
      expectedVersion;
  }

  return payload;
};

/* =========================================================
   SMALL COMPONENTS
========================================================= */

const StatusBadge = ({
  value,
  type = "default"
}) => {
  const normalized = String(
    value || "UNKNOWN"
  ).toLowerCase();

  return (
    <span
      className={[
        "ah-status-badge",
        `ah-status-badge--${type}`,
        `is-${normalized}`
      ].join(" ")}
    >
      <span />
      {humanize(value)}
    </span>
  );
};

const LoadingBlock = ({
  label = "Loading..."
}) => (
  <div className="ah-loading-block">
    <Loader2
      size={24}
      className="ah-spin"
    />
    <span>{label}</span>
  </div>
);

const EmptyPanel = ({
  icon,
  title,
  description,
  action
}) => (
  <div className="ah-empty-panel">
    <div className="ah-empty-panel__icon">
      {icon}
    </div>

    <h3>{title}</h3>

    <p>{description}</p>

    {action}
  </div>
);

const StatCard = ({
  icon,
  label,
  value,
  helper,
  tone = "neutral"
}) => (
  <article
    className={`ah-stat-card ah-stat-card--${tone}`}
  >
    <div className="ah-stat-card__icon">
      {icon}
    </div>

    <div className="ah-stat-card__content">
      <span>{label}</span>

      <strong>{formatNumber(value)}</strong>

      {helper && <small>{helper}</small>}
    </div>
  </article>
);

/* =========================================================
   MAIN COMPONENT
========================================================= */

const HospitalsModule = () => {
  const menuRef = useRef(null);
  const searchTimerRef = useRef(null);

  const [filters, setFilters] = useState(
    DEFAULT_FILTERS
  );

  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const [filterOptions, setFilterOptions] =
    useState(DEFAULT_FILTER_OPTIONS);

  const [listState, setListState] = useState({
    loading: true,
    refreshing: false,
    error: "",
    data: null
  });

  const [openMenuId, setOpenMenuId] =
    useState(null);

  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    maxHeight: 250,
    placement: "bottom"
  });

  const [toast, setToast] = useState(null);

  const [detailsDrawer, setDetailsDrawer] =
    useState({
      open: false,
      hospitalId: null
    });

  const [detailsState, setDetailsState] =
    useState({
      loading: false,
      error: "",
      data: null
    });

  const [activeTab, setActiveTab] =
    useState("overview");

  const [
    hospitalFormModal,
    setHospitalFormModal
  ] = useState({
    open: false,
    mode: "create",
    hospital: null
  });

  const [hospitalForm, setHospitalForm] =
    useState(EMPTY_HOSPITAL_FORM);

  const [
    hospitalFormSaving,
    setHospitalFormSaving
  ] = useState(false);

  const [
    hospitalFormError,
    setHospitalFormError
  ] = useState("");

  const [
    departmentModal,
    setDepartmentModal
  ] = useState({
    open: false,
    mode: "create",
    department: null
  });

  const [
    departmentForm,
    setDepartmentForm
  ] = useState(EMPTY_DEPARTMENT_FORM);

  const [
    departmentSaving,
    setDepartmentSaving
  ] = useState(false);

  const [
    departmentFormError,
    setDepartmentFormError
  ] = useState("");

  const [imageModal, setImageModal] =
    useState({
      open: false,
      mode: "create",
      image: null
    });

  const [imageForm, setImageForm] =
    useState(EMPTY_IMAGE_FORM);

  const [imageSaving, setImageSaving] =
    useState(false);

  const [imageFormError, setImageFormError] =
    useState("");

  const [actionModal, setActionModal] =
    useState({
      open: false,
      type: "",
      hospital: null,
      department: null,
      image: null
    });

  const [actionReason, setActionReason] =
    useState("");

  const [actionSaving, setActionSaving] =
    useState(false);

  const [actionError, setActionError] =
    useState("");

  const [featureForm, setFeatureForm] =
    useState({
      priority: "0",
      badge: "",
      redirectUrl: "/hospitals"
    });

  const [
    appointmentState,
    setAppointmentState
  ] = useState({
    loading: false,
    error: "",
    status: "ALL",
    page: 0,
    data: null
  });

  const [activityState, setActivityState] =
    useState({
      loading: false,
      error: "",
      page: 0,
      data: null
    });

  /* =======================================================
     COMPUTED VALUES
  ======================================================= */

  const hospitals =
    listState.data?.content || [];

  const summary =
    listState.data?.summary || {
      totalHospitals: 0,
      activeHospitals: 0,
      pendingVerification: 0,
      suspendedHospitals: 0,
      archivedHospitals: 0,
      totalAppointments: 0,
      pendingAppointments: 0,
      todayAppointments: 0
    };

  const totalPages =
    listState.data?.totalPages || 0;

  const currentPage =
    listState.data?.page ?? filters.page;

  const pageNumbers = useMemo(() => {
    if (totalPages <= 1) {
      return [];
    }

    const start = Math.max(
      0,
      currentPage - 2
    );

    const end = Math.min(
      totalPages - 1,
      start + 4
    );

    const adjustedStart = Math.max(
      0,
      end - 4
    );

    const result = [];

    for (
      let page = adjustedStart;
      page <= end;
      page += 1
    ) {
      result.push(page);
    }

    return result;
  }, [currentPage, totalPages]);

  /* =======================================================
     TOAST
  ======================================================= */

  const showToast = useCallback(
    (
      message,
      type = "success"
    ) => {
      setToast({
        message,
        type
      });
    },
    []
  );

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toast]);

 useEffect(() => {
  if (openMenuId === null) {
    return undefined;
  }

  const handleResize = () => {
    setOpenMenuId(null);
  };

  const handleOutsideScroll = (event) => {
    const scrollTarget = event.target;

    /*
     * Dropdown ke andar scroll ho raha hai toh
     * menu close nahi karna.
     */
    if (
      menuRef.current &&
      (
        scrollTarget === menuRef.current ||
        menuRef.current.contains(scrollTarget)
      )
    ) {
      return;
    }

    /*
     * Page, table ya kisi outside container ko
     * scroll kiya toh menu close karna.
     */
    setOpenMenuId(null);
  };

  window.addEventListener(
    "resize",
    handleResize
  );

  window.addEventListener(
    "scroll",
    handleOutsideScroll,
    true
  );

  return () => {
    window.removeEventListener(
      "resize",
      handleResize
    );

    window.removeEventListener(
      "scroll",
      handleOutsideScroll,
      true
    );
  };
}, [openMenuId]);
  /* =======================================================
     SEARCH DEBOUNCE
  ======================================================= */

  useEffect(() => {
    if (searchTimerRef.current) {
      window.clearTimeout(
        searchTimerRef.current
      );
    }

    searchTimerRef.current =
      window.setTimeout(() => {
        setDebouncedSearch(
          filters.search.trim()
        );
      }, 400);

    return () => {
      if (searchTimerRef.current) {
        window.clearTimeout(
          searchTimerRef.current
        );
      }
    };
  }, [filters.search]);

  /* =======================================================
     FILTER OPTIONS
  ======================================================= */

  const loadFilterOptions =
    useCallback(async () => {
      try {
        const response =
          await getAdminHospitalFilterOptions();

        setFilterOptions({
          hospitalTypes:
            response?.hospitalTypes || [],

          verificationStatuses:
            response?.verificationStatuses || [],

          operationalStatuses:
            response?.operationalStatuses || [],

          cities:
            response?.cities || []
        });
      } catch (error) {
        console.error(
          "Hospital filter options failed:",
          error
        );
      }
    }, []);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  /* =======================================================
     LIST API
  ======================================================= */

  const loadHospitals = useCallback(
    async ({
      silent = false
    } = {}) => {
      setListState((current) => ({
        ...current,
        loading:
          !silent && !current.data,
        refreshing:
          silent || Boolean(current.data),
        error: ""
      }));

      try {
        const response =
          await getAdminHospitals({
            ...filters,

            search:
              debouncedSearch,

            emergencyAvailable:
              toBooleanFilter(
                filters.emergencyAvailable
              ),

            featured:
              toBooleanFilter(
                filters.featured
              )
          });

        setListState({
          loading: false,
          refreshing: false,
          error: "",
          data: response
        });
      } catch (error) {
        setListState((current) => ({
          ...current,
          loading: false,
          refreshing: false,
          error: getErrorMessage(
            error,
            "Unable to load hospitals"
          )
        }));
      }
    },
    [
      filters,
      debouncedSearch
    ]
  );

  useEffect(() => {
    loadHospitals();
  }, [loadHospitals]);

  /* =======================================================
     DETAILS API
  ======================================================= */

  const loadHospitalDetails =
    useCallback(
      async (
        hospitalId,
        {
          silent = false
        } = {}
      ) => {
        if (!hospitalId) {
          return null;
        }

        setDetailsState((current) => ({
          ...current,
          loading:
            !silent || !current.data,
          error: ""
        }));

        try {
          const response =
            await getAdminHospitalById(
              hospitalId
            );

          setDetailsState({
            loading: false,
            error: "",
            data: response
          });

          return response;
        } catch (error) {
          const message = getErrorMessage(
            error,
            "Unable to load hospital details"
          );

          setDetailsState((current) => ({
            ...current,
            loading: false,
            error: message
          }));

          return null;
        }
      },
      []
    );

  const openHospitalDetails =
    useCallback(
      async (
        hospitalId,
        tab = "overview"
      ) => {
        setOpenMenuId(null);

        setActiveTab(tab);

        setDetailsDrawer({
          open: true,
          hospitalId
        });

        setAppointmentState({
          loading: false,
          error: "",
          status: "ALL",
          page: 0,
          data: null
        });

        setActivityState({
          loading: false,
          error: "",
          page: 0,
          data: null
        });

        await loadHospitalDetails(
          hospitalId
        );
      },
      [loadHospitalDetails]
    );

  const closeDetailsDrawer =
    useCallback(() => {
      setDetailsDrawer({
        open: false,
        hospitalId: null
      });

      setDetailsState({
        loading: false,
        error: "",
        data: null
      });

      setActiveTab("overview");
    }, []);

  /* =======================================================
     APPOINTMENTS
  ======================================================= */

  const loadAppointments =
    useCallback(
      async ({
        status =
        appointmentState.status,
        page =
        appointmentState.page
      } = {}) => {
        const hospitalId =
          detailsDrawer.hospitalId;

        if (!hospitalId) {
          return;
        }

        setAppointmentState(
          (current) => ({
            ...current,
            loading: true,
            error: "",
            status,
            page
          })
        );

        try {
          const response =
            await getAdminHospitalAppointments(
              hospitalId,
              {
                status,
                page,
                size: 10,
                sortBy: "createdAt",
                sortDirection: "DESC"
              }
            );

          setAppointmentState({
            loading: false,
            error: "",
            status,
            page,
            data: response
          });
        } catch (error) {
          setAppointmentState(
            (current) => ({
              ...current,
              loading: false,
              error: getErrorMessage(
                error,
                "Unable to load hospital appointments"
              )
            })
          );
        }
      },
      [
        appointmentState.status,
        appointmentState.page,
        detailsDrawer.hospitalId
      ]
    );

  useEffect(() => {
    if (
      activeTab === "appointments" &&
      detailsDrawer.open &&
      !appointmentState.data &&
      !appointmentState.loading
    ) {
      loadAppointments({
        status: "ALL",
        page: 0
      });
    }
  }, [
    activeTab,
    detailsDrawer.open,
    appointmentState.data,
    appointmentState.loading,
    loadAppointments
  ]);

  /* =======================================================
     ACTIVITY
  ======================================================= */

  const loadActivity = useCallback(
    async ({
      page = activityState.page
    } = {}) => {
      const hospitalId =
        detailsDrawer.hospitalId;

      if (!hospitalId) {
        return;
      }

      setActivityState((current) => ({
        ...current,
        loading: true,
        error: "",
        page
      }));

      try {
        const response =
          await getAdminHospitalActivity(
            hospitalId,
            {
              page,
              size: 20
            }
          );

        setActivityState({
          loading: false,
          error: "",
          page,
          data: response
        });
      } catch (error) {
        setActivityState((current) => ({
          ...current,
          loading: false,
          error: getErrorMessage(
            error,
            "Unable to load hospital activity"
          )
        }));
      }
    },
    [
      activityState.page,
      detailsDrawer.hospitalId
    ]
  );

  useEffect(() => {
    if (
      activeTab === "activity" &&
      detailsDrawer.open &&
      !activityState.data &&
      !activityState.loading
    ) {
      loadActivity({
        page: 0
      });
    }
  }, [
    activeTab,
    detailsDrawer.open,
    activityState.data,
    activityState.loading,
    loadActivity
  ]);

  /* =======================================================
     FILTER HANDLERS
  ======================================================= */

  const updateFilter = (
    field,
    value
  ) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
      page:
        field === "page"
          ? value
          : 0
    }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setDebouncedSearch("");
  };

  /* =======================================================
     HOSPITAL FORM
  ======================================================= */

  const openCreateHospital = () => {
    setHospitalFormModal({
      open: true,
      mode: "create",
      hospital: null
    });

    setHospitalForm({
      ...EMPTY_HOSPITAL_FORM
    });

    setHospitalFormError("");
  };

  const openEditHospital = async (
    hospital
  ) => {
    setOpenMenuId(null);

    let fullHospital =
      detailsState.data?.id ===
        hospital.id
        ? detailsState.data
        : null;

    if (!fullHospital) {
      fullHospital =
        await loadHospitalDetails(
          hospital.id
        );
    }

    if (!fullHospital) {
      return;
    }

    setHospitalFormModal({
      open: true,
      mode: "edit",
      hospital: fullHospital
    });

    setHospitalForm(
      normalizeHospitalForm(
        fullHospital
      )
    );

    setHospitalFormError("");
  };

  const closeHospitalForm = () => {
    if (hospitalFormSaving) {
      return;
    }

    setHospitalFormModal({
      open: false,
      mode: "create",
      hospital: null
    });

    setHospitalFormError("");
  };

  const submitHospitalForm =
    async (event) => {
      event.preventDefault();

      setHospitalFormError("");

      const totalBeds = Number(
        hospitalForm.totalBeds
      );

      const availableBeds = Number(
        hospitalForm.availableBeds
      );

      if (
        !hospitalForm.hospitalName.trim()
      ) {
        setHospitalFormError(
          "Hospital name is required"
        );
        return;
      }

      if (!hospitalForm.city.trim()) {
        setHospitalFormError(
          "City is required"
        );
        return;
      }

      if (
        !Number.isFinite(totalBeds) ||
        totalBeds < 0
      ) {
        setHospitalFormError(
          "Total beds must be zero or greater"
        );
        return;
      }

      if (
        !Number.isFinite(availableBeds) ||
        availableBeds < 0
      ) {
        setHospitalFormError(
          "Available beds must be zero or greater"
        );
        return;
      }

      if (availableBeds > totalBeds) {
        setHospitalFormError(
          "Available beds cannot exceed total beds"
        );
        return;
      }

      setHospitalFormSaving(true);

      try {
        let response;

        if (
          hospitalFormModal.mode ===
          "create"
        ) {
          response =
            await createAdminHospital(
              buildHospitalPayload(
                hospitalForm,
                undefined,
                "create"
              )
            );

          showToast(
            "Hospital created successfully"
          );
        } else {
          response =
            await updateAdminHospital(
              hospitalFormModal.hospital.id,
              buildHospitalPayload(
                hospitalForm,
                hospitalFormModal
                  .hospital.version,
                "edit"
              )
            );

          showToast(
            "Hospital updated successfully"
          );
        }

        setHospitalFormModal({
          open: false,
          mode: "create",
          hospital: null
        });

        await loadHospitals({
          silent: true
        });

        if (
          detailsDrawer.open &&
          response?.id ===
          detailsDrawer.hospitalId
        ) {
          await loadHospitalDetails(
            response.id,
            {
              silent: true
            }
          );
        }
      } catch (error) {
        const message =
          getErrorMessage(
            error,
            "Unable to save hospital"
          );

        setHospitalFormError(message);

        if (
          error?.response?.status === 409 &&
          hospitalFormModal.mode ===
          "edit"
        ) {
          showToast(
            "Hospital data changed. Reload details before editing again.",
            "error"
          );
        }
      } finally {
        setHospitalFormSaving(false);
      }
    };

  /* =======================================================
     DEPARTMENT FORM
  ======================================================= */

  const openCreateDepartment = () => {
    setDepartmentModal({
      open: true,
      mode: "create",
      department: null
    });

    setDepartmentForm({
      ...EMPTY_DEPARTMENT_FORM
    });

    setDepartmentFormError("");
  };

  const openEditDepartment = (
    department
  ) => {
    setDepartmentModal({
      open: true,
      mode: "edit",
      department
    });

    setDepartmentForm({
      departmentName:
        department.departmentName || "",

      description:
        department.description || "",

      consultationFee:
        department.consultationFee ??
        "",

      availableBeds:
        department.availableBeds ?? "",

      active:
        Boolean(department.active)
    });

    setDepartmentFormError("");
  };

  const closeDepartmentModal = () => {
    if (departmentSaving) {
      return;
    }

    setDepartmentModal({
      open: false,
      mode: "create",
      department: null
    });

    setDepartmentFormError("");
  };

  const submitDepartmentForm =
    async (event) => {
      event.preventDefault();

      const hospital =
        detailsState.data;

      if (!hospital?.id) {
        setDepartmentFormError(
          "Hospital details are unavailable"
        );
        return;
      }

      if (
        !departmentForm.departmentName.trim()
      ) {
        setDepartmentFormError(
          "Department name is required"
        );
        return;
      }

      setDepartmentSaving(true);
      setDepartmentFormError("");

      try {
        const payload = {
          departmentName:
            departmentForm.departmentName.trim(),

          description:
            departmentForm.description.trim() ||
            null,

          consultationFee:
            toOptionalNumber(
              departmentForm.consultationFee
            ),

          availableBeds:
            toOptionalNumber(
              departmentForm.availableBeds
            )
        };

        if (
          departmentModal.mode ===
          "create"
        ) {
          payload.active =
            Boolean(
              departmentForm.active
            );

          await createAdminHospitalDepartment(
            hospital.id,
            payload
          );

          showToast(
            "Department created successfully"
          );
        } else {
          payload.expectedVersion =
            departmentModal.department.version;

          await updateAdminHospitalDepartment(
            hospital.id,
            departmentModal.department.id,
            payload
          );

          showToast(
            "Department updated successfully"
          );
        }

        setDepartmentModal({
          open: false,
          mode: "create",
          department: null
        });

        await loadHospitalDetails(
          hospital.id,
          {
            silent: true
          }
        );

        await loadHospitals({
          silent: true
        });
      } catch (error) {
        setDepartmentFormError(
          getErrorMessage(
            error,
            "Unable to save department"
          )
        );
      } finally {
        setDepartmentSaving(false);
      }
    };

  /* =======================================================
     IMAGE FORM
  ======================================================= */

  const openCreateImage = () => {
    setImageModal({
      open: true,
      mode: "create",
      image: null
    });

    setImageForm({
      ...EMPTY_IMAGE_FORM
    });

    setImageFormError("");
  };

  const openEditImage = (image) => {
    setImageModal({
      open: true,
      mode: "edit",
      image
    });

    setImageForm({
      imageUrl:
        image.imageUrl || "",

      altText:
        image.altText || "",

      displayOrder:
        String(
          image.displayOrder ?? 0
        ),

      primaryImage:
        Boolean(
          image.primaryImage
        ),

      active:
        Boolean(image.active)
    });

    setImageFormError("");
  };

  const closeImageModal = () => {
    if (imageSaving) {
      return;
    }

    setImageModal({
      open: false,
      mode: "create",
      image: null
    });

    setImageFormError("");
  };

  const submitImageForm =
    async (event) => {
      event.preventDefault();

      const hospital =
        detailsState.data;

      if (!hospital?.id) {
        setImageFormError(
          "Hospital details are unavailable"
        );
        return;
      }

      if (!imageForm.imageUrl.trim()) {
        setImageFormError(
          "Image URL is required"
        );
        return;
      }

      setImageSaving(true);
      setImageFormError("");

      try {
        const payload = {
          imageUrl:
            imageForm.imageUrl.trim(),

          altText:
            imageForm.altText.trim() ||
            null,

          displayOrder:
            Number(
              imageForm.displayOrder || 0
            ),

          primaryImage:
            Boolean(
              imageForm.primaryImage
            ),

          active:
            Boolean(imageForm.active)
        };

        if (
          imageModal.mode === "create"
        ) {
          await createAdminHospitalImage(
            hospital.id,
            payload
          );

          showToast(
            "Hospital image added successfully"
          );
        } else {
          payload.expectedVersion =
            imageModal.image.version;

          await updateAdminHospitalImage(
            hospital.id,
            imageModal.image.id,
            payload
          );

          showToast(
            "Hospital image updated successfully"
          );
        }

        setImageModal({
          open: false,
          mode: "create",
          image: null
        });

        await loadHospitalDetails(
          hospital.id,
          {
            silent: true
          }
        );

        await loadHospitals({
          silent: true
        });
      } catch (error) {
        setImageFormError(
          getErrorMessage(
            error,
            "Unable to save hospital image"
          )
        );
      } finally {
        setImageSaving(false);
      }
    };

  /* =======================================================
     ACTION MODAL
  ======================================================= */

  const openActionModal = ({
    type,
    hospital,
    department = null,
    image = null
  }) => {
    setOpenMenuId(null);

    setActionModal({
      open: true,
      type,
      hospital,
      department,
      image
    });

    setActionReason("");
    setActionError("");

    if (type === "FEATURE") {
      setFeatureForm({
        priority: String(
          hospital?.featured
            ?.priority ?? 0
        ),

        badge:
          hospital?.featured?.badge ||
          "",

        redirectUrl:
          hospital?.featured
            ?.redirectUrl ||
          "/hospitals"
      });
    }
  };

  const closeActionModal = () => {
    if (actionSaving) {
      return;
    }

    setActionModal({
      open: false,
      type: "",
      hospital: null,
      department: null,
      image: null
    });

    setActionReason("");
    setActionError("");
  };

  const refreshAfterAction =
    useCallback(
      async (
        hospitalId
      ) => {
        await loadHospitals({
          silent: true
        });

        if (
          detailsDrawer.open &&
          detailsDrawer.hospitalId ===
          hospitalId
        ) {
          await loadHospitalDetails(
            hospitalId,
            {
              silent: true
            }
          );

          if (
            activeTab === "activity"
          ) {
            await loadActivity({
              page: 0
            });
          }
        }
      },
      [
        activeTab,
        detailsDrawer.open,
        detailsDrawer.hospitalId,
        loadActivity,
        loadHospitalDetails,
        loadHospitals
      ]
    );

  const confirmAction = async () => {
    const config =
      ACTION_CONFIG[actionModal.type];

    if (!config) {
      return;
    }

    const reason =
      actionReason.trim();

    if (
      config.reasonRequired &&
      !reason
    ) {
      setActionError(
        "Reason is required for this action"
      );
      return;
    }

    const hospital =
      actionModal.hospital;

    if (!hospital?.id) {
      setActionError(
        "Hospital information is unavailable"
      );
      return;
    }

    setActionSaving(true);
    setActionError("");

    try {
      let responseMessage =
        "Action completed successfully";

      switch (actionModal.type) {
        case "UNDER_REVIEW":
          await updateAdminHospitalVerification(
            hospital.id,
            {
              status:
                "UNDER_REVIEW",

              reason:
                reason || null,

              expectedVersion:
                hospital.version
            }
          );

          responseMessage =
            "Hospital moved under review";
          break;

        case "VERIFY":
          await updateAdminHospitalVerification(
            hospital.id,
            {
              status: "VERIFIED",

              reason:
                reason || null,

              expectedVersion:
                hospital.version
            }
          );

          responseMessage =
            "Hospital verified successfully";
          break;

        case "CHANGES_REQUIRED":
          await updateAdminHospitalVerification(
            hospital.id,
            {
              status:
                "CHANGES_REQUIRED",

              reason,

              expectedVersion:
                hospital.version
            }
          );

          responseMessage =
            "Changes requested successfully";
          break;

        case "REJECT":
          await updateAdminHospitalVerification(
            hospital.id,
            {
              status: "REJECTED",
              reason,

              expectedVersion:
                hospital.version
            }
          );

          responseMessage =
            "Hospital verification rejected";
          break;

        case "ACTIVATE":
          await updateAdminHospitalStatus(
            hospital.id,
            {
              status: "ACTIVE",

              reason:
                reason || null,

              expectedVersion:
                hospital.version
            }
          );

          responseMessage =
            "Hospital activated successfully";
          break;

        case "DEACTIVATE":
          await updateAdminHospitalStatus(
            hospital.id,
            {
              status: "INACTIVE",

              reason:
                reason || null,

              expectedVersion:
                hospital.version
            }
          );

          responseMessage =
            "Hospital deactivated successfully";
          break;

        case "SOFT_SUSPEND":
          await updateAdminHospitalStatus(
            hospital.id,
            {
              status:
                "SOFT_SUSPENDED",

              reason,

              expectedVersion:
                hospital.version
            }
          );

          responseMessage =
            "Hospital soft suspended";
          break;

        case "SUSPEND":
          await updateAdminHospitalStatus(
            hospital.id,
            {
              status: "SUSPENDED",
              reason,

              expectedVersion:
                hospital.version
            }
          );

          responseMessage =
            "Hospital suspended successfully";
          break;

        case "FEATURE":
          await updateAdminHospitalFeatured(
            hospital.id,
            {
              featured: true,

              priority:
                Number(
                  featureForm.priority ||
                  0
                ),

              badge:
                featureForm.badge.trim() ||
                null,

              redirectUrl:
                featureForm.redirectUrl.trim() ||
                "/hospitals",

              expectedVersion:
                hospital.version
            }
          );

          responseMessage =
            "Hospital featured successfully";
          break;

        case "UNFEATURE":
          await updateAdminHospitalFeatured(
            hospital.id,
            {
              featured: false,
              priority: 0,
              badge: null,
              redirectUrl: null,

              expectedVersion:
                hospital.version
            }
          );

          responseMessage =
            "Hospital removed from featured list";
          break;

        case "ARCHIVE":
          await archiveAdminHospital(
            hospital.id,
            {
              reason,

              expectedVersion:
                hospital.version
            }
          );

          responseMessage =
            "Hospital archived successfully";
          break;

        case "RESTORE":
          await restoreAdminHospital(
            hospital.id,
            {
              reason,

              expectedVersion:
                hospital.version
            }
          );

          responseMessage =
            "Hospital restored successfully";
          break;

        case "ACTIVATE_DEPARTMENT":
        case "DEACTIVATE_DEPARTMENT": {
          const department =
            actionModal.department;

          if (!department?.id) {
            throw new Error(
              "Department information is unavailable"
            );
          }

          const active =
            actionModal.type ===
            "ACTIVATE_DEPARTMENT";

          await updateAdminHospitalDepartmentStatus(
            hospital.id,
            department.id,
            {
              active,

              reason:
                reason || null,

              expectedVersion:
                department.version
            }
          );

          responseMessage = active
            ? "Department activated successfully"
            : "Department deactivated successfully";

          break;
        }

        case "ARCHIVE_DEPARTMENT": {
          const department =
            actionModal.department;

          if (!department?.id) {
            throw new Error(
              "Department information is unavailable"
            );
          }

          await archiveAdminHospitalDepartment(
            hospital.id,
            department.id,
            {
              reason,

              expectedVersion:
                department.version
            }
          );

          responseMessage =
            "Department archived successfully";
          break;
        }

        case "SET_PRIMARY_IMAGE": {
          const image =
            actionModal.image;

          if (!image?.id) {
            throw new Error(
              "Image information is unavailable"
            );
          }

          await updateAdminHospitalImage(
            hospital.id,
            image.id,
            {
              expectedVersion:
                image.version,

              imageUrl:
                image.imageUrl,

              altText:
                image.altText || null,

              displayOrder:
                image.displayOrder ?? 0,

              primaryImage: true,

              active: true
            }
          );

          responseMessage =
            "Primary image updated successfully";
          break;
        }

        case "ARCHIVE_IMAGE": {
          const image =
            actionModal.image;

          if (!image?.id) {
            throw new Error(
              "Image information is unavailable"
            );
          }

          await archiveAdminHospitalImage(
            hospital.id,
            image.id,
            {
              reason,

              expectedVersion:
                image.version
            }
          );

          responseMessage =
            "Hospital image archived successfully";
          break;
        }

        default:
          throw new Error(
            "Unsupported hospital action"
          );
      }

      showToast(responseMessage);

      closeActionModal();

      await refreshAfterAction(
        hospital.id
      );
    } catch (error) {
      const message =
        getErrorMessage(
          error,
          "Unable to complete action"
        );

      setActionError(message);

      if (
        error?.response?.status === 409
      ) {
        showToast(
          "Data changed on the server. Reload the latest hospital details.",
          "error"
        );

        await refreshAfterAction(
          hospital.id
        );
      }
    } finally {
      setActionSaving(false);
    }
  };

  /* =======================================================
     GLOBAL EVENTS
  ======================================================= */

  useEffect(() => {
    const handleDocumentClick = (
      event
    ) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target
        )
      ) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handleDocumentClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleDocumentClick
      );
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      if (actionModal.open) {
        closeActionModal();
        return;
      }

      if (imageModal.open) {
        closeImageModal();
        return;
      }

      if (departmentModal.open) {
        closeDepartmentModal();
        return;
      }

      if (hospitalFormModal.open) {
        closeHospitalForm();
        return;
      }

      if (detailsDrawer.open) {
        closeDetailsDrawer();
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
  });

  useEffect(() => {
    const modalOpen =
      detailsDrawer.open ||
      hospitalFormModal.open ||
      departmentModal.open ||
      imageModal.open ||
      actionModal.open;

    if (!modalOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    detailsDrawer.open,
    hospitalFormModal.open,
    departmentModal.open,
    imageModal.open,
    actionModal.open
  ]);

  /* =======================================================
     RENDER HELPERS
  ======================================================= */

  const renderHospitalMenu = (hospital) => {
    const isVerified =
      hospital.verificationStatus === "VERIFIED";

    const isActive =
      hospital.operationalStatus === "ACTIVE";

    const isArchived =
      Boolean(hospital.archived);

    const handleMenuToggle = (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (openMenuId === hospital.id) {
        setOpenMenuId(null);
        return;
      }

      const buttonRect =
        event.currentTarget.getBoundingClientRect();

      const menuWidth = 220;
      const menuGap = 8;
      const viewportPadding = 12;
      const preferredMenuHeight = 250;
      const minimumUsableHeight = 170;

      const availableBelow =
        window.innerHeight -
        buttonRect.bottom -
        viewportPadding -
        menuGap;

      const availableAbove =
        buttonRect.top -
        viewportPadding -
        menuGap;

      /*
       * Neeche reasonable space hai toh menu neeche hi open hoga.
       * Kam space hone par internal scroll aayega.
       * Sirf bahut kam space hone par upar open hoga.
       */
      const openBelow =
        availableBelow >= minimumUsableHeight ||
        availableBelow >= availableAbove;

      const availableHeight = openBelow
        ? availableBelow
        : availableAbove;

      const maxHeight = Math.max(
        140,
        Math.min(
          preferredMenuHeight,
          availableHeight
        )
      );

      let top = openBelow
        ? buttonRect.bottom + menuGap
        : buttonRect.top - menuGap - maxHeight;

      top = Math.max(
        viewportPadding,
        Math.min(
          top,
          window.innerHeight -
          maxHeight -
          viewportPadding
        )
      );

      let left =
        buttonRect.right - menuWidth;

      left = Math.max(
        viewportPadding,
        Math.min(
          left,
          window.innerWidth -
          menuWidth -
          viewportPadding
        )
      );

      setMenuPosition({
        top,
        left,
        maxHeight,
        placement: openBelow
          ? "bottom"
          : "top"
      });

      setOpenMenuId(hospital.id);
    };

    const closeMenu = () => {
      setOpenMenuId(null);
    };

    return (
      <div className="ah-row-menu">
        <button
          type="button"
          className="ah-icon-btn"
          aria-label="Hospital actions"
          title="Hospital actions"
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
          onClick={handleMenuToggle}
        >
          <MoreHorizontal size={18} />
        </button>

        {openMenuId === hospital.id &&
          createPortal(
            <div
              ref={menuRef}
              className={`ah-row-menu__dropdown ah-row-menu__dropdown--${menuPosition.placement}`}
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
                maxHeight: `${menuPosition.maxHeight}px`
              }}
              onMouseDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <button
                type="button"
                onClick={() => {
                  closeMenu();

                  openHospitalDetails(
                    hospital.id
                  );
                }}
              >
                <Eye size={16} />
                View details
              </button>

              <button
                type="button"
                onClick={() => {
                  closeMenu();

                  openEditHospital(
                    hospital
                  );
                }}
              >
                <Edit3 size={16} />
                Edit hospital
              </button>

              {!isArchived &&
                !isVerified && (
                  <>
                    <div className="ah-row-menu__divider" />

                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();

                        openActionModal({
                          type: "VERIFY",
                          hospital
                        });
                      }}
                    >
                      <BadgeCheck size={16} />
                      Verify
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();

                        openActionModal({
                          type: "UNDER_REVIEW",
                          hospital
                        });
                      }}
                    >
                      <Clock3 size={16} />
                      Under review
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();

                        openActionModal({
                          type: "CHANGES_REQUIRED",
                          hospital
                        });
                      }}
                    >
                      <ListChecks size={16} />
                      Request changes
                    </button>

                    <button
                      type="button"
                      className="is-danger"
                      onClick={() => {
                        closeMenu();

                        openActionModal({
                          type: "REJECT",
                          hospital
                        });
                      }}
                    >
                      <CircleOff size={16} />
                      Reject verification
                    </button>
                  </>
                )}

              {!isArchived &&
                isVerified && (
                  <>
                    <div className="ah-row-menu__divider" />

                    {!isActive ? (
                      <button
                        type="button"
                        onClick={() => {
                          closeMenu();

                          openActionModal({
                            type: "ACTIVATE",
                            hospital
                          });
                        }}
                      >
                        <CheckCircle2 size={16} />
                        Activate
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          closeMenu();

                          openActionModal({
                            type: "DEACTIVATE",
                            hospital
                          });
                        }}
                      >
                        <CircleOff size={16} />
                        Deactivate
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();

                        openActionModal({
                          type: "SOFT_SUSPEND",
                          hospital
                        });
                      }}
                    >
                      <Clock3 size={16} />
                      Soft suspend
                    </button>

                    <button
                      type="button"
                      className="is-danger"
                      onClick={() => {
                        closeMenu();

                        openActionModal({
                          type: "SUSPEND",
                          hospital
                        });
                      }}
                    >
                      <Ban size={16} />
                      Suspend
                    </button>
                  </>
                )}

              {!isArchived && (
                <>
                  <div className="ah-row-menu__divider" />

                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();

                      openActionModal({
                        type: hospital.featured
                          ? "UNFEATURE"
                          : "FEATURE",
                        hospital
                      });
                    }}
                  >
                    <Star size={16} />

                    {hospital.featured
                      ? "Remove feature"
                      : "Feature hospital"}
                  </button>
                </>
              )}

              <div className="ah-row-menu__divider" />

              {isArchived ? (
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();

                    openActionModal({
                      type: "RESTORE",
                      hospital
                    });
                  }}
                >
                  <RefreshCw size={16} />
                  Restore hospital
                </button>
              ) : (
                <button
                  type="button"
                  className="is-danger"
                  onClick={() => {
                    closeMenu();

                    openActionModal({
                      type: "ARCHIVE",
                      hospital
                    });
                  }}
                >
                  <Archive size={16} />
                  Archive hospital
                </button>
              )}
            </div>,
            document.body
          )}
      </div>
    );
  };

  /* =======================================================
     MAIN JSX
  ======================================================= */

  return (
    <div className="admin-hospitals-page">
      {toast && (
        <div
          className={`ah-toast ah-toast--${toast.type}`}
          role="status"
        >
          {toast.type === "error" ? (
            <Ban size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}

          <span>{toast.message}</span>

          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <section className="ah-page-header">
        <div className="ah-page-header__content">
          <span className="ah-page-header__eyebrow">
            Healthcare network
          </span>

          <h1>Hospital Management</h1>

          <p>
            Manage hospital verification, public
            availability, capacity, departments, images,
            appointments and administrative history.
          </p>
        </div>

        <div className="ah-page-header__actions">
          <button
            type="button"
            className="ah-btn ah-btn--secondary"
            onClick={() =>
              loadHospitals({
                silent: true
              })
            }
            disabled={listState.refreshing}
          >
            <RefreshCw
              size={17}
              className={
                listState.refreshing
                  ? "ah-spin"
                  : ""
              }
            />
            Refresh
          </button>

          <button
            type="button"
            className="ah-btn ah-btn--primary"
            onClick={openCreateHospital}
          >
            <Plus size={17} />
            Add Hospital
          </button>
        </div>
      </section>

      {/* ===================================================
          STATS
      =================================================== */}

      <section className="ah-stats-grid">
        <StatCard
          icon={<Building2 size={21} />}
          label="Total hospitals"
          value={summary.totalHospitals}
          helper="Non-archived records"
          tone="neutral"
        />

        <StatCard
          icon={<CheckCircle2 size={21} />}
          label="Active hospitals"
          value={summary.activeHospitals}
          helper="Visible to patients"
          tone="success"
        />

        <StatCard
          icon={<Clock3 size={21} />}
          label="Pending verification"
          value={summary.pendingVerification}
          helper="Needs admin review"
          tone="warning"
        />

        <StatCard
          icon={<Ban size={21} />}
          label="Suspended"
          value={summary.suspendedHospitals}
          helper="Soft and full suspension"
          tone="danger"
        />

        <StatCard
          icon={<CalendarDays size={21} />}
          label="Appointments"
          value={summary.totalAppointments}
          helper={`${formatNumber(
            summary.pendingAppointments
          )} pending`}
          tone="neutral"
        />

        <StatCard
          icon={<Archive size={21} />}
          label="Archived"
          value={summary.archivedHospitals}
          helper="Historical hospital records"
          tone="neutral"
        />
      </section>

      {/* ===================================================
          FILTERS
      =================================================== */}

      <section className="ah-filter-card">
        <div className="ah-filter-card__top">
          <div className="ah-filter-search">
            <Search size={18} />

            <input
              type="search"
              value={filters.search}
              placeholder="Search hospital, city, email, phone or registration..."
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
                onClick={() =>
                  updateFilter(
                    "search",
                    ""
                  )
                }
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="ah-btn ah-btn--ghost"
            onClick={resetFilters}
          >
            <RotateCcw size={16} />
            Reset filters
          </button>
        </div>

        <div className="ah-filter-grid">
          <label className="ah-select-field">
            <span>Verification</span>

            <div>
              <select
                value={
                  filters.verificationStatus
                }
                onChange={(event) =>
                  updateFilter(
                    "verificationStatus",
                    event.target.value
                  )
                }
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
                      {humanize(status)}
                    </option>
                  )
                )}
              </select>

              <ChevronDown size={15} />
            </div>
          </label>

          <label className="ah-select-field">
            <span>Operational status</span>

            <div>
              <select
                value={
                  filters.operationalStatus
                }
                onChange={(event) =>
                  updateFilter(
                    "operationalStatus",
                    event.target.value
                  )
                }
              >
                <option value="ALL">
                  All operational statuses
                </option>

                {filterOptions.operationalStatuses.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {humanize(status)}
                    </option>
                  )
                )}
              </select>

              <ChevronDown size={15} />
            </div>
          </label>

          <label className="ah-select-field">
            <span>Hospital type</span>

            <div>
              <select
                value={filters.hospitalType}
                onChange={(event) =>
                  updateFilter(
                    "hospitalType",
                    event.target.value
                  )
                }
              >
                <option value="ALL">
                  All hospital types
                </option>

                {filterOptions.hospitalTypes.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {humanize(type)}
                    </option>
                  )
                )}
              </select>

              <ChevronDown size={15} />
            </div>
          </label>

          <label className="ah-select-field">
            <span>City</span>

            <div>
              <select
                value={filters.city}
                onChange={(event) =>
                  updateFilter(
                    "city",
                    event.target.value
                  )
                }
              >
                <option value="">
                  All cities
                </option>

                {filterOptions.cities.map(
                  (city) => (
                    <option
                      key={city}
                      value={city}
                    >
                      {city}
                    </option>
                  )
                )}
              </select>

              <ChevronDown size={15} />
            </div>
          </label>

          <label className="ah-select-field">
            <span>Emergency care</span>

            <div>
              <select
                value={
                  filters.emergencyAvailable
                }
                onChange={(event) =>
                  updateFilter(
                    "emergencyAvailable",
                    event.target.value
                  )
                }
              >
                <option value="ALL">
                  All hospitals
                </option>

                <option value="TRUE">
                  Emergency available
                </option>

                <option value="FALSE">
                  No emergency care
                </option>
              </select>

              <ChevronDown size={15} />
            </div>
          </label>

          <label className="ah-select-field">
            <span>Featured</span>

            <div>
              <select
                value={filters.featured}
                onChange={(event) =>
                  updateFilter(
                    "featured",
                    event.target.value
                  )
                }
              >
                <option value="ALL">
                  All hospitals
                </option>

                <option value="TRUE">
                  Featured only
                </option>

                <option value="FALSE">
                  Not featured
                </option>
              </select>

              <ChevronDown size={15} />
            </div>
          </label>
        </div>

        <div className="ah-filter-card__bottom">
          <label className="ah-checkbox-field">
            <input
              type="checkbox"
              checked={
                filters.includeArchived
              }
              onChange={(event) =>
                updateFilter(
                  "includeArchived",
                  event.target.checked
                )
              }
            />

            <span>
              Include archived hospitals
            </span>
          </label>

          <label className="ah-page-size">
            <span>Rows</span>

            <select
              value={filters.size}
              onChange={(event) =>
                updateFilter(
                  "size",
                  Number(
                    event.target.value
                  )
                )
              }
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>
      </section>

      {/* ===================================================
          LIST
      =================================================== */}

      <section className="ah-list-card">
        <header className="ah-list-card__header">
          <div>
            <h2>Hospital directory</h2>

            <p>
              {formatNumber(
                listState.data
                  ?.totalElements || 0
              )}{" "}
              record(s) matched
            </p>
          </div>

          {listState.refreshing && (
            <div className="ah-inline-loading">
              <Loader2
                size={16}
                className="ah-spin"
              />
              Updating
            </div>
          )}
        </header>

        {listState.loading ? (
          <LoadingBlock label="Loading hospitals..." />
        ) : listState.error ? (
          <EmptyPanel
            icon={<Ban size={28} />}
            title="Unable to load hospitals"
            description={listState.error}
            action={
              <button
                type="button"
                className="ah-btn ah-btn--secondary"
                onClick={() =>
                  loadHospitals()
                }
              >
                <RefreshCw size={16} />
                Try again
              </button>
            }
          />
        ) : hospitals.length === 0 ? (
          <EmptyPanel
            icon={<Building2 size={28} />}
            title="No hospitals found"
            description="No hospital matches the selected search and filter criteria."
            action={
              <button
                type="button"
                className="ah-btn ah-btn--secondary"
                onClick={resetFilters}
              >
                <RotateCcw size={16} />
                Clear filters
              </button>
            }
          />
        ) : (
          <>
            {/* Desktop table */}

            <div className="ah-table-wrap">
              <table className="ah-table">
                <thead>
                  <tr>
                    <th>Hospital</th>
                    <th>Location</th>
                    <th>Capacity</th>
                    <th>Departments</th>
                    <th>Appointments</th>
                    <th>Verification</th>
                    <th>Operations</th>
                    <th>Updated</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>

                <tbody>
                  {hospitals.map(
                    (hospital) => (
                      <tr key={hospital.id}>
                        <td>
                          <button
                            type="button"
                            className="ah-hospital-cell"
                            onClick={() =>
                              openHospitalDetails(
                                hospital.id
                              )
                            }
                          >
                            <span className="ah-hospital-cell__avatar">
                              <Building2 size={20} />
                            </span>

                            <span className="ah-hospital-cell__text">
                              <strong>
                                {hospital.hospitalName}
                              </strong>

                              <small>
                                #{hospital.id} ·{" "}
                                {humanize(
                                  hospital.hospitalType
                                )}
                              </small>

                              <span className="ah-hospital-cell__flags">
                                {hospital.featured && (
                                  <em>
                                    <Star size={12} />
                                    Featured
                                  </em>
                                )}

                                {hospital.emergencyAvailable && (
                                  <em>
                                    <Siren size={12} />
                                    Emergency
                                  </em>
                                )}

                                {hospital.archived && (
                                  <em className="is-archived">
                                    <Archive size={12} />
                                    Archived
                                  </em>
                                )}
                              </span>
                            </span>
                          </button>
                        </td>

                        <td>
                          <div className="ah-location-cell">
                            <MapPin size={15} />

                            <span>
                              <strong>
                                {hospital.city ||
                                  "—"}
                              </strong>

                              <small>
                                {hospital.area ||
                                  "Area not provided"}
                              </small>
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="ah-capacity-cell">
                            <strong>
                              {formatNumber(
                                hospital.availableBeds
                              )}{" "}
                              available
                            </strong>

                            <small>
                              {formatNumber(
                                hospital.totalBeds
                              )}{" "}
                              total beds
                            </small>
                          </div>
                        </td>

                        <td>
                          <strong>
                            {formatNumber(
                              hospital.departmentCount
                            )}
                          </strong>

                          <small className="ah-table-muted">
                            active departments
                          </small>
                        </td>

                        <td>
                          <strong>
                            {formatNumber(
                              hospital.appointmentCount
                            )}
                          </strong>

                          <small className="ah-table-muted">
                            {formatNumber(
                              hospital.pendingAppointmentCount
                            )}{" "}
                            pending
                          </small>
                        </td>

                        <td>
                          <StatusBadge
                            value={
                              hospital.verificationStatus
                            }
                            type="verification"
                          />
                        </td>

                        <td>
                          <StatusBadge
                            value={
                              hospital.archived
                                ? "ARCHIVED"
                                : hospital.operationalStatus
                            }
                            type="operational"
                          />
                        </td>

                        <td>
                          <span className="ah-date-cell">
                            {formatDateTime(
                              hospital.updatedAt
                            )}
                          </span>
                        </td>

                        <td>
                          {renderHospitalMenu(
                            hospital
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}

            <div className="ah-mobile-list">
              {hospitals.map(
                (hospital) => (
                  <article
                    className="ah-mobile-card"
                    key={hospital.id}
                  >
                    <div className="ah-mobile-card__top">
                      <button
                        type="button"
                        className="ah-mobile-card__identity"
                        onClick={() =>
                          openHospitalDetails(
                            hospital.id
                          )
                        }
                      >
                        <span>
                          <Building2 size={20} />
                        </span>

                        <div>
                          <strong>
                            {hospital.hospitalName}
                          </strong>

                          <small>
                            #{hospital.id} ·{" "}
                            {humanize(
                              hospital.hospitalType
                            )}
                          </small>
                        </div>
                      </button>

                      {renderHospitalMenu(
                        hospital
                      )}
                    </div>

                    <div className="ah-mobile-card__badges">
                      <StatusBadge
                        value={
                          hospital.verificationStatus
                        }
                        type="verification"
                      />

                      <StatusBadge
                        value={
                          hospital.archived
                            ? "ARCHIVED"
                            : hospital.operationalStatus
                        }
                        type="operational"
                      />
                    </div>

                    <div className="ah-mobile-card__location">
                      <MapPin size={15} />

                      <span>
                        {hospital.area
                          ? `${hospital.area}, `
                          : ""}
                        {hospital.city || "—"}
                      </span>
                    </div>

                    <div className="ah-mobile-card__metrics">
                      <div>
                        <span>Available beds</span>
                        <strong>
                          {formatNumber(
                            hospital.availableBeds
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Departments</span>
                        <strong>
                          {formatNumber(
                            hospital.departmentCount
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Appointments</span>
                        <strong>
                          {formatNumber(
                            hospital.appointmentCount
                          )}
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="ah-mobile-card__view"
                      onClick={() =>
                        openHospitalDetails(
                          hospital.id
                        )
                      }
                    >
                      View hospital details
                      <ChevronRight size={16} />
                    </button>
                  </article>
                )
              )}
            </div>

            {/* Pagination */}

            <footer className="ah-pagination">
              <div className="ah-pagination__summary">
                Page{" "}
                <strong>
                  {currentPage + 1}
                </strong>{" "}
                of{" "}
                <strong>
                  {Math.max(
                    totalPages,
                    1
                  )}
                </strong>
              </div>

              <div className="ah-pagination__controls">
                <button
                  type="button"
                  className="ah-pagination__nav"
                  disabled={
                    listState.data?.first
                  }
                  onClick={() =>
                    updateFilter(
                      "page",
                      currentPage - 1
                    )
                  }
                >
                  <ChevronLeft size={17} />
                  <span>Previous</span>
                </button>

                <div className="ah-pagination__pages">
                  {pageNumbers.map(
                    (page) => (
                      <button
                        type="button"
                        key={page}
                        className={
                          page === currentPage
                            ? "is-active"
                            : ""
                        }
                        onClick={() =>
                          updateFilter(
                            "page",
                            page
                          )
                        }
                      >
                        {page + 1}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  className="ah-pagination__nav"
                  disabled={
                    listState.data?.last
                  }
                  onClick={() =>
                    updateFilter(
                      "page",
                      currentPage + 1
                    )
                  }
                >
                  <span>Next</span>
                  <ChevronRight size={17} />
                </button>
              </div>
            </footer>
          </>
        )}
      </section>

      {/* ===================================================
          DETAILS DRAWER
      =================================================== */}

      {detailsDrawer.open && (
        <div
          className="ah-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDetailsDrawer();
            }
          }}
        >
          <section
            className="ah-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Hospital details"
          >
            <header className="ah-drawer__header">
              <div>
                <span>Hospital record</span>

                <h2>
                  {detailsState.data
                    ?.hospitalName ||
                    "Hospital details"}
                </h2>
              </div>

              <button
                type="button"
                className="ah-icon-btn"
                onClick={closeDetailsDrawer}
                aria-label="Close hospital details"
              >
                <X size={20} />
              </button>
            </header>

            {detailsState.loading ? (
              <LoadingBlock label="Loading hospital details..." />
            ) : detailsState.error ? (
              <EmptyPanel
                icon={<Ban size={28} />}
                title="Unable to load details"
                description={
                  detailsState.error
                }
                action={
                  <button
                    type="button"
                    className="ah-btn ah-btn--secondary"
                    onClick={() =>
                      loadHospitalDetails(
                        detailsDrawer.hospitalId
                      )
                    }
                  >
                    <RefreshCw size={16} />
                    Try again
                  </button>
                }
              />
            ) : detailsState.data ? (
              <>
                <div className="ah-drawer__summary">
                  <div className="ah-drawer__identity">
                    <div className="ah-drawer__image">
                      {detailsState.data
                        .imageUrl ? (
                        <img
                          src={
                            detailsState.data
                              .imageUrl
                          }
                          alt={
                            detailsState.data
                              .hospitalName
                          }
                          onError={(event) => {
                            event.currentTarget.style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <Building2 size={30} />
                      )}
                    </div>

                    <div>
                      <h3>
                        {
                          detailsState.data
                            .hospitalName
                        }
                      </h3>

                      <p>
                        {humanize(
                          detailsState.data
                            .hospitalType
                        )}{" "}
                        · Hospital #
                        {
                          detailsState.data
                            .id
                        }
                      </p>

                      <div className="ah-drawer__badges">
                        <StatusBadge
                          value={
                            detailsState.data
                              .verificationStatus
                          }
                          type="verification"
                        />

                        <StatusBadge
                          value={
                            detailsState.data
                              .archived
                              ? "ARCHIVED"
                              : detailsState.data
                                .operationalStatus
                          }
                          type="operational"
                        />

                        {detailsState.data
                          .featured
                          ?.featured && (
                            <span className="ah-feature-badge">
                              <Star size={13} />
                              Featured
                            </span>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className="ah-drawer__actions">
                    <button
                      type="button"
                      className="ah-btn ah-btn--secondary ah-btn--small"
                      onClick={() =>
                        openEditHospital(
                          detailsState.data
                        )
                      }
                    >
                      <Edit3 size={15} />
                      Edit
                    </button>

                    <button
                      type="button"
                      className="ah-btn ah-btn--primary ah-btn--small"
                      onClick={() =>
                        setOpenMenuId(
                          detailsState.data.id
                        )
                      }
                    >
                      <MoreHorizontal size={16} />
                      Actions
                    </button>

                    {openMenuId ===
                      detailsState.data.id && (
                        <div className="ah-drawer-action-menu">
                          {renderHospitalMenu(
                            detailsState.data
                          )}
                        </div>
                      )}
                  </div>
                </div>

                <nav className="ah-tabs">
                  {[
                    {
                      key: "overview",
                      label: "Overview",
                      icon: <Building2 size={16} />
                    },
                    {
                      key: "departments",
                      label: "Departments",
                      icon: <ListChecks size={16} />
                    },
                    {
                      key: "images",
                      label: "Images",
                      icon: <ImageIcon size={16} />
                    },
                    {
                      key: "appointments",
                      label: "Appointments",
                      icon: <CalendarDays size={16} />
                    },
                    {
                      key: "activity",
                      label: "Activity",
                      icon: <Activity size={16} />
                    }
                  ].map((tab) => (
                    <button
                      type="button"
                      key={tab.key}
                      className={
                        activeTab === tab.key
                          ? "is-active"
                          : ""
                      }
                      onClick={() =>
                        setActiveTab(
                          tab.key
                        )
                      }
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>

                <div className="ah-drawer__body">
                  {/* Overview */}

                  {activeTab ===
                    "overview" && (
                      <div className="ah-detail-section">
                        <div className="ah-overview-metrics">
                          <article>
                            <BedDouble size={20} />

                            <span>
                              <small>
                                Available beds
                              </small>

                              <strong>
                                {formatNumber(
                                  detailsState.data
                                    .availableBeds
                                )}
                              </strong>
                            </span>
                          </article>

                          <article>
                            <Building2 size={20} />

                            <span>
                              <small>
                                Total beds
                              </small>

                              <strong>
                                {formatNumber(
                                  detailsState.data
                                    .totalBeds
                                )}
                              </strong>
                            </span>
                          </article>

                          <article>
                            <CalendarDays size={20} />

                            <span>
                              <small>
                                Appointments
                              </small>

                              <strong>
                                {formatNumber(
                                  detailsState.data
                                    .appointmentStats
                                    ?.total
                                )}
                              </strong>
                            </span>
                          </article>

                          <article>
                            <Siren size={20} />

                            <span>
                              <small>
                                Emergency
                              </small>

                              <strong>
                                {detailsState.data
                                  .emergencyAvailable
                                  ? "Available"
                                  : "Unavailable"}
                              </strong>
                            </span>
                          </article>
                        </div>

                        <div className="ah-detail-grid">
                          <article className="ah-info-card">
                            <header>
                              <Building2 size={17} />
                              <h3>
                                Registration
                              </h3>
                            </header>

                            <dl>
                              <div>
                                <dt>
                                  Registration no.
                                </dt>
                                <dd>
                                  {detailsState.data
                                    .registrationNumber ||
                                    "Not provided"}
                                </dd>
                              </div>

                              <div>
                                <dt>
                                  License no.
                                </dt>
                                <dd>
                                  {detailsState.data
                                    .licenseNumber ||
                                    "Not provided"}
                                </dd>
                              </div>

                              <div>
                                <dt>Type</dt>
                                <dd>
                                  {humanize(
                                    detailsState.data
                                      .hospitalType
                                  )}
                                </dd>
                              </div>

                              <div>
                                <dt>Rating</dt>
                                <dd>
                                  {detailsState.data
                                    .rating
                                    ? `${detailsState.data.rating} / 5`
                                    : "Not rated"}
                                </dd>
                              </div>
                            </dl>
                          </article>

                          <article className="ah-info-card">
                            <header>
                              <MapPin size={17} />
                              <h3>
                                Location
                              </h3>
                            </header>

                            <dl>
                              <div>
                                <dt>City</dt>
                                <dd>
                                  {detailsState.data
                                    .city ||
                                    "—"}
                                </dd>
                              </div>

                              <div>
                                <dt>Area</dt>
                                <dd>
                                  {detailsState.data
                                    .area ||
                                    "Not provided"}
                                </dd>
                              </div>

                              <div>
                                <dt>State</dt>
                                <dd>
                                  {detailsState.data
                                    .state ||
                                    "Not provided"}
                                </dd>
                              </div>

                              <div>
                                <dt>Pincode</dt>
                                <dd>
                                  {detailsState.data
                                    .pincode ||
                                    "Not provided"}
                                </dd>
                              </div>

                              <div className="is-full">
                                <dt>Address</dt>
                                <dd>
                                  {detailsState.data
                                    .address ||
                                    "Not provided"}
                                </dd>
                              </div>
                            </dl>
                          </article>

                          <article className="ah-info-card">
                            <header>
                              <ShieldCheck size={17} />
                              <h3>
                                Contact
                              </h3>
                            </header>

                            <dl>
                              <div>
                                <dt>Email</dt>
                                <dd>
                                  {detailsState.data
                                    .hospitalEmail ||
                                    "Not provided"}
                                </dd>
                              </div>

                              <div>
                                <dt>Phone</dt>
                                <dd>
                                  {detailsState.data
                                    .phone ||
                                    "Not provided"}
                                </dd>
                              </div>

                              <div>
                                <dt>
                                  Emergency phone
                                </dt>
                                <dd>
                                  {detailsState.data
                                    .emergencyPhone ||
                                    "Not provided"}
                                </dd>
                              </div>
                            </dl>
                          </article>

                          <article className="ah-info-card">
                            <header>
                              <Activity size={17} />
                              <h3>
                                Record metadata
                              </h3>
                            </header>

                            <dl>
                              <div>
                                <dt>Created</dt>
                                <dd>
                                  {formatDateTime(
                                    detailsState.data
                                      .createdAt
                                  )}
                                </dd>
                              </div>

                              <div>
                                <dt>Updated</dt>
                                <dd>
                                  {formatDateTime(
                                    detailsState.data
                                      .updatedAt
                                  )}
                                </dd>
                              </div>

                              <div>
                                <dt>Version</dt>
                                <dd>
                                  {
                                    detailsState.data
                                      .version
                                  }
                                </dd>
                              </div>
                            </dl>
                          </article>
                        </div>

                        <article className="ah-description-card">
                          <h3>
                            Hospital description
                          </h3>

                          <p>
                            {detailsState.data
                              .description ||
                              "No hospital description has been provided."}
                          </p>
                        </article>

                        {(detailsState.data
                          .verificationNote ||
                          detailsState.data
                            .statusReason ||
                          detailsState.data
                            .adminNote) && (
                            <article className="ah-notes-card">
                              <h3>
                                Administrative notes
                              </h3>

                              {detailsState.data
                                .verificationNote && (
                                  <div>
                                    <strong>
                                      Verification note
                                    </strong>

                                    <p>
                                      {
                                        detailsState.data
                                          .verificationNote
                                      }
                                    </p>
                                  </div>
                                )}

                              {detailsState.data
                                .statusReason && (
                                  <div>
                                    <strong>
                                      Status reason
                                    </strong>

                                    <p>
                                      {
                                        detailsState.data
                                          .statusReason
                                      }
                                    </p>
                                  </div>
                                )}

                              {detailsState.data
                                .adminNote && (
                                  <div>
                                    <strong>
                                      Internal admin note
                                    </strong>

                                    <p>
                                      {
                                        detailsState.data
                                          .adminNote
                                      }
                                    </p>
                                  </div>
                                )}
                            </article>
                          )}
                      </div>
                    )}

                  {/* Departments */}

                  {activeTab ===
                    "departments" && (
                      <div className="ah-detail-section">
                        <div className="ah-section-heading">
                          <div>
                            <h3>
                              Hospital departments
                            </h3>

                            <p>
                              Manage active hospital departments,
                              fees and available beds.
                            </p>
                          </div>

                          {!detailsState.data
                            .archived && (
                              <button
                                type="button"
                                className="ah-btn ah-btn--primary ah-btn--small"
                                onClick={
                                  openCreateDepartment
                                }
                              >
                                <Plus size={15} />
                                Add department
                              </button>
                            )}
                        </div>

                        {detailsState.data
                          .departments?.length ? (
                          <div className="ah-department-list">
                            {detailsState.data.departments.map(
                              (department) => (
                                <article
                                  className="ah-department-card"
                                  key={department.id}
                                >
                                  <div className="ah-department-card__top">
                                    <div>
                                      <span className="ah-department-card__icon">
                                        <ListChecks size={18} />
                                      </span>

                                      <div>
                                        <h4>
                                          {
                                            department.departmentName
                                          }
                                        </h4>

                                        <StatusBadge
                                          value={
                                            department.archived
                                              ? "ARCHIVED"
                                              : department.active
                                                ? "ACTIVE"
                                                : "INACTIVE"
                                          }
                                          type="operational"
                                        />
                                      </div>
                                    </div>

                                    {!department.archived && (
                                      <div className="ah-card-actions">
                                        <button
                                          type="button"
                                          className="ah-icon-btn"
                                          onClick={() =>
                                            openEditDepartment(
                                              department
                                            )
                                          }
                                          aria-label="Edit department"
                                        >
                                          <Edit3 size={16} />
                                        </button>

                                        <button
                                          type="button"
                                          className="ah-icon-btn"
                                          onClick={() =>
                                            openActionModal(
                                              {
                                                type:
                                                  department.active
                                                    ? "DEACTIVATE_DEPARTMENT"
                                                    : "ACTIVATE_DEPARTMENT",

                                                hospital:
                                                  detailsState.data,

                                                department
                                              }
                                            )
                                          }
                                          aria-label="Change department status"
                                        >
                                          {department.active ? (
                                            <CircleOff size={16} />
                                          ) : (
                                            <CheckCircle2 size={16} />
                                          )}
                                        </button>

                                        <button
                                          type="button"
                                          className="ah-icon-btn is-danger"
                                          onClick={() =>
                                            openActionModal(
                                              {
                                                type:
                                                  "ARCHIVE_DEPARTMENT",

                                                hospital:
                                                  detailsState.data,

                                                department
                                              }
                                            )
                                          }
                                          aria-label="Archive department"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  <p>
                                    {department.description ||
                                      "No department description provided."}
                                  </p>

                                  <div className="ah-department-card__metrics">
                                    <span>
                                      <small>
                                        Consultation fee
                                      </small>

                                      <strong>
                                        {formatCurrency(
                                          department.consultationFee
                                        )}
                                      </strong>
                                    </span>

                                    <span>
                                      <small>
                                        Available beds
                                      </small>

                                      <strong>
                                        {department.availableBeds ??
                                          "—"}
                                      </strong>
                                    </span>

                                    <span>
                                      <small>
                                        Updated
                                      </small>

                                      <strong>
                                        {formatDate(
                                          department.updatedAt
                                        )}
                                      </strong>
                                    </span>
                                  </div>
                                </article>
                              )
                            )}
                          </div>
                        ) : (
                          <EmptyPanel
                            icon={<ListChecks size={26} />}
                            title="No departments"
                            description="Add the first hospital department to make booking options available."
                            action={
                              !detailsState.data
                                .archived ? (
                                <button
                                  type="button"
                                  className="ah-btn ah-btn--primary"
                                  onClick={
                                    openCreateDepartment
                                  }
                                >
                                  <Plus size={16} />
                                  Add department
                                </button>
                              ) : null
                            }
                          />
                        )}
                      </div>
                    )}

                  {/* Images */}

                  {activeTab === "images" && (
                    <div className="ah-detail-section">
                      <div className="ah-section-heading">
                        <div>
                          <h3>
                            Hospital images
                          </h3>

                          <p>
                            Manage public hospital gallery and
                            primary image selection.
                          </p>
                        </div>

                        {!detailsState.data
                          .archived && (
                            <button
                              type="button"
                              className="ah-btn ah-btn--primary ah-btn--small"
                              onClick={openCreateImage}
                            >
                              <Plus size={15} />
                              Add image
                            </button>
                          )}
                      </div>

                      {detailsState.data
                        .images?.length ? (
                        <div className="ah-image-grid">
                          {detailsState.data.images.map(
                            (image) => (
                              <article
                                className="ah-image-card"
                                key={image.id}
                              >
                                <div className="ah-image-card__preview">
                                  <img
                                    src={image.imageUrl}
                                    alt={
                                      image.altText ||
                                      detailsState.data
                                        .hospitalName
                                    }
                                  />

                                  {image.primaryImage && (
                                    <span>
                                      <Star size={13} />
                                      Primary
                                    </span>
                                  )}
                                </div>

                                <div className="ah-image-card__body">
                                  <div>
                                    <strong>
                                      {image.altText ||
                                        "Hospital image"}
                                    </strong>

                                    <small>
                                      Display order{" "}
                                      {image.displayOrder ??
                                        0}
                                    </small>
                                  </div>

                                  <StatusBadge
                                    value={
                                      image.archived
                                        ? "ARCHIVED"
                                        : image.active
                                          ? "ACTIVE"
                                          : "INACTIVE"
                                    }
                                    type="operational"
                                  />
                                </div>

                                {!image.archived && (
                                  <footer className="ah-image-card__actions">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openEditImage(
                                          image
                                        )
                                      }
                                    >
                                      <Edit3 size={15} />
                                      Edit
                                    </button>

                                    {!image.primaryImage && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openActionModal(
                                            {
                                              type:
                                                "SET_PRIMARY_IMAGE",

                                              hospital:
                                                detailsState.data,

                                              image
                                            }
                                          )
                                        }
                                      >
                                        <Star size={15} />
                                        Set primary
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      className="is-danger"
                                      onClick={() =>
                                        openActionModal(
                                          {
                                            type:
                                              "ARCHIVE_IMAGE",

                                            hospital:
                                              detailsState.data,

                                            image
                                          }
                                        )
                                      }
                                    >
                                      <Trash2 size={15} />
                                      Archive
                                    </button>
                                  </footer>
                                )}
                              </article>
                            )
                          )}
                        </div>
                      ) : (
                        <EmptyPanel
                          icon={<ImageIcon size={26} />}
                          title="No hospital images"
                          description="Add a valid image URL for the hospital gallery."
                          action={
                            !detailsState.data
                              .archived ? (
                              <button
                                type="button"
                                className="ah-btn ah-btn--primary"
                                onClick={openCreateImage}
                              >
                                <Plus size={16} />
                                Add image
                              </button>
                            ) : null
                          }
                        />
                      )}
                    </div>
                  )}

                  {/* Appointments */}

                  {activeTab ===
                    "appointments" && (
                      <div className="ah-detail-section">
                        <div className="ah-section-heading ah-section-heading--wrap">
                          <div>
                            <h3>
                              Hospital appointments
                            </h3>

                            <p>
                              Review patient hospital requests and
                              appointment history.
                            </p>
                          </div>

                          <label className="ah-select-field ah-select-field--compact">
                            <span>Status</span>

                            <div>
                              <select
                                value={
                                  appointmentState.status
                                }
                                onChange={(event) =>
                                  loadAppointments({
                                    status:
                                      event.target.value,
                                    page: 0
                                  })
                                }
                              >
                                {APPOINTMENT_STATUS_OPTIONS.map(
                                  (status) => (
                                    <option
                                      key={status}
                                      value={status}
                                    >
                                      {status === "ALL"
                                        ? "All statuses"
                                        : humanize(
                                          status
                                        )}
                                    </option>
                                  )
                                )}
                              </select>

                              <ChevronDown size={14} />
                            </div>
                          </label>
                        </div>

                        {appointmentState.loading ? (
                          <LoadingBlock label="Loading hospital appointments..." />
                        ) : appointmentState.error ? (
                          <EmptyPanel
                            icon={<Ban size={26} />}
                            title="Unable to load appointments"
                            description={
                              appointmentState.error
                            }
                            action={
                              <button
                                type="button"
                                className="ah-btn ah-btn--secondary"
                                onClick={() =>
                                  loadAppointments()
                                }
                              >
                                <RefreshCw size={16} />
                                Try again
                              </button>
                            }
                          />
                        ) : appointmentState.data
                          ?.content?.length ? (
                          <>
                            <div className="ah-subtable-wrap">
                              <table className="ah-subtable">
                                <thead>
                                  <tr>
                                    <th>
                                      Appointment
                                    </th>
                                    <th>
                                      Department
                                    </th>
                                    <th>Schedule</th>
                                    <th>Bed type</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {appointmentState.data.content.map(
                                    (
                                      appointment
                                    ) => (
                                      <tr
                                        key={
                                          appointment.id
                                        }
                                      >
                                        <td>
                                          <strong>
                                            {
                                              appointment.appointmentNumber
                                            }
                                          </strong>

                                          <small>
                                            Patient profile #
                                            {
                                              appointment.patientProfileId
                                            }
                                          </small>
                                        </td>

                                        <td>
                                          {appointment.departmentName ||
                                            "—"}
                                        </td>

                                        <td>
                                          <strong>
                                            {formatDate(
                                              appointment.appointmentDate
                                            )}
                                          </strong>

                                          <small>
                                            {formatTime(
                                              appointment.slotStartTime
                                            )}{" "}
                                            –{" "}
                                            {formatTime(
                                              appointment.slotEndTime
                                            )}
                                          </small>
                                        </td>

                                        <td>
                                          {appointment.bedType ||
                                            "—"}
                                        </td>

                                        <td>
                                          <StatusBadge
                                            value={
                                              appointment.status
                                            }
                                            type="operational"
                                          />
                                        </td>
                                      </tr>
                                    )
                                  )}
                                </tbody>
                              </table>
                            </div>

                            <div className="ah-mini-pagination">
                              <span>
                                Page{" "}
                                {(appointmentState
                                  .data.page ?? 0) +
                                  1}{" "}
                                of{" "}
                                {Math.max(
                                  appointmentState
                                    .data
                                    .totalPages ??
                                  1,
                                  1
                                )}
                              </span>

                              <div>
                                <button
                                  type="button"
                                  className="ah-icon-btn"
                                  disabled={
                                    appointmentState
                                      .data.first
                                  }
                                  onClick={() =>
                                    loadAppointments({
                                      page:
                                        appointmentState
                                          .data
                                          .page - 1
                                    })
                                  }
                                >
                                  <ChevronLeft size={17} />
                                </button>

                                <button
                                  type="button"
                                  className="ah-icon-btn"
                                  disabled={
                                    appointmentState
                                      .data.last
                                  }
                                  onClick={() =>
                                    loadAppointments({
                                      page:
                                        appointmentState
                                          .data
                                          .page + 1
                                    })
                                  }
                                >
                                  <ChevronRight size={17} />
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <EmptyPanel
                            icon={<CalendarDays size={26} />}
                            title="No appointments"
                            description="No hospital appointments match the selected status."
                          />
                        )}
                      </div>
                    )}

                  {/* Activity */}

                  {activeTab ===
                    "activity" && (
                      <div className="ah-detail-section">
                        <div className="ah-section-heading">
                          <div>
                            <h3>
                              Administrative activity
                            </h3>

                            <p>
                              Audit history for hospital management
                              actions.
                            </p>
                          </div>

                          <button
                            type="button"
                            className="ah-btn ah-btn--secondary ah-btn--small"
                            onClick={() =>
                              loadActivity({
                                page: 0
                              })
                            }
                            disabled={
                              activityState.loading
                            }
                          >
                            <RefreshCw
                              size={15}
                              className={
                                activityState.loading
                                  ? "ah-spin"
                                  : ""
                              }
                            />
                            Refresh
                          </button>
                        </div>

                        {activityState.loading ? (
                          <LoadingBlock label="Loading audit activity..." />
                        ) : activityState.error ? (
                          <EmptyPanel
                            icon={<Ban size={26} />}
                            title="Unable to load activity"
                            description={
                              activityState.error
                            }
                            action={
                              <button
                                type="button"
                                className="ah-btn ah-btn--secondary"
                                onClick={() =>
                                  loadActivity({
                                    page: 0
                                  })
                                }
                              >
                                <RefreshCw size={16} />
                                Try again
                              </button>
                            }
                          />
                        ) : activityState.data
                          ?.content?.length ? (
                          <>
                            <div className="ah-timeline">
                              {activityState.data.content.map(
                                (item) => (
                                  <article
                                    className="ah-timeline__item"
                                    key={item.id}
                                  >
                                    <span
                                      className={`ah-timeline__marker ${item.severity ===
                                        "WARNING"
                                        ? "is-warning"
                                        : ""
                                        }`}
                                    />

                                    <div className="ah-timeline__card">
                                      <div className="ah-timeline__top">
                                        <div>
                                          <strong>
                                            {humanize(
                                              item.action
                                            )}
                                          </strong>

                                          <span>
                                            {formatDateTime(
                                              item.createdAt
                                            )}
                                          </span>
                                        </div>

                                        <span
                                          className={`ah-audit-severity ${item.severity ===
                                            "WARNING"
                                            ? "is-warning"
                                            : ""
                                            }`}
                                        >
                                          {item.severity}
                                        </span>
                                      </div>

                                      <p>
                                        {item.description ||
                                          "No description"}
                                      </p>

                                      <div className="ah-timeline__meta">
                                        <span>
                                          {item.actorName ||
                                            "System"}
                                        </span>

                                        <span>
                                          {item.actorEmail ||
                                            "—"}
                                        </span>

                                        <span>
                                          {item.browserName ||
                                            "Unknown browser"}{" "}
                                          ·{" "}
                                          {item.deviceType ||
                                            "Unknown device"}
                                        </span>
                                      </div>
                                    </div>
                                  </article>
                                )
                              )}
                            </div>

                            <div className="ah-mini-pagination">
                              <span>
                                Page{" "}
                                {(activityState
                                  .data.page ?? 0) +
                                  1}{" "}
                                of{" "}
                                {Math.max(
                                  activityState.data
                                    .totalPages ??
                                  1,
                                  1
                                )}
                              </span>

                              <div>
                                <button
                                  type="button"
                                  className="ah-icon-btn"
                                  disabled={
                                    activityState.data
                                      .first
                                  }
                                  onClick={() =>
                                    loadActivity({
                                      page:
                                        activityState
                                          .data.page -
                                        1
                                    })
                                  }
                                >
                                  <ChevronLeft size={17} />
                                </button>

                                <button
                                  type="button"
                                  className="ah-icon-btn"
                                  disabled={
                                    activityState.data
                                      .last
                                  }
                                  onClick={() =>
                                    loadActivity({
                                      page:
                                        activityState
                                          .data.page +
                                        1
                                    })
                                  }
                                >
                                  <ChevronRight size={17} />
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <EmptyPanel
                            icon={<Activity size={26} />}
                            title="No activity available"
                            description="Hospital administration actions will appear here."
                          />
                        )}
                      </div>
                    )}
                </div>
              </>
            ) : (
              <EmptyPanel
                icon={<Ban size={26} />}
                title="Hospital details unavailable"
                description="Close the panel and try again."
              />
            )}
          </section>
        </div>
      )}

      {/* ===================================================
          HOSPITAL FORM MODAL
      =================================================== */}

      {hospitalFormModal.open && (
        <div
          className="ah-overlay ah-overlay--center"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget &&
              !hospitalFormSaving
            ) {
              closeHospitalForm();
            }
          }}
        >
          <section
            className="ah-modal ah-modal--large"
            role="dialog"
            aria-modal="true"
            aria-label={
              hospitalFormModal.mode ===
                "create"
                ? "Add hospital"
                : "Edit hospital"
            }
          >
            <header className="ah-modal__header">
              <div>
                <span>Hospital record</span>

                <h2>
                  {hospitalFormModal.mode ===
                    "create"
                    ? "Add Hospital"
                    : "Edit Hospital"}
                </h2>
              </div>

              <button
                type="button"
                className="ah-icon-btn"
                onClick={closeHospitalForm}
                disabled={hospitalFormSaving}
              >
                <X size={19} />
              </button>
            </header>

            <form
              className="ah-modal__form"
              onSubmit={submitHospitalForm}
            >
              <div className="ah-modal__body">
                {hospitalFormError && (
                  <div className="ah-form-error">
                    <Ban size={17} />
                    {hospitalFormError}
                  </div>
                )}

                <div className="ah-form-section">
                  <div className="ah-form-section__title">
                    <Building2 size={17} />

                    <div>
                      <h3>
                        Hospital identity
                      </h3>

                      <p>
                        Core legal and public information.
                      </p>
                    </div>
                  </div>

                  <div className="ah-form-grid">
                    <label className="ah-field ah-field--span-2">
                      <span>
                        Hospital name *
                      </span>

                      <input
                        value={
                          hospitalForm.hospitalName
                        }
                        onChange={(event) =>
                          setHospitalForm(
                            (current) => ({
                              ...current,
                              hospitalName:
                                event.target
                                  .value
                            })
                          )
                        }
                        maxLength={180}
                        required
                      />
                    </label>

                    <label className="ah-field">
                      <span>
                        Hospital type *
                      </span>

                      <select
                        value={
                          hospitalForm.hospitalType
                        }
                        onChange={(event) =>
                          setHospitalForm(
                            (current) => ({
                              ...current,
                              hospitalType:
                                event.target
                                  .value
                            })
                          )
                        }
                      >
                        {(filterOptions
                          .hospitalTypes
                          .length
                          ? filterOptions
                            .hospitalTypes
                          : ["HOSPITAL"]
                        ).map((type) => (
                          <option
                            key={type}
                            value={type}
                          >
                            {humanize(type)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="ah-field">
                      <span>
                        Registration number
                      </span>

                      <input
                        value={
                          hospitalForm.registrationNumber
                        }
                        onChange={(event) =>
                          setHospitalForm(
                            (current) => ({
                              ...current,
                              registrationNumber:
                                event.target
                                  .value
                            })
                          )
                        }
                        maxLength={120}
                      />
                    </label>

                    <label className="ah-field">
                      <span>
                        License number
                      </span>

                      <input
                        value={
                          hospitalForm.licenseNumber
                        }
                        onChange={(event) =>
                          setHospitalForm(
                            (current) => ({
                              ...current,
                              licenseNumber:
                                event.target
                                  .value
                            })
                          )
                        }
                        maxLength={120}
                      />
                    </label>

                    {hospitalFormModal.mode ===
                      "create" && (
                        <label className="ah-field">
                          <span>
                            Primary image URL
                          </span>

                          <input
                            type="url"
                            value={
                              hospitalForm.imageUrl
                            }
                            onChange={(event) =>
                              setHospitalForm(
                                (current) => ({
                                  ...current,
                                  imageUrl:
                                    event.target
                                      .value
                                })
                              )
                            }
                            placeholder="https://..."
                          />
                        </label>
                      )}
                  </div>
                </div>

                <div className="ah-form-section">
                  <div className="ah-form-section__title">
                    <MapPin size={17} />

                    <div>
                      <h3>
                        Location and contact
                      </h3>

                      <p>
                        Address and operational contact details.
                      </p>
                    </div>
                  </div>

                  <div className="ah-form-grid">
                    <label className="ah-field">
                      <span>City *</span>

                      <input
                        value={
                          hospitalForm.city
                        }
                        onChange={(event) =>
                          setHospitalForm(
                            (current) => ({
                              ...current,
                              city:
                                event.target
                                  .value
                            })
                          )
                        }
                        maxLength={100}
                        required
                      />
                    </label>

                    <label className="ah-field">
                      <span>Area</span>

                      <input
                        value={
                          hospitalForm.area
                        }
                        onChange={(event) =>
                          setHospitalForm(
                            (current) => ({
                              ...current,
                              area:
                                event.target
                                  .value
                            })
                          )
                        }
                        maxLength={100}
                      />
                    </label>

                    <label className="ah-field">
                      <span>State</span>

                      <input
                        value={
                          hospitalForm.state
                        }
                        onChange={(event) =>
                          setHospitalForm(
                            (current) => ({
                              ...current,
                              state:
                                event.target
                                  .value
                            })
                          )
                        }
                        maxLength={100}
                      />
                    </label>

                    <label className="ah-field">
                      <span>Pincode</span>

                      <input
                        value={
                          hospitalForm.pincode
                        }
                        onChange={(event) =>
                          setHospitalForm(
                            (current) => ({
                              ...current,
                              pincode:
                                event.target
                                  .value
                            })
                          )
                        }
                        maxLength={20}
                      />
                    </label>

                    <label className="ah-field ah-field--span-2">
                      <span>Address</span>

                      <textarea
                        rows={3}
                        value={
                          hospitalForm.address
                        }
                        onChange={(event) =>
                          setHospitalForm(
                            (current) => ({
                              ...current,
                              address:
                                event.target
                                  .value
                            })
                          )
                        }
                        maxLength={500}
                      />
                    </label>

                    <label className="ah-field">
                      <span>
                        Hospital email
                      </span>

                      <input
                        type="email"
                        value={
                          hospitalForm.hospitalEmail
                        }
                        onChange={(event) =>
                          setHospitalForm(
                            (current) => ({
                              ...current,
                              hospitalEmail:
                                event.target
                                  .value
                            })
                          )
                        }
                        maxLength={180}
                      />
                    </label>

                    <label className="ah-field">
                      <span>Phone</span>

                      <input
                        value={
                          hospitalForm.phone
                        }
                        onChange={(event) =>
                          setHospitalForm(
                            (current) => ({
                              ...current,
                              phone:
                                event.target
                                  .value
                            })
                          )
                        }
                        maxLength={30}
                      />
                    </label>

                    <label className="ah-field">
                      <span>
                        Emergency phone
                      </span>

                      <input
                        value={
                          hospitalForm.emergencyPhone
                        }
                        onChange={(event) =>
                          setHospitalForm(
                            (current) => ({
                              ...current,
                              emergencyPhone:
                                event.target
                                  .value
                            })
                          )
                        }
                        maxLength={30}
                      />
                    </label>

                    <label className="ah-toggle-field">
                      <input
                        type="checkbox"
                        checked={
                          hospitalForm.emergencyAvailable
                        }
                        onChange={(event) =>
                          setHospitalForm(
                            (current) => ({
                              ...current,
                              emergencyAvailable:
                                event.target
                                  .checked
                            })
                          )
                        }
                      />

                      <span>
                        <strong>
                          Emergency care
                        </strong>

                        <small>
                          Emergency support is available
                        </small>
                      </span>
                    </label>
                  </div>
                </div>

                <div className="ah-form-section">
                  <div className="ah-form-section__title">
                    <BedDouble size={17} />

                    <div>
                      <h3>
                        Capacity and description
                      </h3>

                      <p>
                        Bed availability and public hospital information.
                      </p>
                    </div>
                  </div>

                  <div className="ah-form-grid">
                    <label className="ah-field">
                      <span>
                        Total beds *
                      </span>

                      <input
                        type="number"
                        min="0"
                        value={
                          hospitalForm.totalBeds
                        }
                        onChange={(event) =>
                          setHospitalForm(
                            (current) => ({
                              ...current,
                              totalBeds:
                                event.target
                                  .value
                            })
                          )
                        }
                        required
                      />
                    </label>

                    <label className="ah-field">
                      <span>
                        Available beds *
                      </span>

                      <input
                        type="number"
                        min="0"
                        value={
                          hospitalForm.availableBeds
                        }
                        onChange={(event) =>
                          setHospitalForm(
                            (current) => ({
                              ...current,
                              availableBeds:
                                event.target
                                  .value
                            })
                          )
                        }
                        required
                      />
                    </label>

                    <label className="ah-field ah-field--span-2">
                      <span>Description</span>

                      <textarea
                        rows={4}
                        value={
                          hospitalForm.description
                        }
                        onChange={(event) =>
                          setHospitalForm(
                            (current) => ({
                              ...current,
                              description:
                                event.target
                                  .value
                            })
                          )
                        }
                        maxLength={5000}
                      />
                    </label>

                    <label className="ah-field ah-field--span-2">
                      <span>
                        Internal admin note
                      </span>

                      <textarea
                        rows={3}
                        value={
                          hospitalForm.adminNote
                        }
                        onChange={(event) =>
                          setHospitalForm(
                            (current) => ({
                              ...current,
                              adminNote:
                                event.target
                                  .value
                            })
                          )
                        }
                        maxLength={5000}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <footer className="ah-modal__footer">
                <button
                  type="button"
                  className="ah-btn ah-btn--secondary"
                  onClick={closeHospitalForm}
                  disabled={hospitalFormSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="ah-btn ah-btn--primary"
                  disabled={hospitalFormSaving}
                >
                  {hospitalFormSaving ? (
                    <Loader2
                      size={17}
                      className="ah-spin"
                    />
                  ) : (
                    <Save size={17} />
                  )}

                  {hospitalFormSaving
                    ? "Saving..."
                    : hospitalFormModal.mode ===
                      "create"
                      ? "Create Hospital"
                      : "Save Changes"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {/* ===================================================
          DEPARTMENT MODAL
      =================================================== */}

      {departmentModal.open && (
        <div
          className="ah-overlay ah-overlay--center"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget &&
              !departmentSaving
            ) {
              closeDepartmentModal();
            }
          }}
        >
          <section
            className="ah-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Hospital department"
          >
            <header className="ah-modal__header">
              <div>
                <span>
                  Hospital department
                </span>

                <h2>
                  {departmentModal.mode ===
                    "create"
                    ? "Add Department"
                    : "Edit Department"}
                </h2>
              </div>

              <button
                type="button"
                className="ah-icon-btn"
                onClick={
                  closeDepartmentModal
                }
              >
                <X size={19} />
              </button>
            </header>

            <form
              className="ah-modal__form"
              onSubmit={
                submitDepartmentForm
              }
            >
              <div className="ah-modal__body">
                {departmentFormError && (
                  <div className="ah-form-error">
                    <Ban size={17} />
                    {departmentFormError}
                  </div>
                )}

                <div className="ah-form-grid">
                  <label className="ah-field ah-field--span-2">
                    <span>
                      Department name *
                    </span>

                    <input
                      value={
                        departmentForm.departmentName
                      }
                      onChange={(event) =>
                        setDepartmentForm(
                          (current) => ({
                            ...current,
                            departmentName:
                              event.target
                                .value
                          })
                        )
                      }
                      maxLength={150}
                      required
                    />
                  </label>

                  <label className="ah-field">
                    <span>
                      Consultation fee
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        departmentForm.consultationFee
                      }
                      onChange={(event) =>
                        setDepartmentForm(
                          (current) => ({
                            ...current,
                            consultationFee:
                              event.target
                                .value
                          })
                        )
                      }
                    />
                  </label>

                  <label className="ah-field">
                    <span>
                      Available beds
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={
                        departmentForm.availableBeds
                      }
                      onChange={(event) =>
                        setDepartmentForm(
                          (current) => ({
                            ...current,
                            availableBeds:
                              event.target
                                .value
                          })
                        )
                      }
                    />
                  </label>

                  <label className="ah-field ah-field--span-2">
                    <span>Description</span>

                    <textarea
                      rows={4}
                      value={
                        departmentForm.description
                      }
                      onChange={(event) =>
                        setDepartmentForm(
                          (current) => ({
                            ...current,
                            description:
                              event.target
                                .value
                          })
                        )
                      }
                      maxLength={1000}
                    />
                  </label>

                  {departmentModal.mode ===
                    "create" && (
                      <label className="ah-toggle-field ah-field--span-2">
                        <input
                          type="checkbox"
                          checked={
                            departmentForm.active
                          }
                          onChange={(event) =>
                            setDepartmentForm(
                              (current) => ({
                                ...current,
                                active:
                                  event.target
                                    .checked
                              })
                            )
                          }
                        />

                        <span>
                          <strong>
                            Active department
                          </strong>

                          <small>
                            Allow department in hospital operations
                          </small>
                        </span>
                      </label>
                    )}
                </div>
              </div>

              <footer className="ah-modal__footer">
                <button
                  type="button"
                  className="ah-btn ah-btn--secondary"
                  onClick={
                    closeDepartmentModal
                  }
                  disabled={
                    departmentSaving
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="ah-btn ah-btn--primary"
                  disabled={
                    departmentSaving
                  }
                >
                  {departmentSaving ? (
                    <Loader2
                      size={17}
                      className="ah-spin"
                    />
                  ) : (
                    <Save size={17} />
                  )}

                  {departmentSaving
                    ? "Saving..."
                    : "Save Department"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {/* ===================================================
          IMAGE MODAL
      =================================================== */}

      {imageModal.open && (
        <div
          className="ah-overlay ah-overlay--center"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget &&
              !imageSaving
            ) {
              closeImageModal();
            }
          }}
        >
          <section
            className="ah-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Hospital image"
          >
            <header className="ah-modal__header">
              <div>
                <span>
                  Hospital gallery
                </span>

                <h2>
                  {imageModal.mode ===
                    "create"
                    ? "Add Image"
                    : "Edit Image"}
                </h2>
              </div>

              <button
                type="button"
                className="ah-icon-btn"
                onClick={closeImageModal}
              >
                <X size={19} />
              </button>
            </header>

            <form
              className="ah-modal__form"
              onSubmit={submitImageForm}
            >
              <div className="ah-modal__body">
                {imageFormError && (
                  <div className="ah-form-error">
                    <Ban size={17} />
                    {imageFormError}
                  </div>
                )}

                {imageForm.imageUrl && (
                  <div className="ah-image-preview">
                    <img
                      src={imageForm.imageUrl}
                      alt="Hospital preview"
                    />
                  </div>
                )}

                <div className="ah-form-grid">
                  <label className="ah-field ah-field--span-2">
                    <span>
                      Image URL *
                    </span>

                    <input
                      type="url"
                      value={
                        imageForm.imageUrl
                      }
                      onChange={(event) =>
                        setImageForm(
                          (current) => ({
                            ...current,
                            imageUrl:
                              event.target
                                .value
                          })
                        )
                      }
                      placeholder="https://..."
                      required
                    />
                  </label>

                  <label className="ah-field ah-field--span-2">
                    <span>
                      Alternative text
                    </span>

                    <input
                      value={
                        imageForm.altText
                      }
                      onChange={(event) =>
                        setImageForm(
                          (current) => ({
                            ...current,
                            altText:
                              event.target
                                .value
                          })
                        )
                      }
                      maxLength={255}
                    />
                  </label>

                  <label className="ah-field">
                    <span>
                      Display order
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={
                        imageForm.displayOrder
                      }
                      onChange={(event) =>
                        setImageForm(
                          (current) => ({
                            ...current,
                            displayOrder:
                              event.target
                                .value
                          })
                        )
                      }
                    />
                  </label>

                  <label className="ah-toggle-field">
                    <input
                      type="checkbox"
                      checked={
                        imageForm.active
                      }
                      onChange={(event) =>
                        setImageForm(
                          (current) => ({
                            ...current,
                            active:
                              event.target
                                .checked
                          })
                        )
                      }
                    />

                    <span>
                      <strong>
                        Active image
                      </strong>

                      <small>
                        Show in public gallery
                      </small>
                    </span>
                  </label>

                  <label className="ah-toggle-field ah-field--span-2">
                    <input
                      type="checkbox"
                      checked={
                        imageForm.primaryImage
                      }
                      onChange={(event) =>
                        setImageForm(
                          (current) => ({
                            ...current,
                            primaryImage:
                              event.target
                                .checked
                          })
                        )
                      }
                    />

                    <span>
                      <strong>
                        Primary hospital image
                      </strong>

                      <small>
                        Use as the main hospital image
                      </small>
                    </span>
                  </label>
                </div>
              </div>

              <footer className="ah-modal__footer">
                <button
                  type="button"
                  className="ah-btn ah-btn--secondary"
                  onClick={closeImageModal}
                  disabled={imageSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="ah-btn ah-btn--primary"
                  disabled={imageSaving}
                >
                  {imageSaving ? (
                    <Loader2
                      size={17}
                      className="ah-spin"
                    />
                  ) : (
                    <Save size={17} />
                  )}

                  {imageSaving
                    ? "Saving..."
                    : "Save Image"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {/* ===================================================
          ACTION CONFIRMATION
      =================================================== */}

      {actionModal.open && (
        <div
          className="ah-overlay ah-overlay--center ah-overlay--top"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeActionModal();
            }
          }}
        >
          <section
            className="ah-confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-label={
              ACTION_CONFIG[
                actionModal.type
              ]?.title ||
              "Confirm action"
            }
          >
            <div
              className={`ah-confirm-modal__icon ah-confirm-modal__icon--${ACTION_CONFIG[
                actionModal.type
              ]?.tone || "neutral"
                }`}
            >
              {ACTION_CONFIG[
                actionModal.type
              ]?.tone === "danger" ? (
                <Ban size={24} />
              ) : ACTION_CONFIG[
                actionModal.type
              ]?.tone ===
                "warning" ? (
                <Clock3 size={24} />
              ) : (
                <ShieldCheck size={24} />
              )}
            </div>

            <div className="ah-confirm-modal__content">
              <h2>
                {
                  ACTION_CONFIG[
                    actionModal.type
                  ]?.title
                }
              </h2>

              <p>
                {
                  ACTION_CONFIG[
                    actionModal.type
                  ]?.description
                }
              </p>

              <div className="ah-confirm-modal__record">
                <Building2 size={16} />

                <span>
                  <strong>
                    {
                      actionModal.hospital
                        ?.hospitalName
                    }
                  </strong>

                  <small>
                    Hospital #
                    {
                      actionModal.hospital
                        ?.id
                    }
                  </small>
                </span>
              </div>

              {actionModal.type ===
                "FEATURE" && (
                  <div className="ah-feature-form">
                    <label className="ah-field">
                      <span>Priority</span>

                      <input
                        type="number"
                        min="0"
                        value={
                          featureForm.priority
                        }
                        onChange={(event) =>
                          setFeatureForm(
                            (current) => ({
                              ...current,
                              priority:
                                event.target
                                  .value
                            })
                          )
                        }
                      />
                    </label>

                    <label className="ah-field">
                      <span>Badge</span>

                      <input
                        value={
                          featureForm.badge
                        }
                        onChange={(event) =>
                          setFeatureForm(
                            (current) => ({
                              ...current,
                              badge:
                                event.target
                                  .value
                            })
                          )
                        }
                        maxLength={50}
                        placeholder="Top Hospital"
                      />
                    </label>

                    <label className="ah-field ah-field--span-2">
                      <span>
                        Redirect URL
                      </span>

                      <input
                        value={
                          featureForm.redirectUrl
                        }
                        onChange={(event) =>
                          setFeatureForm(
                            (current) => ({
                              ...current,
                              redirectUrl:
                                event.target
                                  .value
                            })
                          )
                        }
                        maxLength={1000}
                      />
                    </label>
                  </div>
                )}

              {![
                "FEATURE",
                "UNFEATURE",
                "SET_PRIMARY_IMAGE"
              ].includes(
                actionModal.type
              ) && (
                  <label className="ah-field ah-field--reason">
                    <span>
                      Reason{" "}
                      {ACTION_CONFIG[
                        actionModal.type
                      ]?.reasonRequired
                        ? "*"
                        : "(optional)"}
                    </span>

                    <textarea
                      rows={4}
                      value={actionReason}
                      onChange={(event) =>
                        setActionReason(
                          event.target.value
                        )
                      }
                      maxLength={1000}
                      placeholder="Add a clear reason for the audit trail"
                    />
                  </label>
                )}

              {actionError && (
                <div className="ah-form-error">
                  <Ban size={17} />
                  {actionError}
                </div>
              )}
            </div>

            <footer className="ah-confirm-modal__footer">
              <button
                type="button"
                className="ah-btn ah-btn--secondary"
                onClick={closeActionModal}
                disabled={actionSaving}
              >
                Cancel
              </button>

              <button
                type="button"
                className={`ah-btn ${ACTION_CONFIG[
                  actionModal.type
                ]?.tone === "danger"
                  ? "ah-btn--danger"
                  : "ah-btn--primary"
                  }`}
                onClick={confirmAction}
                disabled={actionSaving}
              >
                {actionSaving ? (
                  <Loader2
                    size={17}
                    className="ah-spin"
                  />
                ) : (
                  <ShieldCheck size={17} />
                )}

                {actionSaving
                  ? "Processing..."
                  : ACTION_CONFIG[
                    actionModal.type
                  ]?.confirmLabel}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
};

export default HospitalsModule;