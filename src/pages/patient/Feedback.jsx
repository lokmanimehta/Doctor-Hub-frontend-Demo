import React, { useEffect, useState } from "react";
import {
  createPatientFeedback,
  getPatientFeedbacks
} from "../../services/patientService";
import "./Feedback.css";

const FEEDBACK_TYPES = [
  { value: "APPOINTMENT", label: "Appointment" },
  { value: "CONSULTATION", label: "Consultation" },
  { value: "LAB_REPORTS", label: "Lab Reports" },
  { value: "APP_EXPERIENCE", label: "App Experience" },
  { value: "DOCTOR_EXPERIENCE", label: "Doctor Experience" },
  { value: "HOSPITAL_SERVICE", label: "Hospital Service" },
  { value: "PAYMENT_BILLING", label: "Payment & Billing" },
  { value: "TECHNICAL_ISSUE", label: "Technical Issue" },
  { value: "OTHER", label: "Other" }
];

const getTypeLabel = (type) => {
  return FEEDBACK_TYPES.find((item) => item.value === type)?.label || type || "-";
};

const getStatusLabel = (status) => {
  if (!status) return "-";

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDateTime = (timestamp) => {
  if (!timestamp) return "-";

  return new Date(timestamp).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const Feedback = () => {
  const [formData, setFormData] = useState({
    type: "",
    rating: 0,
    message: "",
    allowContact: false
  });

  const [recentFeedbacks, setRecentFeedbacks] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadRecentFeedbacks = async () => {
    try {
      setLoadingList(true);
      const data = await getPatientFeedbacks({ page: 0, size: 5 });
      setRecentFeedbacks(data?.feedbacks || []);
    } catch (error) {
      setErrorMessage(error.message || "Failed to load feedback history.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadRecentFeedbacks();
  }, []);

  const clearMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));

    clearMessages();
  };

  const handleRating = (ratingValue) => {
    setFormData((prev) => ({
      ...prev,
      rating: prev.rating === ratingValue ? 0 : ratingValue
    }));

    clearMessages();
  };

  const validateForm = () => {
    const cleanMessage = formData.message.trim();

    if (!formData.type) {
      return "Please select feedback type.";
    }

    if (!cleanMessage) {
      return "Please enter your feedback.";
    }

    if (cleanMessage.length < 10) {
      return "Feedback message must be at least 10 characters.";
    }

    if (cleanMessage.length > 4000) {
      return "Feedback message cannot exceed 4000 characters.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      setSuccessMessage("");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      const payload = {
        type: formData.type,
        rating: formData.rating > 0 ? formData.rating : null,
        message: formData.message.trim(),
        relatedPage: "/patient/feedback",
        allowContact: formData.allowContact
      };

      await createPatientFeedback(payload);

      setSuccessMessage("Thank you. Your feedback has been submitted successfully.");

      setFormData({
        type: "",
        rating: 0,
        message: "",
        allowContact: false
      });

      await loadRecentFeedbacks();
    } catch (error) {
      setErrorMessage(error.message || "Unable to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="feedback-page">
      <div className="feedback-container">
        <section className="feedback-hero">
          <div>
            <span className="feedback-kicker">Patient Feedback</span>
            <h1>Share your experience</h1>
            <p>
              Help Sucura improve appointments, consultations, reports,
              hospital services and overall care experience.
            </p>
          </div>
        </section>

        <div className="feedback-layout">
          <section className="feedback-panel feedback-form-panel">
            <div className="feedback-section-heading">
              <h2>Submit Feedback</h2>
              <p>Write what went well or what needs improvement.</p>
            </div>

            {successMessage && (
              <div className="feedback-alert feedback-alert-success">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="feedback-alert feedback-alert-error">
                {errorMessage}
              </div>
            )}

            <form className="feedback-form" onSubmit={handleSubmit}>
              <div className="feedback-field">
                <label htmlFor="feedbackType">Feedback Type</label>
                <select
                  id="feedbackType"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="feedback-control"
                  required
                >
                  <option value="">Select feedback type</option>
                  {FEEDBACK_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="feedback-field">
                <div className="feedback-label-row">
                  <label>Rating</label>
                  <span>Optional</span>
                </div>

                <div className="feedback-rating-row">
                  <div className="feedback-stars" aria-label="Feedback rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={
                          star <= formData.rating
                            ? "feedback-star feedback-star-active"
                            : "feedback-star"
                        }
                        onClick={() => handleRating(star)}
                        aria-label={`Give ${star} star rating`}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  {formData.rating > 0 && (
                    <button
                      type="button"
                      className="feedback-clear-rating"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, rating: 0 }));
                        clearMessages();
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="feedback-field">
                <label htmlFor="feedbackMessage">Your Feedback</label>
                <textarea
                  id="feedbackMessage"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="feedback-control feedback-textarea"
                  placeholder="Tell us your experience in detail..."
                  required
                  maxLength={4000}
                />
                <div className="feedback-helper-row">
                  <span>Minimum 10 characters</span>
                  <span>{formData.message.trim().length}/4000</span>
                </div>
              </div>

              <label className="feedback-checkbox">
                <input
                  type="checkbox"
                  name="allowContact"
                  checked={formData.allowContact}
                  onChange={handleChange}
                />
                <span>You may contact me regarding this feedback</span>
              </label>

              <button
                type="submit"
                className="feedback-submit-btn"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          </section>

          <aside className="feedback-panel feedback-history-panel">
            <div className="feedback-section-heading">
              <h2>Recent Feedback</h2>
              <p>Your latest submitted feedback appears here.</p>
            </div>

            {loadingList ? (
              <div className="feedback-empty-state">Loading feedback...</div>
            ) : recentFeedbacks.length === 0 ? (
              <div className="feedback-empty-state">
                <strong>No feedback submitted yet.</strong>
                <span>Your submitted feedback will appear here.</span>
              </div>
            ) : (
              <div className="feedback-history-list">
                {recentFeedbacks.map((item) => (
                  <article key={item.id} className="feedback-history-card">
                    <div className="feedback-history-top">
                      <div>
                        <h3>{getTypeLabel(item.type)}</h3>
                        <span>{formatDateTime(item.createdAt)}</span>
                      </div>

                      <span
                        className={`feedback-status feedback-status-${item.status?.toLowerCase()}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </div>

                    <p className="feedback-history-message">{item.message}</p>

                    <div className="feedback-history-footer">
                      <span>{item.feedbackNumber}</span>
                      <strong>
                        {item.rating ? `${item.rating}/5 rating` : "No rating"}
                      </strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Feedback;