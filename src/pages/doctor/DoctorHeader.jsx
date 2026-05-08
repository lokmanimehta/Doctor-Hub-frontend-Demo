import React, { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiBell } from "react-icons/fi";
import "./DoctorHeader.css";
import { AuthContext } from "../../context/AuthContext";
import { DoctorProfileContext } from "../../context/DoctorProfileContext";
import { useNotifications } from "../../context/useNotifications";
import { useAuthActions } from "../../services/authService";
import defaultDoctorAvatar from "../../assets/images/avtar.png";
import NotificationToast from "../../pages/doctor/NotificationToast";

const DoctorHeader = ({ setIsMobileOpen }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const { currentUser, setCurrentUser } = useContext(AuthContext);
  const { doctorProfile, doctorProfileLoading } = useContext(DoctorProfileContext);
  const { unreadCount, toast, hideToast } = useNotifications();

  const { logoutUser } = useAuthActions(setCurrentUser);

  const displayName = doctorProfile?.fullName || currentUser?.fullName || "Doctor";
  const displayRole = currentUser?.role || "DOCTOR";
  const profileImageUrl =
    doctorProfile?.profilePictureUrl?.trim() || defaultDoctorAvatar;

  const [avatarSrc, setAvatarSrc] = useState(profileImageUrl);

  useEffect(() => {
    setAvatarSrc(profileImageUrl);
  }, [profileImageUrl]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logoutUser();
  };

  const routeTitles = {
    "/doctor/dashboard": "Doctor Dashboard",
    "/doctor/appointments": "Appointment Management",
    "/doctor/patients": "Patient Records",
    "/doctor/profile": "Professional Profile",
    "/doctor/add-patient": "Add New Patient",
    "/doctor/availability": "Schedule & Availability",
    "/doctor/labs": "Laboratory Services",
    "/doctor/notifications": "Notifications Center"
  };

  const currentPath = location.pathname.toLowerCase();

  const resolvedTitle =
    currentPath.startsWith("/doctor/patients/") &&
    currentPath !== "/doctor/patients"
      ? "Patient Details"
      : routeTitles[currentPath] || "Doctor Workspace";

  return (
    <>
      <header className="doctor-header">
        <div className="header-left">
          <button
            className="mobile-toggle"
            type="button"
            onClick={() => setIsMobileOpen?.(true)}
            aria-label="Open sidebar menu"
          >
            ☰
          </button>

          <div className="header-title-wrap">
            <p className="header-subtitle">Doctor Portal</p>
            <h3 className="page-title">{resolvedTitle}</h3>
          </div>
        </div>

        <div className="header-right" ref={dropdownRef}>
          <button
            type="button"
            className="header-notification-btn"
            onClick={() => navigate("/doctor/notifications")}
            aria-label="Open notifications"
          >
            <FiBell />
            {unreadCount > 0 && (
              <span className="header-notification-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className="header-profile-section"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-label="Open profile menu"
          >
            <div className="profile-info">
              <span className="profile-name">
                {doctorProfileLoading ? "Loading..." : `Dr. ${displayName}`}
              </span>
            </div>

            <img
              src={avatarSrc}
              alt={displayName}
              className="header-avatar"
              onError={() => setAvatarSrc(defaultDoctorAvatar)}
            />
          </button>

          {dropdownOpen && (
            <div className="header-dropdown-menu">
              <div className="dropdown-user-info">
                <span className="name">{displayName}</span>
                <span className="role">{displayRole}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigate("/doctor/profile");
                  setDropdownOpen(false);
                }}
              >
                <span>👤</span> View Professional Profile
              </button>

              <button
                type="button"
                onClick={() => {
                  navigate("/doctor/notifications");
                  setDropdownOpen(false);
                }}
              >
                <span>🔔</span> Open Notifications
              </button>

              <button
                type="button"
                className="logout-btn-text"
                onClick={handleLogout}
              >
                <span>🚪</span> Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      <NotificationToast
        toast={toast}
        onClose={hideToast}
        onClick={() => {
          hideToast();
          navigate(toast?.targetRoute || "/doctor/notifications");
        }}
      />
    </>
  );
};

export default DoctorHeader;