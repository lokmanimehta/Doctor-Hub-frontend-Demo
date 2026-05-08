import React from "react";
import "./NotificationToast.css";

const NotificationToast = ({ toast, onClose, onClick }) => {
  if (!toast?.visible) return null;

  return (
    <div className="notification-toast-wrapper">
      <div className="notification-toast-card" onClick={onClick}>
        <div className="notification-toast-body">
          <div className="notification-toast-header">
            <span className="notification-status-dot"></span>
            <span className="notification-label">New Notification</span>
          </div>
          <div className="notification-content">
            <h4 className="notification-title">{toast.title || "Doctor Update"}</h4>
            <p className="notification-message">{toast.message || "You have a new update in your records."}</p>
          </div>
        </div>
        
        <button 
          className="notification-close-btn" 
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close notification"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default NotificationToast;