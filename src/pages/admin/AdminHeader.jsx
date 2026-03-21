import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./AdminHeader.css";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useAuthActions } from "../../services/authService";
const AdminHeader = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("currentUser"));

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { setCurrentUser } = useContext(AuthContext);
const { logoutUser } = useAuthActions(setCurrentUser);
  // 🔴 IMPORTANT: Doctor header jaisa click-outside fix
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
  
  setDropdownOpen(false);
  logoutUser(); // ✅ hook ke andar sab handle ho jayega
};

  const pageTitles = {
  "/admin/dashboard": "Dashboard Overview",

  "/admin/doctors": "Doctors Directory",

  "/admin/verify-doctors": "Pending Verifications",

  "/admin/users": "User Management",

  "/admin/hospitals": "Hospital Management",

  "/admin/labs": "Laboratory Management",

  "/admin/appointments": "Appointments Overview",

  "/admin/system-logs": "System Logs",

  "/admin/feedback": "Patient Feedback",

  "/admin/profile": "My Profile",

  "/admin/settings": "System Settings",
};

  const currentTitle =
    pageTitles[location.pathname] || "Admin Panel";

  return (
    <header className="admin-header">
      {/* LEFT SECTION */}
      <div className="header-left">
        <button
          className="mobile-nav-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          ☰
        </button>

        <h1 className="page-main-title">{currentTitle}</h1>
      </div>

      {/* RIGHT SECTION (dropdownRef yahin hona MUST hai) */}
      <div className="header-right" ref={dropdownRef}>
        <div
          className="profile-trigger"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <div className="admin-info-text">
            <span className="greet">Hello,</span>
            <span className="name">
              {user?.fullName || "Admin User"}
            </span>
          </div>

          <div className="img-container">
            <img
              src={user?.profileImg || "https://i.pravatar.cc/40"}
              alt="Profile"
              className="admin-avatar"
            />
            <div className="online-indicator"></div>
          </div>
        </div>

        {/* 🔽 DROPDOWN */}
        {dropdownOpen && (
          <div className="header-dropdown-menu">
            <div className="dropdown-user-info">
              <span className="name">
                {user?.fullName || "Admin User"}
              </span>
              <span className="role">SYSTEM ADMIN</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/admin/profile");
                setDropdownOpen(false);
              }}
            >
              👤 My Profile
            </button>

            <button
              type="button"
              className="logout-btn-text"
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;