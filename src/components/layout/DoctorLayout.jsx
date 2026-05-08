import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import DoctorHeader from "../../pages/doctor/DoctorHeader";
import DoctorSidebar from "../../pages/doctor/DoctorSidebar";
import { DoctorProfileProvider } from "../../context/DoctorProfileProvider";
import "../../assets/css/theme.css";
import "./DoctorLayout.css";

const DoctorLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <DoctorProfileProvider>
      <div
        className={`doctor-layout ${
          isCollapsed ? "sidebar-collapsed" : "sidebar-expanded"
        }`}
      >
        <DoctorSidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        <div className="doctor-main">
          <DoctorHeader setIsMobileOpen={setIsMobileOpen} />

          <div className="doctor-content">
            <div className="doctor-content-inner">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </DoctorProfileProvider>
  );
};

export default DoctorLayout;