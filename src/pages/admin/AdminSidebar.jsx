import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import useAdminNotifications from "../../context/useAdminNotifications";
import {
  FiActivity,
  FiBell,
  FiBookOpen,
  FiCalendar,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiClipboard,
  FiFileText,
  FiGrid,
  FiHome,
  FiImage,
  FiLogOut,
  FiMessageSquare,
  FiRefreshCw,
  FiShield,
  FiUser,
  FiUsers,
  FiX
} from "react-icons/fi";
import { FaHospital } from "react-icons/fa";

import "./AdminSidebar.css";
import Logo from "../../assets/images/logo.jpeg";
import defaultAdminAvatar from "../../assets/images/avtar.png";

import { AuthContext } from "../../context/AuthContext";
import { useAuthActions } from "../../services/authService";
import { getAdminProfile } from "../../services/adminService";

const AdminSidebar = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const footerMenuRef = useRef(null);

  const { currentUser, setCurrentUser } = useContext(AuthContext);
  const { logoutUser } = useAuthActions(setCurrentUser);
  const { unreadCount } = useAdminNotifications();
  const [isMobile, setIsMobile] = useState(false);
  const [showFooterMenu, setShowFooterMenu] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);
  const [avatarSrc, setAvatarSrc] = useState(defaultAdminAvatar);
  const [profileLoading, setProfileLoading] = useState(true);

  const isMobileOpen = isMobile && !isCollapsed;

  const menuGroups = useMemo(
    () => [
      {
        groupName: "Overview",
        items: [
          {
            name: "Dashboard",
            path: "/admin/dashboard",
            icon: <FiGrid />,
            activeMatch: (pathname) =>
              pathname === "/admin" || pathname.startsWith("/admin/dashboard")
          },
          {
            name: "Appointments",
            path: "/admin/appointments",
            icon: <FiCalendar />,
            activeMatch: (pathname) =>
              pathname.startsWith("/admin/appointments")
          }
        ]
      },
      {
        groupName: "Management",
        items: [
          {
            name: "Doctors",
            path: "/admin/doctors",
            icon: <FiUser />,
            activeMatch: (pathname) => pathname.startsWith("/admin/doctors")
          },
          {
            name: "Pending Verification",
            path: "/admin/verify-doctors",
            icon: <FiShield />,
            activeMatch: (pathname) =>
              pathname.startsWith("/admin/verify-doctors")
          },
          {
            name: "Users",
            path: "/admin/users",
            icon: <FiUsers />,
            activeMatch: (pathname) => pathname.startsWith("/admin/users")
          },
          {
            name: "Hospitals",
            path: "/admin/hospitals",
            icon: <FaHospital />,
            activeMatch: (pathname) => pathname.startsWith("/admin/hospitals")
          },
          {
            name: "Labs",
            path: "/admin/labs",
            icon: <FiActivity />,
            activeMatch: (pathname) => pathname.startsWith("/admin/labs")
          }
        ]
      },
      {
        groupName: "Support & Content",
        items: [
          {
            name: "Feedback",
            path: "/admin/feedback",
            icon: <FiMessageSquare />,
            activeMatch: (pathname) => pathname.startsWith("/admin/feedback")
          },
          {
            name: "Blogs",
            path: "/admin/blogs",
            icon: <FiBookOpen />,
            activeMatch: (pathname) => pathname.startsWith("/admin/blogs")
          },
          {
            name: "Notifications",
            path: "/admin/notifications",
            icon: <FiBell />,
            badge: unreadCount,
            activeMatch: (pathname) =>
              pathname.startsWith("/admin/notifications")
          },
          {
            name: "Ads Management",
            path: "/admin/ads-management",
            icon: <FiImage />,
            activeMatch: (pathname) =>
              pathname.startsWith("/admin/ads-management")
          }
        ]
      },
      {
        groupName: "System",
        items: [
          {
            name: "System Logs",
            path: "/admin/system-logs",
            icon: <FiFileText />,
            activeMatch: (pathname) =>
              pathname.startsWith("/admin/system-logs")
          }
        ]
      }
    ],
    [unreadCount]
  );

  const getSafeAdminImage = useCallback((url) => {
    if (!url || typeof url !== "string") {
      return defaultAdminAvatar;
    }

    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      return defaultAdminAvatar;
    }

    const isLocalBrowser =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!isLocalBrowser && trimmedUrl.includes("localhost:8080")) {
      return defaultAdminAvatar;
    }

    return trimmedUrl;
  }, []);

  const loadSidebarProfile = useCallback(async () => {
    try {
      setProfileLoading(true);

      const response = await getAdminProfile();
      const profileData = response?.data || null;

      if (!profileData) {
        throw new Error("Admin profile not found");
      }

      setAdminProfile(profileData);
      setAvatarSrc(getSafeAdminImage(profileData.profileImageUrl));

      setCurrentUser((previousUser) => {
        const updatedUser = {
          ...(previousUser || {}),
          userId: profileData.userId,
          fullName: profileData.fullName,
          email: profileData.email,
          mobile: profileData.mobile,
          role: profileData.role,
          username: profileData.username,
          isVerified: profileData.verified,
          profileImageUrl: profileData.profileImageUrl
        };

        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        return updatedUser;
      });
    } catch {
      setAvatarSrc(defaultAdminAvatar);
    } finally {
      setProfileLoading(false);
    }
  }, [getSafeAdminImage, setCurrentUser]);

  useEffect(() => {
    loadSidebarProfile();
  }, [loadSidebarProfile]);

  useEffect(() => {
    const handleResize = () => {
      const mobileView = window.innerWidth <= 1024;
      setIsMobile(mobileView);

      if (mobileView) {
        setIsCollapsed(true);
        setShowFooterMenu(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [setIsCollapsed]);

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
    adminProfile?.fullName ||
    currentUser?.fullName ||
    "System Admin";

  const displayEmail =
    adminProfile?.email ||
    currentUser?.email ||
    "";

  const displayRole =
    adminProfile?.role ||
    currentUser?.role ||
    "ADMIN";

  const displaySubText =
    displayEmail ||
    adminProfile?.mobile ||
    "Admin account";

  const closeMobileSidebar = useCallback(() => {
    if (isMobile) {
      setIsCollapsed(true);
    }

    setShowFooterMenu(false);
  }, [isMobile, setIsCollapsed]);

  const handleNavigate = useCallback(
    (path) => {
      navigate(path);
      closeMobileSidebar();
    },
    [navigate, closeMobileSidebar]
  );

  const handleLogoNavigate = () => {
    navigate("/admin/dashboard");
    closeMobileSidebar();
  };

  const handleSidebarMenuClick = () => {
    closeMobileSidebar();
  };

  const handleUserCardClick = () => {
    if (isCollapsed && !isMobile) {
      setIsCollapsed(false);
      setShowFooterMenu(false);
      return;
    }

    setShowFooterMenu((prev) => !prev);
  };

  const handleLogout = async () => {
    setShowFooterMenu(false);
    closeMobileSidebar();
    await logoutUser();
  };

  const isItemActive = (item) => {
    if (typeof item.activeMatch === "function") {
      return item.activeMatch(location.pathname);
    }

    return location.pathname === item.path;
  };

  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          className="admin-sidebar-overlay"
          onClick={closeMobileSidebar}
          aria-label="Close admin sidebar overlay"
        />
      )}

      <aside
        className={`admin-sidebar ${isCollapsed ? "admin-sidebar--collapsed" : "admin-sidebar--expanded"
          } ${isMobileOpen ? "admin-sidebar--mobile-open" : ""}`}
        aria-label="Admin navigation sidebar"
      >
        <div className="admin-sidebar__header">
          <button
            type="button"
            className="admin-sidebar__logo-button"
            onClick={handleLogoNavigate}
            aria-label="Go to admin dashboard"
          >
            {isCollapsed && !isMobile ? (
              <span className="admin-sidebar__logo-rail">
                <img
                  src={Logo}
                  alt="Sucura"
                  className="admin-sidebar__logo-mini"
                />
              </span>
            ) : (
              <span className="admin-sidebar__brand">
                <img
                  src={Logo}
                  alt="Sucura"
                  className="admin-sidebar__logo"
                />
                <span className="admin-sidebar__brand-text">
                  Sucura
                </span>
              </span>
            )}
          </button>

          {isMobileOpen ? (
            <button
              type="button"
              className="admin-sidebar__mobile-close"
              onClick={closeMobileSidebar}
              aria-label="Close admin sidebar"
            >
              <FiX />
            </button>
          ) : (
            <button
              type="button"
              className="admin-sidebar__collapse-button"
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

        <nav className="admin-sidebar__nav" aria-label="Admin menu">
          {menuGroups.map((group) => (
            <section
              key={group.groupName}
              className="admin-sidebar__group"
            >
              {(!isCollapsed || isMobileOpen) && (
                <p className="admin-sidebar__group-title">
                  {group.groupName}
                </p>
              )}

              <ul className="admin-sidebar__list">
                {group.items.map((item) => {
                  const active = isItemActive(item);

                  return (
                    <li
                      key={item.name}
                      className="admin-sidebar__list-item"
                    >
                      <NavLink
                        to={item.path}
                        data-label={item.name}
                        title={isCollapsed && !isMobile ? item.name : undefined}
                        aria-current={active ? "page" : undefined}
                        onClick={handleSidebarMenuClick}
                        className={() =>
                          active
                            ? "admin-sidebar__link admin-sidebar__link--active"
                            : "admin-sidebar__link"
                        }
                      >
                        <span className="admin-sidebar__icon-wrap">
                          <span className="admin-sidebar__icon">
                            {item.icon}
                          </span>
                        </span>

                        {(!isCollapsed || isMobileOpen) && (
                          <span className="admin-sidebar__link-text">
                            {item.badge > 0 && (
                              <span
                                className={`admin-sidebar__notification-badge ${isCollapsed && !isMobile
                                    ? "admin-sidebar__notification-badge--collapsed"
                                    : ""
                                  }`}
                              >
                                {item.badge > 99 ? "99+" : item.badge}
                              </span>
                            )}
                            {item.name}
                          </span>
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
          className="admin-sidebar__footer"
          ref={footerMenuRef}
        >
          {showFooterMenu && (!isCollapsed || isMobileOpen) && (
            <div className="admin-sidebar__footer-menu">
              <div className="admin-sidebar__footer-menu-user">
                <img
                  src={avatarSrc}
                  alt={displayName}
                  className="admin-sidebar__footer-menu-avatar"
                  onError={() => setAvatarSrc(defaultAdminAvatar)}
                />

                <div className="admin-sidebar__footer-menu-text">
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
                className="admin-sidebar__footer-action"
                onClick={() => handleNavigate("/admin/dashboard")}
              >
                <FiHome />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                className="admin-sidebar__footer-action"
                onClick={() => handleNavigate("/admin/profile")}
              >
                <FiUser />
                <span>My Profile</span>
              </button>

              <button
                type="button"
                className="admin-sidebar__footer-action"
                onClick={loadSidebarProfile}
              >
                <FiRefreshCw />
                <span>Refresh Profile</span>
              </button>

              <button
                type="button"
                className="admin-sidebar__footer-action admin-sidebar__footer-action--logout"
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
            className={`admin-sidebar__user-card ${isCollapsed && !isMobile
              ? "admin-sidebar__user-card--centered"
              : ""
              }`}
            onClick={handleUserCardClick}
            aria-label="Open admin account menu"
          >
            <span className="admin-sidebar__avatar-shell">
              <img
                src={avatarSrc}
                alt={displayName}
                className="admin-sidebar__user-avatar"
                onError={() => setAvatarSrc(defaultAdminAvatar)}
              />
            </span>

            {(!isCollapsed || isMobileOpen) && (
              <>
                <span className="admin-sidebar__user-text">
                  <strong>
                    {profileLoading ? "Loading..." : displayName}
                  </strong>
                  <small>{displaySubText}</small>
                </span>

                <FiChevronDown className="admin-sidebar__user-chevron" />
              </>
            )}
          </button>

          {(!isCollapsed || isMobileOpen) && (
            <div className="admin-sidebar__version">
              <FiClipboard />
              <span>Admin Control Panel</span>
              <small>v1.0.2</small>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;