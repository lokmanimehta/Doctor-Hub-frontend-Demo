import React from "react";
import "./AdminNotifications.css";

const AdminNotifications = () => {
  return (
    <section className="admin-notifications-page">
      <div className="admin-notifications-shell">
        <div className="admin-notifications-header">
          <div>
            <p className="admin-notifications-eyebrow">Admin Center</p>
            <h1>Notifications</h1>
            <p>
              View important platform alerts, doctor verification updates,
              user activity, appointments, hospitals, labs, and system notices.
            </p>
          </div>
        </div>

        <div className="admin-notifications-card">
          <div className="admin-notifications-empty-icon">🔔</div>
          <h2>No notifications yet</h2>
          <p>
            Admin notifications backend will be connected here. For now this page
            is route-ready and sidebar-ready.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AdminNotifications;