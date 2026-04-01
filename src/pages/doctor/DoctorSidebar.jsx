

import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  FiGrid, FiCalendar, FiUsers, FiClock, FiBell, 
  FiUserPlus, FiLogOut, FiActivity 
} from "react-icons/fi"; // Icons import kar liye
import "./DoctorSidebar.css";
import Logo from "../../assets/images/logo.png"

const DoctorSidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const [showFooterMenu, setShowFooterMenu] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("currentUser"));

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setIsCollapsed(true);
      } else {
        setIsMobileOpen(false);
        if(window.innerWidth > 1024) setIsCollapsed(false);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsCollapsed, setIsMobileOpen]);

  const handleUserCardClick = () => {
    if (window.innerWidth <= 1024) {
      setShowFooterMenu(!showFooterMenu);
    } else {
      if (isCollapsed) {
        setIsCollapsed(false);
        setShowFooterMenu(false);
      } else {
        setShowFooterMenu(!showFooterMenu);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  // ✅ Updated Menu Array with "Add Patient"
  const menu = [
    { name: "Dashboard", path: "/doctor/dashboard", icon: <FiGrid /> },
    { name: "Appointments", path: "/doctor/appointments", icon: <FiCalendar /> },
    { name: "Patients", path: "/doctor/patients", icon: <FiUsers /> },
    { name: "Add Patient", path: "/doctor/add-patient", icon: <FiUserPlus /> }, // Naya Tab
    { name: "Availability", path: "/doctor/availability", icon: <FiClock /> },
    { name: "Labs", path: "/doctor/Labs", icon: <FiActivity /> },
    { name: "Notifications", path: "/doctor/notifications", icon: <FiBell /> },
    
  ];

  return (
    <>
      {isMobileOpen && (
        <div className="sidebar-mobile-overlay" onClick={() => {
          setIsMobileOpen(false);
          setShowFooterMenu(false);
        }}></div>
      )}

      <aside className={`doctor-sidebar ${isCollapsed ? "collapsed" : "expanded"} ${isMobileOpen ? "mobile-active" : ""}`}>
        <div className="sidebar-header">
          <div className="logo-area" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
      {/* Jab sidebar collapsed ho aur mobile open na ho, tab sirf chota icon dikhega */}
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
            <button className="mobile-close-btn" onClick={() => {
              setIsMobileOpen(false);
              setShowFooterMenu(false);
            }}>✕</button>
          ) : (
            <button className="desktop-toggle-arrow" onClick={() => {
              setIsCollapsed(!isCollapsed);
              setShowFooterMenu(false);
            }}>
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
                  className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {(!isCollapsed || isMobileOpen) && <span className="nav-text">{item.name}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          {showFooterMenu && (!isCollapsed || isMobileOpen) && (
            <div className="sidebar-footer-dropdown">
               <button
                onClick={() => {
                  navigate("/");
                  setShowFooterMenu(false);
                }}
              >
                🏠 Home
              </button>
              <button onClick={() => { navigate("/doctor/profile"); setShowFooterMenu(false); setIsMobileOpen(false); }}>
                👤 My Profile
              </button>
              <button className="logout-item" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          )}

          <div className={`sidebar-user-card ${(isCollapsed && !isMobileOpen) ? "centered" : ""}`} onClick={handleUserCardClick}>
            <img src="https://i.pravatar.cc/150?img=12" alt="Profile" className="user-avatar" />
            {(!isCollapsed || isMobileOpen) && (
              <div className="user-info">
                <p className="user-name">Dr. {user?.fullName || "Sameer"}</p>
                <p className="user-role">{user?.role || "Surgeon"}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default DoctorSidebar;