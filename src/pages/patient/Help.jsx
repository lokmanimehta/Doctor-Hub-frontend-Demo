import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Help.css";

const helpTopics = [
  {
    id: 1,
    title: "How to book an appointment?",
    content:
      "Go to Doctors section, select a doctor, choose a time slot and confirm your appointment."
  },
  {
    id: 2,
    title: "How can I cancel or reschedule an appointment?",
    content:
      "Open Appointments, select your booking and choose cancel or reschedule."
  },
  {
    id: 3,
    title: "Where can I see my lab reports?",
    content:
      "All your lab reports are available under the Lab Reports section."
  },
  {
    id: 4,
    title: "Is my medical data safe?",
    content:
      "Yes, your data is securely stored and only accessible to you and authorized doctors."
  },
  {
    id: 5,
    title: "How can I give feedback?",
    content:
      "You can submit feedback from the Feedback section available in the menu."
  }
];

const Help = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);

  const filteredTopics = useMemo(() => {
    return helpTopics.filter((topic) =>
      `${topic.title} ${topic.content}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div className="help-container">
      <h1>Help & Support</h1>
      <p className="subtitle">
        Find answers to common questions and get quick care guidance
      </p>

      {/* AI HELP CARD */}
      <div className="ai-help-card">
        <div className="ai-help-text">
          <p className="ai-help-label">AI CARE ASSIST</p>
          <h3>Not sure what care you need?</h3>
          <p>
            Use AI guidance to understand whether you may need a doctor,
            specialist, follow-up care, or urgent hospital support.
          </p>
        </div>

        <div className="ai-help-actions">
          <button
            className="ai-primary-btn"
            onClick={() => navigate("/patient/dashboard")}
          >
            Start AI Symptom Check
          </button>

          <button
            className="ai-secondary-btn"
            onClick={() => navigate("/patient/finddoctors")}
          >
            Find Doctors
          </button>
        </div>
      </div>

      {/* Search */}
      <input
        className="help-search"
        type="text"
        placeholder="Search help topics..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* QUICK ACTIONS */}
      <div className="quick-help-actions">
        <div
          className="quick-help-card"
          onClick={() => navigate("/patient/dashboard")}
        >
          <h4>AI Symptom Check</h4>
          <p>Check symptoms and get guidance before booking care.</p>
        </div>

        <div
          className="quick-help-card"
          onClick={() => navigate("/patient/finddoctors")}
        >
          <h4>Find Doctors</h4>
          <p>Browse doctors by specialty and book a consultation.</p>
        </div>

        <div
          className="quick-help-card emergency"
          onClick={() => navigate("/patient/hospitals")}
        >
          <h4>Emergency Hospitals</h4>
          <p>See hospitals quickly if your case feels urgent.</p>
        </div>
      </div>

      {/* FAQ */}
      <div className="faq-list">
        {filteredTopics.length === 0 ? (
          <p className="no-data">
            No help topics found
          </p>
        ) : (
          filteredTopics.map((item) => (
            <div
              key={item.id}
              className="faq-item"
            >
              <div
                className="faq-title"
                onClick={() =>
                  setOpenId(
                    openId === item.id
                      ? null
                      : item.id
                  )
                }
              >
                {item.title}
                <span>
                  {openId === item.id
                    ? "−"
                    : "+"}
                </span>
              </div>

              {openId === item.id && (
                <div className="faq-content">
                  {item.content}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Contact */}
      <div className="support-box">
        <h3>Need more help?</h3>
        <p>
          Contact our support team at
          <br />
          <strong>support@doctorshub.com</strong>
        </p>

        <button
          className="support-btn"
          onClick={() => navigate("/patient/feedback")}
        >
          Contact Support
        </button>
      </div>

      {/* Emergency */}
      <div className="emergency-alert-box">
        <h4>Emergency Notice</h4>
        <p>
          For chest pain, breathing difficulty, severe bleeding, unconsciousness,
          stroke symptoms, or any serious medical emergency, please contact your
          local emergency services or visit the nearest hospital immediately.
        </p>
        <button
          className="emergency-btn"
          onClick={() => navigate("/patient/hospitals")}
        >
          View Emergency Hospitals
        </button>
      </div>
    </div>
  );
};

export default Help;