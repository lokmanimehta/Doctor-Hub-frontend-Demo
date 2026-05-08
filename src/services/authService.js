import api, {
  clearAuthStorage,
  refreshAccessToken,
  storeSessionData
} from "./api";
import { useNavigate } from "react-router-dom";

/* =========================
   LOGIN
========================= */
export const loginUser = async (credentials) => {
  const res = await api.post("/auth/login", credentials);

  const data = res?.data?.data;
  const accessToken = data?.accessToken;
  const refreshToken = data?.refreshToken;
  const user = data?.user;

  if (!accessToken || !refreshToken || !user) {
    throw new Error("Invalid login response from server");
  }

  storeSessionData({
    accessToken,
    refreshToken,
    user,
    rememberMe: !!credentials.rememberMe
  });

  return user;
};

/* =========================
   RESTORE SESSION
========================= */
export const restoreUserSession = async () => {
  const refreshToken =
    localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken");

  if (!refreshToken) {
    clearAuthStorage();
    return null;
  }

  try {
    const refreshResult = await refreshAccessToken();
    return refreshResult.user || null;
  } catch {
    clearAuthStorage();
    return null;
  }
};

/* =========================
   SIGNUP
========================= */
export const signupUser = async (userData) => {
  const res = await api.post("/auth/signup", userData);
  return res.data;
};

/* =========================
   LOGOUT
========================= */
export const useAuthActions = (setCurrentUser) => {
  const navigate = useNavigate();

  const logoutUser = async () => {
    try {
      const refreshToken =
        localStorage.getItem("refreshToken") ||
        sessionStorage.getItem("refreshToken");

      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch (err) {
      console.error("Logout API failed", err);
    }finally {
  sessionStorage.setItem("manualLogout", "true");

  clearAuthStorage();

  if (setCurrentUser) {
    setCurrentUser(null);
  }

  navigate("/", { replace: true });
}
  };

  return { logoutUser };
};

/* =========================
   FORGOT PASSWORD
========================= */
export const forgotPassword = async (identifier) => {
  const res = await api.post("/auth/forgot-password", { identifier });
  return res.data;
};

/* =========================
   RESET PASSWORD
========================= */
export const resetPassword = async (data) => {
  const res = await api.post("/auth/reset-password", data);
  return res.data;
};

/* =========================
   FAMILY PROFILE
========================= */
export const getPatientProfiles = async () => {
  const res = await api.get("/patient/profiles");
  return res.data;
};

/* =========================
   DOCTOR PATIENT API
========================= */
export const createDoctorPatient = async (payload) => {
  const response = await api.post("/doctor/patients", payload);
  return response.data;
};