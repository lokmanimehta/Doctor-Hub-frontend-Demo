import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/useNotifications";
import {
  FiBell,
  FiCheck,
  FiChevronDown,
  FiLogOut,
  FiMenu,
  FiRefreshCw,
  FiUser,
  FiUsers
} from "react-icons/fi";

import "./PatientHeader.css";
import { AuthContext } from "../../context/AuthContext";
import { useProfile } from "../../context/useProfile";
import { useAuthActions } from "../../services/authService";
import {
  getPatientProfile,
  getPatientProfiles
} from "../../services/patientService";
import defaultPatientAvatar from "../../assets/images/avtar.png";

const routeTitles = {
  "/patient": "Dashboard Overview",
  "/patient/dashboard": "Dashboard Overview",
  "/patient/appointments": "My Appointments",
  "/patient/finddoctors": "Find Doctors",
  "/patient/find-doctors": "Find Doctors",
  "/patient/mydoctors": "Past Consultations",
  "/patient/hospitals": "Hospitals",
  "/patient/records": "Medical Records",
  "/patient/medical-records": "Medical Records",
  "/patient/profile": "Profile Settings",
  "/patient/prescriptions": "Prescriptions",
  "/patient/labs": "Labs",
  "/patient/lab-reports": "Lab Reports",
  "/patient/notifications": "Notifications",
  "/patient/feedback": "Feedback",
  "/patient/help": "Help"
};

const PatientHeader = ({ setIsMobileOpen, isCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const { currentUser, setCurrentUser } = useContext(AuthContext);
  const { selectedProfile, selectProfile } = useProfile() || {};
  const { logoutUser } = useAuthActions(setCurrentUser);
  const {
  unreadCount,
  markAllPatientNotificationsReadAndClear
} = useNotifications() || { unreadCount: 0 };
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [patientProfile, setPatientProfile] = useState(null);
  const [bookingProfiles, setBookingProfiles] = useState([]);
  const [headerLoading, setHeaderLoading] = useState(true);
  const [headerError, setHeaderError] = useState("");
  const [avatarSrc, setAvatarSrc] = useState(defaultPatientAvatar);

  const currentPath = location.pathname.toLowerCase();

  const resolvedTitle = useMemo(() => {
    if (currentPath.startsWith("/patient/doctorsprofile/")) {
      return "Doctor Profile";
    }

    return routeTitles[currentPath] || "Patient Portal";
  }, [currentPath]);

  const getSafeImageUrl = useCallback((url) => {
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

  const resolveProfileLabel = useCallback((profile) => {
    if (!profile) {
      return "Self";
    }

    if (profile.type === "SELF") {
      return "Self";
    }

    return profile.relation || "Family";
  }, []);

  const normalizeProfilesResponse = (profilesResponse) => {
    if (Array.isArray(profilesResponse?.data?.profiles)) {
      return profilesResponse.data.profiles;
    }

    if (Array.isArray(profilesResponse?.profiles)) {
      return profilesResponse.profiles;
    }

    return [];
  };

  const normalizeProfileResponse = (profileResponse) => {
    return profileResponse?.data || profileResponse || null;
  };

  const loadHeaderData = useCallback(async () => {
    try {
      setHeaderLoading(true);
      setHeaderError("");

      const [profileResponse, profilesResponse] = await Promise.all([
        getPatientProfile(),
        getPatientProfiles()
      ]);

      const profileData = normalizeProfileResponse(profileResponse);
      const profilesData = normalizeProfilesResponse(profilesResponse);

      setPatientProfile(profileData);
      setBookingProfiles(profilesData);

      if (profilesData.length > 0) {
        const selfProfile =
          profilesData.find((profile) => profile.type === "SELF") ||
          profilesData[0];

        if (!selectedProfile) {
          selectProfile?.(selfProfile);
          return;
        }

        const selectedProfileStillExists = profilesData.some(
          (profile) =>
            profile.id === selectedProfile.id &&
            profile.type === selectedProfile.type
        );

        if (!selectedProfileStillExists) {
          selectProfile?.(selfProfile);
        }
      }
    } catch (error) {
      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Unable to load patient header details.";

      setHeaderError(message);
    } finally {
      setHeaderLoading(false);
    }
  }, [selectProfile, selectedProfile]);

  useEffect(() => {
    loadHeaderData();
  }, [loadHeaderData]);

  useEffect(() => {
    setAvatarSrc(getSafeImageUrl(patientProfile?.profileImageUrl));
  }, [patientProfile?.profileImageUrl, getSafeImageUrl]);

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
    patientProfile?.fullName ||
    currentUser?.fullName ||
    "Patient";

  const displayEmail =
    patientProfile?.email ||
    currentUser?.email ||
    "";

  const activeBookingProfile =
    selectedProfile ||
    bookingProfiles.find((profile) => profile.type === "SELF") ||
    null;

  const activeProfileName =
    activeBookingProfile?.fullName ||
    displayName;

  const activeProfileLabel = resolveProfileLabel(activeBookingProfile);

  const handleProfileSelect = (profile) => {
    selectProfile?.(profile);
  };

  const handleProfileNavigation = () => {
    setDropdownOpen(false);
    navigate("/patient/profile");
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logoutUser();
  };

  return (
    <header
      className={`patient-header ${isCollapsed ? "patient-header--collapsed" : ""
        }`}
    >
      <div className="patient-header__left">
        <button
          type="button"
          className="patient-header__mobile-menu"
          onClick={() => setIsMobileOpen?.(true)}
          aria-label="Open patient sidebar"
        >
          <FiMenu />
        </button>

        <div className="patient-header__title-block">
          <span className="patient-header__eyebrow">Patient Portal</span>
          <h1 className="patient-header__title">{resolvedTitle}</h1>
        </div>
      </div>

      <div className="patient-header__right" ref={dropdownRef}>
        <button
          type="button"
          className="patient-header__notification-button"
          onClick={() => {
  setDropdownOpen(false);
  markAllPatientNotificationsReadAndClear?.();
  navigate("/patient/notifications");
}}
          aria-label="Open patient notifications"
        >
          <FiBell />
          {unreadCount > 0 && (
            <span className="patient-header__notification-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
        <button
          type="button"
          className="patient-header__care-profile"
          onClick={() => setDropdownOpen((prev) => !prev)}
          aria-label="Switch booking profile"
        >
          <span className="patient-header__care-icon">
            <FiUsers />
          </span>

          <span className="patient-header__care-copy">
            <span className="patient-header__care-label">Booking for</span>
            <span className="patient-header__care-name">
              {activeProfileName}
            </span>
          </span>

          <span className="patient-header__care-relation">
            {activeProfileLabel}
          </span>
        </button>

        <button
          type="button"
          className="patient-header__account-button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          aria-label="Open patient account menu"
        >
          <span className="patient-header__account-copy">
            <span className="patient-header__account-name">
              {headerLoading ? "Loading..." : displayName}
            </span>
            <span className="patient-header__account-role">
              {currentUser?.role || "PATIENT"}
            </span>
          </span>

          <img
            src={avatarSrc}
            alt={displayName}
            className="patient-header__avatar"
            onError={() => setAvatarSrc(defaultPatientAvatar)}
          />

          <FiChevronDown className="patient-header__chevron" />
        </button>

        {dropdownOpen && (
          <div className="patient-header__dropdown">
            <div className="patient-header__dropdown-top">
              <img
                src={avatarSrc}
                alt={displayName}
                className="patient-header__dropdown-avatar"
                onError={() => setAvatarSrc(defaultPatientAvatar)}
              />

              <div className="patient-header__dropdown-user">
                <strong>{displayName}</strong>
                <span>{displayEmail || "Patient account"}</span>
              </div>
            </div>

            {headerError && (
              <div className="patient-header__error">
                {headerError}
              </div>
            )}

            <section className="patient-header__profile-section">
              <div className="patient-header__section-heading">
                <div>
                  <span>Care profile</span>
                  <small>Used while booking appointments</small>
                </div>

                <button
                  type="button"
                  className="patient-header__refresh-button"
                  onClick={loadHeaderData}
                  aria-label="Refresh patient profiles"
                >
                  <FiRefreshCw />
                </button>
              </div>

              <div className="patient-header__profile-list">
                {bookingProfiles.length === 0 ? (
                  <div className="patient-header__empty-state">
                    No linked profiles found.
                  </div>
                ) : (
                  bookingProfiles.map((profile) => {
                    const isActive =
                      activeBookingProfile?.id === profile.id &&
                      activeBookingProfile?.type === profile.type;

                    return (
                      <button
                        type="button"
                        key={`${profile.type}-${profile.id}`}
                        className={`patient-header__profile-option ${isActive
                            ? "patient-header__profile-option--active"
                            : ""
                          }`}
                        onClick={() => handleProfileSelect(profile)}
                      >
                        <span className="patient-header__profile-initial">
                          {profile.fullName?.charAt(0)?.toUpperCase() || "P"}
                        </span>

                        <span className="patient-header__profile-meta">
                          <strong>{profile.fullName}</strong>
                          <small>
                            {resolveProfileLabel(profile)}
                            {profile.gender ? ` • ${profile.gender}` : ""}
                          </small>
                        </span>

                        {isActive && (
                          <span className="patient-header__selected-mark">
                            <FiCheck />
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            <div className="patient-header__divider" />

            <button
              type="button"
              className="patient-header__menu-action"
              onClick={handleProfileNavigation}
            >
              <span className="patient-header__menu-icon">
                <FiUser />
              </span>
              <span>My Profile</span>
            </button>

            <button
              type="button"
              className="patient-header__menu-action patient-header__menu-action--logout"
              onClick={handleLogout}
            >
              <span className="patient-header__menu-icon">
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

export default PatientHeader;