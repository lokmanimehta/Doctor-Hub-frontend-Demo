import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiAlertTriangle,
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiHeart,
  FiHelpCircle,
  FiMapPin,
  FiRefreshCw,
  FiShield,
  FiUserCheck,
  FiUsers
} from "react-icons/fi";
import { getPatientDashboard } from "../../services/patientService";
import { useProfile } from "../../context/useProfile";
import { getPatientDailyWellnessTip } from "../../utils/dailyWellnessTips";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const profileContext = useProfile();

  const selectedProfile = profileContext?.selectedProfile || null;

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");



  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setApiError("");

      const data = await getPatientDashboard();
      setDashboard(data);
    } catch (error) {
      console.error("Patient dashboard load failed:", error);

      setApiError(
        error?.response?.data?.message ||
          "Dashboard load nahi ho paya. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

const patient = dashboard?.patient || {};
const stats = dashboard?.stats || {};
const healthSummary = dashboard?.healthSummary || {};
const upcomingAppointment = dashboard?.upcomingAppointment || null;
const recentAppointments = dashboard?.recentAppointments || [];

const dailyTip = useMemo(
  () => getPatientDailyWellnessTip(patient?.accountCreatedAt),
  [patient?.accountCreatedAt]
);

const displayName = patient?.fullName || "Patient";
  const formatDate = (value) => {
    if (!value) return "Not available";

    try {
      return new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch {
      return value;
    }
  };

  const formatTime = (value) => {
    if (!value) return "Not available";

    const parts = value.split(":");

    if (parts.length < 2) {
      return value;
    }

    let hours = Number(parts[0]);
    const minutes = parts[1];
    const suffix = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;

    return `${hours}:${minutes} ${suffix}`;
  };

  const getInitial = (name) => {
    if (!name || typeof name !== "string") return "D";
    return name.trim().charAt(0).toUpperCase();
  };

  const getStatusClass = (status) => {
    if (!status) return "neutral";

    const value = status.toLowerCase();

    if (value.includes("scheduled") || value.includes("confirmed")) {
      return "success";
    }

    if (value.includes("cancel")) {
      return "danger";
    }

    if (value.includes("complete")) {
      return "completed";
    }

    return "neutral";
  };

  const profileCompletion = Math.min(
    Number(stats?.profileCompletionPercentage || 0),
    100
  );

  if (loading) {
    return (
      <main className="pd-page">
        <section className="pd-state-card">
          <div className="pd-state-icon pd-spin">
            <FiRefreshCw />
          </div>
          <h2>Loading your dashboard</h2>
          <p>Latest patient overview fetch ho raha hai.</p>
        </section>
      </main>
    );
  }

  if (apiError) {
    return (
      <main className="pd-page">
        <section className="pd-state-card pd-state-card--error">
          <div className="pd-state-icon">
            <FiAlertTriangle />
          </div>
          <h2>Dashboard load nahi hua</h2>
          <p>{apiError}</p>
          <button type="button" onClick={loadDashboard}>
            Try Again
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="pd-page">
      <section className="pd-hero">
        <div className="pd-hero__content">
          <span className="pd-eyebrow">Patient Dashboard</span>

          <h1>Welcome back, {displayName}</h1>

          <p>
            Appointments, health profile, care family aur medical vault ka clean
            overview ek jagah.
          </p>

          <div className="pd-hero__meta">
            {selectedProfile && (
              <div className="pd-care-pill">
                <FiUserCheck />
                <span>
                  Booking profile:{" "}
                  <strong>
                    {selectedProfile.fullName} ({selectedProfile.relation})
                  </strong>
                </span>
              </div>
            )}

            {patient?.city && (
              <div className="pd-care-pill pd-care-pill--muted">
                <FiMapPin />
                <span>
                  {patient.city}
                  {patient.state ? `, ${patient.state}` : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        <aside className="pd-tip-card">
          <div className="pd-tip-card__top">
            <div className="pd-tip-card__icon">
              <FiHeart />
            </div>

            <div className="pd-tip-card__meta">
              <span>Daily Wellness Tip</span>
              <small>
                Day {dailyTip.dayNumber} of {dailyTip.totalTips}
              </small>
            </div>
          </div>

          <div className="pd-tip-card__body">
            <span className="pd-tip-category">{dailyTip.category}</span>
            <h2>{dailyTip.title}</h2>
            <p>{dailyTip.message}</p>
          </div>
        </aside>
      </section>

      <section className="pd-stats-grid">
        <article className="pd-stat-card">
          <div className="pd-stat-card__icon">
            <FiCalendar />
          </div>
          <div>
            <span>Upcoming Visits</span>
            <strong>{stats.upcomingAppointments || 0}</strong>
            <p>Scheduled appointments</p>
          </div>
        </article>

        <article className="pd-stat-card">
          <div className="pd-stat-card__icon">
            <FiActivity />
          </div>
          <div>
            <span>Total Bookings</span>
            <strong>{stats.totalAppointments || 0}</strong>
            <p>All appointments</p>
          </div>
        </article>

        <article className="pd-stat-card">
          <div className="pd-stat-card__icon">
            <FiUsers />
          </div>
          <div>
            <span>Family Profiles</span>
            <strong>{stats.familyMembers || 0}</strong>
            <p>Managed by you</p>
          </div>
        </article>

        <article className="pd-stat-card">
          <div className="pd-stat-card__icon">
            <FiShield />
          </div>
          <div>
            <span>Profile Strength</span>
            <strong>{profileCompletion}%</strong>
            <p>Health data complete</p>
          </div>
        </article>
      </section>

      <section className="pd-main-grid">
        <div className="pd-left-column">
          <section className="pd-card pd-appointment-card">
            <div className="pd-card__header">
              <div>
                <span className="pd-section-label">Next appointment</span>
                <h2>Upcoming Consultation</h2>
              </div>

              <button
                type="button"
                className="pd-link-button"
                onClick={() => navigate("/patient/appointments")}
              >
                View all <FiArrowRight />
              </button>
            </div>

            {upcomingAppointment ? (
              <div className="pd-appointment">
                <div className="pd-doctor-block">
                  {upcomingAppointment.doctorImageUrl ? (
                    <img
                      src={upcomingAppointment.doctorImageUrl}
                      alt={upcomingAppointment.doctorName || "Doctor"}
                      className="pd-doctor-avatar"
                    />
                  ) : (
                    <div className="pd-doctor-avatar pd-doctor-avatar--fallback">
                      {getInitial(upcomingAppointment.doctorName)}
                    </div>
                  )}

                  <div>
                    <h3>{upcomingAppointment.doctorName || "Doctor"}</h3>
                    <p>{upcomingAppointment.specialty || "General Physician"}</p>
                    <span>{upcomingAppointment.clinicName || "Clinic"}</span>
                  </div>
                </div>

                <div className="pd-appointment-details">
                  <div>
                    <FiCalendar />
                    <span>{formatDate(upcomingAppointment.appointmentDate)}</span>
                  </div>

                  <div>
                    <FiClock />
                    <span>{formatTime(upcomingAppointment.slotStartTime)}</span>
                  </div>

                  {upcomingAppointment.location && (
                    <div>
                      <FiMapPin />
                      <span>{upcomingAppointment.location}</span>
                    </div>
                  )}
                </div>

                <div className="pd-appointment-footer">
                  <span
                    className={`pd-status pd-status--${getStatusClass(
                      upcomingAppointment.status
                    )}`}
                  >
                    {upcomingAppointment.status || "Scheduled"}
                  </span>

                  <button
                    type="button"
                    className="pd-primary-button"
                    onClick={() => navigate("/patient/appointments")}
                  >
                    Manage Visit
                  </button>
                </div>
              </div>
            ) : (
              <div className="pd-empty-appointment">
                <div className="pd-empty-appointment__icon">
                  <FiCalendar />
                </div>
                <h3>No upcoming appointment</h3>
                <p>
                  Verified doctors search karke apne ya family member ke liye
                  appointment book karo.
                </p>
                <button
                  type="button"
                  className="pd-primary-button"
                  onClick={() => navigate("/patient/finddoctors")}
                >
                  Find Doctors
                </button>
              </div>
            )}
          </section>

          <section className="pd-card">
            <div className="pd-card__header">
              <div>
                <span className="pd-section-label">Health readiness</span>
                <h2>Profile Completion</h2>
              </div>

              <button
                type="button"
                className="pd-link-button"
                onClick={() => navigate("/patient/profile")}
              >
                Update <FiArrowRight />
              </button>
            </div>

            <div className="pd-progress-card">
              <div className="pd-progress-card__top">
                <div>
                  <strong>{profileCompletion}%</strong>
                  <span>completed</span>
                </div>

                {profileCompletion >= 80 ? (
                  <span className="pd-readiness-badge pd-readiness-badge--good">
                    <FiCheckCircle /> Strong
                  </span>
                ) : (
                  <span className="pd-readiness-badge">
                    <FiAlertTriangle /> Needs update
                  </span>
                )}
              </div>

              <div className="pd-progress-track">
                <div
                  className="pd-progress-fill"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>

              <p>
                Blood group, allergies, medications aur emergency contact update
                karne se consultation faster aur safer hota hai.
              </p>
            </div>
          </section>

          <section className="pd-card">
            <div className="pd-card__header">
              <div>
                <span className="pd-section-label">Medical details</span>
                <h2>Health Summary</h2>
              </div>

              <button
                type="button"
                className="pd-link-button"
                onClick={() => navigate("/patient/profile")}
              >
                Edit <FiArrowRight />
              </button>
            </div>

            <div className="pd-health-grid">
              <div className="pd-health-item">
                <span>Blood Group</span>
                <strong>{healthSummary.bloodGroup || "Not added"}</strong>
              </div>

              <div className="pd-health-item">
                <span>Allergies</span>
                <strong>{healthSummary.allergies || "Not added"}</strong>
              </div>

              <div className="pd-health-item">
                <span>Chronic Conditions</span>
                <strong>{healthSummary.chronicConditions || "Not added"}</strong>
              </div>

              <div className="pd-health-item">
                <span>Current Medicines</span>
                <strong>{healthSummary.currentMedications || "Not added"}</strong>
              </div>
            </div>
          </section>

          <section className="pd-card">
            <div className="pd-card__header">
              <div>
                <span className="pd-section-label">Recent activity</span>
                <h2>Recent Appointments</h2>
              </div>

              <button
                type="button"
                className="pd-link-button"
                onClick={() => navigate("/patient/appointments")}
              >
                View all <FiArrowRight />
              </button>
            </div>

            {recentAppointments.length > 0 ? (
              <div className="pd-recent-list">
                {recentAppointments.map((appointment) => (
                  <article className="pd-recent-item" key={appointment.id}>
                    <div>
                      <h3>{appointment.doctorName || "Doctor"}</h3>
                      <p>
                        {appointment.specialty || "General Physician"} •{" "}
                        {appointment.clinicName || "Clinic"}
                      </p>
                    </div>

                    <div className="pd-recent-item__right">
                      <span>{formatDate(appointment.appointmentDate)}</span>
                      <strong
                        className={`pd-status pd-status--${getStatusClass(
                          appointment.status
                        )}`}
                      >
                        {appointment.status || "Scheduled"}
                      </strong>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="pd-empty-inline">
                <FiCalendar />
                <p>No appointment history found.</p>
              </div>
            )}
          </section>
        </div>

        <aside className="pd-right-column">
          <section className="pd-card">
            <div className="pd-card__header">
              <div>
                <span className="pd-section-label">Actions</span>
                <h2>Quick Access</h2>
              </div>
            </div>

            <div className="pd-action-list">
              <button type="button" onClick={() => navigate("/patient/finddoctors")}>
                <span>
                  <FiUserCheck />
                </span>
                <div>
                  <strong>Find Doctors</strong>
                  <small>Search verified doctors</small>
                </div>
                <FiArrowRight />
              </button>

              <button type="button" onClick={() => navigate("/patient/appointments")}>
                <span>
                  <FiCalendar />
                </span>
                <div>
                  <strong>Appointments</strong>
                  <small>Manage upcoming visits</small>
                </div>
                <FiArrowRight />
              </button>

              <button type="button" onClick={() => navigate("/patient/records")}>
                <span>
                  <FiFileText />
                </span>
                <div>
                  <strong>Medical Records</strong>
                  <small>View health documents</small>
                </div>
                <FiArrowRight />
              </button>

              <button type="button" onClick={() => navigate("/patient/profile")}>
                <span>
                  <FiUsers />
                </span>
                <div>
                  <strong>Family Profiles</strong>
                  <small>Manage care profiles</small>
                </div>
                <FiArrowRight />
              </button>
            </div>
          </section>

          <section className="pd-card">
            <div className="pd-card__header">
              <div>
                <span className="pd-section-label">Vault</span>
                <h2>Medical Vault</h2>
              </div>
            </div>

            <div className="pd-vault-grid">
              <button
                type="button"
                onClick={() => navigate("/patient/prescriptions")}
              >
                <FiFileText />
                <strong>{stats.activePrescriptions || 0}</strong>
                <span>Active Prescriptions</span>
              </button>

              <button type="button" onClick={() => navigate("/patient/lab-reports")}>
                <FiActivity />
                <strong>{stats.labReports || 0}</strong>
                <span>Lab Reports</span>
              </button>
            </div>
          </section>

          <section className="pd-card">
            <div className="pd-card__header">
              <div>
                <span className="pd-section-label">Safety</span>
                <h2>Emergency Contact</h2>
              </div>
            </div>

            <div className="pd-emergency-card">
              <div className="pd-emergency-card__icon">
                <FiAlertTriangle />
              </div>

              <div>
                <strong>
                  {healthSummary.emergencyContactName || "Not added"}
                </strong>
                <span>
                  {healthSummary.emergencyContactPhone ||
                    "Emergency phone number missing"}
                </span>
              </div>

              <button type="button" onClick={() => navigate("/patient/profile")}>
                Update Contact
              </button>
            </div>
          </section>

          <section className="pd-help-card">
            <div>
              <FiHelpCircle />
              <h2>Need help?</h2>
              <p>
                Appointment, profile ya records related issue ke liye support
                section open karo.
              </p>
            </div>

            <button type="button" onClick={() => navigate("/patient/help")}>
              Help & Support
            </button>
          </section>
        </aside>
      </section>
    </main>
  );
};

export default Dashboard;