import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./DoctorDashboard.css";
import { useNavigate } from "react-router-dom";
import { getDoctorDashboard } from "../../services/doctorService";

const REFRESH_INTERVAL_MS = 60 * 1000;

const formatDateTime = (timestamp) => {
  if (!timestamp) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(timestamp));
  } catch {
    return "—";
  }
};

const formatTimeOnly = (timestamp) => {
  if (!timestamp) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(timestamp));
  } catch {
    return "—";
  }
};

const statusLabelMap = {
  INCOMPLETE: "Incomplete",
  READY_FOR_REVIEW: "Ready for Review",
  UNDER_REVIEW: "Under Review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

const DoctorDashboard = () => {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      const data = await getDoctorDashboard();
      setDashboard(data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to load dashboard right now. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();

    const interval = setInterval(() => {
      fetchDashboard(true);
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const profileStatus = dashboard?.profileStatus;
  const stats = dashboard?.stats;
  const nextAppointment = dashboard?.nextAppointment;
  const dayLoadSummary = dashboard?.dayLoadSummary;
  const recentPatients = dashboard?.recentPatients || [];
  const recentAppointments = dashboard?.recentAppointments || [];
  const criticalAlerts = dashboard?.criticalAlerts || [];
  const todaySchedule = dashboard?.todaySchedule || [];
  const quickActionPermissions = dashboard?.quickActionPermissions || {};

  const statusBadgeClass = useMemo(() => {
    const status = profileStatus?.verificationStatus || "INCOMPLETE";
    return status.toLowerCase().replace(/_/g, "-");
  }, [profileStatus?.verificationStatus]);

  const canManagePatients = !!quickActionPermissions?.canAddPatient;
  const canScheduleAppointments = !!quickActionPermissions?.canScheduleAppointment;

  const handleRestrictedAction = (allowed, route) => {
    if (!allowed) return;
    navigate(route);
  };

  if (loading) {
    return (
      <div className="doctor-dashboard-container">
        <div className="dashboard-loading-card">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="doctor-dashboard-container">
        <div className="dashboard-error-card">
          <h3>Dashboard load failed</h3>
          <p>{error}</p>
          <button type="button" onClick={() => fetchDashboard()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-dashboard-container">
      <div className="dashboard-topbar">
        <div>
          <p className="dashboard-eyebrow">Overview</p>
          <h2 className="dashboard-heading">Doctor Dashboard</h2>
        </div>

        <button
          type="button"
          className="refresh-btn"
          onClick={() => fetchDashboard(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* PROFILE / VERIFICATION STATUS */}
      <section className="profile-status-banner">
        <div className="profile-status-left">
          <div className={`profile-status-icon ${statusBadgeClass}`}>
            {profileStatus?.verificationStatus === "VERIFIED" ? "✅" : "⚠️"}
          </div>

          <div className="profile-status-text">
            <div className="profile-status-title-row">
              <h3>{profileStatus?.bannerTitle || "Profile Status"}</h3>
              <span className={`verification-badge ${statusBadgeClass}`}>
                {statusLabelMap[profileStatus?.verificationStatus] || "Incomplete"}
              </span>
            </div>

            <p>{profileStatus?.bannerMessage || "Profile status unavailable."}</p>

            <div className="completion-meta">
              <span>
                Profile Completion:{" "}
                <strong>{profileStatus?.completionPercentage ?? 0}%</strong>
              </span>
              <span>
                Required:{" "}
                <strong>{profileStatus?.minimumPercentageRequired ?? 85}%</strong>
              </span>
            </div>

            {!!profileStatus?.blockingReasons?.length && (
              <div className="blocking-reasons">
                {profileStatus.blockingReasons.map((item, index) => (
                  <span key={`${item}-${index}`} className="blocking-pill">
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="profile-status-right">
          <div className="progress-shell">
            <div
              className="progress-fill"
              style={{ width: `${profileStatus?.completionPercentage ?? 0}%` }}
            />
          </div>

          <button
            type="button"
            className="primary-action-btn"
            onClick={() => navigate("/doctor/profile")}
          >
            {profileStatus?.verificationStatus === "VERIFIED"
              ? "View Profile"
              : "Complete Profile"}
          </button>
        </div>
      </section>

      {/* NEXT APPOINTMENT + TODAY SUMMARY */}
      <div className="dashboard-highlight-grid">
        <section className="highlight-card">
          <div className="card-head">
            <h3>Next Appointment</h3>
          </div>

          {nextAppointment?.exists ? (
            <div className="highlight-content">
              <div className="highlight-main-row">
                <div>
                  <p className="highlight-label">Patient</p>
                  <h4>{nextAppointment.patientName || "—"}</h4>
                </div>
                {nextAppointment?.critical && (
                  <span className="critical-chip">Critical</span>
                )}
              </div>

              <div className="highlight-details">
                <div>
                  <span className="detail-label">Clinic</span>
                  <span className="detail-value">
                    {nextAppointment.clinicName || "—"}
                  </span>
                </div>
                <div>
                  <span className="detail-label">Time</span>
                  <span className="detail-value">
                    {formatDateTime(nextAppointment.appointmentDateTime)}
                  </span>
                </div>
                <div>
                  <span className="detail-label">Status</span>
                  <span className="detail-value">
                    {nextAppointment.status || "—"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-inline-state">No upcoming appointments found.</div>
          )}
        </section>

        <section className="highlight-card">
          <div className="card-head">
            <h3>Today’s Appointment Summary</h3>
          </div>

          <div className="day-load-grid">
            <div className="mini-stat">
              <span>Total</span>
              <strong>{dayLoadSummary?.totalToday ?? 0}</strong>
            </div>
            <div className="mini-stat">
              <span>Scheduled</span>
              <strong>{dayLoadSummary?.scheduledToday ?? 0}</strong>
            </div>
            <div className="mini-stat">
              <span>Completed</span>
              <strong>{dayLoadSummary?.completedToday ?? 0}</strong>
            </div>
            <div className="mini-stat">
              <span>No-show</span>
              <strong>{dayLoadSummary?.noShowToday ?? 0}</strong>
            </div>
            <div className="mini-stat">
              <span>Cancelled</span>
              <strong>{dayLoadSummary?.cancelledToday ?? 0}</strong>
            </div>
            <div className="mini-stat">
              <span>Remaining</span>
              <strong>{dayLoadSummary?.remainingToday ?? 0}</strong>
            </div>
          </div>
        </section>
      </div>

      {/* MAIN STATS */}
      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Patients</span>
          <h3>{stats?.totalPatients ?? 0}</h3>
        </div>
        <div className="stat-card">
          <span className="stat-label">Today Appointments</span>
          <h3>{stats?.todayAppointments ?? 0}</h3>
        </div>
        <div className="stat-card">
          <span className="stat-label">Upcoming Appointments</span>
          <h3>{stats?.upcomingAppointments ?? 0}</h3>
        </div>
        <div className="stat-card">
          <span className="stat-label">Critical Appointments</span>
          <h3>{stats?.criticalAppointments ?? 0}</h3>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="section-card">
        <div className="card-head">
          <h3>Quick Actions</h3>
          <p>Frequently used actions for faster workflow.</p>
        </div>

        <div className="quick-actions-grid">
          <button
            type="button"
            className={`quick-action-card ${!canManagePatients ? "disabled" : ""}`}
            onClick={() => handleRestrictedAction(canManagePatients, "/doctor/add-patient")}
            disabled={!canManagePatients}
          >
            <span className="quick-action-icon">👤</span>
            <div>
              <h4>Add Patient</h4>
              <p>Create a new patient record.</p>
            </div>
          </button>

          <button
            type="button"
            className={`quick-action-card ${
              !canScheduleAppointments ? "disabled" : ""
            }`}
            onClick={() =>
              handleRestrictedAction(canScheduleAppointments, "/doctor/appointments")
            }
            disabled={!canScheduleAppointments}
          >
            <span className="quick-action-icon">📅</span>
            <div>
              <h4>Scheduled Appointments</h4>
              <p>View and manage all appointment records.</p>
            </div>
          </button>

          <button
            type="button"
            className="quick-action-card"
            onClick={() => navigate("/doctor/profile")}
          >
            <span className="quick-action-icon">🩺</span>
            <div>
              <h4>Manage Profile</h4>
              <p>Update profile, clinics and documents.</p>
            </div>
          </button>
        </div>
      </section>

      {/* TODAY SCHEDULE */}
      <section className="section-card">
        <div className="card-head card-head-with-action">
          <div>
            <h3>Today’s Schedule</h3>
            <p>Live snapshot of today’s appointments.</p>
          </div>

          <button
            type="button"
            className="section-link-btn"
            onClick={() => navigate("/doctor/appointments")}
          >
            View All Appointments
          </button>
        </div>

        {todaySchedule.length ? (
          <>
            <div className="desktop-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Patient</th>
                    <th>Clinic</th>
                    <th>Status</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {todaySchedule.map((item) => (
                    <tr key={item.id}>
                      <td>{formatTimeOnly(item.appointmentDateTime)}</td>
                      <td className="strong-cell">{item.patientName || "—"}</td>
                      <td>{item.clinicName || "—"}</td>
                      <td>
                        <span
                          className={`status-pill ${String(item.status || "")
                            .toLowerCase()
                            .replace(/_/g, "-")}`}
                        >
                          {item.status || "—"}
                        </span>
                      </td>
                      <td>
                        {item.critical ? (
                          <span className="critical-chip">Critical</span>
                        ) : (
                          <span className="muted-chip">Normal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-list">
              {todaySchedule.map((item) => (
                <div className="mobile-info-card" key={item.id}>
                  <div className="mobile-info-row">
                    <span>Time</span>
                    <strong>{formatTimeOnly(item.appointmentDateTime)}</strong>
                  </div>
                  <div className="mobile-info-row">
                    <span>Patient</span>
                    <strong>{item.patientName || "—"}</strong>
                  </div>
                  <div className="mobile-info-row">
                    <span>Clinic</span>
                    <strong>{item.clinicName || "—"}</strong>
                  </div>
                  <div className="mobile-info-row">
                    <span>Status</span>
                    <span
                      className={`status-pill ${String(item.status || "")
                        .toLowerCase()
                        .replace(/_/g, "-")}`}
                    >
                      {item.status || "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-section-state">No appointments scheduled for today.</div>
        )}
      </section>

      {/* RECENT PATIENTS + RECENT APPOINTMENTS */}
      <div className="dashboard-two-col">
        <section className="section-card">
          <div className="card-head card-head-with-action">
            <div>
              <h3>Recent Patients</h3>
              <p>Latest patient records added to your practice.</p>
            </div>

            <button
              type="button"
              className="section-link-btn"
              onClick={() => navigate("/doctor/patients")}
            >
              View All Patients
            </button>
          </div>

          {recentPatients.length ? (
            <div className="simple-list">
              {recentPatients.map((item) => (
                <div className="simple-list-item" key={item.id}>
                  <div>
                    <h4>{item.fullName || "—"}</h4>
                    <p>{item.clinicName || "No clinic linked"}</p>
                  </div>
                  <div className="simple-list-right">
                    {item.critical && <span className="critical-chip">Critical</span>}
                    <span className="muted-date">{formatDateTime(item.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-section-state">No recent patients available.</div>
          )}
        </section>

        <section className="section-card">
          <div className="card-head card-head-with-action">
            <div>
              <h3>Recent Appointments</h3>
              <p>Latest appointment activity in your workspace.</p>
            </div>

            <button
              type="button"
              className="section-link-btn"
              onClick={() => navigate("/doctor/appointments")}
            >
              View All Appointments
            </button>
          </div>

          {recentAppointments.length ? (
            <div className="simple-list">
              {recentAppointments.map((item) => (
                <div className="simple-list-item" key={item.id}>
                  <div>
                    <h4>{item.patientName || "—"}</h4>
                    <p>
                      {item.clinicName || "—"} •{" "}
                      {formatDateTime(item.appointmentDateTime)}
                    </p>
                  </div>
                  <div className="simple-list-right">
                    <span
                      className={`status-pill ${String(item.status || "")
                        .toLowerCase()
                        .replace(/_/g, "-")}`}
                    >
                      {item.status || "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-section-state">No recent appointments available.</div>
          )}
        </section>
      </div>

      {/* CRITICAL ALERTS */}
      <section className="section-card">
        <div className="card-head">
          <h3>Recent Critical Alerts</h3>
          <p>High-priority appointments requiring attention.</p>
        </div>

        {criticalAlerts.length ? (
          <div className="alert-list">
            {criticalAlerts.map((item) => (
              <div className="alert-item" key={item.appointmentId}>
                <div className="alert-icon">🚨</div>
                <div className="alert-body">
                  <h4>{item.patientName || "Unknown Patient"}</h4>
                  <p>{item.alertMessage || "Critical appointment alert"}</p>
                  <span>
                    {item.clinicName || "—"} •{" "}
                    {formatDateTime(item.appointmentDateTime)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-section-state">No critical alerts right now.</div>
        )}
      </section>
    </div>
  );
};

export default DoctorDashboard;