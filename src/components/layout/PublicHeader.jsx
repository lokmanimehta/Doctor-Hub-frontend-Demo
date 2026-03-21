import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";
import { AuthContext } from "../../context/AuthContext";

const Header = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { currentUser, setCurrentUser } = useContext(AuthContext);

 const handleLogout = () => {

  localStorage.removeItem("currentUser");

  setCurrentUser(null);

  setOpen(false);

  navigate("/");

};

  // 🔥 Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="site-header">
      <div className="logo" onClick={() => navigate("/")}>
        MyProject
      </div>

      {/* 🔥 NOT LOGGED IN */}
      {!currentUser && (
        <div className="auth-buttons">
          <button onClick={() => navigate("/login")}>Login</button>
          <button className="signup" onClick={() => navigate("/signup")}>
            Sign Up
          </button>
        </div>
      )}

      {/* 🔥 LOGGED IN */}
      {currentUser && (
        <div className="profile-wrapper" ref={dropdownRef}>
          <img
            src={currentUser.profileImage || "https://i.pravatar.cc/40"}
            alt="profile"
            className="profile-img"
            onClick={() => setOpen(!open)}
          />

          {open && (
            <div className="profile-dropdown">
              <div className="user-info">
                <strong>{currentUser.fullName}</strong>
                <span>{currentUser.role}</span>
              </div>

              <ul>
                <li onClick={() => navigate(`/${currentUser.role.toLowerCase()}/dashboard`)}>
                  Dashboard
                </li>
                <li onClick={() => navigate(`/${currentUser.role.toLowerCase()}/profile`)}>
                  Update Profile
                </li>
                <li className="logout" onClick={handleLogout}>
                  Logout
                </li>
              </ul>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
