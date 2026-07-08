import React, { useState, useEffect } from "react";
import AdminSidebar from "../../pages/admin/AdminSidebar";
import AdminHeader from "../../pages/admin/AdminHeader";
import { Outlet } from "react-router-dom";
import "./AdminLayout.css";
import AdminNotificationProvider from "../../context/AdminNotificationProvider";
const AdminLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Responsive logic: 1024px se niche sidebar auto-collapse hoga
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <AdminNotificationProvider>
    <div className={`admin-layout ${isCollapsed ? "sidebar-is-collapsed" : "sidebar-is-expanded"}`}>
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <div className="admin-main">
        <AdminHeader 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
          searchValue={searchValue} 
          setSearchValue={setSearchValue} 
        />
        
        <main className="admin-content">
          <Outlet context={{ searchValue }} />
        </main>

      
      </div>
    </div>
    </AdminNotificationProvider>
  );
};

export default AdminLayout;