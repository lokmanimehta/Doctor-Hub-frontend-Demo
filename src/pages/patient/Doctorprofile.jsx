import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import {
  recordDoctorProfileView
} from "../../services/patientService";
import { AuthContext } from "../../context/AuthContext";
import { useProfile } from "../../context/useProfile";
import "./Doctorprofile.css";


export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { currentUser } = useContext(AuthContext);
  const { selectedProfile } = useProfile();

  const [doctor, setDoctor] = useState(location.state || null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [selectedClinicId, setSelectedClinicId] = useState(null);
  const [selectedDateOffset, setSelectedDateOffset] = useState(0);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingMessageType, setBookingMessageType] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const selectedDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + selectedDateOffset);
    return date;
  }, [selectedDateOffset]);

  const selectedDateString = useMemo(() => {
    return selectedDate.toISOString().split("T")[0];
  }, [selectedDate]);

  const selectedClinic = useMemo(() => {
    if (!doctor?.clinics?.length) return null;
    return doctor.clinics.find((clinic) => clinic.id === selectedClinicId) || doctor.clinics[0];
  }, [doctor, selectedClinicId]);

  const primarySpecialization = doctor?.specializations?.[0] || doctor?.specialty || "General Physician";
  const degreeText = doctor?.degrees?.length ? doctor.degrees.join(", ") : "Not updated";

  const showMessage = (message, type = "error") => {
    setBookingMessage(message);
    setBookingMessageType(type);

    setTimeout(() => {
      setBookingMessage("");
      setBookingMessageType("");
    }, 3000);
  };

  const mapDoctorDetail = (data) => {
    const primaryClinic =
      data.clinics?.find((clinic) => clinic.isPrimary) ||
      data.clinics?.[0] ||
      null;

    return {
      id: data.doctorProfileId,
      userId: data.userId,
      name: data.fullName,
      bio: data.bio,
      experience: data.experienceYears || 0,
      consultationFee: data.consultationFee,
      profileImage:
        data.profilePictureUrl ||
        "https://ui-avatars.com/api/?name=Doctor&background=10b981&color=fff",
      specializations: data.specializations || [],
      specialty: data.specializations?.[0] || "General Physician",
      degrees: data.degrees || [],
      councilName: data.councilName,
      registrationNumber: data.registrationNumber,
      registrationYear: data.registrationYear,
      clinics: data.clinics || [],
      city: primaryClinic?.city || "Mumbai",
      hospitalName: primaryClinic?.clinicName || "Clinic not updated",
      fees: primaryClinic?.consultationFee || data.consultationFee || 500
    };
  };

  useEffect(() => {
    const fetchDoctorDetail = async () => {
      try {
        setLoading(true);
        setPageError("");

        const response = await api.get(`/public/doctors/${id}`);
        const mapped = mapDoctorDetail(response.data);

        setDoctor(mapped);

        const primaryClinic =
          mapped.clinics?.find((clinic) => clinic.isPrimary) ||
          mapped.clinics?.[0];

        setSelectedClinicId(primaryClinic?.id || null);
      } catch (error) {
        console.error("Doctor profile load failed:", error);
        setPageError(error.message || "Unable to load doctor profile");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorDetail();
  }, [id]);

  useEffect(() => {
  if (
    !doctor?.id ||
    currentUser?.role !== "PATIENT"
  ) {
    return undefined;
  }

  const viewerKey =
    currentUser?.id ||
    currentUser?.userId ||
    currentUser?.email ||
    "patient";

  const dateKey =
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());

  const storageKey =
    `doctor-profile-view:${viewerKey}:${doctor.id}:${dateKey}`;

  try {
    if (
      window.sessionStorage.getItem(
        storageKey
      ) === "done"
    ) {
      return undefined;
    }

    window.sessionStorage.setItem(
      storageKey,
      "pending"
    );
  } catch {
    /*
     * Browser storage unavailable hone par
     * backend DB deduplication handle karega.
     */
  }

  let cancelled = false;

  recordDoctorProfileView(doctor.id)
    .then(() => {
      if (cancelled) return;

      try {
        window.sessionStorage.setItem(
          storageKey,
          "done"
        );
      } catch {
        /*
         * Storage failure profile page ko
         * affect nahi karega.
         */
      }
    })
    .catch((error) => {
      console.warn(
        "Profile view tracking failed:",
        error
      );

      try {
        window.sessionStorage.removeItem(
          storageKey
        );
      } catch {
        /*
         * Backend/profile page ko storage
         * failure se affect nahi karna.
         */
      }
    });

  return () => {
    cancelled = true;
  };
}, [
  doctor?.id,
  currentUser?.role,
  currentUser?.id,
  currentUser?.userId,
  currentUser?.email
]);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!doctor?.id || !selectedClinicId || !selectedDateString) {
        setAvailableSlots([]);
        return;
      }

      try {
        setSlotsLoading(true);
        setSlotsError("");
        setSelectedSlot(null);

        const response = await api.get(
          `/public/doctors/${doctor.id}/clinics/${selectedClinicId}/availability`,
          {
            params: {
              date: selectedDateString
            }
          }
        );

        setAvailableSlots(response.data?.slots || []);
      } catch (error) {
        console.error("Availability load failed:", error);
        setSlotsError(error.message || "Unable to load slots");
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchAvailability();
  }, [doctor?.id, selectedClinicId, selectedDateString]);

  const handleBookAppointment = async () => {
    if (!currentUser) {
      setShowLoginPrompt(true);
      return;
    }

    if (currentUser.role !== "PATIENT") {
      showMessage("Only patients can book appointments.", "error");
      return;
    }

    if (!selectedProfile) {
      showMessage("Please select a patient profile first.", "error");
      return;
    }

    if (!selectedClinic) {
      showMessage("Please select a clinic.", "error");
      return;
    }

    if (!selectedSlot) {
      showMessage("Please select an available time slot.", "error");
      return;
    }

    try {
      setBookingLoading(true);

      await api.post("/patient/public-appointments", {
        doctorProfileId: doctor.id,
        clinicId: selectedClinic.id,
        patientProfileId: selectedProfile.id,
        patientProfileType: selectedProfile.type || "SELF",
        appointmentDate: selectedDateString,
        slotStartTime: selectedSlot.startTime,
        slotEndTime: selectedSlot.endTime,
        notes: "Booked from public doctor profile page"
      });

      showMessage("Appointment booked successfully.", "success");

      setAvailableSlots((prev) =>
        prev.map((slot) =>
          slot.startTime === selectedSlot.startTime
            ? { ...slot, status: "BOOKED" }
            : slot
        )
      );

      setSelectedSlot(null);
    } catch (error) {
      console.error("Booking failed:", error);
      showMessage(error.message || "Unable to book appointment.", "error");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="doctor-profile-page">
        <div className="profile-state-card">
          <div className="state-spinner"></div>
          <h2>Loading doctor profile...</h2>
          <p>Please wait while we fetch latest doctor information.</p>
        </div>
      </div>
    );
  }

  if (pageError || !doctor) {
    return (
      <div className="doctor-profile-page">
        <div className="profile-state-card">
          <h2>Profile not available</h2>
          <p>{pageError || "Doctor profile could not be loaded."}</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-profile-page">
      {showLoginPrompt && (
        <div className="profile-login-overlay" onClick={() => setShowLoginPrompt(false)}>
          <div className="profile-login-card" onClick={(e) => e.stopPropagation()}>
            <button className="profile-login-close" onClick={() => setShowLoginPrompt(false)}>
              ×
            </button>

            <div className="profile-login-icon">🔐</div>
            <h2>Login Required</h2>
            <p>Please login first to book an appointment with this doctor.</p>

            <div className="profile-login-actions">
              <button
                className="profile-primary-action"
                onClick={() => {
                  setShowLoginPrompt(false);
                  navigate("/login");
                }}
              >
                Go to Login
              </button>

              <button
                className="profile-secondary-action"
                onClick={() => setShowLoginPrompt(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="doctor-profile-hero">
        <button className="profile-back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="doctor-hero-card">
          <div className="doctor-avatar-wrap">
            <img src={doctor.profileImage} alt={doctor.name} />
            <span className="verified-badge">Verified</span>
          </div>

          <div className="doctor-hero-info">
            <p className="eyebrow">Doctor Profile</p>
            <h1>{doctor.name}</h1>
            <p className="doctor-degree">{degreeText}</p>

            <div className="hero-chip-row">
              <span>{primarySpecialization}</span>
              <span>{doctor.experience || 0}+ years experience</span>
              <span>₹{selectedClinic?.consultationFee || doctor.fees || 500}</span>
            </div>

            <p className="doctor-bio">
              {doctor.bio || `Verified expert in ${primarySpecialization}.`}
            </p>
          </div>
        </div>
      </section>

      <main className="doctor-profile-layout">
        <section className="profile-main-column">
          <div className="profile-panel">
            <h2>About Doctor</h2>
            <p>{doctor.bio || `Verified expert in ${primarySpecialization}.`}</p>
          </div>

          <div className="profile-panel">
            <h2>Qualifications & Registration</h2>

            <div className="info-grid">
              <div className="info-box">
                <span>Education</span>
                <strong>{degreeText}</strong>
              </div>

              <div className="info-box">
                <span>Specializations</span>
                <strong>
                  {doctor.specializations?.length
                    ? doctor.specializations.join(", ")
                    : primarySpecialization}
                </strong>
              </div>

              <div className="info-box">
                <span>Medical Council</span>
                <strong>{doctor.councilName || "Not updated"}</strong>
              </div>

              <div className="info-box">
                <span>Registration</span>
                <strong>
                  {doctor.registrationNumber || "Not updated"}
                  {doctor.registrationYear ? ` (${doctor.registrationYear})` : ""}
                </strong>
              </div>
            </div>
          </div>

          <div className="profile-panel">
            <h2>Clinics & Consultation</h2>

            <div className="clinic-list">
              {doctor.clinics?.length ? (
                doctor.clinics.map((clinic) => (
                  <button
                    key={clinic.id}
                    className={`clinic-select-card ${
                      selectedClinicId === clinic.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedClinicId(clinic.id)}
                  >
                    <div>
                      <strong>
                        {clinic.isPrimary ? "⭐ " : ""}
                        {clinic.clinicName}
                      </strong>
                      <p>
                        {clinic.addressLine1}
                        {clinic.landmark ? `, ${clinic.landmark}` : ""}
                      </p>
                      <p>
                        {clinic.city}
                        {clinic.state ? `, ${clinic.state}` : ""}
                        {clinic.pincode ? ` - ${clinic.pincode}` : ""}
                      </p>
                    </div>

                    <span>₹{clinic.consultationFee || doctor.fees || 500}</span>
                  </button>
                ))
              ) : (
                <p className="empty-text">Clinic details not updated.</p>
              )}
            </div>
          </div>
        </section>

        <aside className="booking-panel">
          <div className="booking-card">
            <h2>Book Appointment</h2>
            <p className="booking-subtitle">
              Select clinic, date and available backend slot.
            </p>

            {bookingMessage && (
              <div className={`booking-message ${bookingMessageType}`}>
                {bookingMessage}
              </div>
            )}

            <div className="booking-selected-doctor">
              <img src={doctor.profileImage} alt={doctor.name} />
              <div>
                <strong>{doctor.name}</strong>
                <span>{selectedClinic?.clinicName || "Clinic not selected"}</span>
              </div>
            </div>

            <div className="booking-block">
              <label>Select Date</label>

              <div className="profile-date-list">
                {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                  const date = new Date();
                  date.setDate(date.getDate() + offset);

                  return (
                    <button
                      key={offset}
                      className={`profile-date-chip ${
                        selectedDateOffset === offset ? "active" : ""
                      }`}
                      onClick={() => setSelectedDateOffset(offset)}
                    >
                      <span>{offset === 0 ? "Today" : date.toLocaleDateString("en-IN", { weekday: "short" })}</span>
                      <strong>{date.getDate()}</strong>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="booking-block">
              <label>Available Slots</label>

              {slotsLoading ? (
                <div className="slot-state">Loading slots...</div>
              ) : slotsError ? (
                <div className="slot-state error">{slotsError}</div>
              ) : availableSlots.length === 0 ? (
                <div className="slot-state">No slots available for this date.</div>
              ) : (
                <div className="profile-slot-list">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.startTime}
                      className={`profile-slot ${
                        selectedSlot?.startTime === slot.startTime ? "active" : ""
                      } ${slot.status === "BOOKED" ? "booked" : ""}`}
                      disabled={slot.status === "BOOKED"}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot.displayTime}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="booking-block">
              <label>Patient</label>

              {selectedProfile ? (
                <div className="selected-patient-card">
                  <h4>{selectedProfile.fullName}</h4>
                  <p>
                    {selectedProfile.relation || "Self"} • {selectedProfile.type || "SELF"} •{" "}
                    {selectedProfile.gender || "Not specified"}
                  </p>
                </div>
              ) : (
                <div className="selected-patient-card warning">
                  <p>No patient profile selected.</p>
                </div>
              )}
            </div>

            <button
              className="profile-book-btn"
              disabled={bookingLoading}
              onClick={handleBookAppointment}
            >
              {bookingLoading
                ? "Booking..."
                : `Confirm Appointment • ₹${selectedClinic?.consultationFee || doctor.fees || 500}`}
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}