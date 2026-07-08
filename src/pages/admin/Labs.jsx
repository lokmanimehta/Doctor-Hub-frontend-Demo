import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { createPortal } from "react-dom";

import {
  AlertTriangle,
  Archive,
  BadgeCheck,
  Ban,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleOff,
  CirclePlay,
  ClipboardList,
  Edit3,
  Eye,
  FilterX,
  FlaskConical,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  TestTube2,
  Users,
  X
} from "lucide-react";

import {
  archiveAdminLab,
  createAdminLab,
  getAdminLabById,
  getAdminLabFilterOptions,
  getAdminLabs,
  restoreAdminLab,
  updateAdminLab,
  updateAdminLabStatus,
  updateAdminLabVerification
} from "../../services/adminService";

import "./Labs.css";

/* =========================================================
   CONSTANTS
========================================================= */

const DEFAULT_FILTERS = {
  sourceType: "ALL",
  labType: "ALL",
  operationalStatus: "ALL",
  verificationStatus: "ALL",
  city: "",
  includeArchived: false,
  page: 0,
  size: 10,
  sortBy: "updatedAt",
  sortDirection: "DESC"
};

const DEFAULT_FILTER_OPTIONS = {
  sourceTypes: [],
  labTypes: [],
  operationalStatuses: [],
  verificationStatuses: [],
  cities: []
};

const EMPTY_SUMMARY = {
  totalLabs: 0,
  activeLabs: 0,
  systemVerifiedLabs: 0,
  doctorAddedLabs: 0,
  pendingVerification: 0,
  suspendedLabs: 0,
  archivedLabs: 0,
  totalOrders: 0
};

const EMPTY_FORM = {
  name: "",
  email: "",
  contactNumber: "",
  labType: "PATHOLOGY",
  addressLine1: "",
  addressLine2: "",
  area: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  servicesText: "",
  adminNote: ""
};

const ACTION_CONFIG = {
  UNDER_REVIEW: {
    title: "Move lab under review",
    description:
      "The laboratory verification will be marked as under administrative review.",
    confirmLabel: "Move under review",
    tone: "neutral",
    reasonRequired: false
  },

  VERIFY: {
    title: "Verify laboratory",
    description:
      "The doctor-added laboratory will be verified and linked with a platform system laboratory.",
    confirmLabel: "Verify laboratory",
    tone: "positive",
    reasonRequired: false
  },

  CHANGES_REQUIRED: {
    title: "Request changes",
    description:
      "Mention the corrections required before this laboratory can be verified.",
    confirmLabel: "Request changes",
    tone: "warning",
    reasonRequired: true
  },

  REJECT: {
    title: "Reject verification",
    description:
      "The rejection reason will be stored in the laboratory record and audit history.",
    confirmLabel: "Reject laboratory",
    tone: "danger",
    reasonRequired: true
  },

  ACTIVATE: {
    title: "Activate laboratory",
    description:
      "The laboratory will become available for new platform operations.",
    confirmLabel: "Activate laboratory",
    tone: "positive",
    reasonRequired: false
  },

  INACTIVATE: {
    title: "Deactivate laboratory",
    description:
      "The laboratory will become unavailable for new operations while historical records remain preserved.",
    confirmLabel: "Deactivate laboratory",
    tone: "warning",
    reasonRequired: false
  },

  SUSPEND: {
    title: "Suspend laboratory",
    description:
      "The laboratory will be blocked from new operations until an administrator activates it again.",
    confirmLabel: "Suspend laboratory",
    tone: "danger",
    reasonRequired: true
  },

  ARCHIVE: {
    title: "Archive laboratory",
    description:
      "The laboratory will be removed from the normal administration list. Active lab orders can block this action.",
    confirmLabel: "Archive laboratory",
    tone: "danger",
    reasonRequired: true
  },

  RESTORE: {
    title: "Restore laboratory",
    description:
      "The laboratory will be restored as inactive. It must be activated separately.",
    confirmLabel: "Restore laboratory",
    tone: "positive",
    reasonRequired: true
  }
};

/* =========================================================
   UTILITIES
========================================================= */

const humanize = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
};

const formatNumber = (value) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return "0";
  }

  return new Intl.NumberFormat(
    "en-IN"
  ).format(parsed);
};

const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(date);
};

const cleanOptional = (value) => {
  if (
    typeof value !== "string"
  ) {
    return value ?? null;
  }

  const cleaned = value.trim();

  return cleaned || null;
};

const normalizeServices = (
  servicesText
) => {
  return String(servicesText || "")
    .split(/[\n,]+/)
    .map((service) => service.trim())
    .filter(Boolean)
    .filter(
      (service, index, array) =>
        array.findIndex(
          (item) =>
            item.toLowerCase() ===
            service.toLowerCase()
        ) === index
    );
};

const getErrorMessage = (
  error,
  fallback = "Unable to process the request"
) => {
  const responseData =
    error?.response?.data;

  if (
    typeof responseData?.message ===
      "string" &&
    responseData.message.trim()
  ) {
    return responseData.message;
  }

  if (
    responseData &&
    typeof responseData === "object"
  ) {
    const validationMessage =
      Object.values(responseData).find(
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

const normalizeLabForm = (
  lab = null
) => {
  if (!lab) {
    return {
      ...EMPTY_FORM
    };
  }

  return {
    name: lab.name || "",
    email: lab.email || "",
    contactNumber:
      lab.contactNumber || "",
    labType:
      lab.labType || "PATHOLOGY",
    addressLine1:
      lab.addressLine1 || "",
    addressLine2:
      lab.addressLine2 || "",
    area: lab.area || "",
    city: lab.city || "",
    state: lab.state || "",
    pincode: lab.pincode || "",
    landmark: lab.landmark || "",
    servicesText:
      Array.isArray(lab.services)
        ? lab.services.join("\n")
        : "",
    adminNote:
      lab.adminNote || ""
  };
};

const validateLabForm = (form) => {
  if (!form.name.trim()) {
    return "Lab name is required";
  }

  if (!form.addressLine1.trim()) {
    return "Address line 1 is required";
  }

  if (!form.city.trim()) {
    return "City is required";
  }

  if (
    form.email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      form.email.trim()
    )
  ) {
    return "Enter a valid email address";
  }

  if (
    form.contactNumber.trim() &&
    !/^[0-9+()\-\s]{7,20}$/.test(
      form.contactNumber.trim()
    )
  ) {
    return "Enter a valid contact number";
  }

  if (
    form.pincode.trim() &&
    !/^[0-9]{4,10}$/.test(
      form.pincode.trim()
    )
  ) {
    return "Enter a valid pincode";
  }

  const services =
    normalizeServices(
      form.servicesText
    );

  if (services.length === 0) {
    return "At least one lab service is required";
  }

  if (services.length > 30) {
    return "Maximum 30 services are allowed";
  }

  const invalidService =
    services.find(
      (service) =>
        service.length > 100
    );

  if (invalidService) {
    return "Each service must be within 100 characters";
  }

  return "";
};

const buildLabPayload = (
  form,
  expectedVersion = undefined
) => {
  const payload = {
    name: form.name.trim(),
    email:
      cleanOptional(form.email),
    contactNumber:
      cleanOptional(
        form.contactNumber
      ),
    labType: form.labType,
    addressLine1:
      form.addressLine1.trim(),
    addressLine2:
      cleanOptional(
        form.addressLine2
      ),
    area:
      cleanOptional(form.area),
    city: form.city.trim(),
    state:
      cleanOptional(form.state),
    pincode:
      cleanOptional(form.pincode),
    landmark:
      cleanOptional(form.landmark),
    services:
      normalizeServices(
        form.servicesText
      ),
    adminNote:
      cleanOptional(
        form.adminNote
      )
  };

  if (
    expectedVersion !==
    undefined
  ) {
    payload.expectedVersion =
      expectedVersion;
  }

  return payload;
};

/* =========================================================
   SMALL COMPONENTS
========================================================= */

const LoadingBlock = ({
  label = "Loading..."
}) => (
  <div className="al-loading">
    <Loader2
      size={24}
      className="al-spin"
    />

    <span>{label}</span>
  </div>
);

const EmptyBlock = ({
  title,
  description
}) => (
  <div className="al-empty">
    <div className="al-empty__icon">
      <FlaskConical size={25} />
    </div>

    <h3>{title}</h3>

    <p>{description}</p>
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
    className={[
      "al-stat-card",
      `al-stat-card--${tone}`
    ].join(" ")}
  >
    <div className="al-stat-card__icon">
      {icon}
    </div>

    <div className="al-stat-card__body">
      <span>{label}</span>

      <strong>
        {formatNumber(value)}
      </strong>

      {helper && (
        <small>{helper}</small>
      )}
    </div>
  </article>
);

const StatusBadge = ({
  value,
  category = "status"
}) => {
  const normalized = String(
    value || "UNKNOWN"
  ).toLowerCase();

  return (
    <span
      className={[
        "al-badge",
        `al-badge--${category}`,
        `is-${normalized}`
      ].join(" ")}
    >
      <span
        className="al-badge__dot"
      />

      {humanize(value)}
    </span>
  );
};

const ModalPortal = ({ children }) => {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="admin-labs-portal">
      {children}
    </div>,
    document.body
  );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const Labs = () => {
  const searchTimerRef =
    useRef(null);

  const [searchInput, setSearchInput] =
    useState("");

  const [
    debouncedSearch,
    setDebouncedSearch
  ] = useState("");

  const [filters, setFilters] =
    useState(DEFAULT_FILTERS);

  const [
    filterOptions,
    setFilterOptions
  ] = useState(
    DEFAULT_FILTER_OPTIONS
  );

  const [listState, setListState] =
    useState({
      loading: true,
      refreshing: false,
      error: "",
      data: null
    });

  const [toast, setToast] =
    useState(null);

  const [
    detailsDrawer,
    setDetailsDrawer
  ] = useState({
    open: false,
    sourceType: null,
    labId: null
  });

  const [
    detailsState,
    setDetailsState
  ] = useState({
    loading: false,
    error: "",
    data: null
  });

  const [
    formModal,
    setFormModal
  ] = useState({
    open: false,
    mode: "create",
    sourceType: null,
    labId: null
  });

  const [labForm, setLabForm] =
    useState(EMPTY_FORM);

  const [
    formSaving,
    setFormSaving
  ] = useState(false);

  const [
    formError,
    setFormError
  ] = useState("");

  const [
    actionModal,
    setActionModal
  ] = useState({
    open: false,
    type: "",
    lab: null
  });

  const [
    actionReason,
    setActionReason
  ] = useState("");

  const [
    targetSystemLabId,
    setTargetSystemLabId
  ] = useState("");

  const [
    actionSaving,
    setActionSaving
  ] = useState(false);

  const [
    actionError,
    setActionError
  ] = useState("");

  const listData =
    listState.data;

  const labs =
    listData?.content || [];

  const summary =
    listData?.summary ||
    EMPTY_SUMMARY;

  const details =
    detailsState.data;

  const totalPages =
    listData?.totalPages || 0;

  const currentPage =
    listData?.page || 0;

  const actionConfig =
    ACTION_CONFIG[
      actionModal.type
    ] || null;

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

    const timer = window.setTimeout(
      () => {
        setToast(null);
      },
      3500
    );

    return () =>
      window.clearTimeout(timer);
  }, [toast]);

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
          searchInput.trim()
        );

        setFilters(
          (previous) => ({
            ...previous,
            page: 0
          })
        );
      }, 350);

    return () => {
      if (
        searchTimerRef.current
      ) {
        window.clearTimeout(
          searchTimerRef.current
        );
      }
    };
  }, [searchInput]);

  /* =======================================================
     FILTER OPTIONS
  ======================================================= */

  useEffect(() => {
    let active = true;

    const loadFilterOptions =
      async () => {
        try {
          const data =
            await getAdminLabFilterOptions();

          if (active) {
            setFilterOptions({
              sourceTypes:
                data?.sourceTypes ||
                [],
              labTypes:
                data?.labTypes ||
                [],
              operationalStatuses:
                data?.operationalStatuses ||
                [],
              verificationStatuses:
                data?.verificationStatuses ||
                [],
              cities:
                data?.cities || []
            });
          }
        } catch (error) {
          if (active) {
            showToast(
              getErrorMessage(
                error,
                "Unable to load lab filters"
              ),
              "error"
            );
          }
        }
      };

    loadFilterOptions();

    return () => {
      active = false;
    };
  }, [showToast]);

  /* =======================================================
     LIST
  ======================================================= */

  const loadLabs = useCallback(
    async ({
      refreshing = false
    } = {}) => {
      setListState(
        (previous) => ({
          ...previous,
          loading:
            !refreshing &&
            !previous.data,
          refreshing,
          error: ""
        })
      );

      try {
        const data =
          await getAdminLabs({
            search:
              debouncedSearch,
            sourceType:
              filters.sourceType,
            labType:
              filters.labType,
            operationalStatus:
              filters.operationalStatus,
            verificationStatus:
              filters.verificationStatus,
            city:
              filters.city,
            includeArchived:
              filters.includeArchived,
            page:
              filters.page,
            size:
              filters.size,
            sortBy:
              filters.sortBy,
            sortDirection:
              filters.sortDirection
          });

        setListState({
          loading: false,
          refreshing: false,
          error: "",
          data
        });
      } catch (error) {
        setListState(
          (previous) => ({
            ...previous,
            loading: false,
            refreshing: false,
            error:
              getErrorMessage(
                error,
                "Unable to load laboratories"
              )
          })
        );
      }
    },
    [
      debouncedSearch,
      filters.city,
      filters.includeArchived,
      filters.labType,
      filters.operationalStatus,
      filters.page,
      filters.size,
      filters.sortBy,
      filters.sortDirection,
      filters.sourceType,
      filters.verificationStatus
    ]
  );

  useEffect(() => {
    loadLabs();
  }, [loadLabs]);

  /* =======================================================
     DETAILS
  ======================================================= */

const loadLabDetails = useCallback(
  async (
    sourceType,
    labId
  ) => {
    const normalizedSourceType =
      String(sourceType ?? "")
        .trim()
        .toUpperCase();

    const normalizedLabId =
      Number(labId);

    if (
      ![
        "SYSTEM_VERIFIED",
        "DOCTOR_ADDED"
      ].includes(
        normalizedSourceType
      ) ||
      !Number.isInteger(
        normalizedLabId
      ) ||
      normalizedLabId <= 0
    ) {
      const message =
        "Laboratory identity is invalid. Refresh the page and try again.";

      setDetailsState({
        loading: false,
        error: message,
        data: null
      });

      return null;
    }

    setDetailsState({
      loading: true,
      error: "",
      data: null
    });

    try {
      const data =
        await getAdminLabById(
          normalizedSourceType,
          normalizedLabId
        );

      setDetailsState({
        loading: false,
        error: "",
        data
      });

      return data;
    } catch (error) {
      const message =
        getErrorMessage(
          error,
          "Unable to load laboratory details"
        );

      setDetailsState({
        loading: false,
        error: message,
        data: null
      });

      return null;
    }
  },
  []
);

 const openDetails = (
  lab
) => {
  const normalizedSourceType =
    String(
      lab?.sourceType ?? ""
    )
      .trim()
      .toUpperCase();

  const normalizedLabId =
    Number(lab?.id);

  if (
    ![
      "SYSTEM_VERIFIED",
      "DOCTOR_ADDED"
    ].includes(
      normalizedSourceType
    ) ||
    !Number.isInteger(
      normalizedLabId
    ) ||
    normalizedLabId <= 0
  ) {
    showToast(
      "Unable to open this laboratory because its identifier is missing.",
      "error"
    );

    return;
  }

  setDetailsDrawer({
    open: true,
    sourceType:
      normalizedSourceType,
    labId:
      normalizedLabId
  });

  loadLabDetails(
    normalizedSourceType,
    normalizedLabId
  );
};

  const closeDetails = () => {
    setDetailsDrawer({
      open: false,
      sourceType: null,
      labId: null
    });

    setDetailsState({
      loading: false,
      error: "",
      data: null
    });
  };

  /* =======================================================
     BODY LOCK / ESCAPE
  ======================================================= */

  const overlayOpen =
    detailsDrawer.open ||
    formModal.open ||
    actionModal.open;

  useEffect(() => {
    if (!overlayOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleEscape = (
      event
    ) => {
      if (event.key !== "Escape") {
        return;
      }

      if (
        actionModal.open &&
        !actionSaving
      ) {
        setActionModal({
          open: false,
          type: "",
          lab: null
        });

        return;
      }

      if (
        formModal.open &&
        !formSaving
      ) {
        setFormModal({
          open: false,
          mode: "create",
          sourceType: null,
          labId: null
        });

        return;
      }

      if (detailsDrawer.open) {
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
    actionModal.open,
    actionSaving,
    detailsDrawer.open,
    formModal.open,
    formSaving,
    overlayOpen
  ]);

  /* =======================================================
     FILTERS
  ======================================================= */

  const updateFilter = (
    name,
    value
  ) => {
    setFilters(
      (previous) => ({
        ...previous,
        [name]: value,
        page:
          name === "page"
            ? value
            : 0
      })
    );
  };

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setFilters(
      DEFAULT_FILTERS
    );
  };

  const filtersActive =
    Boolean(searchInput.trim()) ||
    filters.sourceType !== "ALL" ||
    filters.labType !== "ALL" ||
    filters.operationalStatus !==
      "ALL" ||
    filters.verificationStatus !==
      "ALL" ||
    Boolean(filters.city) ||
    filters.includeArchived;

  /* =======================================================
     CREATE / EDIT FORM
  ======================================================= */

  const openCreateForm = () => {
    setFormModal({
      open: true,
      mode: "create",
      sourceType: null,
      labId: null
    });

    setLabForm({
      ...EMPTY_FORM
    });

    setFormError("");
  };

  const openEditForm = () => {
    if (!details) {
      return;
    }

    setFormModal({
      open: true,
      mode: "edit",
      sourceType:
        details.sourceType,
      labId: details.id
    });

    setLabForm(
      normalizeLabForm(details)
    );

    setFormError("");
  };

  const closeForm = () => {
    if (formSaving) {
      return;
    }

    setFormModal({
      open: false,
      mode: "create",
      sourceType: null,
      labId: null
    });

    setLabForm({
      ...EMPTY_FORM
    });

    setFormError("");
  };

  const updateLabForm = (
    field,
    value
  ) => {
    setLabForm(
      (previous) => ({
        ...previous,
        [field]: value
      })
    );
  };

  const handleFormSubmit =
    async (event) => {
      event.preventDefault();

      const validationError =
        validateLabForm(labForm);

      if (validationError) {
        setFormError(
          validationError
        );
        return;
      }

      setFormSaving(true);
      setFormError("");

      try {
        let savedLab;

        if (
          formModal.mode ===
          "create"
        ) {
          savedLab =
            await createAdminLab(
              buildLabPayload(
                labForm
              )
            );
        } else {
          if (!details) {
            throw new Error(
              "Latest lab details are unavailable"
            );
          }

          savedLab =
            await updateAdminLab(
              formModal.sourceType,
              formModal.labId,
              buildLabPayload(
                labForm,
                details.version
              )
            );
        }

        showToast(
          formModal.mode ===
            "create"
            ? "Laboratory created successfully"
            : "Laboratory updated successfully"
        );

        closeForm();

        await loadLabs({
          refreshing: true
        });

        if (
          savedLab?.sourceType &&
          savedLab?.id
        ) {
          setDetailsDrawer({
            open: true,
            sourceType:
              savedLab.sourceType,
            labId: savedLab.id
          });

          await loadLabDetails(
            savedLab.sourceType,
            savedLab.id
          );
        }
      } catch (error) {
        setFormError(
          getErrorMessage(
            error,
            "Unable to save laboratory"
          )
        );
      } finally {
        setFormSaving(false);
      }
    };

  /* =======================================================
     ACTIONS
  ======================================================= */

  const openAction = (
    type
  ) => {
    if (!details) {
      return;
    }

    setActionModal({
      open: true,
      type,
      lab: details
    });

    setActionReason("");
    setTargetSystemLabId("");
    setActionError("");
  };

  const closeAction = () => {
    if (actionSaving) {
      return;
    }

    setActionModal({
      open: false,
      type: "",
      lab: null
    });

    setActionReason("");
    setTargetSystemLabId("");
    setActionError("");
  };

  const handleActionConfirm =
    async () => {
      const lab =
        actionModal.lab;

      const type =
        actionModal.type;

      if (!lab || !type) {
        return;
      }

      if (
        actionConfig?.reasonRequired &&
        !actionReason.trim()
      ) {
        setActionError(
          "Reason is required"
        );
        return;
      }

      setActionSaving(true);
      setActionError("");

      try {
        let response;

        if (
          [
            "UNDER_REVIEW",
            "VERIFY",
            "CHANGES_REQUIRED",
            "REJECT"
          ].includes(type)
        ) {
          const statusMap = {
            UNDER_REVIEW:
              "UNDER_REVIEW",
            VERIFY: "VERIFIED",
            CHANGES_REQUIRED:
              "CHANGES_REQUIRED",
            REJECT: "REJECTED"
          };

          response =
            await updateAdminLabVerification(
              lab.id,
              {
                status:
                  statusMap[type],

                reason:
                  cleanOptional(
                    actionReason
                  ),

                targetSystemLabId:
                  type === "VERIFY" &&
                  targetSystemLabId
                    ? Number(
                        targetSystemLabId
                      )
                    : null,

                expectedVersion:
                  lab.version
              }
            );
        } else if (
          [
            "ACTIVATE",
            "INACTIVATE",
            "SUSPEND"
          ].includes(type)
        ) {
          const statusMap = {
            ACTIVATE: "ACTIVE",
            INACTIVATE:
              "INACTIVE",
            SUSPEND:
              "SUSPENDED"
          };

          response =
            await updateAdminLabStatus(
              lab.sourceType,
              lab.id,
              {
                status:
                  statusMap[type],

                reason:
                  cleanOptional(
                    actionReason
                  ),

                expectedVersion:
                  lab.version
              }
            );
        } else if (
          type === "ARCHIVE"
        ) {
          response =
            await archiveAdminLab(
              lab.sourceType,
              lab.id,
              {
                reason:
                  actionReason.trim(),

                expectedVersion:
                  lab.version
              }
            );
        } else if (
          type === "RESTORE"
        ) {
          response =
            await restoreAdminLab(
              lab.sourceType,
              lab.id,
              {
                reason:
                  actionReason.trim(),

                expectedVersion:
                  lab.version
              }
            );
        } else {
          throw new Error(
            "Unsupported laboratory action"
          );
        }

        showToast(
          response?.message ||
            "Laboratory updated successfully"
        );

        closeAction();

        await loadLabs({
          refreshing: true
        });

        await loadLabDetails(
          lab.sourceType,
          lab.id
        );
      } catch (error) {
        setActionError(
          getErrorMessage(
            error,
            "Unable to update laboratory"
          )
        );
      } finally {
        setActionSaving(false);
      }
    };

  /* =======================================================
     VERIFICATION ACTION AVAILABILITY
  ======================================================= */

  const verificationActions =
    useMemo(() => {
      if (
        !details ||
        details.sourceType !==
          "DOCTOR_ADDED" ||
        details.archived
      ) {
        return [];
      }

      const status =
        details.verificationStatus;

      switch (status) {
        case "PENDING":
          return [
            "UNDER_REVIEW",
            "VERIFY",
            "CHANGES_REQUIRED",
            "REJECT"
          ];

        case "UNDER_REVIEW":
          return [
            "VERIFY",
            "CHANGES_REQUIRED",
            "REJECT"
          ];

        case "CHANGES_REQUIRED":
          return [
            "UNDER_REVIEW",
            "VERIFY",
            "REJECT"
          ];

        case "VERIFIED":
          return [
            "CHANGES_REQUIRED",
            "REJECT"
          ];

        case "REJECTED":
          return [
            "UNDER_REVIEW"
          ];

        default:
          return [];
      }
    }, [details]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="admin-labs-page">
      {/* HEADER */}
      <header className="al-page-header">
        <div className="al-page-header__copy">
          <span className="al-eyebrow">
            Platform administration
          </span>

          <h1>Laboratories</h1>

          <p>
            Manage platform laboratories,
            doctor-added laboratories,
            verification, availability and
            operational status.
          </p>
        </div>

        <div className="al-page-header__actions">
          <button
            type="button"
            className="al-btn al-btn--secondary"
            disabled={
              listState.loading ||
              listState.refreshing
            }
            onClick={() =>
              loadLabs({
                refreshing: true
              })
            }
          >
            <RefreshCw
              size={16}
              className={
                listState.refreshing
                  ? "al-spin"
                  : ""
              }
            />

            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="al-btn al-btn--primary"
            onClick={openCreateForm}
          >
            <Plus size={17} />

            <span>Add laboratory</span>
          </button>
        </div>
      </header>

      {/* STATS */}
      <section
        className="al-stats-grid"
        aria-label="Laboratory summary"
      >
        <StatCard
          icon={
            <FlaskConical
              size={20}
            />
          }
          label="Total labs"
          value={
            summary.totalLabs
          }
          helper={`${formatNumber(
            summary.totalOrders
          )} total orders`}
        />

        <StatCard
          icon={
            <CheckCircle2
              size={20}
            />
          }
          label="Active"
          value={
            summary.activeLabs
          }
          tone="success"
          helper="Available for operations"
        />

        <StatCard
          icon={
            <ShieldCheck
              size={20}
            />
          }
          label="System labs"
          value={
            summary.systemVerifiedLabs
          }
          tone="success"
          helper="Platform verified"
        />

        <StatCard
          icon={
            <Users size={20} />
          }
          label="Doctor-added"
          value={
            summary.doctorAddedLabs
          }
          helper="Added by doctors"
        />

        <StatCard
          icon={
            <AlertTriangle
              size={20}
            />
          }
          label="Pending review"
          value={
            summary.pendingVerification
          }
          tone="warning"
          helper="Requires admin action"
        />

        <StatCard
          icon={<Ban size={20} />}
          label="Suspended"
          value={
            summary.suspendedLabs
          }
          tone="danger"
          helper={`${formatNumber(
            summary.archivedLabs
          )} archived`}
        />
      </section>

      {/* FILTERS */}
      <section className="al-filter-card">
        <div className="al-filter-card__top">
          <div className="al-search-field">
            <Search
              size={17}
              aria-hidden="true"
            />

            <input
              type="search"
              value={searchInput}
              placeholder="Search name, email, phone, city or doctor..."
              aria-label="Search laboratories"
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
            />

            {searchInput && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() =>
                  setSearchInput("")
                }
              >
                <X size={15} />
              </button>
            )}
          </div>

          {filtersActive && (
            <button
              type="button"
              className="al-btn al-btn--ghost al-btn--small"
              onClick={clearFilters}
            >
              <FilterX size={15} />

              Clear filters
            </button>
          )}
        </div>

        <div className="al-filter-grid">
          <label className="al-field">
            <span>Source</span>

            <select
              value={
                filters.sourceType
              }
              onChange={(event) =>
                updateFilter(
                  "sourceType",
                  event.target.value
                )
              }
            >
              <option value="ALL">
                All sources
              </option>

              {filterOptions.sourceTypes.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {humanize(option)}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="al-field">
            <span>Lab type</span>

            <select
              value={
                filters.labType
              }
              onChange={(event) =>
                updateFilter(
                  "labType",
                  event.target.value
                )
              }
            >
              <option value="ALL">
                All lab types
              </option>

              {filterOptions.labTypes.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {humanize(option)}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="al-field">
            <span>
              Operational status
            </span>

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
                All statuses
              </option>

              {filterOptions.operationalStatuses.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {humanize(option)}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="al-field">
            <span>
              Verification
            </span>

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
                All verification states
              </option>

              {filterOptions.verificationStatuses.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {humanize(option)}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="al-field">
            <span>City</span>

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
          </label>

          <label className="al-field">
            <span>Sort order</span>

            <select
              value={`${filters.sortBy}:${filters.sortDirection}`}
              onChange={(event) => {
                const [
                  sortBy,
                  sortDirection
                ] =
                  event.target.value.split(
                    ":"
                  );

                setFilters(
                  (previous) => ({
                    ...previous,
                    sortBy,
                    sortDirection,
                    page: 0
                  })
                );
              }}
            >
              <option value="updatedAt:DESC">
                Recently updated
              </option>

              <option value="createdAt:DESC">
                Recently created
              </option>

              <option value="name:ASC">
                Name A–Z
              </option>

              <option value="name:DESC">
                Name Z–A
              </option>

              <option value="city:ASC">
                City A–Z
              </option>

              <option value="orderCount:DESC">
                Most orders
              </option>
            </select>
          </label>
        </div>

        <label className="al-checkbox">
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
            Include archived laboratories
          </span>
        </label>
      </section>

      {/* CONTENT */}
      <section className="al-table-card">
        <div className="al-table-card__header">
          <div>
            <h2>Laboratory directory</h2>

            <p>
              {formatNumber(
                listData?.totalElements || 0
              )}{" "}
              records found
            </p>
          </div>

          <label className="al-page-size">
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
              <option value={10}>
                10
              </option>

              <option value={20}>
                20
              </option>

              <option value={50}>
                50
              </option>
            </select>
          </label>
        </div>

        {listState.loading ? (
          <LoadingBlock label="Loading laboratories..." />
        ) : listState.error ? (
          <div className="al-error-panel">
            <AlertTriangle size={24} />

            <div>
              <h3>
                Unable to load laboratories
              </h3>

              <p>{listState.error}</p>
            </div>

            <button
              type="button"
              className="al-btn al-btn--secondary"
              onClick={() =>
                loadLabs()
              }
            >
              Try again
            </button>
          </div>
        ) : labs.length === 0 ? (
          <EmptyBlock
            title="No laboratories found"
            description={
              filtersActive
                ? "No laboratory matches the selected filters."
                : "No laboratory records are available yet."
            }
          />
        ) : (
          <>
            <div className="al-table-wrapper">
              <table className="al-table">
                <thead>
                  <tr>
                    <th>Laboratory</th>
                    <th>Source</th>
                    <th>Location</th>
                    <th>
                      Verification
                    </th>
                    <th>
                      Operational status
                    </th>
                    <th>Activity</th>
                    <th>Updated</th>
                    <th>
                      <span className="al-sr-only">
                        Actions
                      </span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {labs.map((lab) => (
                    <tr
                      key={lab.labKey}
                      className={
                        lab.archived
                          ? "is-archived"
                          : ""
                      }
                    >
                      <td
                        data-label="Laboratory"
                        className="al-table__primary"
                      >
                        <div className="al-lab-name">
                          <div className="al-lab-name__icon">
                            <FlaskConical
                              size={17}
                            />
                          </div>

                          <div>
                            <strong>
                              {lab.name}
                            </strong>

                            <span>
                              {humanize(
                                lab.labType
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td data-label="Source">
                        <StatusBadge
                          value={
                            lab.sourceType
                          }
                          category="source"
                        />

                        {lab.addedByName && (
                          <small className="al-cell-helper">
                            {lab.addedByName}
                          </small>
                        )}
                      </td>

                      <td data-label="Location">
                        <div className="al-location-cell">
                          <MapPin
                            size={14}
                          />

                          <span>
                            {lab.city ||
                              "—"}
                            {lab.state
                              ? `, ${lab.state}`
                              : ""}
                          </span>
                        </div>
                      </td>

                      <td data-label="Verification">
                        <StatusBadge
                          value={
                            lab.verificationStatus
                          }
                          category="verification"
                        />
                      </td>

                      <td data-label="Status">
                        <StatusBadge
                          value={
                            lab.archived
                              ? "ARCHIVED"
                              : lab.operationalStatus
                          }
                          category="status"
                        />
                      </td>

                      <td data-label="Activity">
                        <div className="al-activity-cell">
                          <span>
                            <ClipboardList
                              size={14}
                            />

                            {formatNumber(
                              lab.orderCount
                            )}{" "}
                            orders
                          </span>

                          <span>
                            <TestTube2
                              size={14}
                            />

                            {formatNumber(
                              lab.assignedTestCount
                            )}{" "}
                            tests
                          </span>
                        </div>
                      </td>

                      <td data-label="Updated">
                        <span className="al-date-cell">
                          {formatDateTime(
                            lab.updatedAt
                          )}
                        </span>
                      </td>

                      <td
                        data-label="Actions"
                        className="al-table__actions"
                      >
                        <button
                          type="button"
                          className="al-view-btn"
                          onClick={() =>
                            openDetails(
                              lab
                            )
                          }
                        >
                          <Eye size={15} />

                          <span>
                            View
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="al-pagination">
              <div className="al-pagination__summary">
                Page{" "}
                <strong>
                  {totalPages === 0
                    ? 0
                    : currentPage +
                      1}
                </strong>{" "}
                of{" "}
                <strong>
                  {totalPages}
                </strong>
              </div>

              <div className="al-pagination__buttons">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={
                    currentPage <= 0
                  }
                  onClick={() =>
                    updateFilter(
                      "page",
                      currentPage - 1
                    )
                  }
                >
                  <ChevronLeft
                    size={17}
                  />

                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  aria-label="Next page"
                  disabled={
                    totalPages === 0 ||
                    currentPage >=
                      totalPages - 1
                  }
                  onClick={() =>
                    updateFilter(
                      "page",
                      currentPage + 1
                    )
                  }
                >
                  <span>Next</span>

                  <ChevronRight
                    size={17}
                  />
                </button>
              </div>
            </footer>
          </>
        )}
      </section>

      {/* DETAILS DRAWER */}
      {detailsDrawer.open && (
        <ModalPortal>
          <div
            className="al-overlay"
            onMouseDown={
              closeDetails
            }
          >
            <aside
              className="al-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Laboratory details"
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
            >
              <div className="al-drawer__header">
                <div>
                  <span className="al-eyebrow">
                    Laboratory record
                  </span>

                  <h2>
                    {details?.name ||
                      "Laboratory details"}
                  </h2>
                </div>

                <button
                  type="button"
                  className="al-icon-btn"
                  aria-label="Close details"
                  onClick={
                    closeDetails
                  }
                >
                  <X size={19} />
                </button>
              </div>

              <div className="al-drawer__body">
                {detailsState.loading ? (
                  <LoadingBlock label="Loading laboratory details..." />
                ) : detailsState.error ? (
                  <div className="al-error-panel al-error-panel--compact">
                    <AlertTriangle
                      size={22}
                    />

                    <div>
                      <h3>
                        Unable to load details
                      </h3>

                      <p>
                        {
                          detailsState.error
                        }
                      </p>
                    </div>
                  </div>
                ) : details ? (
                  <>
                    <div className="al-detail-status-row">
                      <StatusBadge
                        value={
                          details.sourceType
                        }
                        category="source"
                      />

                      <StatusBadge
                        value={
                          details.verificationStatus
                        }
                        category="verification"
                      />

                      <StatusBadge
                        value={
                          details.archived
                            ? "ARCHIVED"
                            : details.operationalStatus
                        }
                        category="status"
                      />
                    </div>

                    {details.archived && (
                      <div className="al-notice al-notice--warning">
                        <Archive
                          size={18}
                        />

                        <div>
                          <strong>
                            Archived laboratory
                          </strong>

                          <span>
                            This record is hidden
                            from normal operational
                            lists.
                          </span>
                        </div>
                      </div>
                    )}

                    {details.sourceType ===
                      "DOCTOR_ADDED" &&
                      details.verificationStatus !==
                        "VERIFIED" && (
                        <div className="al-notice al-notice--warning">
                          <AlertTriangle
                            size={18}
                          />

                          <div>
                            <strong>
                              Verification required
                            </strong>

                            <span>
                              This laboratory was
                              added by a doctor and
                              is not currently
                              platform verified.
                            </span>
                          </div>
                        </div>
                      )}

                    <section className="al-detail-section">
                      <div className="al-detail-section__heading">
                        <h3>
                          Basic information
                        </h3>
                      </div>

                      <div className="al-detail-grid">
                        <div className="al-detail-field">
                          <span>
                            Lab type
                          </span>

                          <strong>
                            {humanize(
                              details.labType
                            )}
                          </strong>
                        </div>

                        <div className="al-detail-field">
                          <span>
                            Payment mode
                          </span>

                          <strong>
                            {humanize(
                              details.paymentMode
                            )}
                          </strong>
                        </div>

                        <div className="al-detail-field">
                          <span>Email</span>

                          {details.email ? (
                            <a
                              href={`mailto:${details.email}`}
                            >
                              <Mail
                                size={14}
                              />

                              {
                                details.email
                              }
                            </a>
                          ) : (
                            <strong>—</strong>
                          )}
                        </div>

                        <div className="al-detail-field">
                          <span>
                            Contact
                          </span>

                          {details.contactNumber ? (
                            <a
                              href={`tel:${details.contactNumber}`}
                            >
                              <Phone
                                size={14}
                              />

                              {
                                details.contactNumber
                              }
                            </a>
                          ) : (
                            <strong>—</strong>
                          )}
                        </div>

                        <div className="al-detail-field al-detail-field--wide">
                          <span>
                            Full address
                          </span>

                          <strong>
                            {[
                              details.addressLine1,
                              details.addressLine2,
                              details.area,
                              details.city,
                              details.state,
                              details.pincode
                            ]
                              .filter(
                                Boolean
                              )
                              .join(", ") ||
                              "—"}
                          </strong>
                        </div>

                        <div className="al-detail-field al-detail-field--wide">
                          <span>
                            Landmark
                          </span>

                          <strong>
                            {details.landmark ||
                              "—"}
                          </strong>
                        </div>
                      </div>
                    </section>

                    <section className="al-detail-section">
                      <div className="al-detail-section__heading">
                        <h3>
                          Usage statistics
                        </h3>
                      </div>

                      <div className="al-mini-stats">
                        <div>
                          <ClipboardList
                            size={18}
                          />

                          <span>
                            Orders
                          </span>

                          <strong>
                            {formatNumber(
                              details.stats
                                ?.orderCount
                            )}
                          </strong>
                        </div>

                        <div>
                          <TestTube2
                            size={18}
                          />

                          <span>
                            Assigned tests
                          </span>

                          <strong>
                            {formatNumber(
                              details.stats
                                ?.assignedTestCount
                            )}
                          </strong>
                        </div>

                        <div>
                          <Users
                            size={18}
                          />

                          <span>
                            Active doctors
                          </span>

                          <strong>
                            {formatNumber(
                              details.stats
                                ?.activeDoctorCount
                            )}
                          </strong>
                        </div>
                      </div>
                    </section>

                    <section className="al-detail-section">
                      <div className="al-detail-section__heading">
                        <h3>Services</h3>

                        <span>
                          {formatNumber(
                            details.services
                              ?.length
                          )}
                        </span>
                      </div>

                      <div className="al-service-list">
                        {details.services
                          ?.length ? (
                          details.services.map(
                            (service) => (
                              <span
                                key={service}
                              >
                                <Check
                                  size={13}
                                />

                                {service}
                              </span>
                            )
                          )
                        ) : (
                          <p>
                            No services added.
                          </p>
                        )}
                      </div>
                    </section>

                    {details.sourceType ===
                      "DOCTOR_ADDED" && (
                      <section className="al-detail-section">
                        <div className="al-detail-section__heading">
                          <h3>
                            Doctor ownership
                          </h3>
                        </div>

                        <div className="al-detail-grid">
                          <div className="al-detail-field">
                            <span>
                              Doctor
                            </span>

                            <strong>
                              {details.ownerDoctorName ||
                                "—"}
                            </strong>
                          </div>

                          <div className="al-detail-field">
                            <span>
                              Doctor email
                            </span>

                            <strong>
                              {details.ownerDoctorEmail ||
                                "—"}
                            </strong>
                          </div>

                          <div className="al-detail-field">
                            <span>
                              Linked system lab
                            </span>

                            <strong>
                              {details.linkedSystemLabId
                                ? `#${details.linkedSystemLabId}`
                                : "Not linked"}
                            </strong>
                          </div>

                          <div className="al-detail-field">
                            <span>
                              Verification reason
                            </span>

                            <strong>
                              {details.verificationReason ||
                                "—"}
                            </strong>
                          </div>
                        </div>
                      </section>
                    )}

                    <section className="al-detail-section">
                      <div className="al-detail-section__heading">
                        <h3>
                          Record information
                        </h3>
                      </div>

                      <div className="al-detail-grid">
                        <div className="al-detail-field">
                          <span>
                            Created
                          </span>

                          <strong>
                            {formatDateTime(
                              details.createdAt
                            )}
                          </strong>
                        </div>

                        <div className="al-detail-field">
                          <span>
                            Last updated
                          </span>

                          <strong>
                            {formatDateTime(
                              details.updatedAt
                            )}
                          </strong>
                        </div>

                        <div className="al-detail-field">
                          <span>
                            Record version
                          </span>

                          <strong>
                            {details.version}
                          </strong>
                        </div>

                        <div className="al-detail-field">
                          <span>
                            Status reason
                          </span>

                          <strong>
                            {details.statusReason ||
                              "—"}
                          </strong>
                        </div>

                        {details.adminNote && (
                          <div className="al-detail-field al-detail-field--wide">
                            <span>
                              Admin note
                            </span>

                            <strong>
                              {
                                details.adminNote
                              }
                            </strong>
                          </div>
                        )}
                      </div>
                    </section>
                  </>
                ) : null}
              </div>

              {details && (
                <div className="al-drawer__footer">
                  {details.archived ? (
                    <button
                      type="button"
                      className="al-btn al-btn--primary"
                      onClick={() =>
                        openAction(
                          "RESTORE"
                        )
                      }
                    >
                      <RotateCcw
                        size={16}
                      />

                      Restore laboratory
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="al-btn al-btn--secondary"
                        onClick={
                          openEditForm
                        }
                      >
                        <Edit3
                          size={16}
                        />

                        Edit
                      </button>

                      {details.operationalStatus ===
                        "ACTIVE" && (
                        <>
                          <button
                            type="button"
                            className="al-btn al-btn--secondary"
                            onClick={() =>
                              openAction(
                                "INACTIVATE"
                              )
                            }
                          >
                            <CircleOff
                              size={16}
                            />

                            Deactivate
                          </button>

                          <button
                            type="button"
                            className="al-btn al-btn--danger-soft"
                            onClick={() =>
                              openAction(
                                "SUSPEND"
                              )
                            }
                          >
                            <Ban
                              size={16}
                            />

                            Suspend
                          </button>
                        </>
                      )}

                      {details.operationalStatus ===
                        "INACTIVE" && (
                        <button
                          type="button"
                          className="al-btn al-btn--primary"
                          onClick={() =>
                            openAction(
                              "ACTIVATE"
                            )
                          }
                        >
                          <CirclePlay
                            size={16}
                          />

                          Activate
                        </button>
                      )}

                      {details.operationalStatus ===
                        "SUSPENDED" && (
                        <>
                          <button
                            type="button"
                            className="al-btn al-btn--primary"
                            onClick={() =>
                              openAction(
                                "ACTIVATE"
                              )
                            }
                          >
                            <CirclePlay
                              size={16}
                            />

                            Activate
                          </button>

                          <button
                            type="button"
                            className="al-btn al-btn--secondary"
                            onClick={() =>
                              openAction(
                                "INACTIVATE"
                              )
                            }
                          >
                            <CircleOff
                              size={16}
                            />

                            Set inactive
                          </button>
                        </>
                      )}

                      {verificationActions.map(
                        (action) => (
                          <button
                            key={action}
                            type="button"
                            className={[
                              "al-btn",
                              action ===
                              "VERIFY"
                                ? "al-btn--primary"
                                : action ===
                                    "REJECT"
                                  ? "al-btn--danger-soft"
                                  : "al-btn--secondary"
                            ].join(" ")}
                            onClick={() =>
                              openAction(
                                action
                              )
                            }
                          >
                            {action ===
                              "VERIFY" && (
                              <BadgeCheck
                                size={16}
                              />
                            )}

                            {action ===
                              "UNDER_REVIEW" && (
                              <Eye
                                size={16}
                              />
                            )}

                            {action ===
                              "CHANGES_REQUIRED" && (
                              <AlertTriangle
                                size={16}
                              />
                            )}

                            {action ===
                              "REJECT" && (
                              <X
                                size={16}
                              />
                            )}

                            {action ===
                              "UNDER_REVIEW"
                              ? "Under review"
                              : action ===
                                  "VERIFY"
                                ? "Verify"
                                : action ===
                                    "CHANGES_REQUIRED"
                                  ? "Request changes"
                                  : "Reject"}
                          </button>
                        )
                      )}

                      <button
                        type="button"
                        className="al-btn al-btn--danger-ghost"
                        onClick={() =>
                          openAction(
                            "ARCHIVE"
                          )
                        }
                      >
                        <Archive
                          size={16}
                        />

                        Archive
                      </button>
                    </>
                  )}
                </div>
              )}
            </aside>
          </div>
        </ModalPortal>
      )}

      {/* CREATE / EDIT MODAL */}
      {formModal.open && (
        <ModalPortal>
          <div
            className="al-overlay al-overlay--center"
            onMouseDown={closeForm}
          >
            <section
              className="al-modal al-modal--large"
              role="dialog"
              aria-modal="true"
              aria-label={
                formModal.mode ===
                "create"
                  ? "Add laboratory"
                  : "Edit laboratory"
              }
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
            >
              <div className="al-modal__header">
                <div>
                  <span className="al-eyebrow">
                    {formModal.mode ===
                    "create"
                      ? "New platform laboratory"
                      : "Update laboratory"}
                  </span>

                  <h2>
                    {formModal.mode ===
                    "create"
                      ? "Add laboratory"
                      : "Edit laboratory"}
                  </h2>
                </div>

                <button
                  type="button"
                  className="al-icon-btn"
                  aria-label="Close form"
                  disabled={
                    formSaving
                  }
                  onClick={closeForm}
                >
                  <X size={19} />
                </button>
              </div>

              <form
                onSubmit={
                  handleFormSubmit
                }
              >
                <div className="al-modal__body">
                  {formError && (
                    <div className="al-form-error">
                      <AlertTriangle
                        size={17}
                      />

                      <span>
                        {formError}
                      </span>
                    </div>
                  )}

                  <div className="al-form-grid">
                    <label className="al-field al-field--wide">
                      <span>
                        Laboratory name
                        <b>*</b>
                      </span>

                      <input
                        type="text"
                        maxLength={150}
                        value={
                          labForm.name
                        }
                        placeholder="Enter laboratory name"
                        onChange={(
                          event
                        ) =>
                          updateLabForm(
                            "name",
                            event.target
                              .value
                          )
                        }
                      />
                    </label>

                    <label className="al-field">
                      <span>
                        Lab type
                        <b>*</b>
                      </span>

                      <select
                        value={
                          labForm.labType
                        }
                        onChange={(
                          event
                        ) =>
                          updateLabForm(
                            "labType",
                            event.target
                              .value
                          )
                        }
                      >
                        {(
                          filterOptions.labTypes
                            .length
                            ? filterOptions.labTypes
                            : [
                                "PATHOLOGY",
                                "RADIOLOGY",
                                "DIAGNOSTIC_CENTER",
                                "COLLECTION_CENTER",
                                "MULTI_SPECIALITY"
                              ]
                        ).map(
                          (option) => (
                            <option
                              key={
                                option
                              }
                              value={
                                option
                              }
                            >
                              {humanize(
                                option
                              )}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label className="al-field">
                      <span>Email</span>

                      <input
                        type="email"
                        maxLength={180}
                        value={
                          labForm.email
                        }
                        placeholder="lab@example.com"
                        onChange={(
                          event
                        ) =>
                          updateLabForm(
                            "email",
                            event.target
                              .value
                          )
                        }
                      />
                    </label>

                    <label className="al-field">
                      <span>
                        Contact number
                      </span>

                      <input
                        type="tel"
                        maxLength={20}
                        value={
                          labForm.contactNumber
                        }
                        placeholder="9876543210"
                        onChange={(
                          event
                        ) =>
                          updateLabForm(
                            "contactNumber",
                            event.target
                              .value
                          )
                        }
                      />
                    </label>

                    <label className="al-field al-field--wide">
                      <span>
                        Address line 1
                        <b>*</b>
                      </span>

                      <input
                        type="text"
                        maxLength={255}
                        value={
                          labForm.addressLine1
                        }
                        placeholder="Building, road or street"
                        onChange={(
                          event
                        ) =>
                          updateLabForm(
                            "addressLine1",
                            event.target
                              .value
                          )
                        }
                      />
                    </label>

                    <label className="al-field al-field--wide">
                      <span>
                        Address line 2
                      </span>

                      <input
                        type="text"
                        maxLength={255}
                        value={
                          labForm.addressLine2
                        }
                        placeholder="Floor, suite or locality"
                        onChange={(
                          event
                        ) =>
                          updateLabForm(
                            "addressLine2",
                            event.target
                              .value
                          )
                        }
                      />
                    </label>

                    <label className="al-field">
                      <span>Area</span>

                      <input
                        type="text"
                        maxLength={100}
                        value={
                          labForm.area
                        }
                        placeholder="Area"
                        onChange={(
                          event
                        ) =>
                          updateLabForm(
                            "area",
                            event.target
                              .value
                          )
                        }
                      />
                    </label>

                    <label className="al-field">
                      <span>
                        City
                        <b>*</b>
                      </span>

                      <input
                        type="text"
                        maxLength={100}
                        value={
                          labForm.city
                        }
                        placeholder="Mumbai"
                        onChange={(
                          event
                        ) =>
                          updateLabForm(
                            "city",
                            event.target
                              .value
                          )
                        }
                      />
                    </label>

                    <label className="al-field">
                      <span>State</span>

                      <input
                        type="text"
                        maxLength={100}
                        value={
                          labForm.state
                        }
                        placeholder="Maharashtra"
                        onChange={(
                          event
                        ) =>
                          updateLabForm(
                            "state",
                            event.target
                              .value
                          )
                        }
                      />
                    </label>

                    <label className="al-field">
                      <span>
                        Pincode
                      </span>

                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        value={
                          labForm.pincode
                        }
                        placeholder="400001"
                        onChange={(
                          event
                        ) =>
                          updateLabForm(
                            "pincode",
                            event.target
                              .value
                          )
                        }
                      />
                    </label>

                    <label className="al-field al-field--wide">
                      <span>
                        Landmark
                      </span>

                      <input
                        type="text"
                        maxLength={150}
                        value={
                          labForm.landmark
                        }
                        placeholder="Nearby landmark"
                        onChange={(
                          event
                        ) =>
                          updateLabForm(
                            "landmark",
                            event.target
                              .value
                          )
                        }
                      />
                    </label>

                    <label className="al-field al-field--wide">
                      <span>
                        Services
                        <b>*</b>
                      </span>

                      <textarea
                        rows={5}
                        value={
                          labForm.servicesText
                        }
                        placeholder={
                          "Blood Test\nUrine Test\nDigital X-Ray"
                        }
                        onChange={(
                          event
                        ) =>
                          updateLabForm(
                            "servicesText",
                            event.target
                              .value
                          )
                        }
                      />

                      <small>
                        Enter one service
                        per line or separate
                        services with commas.
                      </small>
                    </label>

                    <label className="al-field al-field--wide">
                      <span>
                        Admin note
                      </span>

                      <textarea
                        rows={4}
                        maxLength={5000}
                        value={
                          labForm.adminNote
                        }
                        placeholder="Internal administration note"
                        onChange={(
                          event
                        ) =>
                          updateLabForm(
                            "adminNote",
                            event.target
                              .value
                          )
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="al-modal__footer">
                  <button
                    type="button"
                    className="al-btn al-btn--secondary"
                    disabled={
                      formSaving
                    }
                    onClick={closeForm}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="al-btn al-btn--primary"
                    disabled={
                      formSaving
                    }
                  >
                    {formSaving ? (
                      <Loader2
                        size={17}
                        className="al-spin"
                      />
                    ) : formModal.mode ===
                      "create" ? (
                      <Plus
                        size={17}
                      />
                    ) : (
                      <Check
                        size={17}
                      />
                    )}

                    {formSaving
                      ? "Saving..."
                      : formModal.mode ===
                          "create"
                        ? "Create laboratory"
                        : "Save changes"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </ModalPortal>
      )}

      {/* ACTION MODAL */}
      {actionModal.open &&
        actionConfig && (
          <ModalPortal>
            <div
              className="al-overlay al-overlay--center"
              onMouseDown={
                closeAction
              }
            >
              <section
                className="al-modal al-modal--action"
                role="dialog"
                aria-modal="true"
                aria-label={
                  actionConfig.title
                }
                onMouseDown={(
                  event
                ) =>
                  event.stopPropagation()
                }
              >
                <div className="al-modal__header">
                  <div>
                    <span className="al-eyebrow">
                      Administrative action
                    </span>

                    <h2>
                      {
                        actionConfig.title
                      }
                    </h2>
                  </div>

                  <button
                    type="button"
                    className="al-icon-btn"
                    aria-label="Close action"
                    disabled={
                      actionSaving
                    }
                    onClick={
                      closeAction
                    }
                  >
                    <X size={19} />
                  </button>
                </div>

                <div className="al-modal__body">
                  <div
                    className={[
                      "al-action-summary",
                      `al-action-summary--${actionConfig.tone}`
                    ].join(" ")}
                  >
                    <AlertTriangle
                      size={20}
                    />

                    <div>
                      <strong>
                        {actionModal.lab
                          ?.name}
                      </strong>

                      <p>
                        {
                          actionConfig.description
                        }
                      </p>
                    </div>
                  </div>

                  {actionError && (
                    <div className="al-form-error">
                      <AlertTriangle
                        size={17}
                      />

                      <span>
                        {actionError}
                      </span>
                    </div>
                  )}

                  {actionModal.type ===
                    "VERIFY" && (
                    <label className="al-field">
                      <span>
                        Existing system lab ID
                      </span>

                      <input
                        type="number"
                        min="1"
                        value={
                          targetSystemLabId
                        }
                        placeholder="Optional"
                        onChange={(
                          event
                        ) =>
                          setTargetSystemLabId(
                            event.target
                              .value
                          )
                        }
                      />

                      <small>
                        Leave blank to
                        create a new linked
                        system lab. Enter an
                        ID only when the same
                        platform lab already
                        exists.
                      </small>
                    </label>
                  )}

                  <label className="al-field">
                    <span>
                      Reason
                      {actionConfig.reasonRequired && (
                        <b>*</b>
                      )}
                    </span>

                    <textarea
                      rows={4}
                      maxLength={1000}
                      value={
                        actionReason
                      }
                      placeholder={
                        actionConfig.reasonRequired
                          ? "Enter a clear administrative reason"
                          : "Optional administrative note"
                      }
                      onChange={(
                        event
                      ) =>
                        setActionReason(
                          event.target
                            .value
                        )
                      }
                    />
                  </label>
                </div>

                <div className="al-modal__footer">
                  <button
                    type="button"
                    className="al-btn al-btn--secondary"
                    disabled={
                      actionSaving
                    }
                    onClick={
                      closeAction
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className={[
                      "al-btn",
                      actionConfig.tone ===
                      "danger"
                        ? "al-btn--danger"
                        : "al-btn--primary"
                    ].join(" ")}
                    disabled={
                      actionSaving
                    }
                    onClick={
                      handleActionConfirm
                    }
                  >
                    {actionSaving && (
                      <Loader2
                        size={17}
                        className="al-spin"
                      />
                    )}

                    {
                      actionConfig.confirmLabel
                    }
                  </button>
                </div>
              </section>
            </div>
          </ModalPortal>
        )}

      {/* TOAST */}
      {toast && (
        <ModalPortal>
          <div
            className={[
              "al-toast",
              `al-toast--${toast.type}`
            ].join(" ")}
            role="status"
          >
            {toast.type ===
            "error" ? (
              <AlertTriangle
                size={18}
              />
            ) : (
              <CheckCircle2
                size={18}
              />
            )}

            <span>
              {toast.message}
            </span>

            <button
              type="button"
              aria-label="Close notification"
              onClick={() =>
                setToast(null)
              }
            >
              <X size={15} />
            </button>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default Labs;