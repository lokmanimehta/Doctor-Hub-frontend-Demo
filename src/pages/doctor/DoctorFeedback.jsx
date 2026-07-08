import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import { createPortal } from "react-dom";
import {
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiMessageSquare,
  FiRefreshCw,
  FiStar,
  FiX
} from "react-icons/fi";

import {
  createDoctorFeedback,
  getDoctorFeedbackById,
  getDoctorFeedbacks
} from "../../services/doctorService";

import "./DoctorFeedback.css";

const FEEDBACK_TYPES = [
  {
    value: "APPOINTMENT",
    label: "Appointments"
  },
  {
    value: "PATIENT_MANAGEMENT",
    label: "Patient Management"
  },
  {
    value: "SCHEDULE_AVAILABILITY",
    label: "Schedule & Availability"
  },
  {
    value: "PROFILE_VERIFICATION",
    label: "Profile Verification"
  },
  {
    value: "PRESCRIPTION_RECORDS",
    label: "Prescriptions & Records"
  },
  {
    value: "LAB_REPORTS",
    label: "Lab Reports"
  },
  {
    value: "APP_EXPERIENCE",
    label: "Platform Experience"
  },
  {
    value: "PAYMENT_BILLING",
    label: "Payment & Billing"
  },
  {
    value: "TECHNICAL_ISSUE",
    label: "Technical Issue"
  },
  {
    value: "OTHER",
    label: "Other"
  }
];

const STATUS_LABELS = {
  NEW: "New",
  REVIEWED: "Reviewed",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed"
};

const EMPTY_FORM = {
  type: "",
  rating: 0,
  message: "",
  allowContact: false
};

const getTypeLabel = (value) => {
  return (
    FEEDBACK_TYPES.find(
      (option) => option.value === value
    )?.label ||
    value ||
    "Not available"
  );
};

const getErrorMessage = (
  error,
  fallbackMessage
) => {
  const responseData = error?.response?.data;

  if (responseData?.message) {
    return responseData.message;
  }

  if (
    responseData &&
    typeof responseData === "object"
  ) {
    const validationMessage =
      Object.values(responseData).find(
        (value) =>
          typeof value === "string" &&
          value.trim()
      );

    if (validationMessage) {
      return validationMessage;
    }
  }

  return error?.message || fallbackMessage;
};

const formatDateTime = (timestamp) => {
  if (!timestamp) {
    return "Not recorded";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const DoctorFeedback = () => {
  const [formData, setFormData] =
    useState(EMPTY_FORM);

  const [feedbacks, setFeedbacks] =
    useState([]);

  const [pagination, setPagination] =
    useState({
      page: 0,
      size: 5,
      totalElements: 0,
      totalPages: 0
    });

  const [selectedFeedback, setSelectedFeedback] =
    useState(null);

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [detailError, setDetailError] =
    useState("");

  const loadFeedbacks = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMessage("");

        const data = await getDoctorFeedbacks({
          page: pagination.page,
          size: pagination.size
        });

        setFeedbacks(
          Array.isArray(data?.feedbacks)
            ? data.feedbacks
            : []
        );

        setPagination((previous) => ({
          ...previous,
          page: Number(
            data?.page ?? previous.page
          ),
          size: Number(
            data?.size ?? previous.size
          ),
          totalElements: Number(
            data?.totalElements ?? 0
          ),
          totalPages: Number(
            data?.totalPages ?? 0
          )
        }));
      } catch (error) {
        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to load feedback history."
          )
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pagination.page, pagination.size]
  );

  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  useEffect(() => {
    if (!isModalOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isModalOpen]);

  const handleFormChange = (event) => {
    const {
      name,
      value,
      type,
      checked
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleRating = (rating) => {
    setFormData((previous) => ({
      ...previous,
      rating:
        previous.rating === rating
          ? 0
          : rating
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };

  const validationMessage = useMemo(() => {
    const message = formData.message.trim();

    if (!formData.type) {
      return "Please select a feedback category.";
    }

    if (!message) {
      return "Please enter your feedback.";
    }

    if (message.length < 10) {
      return "Feedback must contain at least 10 characters.";
    }

    if (message.length > 4000) {
      return "Feedback cannot exceed 4000 characters.";
    }

    return "";
  }, [formData]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (validationMessage) {
      setErrorMessage(validationMessage);
      setSuccessMessage("");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      await createDoctorFeedback({
        type: formData.type,
        rating:
          formData.rating > 0
            ? formData.rating
            : null,
        message: formData.message.trim(),
        relatedPage: "/doctor/feedback",
        allowContact: formData.allowContact
      });

      setFormData(EMPTY_FORM);

      setSuccessMessage(
        "Your feedback has been submitted to the administration team."
      );

      setPagination((previous) => ({
        ...previous,
        page: 0
      }));

      await loadFeedbacks({
        silent: true
      });
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to submit feedback."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openFeedbackDetail = async (
    feedbackId
  ) => {
    try {
      setSelectedFeedback(null);
      setDetailError("");
      setDetailLoading(true);
      setIsModalOpen(true);

      const data =
        await getDoctorFeedbackById(
          feedbackId
        );

      setSelectedFeedback(data);
    } catch (error) {
      setDetailError(
        getErrorMessage(
          error,
          "Unable to load feedback details."
        )
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFeedback(null);
    setDetailError("");
  };

  const changePage = (nextPage) => {
    if (
      nextPage < 0 ||
      nextPage >= pagination.totalPages ||
      nextPage === pagination.page
    ) {
      return;
    }

    setPagination((previous) => ({
      ...previous,
      page: nextPage
    }));
  };

  const modal =
    isModalOpen &&
    typeof document !== "undefined"
      ? createPortal(
          <div
            className="doctor-feedback-modal-root"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeModal();
              }
            }}
          >
            <section
              className="doctor-feedback-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="doctor-feedback-modal-title"
            >
              <header className="doctor-feedback-modal-header">
                <div>
                  <span>
                    Feedback details
                  </span>

                  <h2 id="doctor-feedback-modal-title">
                    {selectedFeedback
                      ?.feedbackNumber ||
                      "Loading feedback"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close feedback details"
                >
                  <FiX />
                </button>
              </header>

              <div className="doctor-feedback-modal-body">
                {detailLoading ? (
                  <div className="doctor-feedback-state">
                    <span className="doctor-feedback-spinner" />
                    <strong>
                      Loading feedback
                    </strong>
                  </div>
                ) : detailError ? (
                  <div className="doctor-feedback-state doctor-feedback-state-error">
                    <strong>
                      Unable to open feedback
                    </strong>
                    <p>{detailError}</p>
                  </div>
                ) : selectedFeedback ? (
                  <>
                    <div className="doctor-feedback-detail-top">
                      <div>
                        <span>Current status</span>

                        <strong
                          className={`doctor-feedback-status doctor-feedback-status-${selectedFeedback.status?.toLowerCase()}`}
                        >
                          {STATUS_LABELS[
                            selectedFeedback.status
                          ] ||
                            selectedFeedback.status}
                        </strong>
                      </div>

                      <div>
                        <span>Submitted</span>
                        <strong>
                          {formatDateTime(
                            selectedFeedback.createdAt
                          )}
                        </strong>
                      </div>
                    </div>

                    <div className="doctor-feedback-detail-grid">
                      <div>
                        <span>Category</span>
                        <strong>
                          {getTypeLabel(
                            selectedFeedback.type
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Rating</span>
                        <strong>
                          {selectedFeedback.rating
                            ? `${selectedFeedback.rating}/5`
                            : "Not rated"}
                        </strong>
                      </div>

                      <div>
                        <span>Contact allowed</span>
                        <strong>
                          {selectedFeedback.allowContact
                            ? "Yes"
                            : "No"}
                        </strong>
                      </div>

                      <div>
                        <span>Last updated</span>
                        <strong>
                          {formatDateTime(
                            selectedFeedback.updatedAt
                          )}
                        </strong>
                      </div>
                    </div>

                    <section className="doctor-feedback-message-section">
                      <span>Your message</span>
                      <p>
                        {selectedFeedback.message}
                      </p>
                    </section>

                    <section className="doctor-feedback-timeline">
                      <h3>Progress timeline</h3>

                      <div className="doctor-feedback-timeline-grid">
                        <div className="complete">
                          <FiCheckCircle />
                          <strong>Submitted</strong>
                          <span>
                            {formatDateTime(
                              selectedFeedback.createdAt
                            )}
                          </span>
                        </div>

                        <div
                          className={
                            selectedFeedback.reviewedAt
                              ? "complete"
                              : ""
                          }
                        >
                          <FiClock />
                          <strong>Reviewed</strong>
                          <span>
                            {formatDateTime(
                              selectedFeedback.reviewedAt
                            )}
                          </span>
                        </div>

                        <div
                          className={
                            selectedFeedback.resolvedAt
                              ? "complete"
                              : ""
                          }
                        >
                          <FiCheckCircle />
                          <strong>Resolved</strong>
                          <span>
                            {formatDateTime(
                              selectedFeedback.resolvedAt
                            )}
                          </span>
                        </div>

                        <div
                          className={
                            selectedFeedback.closedAt
                              ? "complete"
                              : ""
                          }
                        >
                          <FiCheckCircle />
                          <strong>Closed</strong>
                          <span>
                            {formatDateTime(
                              selectedFeedback.closedAt
                            )}
                          </span>
                        </div>
                      </div>
                    </section>
                  </>
                ) : null}
              </div>
            </section>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <main className="doctor-feedback-page">
        <section className="doctor-feedback-hero">
          <div>
            <span className="doctor-feedback-eyebrow">
              Doctor support
            </span>

            <h1>Feedback & platform support</h1>

            <p>
              Share workflow concerns, technical
              issues and suggestions directly with
              the Doctor&apos;s Hub administration
              team.
            </p>
          </div>

          <button
            type="button"
            className="doctor-feedback-refresh"
            onClick={() =>
              loadFeedbacks({
                silent: true
              })
            }
            disabled={loading || refreshing}
            aria-label="Refresh feedback history"
          >
            <FiRefreshCw
              className={
                refreshing ? "rotating" : ""
              }
            />

            <span>
              {refreshing
                ? "Refreshing"
                : "Refresh"}
            </span>
          </button>
        </section>

        {successMessage && (
          <div className="doctor-feedback-alert doctor-feedback-alert-success">
            <FiCheckCircle />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="doctor-feedback-alert doctor-feedback-alert-error">
            <FiMessageSquare />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="doctor-feedback-layout">
          <section className="doctor-feedback-card doctor-feedback-form-card">
            <div className="doctor-feedback-section-heading">
              <span>New feedback</span>
              <h2>Tell us what needs attention</h2>
              <p>
                Provide clear details so the admin
                team can review and resolve the
                issue efficiently.
              </p>
            </div>

            <form
              className="doctor-feedback-form"
              onSubmit={handleSubmit}
            >
              <label className="doctor-feedback-field">
                <span>Feedback category</span>

                <select
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  disabled={submitting}
                  required
                >
                  <option value="">
                    Select category
                  </option>

                  {FEEDBACK_TYPES.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    )
                  )}
                </select>
              </label>

              <div className="doctor-feedback-field">
                <div className="doctor-feedback-label-row">
                  <span>Experience rating</span>
                  <small>Optional</small>
                </div>

                <div className="doctor-feedback-rating">
                  {[1, 2, 3, 4, 5].map(
                    (star) => (
                      <button
                        key={star}
                        type="button"
                        className={
                          star <= formData.rating
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          handleRating(star)
                        }
                        disabled={submitting}
                        aria-label={`Rate ${star} out of 5`}
                      >
                        <FiStar />
                      </button>
                    )
                  )}

                  {formData.rating > 0 && (
                    <span>
                      {formData.rating}/5
                    </span>
                  )}
                </div>
              </div>

              <label className="doctor-feedback-field">
                <div className="doctor-feedback-label-row">
                  <span>Feedback details</span>
                  <small>
                    {formData.message.length}/4000
                  </small>
                </div>

                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleFormChange}
                  maxLength={4000}
                  placeholder="Describe the issue, affected workflow and expected improvement."
                  disabled={submitting}
                  required
                />
              </label>

              <label className="doctor-feedback-consent">
                <input
                  type="checkbox"
                  name="allowContact"
                  checked={formData.allowContact}
                  onChange={handleFormChange}
                  disabled={submitting}
                />

                <span>
                  The administration team may
                  contact me for additional
                  information.
                </span>
              </label>

              <button
                type="submit"
                className="doctor-feedback-submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="doctor-feedback-button-spinner" />
                    Submitting feedback
                  </>
                ) : (
                  <>
                    <FiMessageSquare />
                    Submit feedback
                  </>
                )}
              </button>
            </form>
          </section>

          <section className="doctor-feedback-card doctor-feedback-history-card">
            <div className="doctor-feedback-history-header">
              <div>
                <span>Your submissions</span>
                <h2>Feedback history</h2>
                <p>
                  {pagination.totalElements} total
                  submission
                  {pagination.totalElements === 1
                    ? ""
                    : "s"}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="doctor-feedback-state">
                <span className="doctor-feedback-spinner" />
                <strong>
                  Loading feedback history
                </strong>
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="doctor-feedback-empty">
                <FiMessageSquare />
                <strong>
                  No feedback submitted
                </strong>
                <p>
                  Your submitted feedback will
                  appear here.
                </p>
              </div>
            ) : (
              <>
                <div className="doctor-feedback-list">
                  {feedbacks.map(
                    (feedback) => (
                      <article
                        key={feedback.id}
                        className="doctor-feedback-list-item"
                      >
                        <div className="doctor-feedback-item-top">
                          <div>
                            <span>
                              {feedback.feedbackNumber}
                            </span>

                            <strong>
                              {getTypeLabel(
                                feedback.type
                              )}
                            </strong>
                          </div>

                          <span
                            className={`doctor-feedback-status doctor-feedback-status-${feedback.status?.toLowerCase()}`}
                          >
                            {STATUS_LABELS[
                              feedback.status
                            ] ||
                              feedback.status}
                          </span>
                        </div>

                        <p>
                          {feedback.message}
                        </p>

                        <div className="doctor-feedback-item-footer">
                          <span>
                            {formatDateTime(
                              feedback.createdAt
                            )}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              openFeedbackDetail(
                                feedback.id
                              )
                            }
                          >
                            View details
                          </button>
                        </div>
                      </article>
                    )
                  )}
                </div>

                <footer className="doctor-feedback-pagination">
                  <button
                    type="button"
                    onClick={() =>
                      changePage(
                        pagination.page - 1
                      )
                    }
                    disabled={
                      pagination.page <= 0
                    }
                    aria-label="Previous page"
                  >
                    <FiChevronLeft />
                  </button>

                  <span>
                    Page{" "}
                    <strong>
                      {pagination.totalPages === 0
                        ? 0
                        : pagination.page + 1}
                    </strong>{" "}
                    of{" "}
                    <strong>
                      {pagination.totalPages}
                    </strong>
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      changePage(
                        pagination.page + 1
                      )
                    }
                    disabled={
                      pagination.page + 1 >=
                      pagination.totalPages
                    }
                    aria-label="Next page"
                  >
                    <FiChevronRight />
                  </button>
                </footer>
              </>
            )}
          </section>
        </div>
      </main>

      {modal}
    </>
  );
};

export default DoctorFeedback;