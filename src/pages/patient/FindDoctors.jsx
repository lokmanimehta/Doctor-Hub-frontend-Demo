import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { useProfile } from "../../context/useProfile";
import defaultDoctorAvatar from "../../assets/images/avtar.png";
import "./FindDoctors.css";

const DOCTORS_PER_ROW = 10;
const DATE_WINDOW_DAYS = 7;

const FALLBACK_SPECIALTIES = [
  "All",
  "General Physician",
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "Gynecology",
  "ENT",
  "Dentistry",
  "Ophthalmology"
];

const clean = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

const getSafeDoctorImage = (url) => {
  if (!url || typeof url !== "string") {
    return defaultDoctorAvatar;
  }

  return url;
};

const getApiErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again."
) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

const isPatientUser = (user) => {
  const role = clean(user?.role).toUpperCase();

  return role === "PATIENT" || role === "ROLE_PATIENT";
};

const toLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDateChip = (date, offset) => {
  if (offset === 0) {
    return "Today";
  }

  if (offset === 1) {
    return "Tomorrow";
  }

  return date.toLocaleDateString("en-IN", {
    weekday: "short"
  });
};

const formatDisplayDate = (dateValue) => {
  if (!dateValue) {
    return "Selected date";
  }

  const date = new Date(`${dateValue}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
};

const normalizeProfileType = (value) => {
  const normalized = clean(value).toUpperCase();

  if (normalized === "SELF" || normalized === "PATIENT") {
    return "SELF";
  }

  if (
    normalized === "FAMILY" ||
    normalized === "FAMILY_MEMBER" ||
    normalized === "MEMBER"
  ) {
    return "FAMILY";
  }

  return "SELF";
};

const getPrimaryClinic = (clinics = []) => {
  if (!Array.isArray(clinics) || clinics.length === 0) {
    return null;
  }

  return clinics.find((clinic) => clinic?.isPrimary === true) || clinics[0];
};

const buildClinicLocation = (clinic) => {
  if (!clinic) {
    return "Location not updated";
  }

  const parts = [
    clinic.addressLine1,
    clinic.addressLine2,
    clinic.area,
    clinic.city,
    clinic.state,
    clinic.pincode
  ]
    .map(clean)
    .filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "Location not updated";
};

const normalizeDoctorCard = (doctor) => {
  return {
    id: doctor.doctorProfileId,
    userId: doctor.userId,
    name: doctor.fullName || "Doctor",
    specialty:
      doctor.primarySpecialization ||
      doctor.specializations?.[0] ||
      "General Physician",
    specializations: doctor.specializations || [],
    city: doctor.city || "Mumbai",
    location: doctor.area || doctor.city || "Location not updated",
    hospitalName: doctor.clinicName || "Clinic not updated",
    experience: doctor.experienceYears || 0,
    fee: doctor.consultationFee || 500,
    profileImage: getSafeDoctorImage(doctor.profilePictureUrl),
    bio: doctor.bio || "Verified healthcare professional.",
    avgRating: doctor.avgRating ?? 0,
    reviewCount: doctor.reviewCount ?? 0,
    bookingCount: doctor.bookingCount ?? 0
  };
};

const normalizeDoctorDetail = (doctor) => {
  const primaryClinic = getPrimaryClinic(doctor.clinics || []);

  return {
    id: doctor.doctorProfileId,
    userId: doctor.userId,
    name: doctor.fullName || "Doctor",
    bio: doctor.bio || "Verified healthcare professional.",
    experience: doctor.experienceYears || 0,
    consultationFee:
      primaryClinic?.consultationFee || doctor.consultationFee || 500,
    profileImage: getSafeDoctorImage(doctor.profilePictureUrl),
    specialty: doctor.specializations?.[0] || "General Physician",
    specializations: doctor.specializations || [],
    degrees: doctor.degrees || [],
    councilName: doctor.councilName,
    registrationNumber: doctor.registrationNumber,
    registrationYear: doctor.registrationYear,
    clinics: doctor.clinics || [],
    primaryClinic,
    city: primaryClinic?.city || "Mumbai",
    location: primaryClinic?.area || primaryClinic?.city || "Location not updated",
    hospitalName: primaryClinic?.clinicName || "Clinic not updated"
  };
};

const chunkDoctors = (items, size) => {
  const chunks = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
};

export default function FindDoctors() {
  const navigate = useNavigate();
  const location = useLocation();

  const { currentUser } = useContext(AuthContext);
  const { selectedProfile } = useProfile();

  const recommendedSpecialty = location.state?.recommendedSpecialty || "All";
  const symptomQuery = location.state?.symptomQuery || "";
  const triageTitle = location.state?.triageTitle || "";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeSpec, setActiveSpec] = useState(recommendedSpecialty);

  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState(FALLBACK_SPECIALTIES);
  const [doctorLoading, setDoctorLoading] = useState(true);
  const [doctorError, setDoctorError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [showBooking, setShowBooking] = useState(false);
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [bookingClinicId, setBookingClinicId] = useState("");
  const [bookingDateOffset, setBookingDateOffset] = useState(0);
  const [bookingSlots, setBookingSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingNotes, setBookingNotes] = useState("");
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [availabilityRefreshKey, setAvailabilityRefreshKey] = useState(0);

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingDoctorForBooking, setPendingDoctorForBooking] = useState(null);
  const [availableDateOptions, setAvailableDateOptions] = useState([]);
  const [dateLoading, setDateLoading] = useState(false);
  const [dateError, setDateError] = useState("");
  const [toast, setToast] = useState({
    message: "",
    type: ""
  });

  const modalOpen =
    Boolean(selectedDoctor) ||
    showBooking ||
    detailLoading ||
    Boolean(detailError) ||
    showLoginPrompt;

  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [modalOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  const showToast = useCallback((message, type = "error") => {
    setToast({
      message,
      type
    });

    setTimeout(() => {
      setToast({
        message: "",
        type: ""
      });
    }, 3000);
  }, []);

  const fetchSpecializations = useCallback(async () => {
    try {
      const response = await api.get("/public/specializations");

      const backendSpecialties = Array.isArray(response.data)
        ? response.data.map(clean).filter(Boolean)
        : [];

      const merged = Array.from(
        new Set([
          "All",
          ...backendSpecialties,
          ...FALLBACK_SPECIALTIES.filter((item) => item !== "All")
        ])
      );

      setSpecialties(merged);
    } catch {
      setSpecialties(FALLBACK_SPECIALTIES);
    }
  }, []);

  const fetchDoctors = useCallback(async () => {
    try {
      setDoctorLoading(true);
      setDoctorError("");

      const query = debouncedSearch.trim();

      const endpoint =
        query.length >= 2 ? "/public/doctors/search" : "/public/doctors";

      const response = await api.get(endpoint, {
        params: {
          q: query.length >= 2 ? query : undefined,
          page: 0,
          size: 40,
          _refresh: refreshKey
        }
      });

      const mappedDoctors = Array.isArray(response.data)
        ? response.data.map(normalizeDoctorCard)
        : [];

      setDoctors(mappedDoctors);
      setLastUpdatedAt(new Date());
    } catch (error) {
      setDoctors([]);
      setDoctorError(
        getApiErrorMessage(error, "Unable to load doctors right now.")
      );
    } finally {
      setDoctorLoading(false);
    }
  }, [debouncedSearch, refreshKey]);

  useEffect(() => {
    fetchSpecializations();
  }, [fetchSpecializations, refreshKey]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleRefreshDoctors = () => {
    setRefreshKey((previous) => previous + 1);
    showToast("Refreshing doctors list...", "success");
  };

  const dateOptions = useMemo(() => {
    return Array.from({ length: DATE_WINDOW_DAYS }, (_, offset) => {
      const date = new Date();
      date.setDate(date.getDate() + offset);

      return {
        offset,
        date,
        value: toLocalDateString(date),
        label: formatDateChip(date, offset),
        subLabel: date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short"
        })
      };
    });
  }, []);

  const bookingDate = useMemo(() => {
    const selected = dateOptions.find(
      (item) => item.offset === bookingDateOffset
    );

    return selected?.value || toLocalDateString(new Date());
  }, [bookingDateOffset, dateOptions]);

  useEffect(() => {
    const loadAvailableDates = async () => {
      if (!showBooking || !bookingDoctor || !bookingClinicId) {
        return;
      }

      try {
        setDateLoading(true);
        setDateError("");
        setAvailableDateOptions([]);

        const results = await Promise.all(
          dateOptions.map(async (item) => {
            try {
              const response = await api.get(
                `/public/doctors/${bookingDoctor.id}/clinics/${bookingClinicId}/availability`,
                {
                  params: {
                    date: item.value,
                    _refresh: availabilityRefreshKey
                  }
                }
              );

              const slots = Array.isArray(response.data?.slots)
                ? response.data.slots
                : [];

              const availableCount = slots.filter(
                (slot) => clean(slot.status).toUpperCase() === "AVAILABLE"
              ).length;

              return {
                ...item,
                availableCount,
                hasAvailableSlots: availableCount > 0
              };
            } catch {
              return {
                ...item,
                availableCount: 0,
                hasAvailableSlots: false
              };
            }
          })
        );

        const availableDates = results.filter((item) => item.hasAvailableSlots);

        setAvailableDateOptions(availableDates);

        setBookingDateOffset((currentOffset) => {
          if (availableDates.length === 0) {
            return 0;
          }

          const currentDateStillAvailable = availableDates.some(
            (item) => item.offset === currentOffset
          );

          return currentDateStillAvailable
            ? currentOffset
            : availableDates[0].offset;
        });
      } catch (error) {
        setAvailableDateOptions([]);
        setDateError(
          getApiErrorMessage(error, "Unable to load available appointment dates.")
        );
      } finally {
        setDateLoading(false);
      }
    };

    loadAvailableDates();
  }, [
    showBooking,
    bookingDoctor,
    bookingClinicId,
    dateOptions,
    availabilityRefreshKey
  ]);

  const selectedBookingClinic = useMemo(() => {
    if (!bookingDoctor?.clinics?.length || !bookingClinicId) {
      return null;
    }

    return bookingDoctor.clinics.find(
      (clinic) => String(clinic.id) === String(bookingClinicId)
    );
  }, [bookingDoctor, bookingClinicId]);

  const filteredDoctors = useMemo(() => {
    const normalizedSpec = activeSpec.toLowerCase();

    return doctors.filter((doctor) => {
      if (activeSpec === "All") {
        return true;
      }

      return (
        doctor.specialty?.toLowerCase() === normalizedSpec ||
        doctor.specializations?.some(
          (spec) => clean(spec).toLowerCase() === normalizedSpec
        )
      );
    });
  }, [doctors, activeSpec]);

  const doctorRows = useMemo(() => {
    return chunkDoctors(filteredDoctors, DOCTORS_PER_ROW);
  }, [filteredDoctors]);

  const loadDoctorDetail = async (doctorId) => {
    const response = await api.get(`/public/doctors/${doctorId}`);
    return normalizeDoctorDetail(response.data);
  };

  const openDoctorDetails = async (doctorId) => {
    try {
      setDetailLoading(true);
      setDetailError("");
      setSelectedDoctor(null);

      const doctorDetail = await loadDoctorDetail(doctorId);

      setSelectedDoctor(doctorDetail);
    } catch (error) {
      setDetailError(
        getApiErrorMessage(error, "Unable to load doctor details right now.")
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDoctorDetails = () => {
    setSelectedDoctor(null);
    setDetailError("");
  };

  const resetBookingState = () => {
    setBookingDoctor(null);
    setBookingClinicId("");
    setBookingDateOffset(0);
    setBookingSlots([]);
    setSelectedSlot(null);
    setBookingNotes("");
    setSlotError("");
    setBookingSuccess(null);
  };

  const closeBookingModal = () => {
    setShowBooking(false);
    resetBookingState();
  };

  const openBookingModal = async (doctor) => {
    if (!currentUser) {
      setPendingDoctorForBooking(doctor);
      setShowLoginPrompt(true);
      return;
    }

    if (!isPatientUser(currentUser)) {
      showToast("Only patient accounts can book appointments.");
      return;
    }

    if (!selectedProfile) {
      showToast("Please select patient profile first.");
      navigate("/patient/profile");
      return;
    }

    try {
      setDetailLoading(true);
      setDetailError("");

      const doctorDetail =
        doctor?.clinics?.length > 0 ? doctor : await loadDoctorDetail(doctor.id);

      const primaryClinic = getPrimaryClinic(doctorDetail.clinics);

      if (!primaryClinic) {
        showToast("This doctor has no active clinic available for booking.");
        return;
      }

      setSelectedDoctor(null);
      setBookingDoctor(doctorDetail);
      setBookingClinicId(String(primaryClinic.id));
      setBookingDateOffset(0);
      setSelectedSlot(null);
      setBookingNotes("");
      setBookingSuccess(null);
      setSlotError("");
      setShowBooking(true);
    } catch (error) {
      showToast(
        getApiErrorMessage(error, "Unable to load booking information.")
      );
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    const loadSlots = async () => {
      if (!showBooking || !bookingDoctor || !bookingClinicId || !bookingDate) {
        return;
      }
      if (dateLoading) {
        return;
      }

      if (availableDateOptions.length === 0) {
        setBookingSlots([]);
        setSelectedSlot(null);
        return;
      }

      const selectedDateIsAvailable = availableDateOptions.some(
        (item) => item.value === bookingDate
      );

      if (!selectedDateIsAvailable) {
        setBookingSlots([]);
        setSelectedSlot(null);
        return;
      }
      try {
        setSlotLoading(true);
        setSlotError("");

        const response = await api.get(
          `/public/doctors/${bookingDoctor.id}/clinics/${bookingClinicId}/availability`,
          {
            params: {
              date: bookingDate,
              _refresh: availabilityRefreshKey
            }
          }
        );

        const slots = Array.isArray(response.data?.slots)
          ? response.data.slots
          : [];

        setBookingSlots(slots);
        setSelectedSlot(null);
      } catch (error) {
        setBookingSlots([]);
        setSelectedSlot(null);
        setSlotError(
          getApiErrorMessage(error, "Unable to load slots for this clinic.")
        );
      } finally {
        setSlotLoading(false);
      }
    };

    loadSlots();
  }, [
    showBooking,
    bookingDoctor,
    bookingClinicId,
    bookingDate,
    availabilityRefreshKey,
    dateLoading,
    availableDateOptions
  ]);

  const resolveSelectedProfileType = () => {
    const rawType =
      selectedProfile?.type ||
      selectedProfile?.profileType ||
      selectedProfile?.relation ||
      selectedProfile?.profileRelation;

    return normalizeProfileType(rawType);
  };

  const resolveSelectedProfileId = () => {
    const profileType = resolveSelectedProfileType();

    if (profileType === "SELF") {
      return (
        currentUser?.id ||
        currentUser?.userId ||
        selectedProfile?.userId ||
        selectedProfile?.patientUserId ||
        selectedProfile?.id ||
        selectedProfile?.patientProfileId
      );
    }

    return (
      selectedProfile?.id ||
      selectedProfile?.patientProfileId ||
      selectedProfile?.familyMemberId ||
      selectedProfile?.memberId
    );
  };

  const getSelectedProfileName = () => {
    return (
      selectedProfile?.fullName ||
      selectedProfile?.name ||
      selectedProfile?.patientName ||
      currentUser?.fullName ||
      currentUser?.name ||
      "Selected Patient"
    );
  };

  const confirmBooking = async () => {
    if (!currentUser) {
      setShowLoginPrompt(true);
      return;
    }

    if (!isPatientUser(currentUser)) {
      showToast("Only patient accounts can book appointments.");
      return;
    }

    if (!selectedProfile) {
      showToast("Please select patient profile first.");
      navigate("/patient/profile");
      return;
    }

    if (!bookingDoctor) {
      showToast("Please select doctor first.");
      return;
    }

    if (!bookingClinicId) {
      showToast("Please select clinic first.");
      return;
    }

    if (!selectedSlot) {
      showToast("Please select an available slot first.");
      return;
    }

    if (clean(selectedSlot.status).toUpperCase() !== "AVAILABLE") {
      showToast("This slot is not available. Please select another slot.");
      return;
    }

    const patientProfileId = resolveSelectedProfileId();
    const patientProfileType = resolveSelectedProfileType();

    if (!patientProfileId) {
      showToast("Selected patient profile is invalid. Please select profile again.");
      navigate("/patient/profile");
      return;
    }

    try {
      setBookingLoading(true);

      const response = await api.post("/patient/public-appointments", {
        doctorProfileId: bookingDoctor.id,
        clinicId: Number(bookingClinicId),
        patientProfileId,
        patientProfileType,
        appointmentDate: bookingDate,
        slotStartTime: selectedSlot.startTime,
        slotEndTime: selectedSlot.endTime,
        notes: clean(bookingNotes) || "Booked from Find Doctors page"
      });

      setBookingSuccess({
        appointmentId: response.data?.appointmentId,
        message:
          response.data?.message ||
          "Appointment request sent successfully. Doctor will confirm your appointment soon."
      });

      setAvailabilityRefreshKey((previous) => previous + 1);
      setRefreshKey((previous) => previous + 1);
      setSelectedSlot(null);

      showToast(
        response.data?.message ||
        "Appointment request sent successfully. Doctor will confirm your appointment soon.",
        "success"
      );
    } catch (error) {
      showToast(getApiErrorMessage(error, "Booking failed. Please try again."));
      setAvailabilityRefreshKey((previous) => previous + 1);
    } finally {
      setBookingLoading(false);
    }
  };

  const getSlotClassName = (slot) => {
    const status = clean(slot.status).toUpperCase();

    if (selectedSlot?.startTime === slot.startTime && status === "AVAILABLE") {
      return "fd-slot-card active";
    }

    if (status === "BOOKED") {
      return "fd-slot-card booked";
    }

    if (status === "BLOCKED") {
      return "fd-slot-card blocked";
    }

    if (status === "PAST") {
      return "fd-slot-card past";
    }

    return "fd-slot-card";
  };

  const isSlotDisabled = (slot) => {
    return clean(slot.status).toUpperCase() !== "AVAILABLE";
  };

  const lastUpdatedLabel = lastUpdatedAt
    ? lastUpdatedAt.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit"
    })
    : "Not refreshed yet";

  return (
    <div className="find-doctors-shell">
      {toast.message && (
        <div className={`fd-toast ${toast.type === "success" ? "success" : "error"}`}>
          {toast.message}
        </div>
      )}

      {showLoginPrompt && (
        <div className="fd-modal-overlay" onClick={() => setShowLoginPrompt(false)}>
          <div className="fd-small-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="fd-modal-close"
              onClick={() => setShowLoginPrompt(false)}
            >
              ×
            </button>

            <div className="fd-modal-icon">Login</div>

            <h2>Login required</h2>

            <p>
              Please login as a patient to book an appointment. You can view doctor
              details without booking.
            </p>

            {pendingDoctorForBooking && (
              <div className="fd-selected-doctor-mini">
                <span>Selected doctor</span>
                <strong>{pendingDoctorForBooking.name}</strong>
              </div>
            )}

            <div className="fd-modal-button-row">
              <button
                type="button"
                className="fd-btn-primary"
                onClick={() => {
                  setShowLoginPrompt(false);
                  navigate("/login");
                }}
              >
                Go to Login
              </button>

              <button
                type="button"
                className="fd-btn-secondary"
                onClick={() => {
                  setShowLoginPrompt(false);
                  setPendingDoctorForBooking(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {detailLoading && (
        <div className="fd-modal-overlay">
          <div className="fd-small-modal">
            <div className="fd-spinner"></div>
            <h2>Loading doctor profile</h2>
            <p>Please wait while we fetch the latest profile details.</p>
          </div>
        </div>
      )}

      {detailError && (
        <div className="fd-modal-overlay" onClick={() => setDetailError("")}>
          <div className="fd-small-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="fd-modal-close"
              onClick={() => setDetailError("")}
            >
              ×
            </button>

            <h2>Unable to load profile</h2>
            <p>{detailError}</p>
          </div>
        </div>
      )}

      <section className="fd-top-panel">
        <div className="fd-top-copy">
          <span className="fd-page-kicker">Find Doctors</span>

          <h1>Choose a verified doctor and book a real-time slot.</h1>

          <p>
            Search by doctor, specialty, clinic, city, or area. Compare clinics,
            view profile details, and book confirmed appointments.
          </p>
        </div>

        <div className="fd-top-stats">
          <div className="fd-stat-card">
            <span>Doctors</span>
            <strong>{filteredDoctors.length}</strong>
          </div>

          <div className="fd-stat-card subtle">
            <span>Last refresh</span>
            <strong>{lastUpdatedLabel}</strong>
          </div>
        </div>
      </section>

      {recommendedSpecialty !== "All" && (
        <section className="fd-recommendation-strip">
          <div>
            <h3>{triageTitle || "Recommended doctors"}</h3>
            <p>
              Based on your symptoms, we are showing{" "}
              <strong>{recommendedSpecialty}</strong> doctors.
            </p>
          </div>

          {symptomQuery && <span>Symptoms: {symptomQuery}</span>}
        </section>
      )}

      <section className="fd-filter-panel">
        <div className="fd-search-control">
          <span>Search</span>

          <input
            type="text"
            placeholder="Search name, specialty, clinic, area, city..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="fd-specialty-strip">
          {specialties.map((specialty) => (
            <button
              type="button"
              key={specialty}
              className={`fd-specialty-pill ${activeSpec === specialty ? "active" : ""
                }`}
              onClick={() => setActiveSpec(specialty)}
            >
              {specialty}
            </button>
          ))}
        </div>
      </section>

      <section className="fd-list-panel">
        <div className="fd-list-header">
          <div>
            <h2>Available doctors</h2>
            <p>One row shows up to 10 doctors. Scroll horizontally to view more.</p>
          </div>

          <button
            type="button"
            className="fd-refresh-button"
            onClick={handleRefreshDoctors}
            disabled={doctorLoading}
          >
            {doctorLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {doctorLoading && (
          <div className="fd-empty-state">
            <div className="fd-spinner"></div>
            <p>Loading verified doctors...</p>
          </div>
        )}

        {!doctorLoading && doctorError && (
          <div className="fd-empty-state error">
            <h3>Unable to load doctors</h3>
            <p>{doctorError}</p>

            <button
              type="button"
              className="fd-btn-primary small"
              onClick={handleRefreshDoctors}
            >
              Try again
            </button>
          </div>
        )}

        {!doctorLoading && !doctorError && doctorRows.length === 0 && (
          <div className="fd-empty-state">
            <h3>No doctors found</h3>
            <p>Try changing the search keyword or specialty filter.</p>

            <button
              type="button"
              className="fd-btn-secondary small"
              onClick={() => {
                setSearch("");
                setDebouncedSearch("");
                setActiveSpec("All");
                setRefreshKey((previous) => previous + 1);
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        {!doctorLoading && !doctorError && doctorRows.length > 0 && (
          <div className="fd-doctor-row-stack">
            {doctorRows.map((row, rowIndex) => (
              <div className="fd-doctor-scroll-row" key={`doctor-row-${rowIndex}`}>
                {row.map((doctor) => (
                  <article
                    key={doctor.id}
                    className="fd-doctor-card"
                    onClick={() => openDoctorDetails(doctor.id)}
                  >
                    <div className="fd-doctor-image-box">
                      <img
                        src={doctor.profileImage}
                        alt={doctor.name}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = defaultDoctorAvatar;
                        }}
                      />

                      <span className="fd-badge verified">Verified</span>

                      <span className="fd-badge rating">
                        ★ {doctor.avgRating > 0 ? doctor.avgRating.toFixed(1) : "4.9"}
                      </span>
                    </div>

                    <div className="fd-doctor-card-body">
                      <h3>{doctor.name}</h3>

                      <p className="fd-specialty-text">{doctor.specialty}</p>

                      <div className="fd-card-meta">
                        <span>{doctor.hospitalName}</span>
                        <span>{doctor.location || doctor.city}</span>
                        <span>{doctor.experience}+ years experience</span>
                      </div>

                      <div className="fd-fee-row">
                        <span>Consultation</span>
                        <strong>₹{doctor.fee}</strong>
                      </div>

                      <div className="fd-card-actions">
                        <button
                          type="button"
                          className="fd-card-button secondary"
                          onClick={(event) => {
                            event.stopPropagation();
                            openDoctorDetails(doctor.id);
                          }}
                        >
                          View Details
                        </button>

                        <button
                          type="button"
                          className="fd-card-button primary"
                          onClick={(event) => {
                            event.stopPropagation();
                            openBookingModal(doctor);
                          }}
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedDoctor && (
        <div className="fd-modal-overlay" onClick={closeDoctorDetails}>
          <div className="fd-profile-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="fd-modal-close"
              onClick={closeDoctorDetails}
            >
              ×
            </button>

            <div className="fd-profile-header">
              <img
                src={selectedDoctor.profileImage}
                alt={selectedDoctor.name}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = defaultDoctorAvatar;
                }}
              />

              <div>
                <span className="fd-profile-badge">Verified doctor</span>
                <h2>{selectedDoctor.name}</h2>
                <p>{selectedDoctor.specialty}</p>
                <small>
                  ★ 4.9 rating • {selectedDoctor.experience}+ years experience
                </small>
              </div>
            </div>

            <div className="fd-profile-body">
              <div className="fd-info-grid">
                <div>
                  <span>Consultation Fee</span>
                  <strong>₹{selectedDoctor.consultationFee}</strong>
                </div>

                <div>
                  <span>Primary Clinic</span>
                  <strong>{selectedDoctor.hospitalName}</strong>
                </div>

                <div>
                  <span>Location</span>
                  <strong>
                    {selectedDoctor.location}, {selectedDoctor.city}
                  </strong>
                </div>

                <div>
                  <span>Education</span>
                  <strong>
                    {selectedDoctor.degrees?.length > 0
                      ? selectedDoctor.degrees.join(", ")
                      : "Not updated"}
                  </strong>
                </div>

                <div>
                  <span>Council</span>
                  <strong>{selectedDoctor.councilName || "Not updated"}</strong>
                </div>

                <div>
                  <span>Registration</span>
                  <strong>
                    {selectedDoctor.registrationNumber || "Not updated"}
                    {selectedDoctor.registrationYear
                      ? ` (${selectedDoctor.registrationYear})`
                      : ""}
                  </strong>
                </div>
              </div>

              <div className="fd-profile-section">
                <h4>Specializations</h4>

                <div className="fd-tag-list">
                  {(selectedDoctor.specializations?.length > 0
                    ? selectedDoctor.specializations
                    : [selectedDoctor.specialty]
                  ).map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>

              <div className="fd-profile-section">
                <h4>Clinics / Hospitals</h4>

                <div className="fd-clinic-list">
                  {selectedDoctor.clinics?.map((clinic) => (
                    <div className="fd-clinic-card" key={clinic.id}>
                      <div>
                        <strong>
                          {clinic.isPrimary ? "Primary • " : ""}
                          {clinic.clinicName}
                        </strong>

                        <p>{buildClinicLocation(clinic)}</p>
                      </div>

                      <span>
                        ₹{clinic.consultationFee || selectedDoctor.consultationFee}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="fd-profile-section">
                <h4>About Doctor</h4>
                <p>{selectedDoctor.bio}</p>
              </div>
            </div>

            <div className="fd-modal-footer">
              <button
                type="button"
                className="fd-btn-primary"
                onClick={() => openBookingModal(selectedDoctor)}
              >
                Book Appointment
              </button>

              <button
                type="button"
                className="fd-btn-secondary"
                onClick={() => {
                  const doctorForState = selectedDoctor;
                  setSelectedDoctor(null);

                  navigate(`/patient/doctorsprofile/${doctorForState.id}`, {
                    state: doctorForState
                  });
                }}
              >
                View Full Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {showBooking && bookingDoctor && (
        <div className="fd-modal-overlay" onClick={closeBookingModal}>
          <div className="fd-booking-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="fd-modal-close"
              onClick={closeBookingModal}
            >
              ×
            </button>

            {bookingSuccess ? (
              <div className="fd-success-view">
                <div className="fd-success-mark">✓</div>

                <h2>Appointment request sent</h2>

                <p>
                  {bookingSuccess.message ||
                    "Your appointment request has been sent to the doctor. You will see confirmation after the doctor accepts it."}
                </p>

                {bookingSuccess.appointmentId && (
                  <div className="fd-success-reference">
                    Appointment ID <strong>DH-APT-{bookingSuccess.appointmentId}</strong>
                  </div>
                )}

                <div className="fd-modal-button-row">
                  <button
                    type="button"
                    className="fd-btn-primary"
                    onClick={() => navigate("/patient/appointments")}
                  >
                    Go to My Appointments
                  </button>

                  <button
                    type="button"
                    className="fd-btn-secondary"
                    onClick={closeBookingModal}
                  >
                    Continue Searching
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="fd-booking-header">
                  <img
                    src={bookingDoctor.profileImage}
                    alt={bookingDoctor.name}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = defaultDoctorAvatar;
                    }}
                  />

                  <div>
                    <span>Book appointment</span>
                    <h2>{bookingDoctor.name}</h2>
                    <p>{bookingDoctor.specialty}</p>
                  </div>
                </div>

                <div className="fd-booking-body">
                  <div className="fd-form-section">
                    <label>Patient profile</label>

                    {selectedProfile ? (
                      <div className="fd-patient-box">
                        <strong>{getSelectedProfileName()}</strong>

                        <span>
                          {resolveSelectedProfileType()} profile
                          {selectedProfile.gender ? ` • ${selectedProfile.gender}` : ""}
                          {selectedProfile.age ? ` • ${selectedProfile.age} yrs` : ""}
                        </span>
                      </div>
                    ) : (
                      <div className="fd-patient-box warning">
                        <strong>No patient profile selected</strong>
                        <span>Please select profile before booking.</span>
                      </div>
                    )}
                  </div>

                  <div className="fd-form-section">
                    <label>Select clinic</label>

                    <select
                      value={bookingClinicId}
                      onChange={(event) => {
                        setBookingClinicId(event.target.value);
                        setSelectedSlot(null);
                        setBookingSuccess(null);
                      }}
                    >
                      {bookingDoctor.clinics?.map((clinic) => (
                        <option key={clinic.id} value={clinic.id}>
                          {clinic.clinicName} — {clinic.city}
                          {clinic.consultationFee
                            ? ` — ₹${clinic.consultationFee}`
                            : ""}
                        </option>
                      ))}
                    </select>

                    {selectedBookingClinic && (
                      <p className="fd-address-note">
                        {buildClinicLocation(selectedBookingClinic)}
                      </p>
                    )}
                  </div>

                  <div className="fd-form-section">
                    <label>Select date</label>

                    <div className="fd-date-row">
                      {dateLoading && (
                        <div className="fd-date-state">
                          Checking available appointment dates...
                        </div>
                      )}

                      {!dateLoading && dateError && (
                        <div className="fd-date-state error">
                          {dateError}
                        </div>
                      )}

                      {!dateLoading && !dateError && availableDateOptions.length === 0 && (
                        <div className="fd-date-state">
                          No appointment dates available for this doctor right now.
                        </div>
                      )}

                      {!dateLoading && !dateError && availableDateOptions.length > 0 && (
                        <div className="fd-date-grid">
                          {availableDateOptions.map((item) => (
                            <button
                              type="button"
                              key={item.value}
                              className={`fd-date-card ${bookingDateOffset === item.offset ? "active" : ""
                                }`}
                              onClick={() => {
                                setBookingDateOffset(item.offset);
                                setSelectedSlot(null);
                              }}
                            >
                              <strong>{item.label}</strong>
                              <span>{item.subLabel}</span>
                              <small>{item.availableCount} slots</small>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="fd-form-section">
                    <div className="fd-slot-heading">
                      <label>Available slots</label>
                      <span>{formatDisplayDate(bookingDate)}</span>
                    </div>

                    {slotLoading && (
                      <div className="fd-slot-state">
                        <div className="fd-spinner small"></div>
                        Loading slots...
                      </div>
                    )}

                    {!slotLoading && slotError && (
                      <div className="fd-slot-state error">{slotError}</div>
                    )}

                    {!slotLoading && !slotError && bookingSlots.length === 0 && (
                      <div className="fd-slot-state">
                        No slots configured for this date.
                      </div>
                    )}

                    {!slotLoading && !slotError && bookingSlots.length > 0 && (
                      <div className="fd-slot-grid">
                        {bookingSlots.map((slot) => (
                          <button
                            type="button"
                            key={`${slot.startTime}-${slot.endTime}`}
                            className={getSlotClassName(slot)}
                            disabled={isSlotDisabled(slot)}
                            onClick={() => setSelectedSlot(slot)}
                          >
                            <strong>{clean(slot.displayTime).toUpperCase()}</strong>
                            <span>{clean(slot.status).toUpperCase()}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="fd-form-section">
                    <label>Notes for doctor</label>

                    <textarea
                      rows="3"
                      placeholder="Optional: symptoms, reason for visit, or short note..."
                      value={bookingNotes}
                      onChange={(event) => setBookingNotes(event.target.value)}
                    />
                  </div>
                </div>

                <div className="fd-modal-footer">
                  <button
                    type="button"
                    className="fd-btn-primary"
                    onClick={confirmBooking}
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? "Booking..." : "Confirm Appointment"}
                  </button>

                  <button
                    type="button"
                    className="fd-btn-secondary"
                    onClick={closeBookingModal}
                    disabled={bookingLoading}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}