import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  archiveAdminAdvertisement,
  createAdminAdvertisement,
  getAdminAdvertisementById,
  getAdminAdvertisementFilterOptions,
  getAdminAdvertisementSummary,
  getAdminAdvertisements,
  restoreAdminAdvertisement,
  updateAdminAdvertisement,
  updateAdminAdvertisementStatus
} from "../../services/adminService";

import "./AdsManagement.css";

const EMPTY_SUMMARY = {
  total: 0,
  draft: 0,
  scheduled: 0,
  live: 0,
  paused: 0,
  expired: 0,
  archived: 0
};

const FALLBACK_FILTER_OPTIONS = {
  placements: [],
  audiences: ["ALL", "PUBLIC", "PATIENT", "DOCTOR"],
  configuredStatuses: [
    "DRAFT",
    "ACTIVE",
    "PAUSED",
    "ARCHIVED"
  ],
  effectiveStatuses: [
    "DRAFT",
    "SCHEDULED",
    "LIVE",
    "PAUSED",
    "EXPIRED",
    "ARCHIVED"
  ],
  devices: ["DESKTOP", "MOBILE"]
};

const createEmptyForm = () => ({
  internalTitle: "",
  headline: "",
  description: "",
  sponsorName: "Sucura",
  ctaLabel: "",
  destinationUrl: "",
  placement: "HOME_TOP",
  audience: "PUBLIC",
  status: "DRAFT",
  imageAltText: "",
  startAt: "",
  endAt: "",
  priority: "100",
  openInNewTab: false,
  removeDesktopImage: false,
  removeMobileImage: false
});

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png"
];

const formatEnumLabel = (value) => {
  if (!value) {
    return "—";
  }

  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
};

const formatDateTime = (value) => {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
};

const toDateTimeLocalInput = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timezoneOffset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 16);
};

const toEpochMilliseconds = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value).getTime();

  return Number.isNaN(parsed) ? null : parsed;
};

const getErrorMessage = (error) => {
  const responseData = error?.response?.data;

  if (typeof responseData?.message === "string") {
    return responseData.message;
  }

  if (
    responseData &&
    typeof responseData === "object" &&
    !Array.isArray(responseData)
  ) {
    const fieldMessages = Object.entries(responseData)
      .filter(([, value]) => typeof value === "string")
      .map(([field, value]) => `${field}: ${value}`);

    if (fieldMessages.length > 0) {
      return fieldMessages.join(", ");
    }
  }

  if (typeof error?.message === "string") {
    return error.message;
  }

  return "Unable to complete the requested action.";
};

const readImageDimensions = (file) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight
      });

      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Selected image could not be read."));
    };

    image.src = objectUrl;
  });

const AdsManagement = () => {
  const formSectionRef = useRef(null);
  const desktopInputRef = useRef(null);
  const mobileInputRef = useRef(null);

  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  const [filterOptions, setFilterOptions] = useState(
    FALLBACK_FILTER_OPTIONS
  );

  const [advertisements, setAdvertisements] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    placement: "ALL",
    audience: "ALL",
    configuredStatus: "ALL",
    effectiveStatus: "ALL",
    includeArchived: false
  });

  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0
  });

  const [sort, setSort] = useState({
    sortBy: "updatedAt",
    sortDirection: "DESC"
  });

  const [form, setForm] = useState(createEmptyForm);

  const [editingId, setEditingId] = useState(null);
  const [editingVersion, setEditingVersion] = useState(null);

  const [existingImages, setExistingImages] = useState({
    desktopUrl: "",
    desktopWidth: null,
    desktopHeight: null,
    mobileUrl: "",
    mobileWidth: null,
    mobileHeight: null
  });

  const [imageFiles, setImageFiles] = useState({
    desktop: null,
    mobile: null
  });

  const [imagePreviews, setImagePreviews] = useState({
    desktop: "",
    mobile: ""
  });

  const [previewDevice, setPreviewDevice] =
    useState("DESKTOP");

  const [loadingList, setLoadingList] = useState(true);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingLoadingId, setEditingLoadingId] =
    useState(null);
  const [actionLoadingId, setActionLoadingId] =
    useState(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [confirmation, setConfirmation] = useState(null);

  const selectedPlacement = useMemo(() => {
    return (
      filterOptions.placements.find(
        (option) => option.value === form.placement
      ) || null
    );
  }, [filterOptions.placements, form.placement]);

  const currentPreviewUrl =
    previewDevice === "MOBILE"
      ? imagePreviews.mobile || imagePreviews.desktop
      : imagePreviews.desktop;

  const currentPreviewIsFallback =
    previewDevice === "MOBILE" &&
    !imagePreviews.mobile &&
    Boolean(imagePreviews.desktop);

  const previewAspectRatio = useMemo(() => {
    if (!selectedPlacement) {
      return previewDevice === "MOBILE"
        ? "4 / 3"
        : "4 / 1";
    }

    if (previewDevice === "MOBILE") {
      return `${selectedPlacement.recommendedMobileWidth} / ${selectedPlacement.recommendedMobileHeight}`;
    }

    return `${selectedPlacement.recommendedDesktopWidth} / ${selectedPlacement.recommendedDesktopHeight}`;
  }, [previewDevice, selectedPlacement]);

  const revokeBlobPreview = useCallback((url) => {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }, []);

  useEffect(() => {
    return () => {
      revokeBlobPreview(imagePreviews.desktop);
      revokeBlobPreview(imagePreviews.mobile);
    };
  }, [
    imagePreviews.desktop,
    imagePreviews.mobile,
    revokeBlobPreview
  ]);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const loadMetaData = useCallback(async () => {
    setLoadingMeta(true);

    try {
      const [summaryResponse, optionsResponse] =
        await Promise.all([
          getAdminAdvertisementSummary(),
          getAdminAdvertisementFilterOptions()
        ]);

      setSummary(summaryResponse || EMPTY_SUMMARY);

      setFilterOptions({
        placements: optionsResponse?.placements || [],
        audiences:
          optionsResponse?.audiences ||
          FALLBACK_FILTER_OPTIONS.audiences,
        configuredStatuses:
          optionsResponse?.configuredStatuses ||
          FALLBACK_FILTER_OPTIONS.configuredStatuses,
        effectiveStatuses:
          optionsResponse?.effectiveStatuses ||
          FALLBACK_FILTER_OPTIONS.effectiveStatuses,
        devices:
          optionsResponse?.devices ||
          FALLBACK_FILTER_OPTIONS.devices
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  const loadAdvertisements = useCallback(async () => {
    setLoadingList(true);

    try {
      const response = await getAdminAdvertisements({
        ...filters,
        page: pagination.page,
        size: pagination.size,
        sortBy: sort.sortBy,
        sortDirection: sort.sortDirection
      });

      setAdvertisements(response?.advertisements || []);

      setPagination((previous) => ({
        ...previous,
        page: response?.page ?? previous.page,
        size: response?.size ?? previous.size,
        totalElements: response?.totalElements ?? 0,
        totalPages: response?.totalPages ?? 0
      }));
    } catch (error) {
      setAdvertisements([]);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoadingList(false);
    }
  }, [
    filters,
    pagination.page,
    pagination.size,
    sort.sortBy,
    sort.sortDirection
  ]);

  useEffect(() => {
    loadMetaData();
  }, [loadMetaData]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadAdvertisements();
    }, filters.search ? 350 : 0);

    return () => window.clearTimeout(timer);
  }, [loadAdvertisements, filters.search]);

  const refreshCampaignData = async () => {
    const [summaryResponse] = await Promise.all([
      getAdminAdvertisementSummary(),
      loadAdvertisements()
    ]);

    setSummary(summaryResponse || EMPTY_SUMMARY);
  };

  const resetFileInputs = () => {
    if (desktopInputRef.current) {
      desktopInputRef.current.value = "";
    }

    if (mobileInputRef.current) {
      mobileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    revokeBlobPreview(imagePreviews.desktop);
    revokeBlobPreview(imagePreviews.mobile);

    setForm(createEmptyForm());
    setEditingId(null);
    setEditingVersion(null);

    setExistingImages({
      desktopUrl: "",
      desktopWidth: null,
      desktopHeight: null,
      mobileUrl: "",
      mobileWidth: null,
      mobileHeight: null
    });

    setImageFiles({
      desktop: null,
      mobile: null
    });

    setImagePreviews({
      desktop: "",
      mobile: ""
    });

    setPreviewDevice("DESKTOP");
    resetFileInputs();
  };

  const scrollToForm = () => {
    window.requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  };

  const handleCreateNew = () => {
    setErrorMessage("");
    resetForm();
    scrollToForm();
  };

  const handleFilterChange = (event) => {
    const { name, value, type, checked } = event.target;

    setPagination((previous) => ({
      ...previous,
      page: 0
    }));

    setFilters((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      placement: "ALL",
      audience: "ALL",
      configuredStatus: "ALL",
      effectiveStatus: "ALL",
      includeArchived: false
    });

    setSort({
      sortBy: "updatedAt",
      sortDirection: "DESC"
    });

    setPagination((previous) => ({
      ...previous,
      page: 0
    }));
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const validateImageFile = async (file, device) => {
    if (!file) {
      throw new Error("Please select a valid image.");
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error(
        "Only JPG, JPEG and PNG advertisement images are allowed."
      );
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error(
        "Advertisement image cannot exceed 5 MB."
      );
    }

    const dimensions = await readImageDimensions(file);

    if (selectedPlacement) {
      const minimumWidth =
        device === "DESKTOP"
          ? selectedPlacement.minimumDesktopWidth
          : selectedPlacement.minimumMobileWidth;

      const minimumHeight =
        device === "DESKTOP"
          ? selectedPlacement.minimumDesktopHeight
          : selectedPlacement.minimumMobileHeight;

      if (
        dimensions.width < minimumWidth ||
        dimensions.height < minimumHeight
      ) {
        throw new Error(
          `${formatEnumLabel(device)} image must be at least ` +
            `${minimumWidth} × ${minimumHeight} pixels for ` +
            `${selectedPlacement.label}.`
        );
      }
    }

    return dimensions;
  };

  const handleImageSelection = async (event, device) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setErrorMessage("");

    try {
      await validateImageFile(file, device);

      const previewUrl = URL.createObjectURL(file);

      if (device === "DESKTOP") {
        revokeBlobPreview(imagePreviews.desktop);

        setImageFiles((previous) => ({
          ...previous,
          desktop: file
        }));

        setImagePreviews((previous) => ({
          ...previous,
          desktop: previewUrl
        }));

        setForm((previous) => ({
          ...previous,
          removeDesktopImage: false
        }));
      } else {
        revokeBlobPreview(imagePreviews.mobile);

        setImageFiles((previous) => ({
          ...previous,
          mobile: file
        }));

        setImagePreviews((previous) => ({
          ...previous,
          mobile: previewUrl
        }));

        setForm((previous) => ({
          ...previous,
          removeMobileImage: false
        }));
      }
    } catch (error) {
      event.target.value = "";
      setErrorMessage(getErrorMessage(error));
    }
  };

  const handleRemoveImageChange = (event, device) => {
    const checked = event.target.checked;

    if (device === "DESKTOP") {
      setForm((previous) => ({
        ...previous,
        removeDesktopImage: checked
      }));

      if (checked) {
        revokeBlobPreview(imagePreviews.desktop);

        setImageFiles((previous) => ({
          ...previous,
          desktop: null
        }));

        setImagePreviews((previous) => ({
          ...previous,
          desktop: ""
        }));

        if (desktopInputRef.current) {
          desktopInputRef.current.value = "";
        }
      } else {
        setImagePreviews((previous) => ({
          ...previous,
          desktop: existingImages.desktopUrl
        }));
      }
    } else {
      setForm((previous) => ({
        ...previous,
        removeMobileImage: checked
      }));

      if (checked) {
        revokeBlobPreview(imagePreviews.mobile);

        setImageFiles((previous) => ({
          ...previous,
          mobile: null
        }));

        setImagePreviews((previous) => ({
          ...previous,
          mobile: ""
        }));

        if (mobileInputRef.current) {
          mobileInputRef.current.value = "";
        }
      } else {
        setImagePreviews((previous) => ({
          ...previous,
          mobile: existingImages.mobileUrl
        }));
      }
    }
  };

  const validateForm = () => {
    const requiredFields = [
      ["internalTitle", "Internal campaign title"],
      ["headline", "Public headline"],
      ["sponsorName", "Sponsor name"],
      ["ctaLabel", "CTA label"],
      ["destinationUrl", "Destination URL"],
      ["imageAltText", "Image alternative text"]
    ];

    for (const [fieldName, label] of requiredFields) {
      if (!String(form[fieldName] || "").trim()) {
        return `${label} is required.`;
      }
    }

    const destinationUrl = form.destinationUrl.trim();

    const validInternalRoute =
      destinationUrl.startsWith("/") &&
      !destinationUrl.startsWith("//");

    const validExternalUrl =
      /^https?:\/\/[^\s]+$/i.test(destinationUrl);

    if (!validInternalRoute && !validExternalUrl) {
      return (
        "Destination URL must be an internal route starting " +
        "with / or a valid HTTP/HTTPS URL."
      );
    }

    const hasStartAt = Boolean(form.startAt);
    const hasEndAt = Boolean(form.endAt);

    if (hasStartAt !== hasEndAt) {
      return "Start and end date-time must be provided together.";
    }

    const startAt = toEpochMilliseconds(form.startAt);
    const endAt = toEpochMilliseconds(form.endAt);

    if (
      startAt != null &&
      endAt != null &&
      endAt <= startAt
    ) {
      return "End date-time must be after start date-time.";
    }

    const priority = Number(form.priority);

    if (
      !Number.isInteger(priority) ||
      priority < 0 ||
      priority > 1000
    ) {
      return "Priority must be a whole number between 0 and 1000.";
    }

    const requiresCompleteCampaign = [
      "ACTIVE",
      "PAUSED"
    ].includes(form.status);

    const desktopImageAvailable =
      Boolean(imageFiles.desktop) ||
      (Boolean(existingImages.desktopUrl) &&
        !form.removeDesktopImage);

    if (requiresCompleteCampaign) {
      if (!startAt || !endAt) {
        return (
          "A start and end date-time are required before " +
          "activating or pausing a campaign."
        );
      }

      if (!desktopImageAvailable) {
        return (
          "A desktop image is required before activating " +
          "or pausing a campaign."
        );
      }

      if (
        form.status === "ACTIVE" &&
        endAt <= Date.now()
      ) {
        return "An expired campaign cannot be activated.";
      }
    }

    return "";
  };

  const buildPayload = () => {
    const payload = {
      internalTitle: form.internalTitle.trim(),
      headline: form.headline.trim(),
      description: form.description.trim() || null,
      sponsorName: form.sponsorName.trim(),
      ctaLabel: form.ctaLabel.trim(),
      destinationUrl: form.destinationUrl.trim(),
      placement: form.placement,
      audience: form.audience,
      status: form.status,
      imageAltText: form.imageAltText.trim(),
      startAt: toEpochMilliseconds(form.startAt),
      endAt: toEpochMilliseconds(form.endAt),
      priority: Number(form.priority),
      openInNewTab: Boolean(form.openInNewTab),
      removeDesktopImage: Boolean(
        form.removeDesktopImage
      ),
      removeMobileImage: Boolean(
        form.removeMobileImage
      )
    };

    if (editingId) {
      payload.version = editingVersion;
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSaving(true);

    try {
      const payload = buildPayload();

      if (editingId) {
        await updateAdminAdvertisement(editingId, {
          payload,
          desktopImage: imageFiles.desktop,
          mobileImage: imageFiles.mobile
        });

        setSuccessMessage(
          "Advertisement campaign updated successfully."
        );
      } else {
        await createAdminAdvertisement({
          payload,
          desktopImage: imageFiles.desktop,
          mobileImage: imageFiles.mobile
        });

        setSuccessMessage(
          "Advertisement campaign created successfully."
        );
      }

      resetForm();
      await refreshCampaignData();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (advertisementId) => {
    setErrorMessage("");
    setSuccessMessage("");
    setEditingLoadingId(advertisementId);

    try {
      const advertisement =
        await getAdminAdvertisementById(advertisementId);

      revokeBlobPreview(imagePreviews.desktop);
      revokeBlobPreview(imagePreviews.mobile);

      setEditingId(advertisement.id);
      setEditingVersion(advertisement.version);

      setForm({
        internalTitle: advertisement.internalTitle || "",
        headline: advertisement.headline || "",
        description: advertisement.description || "",
        sponsorName: advertisement.sponsorName || "",
        ctaLabel: advertisement.ctaLabel || "",
        destinationUrl:
          advertisement.destinationUrl || "",
        placement:
          advertisement.placement || "HOME_TOP",
        audience: advertisement.audience || "PUBLIC",
        status:
          advertisement.configuredStatus || "DRAFT",
        imageAltText:
          advertisement.imageAltText || "",
        startAt: toDateTimeLocalInput(
          advertisement.startAt
        ),
        endAt: toDateTimeLocalInput(
          advertisement.endAt
        ),
        priority: String(
          advertisement.priority ?? 100
        ),
        openInNewTab: Boolean(
          advertisement.openInNewTab
        ),
        removeDesktopImage: false,
        removeMobileImage: false
      });

      setExistingImages({
        desktopUrl:
          advertisement.desktopImageUrl || "",
        desktopWidth:
          advertisement.desktopImageWidth || null,
        desktopHeight:
          advertisement.desktopImageHeight || null,
        mobileUrl:
          advertisement.mobileImageUrl || "",
        mobileWidth:
          advertisement.mobileImageWidth || null,
        mobileHeight:
          advertisement.mobileImageHeight || null
      });

      setImageFiles({
        desktop: null,
        mobile: null
      });

      setImagePreviews({
        desktop:
          advertisement.desktopImageUrl || "",
        mobile:
          advertisement.mobileImageUrl || ""
      });

      setPreviewDevice("DESKTOP");
      resetFileInputs();
      scrollToForm();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setEditingLoadingId(null);
    }
  };

  const executeConfirmedAction = async () => {
    if (!confirmation?.run) {
      return;
    }

    setActionLoadingId(confirmation.advertisementId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await confirmation.run();

      setSuccessMessage(
        confirmation.successMessage ||
          "Advertisement updated successfully."
      );

      setConfirmation(null);
      await refreshCampaignData();
    } catch (error) {
      setConfirmation(null);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setActionLoadingId(null);
    }
  };

  const requestStatusChange = (
    advertisement,
    nextStatus
  ) => {
    const actionLabel =
      nextStatus === "ACTIVE"
        ? "Activate"
        : nextStatus === "PAUSED"
          ? "Pause"
          : "Move to draft";

    setConfirmation({
      advertisementId: advertisement.id,
      title: `${actionLabel} campaign?`,
      message:
        nextStatus === "ACTIVE"
          ? "The campaign will become publicly visible when its schedule is live."
          : nextStatus === "PAUSED"
            ? "The campaign will immediately stop appearing on public pages."
            : "The campaign will be removed from public delivery and returned to draft.",
      confirmLabel: actionLabel,
      tone:
        nextStatus === "PAUSED"
          ? "warning"
          : "default",
      successMessage:
        nextStatus === "ACTIVE"
          ? "Advertisement activated successfully."
          : nextStatus === "PAUSED"
            ? "Advertisement paused successfully."
            : "Advertisement moved to draft successfully.",
      run: () =>
        updateAdminAdvertisementStatus(
          advertisement.id,
          {
            status: nextStatus,
            version: advertisement.version
          }
        )
    });
  };

  const requestArchive = (advertisement) => {
    setConfirmation({
      advertisementId: advertisement.id,
      title: "Archive campaign?",
      message:
        "The campaign will be removed from normal lists and public delivery. It can be restored later.",
      confirmLabel: "Archive",
      tone: "danger",
      successMessage:
        "Advertisement archived successfully.",
      run: () =>
        archiveAdminAdvertisement(advertisement.id, {
          version: advertisement.version
        })
    });
  };

  const requestRestore = (advertisement) => {
    setConfirmation({
      advertisementId: advertisement.id,
      title: "Restore campaign?",
      message:
        "The campaign will be restored as a draft. Review it before activating it again.",
      confirmLabel: "Restore",
      tone: "default",
      successMessage:
        "Advertisement restored as draft successfully.",
      run: () =>
        restoreAdminAdvertisement(advertisement.id, {
          version: advertisement.version
        })
    });
  };

  const renderCampaignActions = (advertisement) => {
    const isActionLoading =
      actionLoadingId === advertisement.id;

    const isArchived =
      advertisement.configuredStatus === "ARCHIVED";

    const isActive =
      advertisement.configuredStatus === "ACTIVE";

    const isPaused =
      advertisement.configuredStatus === "PAUSED";

    const isDraft =
      advertisement.configuredStatus === "DRAFT";

    const campaignReady =
      Boolean(advertisement.desktopImageUrl) &&
      Boolean(advertisement.startAt) &&
      Boolean(advertisement.endAt);

    return (
      <div className="adm-ads-actions">
        {!isArchived && (
          <button
            type="button"
            className="adm-ads-action-button"
            disabled={
              isActionLoading ||
              editingLoadingId === advertisement.id
            }
            onClick={() =>
              handleEdit(advertisement.id)
            }
          >
            {editingLoadingId === advertisement.id
              ? "Loading..."
              : "Edit"}
          </button>
        )}

        {isActive && (
          <button
            type="button"
            className="adm-ads-action-button adm-ads-action-button--warning"
            disabled={isActionLoading}
            onClick={() =>
              requestStatusChange(
                advertisement,
                "PAUSED"
              )
            }
          >
            Pause
          </button>
        )}

        {isPaused && (
          <button
            type="button"
            className="adm-ads-action-button adm-ads-action-button--primary"
            disabled={isActionLoading}
            onClick={() =>
              requestStatusChange(
                advertisement,
                "ACTIVE"
              )
            }
          >
            Activate
          </button>
        )}

        {isDraft && campaignReady && (
          <button
            type="button"
            className="adm-ads-action-button adm-ads-action-button--primary"
            disabled={isActionLoading}
            onClick={() =>
              requestStatusChange(
                advertisement,
                "ACTIVE"
              )
            }
          >
            Activate
          </button>
        )}

        {isDraft && !campaignReady && (
          <button
            type="button"
            className="adm-ads-action-button adm-ads-action-button--primary"
            disabled={isActionLoading}
            onClick={() =>
              handleEdit(advertisement.id)
            }
          >
            Complete setup
          </button>
        )}

        {!isArchived && (
          <button
            type="button"
            className="adm-ads-action-button adm-ads-action-button--danger"
            disabled={isActionLoading}
            onClick={() =>
              requestArchive(advertisement)
            }
          >
            Archive
          </button>
        )}

        {isArchived && (
          <button
            type="button"
            className="adm-ads-action-button adm-ads-action-button--primary"
            disabled={isActionLoading}
            onClick={() =>
              requestRestore(advertisement)
            }
          >
            {isActionLoading
              ? "Restoring..."
              : "Restore"}
          </button>
        )}
      </div>
    );
  };

  const summaryCards = [
    {
      label: "Total campaigns",
      value: summary.total,
      tone: "neutral"
    },
    {
      label: "Live",
      value: summary.live,
      tone: "success"
    },
    {
      label: "Scheduled",
      value: summary.scheduled,
      tone: "info"
    },
    {
      label: "Draft",
      value: summary.draft,
      tone: "neutral"
    },
    {
      label: "Paused",
      value: summary.paused,
      tone: "warning"
    },
    {
      label: "Expired",
      value: summary.expired,
      tone: "danger"
    }
  ];

  return (
    <div className="adm-ads-page">
      <header className="adm-ads-page-header">
        <div>
          <p className="adm-ads-eyebrow">
            Campaign operations
          </p>

          <h1>Ads Management</h1>

          <p className="adm-ads-page-description">
            Create, schedule and control advertisements
            displayed across Doctor&apos;s Hub.
          </p>
        </div>

        <button
          type="button"
          className="adm-ads-primary-button"
          onClick={handleCreateNew}
        >
          Create campaign
        </button>
      </header>

      {errorMessage && (
        <div
          className="adm-ads-alert adm-ads-alert--error"
          role="alert"
        >
          <span>{errorMessage}</span>

          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setErrorMessage("")}
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div
          className="adm-ads-alert adm-ads-alert--success"
          role="status"
        >
          <span>{successMessage}</span>

          <button
            type="button"
            aria-label="Dismiss success message"
            onClick={() => setSuccessMessage("")}
          >
            ×
          </button>
        </div>
      )}

      <section className="adm-ads-summary-grid">
        {summaryCards.map((card) => (
          <article
            className={`adm-ads-summary-card adm-ads-summary-card--${card.tone}`}
            key={card.label}
          >
            <span>{card.label}</span>

            <strong>
              {loadingMeta ? "—" : card.value}
            </strong>
          </article>
        ))}
      </section>

      <section
        className="adm-ads-workspace"
        ref={formSectionRef}
      >
        <div className="adm-ads-form-card">
          <div className="adm-ads-section-heading">
            <div>
              <span className="adm-ads-section-kicker">
                {editingId
                  ? `Editing campaign #${editingId}`
                  : "New campaign"}
              </span>

              <h2>
                {editingId
                  ? "Update advertisement"
                  : "Create advertisement"}
              </h2>
            </div>

            {editingId && (
              <button
                type="button"
                className="adm-ads-secondary-button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel editing
              </button>
            )}
          </div>

          <form
            className="adm-ads-form"
            onSubmit={handleSubmit}
          >
            <div className="adm-ads-form-section">
              <div className="adm-ads-form-section-title">
                <h3>Campaign details</h3>

                <p>
                  Internal information and the public message
                  shown to users.
                </p>
              </div>

              <div className="adm-ads-field-grid">
                <label className="adm-ads-field adm-ads-field--full">
                  <span>Internal campaign title</span>

                  <input
                    type="text"
                    name="internalTitle"
                    value={form.internalTitle}
                    onChange={handleFormChange}
                    maxLength={180}
                    placeholder="Example: July doctor booking campaign"
                    required
                  />
                </label>

                <label className="adm-ads-field adm-ads-field--full">
                  <span>Public headline</span>

                  <input
                    type="text"
                    name="headline"
                    value={form.headline}
                    onChange={handleFormChange}
                    maxLength={180}
                    placeholder="Example: Book verified doctors near you"
                    required
                  />
                </label>

                <label className="adm-ads-field adm-ads-field--full">
                  <span>Description</span>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    maxLength={2000}
                    rows={4}
                    placeholder="Short supporting message for the advertisement"
                  />
                </label>

                <label className="adm-ads-field">
                  <span>Sponsor name</span>

                  <input
                    type="text"
                    name="sponsorName"
                    value={form.sponsorName}
                    onChange={handleFormChange}
                    maxLength={160}
                    placeholder="Sponsor or advertiser"
                    required
                  />
                </label>

                <label className="adm-ads-field">
                  <span>CTA label</span>

                  <input
                    type="text"
                    name="ctaLabel"
                    value={form.ctaLabel}
                    onChange={handleFormChange}
                    maxLength={60}
                    placeholder="Example: Book now"
                    required
                  />
                </label>

                <label className="adm-ads-field adm-ads-field--full">
                  <span>Destination URL</span>

                  <input
                    type="text"
                    name="destinationUrl"
                    value={form.destinationUrl}
                    onChange={handleFormChange}
                    maxLength={1200}
                    placeholder="/find-doctors or https://example.com"
                    required
                  />

                  <small>
                    Use an internal route beginning with /
                    or a secure HTTP/HTTPS URL.
                  </small>
                </label>
              </div>
            </div>

            <div className="adm-ads-form-section">
              <div className="adm-ads-form-section-title">
                <h3>Delivery settings</h3>

                <p>
                  Choose where, when and for whom the campaign
                  will be displayed.
                </p>
              </div>

              <div className="adm-ads-field-grid">
                <label className="adm-ads-field">
                  <span>Placement</span>

                  <select
                    name="placement"
                    value={form.placement}
                    onChange={handleFormChange}
                  >
                    {filterOptions.placements.length > 0 ? (
                      filterOptions.placements.map(
                        (placement) => (
                          <option
                            value={placement.value}
                            key={placement.value}
                          >
                            {placement.label}
                          </option>
                        )
                      )
                    ) : (
                      <option value="HOME_TOP">
                        Home Page - Top Banner
                      </option>
                    )}
                  </select>
                </label>

                <label className="adm-ads-field">
                  <span>Audience</span>

                  <select
                    name="audience"
                    value={form.audience}
                    onChange={handleFormChange}
                  >
                    {filterOptions.audiences.map(
                      (audience) => (
                        <option
                          value={audience}
                          key={audience}
                        >
                          {formatEnumLabel(audience)}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label className="adm-ads-field">
                  <span>Configured status</span>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleFormChange}
                  >
                    {filterOptions.configuredStatuses
                      .filter(
                        (status) => status !== "ARCHIVED"
                      )
                      .map((status) => (
                        <option
                          value={status}
                          key={status}
                        >
                          {formatEnumLabel(status)}
                        </option>
                      ))}
                  </select>
                </label>

                <label className="adm-ads-field">
                  <span>Priority</span>

                  <input
                    type="number"
                    name="priority"
                    min="0"
                    max="1000"
                    step="1"
                    value={form.priority}
                    onChange={handleFormChange}
                  />

                  <small>
                    Higher values are displayed first.
                  </small>
                </label>

                <label className="adm-ads-field">
                  <span>Start date and time</span>

                  <input
                    type="datetime-local"
                    name="startAt"
                    value={form.startAt}
                    onChange={handleFormChange}
                  />
                </label>

                <label className="adm-ads-field">
                  <span>End date and time</span>

                  <input
                    type="datetime-local"
                    name="endAt"
                    value={form.endAt}
                    onChange={handleFormChange}
                  />
                </label>

                <label className="adm-ads-checkbox-field adm-ads-field--full">
                  <input
                    type="checkbox"
                    name="openInNewTab"
                    checked={form.openInNewTab}
                    onChange={handleFormChange}
                  />

                  <span>
                    Open destination in a new browser tab
                  </span>
                </label>
              </div>
            </div>

            <div className="adm-ads-form-section">
              <div className="adm-ads-form-section-title">
                <h3>Creative assets</h3>

                <p>
                  Upload separate desktop and mobile images
                  for responsive delivery.
                </p>
              </div>

              {selectedPlacement && (
                <div className="adm-ads-dimension-note">
                  <div>
                    <strong>Desktop</strong>

                    <span>
                      Recommended{" "}
                      {
                        selectedPlacement.recommendedDesktopWidth
                      }
                      ×
                      {
                        selectedPlacement.recommendedDesktopHeight
                      }
                      , minimum{" "}
                      {selectedPlacement.minimumDesktopWidth}
                      ×
                      {
                        selectedPlacement.minimumDesktopHeight
                      }
                    </span>
                  </div>

                  <div>
                    <strong>Mobile</strong>

                    <span>
                      Recommended{" "}
                      {
                        selectedPlacement.recommendedMobileWidth
                      }
                      ×
                      {
                        selectedPlacement.recommendedMobileHeight
                      }
                      , minimum{" "}
                      {selectedPlacement.minimumMobileWidth}
                      ×
                      {
                        selectedPlacement.minimumMobileHeight
                      }
                    </span>
                  </div>
                </div>
              )}

              <div className="adm-ads-upload-grid">
                <div className="adm-ads-upload-card">
                  <div>
                    <strong>Desktop image</strong>

                    <span>
                      JPG or PNG, maximum 5 MB
                    </span>
                  </div>

                  <input
                    ref={desktopInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={(event) =>
                      handleImageSelection(
                        event,
                        "DESKTOP"
                      )
                    }
                  />

                  {imageFiles.desktop && (
                    <small>
                      Selected: {imageFiles.desktop.name}
                    </small>
                  )}

                  {editingId &&
                    existingImages.desktopUrl && (
                      <label className="adm-ads-remove-image">
                        <input
                          type="checkbox"
                          checked={
                            form.removeDesktopImage
                          }
                          onChange={(event) =>
                            handleRemoveImageChange(
                              event,
                              "DESKTOP"
                            )
                          }
                        />

                        <span>
                          Remove existing desktop image
                        </span>
                      </label>
                    )}
                </div>

                <div className="adm-ads-upload-card">
                  <div>
                    <strong>Mobile image</strong>

                    <span>
                      Optional. Desktop image is used as fallback.
                    </span>
                  </div>

                  <input
                    ref={mobileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={(event) =>
                      handleImageSelection(
                        event,
                        "MOBILE"
                      )
                    }
                  />

                  {imageFiles.mobile && (
                    <small>
                      Selected: {imageFiles.mobile.name}
                    </small>
                  )}

                  {editingId &&
                    existingImages.mobileUrl && (
                      <label className="adm-ads-remove-image">
                        <input
                          type="checkbox"
                          checked={
                            form.removeMobileImage
                          }
                          onChange={(event) =>
                            handleRemoveImageChange(
                              event,
                              "MOBILE"
                            )
                          }
                        />

                        <span>
                          Remove existing mobile image
                        </span>
                      </label>
                    )}
                </div>
              </div>

              <label className="adm-ads-field">
                <span>Image alternative text</span>

                <input
                  type="text"
                  name="imageAltText"
                  value={form.imageAltText}
                  onChange={handleFormChange}
                  maxLength={300}
                  placeholder="Describe the advertisement image"
                  required
                />

                <small>
                  Used by screen readers and shown if the
                  image cannot load.
                </small>
              </label>
            </div>

            <div className="adm-ads-form-footer">
              <button
                type="button"
                className="adm-ads-secondary-button"
                onClick={resetForm}
                disabled={saving}
              >
                Reset
              </button>

              <button
                type="submit"
                className="adm-ads-primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving campaign..."
                  : editingId
                    ? "Update campaign"
                    : "Create campaign"}
              </button>
            </div>
          </form>
        </div>

        <aside className="adm-ads-preview-card">
          <div className="adm-ads-section-heading">
            <div>
              <span className="adm-ads-section-kicker">
                Creative preview
              </span>

              <h2>Live preview</h2>
            </div>
          </div>

          <div className="adm-ads-device-toggle">
            <button
              type="button"
              className={
                previewDevice === "DESKTOP"
                  ? "adm-ads-device-toggle__button adm-ads-device-toggle__button--active"
                  : "adm-ads-device-toggle__button"
              }
              onClick={() =>
                setPreviewDevice("DESKTOP")
              }
            >
              Desktop
            </button>

            <button
              type="button"
              className={
                previewDevice === "MOBILE"
                  ? "adm-ads-device-toggle__button adm-ads-device-toggle__button--active"
                  : "adm-ads-device-toggle__button"
              }
              onClick={() =>
                setPreviewDevice("MOBILE")
              }
            >
              Mobile
            </button>
          </div>

          <div
            className={`adm-ads-preview-frame ${
              previewDevice === "MOBILE"
                ? "adm-ads-preview-frame--mobile"
                : ""
            }`}
            style={{
              aspectRatio: previewAspectRatio
            }}
          >
            {currentPreviewUrl ? (
              <img
                src={currentPreviewUrl}
                alt={
                  form.imageAltText ||
                  "Advertisement preview"
                }
              />
            ) : (
              <div className="adm-ads-preview-empty">
                <span>No image selected</span>

                <small>
                  Upload an image to preview the campaign.
                </small>
              </div>
            )}

            {currentPreviewUrl && (
              <div className="adm-ads-preview-content">
                <div>
                  <span>
                    {form.sponsorName ||
                      "Sponsor name"}
                  </span>

                  <strong>
                    {form.headline ||
                      "Advertisement headline"}
                  </strong>

                  {form.description && (
                    <p>{form.description}</p>
                  )}
                </div>

                <span className="adm-ads-preview-cta">
                  {form.ctaLabel || "Learn more"}
                </span>
              </div>
            )}
          </div>

          {currentPreviewIsFallback && (
            <p className="adm-ads-preview-fallback">
              Mobile-specific image is not selected. The
              desktop image will be used as fallback.
            </p>
          )}

          <dl className="adm-ads-preview-details">
            <div>
              <dt>Placement</dt>

              <dd>
                {selectedPlacement?.label ||
                  formatEnumLabel(form.placement)}
              </dd>
            </div>

            <div>
              <dt>Audience</dt>

              <dd>{formatEnumLabel(form.audience)}</dd>
            </div>

            <div>
              <dt>Status</dt>

              <dd>{formatEnumLabel(form.status)}</dd>
            </div>

            <div>
              <dt>Schedule</dt>

              <dd>
                {form.startAt && form.endAt
                  ? `${formatDateTime(
                      toEpochMilliseconds(form.startAt)
                    )} – ${formatDateTime(
                      toEpochMilliseconds(form.endAt)
                    )}`
                  : "Not scheduled"}
              </dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="adm-ads-list-card">
        <div className="adm-ads-list-header">
          <div>
            <span className="adm-ads-section-kicker">
              Campaign inventory
            </span>

            <h2>All advertisements</h2>

            <p>
              {pagination.totalElements} campaign
              {pagination.totalElements === 1 ? "" : "s"}{" "}
              found
            </p>
          </div>
        </div>

        <div className="adm-ads-filter-grid">
          <label className="adm-ads-filter-search">
            <span>Search campaigns</span>

            <input
              type="search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Title, headline, sponsor or code"
            />
          </label>

          <label>
            <span>Placement</span>

            <select
              name="placement"
              value={filters.placement}
              onChange={handleFilterChange}
            >
              <option value="ALL">
                All placements
              </option>

              {filterOptions.placements.map(
                (placement) => (
                  <option
                    key={placement.value}
                    value={placement.value}
                  >
                    {placement.label}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            <span>Audience</span>

            <select
              name="audience"
              value={filters.audience}
              onChange={handleFilterChange}
            >
              <option value="ALL">
                All audiences
              </option>

              {filterOptions.audiences.map(
                (audience) => (
                  <option
                    key={audience}
                    value={audience}
                  >
                    {formatEnumLabel(audience)}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            <span>Configured status</span>

            <select
              name="configuredStatus"
              value={filters.configuredStatus}
              onChange={handleFilterChange}
            >
              <option value="ALL">
                All configured statuses
              </option>

              {filterOptions.configuredStatuses.map(
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

          <label>
            <span>Effective status</span>

            <select
              name="effectiveStatus"
              value={filters.effectiveStatus}
              onChange={handleFilterChange}
            >
              <option value="ALL">
                All effective statuses
              </option>

              {filterOptions.effectiveStatuses.map(
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

          <label>
            <span>Sort by</span>

            <select
              value={sort.sortBy}
              onChange={(event) => {
                setSort((previous) => ({
                  ...previous,
                  sortBy: event.target.value
                }));

                setPagination((previous) => ({
                  ...previous,
                  page: 0
                }));
              }}
            >
              <option value="updatedAt">
                Last updated
              </option>

              <option value="createdAt">
                Created date
              </option>

              <option value="priority">
                Priority
              </option>

              <option value="startAt">
                Start date
              </option>

              <option value="endAt">
                End date
              </option>

              <option value="impressionCount">
                Impressions
              </option>

              <option value="clickCount">
                Clicks
              </option>
            </select>
          </label>

          <div className="adm-ads-filter-actions">
            <button
              type="button"
              className="adm-ads-direction-button"
              onClick={() =>
                setSort((previous) => ({
                  ...previous,
                  sortDirection:
                    previous.sortDirection === "DESC"
                      ? "ASC"
                      : "DESC"
                }))
              }
            >
              {sort.sortDirection === "DESC"
                ? "Descending"
                : "Ascending"}
            </button>

            <button
              type="button"
              className="adm-ads-secondary-button"
              onClick={resetFilters}
            >
              Reset filters
            </button>
          </div>

          <label className="adm-ads-archive-filter">
            <input
              type="checkbox"
              name="includeArchived"
              checked={filters.includeArchived}
              onChange={handleFilterChange}
            />

            <span>Include archived campaigns</span>
          </label>
        </div>

        {loadingList ? (
          <div className="adm-ads-loading-state">
            <span className="adm-ads-spinner" />

            <p>Loading advertisement campaigns...</p>
          </div>
        ) : advertisements.length === 0 ? (
          <div className="adm-ads-empty-state">
            <strong>No campaigns found</strong>

            <p>
              Create a new campaign or change the active
              filters.
            </p>

            <button
              type="button"
              className="adm-ads-primary-button"
              onClick={handleCreateNew}
            >
              Create campaign
            </button>
          </div>
        ) : (
          <>
            <div className="adm-ads-table-wrap">
              <table className="adm-ads-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Placement</th>
                    <th>Status</th>
                    <th>Schedule</th>
                    <th>Performance</th>
                    <th>Priority</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {advertisements.map(
                    (advertisement) => (
                      <tr key={advertisement.id}>
                        <td>
                          <div className="adm-ads-campaign-cell">
                            <div className="adm-ads-thumbnail">
                              {advertisement.desktopImageUrl ? (
                                <img
                                  src={
                                    advertisement.desktopImageUrl
                                  }
                                  alt=""
                                />
                              ) : (
                                <span>No image</span>
                              )}
                            </div>

                            <div>
                              <strong>
                                {
                                  advertisement.internalTitle
                                }
                              </strong>

                              <span>
                                {advertisement.headline}
                              </span>

                              <small>
                                {
                                  advertisement.campaignCode
                                }
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <strong>
                            {formatEnumLabel(
                              advertisement.placement
                            )}
                          </strong>

                          <span className="adm-ads-cell-muted">
                            {formatEnumLabel(
                              advertisement.audience
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="adm-ads-status-stack">
                            <span
                              className={`adm-ads-status-badge adm-ads-status-badge--${String(
                                advertisement.effectiveStatus
                              ).toLowerCase()}`}
                            >
                              {formatEnumLabel(
                                advertisement.effectiveStatus
                              )}
                            </span>

                            <small>
                              Configured:{" "}
                              {formatEnumLabel(
                                advertisement.configuredStatus
                              )}
                            </small>
                          </div>
                        </td>

                        <td>
                          <div className="adm-ads-schedule-cell">
                            <span>
                              {formatDateTime(
                                advertisement.startAt
                              )}
                            </span>

                            <span>
                              {formatDateTime(
                                advertisement.endAt
                              )}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="adm-ads-performance-cell">
                            <span>
                              <strong>
                                {
                                  advertisement.impressionCount
                                }
                              </strong>{" "}
                              impressions
                            </span>

                            <span>
                              <strong>
                                {
                                  advertisement.clickCount
                                }
                              </strong>{" "}
                              clicks
                            </span>

                            <small>
                              CTR{" "}
                              {
                                advertisement.clickThroughRate
                              }
                              %
                            </small>
                          </div>
                        </td>

                        <td>
                          <span className="adm-ads-priority-value">
                            {advertisement.priority}
                          </span>
                        </td>

                        <td>
                          {renderCampaignActions(
                            advertisement
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="adm-ads-mobile-list">
              {advertisements.map(
                (advertisement) => (
                  <article
                    className="adm-ads-mobile-card"
                    key={advertisement.id}
                  >
                    <div className="adm-ads-mobile-card__header">
                      <div className="adm-ads-thumbnail">
                        {advertisement.desktopImageUrl ? (
                          <img
                            src={
                              advertisement.desktopImageUrl
                            }
                            alt=""
                          />
                        ) : (
                          <span>No image</span>
                        )}
                      </div>

                      <div>
                        <strong>
                          {advertisement.internalTitle}
                        </strong>

                        <span>
                          {advertisement.headline}
                        </span>

                        <small>
                          {advertisement.campaignCode}
                        </small>
                      </div>
                    </div>

                    <div className="adm-ads-mobile-card__status">
                      <span
                        className={`adm-ads-status-badge adm-ads-status-badge--${String(
                          advertisement.effectiveStatus
                        ).toLowerCase()}`}
                      >
                        {formatEnumLabel(
                          advertisement.effectiveStatus
                        )}
                      </span>

                      <span>
                        Priority {advertisement.priority}
                      </span>
                    </div>

                    <dl className="adm-ads-mobile-card__details">
                      <div>
                        <dt>Placement</dt>

                        <dd>
                          {formatEnumLabel(
                            advertisement.placement
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>Audience</dt>

                        <dd>
                          {formatEnumLabel(
                            advertisement.audience
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>Starts</dt>

                        <dd>
                          {formatDateTime(
                            advertisement.startAt
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>Ends</dt>

                        <dd>
                          {formatDateTime(
                            advertisement.endAt
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>Impressions</dt>

                        <dd>
                          {
                            advertisement.impressionCount
                          }
                        </dd>
                      </div>

                      <div>
                        <dt>Clicks / CTR</dt>

                        <dd>
                          {advertisement.clickCount} /{" "}
                          {
                            advertisement.clickThroughRate
                          }
                          %
                        </dd>
                      </div>
                    </dl>

                    {renderCampaignActions(
                      advertisement
                    )}
                  </article>
                )
              )}
            </div>
          </>
        )}

        <footer className="adm-ads-pagination">
          <div>
            <span>Rows per page</span>

            <select
              value={pagination.size}
              onChange={(event) =>
                setPagination((previous) => ({
                  ...previous,
                  page: 0,
                  size: Number(event.target.value)
                }))
              }
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>

          <span>
            Page{" "}
            {pagination.totalPages === 0
              ? 0
              : pagination.page + 1}{" "}
            of {pagination.totalPages}
          </span>

          <div className="adm-ads-pagination__buttons">
            <button
              type="button"
              className="adm-ads-secondary-button"
              disabled={
                loadingList || pagination.page <= 0
              }
              onClick={() =>
                setPagination((previous) => ({
                  ...previous,
                  page: Math.max(
                    previous.page - 1,
                    0
                  )
                }))
              }
            >
              Previous
            </button>

            <button
              type="button"
              className="adm-ads-secondary-button"
              disabled={
                loadingList ||
                pagination.totalPages === 0 ||
                pagination.page + 1 >=
                  pagination.totalPages
              }
              onClick={() =>
                setPagination((previous) => ({
                  ...previous,
                  page: previous.page + 1
                }))
              }
            >
              Next
            </button>
          </div>
        </footer>
      </section>

      {confirmation && (
        <div
          className="adm-ads-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmation(null);
            }
          }}
        >
          <div
            className="adm-ads-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="adm-ads-confirm-title"
          >
            <div>
              <span className="adm-ads-section-kicker">
                Confirm action
              </span>

              <h2 id="adm-ads-confirm-title">
                {confirmation.title}
              </h2>

              <p>{confirmation.message}</p>
            </div>

            <div className="adm-ads-confirm-modal__actions">
              <button
                type="button"
                className="adm-ads-secondary-button"
                onClick={() => setConfirmation(null)}
                disabled={Boolean(actionLoadingId)}
              >
                Cancel
              </button>

              <button
                type="button"
                className={`adm-ads-primary-button ${
                  confirmation.tone === "danger"
                    ? "adm-ads-primary-button--danger"
                    : confirmation.tone === "warning"
                      ? "adm-ads-primary-button--warning"
                      : ""
                }`}
                onClick={executeConfirmedAction}
                disabled={Boolean(actionLoadingId)}
              >
                {actionLoadingId
                  ? "Processing..."
                  : confirmation.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdsManagement;