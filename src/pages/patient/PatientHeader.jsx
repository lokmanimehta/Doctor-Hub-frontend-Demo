import React, { useState, useEffect, useRef } from "react";import "./PatientHeader.css";
import { Link, useLocation  } from "react-router-dom";
import { FiMenu, FiUser, FiLogOut } from "react-icons/fi"; 
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useAuthActions } from "../../services/authService";
const PatientHeader = ({ setIsMobileOpen, isCollapsed }) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef(null);
const { currentUser, setCurrentUser } = useContext(AuthContext);

const { logoutUser } = useAuthActions(setCurrentUser);
   // Click outside ke liye ref
 


  
  const handleLogout = () => {
  setOpen(false);
  logoutUser(); 
  // ✅ context update + redirect handled inside hook
};

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const routeTitles = {
    "/patient/dashboard": "Dashboard Overview",
    "/patient/appointments": "My Appointment's",
    "/patient/finddoctors": "Find Doctor's",
    "/patient/mydoctors": "My Doctor's",
    "/patient/records": "Medical Record's",
    "/patient/profile": "My Profile Setting's",
     "/patient/prescriptions": "Prescription's",
    "/patient/labs": "All Labs's",
    "/patient/lab-reports": "Lab Report's",
  "/patient/hospitals":"All Hospitals",
    "/patient/health-summary": "Health Summary",
    "/patient/reminders": "Reminder's",
    "/patient/notifications": "Notification's",
    "/patient/feedback": "Feedback",
    "/patient/help": "Help",
    "/patient/doctorsprofile":"Doctor's Profile",
    
  };
  

  return (
    <header className={`patient-header ${isCollapsed ? "collapsed-header" : ""}`}>
      <div className="header-left">
        <button className="hamburger-btn" onClick={() => setIsMobileOpen(true)}>
          <FiMenu />
        </button>
        
        <h2 className="header-title">
          {routeTitles[location.pathname] || "DOCTOR'S PROFILE"}
        </h2>
      </div>

      <div className="profile-area" ref={dropdownRef}>
        <img
          src="https://i.pravatar.cc/40"
          alt="profile"
          onClick={() => setOpen(!open)}
          className={`profile-img ${open ? "active-profile" : ""}`}
        />
        
        {open && (
          <div className="profile-dropdown">
            <div className="dropdown-user-card">
              <p className="user-name-dropdown">{currentUser?.fullName || "Patient"}</p>
              <span className="user-role-dropdown">{currentUser?.role || "User"}</span>
            </div>
            
            <div className="premium-divider"></div>
            
            <Link to="/patient/profile" onClick={() => setOpen(false)} className="dropdown-link-premium">
              <div className="btn-icon-3d profile-blue">
                <FiUser />
              </div>
              <span>My Profile</span>
            </Link>          
            
            <button onClick={handleLogout} className="logout-btn-premium">
              <div className="btn-icon-3d logout-red">
                <FiLogOut />
              </div>
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default PatientHeader;