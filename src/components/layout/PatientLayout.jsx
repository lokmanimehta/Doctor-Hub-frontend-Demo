// src/components/layout/PatientLayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import PatientSidebar from "../../pages/patient/PatientSidebar";
import PatientHeader from "../../pages/patient/PatientHeader";
import "./PatientLayout.css";
import "../../assets/css/theme.css";

const PatientLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="patient-layout">
      {/* Sidebar logic */}
      <PatientSidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen} 
      />
      
      {/* Main Container: Isme margin handle hota hai */}
      <div className={`patient-main ${isCollapsed ? "collapsed-margin" : "expanded-margin"}`}>
        
        {/* Header: Isme isCollapsed pass karna zaroori hai gap fix karne ke liye */}
        <PatientHeader 
          setIsMobileOpen={setIsMobileOpen} 
          isCollapsed={isCollapsed} 
        />
        
        {/* Page Content: Outlet yahan render hoga */}
        <main className="patient-content">
          <Outlet />
        </main>
        
        
      </div>
    </div>
  );
};

export default PatientLayout;