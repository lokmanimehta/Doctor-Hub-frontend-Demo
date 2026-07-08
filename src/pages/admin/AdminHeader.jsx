import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiBell,
  FiChevronDown,
  FiLogOut,
  FiMenu,
  FiRefreshCw,
  FiUser
} from "react-icons/fi";
import useAdminNotifications from "../../context/useAdminNotifications";
import "./AdminHeader.css";
import { AuthContext } from "../../context/AuthContext";
import { useAuthActions } from "../../services/authService";
import { getAdminProfile } from "../../services/adminService";
import defaultAdminAvatar from "../../assets/images/avtar.png";

const routeTitles = {
  "/admin": "Dashboard Overview",
  "/admin/dashboard": "Dashboard Overview",
  "/admin/doctors-management": "Doctors Management",
  "/admin/doctors": "Doctors Directory",
  "/admin/verify-doctors": "Pending Verifications",
  "/admin/users": "User Management",
  "/admin/hospitals": "Hospital Management",
  "/admin/labs": "Laboratory Management",
  "/admin/appointments": "Appointments Overview",
  "/admin/profile": "Profile Settings",
  "/admin/notifications": "Notifications",
  "/admin/system-logs": "System Logs",
  "/admin/feedback": "Patient Feedback",
  "/admin/ads-management": "Ads Management",
  "/admin/blogs": "Blog Management",
  "/admin/settings": "System Settings"
};

const AdminHeader = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const { currentUser, setCurrentUser } = useContext(AuthContext);
  const { logoutUser } = useAuthActions(setCurrentUser);
  const { unreadCount } = useAdminNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);
  const [headerLoading, setHeaderLoading] = useState(true);
  const [headerError, setHeaderError] = useState("");
  const [avatarSrc, setAvatarSrc] = useState(defaultAdminAvatar);

  const currentPath = location.pathname.toLowerCase();

  const resolvedTitle = useMemo(() => {
    if (currentPath.startsWith("/admin/doctors/")) {
      return "Doctor Details";
    }

    return routeTitles[currentPath] || "Admin Panel";
  }, [currentPath]);

  const getSafeImageUrl = useCallback((url) => {
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

  const loadHeaderData = useCallback(async () => {
    try {
      setHeaderLoading(true);
      setHeaderError("");

      const response = await getAdminProfile();
      const profileData = response?.data || null;

      if (!profileData) {
        throw new Error("Admin profile not found");
      }

      setAdminProfile(profileData);
      setAvatarSrc(getSafeImageUrl(profileData.profileImageUrl));

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
    } catch (error) {
      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Unable to load admin header details.";

      setHeaderError(message);
      setAvatarSrc(defaultAdminAvatar);
    } finally {
      setHeaderLoading(false);
    }
  }, [getSafeImageUrl, setCurrentUser]);

  useEffect(() => {
    loadHeaderData();
  }, [loadHeaderData]);

  useEffect(() => {
    setAvatarSrc(getSafeImageUrl(adminProfile?.profileImageUrl));
  }, [adminProfile?.profileImageUrl, getSafeImageUrl]);

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

  const handleOpenSidebar = () => {
    setIsCollapsed(false);
    setDropdownOpen(false);
  };

  const handleNotifications = () => {
    setDropdownOpen(false);
    navigate("/admin/notifications");
  };

  const handleProfileNavigation = () => {
    setDropdownOpen(false);
    navigate("/admin/profile");
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logoutUser();
  };

  return (
    <header
      className={`admin-header ${isCollapsed ? "admin-header--collapsed" : ""
        }`}
    >
      <div className="admin-header__left">
        <button
          type="button"
          className="admin-header__mobile-menu"
          onClick={handleOpenSidebar}
          aria-label="Open admin sidebar"
        >
          <FiMenu />
        </button>

        <div className="admin-header__title-block">
          <span className="admin-header__eyebrow">Admin Panel</span>
          <h1 className="admin-header__title">{resolvedTitle}</h1>
        </div>
      </div>

      <div className="admin-header__right" ref={dropdownRef}>
        <button
          type="button"
          className="admin-header__notification-button"
          onClick={handleNotifications}
          aria-label={`Open admin notifications. ${unreadCount} unread`}
        >
          <FiBell />

          {unreadCount > 0 && (
            <span className="admin-header__notification-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          className="admin-header__account-button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          aria-label="Open admin account menu"
        >
          <span className="admin-header__account-copy">
            <span className="admin-header__greet">Hello,</span>
            <span className="admin-header__account-name">
              {headerLoading ? "Loading..." : displayName}
            </span>
          </span>

          <span className="admin-header__avatar-shell">
            <img
              src={avatarSrc}
              alt={displayName}
              className="admin-header__avatar"
              onError={() => setAvatarSrc(defaultAdminAvatar)}
            />
          </span>

          <FiChevronDown className="admin-header__chevron" />
        </button>

        {dropdownOpen && (
          <div className="admin-header__dropdown">
            <div className="admin-header__dropdown-top">
              <img
                src={avatarSrc}
                alt={displayName}
                className="admin-header__dropdown-avatar"
                onError={() => setAvatarSrc(defaultAdminAvatar)}
              />

              <div className="admin-header__dropdown-user">
                <strong>{displayName}</strong>
                <span>{displayEmail || "Admin account"}</span>
              </div>
            </div>

            {headerError && (
              <div className="admin-header__error">
                {headerError}
              </div>
            )}

            <section className="admin-header__account-section">
              <div className="admin-header__section-heading">
                <div>
                  <span>Account</span>
                  <small>System administrator access</small>
                </div>

                <button
                  type="button"
                  className="admin-header__refresh-button"
                  onClick={loadHeaderData}
                  aria-label="Refresh admin profile"
                >
                  <FiRefreshCw />
                </button>
              </div>

              <div className="admin-header__account-summary">
                <div>
                  <span>Role</span>
                  <strong>{displayRole}</strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>
                    {adminProfile?.blocked
                      ? "Blocked"
                      : adminProfile?.active
                        ? "Active"
                        : "Inactive"}
                  </strong>
                </div>
              </div>
            </section>

            <div className="admin-header__divider" />

            <button
              type="button"
              className="admin-header__menu-action"
              onClick={handleProfileNavigation}
            >
              <span className="admin-header__menu-icon">
                <FiUser />
              </span>
              <span>My Profile</span>
            </button>

            <button
              type="button"
              className="admin-header__menu-action admin-header__menu-action--logout"
              onClick={handleLogout}
            >
              <span className="admin-header__menu-icon">
                <FiLogOut />
              </span>
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;