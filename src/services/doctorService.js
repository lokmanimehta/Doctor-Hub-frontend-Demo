import api from "./api";

/* =====================================
   DOCTOR PROFILE API
===================================== */

export const getDoctorProfile = async () => {
  const response = await api.get("/doctor/profile");
  return response.data;
};

export const updateDoctorProfile = async (payload) => {
  const response = await api.put("/doctor/profile", payload);
  return response.data;
};

/* =====================================
   DOCTOR DASHBOARD API
===================================== */

export const getDoctorDashboard = async () => {
  const response = await api.get("/doctor/dashboard");
  return response.data;
};

/* =====================================
   DOCTOR NOTIFICATION API
===================================== */

export const getDoctorNotifications = async (params = {}) => {
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

  const response = await api.get("/doctor/notifications", {
    params: cleanedParams
  });

  return response.data;
};

export const getDoctorUnreadNotificationCount = async () => {
  const response = await api.get("/doctor/notifications/unread-count");
  return response.data;
};

export const consumeDoctorNotification = async (notificationId) => {
  const response = await api.patch(`/doctor/notifications/${notificationId}/consume`);
  return response.data;
};

/* =====================================
   DOCTOR PATIENT API
===================================== */

export const createDoctorPatient = async (payload) => {
  const response = await api.post("/doctor/patients", payload);
  return response.data;
};

export const getPatients = async (params = {}) => {
  const cleanedParams = {};

  if (params.search?.trim()) {
    cleanedParams.search = params.search.trim();
  }

  if (params.gender && params.gender !== "All") {
    cleanedParams.gender = params.gender;
  }

  if (params.clinicId && params.clinicId !== "All") {
    cleanedParams.clinicId = params.clinicId;
  }

  if (typeof params.critical === "boolean") {
    cleanedParams.critical = params.critical;
  }

  if (typeof params.archived === "boolean") {
    cleanedParams.archived = params.archived;
  }

  cleanedParams.page = Number.isInteger(params.page) ? params.page : 0;
  cleanedParams.size = Number.isInteger(params.size) ? params.size : 10;

  const response = await api.get("/doctor/patients", {
    params: cleanedParams
  });

  return response.data;
};

export const archivePatient = async (id) => {
  const response = await api.patch(`/doctor/patients/${id}/archive`);
  return response.data;
};

export const unarchivePatient = async (id) => {
  const response = await api.patch(`/doctor/patients/${id}/unarchive`);
  return response.data;
};

export const getPatientById = async (id) => {
  const response = await api.get(`/doctor/patients/${id}`);
  return response.data;
};

/* =====================================
   VISIT API
===================================== */



export const createPatientVisit = async (patientId, payload) => {
  const response = await api.post(`/doctor/patients/${patientId}/visits`, payload);
  return response.data;
};

export const getPatientVisits = async (patientId) => {
  const response = await api.get(`/doctor/patients/${patientId}/visits`);
  return response.data;
};

export const updatePatientVisit = async (visitId, payload) => {
  const response = await api.put(`/doctor/patients/visits/${visitId}`, payload);
  return response.data;
};
/* =====================================
   PRESCRIPTION API
===================================== */

export const createPatientPrescription = async (patientId, payload) => {
  const response = await api.post(`/doctor/patients/${patientId}/prescriptions`, payload);
  return response.data;
};

export const getPatientPrescriptions = async (patientId) => {
  const response = await api.get(`/doctor/patients/${patientId}/prescriptions`);
  return response.data;
};

export const updatePatientPrescription = async (prescriptionId, payload) => {
  const response = await api.put(
    `/doctor/patients/prescriptions/${prescriptionId}`,
    payload
  );
  return response.data;
};

export const deletePatientPrescription = async (prescriptionId) => {
  const response = await api.patch(
    `/doctor/patients/prescriptions/${prescriptionId}/delete`
  );
  return response.data;
};

export const getAiPrescriptionAccess = async () => {
  const response = await api.get("/doctor/patients/ai-access");
  return response.data;
};

/* =====================================
   MEDICAL REPORT API
===================================== */

export const createPatientMedicalReport = async (patientId, payload) => {
  const formData = new FormData();

  formData.append("reportName", payload.reportName);
  formData.append("reportType", payload.reportType || "");
  formData.append("reportDate", String(payload.reportDate));
  formData.append("labName", payload.labName || "");
  formData.append("notes", payload.notes || "");

  if (payload.visitId != null) {
    formData.append("visitId", String(payload.visitId));
  }

  if (payload.prescriptionId != null) {
    formData.append("prescriptionId", String(payload.prescriptionId));
  }

  formData.append("file", payload.file);

  const response = await api.post(
    `/doctor/patients/${patientId}/reports`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );

  return response.data;
};

export const getPatientMedicalReports = async (patientId) => {
  const response = await api.get(`/doctor/patients/${patientId}/reports`);
  return response.data;
};

export const getPatientMedicalReportById = async (reportId) => {
  const response = await api.get(`/doctor/patients/reports/${reportId}`);
  return response.data;
};

export const deletePatientMedicalReport = async (reportId) => {
  const response = await api.patch(`/doctor/patients/reports/${reportId}/delete`);
  return response.data;
};

/* =====================================
   TEMPORARY / NEXT PHASE
===================================== */

export const deleteDoctorDocument = async (documentId) => {
  const response = await api.delete(`/doctor/profile/documents/${documentId}`);
  return response.data;
};

export const setPrimaryDoctorDocument = async (documentId) => {
  const response = await api.patch(`/doctor/profile/documents/${documentId}/primary`);
  return response.data;
};

/* =====================================
   DOCTOR NOTES API
===================================== */

export const createPatientDoctorNote = async (patientId, payload) => {
  const response = await api.post(`/doctor/patients/${patientId}/notes`, payload);
  return response.data;
};

export const getPatientDoctorNotes = async (patientId) => {
  const response = await api.get(`/doctor/patients/${patientId}/notes`);
  return response.data;
};

export const updatePatientDoctorNotePinStatus = async (noteId, pinned) => {
  const response = await api.patch(`/doctor/patients/notes/${noteId}/pin`, {
    pinned
  });
  return response.data;
};

export const deletePatientDoctorNote = async (noteId) => {
  const response = await api.patch(`/doctor/patients/notes/${noteId}/delete`);
  return response.data;
};

export const updatePatientDoctorNote = async (noteId, payload) => {
  const response = await api.put(`/doctor/patients/notes/${noteId}`, payload);
  return response.data;
};

/* =====================================
   DOCTOR APPOINTMENT API
===================================== */

export const createPatientAppointment = async (patientId, payload) => {
  const response = await api.post(`/doctor/patients/${patientId}/appointments`, payload);
  return response.data;
};

export const getPatientAppointments = async (patientId) => {
  const response = await api.get(`/doctor/patients/${patientId}/appointments`);
  return response.data;
};

export const updatePatientAppointment = async (appointmentId, payload) => {
  const response = await api.put(
    `/doctor/patients/appointments/${appointmentId}`,
    payload
  );
  return response.data;
};

export const cancelPatientAppointment = async (appointmentId) => {
  const response = await api.patch(
    `/doctor/patients/appointments/${appointmentId}/cancel`
  );
  return response.data;
};

export const markAppointmentNoShow = async (appointmentId) => {
  const response = await api.patch(
    `/doctor/patients/appointments/${appointmentId}/no-show`
  );
  return response.data;
};

export const markAppointmentCompleted = async (appointmentId, payload = {}) => {
  const response = await api.patch(
    `/doctor/patients/appointments/${appointmentId}/complete`,
    payload
  );
  return response.data;
};
export const getAllDoctorAppointments = async (params = {}) => {
  const cleanedParams = {};

  if (params.search?.trim()) {
    cleanedParams.search = params.search.trim();
  }

  if (params.status && params.status !== "ALL") {
    cleanedParams.status = params.status;
  }

  if (params.clinicId && params.clinicId !== "All") {
    cleanedParams.clinicId = params.clinicId;
  }

  if (params.date) {
    cleanedParams.date = params.date;
  }

  if (typeof params.critical === "boolean") {
    cleanedParams.critical = params.critical;
  }

  cleanedParams.page = Number.isInteger(params.page) ? params.page : 0;
  cleanedParams.size = Number.isInteger(params.size) ? params.size : 10;

  const response = await api.get("/doctor/patients/appointments/all", {
    params: cleanedParams
  });

  return response.data;
};
export const getDoctorAvailabilityClinics = async () => {
  const response = await api.get("/doctor/availability/clinics");
  return response.data;
};

export const getDoctorDayAvailability = async (clinicId, date) => {
  const response = await api.get("/doctor/availability/day", {
    params: { clinicId, date }
  });
  return response.data;
};


export const blockDoctorAvailabilityDay = async (payload) => {
  const response = await api.patch("/doctor/availability/day/block", payload);
  return response.data;
};

export const unblockDoctorAvailabilityDay = async (payload) => {
  const response = await api.patch("/doctor/availability/day/unblock", payload);
  return response.data;
};

export const blockDoctorAvailabilitySlot = async (payload) => {
  const response = await api.patch("/doctor/availability/slot/block", payload);
  return response.data;
};

export const unblockDoctorAvailabilitySlot = async (payload) => {
  const response = await api.patch("/doctor/availability/slot/unblock", payload);
  return response.data;
};

/* =====================================
   DOCTOR LABS API
===================================== */

export const getSystemLabs = async () => {
  console.log("API HIT => /doctor/labs/system");
  const response = await api.get("/doctor/labs/system");
  return response.data;
};

export const getMyLabs = async () => {
  const response = await api.get("/doctor/labs/my");
  return response.data;
};

export const createDoctorLab = async (payload) => {
  const response = await api.post("/doctor/labs/my", payload);
  return response.data;
};

export const getLabTestCatalog = async () => {
  const response = await api.get("/doctor/labs/tests");
  return response.data;
};

export const createPatientLabOrder = async (patientId, payload) => {
  const response = await api.post(`/doctor/patients/${patientId}/lab-orders`, payload);
  return response.data;
};

export const getPatientLabOrders = async (patientId) => {
  const response = await api.get(`/doctor/patients/${patientId}/lab-orders`);
  return response.data;
};

export const getPatientLabOrderById = async (labOrderId) => {
  const response = await api.get(`/doctor/patients/lab-orders/${labOrderId}`);
  return response.data;
};

export const updatePatientLabOrderStatus = async (labOrderId, payload) => {
  const response = await api.patch(`/doctor/patients/lab-orders/${labOrderId}/status`, payload);
  return response.data;
};

export const cancelPatientLabOrder = async (labOrderId) => {
  const response = await api.patch(`/doctor/patients/lab-orders/${labOrderId}/cancel`);
  return response.data;
};
export const submitDoctorProfileForReview = async () => {
  const response = await api.patch("/doctor/profile/submit-for-review");
  return response.data;
};
export const acceptDoctorAppointmentRequest = async (appointmentId, payload = {}) => {
  const response = await api.patch(
    `/doctor/patients/appointments/${appointmentId}/accept`,
    payload
  );

  return response.data;
};

export const rejectDoctorAppointmentRequest = async (appointmentId, payload = {}) => {
  const response = await api.patch(
    `/doctor/patients/appointments/${appointmentId}/reject`,
    payload
  );

  return response.data;
};