import api from "./api";

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