import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./Appointments.css";
import ViewAppointmentModal from "./ViewAppointmentModal";
import CompleteAppointmentModal from "./CompleteAppointmentModal";
import { useSearchParams } from "react-router-dom";
import { useNotifications } from "../../context/useNotifications";
import {
  getAllDoctorAppointments,
  cancelPatientAppointment,
  markAppointmentNoShow,
  markAppointmentCompleted
} from "../../services/doctorService";

const STATUS_OPTIONS = ["ALL", "SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"];
const PAGE_SIZE = 10;

const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";

  return new Date(timestamp).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const formatTime = (timestamp) => {
  if (!timestamp) return "N/A";

  return new Date(timestamp).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};

const formatDateInputToTimestamp = (dateValue) => {
  if (!dateValue) return null;
  const localDate = new Date(`${dateValue}T00:00:00`);
  return localDate.getTime();
};

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [completeModalAppointment, setCompleteModalAppointment] = useState(null);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(0);

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const [highlightAppointmentId, setHighlightAppointmentId] = useState(null);
  const [listMeta, setListMeta] = useState({
    totalElements: 0,
    totalPages: 0,
    last: true,
    size: PAGE_SIZE
  });

  const { handleNotificationActionSuccess } = useNotifications();

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: null,
    appointmentId: null,
    title: "",
    message: "",
    confirmText: ""
  });

  const [feedbackModal, setFeedbackModal] = useState({
    open: false,
    title: "",
    message: "",
    tone: "error"
  });

  const openFeedbackModal = ({ title, message, tone = "error" }) => {
    setFeedbackModal({
      open: true,
      title,
      message,
      tone
    });
  };

  const closeFeedbackModal = () => {
    setFeedbackModal({
      open: false,
      title: "",
      message: "",
      tone: "error"
    });
  };

  const openConfirmModal = ({
    type,
    appointmentId,
    title,
    message,
    confirmText
  }) => {
    setConfirmModal({
      open: true,
      type,
      appointmentId,
      title,
      message,
      confirmText
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      open: false,
      type: null,
      appointmentId: null,
      title: "",
      message: "",
      confirmText: ""
    });
  };

  useEffect(() => {
    const highlightValue = searchParams.get("highlight");

    if (!highlightValue) {
      setHighlightAppointmentId(null);
      return;
    }

    const parsedId = Number(highlightValue);

    if (!Number.isNaN(parsedId)) {
      setHighlightAppointmentId(parsedId);
    }
  }, [searchParams]);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAllDoctorAppointments({
        search: appliedSearch,
        status: statusFilter,
        date: formatDateInputToTimestamp(dateFilter),
        critical: showCriticalOnly ? true : undefined,
        page,
        size: PAGE_SIZE
      });

      setAppointments(Array.isArray(response?.content) ? response.content : []);
      setListMeta({
        totalElements: response?.totalElements ?? 0,
        totalPages: response?.totalPages ?? 0,
        last: response?.last ?? true,
        size: response?.size ?? PAGE_SIZE
      });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Unable to load appointments right now. Please try again.";

      setError(message);
      setAppointments([]);
      setListMeta({
        totalElements: 0,
        totalPages: 0,
        last: true,
        size: PAGE_SIZE
      });
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, statusFilter, showCriticalOnly, dateFilter, page]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (
        !actionLoadingId &&
        !selectedAppointment &&
        !confirmModal.open &&
        !completeModalAppointment
      ) {
        fetchAppointments();
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchAppointments, actionLoadingId, selectedAppointment, confirmModal.open, completeModalAppointment]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    setAppliedSearch(search.trim());
  };

  const handleStatusChange = (status) => {
    setPage(0);
    setStatusFilter(status);
  };

  const handleCriticalCheckboxChange = (e) => {
    setPage(0);
    setShowCriticalOnly(e.target.checked);
  };

  const handleDateChange = (e) => {
    setPage(0);
    setDateFilter(e.target.value);
  };

  const handleClearFilters = () => {
    setSearch("");
    setAppliedSearch("");
    setStatusFilter("ALL");
    setShowCriticalOnly(false);
    setDateFilter("");
    setPage(0);
  };

  const handleView = (appointment) => {
    setSelectedAppointment(appointment);
  };

  const closeViewModal = () => {
    setSelectedAppointment(null);
  };

  const openNoShowConfirmModal = (appointmentId) => {
    openConfirmModal({
      type: "NO_SHOW",
      appointmentId,
      title: "Mark as No Show",
      message:
        "Are you sure you want to mark this appointment as NO SHOW? This will update the appointment status immediately.",
      confirmText: "Mark No Show"
    });
  };

  const openCancelConfirmModal = (appointmentId) => {
    openConfirmModal({
      type: "CANCEL",
      appointmentId,
      title: "Cancel Appointment",
      message:
        "Are you sure you want to cancel this appointment? This will update the appointment status immediately.",
      confirmText: "Cancel Appointment"
    });
  };

  const openCompleteModal = (appointment) => {
    if (!appointment || !appointment.id) return;
    setCompleteModalAppointment(appointment);
  };

  const closeCompleteModal = () => {
    if (actionLoadingId) return;
    setCompleteModalAppointment(null);
  };

  const applyLocalStatusUpdate = (appointmentId, nextStatus) => {
    setAppointments((prev) =>
      prev.map((item) =>
        item.id === appointmentId
          ? {
              ...item,
              status: nextStatus
            }
          : item
      )
    );

    if (selectedAppointment?.id === appointmentId) {
      setSelectedAppointment((prev) =>
        prev
          ? {
              ...prev,
              status: nextStatus
            }
          : null
      );
    }
  };

  const runNoShowAction = async (appointmentId) => {
    setActionLoadingId(appointmentId);
    await markAppointmentNoShow(appointmentId);
    applyLocalStatusUpdate(appointmentId, "NO_SHOW");
    await handleNotificationActionSuccess({ showToastOnNew: true });
  };

  const runCancelAction = async (appointmentId) => {
    setActionLoadingId(appointmentId);
    await cancelPatientAppointment(appointmentId);
    applyLocalStatusUpdate(appointmentId, "CANCELLED");
    await handleNotificationActionSuccess({ showToastOnNew: true });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.appointmentId || !confirmModal.type) return;

    try {
      if (confirmModal.type === "NO_SHOW") {
        await runNoShowAction(confirmModal.appointmentId);
      }

      if (confirmModal.type === "CANCEL") {
        await runCancelAction(confirmModal.appointmentId);
      }

      closeConfirmModal();
    } catch (err) {
      closeConfirmModal();

      openFeedbackModal({
        title: "Action failed",
        message:
          err?.response?.data?.message ||
          "Something went wrong while updating the appointment. Please try again.",
        tone: "error"
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCompleteAppointmentSubmit = async (payload) => {
    if (!completeModalAppointment?.id) return;

    try {
      setActionLoadingId(completeModalAppointment.id);

      const result = await markAppointmentCompleted(
        completeModalAppointment.id,
        payload
      );

      const updatedAppointment = result?.appointment;

      setAppointments((prev) =>
        prev.map((item) =>
          item.id === completeModalAppointment.id ? updatedAppointment : item
        )
      );

      if (selectedAppointment?.id === completeModalAppointment.id) {
        setSelectedAppointment(updatedAppointment);
      }

      setCompleteModalAppointment(null);

      await handleNotificationActionSuccess?.({
        showToastOnNew: true
      });

      openFeedbackModal({
        title: "Appointment updated",
        message:
          result?.message || "Appointment marked as completed successfully.",
        tone: "success"
      });

      await fetchAppointments();
    } catch (err) {
      openFeedbackModal({
        title: "Unable to complete appointment",
        message:
          err?.response?.data?.message ||
          err?.message ||
          "Something went wrong while completing the appointment.",
        tone: "error"
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const statusCounts = useMemo(() => {
    const base = {
      ALL: listMeta.totalElements,
      SCHEDULED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      NO_SHOW: 0
    };

    appointments.forEach((item) => {
      if (base[item.status] !== undefined) {
        base[item.status] += 1;
      }
    });

    return base;
  }, [appointments, listMeta.totalElements]);

  const criticalCount = useMemo(() => {
    return appointments.filter((item) => item.isCritical).length;
  }, [appointments]);

  const showEmptyState = !loading && appointments.length === 0;

  return (
    <div className="appointments-page-wrapper">
      <div className="appointments-page-shell">
        <div className="page-header-block">
          <div>
            <p className="appointments-eyebrow">Doctor panel</p>
            <h1 className="appointments-title">All Appointments</h1>
            <p className="appointments-subtitle">
              View, filter and manage appointments with status, date and
              critical patient visibility in one place.
            </p>
          </div>

          <div className="appointments-summary-card">
            <span className="summary-label">Total appointments</span>
            <strong className="summary-value">{listMeta.totalElements}</strong>
          </div>
        </div>

        <div className="appointments-toolbar">
          <form className="appointments-search-form" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient, clinic, symptoms, phone or notes"
              className="appointments-search-input"
            />
            <button type="submit" className="primary-toolbar-btn">
              Search
            </button>
          </form>

          <div className="appointments-toolbar-right">
            <input
              type="date"
              value={dateFilter}
              onChange={handleDateChange}
              className="appointments-date-input"
            />
            <button
              type="button"
              className="secondary-toolbar-btn"
              onClick={handleClearFilters}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="filters-panel">
          <div className="filter-subsection">
            <p className="filter-subtitle">Status</p>
            <div className="filter-container">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`filter-btn ${statusFilter === status ? "active-filter" : ""}`}
                  onClick={() => handleStatusChange(status)}
                >
                  {status} ({statusCounts[status] ?? 0})
                </button>
              ))}
            </div>
          </div>

          <div className="critical-checkbox-row">
            <label className="critical-checkbox-label">
              <input
                type="checkbox"
                checked={showCriticalOnly}
                onChange={handleCriticalCheckboxChange}
                className="critical-checkbox-input"
              />
              <span className="critical-checkbox-custom" />
              <span className="critical-checkbox-text">
                Show only critical appointments
              </span>
            </label>

            <span className="critical-checkbox-count">
              Critical in current results: <strong>{criticalCount}</strong>
            </span>
          </div>
        </div>

        {error ? (
          <div className="state-card error-state">
            <h3>Unable to load appointments</h3>
            <p>{error}</p>
            <button
              type="button"
              className="primary-toolbar-btn retry-btn"
              onClick={fetchAppointments}
            >
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="state-card loading-state">
            <div className="loading-spinner" />
            <p>Loading appointments...</p>
          </div>
        ) : null}

        {!loading && !error && (
          <>
            {showEmptyState ? (
              <div className="state-card empty-state">
                <h3>No appointments found</h3>
                <p>
                  There are no appointments matching the current filters.
                  Adjust search, date, status or critical checkbox to see results.
                </p>
              </div>
            ) : (
              <>
                <div className="desktop-view-container">
                  <table className="modern-doctor-table">
                    <thead>
                      <tr>
                        <th>PATIENT</th>
                        <th>CLINIC</th>
                        <th>DATE</th>
                        <th>TIME</th>
                        <th>SYMPTOMS</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>

                    <tbody>
                      {appointments.map((appointment) => (
                        <tr
                          key={appointment.id}
                          className={highlightAppointmentId === appointment.id ? "appointment-row-highlight" : ""}
                        >
                          <td>
                            <div className="patient-cell-block">
                              <span className="patient-cell">
                                {appointment.patientName || "Unknown Patient"}
                              </span>

                              <span className="patient-subtext">
                                {appointment.patientPhone || "No phone"}
                              </span>

                              {appointment.isCritical ? (
                                <span className="critical-inline-badge">
                                  Critical
                                </span>
                              ) : null}
                            </div>
                          </td>

                          <td>
                            <div className="clinic-cell-block">
                              <span>{appointment.clinicName || "N/A"}</span>
                            </div>
                          </td>

                          <td>{formatDate(appointment.appointmentDateTime)}</td>

                          <td>
                            <span className="time-tag">
                              {formatTime(appointment.appointmentDateTime)}
                            </span>
                          </td>

                          <td className="symptoms-cell">
                            {appointment.symptoms || "No symptoms added"}
                          </td>

                          <td>
                            <span
                              className={`status-pill status-pill-table ${appointment.status
                                ?.toLowerCase()
                                .replace("_", "-")}`}
                            >
                              {appointment.status || "N/A"}
                            </span>
                          </td>

                          <td className="actions-cell">
                            <button
                              type="button"
                              className="btn-view"
                              onClick={() => handleView(appointment)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mobile-view-container">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`appointment-card-mobile ${
                        highlightAppointmentId === appointment.id ? "appointment-card-highlight" : ""
                      }`}
                    >
                      <div className="card-top">
                        <div className="card-user-info">
                          <div className="mobile-card-heading-row">
                            <h4>{appointment.patientName || "Unknown Patient"}</h4>

                            {appointment.isCritical ? (
                              <span className="critical-inline-badge">
                                Critical
                              </span>
                            ) : null}
                          </div>

                          <p>{appointment.patientPhone || "No phone available"}</p>
                          <p>{appointment.clinicName || "N/A"}</p>
                          <p>
                            {formatDate(appointment.appointmentDateTime)} |{" "}
                            <span className="time-tag">
                              {formatTime(appointment.appointmentDateTime)}
                            </span>
                          </p>
                          <p className="mobile-symptoms">
                            {appointment.symptoms || "No symptoms added"}
                          </p>
                        </div>

                        <span
                          className={`status-pill ${appointment.status
                            ?.toLowerCase()
                            .replace("_", "-")}`}
                        >
                          {appointment.status || "N/A"}
                        </span>
                      </div>

                      <div className="card-footer-btns">
                        <button
                          type="button"
                          className="m-btn view"
                          onClick={() => handleView(appointment)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pagination-bar">
                  <div className="pagination-info">
                    <span>
                      Page <strong>{page + 1}</strong>
                    </span>
                    <span>
                      Total <strong>{listMeta.totalPages || 1}</strong> pages
                    </span>
                    <span>
                      Records <strong>{listMeta.totalElements}</strong>
                    </span>
                  </div>

                  <div className="pagination-actions">
                    <button
                      type="button"
                      className="pagination-btn"
                      disabled={page === 0}
                      onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                    >
                      Previous
                    </button>

                    <button
                      type="button"
                      className="pagination-btn"
                      disabled={listMeta.last || listMeta.totalPages === 0}
                      onClick={() => setPage((prev) => prev + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {confirmModal.open && (
          <div className="confirm-modal-overlay" onClick={closeConfirmModal}>
            <div
              className="confirm-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="confirm-title">{confirmModal.title}</h3>

              <p className="confirm-text">{confirmModal.message}</p>

              <div className="confirm-actions">
                <button
                  type="button"
                  className="confirm-cancel"
                  onClick={closeConfirmModal}
                >
                  Back
                </button>

                <button
                  type="button"
                  className="confirm-confirm"
                  onClick={handleConfirmAction}
                >
                  {confirmModal.confirmText}
                </button>
              </div>
            </div>
          </div>
        )}

        {feedbackModal.open && (
          <div className="confirm-modal-overlay" onClick={closeFeedbackModal}>
            <div
              className="confirm-modal feedback-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="confirm-title">{feedbackModal.title}</h3>

              <p className="confirm-text">{feedbackModal.message}</p>

              <div className="confirm-actions">
                <button
                  type="button"
                  className="confirm-confirm"
                  onClick={closeFeedbackModal}
                >
                  Okay
                </button>
              </div>
            </div>
          </div>
        )}

        <ViewAppointmentModal
          appointment={selectedAppointment}
          onClose={closeViewModal}
          onCancel={openCancelConfirmModal}
          onMarkNoShow={openNoShowConfirmModal}
          onMarkCompleted={openCompleteModal}
          actionLoadingId={actionLoadingId}
        />

        {completeModalAppointment?.id ? (
          <CompleteAppointmentModal
            key={`${completeModalAppointment.id}-${completeModalAppointment.updatedAt || 0}`}
            appointment={completeModalAppointment}
            loading={actionLoadingId === completeModalAppointment.id}
            onClose={closeCompleteModal}
            onSubmit={handleCompleteAppointmentSubmit}
          />
        ) : null}
      </div>
    </div>
  );
};

export default Appointments;