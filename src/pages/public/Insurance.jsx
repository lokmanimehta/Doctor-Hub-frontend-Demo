import React from "react";
import { ArrowLeft, Bell, ShieldCheck, Clock, HeartPulse } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Insurance.css";

const Insurance = () => {
  const navigate = useNavigate();

  return (
    <main className="insurance-coming-page">
      <section className="insurance-coming-card">
        <button
          type="button"
          className="insurance-back-btn"
          onClick={() => navigate("/all-services")}
        >
          <ArrowLeft size={17} />
          Back to Services
        </button>

        <div className="insurance-icon-wrap">
          <ShieldCheck size={42} />
        </div>

        <span className="insurance-badge">Coming Soon</span>

        <h1>Health Insurance Support is currently unavailable.</h1>

        <p>
          We are working on a safer and more reliable insurance assistance
          experience. This feature will be available soon with verified plan
          information and advisor support.
        </p>

        <div className="insurance-info-grid">
          <div className="insurance-info-box">
            <Clock size={22} />
            <h3>In Progress</h3>
            <span>Feature under setup</span>
          </div>

          <div className="insurance-info-box">
            <HeartPulse size={22} />
            <h3>Health Focused</h3>
            <span>Designed for patients</span>
          </div>

          <div className="insurance-info-box">
            <Bell size={22} />
            <h3>Available Soon</h3>
            <span>Launch planned later</span>
          </div>
        </div>

        <div className="insurance-actions">
          <button
            type="button"
            className="insurance-primary-btn"
            onClick={() => navigate("/all-services")}
          >
            Explore Other Services
          </button>

          <button
            type="button"
            className="insurance-secondary-btn"
            onClick={() => navigate("/contact")}
          >
            Contact Support
          </button>
        </div>
      </section>
    </main>
  );
};

export default Insurance;