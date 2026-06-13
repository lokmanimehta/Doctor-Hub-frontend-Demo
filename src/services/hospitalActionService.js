import api from "./api";

export const getHospitalActionDetails = async (token) => {
  const response = await api.get(
    `/public/hospital-appointment-actions/${encodeURIComponent(token)}`
  );

  return response.data;
};

export const confirmHospitalAction = async (token, payload) => {
  const response = await api.post(
    `/public/hospital-appointment-actions/${encodeURIComponent(token)}/confirm`,
    payload
  );

  return response.data;
};

export const rejectHospitalAction = async (token, payload) => {
  const response = await api.post(
    `/public/hospital-appointment-actions/${encodeURIComponent(token)}/reject`,
    payload
  );

  return response.data;
};