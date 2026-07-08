import api from "./api";

/* =====================================
   MULTIPART REQUEST HELPER

   Axios/browser ko multipart boundary
   automatically generate karne deta hai.
===================================== */

const multipartRequestConfig = {
  transformRequest: [
    (data, headers) => {
      if (headers && typeof headers.delete === "function") {
        headers.delete("Content-Type");
      } else if (headers) {
        delete headers["Content-Type"];
        delete headers["content-type"];
      }

      return data;
    }
  ]
};

const buildAdvertisementFormData = ({
  payload,
  desktopImage = null,
  mobileImage = null
}) => {
  const formData = new FormData();

  formData.append("request", JSON.stringify(payload));

  if (desktopImage instanceof File) {
    formData.append("desktopImage", desktopImage);
  }

  if (mobileImage instanceof File) {
    formData.append("mobileImage", mobileImage);
  }

  return formData;
};

/* =====================================
   ADMIN PROFILE API
===================================== */

export const getAdminProfile = async () => {
  const response = await api.get("/admin/profile");
  return response.data;
};

export const updateAdminProfile = async (payload) => {
  const response = await api.put("/admin/profile", payload);
  return response.data;
};

export const uploadAdminProfileImage = async (file) => {
  if (!(file instanceof File)) {
    throw new Error("Valid profile image file is required");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    "/admin/profile/image",
    formData,
    multipartRequestConfig
  );

  return response.data;
};

/* =====================================
   ADMIN DASHBOARD API
===================================== */

export const getAdminDashboard = async () => {
  const response = await api.get("/admin/dashboard");
  return response.data;
};

/* =====================================
   ADMIN FEEDBACK API
===================================== */

export const getAdminFeedbacks = async ({
  status = "ALL",
  type = "ALL",
  submitterRole = "ALL",
  page = 0,
  size = 10
} = {}) => {
  const response = await api.get("/admin/feedback", {
    params: {
      status,
      type,
      submitterRole,
      page,
      size
    }
  });

  return response.data;
};

export const getAdminFeedbackById = async (feedbackId) => {
  const response = await api.get(
    `/admin/feedback/${feedbackId}`
  );

  return response.data;
};

export const updateAdminFeedbackStatus = async (
  feedbackId,
  payload
) => {
  const response = await api.patch(
    `/admin/feedback/${feedbackId}/status`,
    payload
  );

  return response.data;
};

/* =====================================
   ADMIN SYSTEM LOGS API
===================================== */

export const getAdminSystemLogs = async ({
  search = "",
  role = "All",
  module = "All",
  status = "All",
  severity = "All",
  fromDateTime = "",
  toDateTime = "",
  page = 0,
  size = 10
} = {}) => {
  const response = await api.get("/admin/system-logs", {
    params: {
      search,
      role,
      module,
      status,
      severity,
      fromDateTime: fromDateTime || undefined,
      toDateTime: toDateTime || undefined,
      page,
      size
    }
  });

  return response.data;
};

export const getAdminSystemLogById = async (logId) => {
  const response = await api.get(
    `/admin/system-logs/${logId}`
  );

  return response.data;
};

/* =====================================
   ADMIN APPOINTMENTS API
===================================== */

export const getAdminAppointments = async ({
  search = "",
  source = "ALL",
  status = "ALL",
  mode = "ALL",
  doctorProfileId = "",
  clinicId = "",
  critical = "",
  fromDate = "",
  toDate = "",
  page = 0,
  size = 10,
  sortBy = "appointmentDateTime",
  sortDirection = "DESC"
} = {}) => {
  const response = await api.get("/admin/appointments", {
    params: {
      search: search || undefined,
      source,
      status,
      mode,
      doctorProfileId: doctorProfileId || undefined,
      clinicId: clinicId || undefined,
      critical:
        critical === "" || critical === "ALL"
          ? undefined
          : critical,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      page,
      size,
      sortBy,
      sortDirection
    }
  });

  return response.data;
};

export const getAdminAppointmentFilterOptions = async () => {
  const response = await api.get(
    "/admin/appointments/filter-options"
  );

  return response.data;
};

export const getAdminAppointmentByKey = async (
  appointmentKey
) => {
  const safeKey = encodeURIComponent(appointmentKey);

  const response = await api.get(
    `/admin/appointments/${safeKey}`
  );

  return response.data;
};

export const addAdminAppointmentNote = async (
  appointmentKey,
  payload
) => {
  const safeKey = encodeURIComponent(appointmentKey);

  const response = await api.post(
    `/admin/appointments/${safeKey}/notes`,
    payload
  );

  return response.data;
};

export const cancelAdminAppointment = async (
  appointmentKey,
  payload
) => {
  const safeKey = encodeURIComponent(appointmentKey);

  const response = await api.patch(
    `/admin/appointments/${safeKey}/cancel`,
    payload
  );

  return response.data;
};

export const rescheduleAdminAppointment = async (
  appointmentKey,
  payload
) => {
  const safeKey = encodeURIComponent(appointmentKey);

  const response = await api.patch(
    `/admin/appointments/${safeKey}/reschedule`,
    payload
  );

  return response.data;
};

export const updateAdminAppointmentStatus = async (
  appointmentKey,
  payload
) => {
  const safeKey = encodeURIComponent(appointmentKey);

  const response = await api.patch(
    `/admin/appointments/${safeKey}/status`,
    payload
  );

  return response.data;
};

/* =====================================
   ADMIN DOCTORS API
===================================== */

export const getAdminDoctors = async ({
  search = "",
  verificationStatus = "ALL",
  accountStatus = "ALL",
  specializationId = "",
  city = "",
  page = 0,
  size = 10,
  sortBy = "name",
  sortDirection = "ASC"
} = {}) => {
  const response = await api.get("/admin/doctors", {
    params: {
      search: search.trim() || undefined,

      verificationStatus:
        verificationStatus &&
        verificationStatus !== "ALL"
          ? verificationStatus
          : "ALL",

      accountStatus:
        accountStatus &&
        accountStatus !== "ALL"
          ? accountStatus
          : "ALL",

      specializationId:
        specializationId || undefined,

      city:
        city.trim() || undefined,

      page,
      size,
      sortBy,
      sortDirection
    }
  });

  return response.data;
};

export const getAdminDoctorFilterOptions = async () => {
  const response = await api.get(
    "/admin/doctors/filter-options"
  );

  return response.data;
};

export const getAdminDoctorById = async (
  doctorProfileId
) => {
  if (!doctorProfileId) {
    throw new Error("Doctor profile id is required");
  }

  const response = await api.get(
    `/admin/doctors/${doctorProfileId}`
  );

  return response.data;
};

export const updateAdminDoctorAccountStatus = async (
  doctorProfileId,
  payload
) => {
  if (!doctorProfileId) {
    throw new Error("Doctor profile id is required");
  }

  const response = await api.patch(
    `/admin/doctors/${doctorProfileId}/account-status`,
    payload
  );

  return response.data;
};

/* =====================================
   ADMIN ADVERTISEMENTS API
===================================== */

export const getAdminAdvertisements = async ({
  search = "",
  placement = "ALL",
  audience = "ALL",
  configuredStatus = "ALL",
  effectiveStatus = "ALL",
  fromDateTime = "",
  toDateTime = "",
  includeArchived = false,
  page = 0,
  size = 10,
  sortBy = "updatedAt",
  sortDirection = "DESC"
} = {}) => {
  const response = await api.get("/admin/ads", {
    params: {
      search: search.trim() || undefined,
      placement,
      audience,
      configuredStatus,
      effectiveStatus,

      fromDateTime:
        fromDateTime === "" || fromDateTime == null
          ? undefined
          : fromDateTime,

      toDateTime:
        toDateTime === "" || toDateTime == null
          ? undefined
          : toDateTime,

      includeArchived,
      page,
      size,
      sortBy,
      sortDirection
    }
  });

  return response.data;
};

export const getAdminAdvertisementSummary = async () => {
  const response = await api.get("/admin/ads/summary");
  return response.data;
};

export const getAdminAdvertisementFilterOptions = async () => {
  const response = await api.get(
    "/admin/ads/filter-options"
  );

  return response.data;
};

export const getAdminAdvertisementById = async (
  advertisementId
) => {
  if (!advertisementId) {
    throw new Error("Advertisement id is required");
  }

  const response = await api.get(
    `/admin/ads/${advertisementId}`
  );

  return response.data;
};

export const createAdminAdvertisement = async ({
  payload,
  desktopImage = null,
  mobileImage = null
}) => {
  const formData = buildAdvertisementFormData({
    payload,
    desktopImage,
    mobileImage
  });

  const response = await api.post(
    "/admin/ads",
    formData,
    multipartRequestConfig
  );

  return response.data;
};

export const updateAdminAdvertisement = async (
  advertisementId,
  {
    payload,
    desktopImage = null,
    mobileImage = null
  }
) => {
  if (!advertisementId) {
    throw new Error("Advertisement id is required");
  }

  const formData = buildAdvertisementFormData({
    payload,
    desktopImage,
    mobileImage
  });

  const response = await api.put(
    `/admin/ads/${advertisementId}`,
    formData,
    multipartRequestConfig
  );

  return response.data;
};

export const updateAdminAdvertisementStatus = async (
  advertisementId,
  payload
) => {
  if (!advertisementId) {
    throw new Error("Advertisement id is required");
  }

  const response = await api.patch(
    `/admin/ads/${advertisementId}/status`,
    payload
  );

  return response.data;
};

export const archiveAdminAdvertisement = async (
  advertisementId,
  payload
) => {
  if (!advertisementId) {
    throw new Error("Advertisement id is required");
  }

  const response = await api.patch(
    `/admin/ads/${advertisementId}/archive`,
    payload
  );

  return response.data;
};

export const restoreAdminAdvertisement = async (
  advertisementId,
  payload
) => {
  if (!advertisementId) {
    throw new Error("Advertisement id is required");
  }

  const response = await api.patch(
    `/admin/ads/${advertisementId}/restore`,
    payload
  );

  return response.data;
};
export const updateAdminDoctorVerification = async (
  doctorProfileId,
  payload
) => {
  if (!doctorProfileId) {
    throw new Error("Doctor profile id is required");
  }

  const response = await api.patch(
    `/admin/doctors/${doctorProfileId}/verification`,
    payload
  );

  return response.data;
};

export const getAdminDoctorDocumentContent = async (
  doctorProfileId,
  documentId
) => {
  if (!doctorProfileId) {
    throw new Error("Doctor profile id is required");
  }

  if (!documentId) {
    throw new Error("Document id is required");
  }

  const response = await api.get(
    `/admin/doctors/${doctorProfileId}/documents/${documentId}/content`,
    {
      responseType: "blob"
    }
  );

  const contentDisposition =
    response.headers?.["content-disposition"] || "";

  let fileName = "doctor-document";

  const utfFileNameMatch = contentDisposition.match(
    /filename\*=UTF-8''([^;]+)/i
  );

  const regularFileNameMatch = contentDisposition.match(
    /filename="?([^"]+)"?/i
  );

  if (utfFileNameMatch?.[1]) {
    try {
      fileName = decodeURIComponent(utfFileNameMatch[1]);
    } catch {
      fileName = utfFileNameMatch[1];
    }
  } else if (regularFileNameMatch?.[1]) {
    fileName = regularFileNameMatch[1];
  }

  return {
    blob: response.data,
    fileName,
    contentType:
      response.headers?.["content-type"] ||
      response.data?.type ||
      "application/octet-stream"
  };
};
/* =====================================
   ADMIN USER MANAGEMENT API
===================================== */

const buildAdminUserParams = ({
  search = "",
  role = "ALL",
  accountStatus = "ALL",
  verificationStatus = "ALL",
  fromDate = "",
  toDate = "",
  page = 0,
  size = 10,
  sortBy = "createdAt",
  sortDirection = "DESC"
} = {}) => ({
  search: search.trim() || undefined,
  role,
  accountStatus,
  verificationStatus,
  fromDate: fromDate || undefined,
  toDate: toDate || undefined,
  page,
  size,
  sortBy,
  sortDirection
});

export const getAdminUsers = async ({
  search = "",
  role = "ALL",
  accountStatus = "ALL",
  verificationStatus = "ALL",
  fromDate = "",
  toDate = "",
  page = 0,
  size = 10,
  sortBy = "createdAt",
  sortDirection = "DESC"
} = {}) => {
  const response = await api.get("/admin/users", {
    params: buildAdminUserParams({
      search,
      role,
      accountStatus,
      verificationStatus,
      fromDate,
      toDate,
      page,
      size,
      sortBy,
      sortDirection
    })
  });

  return response.data;
};

export const getAdminUserSummary = async () => {
  const response = await api.get("/admin/users/summary");
  return response.data;
};

export const getAdminUserFilterOptions = async () => {
  const response = await api.get(
    "/admin/users/filter-options"
  );

  return response.data;
};

export const getAdminUserById = async (userId) => {
  if (!userId) {
    throw new Error("User id is required");
  }

  const response = await api.get(
    `/admin/users/${userId}`
  );

  return response.data;
};

export const updateAdminUserAccountStatus = async (
  userId,
  payload
) => {
  if (!userId) {
    throw new Error("User id is required");
  }

  const response = await api.patch(
    `/admin/users/${userId}/account-status`,
    payload
  );

  return response.data;
};

export const bulkUpdateAdminUserAccountStatus = async (
  payload
) => {
  const response = await api.patch(
    "/admin/users/bulk/account-status",
    payload
  );

  return response.data;
};

export const resetAdminUserLoginSecurity = async (
  userId,
  payload
) => {
  if (!userId) {
    throw new Error("User id is required");
  }

  const response = await api.patch(
    `/admin/users/${userId}/login-security/reset`,
    payload
  );

  return response.data;
};

export const exportAdminUsers = async ({
  search = "",
  role = "ALL",
  accountStatus = "ALL",
  verificationStatus = "ALL",
  fromDate = "",
  toDate = "",
  sortBy = "createdAt",
  sortDirection = "DESC"
} = {}) => {
  const response = await api.get(
    "/admin/users/export",
    {
      params: buildAdminUserParams({
        search,
        role,
        accountStatus,
        verificationStatus,
        fromDate,
        toDate,
        sortBy,
        sortDirection
      }),
      responseType: "blob"
    }
  );

  const contentDisposition =
    response.headers?.["content-disposition"] || "";

  let fileName = "doctor-hub-users.csv";

  const utfFileNameMatch = contentDisposition.match(
    /filename\*=UTF-8''([^;]+)/i
  );

  const regularFileNameMatch = contentDisposition.match(
    /filename="?([^";]+)"?/i
  );

  if (utfFileNameMatch?.[1]) {
    try {
      fileName = decodeURIComponent(
        utfFileNameMatch[1]
      );
    } catch {
      fileName = utfFileNameMatch[1];
    }
  } else if (regularFileNameMatch?.[1]) {
    fileName = regularFileNameMatch[1];
  }

  return {
    blob: response.data,
    fileName
  };
};
/* =====================================
   ADMIN HOSPITAL MANAGEMENT API
===================================== */

const assertAdminHospitalId = (hospitalId) => {
  if (
    hospitalId === null ||
    hospitalId === undefined ||
    hospitalId === ""
  ) {
    throw new Error("Hospital id is required");
  }
};

const assertAdminHospitalChildId = (
  value,
  label
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    throw new Error(`${label} is required`);
  }
};

/* =====================================
   HOSPITAL LIST / SUMMARY / FILTERS
===================================== */

export const getAdminHospitals = async ({
  search = "",
  verificationStatus = "ALL",
  operationalStatus = "ALL",
  hospitalType = "ALL",
  city = "",
  emergencyAvailable,
  featured,
  includeArchived = false,
  fromDate = "",
  toDate = "",
  page = 0,
  size = 10,
  sortBy = "updatedAt",
  sortDirection = "DESC"
} = {}) => {
  const response = await api.get(
    "/admin/hospitals",
    {
      params: {
        search:
          typeof search === "string"
            ? search.trim() || undefined
            : undefined,

        verificationStatus:
          verificationStatus || "ALL",

        operationalStatus:
          operationalStatus || "ALL",

        hospitalType:
          hospitalType || "ALL",

        city:
          typeof city === "string"
            ? city.trim() || undefined
            : undefined,

        emergencyAvailable:
          emergencyAvailable === "" ||
          emergencyAvailable === "ALL" ||
          emergencyAvailable === undefined
            ? undefined
            : emergencyAvailable,

        featured:
          featured === "" ||
          featured === "ALL" ||
          featured === undefined
            ? undefined
            : featured,

        includeArchived,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page,
        size,
        sortBy,
        sortDirection
      }
    }
  );

  return response.data;
};

export const getAdminHospitalSummary =
  async () => {
    const response = await api.get(
      "/admin/hospitals/summary"
    );

    return response.data;
  };

export const getAdminHospitalFilterOptions =
  async () => {
    const response = await api.get(
      "/admin/hospitals/filter-options"
    );

    return response.data;
  };

export const getAdminHospitalById = async (
  hospitalId
) => {
  assertAdminHospitalId(hospitalId);

  const response = await api.get(
    `/admin/hospitals/${hospitalId}`
  );

  return response.data;
};

/* =====================================
   HOSPITAL CREATE / UPDATE
===================================== */

export const createAdminHospital = async (
  payload
) => {
  if (!payload || typeof payload !== "object") {
    throw new Error(
      "Hospital payload is required"
    );
  }

  const response = await api.post(
    "/admin/hospitals",
    payload
  );

  return response.data;
};

export const updateAdminHospital = async (
  hospitalId,
  payload
) => {
  assertAdminHospitalId(hospitalId);

  if (!payload || typeof payload !== "object") {
    throw new Error(
      "Hospital update payload is required"
    );
  }

  const response = await api.put(
    `/admin/hospitals/${hospitalId}`,
    payload
  );

  return response.data;
};

/* =====================================
   HOSPITAL VERIFICATION / STATUS
===================================== */

export const updateAdminHospitalVerification =
  async (
    hospitalId,
    payload
  ) => {
    assertAdminHospitalId(hospitalId);

    if (!payload || typeof payload !== "object") {
      throw new Error(
        "Verification payload is required"
      );
    }

    const response = await api.patch(
      `/admin/hospitals/${hospitalId}/verification`,
      payload
    );

    return response.data;
  };

export const updateAdminHospitalStatus =
  async (
    hospitalId,
    payload
  ) => {
    assertAdminHospitalId(hospitalId);

    if (!payload || typeof payload !== "object") {
      throw new Error(
        "Hospital status payload is required"
      );
    }

    const response = await api.patch(
      `/admin/hospitals/${hospitalId}/status`,
      payload
    );

    return response.data;
  };

/* =====================================
   FEATURE / UNFEATURE
===================================== */

export const updateAdminHospitalFeatured =
  async (
    hospitalId,
    payload
  ) => {
    assertAdminHospitalId(hospitalId);

    if (!payload || typeof payload !== "object") {
      throw new Error(
        "Featured hospital payload is required"
      );
    }

    const response = await api.patch(
      `/admin/hospitals/${hospitalId}/featured`,
      payload
    );

    return response.data;
  };

/* =====================================
   ARCHIVE / RESTORE HOSPITAL
===================================== */

export const archiveAdminHospital = async (
  hospitalId,
  payload
) => {
  assertAdminHospitalId(hospitalId);

  if (!payload || typeof payload !== "object") {
    throw new Error(
      "Archive payload is required"
    );
  }

  const response = await api.patch(
    `/admin/hospitals/${hospitalId}/archive`,
    payload
  );

  return response.data;
};

export const restoreAdminHospital = async (
  hospitalId,
  payload
) => {
  assertAdminHospitalId(hospitalId);

  if (!payload || typeof payload !== "object") {
    throw new Error(
      "Restore payload is required"
    );
  }

  const response = await api.patch(
    `/admin/hospitals/${hospitalId}/restore`,
    payload
  );

  return response.data;
};

/* =====================================
   HOSPITAL DEPARTMENTS
===================================== */

export const createAdminHospitalDepartment =
  async (
    hospitalId,
    payload
  ) => {
    assertAdminHospitalId(hospitalId);

    if (!payload || typeof payload !== "object") {
      throw new Error(
        "Department payload is required"
      );
    }

    const response = await api.post(
      `/admin/hospitals/${hospitalId}/departments`,
      payload
    );

    return response.data;
  };

export const updateAdminHospitalDepartment =
  async (
    hospitalId,
    departmentId,
    payload
  ) => {
    assertAdminHospitalId(hospitalId);

    assertAdminHospitalChildId(
      departmentId,
      "Department id"
    );

    if (!payload || typeof payload !== "object") {
      throw new Error(
        "Department update payload is required"
      );
    }

    const response = await api.put(
      `/admin/hospitals/${hospitalId}/departments/${departmentId}`,
      payload
    );

    return response.data;
  };

export const updateAdminHospitalDepartmentStatus =
  async (
    hospitalId,
    departmentId,
    payload
  ) => {
    assertAdminHospitalId(hospitalId);

    assertAdminHospitalChildId(
      departmentId,
      "Department id"
    );

    if (!payload || typeof payload !== "object") {
      throw new Error(
        "Department status payload is required"
      );
    }

    const response = await api.patch(
      `/admin/hospitals/${hospitalId}/departments/${departmentId}/status`,
      payload
    );

    return response.data;
  };

export const archiveAdminHospitalDepartment =
  async (
    hospitalId,
    departmentId,
    payload
  ) => {
    assertAdminHospitalId(hospitalId);

    assertAdminHospitalChildId(
      departmentId,
      "Department id"
    );

    if (!payload || typeof payload !== "object") {
      throw new Error(
        "Department archive payload is required"
      );
    }

    const response = await api.delete(
      `/admin/hospitals/${hospitalId}/departments/${departmentId}`,
      {
        data: payload
      }
    );

    return response.data;
  };

/* =====================================
   HOSPITAL IMAGES
===================================== */

export const createAdminHospitalImage =
  async (
    hospitalId,
    payload
  ) => {
    assertAdminHospitalId(hospitalId);

    if (!payload || typeof payload !== "object") {
      throw new Error(
        "Hospital image payload is required"
      );
    }

    const response = await api.post(
      `/admin/hospitals/${hospitalId}/images`,
      payload
    );

    return response.data;
  };

export const updateAdminHospitalImage =
  async (
    hospitalId,
    imageId,
    payload
  ) => {
    assertAdminHospitalId(hospitalId);

    assertAdminHospitalChildId(
      imageId,
      "Image id"
    );

    if (!payload || typeof payload !== "object") {
      throw new Error(
        "Hospital image update payload is required"
      );
    }

    const response = await api.put(
      `/admin/hospitals/${hospitalId}/images/${imageId}`,
      payload
    );

    return response.data;
  };

export const archiveAdminHospitalImage =
  async (
    hospitalId,
    imageId,
    payload
  ) => {
    assertAdminHospitalId(hospitalId);

    assertAdminHospitalChildId(
      imageId,
      "Image id"
    );

    if (!payload || typeof payload !== "object") {
      throw new Error(
        "Hospital image archive payload is required"
      );
    }

    const response = await api.delete(
      `/admin/hospitals/${hospitalId}/images/${imageId}`,
      {
        data: payload
      }
    );

    return response.data;
  };

/* =====================================
   HOSPITAL APPOINTMENTS
===================================== */

export const getAdminHospitalAppointments =
  async (
    hospitalId,
    {
      status = "ALL",
      page = 0,
      size = 10,
      sortBy = "createdAt",
      sortDirection = "DESC"
    } = {}
  ) => {
    assertAdminHospitalId(hospitalId);

    const response = await api.get(
      `/admin/hospitals/${hospitalId}/appointments`,
      {
        params: {
          status,
          page,
          size,
          sortBy,
          sortDirection
        }
      }
    );

    return response.data;
  };

/* =====================================
   HOSPITAL AUDIT ACTIVITY
===================================== */

export const getAdminHospitalActivity =
  async (
    hospitalId,
    {
      page = 0,
      size = 20
    } = {}
  ) => {
    assertAdminHospitalId(hospitalId);

    const response = await api.get(
      `/admin/hospitals/${hospitalId}/activity`,
      {
        params: {
          page,
          size
        }
      }
    );

    return response.data;
  };
  
  export const getAdminNotifications = async ({
  page = 0,
  size = 20,
  type = "",
  priority = ""
} = {}) => {
  const params = { page, size };

  if (type && type !== "ALL") {
    params.type = type;
  }

  if (priority && priority !== "ALL") {
    params.priority = priority;
  }

  const response = await api.get(
    "/admin/notifications",
    { params }
  );

  return response.data;
};

export const getAdminUnreadNotificationCount = async () => {
  const response = await api.get(
    "/admin/notifications/unread-count"
  );

  return response.data;
};

export const consumeAdminNotification = async (
  notificationId
) => {
  const response = await api.patch(
    `/admin/notifications/${notificationId}/consume`
  );

  return response.data;
};
/* =====================================
   ADMIN LAB MANAGEMENT API
===================================== */

const assertAdminLabIdentity = (
  sourceType,
  labId
) => {
  const normalizedSourceType = String(
    sourceType ?? ""
  )
    .trim()
    .toUpperCase();

  const normalizedLabId = Number(
    labId
  );

  const validSourceTypes = [
    "SYSTEM_VERIFIED",
    "DOCTOR_ADDED"
  ];

  if (
    !validSourceTypes.includes(
      normalizedSourceType
    )
  ) {
    throw new Error(
      "Valid lab source type is required"
    );
  }

  if (
    !Number.isInteger(
      normalizedLabId
    ) ||
    normalizedLabId <= 0
  ) {
    throw new Error(
      "Valid laboratory id is required"
    );
  }

  return {
    sourceType:
      normalizedSourceType,
    labId:
      normalizedLabId
  };
};

const assertAdminLabPayload = (
  payload,
  label = "Lab payload"
) => {
  if (
    !payload ||
    typeof payload !== "object"
  ) {
    throw new Error(`${label} is required`);
  }
};

export const getAdminLabs = async ({
  search = "",
  sourceType = "ALL",
  labType = "ALL",
  operationalStatus = "ALL",
  verificationStatus = "ALL",
  city = "",
  includeArchived = false,
  fromDate = "",
  toDate = "",
  page = 0,
  size = 10,
  sortBy = "updatedAt",
  sortDirection = "DESC"
} = {}) => {
  const response = await api.get(
    "/admin/labs",
    {
      params: {
        search:
          typeof search === "string"
            ? search.trim() || undefined
            : undefined,

        sourceType:
          sourceType || "ALL",

        labType:
          labType || "ALL",

        operationalStatus:
          operationalStatus || "ALL",

        verificationStatus:
          verificationStatus || "ALL",

        city:
          typeof city === "string"
            ? city.trim() || undefined
            : undefined,

        includeArchived:
          Boolean(includeArchived),

        fromDate:
          fromDate || undefined,

        toDate:
          toDate || undefined,

        page,
        size,
        sortBy,
        sortDirection
      }
    }
  );

  return response.data;
};

export const getAdminLabSummary =
  async () => {
    const response = await api.get(
      "/admin/labs/summary"
    );

    return response.data;
  };

export const getAdminLabFilterOptions =
  async () => {
    const response = await api.get(
      "/admin/labs/filter-options"
    );

    return response.data;
  };

export const getAdminLabById = async (
  sourceType,
  labId
) => {
  const identity =
    assertAdminLabIdentity(
      sourceType,
      labId
    );

  const response = await api.get(
    `/admin/labs/${encodeURIComponent(
      identity.sourceType
    )}/${identity.labId}`
  );

  return response.data;
};

export const createAdminLab = async (
  payload
) => {
  assertAdminLabPayload(
    payload,
    "Lab creation payload"
  );

  const response = await api.post(
    "/admin/labs",
    payload
  );

  return response.data;
};

export const updateAdminLab = async (
  sourceType,
  labId,
  payload
) => {
  assertAdminLabIdentity(
    sourceType,
    labId
  );

  assertAdminLabPayload(
    payload,
    "Lab update payload"
  );

  const response = await api.put(
    `/admin/labs/${sourceType}/${labId}`,
    payload
  );

  return response.data;
};

export const updateAdminLabVerification =
  async (
    labId,
    payload
  ) => {
    assertAdminLabIdentity(
      "DOCTOR_ADDED",
      labId
    );

    assertAdminLabPayload(
      payload,
      "Lab verification payload"
    );

    const response = await api.patch(
      `/admin/labs/DOCTOR_ADDED/${labId}/verification`,
      payload
    );

    return response.data;
  };

export const updateAdminLabStatus = async (
  sourceType,
  labId,
  payload
) => {
  assertAdminLabIdentity(
    sourceType,
    labId
  );

  assertAdminLabPayload(
    payload,
    "Lab status payload"
  );

  const response = await api.patch(
    `/admin/labs/${sourceType}/${labId}/status`,
    payload
  );

  return response.data;
};

export const archiveAdminLab = async (
  sourceType,
  labId,
  payload
) => {
  assertAdminLabIdentity(
    sourceType,
    labId
  );

  assertAdminLabPayload(
    payload,
    "Lab archive payload"
  );

  const response = await api.patch(
    `/admin/labs/${sourceType}/${labId}/archive`,
    payload
  );

  return response.data;
};

export const restoreAdminLab = async (
  sourceType,
  labId,
  payload
) => {
  assertAdminLabIdentity(
    sourceType,
    labId
  );

  assertAdminLabPayload(
    payload,
    "Lab restore payload"
  );

  const response = await api.patch(
    `/admin/labs/${sourceType}/${labId}/restore`,
    payload
  );

  return response.data;
};
/* =====================================
   ADMIN BLOG MANAGEMENT API
===================================== */

const assertAdminBlogId = (blogId) => {
  const normalizedBlogId = Number(blogId);

  if (
    !Number.isInteger(normalizedBlogId) ||
    normalizedBlogId <= 0
  ) {
    throw new Error("Valid blog id is required");
  }

  return normalizedBlogId;
};

const buildBlogFormData = ({
  payload,
  coverImage = null
}) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Blog payload is required");
  }

  const formData = new FormData();

  formData.append(
    "request",
    JSON.stringify(payload)
  );

  if (coverImage instanceof File) {
    formData.append(
      "coverImage",
      coverImage
    );
  }

  return formData;
};

export const getAdminBlogs = async ({
  search = "",
  status = "ALL",
  category = "",
  includeArchived = false,
  page = 0,
  size = 10,
  sortBy = "updatedAt",
  sortDirection = "DESC"
} = {}) => {
  const response = await api.get(
    "/admin/blogs",
    {
      params: {
        search:
          typeof search === "string"
            ? search.trim() || undefined
            : undefined,

        status:
          status || "ALL",

        category:
          typeof category === "string"
            ? category.trim() || undefined
            : undefined,

        includeArchived:
          Boolean(includeArchived),

        page,
        size,
        sortBy,
        sortDirection
      }
    }
  );

  return response.data;
};

export const getAdminBlogSummary = async () => {
  const response = await api.get(
    "/admin/blogs/summary"
  );

  return response.data;
};

export const getAdminBlogFilterOptions =
  async () => {
    const response = await api.get(
      "/admin/blogs/filter-options"
    );

    return response.data;
  };

export const getAdminBlogById = async (
  blogId
) => {
  const safeBlogId =
    assertAdminBlogId(blogId);

  const response = await api.get(
    `/admin/blogs/${safeBlogId}`
  );

  return response.data;
};

export const createAdminBlog = async ({
  payload,
  coverImage = null
}) => {
  const formData = buildBlogFormData({
    payload,
    coverImage
  });

  const response = await api.post(
    "/admin/blogs",
    formData,
    multipartRequestConfig
  );

  return response.data;
};

export const updateAdminBlog = async (
  blogId,
  {
    payload,
    coverImage = null
  }
) => {
  const safeBlogId =
    assertAdminBlogId(blogId);

  const formData = buildBlogFormData({
    payload,
    coverImage
  });

  const response = await api.put(
    `/admin/blogs/${safeBlogId}`,
    formData,
    multipartRequestConfig
  );

  return response.data;
};

export const publishAdminBlog = async (
  blogId,
  version
) => {
  const safeBlogId =
    assertAdminBlogId(blogId);

  const response = await api.patch(
    `/admin/blogs/${safeBlogId}/publish`,
    {
      version
    }
  );

  return response.data;
};

export const unpublishAdminBlog = async (
  blogId,
  version
) => {
  const safeBlogId =
    assertAdminBlogId(blogId);

  const response = await api.patch(
    `/admin/blogs/${safeBlogId}/unpublish`,
    {
      version
    }
  );

  return response.data;
};

export const archiveAdminBlog = async (
  blogId,
  version
) => {
  const safeBlogId =
    assertAdminBlogId(blogId);

  const response = await api.patch(
    `/admin/blogs/${safeBlogId}/archive`,
    {
      version
    }
  );

  return response.data;
};

export const restoreAdminBlog = async (
  blogId,
  version
) => {
  const safeBlogId =
    assertAdminBlogId(blogId);

  const response = await api.patch(
    `/admin/blogs/${safeBlogId}/restore`,
    {
      version
    }
  );

  return response.data;
};

export const deleteAdminBlog = async (
  blogId,
  version
) => {
  const safeBlogId =
    assertAdminBlogId(blogId);

  const response = await api.delete(
    `/admin/blogs/${safeBlogId}`,
    {
      params: {
        version
      }
    }
  );

  return response.data;
};