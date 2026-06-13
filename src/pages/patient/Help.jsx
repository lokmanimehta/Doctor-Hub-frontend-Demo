import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createPatientSupportTicket,
  getPatientSupportTickets
} from "../../services/patientService";
import "./Help.css";

const faqItems = [
  {
    id: 1,
    question: "How do I book an appointment?",
    answer:
      "Go to Find Doctors, choose a doctor, select an available time slot, and confirm your appointment."
  },
  {
    id: 2,
    question: "Where can I see my appointments?",
    answer:
      "Open My Appointments from the patient menu. You can check your upcoming and past appointments there."
  },
  {
    id: 3,
    question: "Where can I see my medical records?",
    answer:
      "Open Medical Records from the patient menu. Your available records will be shown there."
  },
  {
    id: 4,
    question: "Where can I see my lab reports?",
    answer:
      "Open Lab Reports from the patient menu. Reports will appear there once they are available on the platform."
  },
  {
    id: 5,
    question: "How do I update my profile?",
    answer:
      "Open Profile from the patient menu. You can update your personal details, contact details, address, password, and profile photo."
  },
  {
    id: 6,
    question: "Is my health data safe?",
    answer:
      "Your data is protected through secure login. Patient-specific information is only available through authenticated access."
  }
];

const helpCategories = [
  { value: "APPOINTMENT", label: "Appointment or booking issue" },
  { value: "DOCTOR_SEARCH", label: "Finding a doctor" },
  { value: "MEDICAL_RECORDS", label: "Medical records" },
  { value: "PRESCRIPTIONS", label: "Prescriptions" },
  { value: "LAB_REPORTS", label: "Lab reports" },
  { value: "PROFILE_ACCOUNT", label: "Profile or account" },
  { value: "TECHNICAL_ISSUE", label: "App or website issue" },
  { value: "PAYMENT_BILLING", label: "Payment or billing" },
  { value: "OTHER", label: "Something else" }
];

const relatedPageOptions = [
  "Help",
  "Dashboard",
  "Find Doctors",
  "Appointments",
  "Medical Records",
  "Prescriptions",
  "Lab Reports",
  "Profile",
  "Other"
];

const statusLabels = {
  OPEN: "Submitted",
  IN_PROGRESS: "Being checked",
  RESOLVED: "Solved",
  CLOSED: "Closed"
};

const categoryLabels = {
  APPOINTMENT: "Appointment",
  DOCTOR_SEARCH: "Doctor Search",
  MEDICAL_RECORDS: "Medical Records",
  PRESCRIPTIONS: "Prescriptions",
  LAB_REPORTS: "Lab Reports",
  PROFILE_ACCOUNT: "Profile",
  TECHNICAL_ISSUE: "Technical Issue",
  PAYMENT_BILLING: "Payment",
  OTHER: "Other"
};

const initialForm = {
  category: "APPOINTMENT",
  subject: "",
  message: "",
  relatedPage: "Help",
  contactAllowed: true
};

const formatDateTime = (timestamp) => {
  if (!timestamp) {
    return "Not available";
  }

  return new Date(timestamp).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const getStatusLabel = (status) => {
  return statusLabels[status] || "Submitted";
};

const getCategoryLabel = (category) => {
  return categoryLabels[category] || "Help Request";
};

const Help = () => {
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState("");
  const [openFaqId, setOpenFaqId] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [recentRequests, setRecentRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState("");

  const filteredFaqs = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) {
      return faqItems;
    }

    return faqItems.filter((item) =>
      `${item.question} ${item.answer}`.toLowerCase().includes(keyword)
    );
  }, [searchText]);

  useEffect(() => {
    fetchRecentRequests();
  }, []);

  const fetchRecentRequests = async () => {
    try {
      setRequestsLoading(true);
      setRequestsError("");

      const response = await getPatientSupportTickets({
        page: 0,
        size: 4
      });

      setRecentRequests(response?.tickets || []);
    } catch (error) {
      setRequestsError(
        error.message || "We could not load your previous help requests."
      );
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: type === "checkbox" ? checked : value
    }));

    setFormError("");
    setSuccessMessage("");
  };

  const validateForm = () => {
    const subject = form.subject.trim();
    const message = form.message.trim();

    if (!subject) {
      return "Please write a short title for your problem.";
    }

    if (subject.length > 160) {
      return "Title should be less than 160 characters.";
    }

    if (!message) {
      return "Please explain your problem so we can help you.";
    }

    if (message.length < 10) {
      return "Please explain your problem in a little more detail.";
    }

    if (message.length > 4000) {
      return "Message is too long. Please keep it under 4000 characters.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");
      setSuccessMessage("");

      const payload = {
        category: form.category,
        priority: "NORMAL",
        subject: form.subject.trim(),
        message: form.message.trim(),
        relatedPage: form.relatedPage,
        contactAllowed: form.contactAllowed
      };

      const createdRequest = await createPatientSupportTicket(payload);

      setRecentRequests((previousRequests) =>
        [createdRequest, ...previousRequests].slice(0, 4)
      );

      setForm(initialForm);

      setSuccessMessage(
        `Your help request has been sent successfully. Request ID: ${createdRequest.ticketNumber}`
      );
    } catch (error) {
      setFormError(
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="patient-help-page">
      <section className="patient-help-hero">
        <div className="patient-help-hero-content">
          <span className="patient-help-kicker">Help Center</span>
          <h1>How can we help you?</h1>
          <p>
            Find quick answers, manage common health platform issues, or send a
            help request to our support team.
          </p>
        </div>

        <div className="patient-help-hero-actions">
          <button
            type="button"
            className="patient-help-btn patient-help-btn-primary"
            onClick={() => navigate("/patient/finddoctors")}
          >
            Find Doctors
          </button>

          <button
            type="button"
            className="patient-help-btn patient-help-btn-secondary"
            onClick={() => navigate("/patient/appointments")}
          >
            My Appointments
          </button>
        </div>
      </section>

      <section className="patient-help-shortcuts">
        <button
          type="button"
          className="patient-help-shortcut-card"
          onClick={() => navigate("/patient/finddoctors")}
        >
          <span>👨‍⚕️</span>
          <strong>Book appointment</strong>
          <small>Find doctors and choose a time slot</small>
        </button>

        <button
          type="button"
          className="patient-help-shortcut-card"
          onClick={() => navigate("/patient/appointments")}
        >
          <span>📅</span>
          <strong>Appointment help</strong>
          <small>Check bookings, status, or visit details</small>
        </button>

        <button
          type="button"
          className="patient-help-shortcut-card"
          onClick={() => navigate("/patient/records")}
        >
          <span>📄</span>
          <strong>Health records</strong>
          <small>View records, reports, and documents</small>
        </button>
      </section>

      <section className="patient-help-content-grid">
        <div className="patient-help-card patient-help-request-card">
          <div className="patient-help-section-head">
            <div>
              <span className="patient-help-kicker">Need More Help?</span>
              <h2>Ask for help</h2>
            </div>
            <span className="patient-help-secure-badge">Secure</span>
          </div>

          <p className="patient-help-card-note">
            Tell us what problem you are facing. Our support team will check it
            and update you.
          </p>

          {formError && (
            <div className="patient-help-alert patient-help-alert-error">
              {formError}
            </div>
          )}

          {successMessage && (
            <div className="patient-help-alert patient-help-alert-success">
              {successMessage}
            </div>
          )}

          <form className="patient-help-form" onSubmit={handleSubmit}>
            <label>
              What do you need help with?
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                {helpCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Short title
              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Example: I cannot view my lab report"
                maxLength={160}
              />
            </label>

            <label>
              Where are you facing this issue?
              <select
                name="relatedPage"
                value={form.relatedPage}
                onChange={handleChange}
              >
                {relatedPageOptions.map((page) => (
                  <option key={page} value={page}>
                    {page}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Explain the problem
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Write the problem in simple words. Example: I booked an appointment, but it is not showing in my appointments page."
                rows="5"
                maxLength={4000}
              />
            </label>

            <label className="patient-help-checkbox">
              <input
                type="checkbox"
                name="contactAllowed"
                checked={form.contactAllowed}
                onChange={handleChange}
              />
              <span>Support team can contact me about this request.</span>
            </label>

            <button
              type="submit"
              className="patient-help-btn patient-help-btn-primary patient-help-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Help Request"}
            </button>
          </form>
        </div>

        <div className="patient-help-card patient-help-recent-card">
          <div className="patient-help-section-head">
            <div>
              <span className="patient-help-kicker">Your Requests</span>
              <h2>Recent help requests</h2>
            </div>

            <button
              type="button"
              className="patient-help-refresh-btn"
              onClick={fetchRecentRequests}
              disabled={requestsLoading}
            >
              Refresh
            </button>
          </div>

          {requestsLoading ? (
            <div className="patient-help-empty-state">
              Loading your help requests...
            </div>
          ) : requestsError ? (
            <div className="patient-help-alert patient-help-alert-error">
              {requestsError}
            </div>
          ) : recentRequests.length === 0 ? (
            <div className="patient-help-empty-state">
              <strong>No help requests yet</strong>
              <p>
                When you send a help request, its status will appear here.
              </p>
            </div>
          ) : (
            <div className="patient-help-request-list">
              {recentRequests.map((request) => (
                <article
                  key={request.id}
                  className="patient-help-request-item"
                >
                  <div className="patient-help-request-top">
                    <div>
                      <h3>{request.subject}</h3>
                      <p>Request ID: {request.ticketNumber}</p>
                    </div>

                    <span
                      className={`patient-help-status patient-help-status-${request.status?.toLowerCase()}`}
                    >
                      {getStatusLabel(request.status)}
                    </span>
                  </div>

                  <div className="patient-help-request-meta">
                    <span>{getCategoryLabel(request.category)}</span>
                    <span>{formatDateTime(request.createdAt)}</span>
                  </div>

                  <p className="patient-help-request-message">
                    {request.message}
                  </p>

                  {request.adminNote && (
                    <div className="patient-help-support-update">
                      <strong>Support update:</strong> {request.adminNote}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="patient-help-card patient-help-faq-card">
        <div className="patient-help-section-head">
          <div>
            <span className="patient-help-kicker">Quick Answers</span>
            <h2>Common questions</h2>
          </div>
        </div>

        <input
          className="patient-help-search"
          type="text"
          placeholder="Search questions..."
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />

        <div className="patient-help-faq-list">
          {filteredFaqs.length === 0 ? (
            <div className="patient-help-empty-state">
              No answers found for your search.
            </div>
          ) : (
            filteredFaqs.map((item) => (
              <div key={item.id} className="patient-help-faq-item">
                <button
                  type="button"
                  className="patient-help-faq-question"
                  onClick={() =>
                    setOpenFaqId(openFaqId === item.id ? null : item.id)
                  }
                  aria-expanded={openFaqId === item.id}
                >
                  <span>{item.question}</span>
                  <strong>{openFaqId === item.id ? "−" : "+"}</strong>
                </button>

                {openFaqId === item.id && (
                  <p className="patient-help-faq-answer">{item.answer}</p>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="patient-help-emergency">
        <div>
          <h2>Medical emergency?</h2>
          <p>
            For chest pain, breathing difficulty, severe bleeding,
            unconsciousness, stroke symptoms, or any serious emergency, please
            call local emergency services or visit the nearest hospital
            immediately.
          </p>
        </div>
      </section>
    </main>
  );
};

export default Help;