import api from "./api";

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
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/admin/profile/image", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return response.data;
};

/* =====================================
   ADMIN FEEDBACK API
===================================== */

export const getAdminFeedbacks = async ({
  status = "ALL",
  type = "ALL",
  page = 0,
  size = 10
} = {}) => {
  const response = await api.get("/admin/feedback", {
    params: {
      status,
      type,
      page,
      size
    }
  });

  return response.data;
};

export const getAdminFeedbackById = async (feedbackId) => {
  const response = await api.get(`/admin/feedback/${feedbackId}`);
  return response.data;
};

export const updateAdminFeedbackStatus = async (feedbackId, payload) => {
  const response = await api.patch(`/admin/feedback/${feedbackId}/status`, payload);
  return response.data;
};