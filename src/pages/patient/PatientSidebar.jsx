import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/useNotifications";
import {
  FiActivity,
  FiBell,
  FiCalendar,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiClipboard,
  FiFileText,
  FiGrid,
  FiHelpCircle,
  FiHome,
  FiLogOut,
  FiMessageSquare,
  FiShield,
  FiUser,
  FiUsers,
  FiX
} from "react-icons/fi";
import { FaHospital } from "react-icons/fa";

import "./PatientSidebar.css";
import Logo from "../../assets/images/logo.png";
import defaultPatientAvatar from "../../assets/images/avtar.png";

import { AuthContext } from "../../context/AuthContext";
import { useAuthActions } from "../../services/authService";
import { getPatientProfile } from "../../services/patientService";

const PatientSidebar = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const footerMenuRef = useRef(null);

  const { currentUser, setCurrentUser } = useContext(AuthContext);
  const { logoutUser } = useAuthActions(setCurrentUser);
  const { unreadCount } = useNotifications() || { unreadCount: 0 };

  const notificationBadgeCount = Number(unreadCount || 0);

  const [showFooterMenu, setShowFooterMenu] = useState(false);
  const [patientProfile, setPatientProfile] = useState(null);
  const [avatarSrc, setAvatarSrc] = useState(defaultPatientAvatar);
  const [profileLoading, setProfileLoading] = useState(true);

  const menuGroups = useMemo(
    () => [
      {
        groupName: "Overview",
        items: [
          {
            name: "Dashboard",
            path: "/patient/dashboard",
            icon: <FiGrid />,
            activeMatch: (pathname) =>
              pathname === "/patient" ||
              pathname.startsWith("/patient/dashboard")
          },
          {
            name: "Appointments",
            path: "/patient/appointments",
            icon: <FiCalendar />,
            activeMatch: (pathname) =>
              pathname.startsWith("/patient/appointments")
          },
          {
            name: "Find Doctors",
            path: "/patient/finddoctors",
            icon: <FiUsers />,
            activeMatch: (pathname) =>
              pathname.startsWith("/patient/finddoctors") ||
              pathname.startsWith("/patient/doctorsprofile")
          },
          {
            name: "Past Consultations",
            path: "/patient/mydoctors",
            icon: <FiUsers />,
            activeMatch: (pathname) =>
              pathname.startsWith("/patient/mydoctors")
          },
          {
            name: "Hospitals",
            path: "/patient/hospitals",
            icon: <FaHospital />,
            activeMatch: (pathname) =>
              pathname.startsWith("/patient/hospitals")
          }
        ]
      },
      {
        groupName: "Medical Vault",
        items: [
          {
            name: "Medical Records",
            path: "/patient/records",
            icon: <FiShield />,
            activeMatch: (pathname) =>
              pathname.startsWith("/patient/records")
          },
          {
            name: "Prescriptions",
            path: "/patient/prescriptions",
            icon: <FiClipboard />,
            activeMatch: (pathname) =>
              pathname.startsWith("/patient/prescriptions")
          },
          {
            name: "Labs",
            path: "/patient/labs",
            icon: <FiActivity />,
            activeMatch: (pathname) =>
              pathname.startsWith("/patient/labs")
          },
          {
            name: "Lab Reports",
            path: "/patient/lab-reports",
            icon: <FiFileText />,
            activeMatch: (pathname) =>
              pathname.startsWith("/patient/lab-reports")
          }
        ]
      },
      {
        groupName: "Support",
        items: [
          {
            name: "Notifications",
            path: "/patient/notifications",
            icon: <FiBell />,
            badge: notificationBadgeCount,
            activeMatch: (pathname) =>
              pathname.startsWith("/patient/notifications")
          },
          {
            name: "Feedback",
            path: "/patient/feedback",
            icon: <FiMessageSquare />,
            activeMatch: (pathname) =>
              pathname.startsWith("/patient/feedback")
          },
          {
            name: "Help",
            path: "/patient/help",
            icon: <FiHelpCircle />,
            activeMatch: (pathname) =>
              pathname.startsWith("/patient/help")
          }
        ]
      }
    ],
    [notificationBadgeCount]
  );

  const getSafePatientImage = useCallback((url) => {
    if (!url || typeof url !== "string") {
      return defaultPatientAvatar;
    }

    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      return defaultPatientAvatar;
    }

    const isLocalBrowser =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!isLocalBrowser && trimmedUrl.includes("localhost:8080")) {
      return defaultPatientAvatar;
    }

    return trimmedUrl;
  }, []);

  const loadSidebarProfile = useCallback(async () => {
    try {
      setProfileLoading(true);

      const response = await getPatientProfile();
      const profileData = response?.data || response || null;

      setPatientProfile(profileData);
      setAvatarSrc(getSafePatientImage(profileData?.profileImageUrl));
    } catch {
      setAvatarSrc(defaultPatientAvatar);
    } finally {
      setProfileLoading(false);
    }
  }, [getSafePatientImage]);

  useEffect(() => {
    loadSidebarProfile();
  }, [loadSidebarProfile]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsMobileOpen(false);
        setShowFooterMenu(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [setIsMobileOpen]);

  useEffect(() => {
    if (!isMobileOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileOpen]);

  useEffect(() => {
    const handleClickOutsideFooterMenu = (event) => {
      if (
        footerMenuRef.current &&
        !footerMenuRef.current.contains(event.target)
      ) {
        setShowFooterMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutsideFooterMenu);

    return () => {
      document.removeEventListener("mousedown", handleClickOutsideFooterMenu);
    };
  }, []);

  const displayName =
    patientProfile?.fullName ||
    currentUser?.fullName ||
    "Patient";

  const displayEmail =
    patientProfile?.email ||
    currentUser?.email ||
    "";

  const displayRole = currentUser?.role || "PATIENT";

  const displaySubText =
    patientProfile?.mobile ||
    displayEmail ||
    "Patient account";

  const closeMobileSidebar = useCallback(() => {
    setIsMobileOpen(false);
    setShowFooterMenu(false);
  }, [setIsMobileOpen]);

  const handleNavigate = useCallback(
    (path) => {
      navigate(path);
      closeMobileSidebar();
    },
    [navigate, closeMobileSidebar]
  );

  const handleLogoNavigate = () => {
    navigate("/");
    closeMobileSidebar();
  };

  const handleUserCardClick = () => {
    if (isCollapsed && !isMobileOpen) {
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

  const isItemActive = (item) => {
    if (typeof item.activeMatch === "function") {
      return item.activeMatch(location.pathname);
    }

    return location.pathname === item.path;
  };

  const handleSidebarMenuClick = () => {
    setIsMobileOpen(false);
    setShowFooterMenu(false);
  };

  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          className="patient-sidebar-overlay"
          onClick={closeMobileSidebar}
          aria-label="Close patient sidebar overlay"
        />
      )}

      <aside
        className={`patient-sidebar ${
          isCollapsed ? "patient-sidebar--collapsed" : "patient-sidebar--expanded"
        } ${isMobileOpen ? "patient-sidebar--mobile-open" : ""}`}
        aria-label="Patient navigation sidebar"
      >
        <div className="patient-sidebar__header">
          <button
            type="button"
            className="patient-sidebar__logo-button"
            onClick={handleLogoNavigate}
            aria-label="Go to Doctor Hub home"
          >
            {isCollapsed && !isMobileOpen ? (
              <span className="patient-sidebar__logo-rail">
                <img
                  src={Logo}
                  alt="Doctor Hub"
                  className="patient-sidebar__logo-mini"
                />
              </span>
            ) : (
              <span className="patient-sidebar__brand">
                <img
                  src={Logo}
                  alt="Doctor Hub"
                  className="patient-sidebar__logo"
                />
                <span className="patient-sidebar__brand-text">
                  Doctor<span>Hub</span>
                </span>
              </span>
            )}
          </button>

          {isMobileOpen ? (
            <button
              type="button"
              className="patient-sidebar__mobile-close"
              onClick={closeMobileSidebar}
              aria-label="Close patient sidebar"
            >
              <FiX />
            </button>
          ) : (
            <button
              type="button"
              className="patient-sidebar__collapse-button"
              onClick={() => {
                setIsCollapsed((prev) => !prev);
                setShowFooterMenu(false);
              }}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </button>
          )}
        </div>

        <nav className="patient-sidebar__nav" aria-label="Patient menu">
          {menuGroups.map((group) => (
            <section
              key={group.groupName}
              className="patient-sidebar__group"
            >
              {(!isCollapsed || isMobileOpen) && (
                <p className="patient-sidebar__group-title">
                  {group.groupName}
                </p>
              )}

              <ul className="patient-sidebar__list">
                {group.items.map((item) => {
                  const active = isItemActive(item);
                  const hasBadge = Number(item.badge || 0) > 0;

                  return (
                    <li
                      key={item.name}
                      className="patient-sidebar__list-item"
                    >
                      <NavLink
                        to={item.path}
                        data-label={item.name}
                        title={isCollapsed && !isMobileOpen ? item.name : undefined}
                        aria-current={active ? "page" : undefined}
                        onClick={handleSidebarMenuClick}
                        className={() =>
                          active
                            ? "patient-sidebar__link patient-sidebar__link--active"
                            : "patient-sidebar__link"
                        }
                      >
                        <span className="patient-sidebar__icon-wrap">
                          <span className="patient-sidebar__icon">
                            {item.icon}
                          </span>

                          {hasBadge && isCollapsed && !isMobileOpen && (
                            <span className="patient-sidebar__icon-badge">
                              {item.badge > 99 ? "99+" : item.badge}
                            </span>
                          )}
                        </span>

                        {(!isCollapsed || isMobileOpen) && (
                          <>
                            <span className="patient-sidebar__link-text">
                              {item.name}
                            </span>

                            {hasBadge && (
                              <span className="patient-sidebar__badge">
                                {item.badge > 99 ? "99+" : item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </nav>

        <div
          className="patient-sidebar__footer"
          ref={footerMenuRef}
        >
          {showFooterMenu && (!isCollapsed || isMobileOpen) && (
            <div className="patient-sidebar__footer-menu">
              <div className="patient-sidebar__footer-menu-user">
                <img
                  src={avatarSrc}
                  alt={displayName}
                  className="patient-sidebar__footer-menu-avatar"
                  onError={() => setAvatarSrc(defaultPatientAvatar)}
                />

                <div className="patient-sidebar__footer-menu-text">
                  <strong>
                    {profileLoading ? "Loading..." : displayName}
                  </strong>
                  <span>{displayEmail || displayRole}</span>
                </div>
              </div>

              <button
                type="button"
                className="patient-sidebar__footer-action"
                onClick={() => handleNavigate("/")}
              >
                <FiHome />
                <span>Home</span>
              </button>

              <button
                type="button"
                className="patient-sidebar__footer-action"
                onClick={() => handleNavigate("/patient/profile")}
              >
                <FiUser />
                <span>My Profile</span>
              </button>

              <button
                type="button"
                className="patient-sidebar__footer-action"
                onClick={() => handleNavigate("/patient/help")}
              >
                <FiHelpCircle />
                <span>Help & Support</span>
              </button>

              <button
                type="button"
                className="patient-sidebar__footer-action patient-sidebar__footer-action--logout"
                onClick={handleLogout}
              >
                <FiLogOut />
                <span>Logout</span>
              </button>
            </div>
          )}

          <button
            type="button"
            data-label={displayName}
            className={`patient-sidebar__user-card ${
              isCollapsed && !isMobileOpen
                ? "patient-sidebar__user-card--centered"
                : ""
            }`}
            onClick={handleUserCardClick}
            aria-label="Open patient account menu"
          >
            <span className="patient-sidebar__avatar-shell">
              <img
                src={avatarSrc}
                alt={displayName}
                className="patient-sidebar__user-avatar"
                onError={() => setAvatarSrc(defaultPatientAvatar)}
              />
            </span>

            {(!isCollapsed || isMobileOpen) && (
              <>
                <span className="patient-sidebar__user-text">
                  <strong>
                    {profileLoading ? "Loading..." : displayName}
                  </strong>
                  <small>{displaySubText}</small>
                </span>

                <FiChevronDown className="patient-sidebar__user-chevron" />
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default PatientSidebar;