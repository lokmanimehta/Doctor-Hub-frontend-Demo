// import React, { useState } from "react";
// import "./DoctorHeader.css";
// import { useNavigate, useLocation } from "react-router-dom";

// const DoctorHeader = () => {
//   const [open, setOpen] = useState(false);
//   const navigate = useNavigate();
//   const location = useLocation(); // <-- current URL path
//   const user = JSON.parse(localStorage.getItem("currentUser"));

//   const handleLogout = () => {
//     localStorage.removeItem("currentUser");
//     navigate("/login");
//   };

//   // Map routes to header titles
//   const routeTitles = {
//     "/doctor/dashboard": "Dashboard",
//     "/doctor/appointments": "Appointments",
//     "/doctor/patients": "Patients",
//     "/doctor/reports": "Reports",
//     "/doctor/profile": "Profile",
//     "/doctor/availability": "Availability",
//       "/doctor/notifications": "Notifications",


//   };

//   // Determine current header title based on route
//   const headerTitle = routeTitles[location.pathname] || "Dashboard";

//   return (
//     <header className="doctor-header">
//       {/* Left side: dynamic title */}
//       <div className="doctor-header-left">
//         <h2 className="doctor-dashboard-title">{headerTitle}</h2>
//       </div>

//       {/* Right side: avatar + doctor name */}
//       <div className="doctor-profile" onClick={() => setOpen(!open)}>
//         <img
//           src="https://i.pravatar.cc/40"
//           alt="Doctor"
//           className="doctor-avatar"
//         />
//         <div className="doctor-name-wrapper">
//           <span className="doctor-name-text">Dr. {user?.fullName || "Doctor"}</span>
//           <span className="doctor-role-text">{user?.role || "Doctor"}</span>
//         </div>

//         {open && (
//           <div className="doctor-dropdown">
//             <button
//               onClick={() => {
//                 setOpen(false);
//                 navigate("/doctor/profile");
//               }}
//             >
//               My Profile
//             </button>
//             <button className="logout-btn" onClick={handleLogout}>
//               Logout
//             </button>
//           </div>
//         )}
//       </div>
//     </header>
//   );
// };

// export default DoctorHeader;




import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./DoctorHeader.css";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useAuthActions } from "../../services/authService";
const DoctorHeader = ({ setIsMobileOpen }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null); // Ab ye pure header ya right section ko track karega
  const { setCurrentUser } = useContext(AuthContext);
const { logoutUser } = useAuthActions(setCurrentUser);
  const user = JSON.parse(localStorage.getItem("currentUser"));

  // Click outside to close dropdown fix
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Agar click dropdown ke andar nahi hai, tabhi band karo
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
  
  setDropdownOpen(false);
  logoutUser(); // ✅ hook ke andar sab handle ho jayega
};
  const routeTitles = {
    "/doctor/dashboard": "Dashboard",
    "/doctor/appointments": "My Appointments",
    "/doctor/patients": "Patient Records",
    "/doctor/profile": "My Profile",
     "/doctor/add-patient": "Add Patient",
    "/doctor/availability": "Availability",
    "/doctor/Labs": "Labs ",
    "/doctor/notifications": "Notifications",
    
  };

  return (
    <header className="doctor-header">
      <div className="header-left">
        <button className="mobile-toggle" onClick={() => setIsMobileOpen(true)}>
          ☰
        </button>
        <h3 className="page-title">
          {routeTitles[location.pathname] || "Doctor Hub"}
        </h3>
      </div>

      {/* dropdownRef ko yahan rakha taaki iske andar ka click "Outside" na mane */}
      <div className="header-right" ref={dropdownRef}>
        <div 
          className="header-profile-section" 
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <div className="profile-info">
            <span className="profile-name">Dr. {user?.fullName || "Sameer"}</span>
          </div>
          <img 
            src="https://i.pravatar.cc/150?img=12" 
            alt="Avatar" 
            className="header-avatar" 
          />
        </div>

        {/* Dropdown ko wapas andar laya navigation fix karne ke liye, CSS se width handle ki hai */}
        {dropdownOpen && (
          <div className="header-dropdown-menu">
            <div className="dropdown-user-info">
              <span className="name">{user?.fullName || "Dr. Sameer"}</span>
              <span className="role">{user?.role || "SURGEON"}</span>
            </div>
            
            <button 
              type="button" 
              onClick={(e) => {
                e.stopPropagation(); // Click event ko bubble hone se roko
                navigate("/doctor/profile");
                setDropdownOpen(false);
              }}
            >
              <span>👤</span> My Profile
            </button>

            <button 
              type="button" 
              className="logout-btn-text" 
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
            >
              <span>🚪</span> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default DoctorHeader;