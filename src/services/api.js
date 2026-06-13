import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (newToken) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

export const getStoredRefreshToken = () =>
  localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken");

export const clearAuthStorage = () => {
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("selectedProfile");
  localStorage.removeItem("activeProfile");
  localStorage.removeItem("accessToken");
};

export const storeSessionData = ({ accessToken, refreshToken, user, rememberMe }) => {
  if (accessToken) {
    if (rememberMe) {
      localStorage.setItem("accessToken", accessToken);
      sessionStorage.removeItem("accessToken");
    } else {
      sessionStorage.setItem("accessToken", accessToken);
      localStorage.removeItem("accessToken");
    }
  }

  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
  }

  if (refreshToken) {
    if (rememberMe) {
      localStorage.setItem("refreshToken", refreshToken);
      sessionStorage.removeItem("refreshToken");
    } else {
      sessionStorage.setItem("refreshToken", refreshToken);
      localStorage.removeItem("refreshToken");
    }
  }
};
export const refreshAccessToken = async () => {
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
    refreshToken
  });

  const data = res?.data?.data;
  const newAccessToken = data?.accessToken;
  const newRefreshToken = data?.refreshToken;
  const user = data?.user;

  if (!newAccessToken || !newRefreshToken || !user) {
    throw new Error("Invalid refresh response");
  }

  const remembered = !!localStorage.getItem("refreshToken");

  storeSessionData({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user,
    rememberMe: remembered
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user
  };
};

api.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem("accessToken") ||
    localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh-token")
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshResult = await refreshAccessToken();
        const newAccessToken = refreshResult.accessToken;

        isRefreshing = false;
        onRefreshed(newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        clearAuthStorage();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    const backendData = error.response?.data;

let message =
  backendData?.message ||
  backendData?.error ||
  backendData?.reason ||
  backendData?.details ||
  "";

if (!message && backendData && typeof backendData === "object") {
  const fieldErrors = Object.values(backendData).filter(
    (value) => typeof value === "string" && value.trim()
  );

  if (fieldErrors.length > 0) {
    message = fieldErrors[0];
  }
}

if (!message) {
  message = error.message || "Something went wrong";
}

return Promise.reject({
  ...error,
  message,
  fieldErrors:
    backendData && typeof backendData === "object" ? backendData : null
});
  }
);

export default api;