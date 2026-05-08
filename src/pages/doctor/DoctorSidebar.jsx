import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiBell,
  FiCalendar,
  FiClock,
  FiGrid,
  FiUserPlus,
  FiUsers
} from "react-icons/fi";
import "./DoctorSidebar.css";
import Logo from "../../assets/images/logo.png";
import defaultDoctorAvatar from "../../assets/images/avtar.png";

import { AuthContext } from "../../context/AuthContext";
import { DoctorProfileContext } from "../../context/DoctorProfileContext";
import { useNotifications } from "../../context/useNotifications";
import { useAuthActions } from "../../services/authService";

const DoctorSidebar = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}) => {
  const [showFooterMenu, setShowFooterMenu] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(defaultDoctorAvatar);

  const navigate = useNavigate();
  const footerMenuRef = useRef(null);

  const { currentUser, setCurrentUser } = useContext(AuthContext);
  const { doctorProfile, doctorProfileLoading } = useContext(DoctorProfileContext);
  const { unreadCount } = useNotifications();
  const { logoutUser } = useAuthActions(setCurrentUser);

  const menu = useMemo(
    () => [
      { name: "Dashboard", path: "/doctor/dashboard", icon: <FiGrid /> },
      { name: "Appointments", path: "/doctor/appointments", icon: <FiCalendar /> },
      { name: "Patients", path: "/doctor/patients", icon: <FiUsers /> },
      { name: "Add Patient", path: "/doctor/add-patient", icon: <FiUserPlus /> },
      { name: "Availability", path: "/doctor/availability", icon: <FiClock /> },
      { name: "Labs", path: "/doctor/labs", icon: <FiActivity /> },
      {
        name: "Notifications",
        path: "/doctor/notifications",
        icon: <FiBell />,
        badge: unreadCount
      }
    ],
    [unreadCount]
  );

  const displayName = doctorProfile?.fullName || currentUser?.fullName || "Doctor";

  const displayRole =
    doctorProfile?.specializations?.[0] || currentUser?.role || "DOCTOR";

  const getSafeDoctorImage = (url) => {
    if (!url || typeof url !== "string") return defaultDoctorAvatar;

    if (url.includes("localhost:8080")) {
      return defaultDoctorAvatar;
    }

    return url;
  };

  const profileImageUrl = getSafeDoctorImage(
    doctorProfile?.profilePictureUrl?.trim()
  );

  useEffect(() => {
    setAvatarSrc(profileImageUrl);
  }, [profileImageUrl]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setIsCollapsed(true);
      } else {
        setIsMobileOpen(false);
        setIsCollapsed(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [setIsCollapsed, setIsMobileOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (footerMenuRef.current && !footerMenuRef.current.contains(event.target)) {
        setShowFooterMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleUserCardClick = () => {
    if (window.innerWidth <= 1024) {
      setShowFooterMenu((prev) => !prev);
      return;
    }

    if (isCollapsed) {
      setIsCollapsed(false);
      setShowFooterMenu(false);
      return;
    }

    setShowFooterMenu((prev) => !prev);
  };

  const handleLogout = async () => {
    setShowFooterMenu(false);
    setIsMobileOpen(false);
    await logoutUser();
  };

  return (
    <>
      {isMobileOpen && (
        <div
          className="sidebar-mobile-overlay"
          onClick={() => {
            setIsMobileOpen(false);
            setShowFooterMenu(false);
          }}
        />
      )}

      <aside
        className={`doctor-sidebar ${isCollapsed ? "collapsed" : "expanded"} ${isMobileOpen ? "mobile-active" : ""
          }`}
      >
        <div className="sidebar-header">
          <div
            className="logo-area"
            onClick={() => navigate("/")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/");
            }}
          >
            {isCollapsed && !isMobileOpen ? (
              <img src={Logo} alt="DH" className="sidebar-logo-icon" />
            ) : (
              <div className="full-logo-wrapper">
                <img src={Logo} alt="Doctor's Hub" className="sidebar-logo-img" />
                <h2 className="doctor-logo">
                  Doctor's <span>Hub</span>
                </h2>
              </div>
            )}
          </div>

          {isMobileOpen ? (
            <button
              type="button"
              className="mobile-close-btn"
              onClick={() => {
                setIsMobileOpen(false);
                setShowFooterMenu(false);
              }}
              aria-label="Close sidebar"
            >
              ✕
            </button>
          ) : (
            <button
              type="button"
              className="desktop-toggle-arrow"
              onClick={() => {
                setIsCollapsed((prev) => !prev);
                setShowFooterMenu(false);
              }}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? "❯" : "❮"}
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          <ul className="sidebar-ul">
            {menu.map((item) => (
              <li key={item.name} className="sidebar-li">
                <NavLink
                  to={item.path}
                  onClick={() => {
                    setIsMobileOpen(false);
                    setShowFooterMenu(false);
                  }}
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  <span className="nav-icon nav-icon-wrap">
                    {item.icon}
                    {item.badge > 0 && (
                      <span className="sidebar-notification-badge sidebar-notification-badge-icon">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </span>

                  {(!isCollapsed || isMobileOpen) && (
                    <span className="nav-text">{item.name}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer" ref={footerMenuRef}>
          {showFooterMenu && (!isCollapsed || isMobileOpen) && (
            <div className="sidebar-footer-dropdown">
              <div className="sidebar-dropdown-user-info">
                <img
                  src={avatarSrc}
                  alt={displayName}
                  className="sidebar-dropdown-avatar"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    setAvatarSrc(defaultDoctorAvatar);
                  }}
                />
                <div className="sidebar-dropdown-user-text">
                  <span className="sidebar-dropdown-name">
                    {doctorProfileLoading ? "Loading..." : `Dr. ${displayName}`}
                  </span>
                  <span className="sidebar-dropdown-role">{displayRole}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigate("/doctor/profile");
                  setShowFooterMenu(false);
                  setIsMobileOpen(false);
                }}
              >
                <span>👤</span> View Profile
              </button>

              <button
                type="button"
                onClick={() => {
                  navigate("/doctor/notifications");
                  setShowFooterMenu(false);
                  setIsMobileOpen(false);
                }}
              >
                <span>🔔</span> Notifications
              </button>

              <button type="button" className="logout-btn" onClick={handleLogout}>
                <span>🚪</span> Logout
              </button>
            </div>
          )}

          <button
            type="button"
            className={`sidebar-user-card ${isCollapsed && !isMobileOpen ? "centered" : ""}`}
            onClick={handleUserCardClick}
          >
            <img
              src={avatarSrc}
              alt={displayName}
              className="user-avatar"
              onError={(e) => {
                e.currentTarget.onerror = null;
                setAvatarSrc(defaultDoctorAvatar);
              }}
            />

            {(!isCollapsed || isMobileOpen) && (
              <div className="user-info">
                <p className="user-name">
                  {doctorProfileLoading ? "Loading..." : `Dr. ${displayName}`}
                </p>
                <p className="user-role">{displayRole}</p>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default DoctorSidebar;