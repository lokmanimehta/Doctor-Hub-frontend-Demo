import api from "./api";

const extractFileNameFromContentDisposition = (contentDisposition) => {
  if (!contentDisposition) {
    return null;
  }

  const utf8FileNameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8FileNameMatch && utf8FileNameMatch[1]) {
    return decodeURIComponent(utf8FileNameMatch[1].replace(/"/g, ""));
  }

  const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);

  if (fileNameMatch && fileNameMatch[1]) {
    return fileNameMatch[1].replace(/"/g, "");
  }

  return null;
};

export const getPatientProfile = async () => {
  const response = await api.get("/patient/profile");
  return response.data;
};

export const updatePatientProfile = async (payload) => {
  const response = await api.put("/patient/profile", payload);
  return response.data;
};

export const getPatientProfiles = async () => {
  const response = await api.get("/patient/profiles");
  return response.data;
};

export const getFamilyMembers = async () => {
  const response = await api.get("/patient/family-members");
  return response.data;
};

export const addFamilyMember = async (payload) => {
  const response = await api.post("/patient/family-members", payload);
  return response.data;
};

export const updateFamilyMember = async (memberId, payload) => {
  const response = await api.put(`/patient/family-members/${memberId}`, payload);
  return response.data;
};

export const deleteFamilyMember = async (memberId) => {
  const response = await api.delete(`/patient/family-members/${memberId}`);
  return response.data;
};

export const updatePatientContact = async (payload) => {
  const response = await api.put("/patient/profile/contact", payload);
  return response.data;
};

export const updatePatientAddress = async (payload) => {
  const response = await api.put("/patient/profile/address", payload);
  return response.data;
};

export const updatePatientPassword = async (payload) => {
  const response = await api.put("/patient/profile/password", payload);
  return response.data;
};

export const requestPatientEmailOtp = async (payload) => {
  const response = await api.post("/patient/profile/email/request-otp", payload);
  return response.data;
};

export const verifyPatientEmailOtp = async (payload) => {
  const response = await api.post("/patient/profile/email/verify-otp", payload);
  return response.data;
};

export const uploadPatientProfileImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/patient/profile/image", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return response.data;
};

export const getPatientDashboard = async () => {
  const response = await api.get("/patient/dashboard");
  return response.data;
};

export const createPatientSupportTicket = async (payload) => {
  const response = await api.post("/patient/support/tickets", payload);
  return response.data;
};

export const getPatientSupportTickets = async ({ page = 0, size = 5 } = {}) => {
  const response = await api.get("/patient/support/tickets", {
    params: {
      page,
      size
    }
  });

  return response.data;
};

export const getPatientSupportTicketById = async (ticketId) => {
  const response = await api.get(`/patient/support/tickets/${ticketId}`);
  return response.data;
};

export const getPatientAppointments = async ({
  status = "ALL",
  search = "",
  specialty = "",
  profileId,
  profileType
} = {}) => {
  const response = await api.get("/patient/appointments", {
    params: {
      status,
      search: search || undefined,
      specialty: specialty || undefined,
      profileId: profileId || undefined,
      profileType: profileType || undefined
    }
  });

  return response.data;
};

export const getPatientAppointmentById = async (appointmentId) => {
  const response = await api.get(`/patient/appointments/${appointmentId}`);
  return response.data;
};

export const cancelPatientAppointment = async (appointmentId, payload = {}) => {
  const response = await api.patch(
    `/patient/appointments/${appointmentId}/cancel`,
    payload
  );

  return response.data;
};

export const reschedulePatientAppointment = async (appointmentId, payload) => {
  const response = await api.patch(
    `/patient/appointments/${appointmentId}/reschedule`,
    payload
  );

  return response.data;
};

export const updatePatientAppointmentReminders = async (
  appointmentId,
  payload
) => {
  const response = await api.patch(
    `/patient/appointments/${appointmentId}/reminders`,
    payload
  );

  return response.data;
};

export const getPatientPastConsultations = async ({
  profileId,
  profileType,
  search = ""
} = {}) => {
  const response = await api.get("/patient/past-consultations", {
    params: {
      profileId: profileId || undefined,
      profileType: profileType || undefined,
      search: search || undefined
    }
  });

  return response.data;
};

export const getPatientMedicalRecords = async ({
  profileId,
  profileType,
  recordType = "ALL",
  source = "ALL",
  search = ""
} = {}) => {
  const response = await api.get("/patient/medical-records", {
    params: {
      profileId: profileId || undefined,
      profileType: profileType || undefined,
      recordType: recordType && recordType !== "ALL" ? recordType : undefined,
      source: source && source !== "ALL" ? source : undefined,
      search: search || undefined
    }
  });

  return response.data;
};

export const getPatientMedicalRecordById = async (recordId) => {
  const response = await api.get(
    `/patient/medical-records/${encodeURIComponent(recordId)}`
  );

  return response.data;
};

export const uploadPatientMedicalRecord = async ({
  file,
  title,
  recordType,
  recordDate,
  profileId,
  profileType,
  providerName = "",
  notes = ""
}) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("title", title);
  formData.append("recordType", recordType);
  formData.append("recordDate", recordDate);
  formData.append("profileId", profileId);
  formData.append("profileType", profileType);

  if (providerName) {
    formData.append("providerName", providerName);
  }

  if (notes) {
    formData.append("notes", notes);
  }

  const response = await api.post("/patient/medical-records/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return response.data;
};

export const downloadPatientMedicalRecord = async (recordId) => {
  const response = await api.get(
    `/patient/medical-records/${encodeURIComponent(recordId)}/download`,
    {
      responseType: "blob"
    }
  );

  const contentDisposition = response.headers?.["content-disposition"];
  const fileName = extractFileNameFromContentDisposition(contentDisposition);

  return {
    blob: response.data,
    fileName,
    contentType: response.headers?.["content-type"] || response.data?.type
  };
};

export const deletePatientMedicalRecord = async (recordId) => {
  const response = await api.delete(
    `/patient/medical-records/${encodeURIComponent(recordId)}`
  );

  return response.data;
};
export const getHospitals = async () => {
  const response = await api.get("/public/hospitals");
  return response.data;
};

export const searchHospitals = async ({
  q = "",
  city = "",
  department = "",
  bedType = ""
} = {}) => {
  const response = await api.get("/public/hospitals/search", {
    params: {
      q: q || undefined,
      city: city || undefined,
      department: department || undefined,
      bedType: bedType || undefined
    }
  });

  return response.data;
};

export const getHospitalById = async (hospitalId) => {
  const response = await api.get(`/public/hospitals/${hospitalId}`);
  return response.data;
};

export const getHospitalDepartments = async (hospitalId) => {
  const response = await api.get(`/public/hospitals/${hospitalId}/departments`);
  return response.data;
};

export const getHospitalSlots = async ({
  hospitalId,
  departmentId,
  date,
  bedType
}) => {
  const response = await api.get(
    `/public/hospitals/${hospitalId}/departments/${departmentId}/slots`,
    {
      params: {
        date,
        bedType
      }
    }
  );

  return response.data;
};

export const createHospitalAppointment = async (payload) => {
  const response = await api.post("/patient/hospital-appointments", payload);
  return response.data;
};

export const getPatientHospitalAppointments = async () => {
  const response = await api.get("/patient/hospital-appointments");
  return response.data;
};
export const getPatientPrescriptions = async ({
  profileId,
  profileType,
  status = "ALL",
  search = ""
} = {}) => {
  const response = await api.get("/patient/prescriptions", {
    params: {
      profileId: profileId || undefined,
      profileType: profileType || undefined,
      status: status && status !== "ALL" ? status : undefined,
      search: search || undefined
    }
  });

  return response.data;
};

export const getPatientPrescriptionById = async (prescriptionId) => {
  const response = await api.get(`/patient/prescriptions/${prescriptionId}`);
  return response.data;
};
export const getPublicLabs = async () => {
  const response = await api.get("/public/labs");
  return response.data;
};

export const getPublicLabTests = async () => {
  const response = await api.get("/public/lab-tests");
  return response.data;
};

export const getPublicLabById = async (labId) => {
  const response = await api.get(`/public/labs/${labId}`);
  return response.data;
};

export const createPatientLabBooking = async (payload) => {
  const response = await api.post("/patient/lab-bookings", payload);
  return response.data;
};

export const getPatientLabBookings = async () => {
  const response = await api.get("/patient/lab-bookings");
  return response.data;
};

export const getPatientLabBookingById = async (bookingId) => {
  const response = await api.get(`/patient/lab-bookings/${bookingId}`);
  return response.data;
};

export const cancelPatientLabBooking = async (bookingId, payload = {}) => {
  const response = await api.patch(
    `/patient/lab-bookings/${bookingId}/cancel`,
    payload
  );

  return response.data;
};
export const getPatientMedicalRecordShareableDoctors = async ({
  profileId,
  profileType
} = {}) => {
  const response = await api.get("/patient/medical-records/shareable-doctors", {
    params: {
      profileId: profileId || undefined,
      profileType: profileType || undefined
    }
  });

  return response.data;
};

export const sharePatientMedicalRecord = async (recordId, payload) => {
  const response = await api.post(
    `/patient/medical-records/${encodeURIComponent(recordId)}/share`,
    payload
  );

  return response.data;
};
/* =====================================
   PATIENT NOTIFICATION API
===================================== */

export const getPatientNotifications = async (params = {}) => {
  const cleanedParams = {
    page: Number.isInteger(params.page) ? params.page : 0,
    size: Number.isInteger(params.size) ? params.size : 20
  };

  if (params.type && params.type !== "ALL") {
    cleanedParams.type = params.type;
  }

  if (params.priority && params.priority !== "ALL") {
    cleanedParams.priority = params.priority;
  }

  const response = await api.get("/patient/notifications", {
    params: cleanedParams
  });

  return response.data;
};

export const getPatientUnreadNotificationCount = async () => {
  const response = await api.get("/patient/notifications/unread-count");
  return response.data;
};

export const markPatientNotificationAsRead = async (notificationId) => {
  const response = await api.patch(
    `/patient/notifications/${notificationId}/read`
  );

  return response.data;
};

export const markAllPatientNotificationsAsRead = async () => {
  const response = await api.patch("/patient/notifications/read-all");
  return response.data;
};

export const deletePatientNotification = async (notificationId) => {
  const response = await api.delete(`/patient/notifications/${notificationId}`);
  return response.data;
};
/* =====================================
   PATIENT FEEDBACK API
===================================== */

export const createPatientFeedback = async (payload) => {
  const response = await api.post("/patient/feedback", payload);
  return response.data;
};

export const getPatientFeedbacks = async ({ page = 0, size = 5 } = {}) => {
  const response = await api.get("/patient/feedback", {
    params: {
      page,
      size
    }
  });

  return response.data;
};

export const getPatientFeedbackById = async (feedbackId) => {
  const response = await api.get(`/patient/feedback/${feedbackId}`);
  return response.data;
};
/* =====================================
   DOCTOR PROFILE VIEW TRACKING
===================================== */

export const recordDoctorProfileView = async (
  doctorProfileId
) => {
  if (
    !doctorProfileId ||
    Number.isNaN(Number(doctorProfileId))
  ) {
    throw new Error(
      "Valid doctor profile ID is required"
    );
  }

  const response = await api.post(
    `/patient/doctors/${doctorProfileId}/profile-view`
  );

  return response.data;
};