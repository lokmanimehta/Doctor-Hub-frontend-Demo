import api from "./api";
import { useNavigate } from "react-router-dom";

/* =========================
   LOGIN
   ========================= */
export const loginUser = async (credentials) => {

  const res = await api.post("/auth/login", credentials);

  console.log("LOGIN RESPONSE FULL:", res.data);

  const accessToken = res.data.data.accessToken;
  const refreshToken = res.data.data.refreshToken;
  const user = res.data.data.user;

  sessionStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
  localStorage.setItem("currentUser", JSON.stringify(user));

  return user;

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
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch (err) {
      console.error("Logout API failed", err);
    } finally {
      sessionStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("currentUser");

      if (setCurrentUser) setCurrentUser(null);

      navigate("/");
    }
  };

  return { logoutUser };
};

/* =========================
   FORGOT PASSWORD
========================= */

export const forgotPassword = async (identifier) => {

  const res = await api.post("/auth/forgot-password", {
    identifier
  });

  return res.data;

};


/* =========================
   RESET PASSWORD
========================= */

export const resetPassword = async (data) => {

  const res = await api.post("/auth/reset-password", data);

  return res.data;

};