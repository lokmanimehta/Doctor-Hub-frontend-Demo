import React, { useEffect, useMemo, useState } from "react";
import {
  getAdminFeedbackById,
  getAdminFeedbacks,
  updateAdminFeedbackStatus
} from "../../services/adminService";
import "./FeedbackPage.css";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Status" },
  { value: "NEW", label: "New" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" }
];

const TYPE_OPTIONS = [
  { value: "ALL", label: "All Types" },
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

const UPDATE_STATUS_OPTIONS = STATUS_OPTIONS.filter(
  (status) => status.value !== "ALL"
);

const getLabel = (options, value) => {
  return options.find((item) => item.value === value)?.label || value || "-";
};

const formatDateTime = (timestamp) => {
  if (!timestamp) {
    return "-";
  }

  return new Date(timestamp).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const getStars = (rating) => {
  if (!rating) {
    return "No rating";
  }

  return `${"★".repeat(rating)}${"☆".repeat(5 - rating)} (${rating}/5)`;
};

const FeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const [filters, setFilters] = useState({
    status: "ALL",
    type: "ALL"
  });

  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0
  });

  const [statusForm, setStatusForm] = useState({
    status: "REVIEWED",
    adminNote: ""
  });

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const stats = useMemo(() => {
    const total = pagination.totalElements || feedbacks.length;
    const newCount = feedbacks.filter((item) => item.status === "NEW").length;
    const resolvedCount = feedbacks.filter(
      (item) => item.status === "RESOLVED" || item.status === "CLOSED"
    ).length;
    const ratedItems = feedbacks.filter((item) => item.rating);
    const averageRating =
      ratedItems.length === 0
        ? "-"
        : (
            ratedItems.reduce((sum, item) => sum + Number(item.rating || 0), 0) /
            ratedItems.length
          ).toFixed(1);

    return {
      total,
      newCount,
      resolvedCount,
      averageRating
    };
  }, [feedbacks, pagination.totalElements]);

  const loadFeedbacks = async ({
    nextPage = pagination.page,
    nextStatus = filters.status,
    nextType = filters.type
  } = {}) => {
    try {
      setLoading(true);
      setErrorMessage("");

      const data = await getAdminFeedbacks({
        status: nextStatus,
        type: nextType,
        page: nextPage,
        size: pagination.size
      });

      setFeedbacks(data?.feedbacks || []);
      setPagination({
        page: data?.page ?? nextPage,
        size: data?.size ?? pagination.size,
        totalElements: data?.totalElements ?? 0,
        totalPages: data?.totalPages ?? 0
      });
    } catch (error) {
      setErrorMessage(error.message || "Failed to load feedback.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbacks({ nextPage: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = async (e) => {
    const { name, value } = e.target;

    const nextFilters = {
      ...filters,
      [name]: value
    };

    setFilters(nextFilters);
    setSelectedFeedback(null);
    setSuccessMessage("");

    await loadFeedbacks({
      nextPage: 0,
      nextStatus: nextFilters.status,
      nextType: nextFilters.type
    });
  };

  const handleViewDetails = async (feedbackId) => {
    try {
      setDetailLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const data = await getAdminFeedbackById(feedbackId);
      setSelectedFeedback(data);
      setStatusForm({
        status: data?.status || "REVIEWED",
        adminNote: data?.adminNote || ""
      });
    } catch (error) {
      setErrorMessage(error.message || "Failed to load feedback details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusFormChange = (e) => {
    const { name, value } = e.target;

    setStatusForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();

    if (!selectedFeedback?.id) {
      setErrorMessage("Please select feedback first.");
      return;
    }

    try {
      setUpdating(true);
      setErrorMessage("");
      setSuccessMessage("");

      const updated = await updateAdminFeedbackStatus(selectedFeedback.id, {
        status: statusForm.status,
        adminNote: statusForm.adminNote.trim() || null
      });

      setSelectedFeedback(updated);
      setSuccessMessage("Feedback status updated successfully.");

      await loadFeedbacks({
        nextPage: pagination.page,
        nextStatus: filters.status,
        nextType: filters.type
      });
    } catch (error) {
      setErrorMessage(error.message || "Failed to update feedback status.");
    } finally {
      setUpdating(false);
    }
  };

  const handlePageChange = async (nextPage) => {
    if (nextPage < 0 || nextPage >= pagination.totalPages) {
      return;
    }

    await loadFeedbacks({ nextPage });
  };

  return (
    <div className="admin-feedback-page">
      <div className="admin-feedback-header">
        <div>
          <p className="admin-feedback-eyebrow">Admin Panel</p>
          <h1>Patient Feedback</h1>
          <p>
            Review patient feedback, monitor ratings, and track admin action
            status from one place.
          </p>
        </div>
      </div>

      <div className="admin-feedback-stats">
        <div className="admin-feedback-stat-card">
          <span>Total Feedback</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="admin-feedback-stat-card">
          <span>New On This Page</span>
          <strong>{stats.newCount}</strong>
        </div>
        <div className="admin-feedback-stat-card">
          <span>Resolved On This Page</span>
          <strong>{stats.resolvedCount}</strong>
        </div>
        <div className="admin-feedback-stat-card">
          <span>Avg. Rating On This Page</span>
          <strong>{stats.averageRating}</strong>
        </div>
      </div>

      {errorMessage && (
        <div className="admin-feedback-alert admin-feedback-alert--error">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="admin-feedback-alert admin-feedback-alert--success">
          {successMessage}
        </div>
      )}

      <div className="admin-feedback-layout">
        <section className="admin-feedback-list-card">
          <div className="admin-feedback-toolbar">
            <div>
              <h2>Feedback List</h2>
              <p>{pagination.totalElements} feedback record(s)</p>
            </div>

            <div className="admin-feedback-filters">
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>

              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
              >
                {TYPE_OPTIONS.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="admin-feedback-empty">Loading feedback...</div>
          ) : feedbacks.length === 0 ? (
            <div className="admin-feedback-empty">
              <strong>No feedback found.</strong>
              <span>Try changing filters or check again later.</span>
            </div>
          ) : (
            <>
              <div className="admin-feedback-table-wrap">
                <table className="admin-feedback-table">
                  <thead>
                    <tr>
                      <th>Feedback</th>
                      <th>Patient</th>
                      <th>Type</th>
                      <th>Rating</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {feedbacks.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="admin-feedback-main-cell">
                            <strong>{item.feedbackNumber}</strong>
                            <span>{item.message}</span>
                          </div>
                        </td>

                        <td>
                          <div className="admin-feedback-patient-cell">
                            <strong>{item.patientName || "-"}</strong>
                            <span>{item.patientEmail || "-"}</span>
                          </div>
                        </td>

                        <td>{getLabel(TYPE_OPTIONS, item.type)}</td>

                        <td>
                          <span className="admin-feedback-rating">
                            {item.rating ? `${item.rating}/5` : "-"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`admin-feedback-status admin-feedback-status--${item.status?.toLowerCase()}`}
                          >
                            {getLabel(STATUS_OPTIONS, item.status)}
                          </span>
                        </td>

                        <td>{formatDateTime(item.createdAt)}</td>

                        <td>
                          <button
                            type="button"
                            className="admin-feedback-view-btn"
                            onClick={() => handleViewDetails(item.id)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="admin-feedback-mobile-list">
                {feedbacks.map((item) => (
                  <article key={item.id} className="admin-feedback-mobile-card">
                    <div className="admin-feedback-mobile-top">
                      <strong>{item.feedbackNumber}</strong>
                      <span
                        className={`admin-feedback-status admin-feedback-status--${item.status?.toLowerCase()}`}
                      >
                        {getLabel(STATUS_OPTIONS, item.status)}
                      </span>
                    </div>

                    <p>{item.message}</p>

                    <div className="admin-feedback-mobile-meta">
                      <span>{item.patientName || "-"}</span>
                      <span>{getLabel(TYPE_OPTIONS, item.type)}</span>
                      <span>{item.rating ? `${item.rating}/5` : "No rating"}</span>
                      <span>{formatDateTime(item.createdAt)}</span>
                    </div>

                    <button
                      type="button"
                      className="admin-feedback-view-btn"
                      onClick={() => handleViewDetails(item.id)}
                    >
                      View Details
                    </button>
                  </article>
                ))}
              </div>

              <div className="admin-feedback-pagination">
                <button
                  type="button"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 0}
                >
                  Previous
                </button>

                <span>
                  Page {pagination.totalPages === 0 ? 0 : pagination.page + 1} of{" "}
                  {pagination.totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page + 1 >= pagination.totalPages}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </section>

        <aside className="admin-feedback-detail-card">
          <div className="admin-feedback-detail-heading">
            <h2>Feedback Details</h2>
            <p>Select feedback to review full details.</p>
          </div>

          {detailLoading ? (
            <div className="admin-feedback-empty">Loading details...</div>
          ) : !selectedFeedback ? (
            <div className="admin-feedback-empty">
              <strong>No feedback selected.</strong>
              <span>Click View from the feedback list.</span>
            </div>
          ) : (
            <div className="admin-feedback-detail">
              <div className="admin-feedback-detail-top">
                <div>
                  <strong>{selectedFeedback.feedbackNumber}</strong>
                  <span>{formatDateTime(selectedFeedback.createdAt)}</span>
                </div>

                <span
                  className={`admin-feedback-status admin-feedback-status--${selectedFeedback.status?.toLowerCase()}`}
                >
                  {getLabel(STATUS_OPTIONS, selectedFeedback.status)}
                </span>
              </div>

              <div className="admin-feedback-detail-section">
                <h3>Patient</h3>
                <div className="admin-feedback-info-grid">
                  <div>
                    <span>Name</span>
                    <strong>{selectedFeedback.patientName || "-"}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{selectedFeedback.patientEmail || "-"}</strong>
                  </div>
                  <div>
                    <span>Mobile</span>
                    <strong>{selectedFeedback.patientMobile || "-"}</strong>
                  </div>
                  <div>
                    <span>Location</span>
                    <strong>
                      {[selectedFeedback.patientCity, selectedFeedback.patientState]
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="admin-feedback-detail-section">
                <h3>Feedback</h3>
                <div className="admin-feedback-info-grid">
                  <div>
                    <span>Type</span>
                    <strong>{getLabel(TYPE_OPTIONS, selectedFeedback.type)}</strong>
                  </div>
                  <div>
                    <span>Rating</span>
                    <strong>{getStars(selectedFeedback.rating)}</strong>
                  </div>
                  <div>
                    <span>Allow Contact</span>
                    <strong>{selectedFeedback.allowContact ? "Yes" : "No"}</strong>
                  </div>
                  <div>
                    <span>Related Page</span>
                    <strong>{selectedFeedback.relatedPage || "-"}</strong>
                  </div>
                </div>

                <div className="admin-feedback-message-box">
                  {selectedFeedback.message}
                </div>
              </div>

              <div className="admin-feedback-detail-section">
                <h3>Timeline</h3>
                <div className="admin-feedback-info-grid">
                  <div>
                    <span>Reviewed At</span>
                    <strong>{formatDateTime(selectedFeedback.reviewedAt)}</strong>
                  </div>
                  <div>
                    <span>Resolved At</span>
                    <strong>{formatDateTime(selectedFeedback.resolvedAt)}</strong>
                  </div>
                  <div>
                    <span>Closed At</span>
                    <strong>{formatDateTime(selectedFeedback.closedAt)}</strong>
                  </div>
                  <div>
                    <span>Updated At</span>
                    <strong>{formatDateTime(selectedFeedback.updatedAt)}</strong>
                  </div>
                </div>
              </div>

              <form
                className="admin-feedback-status-form"
                onSubmit={handleUpdateStatus}
              >
                <h3>Admin Action</h3>

                <label>
                  Status
                  <select
                    name="status"
                    value={statusForm.status}
                    onChange={handleStatusFormChange}
                  >
                    {UPDATE_STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Admin Note
                  <textarea
                    name="adminNote"
                    value={statusForm.adminNote}
                    onChange={handleStatusFormChange}
                    placeholder="Write internal admin note..."
                  />
                </label>

                <button type="submit" disabled={updating}>
                  {updating ? "Updating..." : "Update Status"}
                </button>
              </form>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default FeedbackPage;