import React, { useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  FiChevronLeft,
  FiChevronRight,
  FiX,
} from "react-icons/fi";
import "./AdminSidebar.css";
import Logo from "../../assets/images/logo.png";

const AdminSidebar = ({ isCollapsed, setIsCollapsed }) => {
  const menu = [
    { name: "Dashboard", path: "/admin/dashboard", icon: "📊" },
    { name: "Doctors", path: "/admin/doctors", icon: "👨‍⚕️" },
    { name: "Pending Verification", path: "/admin/verify-doctors", icon: "🛡️" },
    { name: "Users", path: "/admin/users", icon: "👥" },
    { name: "Hospitals", path: "/admin/hospitals", icon: "🏥" },
    { name: "Labs", path: "/admin/labs", icon: "🧪" },
    { name: "Appointments", path: "/admin/appointments", icon: "📅" },
    { name: "System Logs", path: "/admin/system-logs", icon: "📑" },
    { name: "Ads-Management", path: "/admin/ads-management", icon: "📢" },
    { name: "Feedback", path: "/admin/feedback", icon: "💬" },
    
  ];

  // Mobile resize handling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsCollapsed]);

  const isMobile = window.innerWidth < 1024;

  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && isMobile && (
        <div
          className="sidebar-mobile-overlay"
          onClick={() => setIsCollapsed(true)}
        ></div>
      )}

      <aside
        className={`admin-sidebar ${
          isCollapsed ? "collapsed" : "expanded"
        }`}
      >
        {/* ===== HEADER ===== */}
        <div className="sidebar-header">
          <div className="logo-area">
            {isCollapsed && !isMobile ? (
              <img
                src={Logo}
                alt="Logo"
                className="sidebar-logo-mini"
              />
            ) : (
              <>
                <img
                  src={Logo}
                  alt="Logo"
                  className="sidebar-logo-img"
                />
                <h2 className="admin-logo">
                  Doctor<span>Hub</span>
                </h2>
              </>
            )}
          </div>

          {/* Toggle Button */}
          {isMobile ? (
            <button
              className="mobile-close-btn"
              onClick={() => setIsCollapsed(true)}
            >
              <FiX />
            </button>
          ) : (
            <button
              className="collapse-btn"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </button>
          )}
        </div>

        {/* ===== NAV ===== */}
        <nav className="admin-nav">
          <ul className="admin-menu">
            {menu.map((item) => (
              <li key={item.name} className="menu-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    isActive
                      ? "admin-link active"
                      : "admin-link"
                  }
                  onClick={() =>
                    isMobile && setIsCollapsed(true)
                  }
                >
                  <span className="menu-icon">{item.icon}</span>

                  {!isCollapsed && (
                    <span className="menu-text">
                      {item.name}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* ===== FOOTER ===== */}
        {!isCollapsed && (
          <div className="sidebar-footer-info">
            <p>Admin Control Panel</p>
            <span>v1.0.2</span>
          </div>
        )}
      </aside>
    </>
  );
};

export default AdminSidebar;