import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import { useNavigate } from "react-router-dom";
import {
  createHospitalAppointment,
  getHospitalById,
  getHospitalDepartments,
  getHospitals,
  getHospitalSlots,
  getPatientHospitalAppointments,
  getPatientProfile,
  searchHospitals
} from "../../services/patientService";
import { useProfile } from "../../context/useProfile";
import "./Hospitals.css";

const DATE_WINDOW_DAYS = 14;

const BED_TYPES = [
  "General Ward",
  "Private Room",
  "ICU",
  "Emergency",
  "Day Care"
];

const FALLBACK_HOSPITAL_IMAGE =
  "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=1200";

const clean = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
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
    weekday: "short",
    day: "2-digit",
    month: "short"
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

const formatTime = (timeValue) => {
  if (!timeValue) {
    return "--";
  }

  const parts = String(timeValue).split(":");
  const hour = Number(parts[0]);
  const minute = Number(parts[1] || 0);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return timeValue;
  }

  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
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

const getHospitalImages = (hospital) => {
  const imageUrls = Array.isArray(hospital?.imageUrls)
    ? hospital.imageUrls.filter(Boolean)
    : [];

  if (imageUrls.length > 0) {
    return imageUrls;
  }

  if (hospital?.imageUrl) {
    return [hospital.imageUrl];
  }

  return [FALLBACK_HOSPITAL_IMAGE];
};

const normalizeHospital = (hospital) => {
  const images = getHospitalImages(hospital);

  return {
    id: hospital.id,
    hospitalName: hospital.hospitalName || "Hospital",
    city: hospital.city || "City not updated",
    area: hospital.area || "",
    address: hospital.address || "Address not updated",
    imageUrl: images[0],
    imageUrls: images,
    rating: hospital.rating ?? 0,
    totalBeds: hospital.totalBeds ?? 0,
    availableBeds: hospital.availableBeds ?? 0,
    emergencyAvailable: hospital.emergencyAvailable === true,
    departments: Array.isArray(hospital.departments)
      ? hospital.departments.filter(Boolean)
      : []
  };
};

const buildDateOptions = () => {
  return Array.from({ length: DATE_WINDOW_DAYS }, (_, offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);

    return {
      value: toLocalDateString(date),
      label: formatDateChip(date, offset),
      helper: date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short"
      })
    };
  });
};

const extractSelfPatientProfile = (data) => {
  const patient = data?.patient || data || {};

  const id =
    patient.patientProfileId ??
    patient.profileId ??
    patient.id ??
    data?.patientProfileId ??
    data?.profileId;

  if (!id) {
    return null;
  }

  return {
    id,
    type: "SELF",
    fullName:
      patient.fullName ||
      patient.name ||
      data?.fullName ||
      data?.name ||
      "Selected Patient",
    relation: "Self",
    gender: patient.gender || data?.gender || "Not updated"
  };
};

const normalizeSelectedProfile = (profile, selfProfileId) => {
  if (!profile) {
    return null;
  }

  const profileType = normalizeProfileType(
    profile.type ||
      profile.profileType ||
      profile.profileRelation ||
      profile.relation
  );

  const id =
    profileType === "SELF" && selfProfileId
      ? selfProfileId
      : profile.patientProfileId ??
        profile.profileId ??
        profile.familyMemberId ??
        profile.memberId ??
        profile.id;

  if (!id) {
    return null;
  }

  return {
    id,
    type: profileType,
    fullName:
      profile.fullName ||
      profile.name ||
      profile.patientName ||
      "Selected Patient",
    relation: profile.relation || (profileType === "SELF" ? "Self" : "Family"),
    gender: profile.gender || "Not updated"
  };
};

export default function Hospitals() {
  const navigate = useNavigate();
  const { selectedProfile } = useProfile();

  const dateOptions = useMemo(() => buildDateOptions(), []);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("");

  const [hospitals, setHospitals] = useState([]);
  const [hospitalLoading, setHospitalLoading] = useState(true);
  const [hospitalError, setHospitalError] = useState("");

  const [selectedHospital, setSelectedHospital] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");

  const [bedType, setBedType] = useState("ICU");
  const [selectedDate, setSelectedDate] = useState(dateOptions[1]?.value || "");
  const [slots, setSlots] = useState([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [selfPatientProfile, setSelfPatientProfile] = useState(null);
  const [reason, setReason] = useState("Need admission consultation");
  const [patientNote, setPatientNote] = useState("");

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  const [hospitalRequests, setHospitalRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [previewImage, setPreviewImage] = useState("");

  const [toast, setToast] = useState({
    message: "",
    type: ""
  });

  const selectedBookingProfile = useMemo(() => {
    const normalizedFromContext = normalizeSelectedProfile(
      selectedProfile,
      selfPatientProfile?.id
    );

    return normalizedFromContext || selfPatientProfile;
  }, [selectedProfile, selfPatientProfile]);

  const cityOptions = useMemo(() => {
    return Array.from(
      new Set(
        hospitals
          .map((hospital) => clean(hospital.city))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [hospitals]);

  const departmentOptions = useMemo(() => {
    return Array.from(
      new Set(
        hospitals
          .flatMap((hospital) => hospital.departments || [])
          .map(clean)
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [hospitals]);

  const totalAvailableBeds = useMemo(() => {
    return hospitals.reduce(
      (sum, hospital) => sum + Number(hospital.availableBeds || 0),
      0
    );
  }, [hospitals]);

  const modalImages = useMemo(() => {
    return getHospitalImages(selectedHospital);
  }, [selectedHospital]);

  const modalOpenState =
    modalOpen || Boolean(previewImage) || Boolean(bookingSuccess);

  useEffect(() => {
    if (modalOpenState) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [modalOpenState]);

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
    }, 3200);
  }, []);

  const loadProfileMeta = useCallback(async () => {
    try {
      const data = await getPatientProfile();
      const normalizedSelfProfile = extractSelfPatientProfile(data);

      if (normalizedSelfProfile) {
        setSelfPatientProfile(normalizedSelfProfile);
      }
    } catch {
      setSelfPatientProfile(null);
    }
  }, []);

  const loadHospitals = useCallback(async () => {
    try {
      setHospitalLoading(true);
      setHospitalError("");

      const shouldSearch =
        debouncedSearch.length >= 2 ||
        cityFilter ||
        departmentFilter ||
        bedFilter;

      const data = shouldSearch
        ? await searchHospitals({
            q: debouncedSearch.length >= 2 ? debouncedSearch : "",
            city: cityFilter,
            department: departmentFilter,
            bedType: bedFilter
          })
        : await getHospitals();

      const normalized = Array.isArray(data)
        ? data.map(normalizeHospital)
        : [];

      setHospitals(normalized);
    } catch (error) {
      setHospitalError(
        getApiErrorMessage(error, "Unable to load hospitals right now.")
      );
      setHospitals([]);
    } finally {
      setHospitalLoading(false);
    }
  }, [bedFilter, cityFilter, debouncedSearch, departmentFilter]);

  const loadHospitalRequests = useCallback(async () => {
    try {
      setRequestsLoading(true);

      const data = await getPatientHospitalAppointments();
      setHospitalRequests(Array.isArray(data) ? data : []);
    } catch {
      setHospitalRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  const loadSlots = useCallback(async () => {
    if (
      !modalOpen ||
      !selectedHospital?.id ||
      !selectedDepartmentId ||
      !selectedDate
    ) {
      setSlots([]);
      return;
    }

    try {
      setSlotLoading(true);
      setSlotError("");
      setSelectedSlot(null);

      const data = await getHospitalSlots({
        hospitalId: selectedHospital.id,
        departmentId: selectedDepartmentId,
        date: selectedDate,
        bedType
      });

      setSlots(Array.isArray(data) ? data : []);
    } catch (error) {
      setSlotError(
        getApiErrorMessage(error, "Unable to load hospital slots.")
      );
      setSlots([]);
    } finally {
      setSlotLoading(false);
    }
  }, [
    bedType,
    modalOpen,
    selectedDate,
    selectedDepartmentId,
    selectedHospital
  ]);

  useEffect(() => {
    loadProfileMeta();
  }, [loadProfileMeta, selectedProfile]);

  useEffect(() => {
    loadHospitals();
  }, [loadHospitals]);

  useEffect(() => {
    loadHospitalRequests();
  }, [loadHospitalRequests]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const handleRefresh = () => {
    loadHospitals();
    loadHospitalRequests();
    showToast("Refreshing hospital data...", "success");
  };

  const handleReset = () => {
    setSearch("");
    setDebouncedSearch("");
    setCityFilter("");
    setDepartmentFilter("");
    setBedFilter("");
  };

  const handleOpenHospital = async (hospital) => {
    try {
      setModalOpen(true);
      setSelectedHospital(hospital);
      setDetailLoading(true);
      setDetailError("");
      setBookingSuccess(null);
      setCurrentImageIndex(0);
      setPreviewImage("");
      setSelectedSlot(null);
      setReason("Need admission consultation");
      setPatientNote("");
      setSelectedDate(dateOptions[1]?.value || dateOptions[0]?.value || "");
      setBedType(bedFilter || "ICU");

      const [detailData, departmentData] = await Promise.all([
        getHospitalById(hospital.id),
        getHospitalDepartments(hospital.id)
      ]);

      const normalizedDetail = normalizeHospital(detailData);
      const normalizedDepartments = Array.isArray(departmentData)
        ? departmentData
        : [];

      setSelectedHospital(normalizedDetail);
      setDepartments(normalizedDepartments);

      if (normalizedDepartments.length > 0) {
        setSelectedDepartmentId(String(normalizedDepartments[0].id));
      } else {
        setSelectedDepartmentId("");
      }
    } catch (error) {
      setDetailError(
        getApiErrorMessage(error, "Unable to load hospital details.")
      );
      setDepartments([]);
      setSelectedDepartmentId("");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseModal = () => {
    if (bookingLoading) {
      return;
    }

    setModalOpen(false);
    setSelectedHospital(null);
    setDepartments([]);
    setSelectedDepartmentId("");
    setSlots([]);
    setSelectedSlot(null);
    setDetailError("");
    setBookingSuccess(null);
    setPreviewImage("");
    setCurrentImageIndex(0);
  };

  const handleNextImage = () => {
    if (modalImages.length <= 1) {
      return;
    }

    setCurrentImageIndex((current) =>
      current === modalImages.length - 1 ? 0 : current + 1
    );
  };

  const handlePreviousImage = () => {
    if (modalImages.length <= 1) {
      return;
    }

    setCurrentImageIndex((current) =>
      current === 0 ? modalImages.length - 1 : current - 1
    );
  };

  const handlePreviewNext = (event) => {
    event.stopPropagation();

    if (!previewImage || modalImages.length <= 1) {
      return;
    }

    const currentIndex = modalImages.indexOf(previewImage);
    const nextIndex =
      currentIndex === modalImages.length - 1 ? 0 : currentIndex + 1;

    setPreviewImage(modalImages[nextIndex]);
  };

  const handlePreviewPrevious = (event) => {
    event.stopPropagation();

    if (!previewImage || modalImages.length <= 1) {
      return;
    }

    const currentIndex = modalImages.indexOf(previewImage);
    const previousIndex =
      currentIndex <= 0 ? modalImages.length - 1 : currentIndex - 1;

    setPreviewImage(modalImages[previousIndex]);
  };

  const handleBookHospital = async (event) => {
    event.preventDefault();

    if (!selectedHospital) {
      showToast("Please select a hospital first.");
      return;
    }

    if (!selectedBookingProfile) {
      showToast("Please select patient profile first.");
      navigate("/patient/profile");
      return;
    }

    if (!selectedDepartmentId) {
      showToast("Please select a department.");
      return;
    }

    if (!selectedSlot) {
      showToast("Please select an available slot.");
      return;
    }

    if (selectedSlot.status !== "AVAILABLE") {
      showToast("Selected slot is not available.");
      return;
    }

    try {
      setBookingLoading(true);
      setBookingSuccess(null);

      const payload = {
        hospitalId: selectedHospital.id,
        departmentId: Number(selectedDepartmentId),
        patientProfileId: Number(selectedBookingProfile.id),
        patientProfileType: selectedBookingProfile.type,
        bedType,
        appointmentDate: selectedDate,
        slotStartTime: selectedSlot.startTime,
        slotEndTime: selectedSlot.endTime,
        reason: clean(reason) || "Need admission consultation",
        patientNote: clean(patientNote)
      };

      const response = await createHospitalAppointment(payload);

      setBookingSuccess(response);
      await loadHospitalRequests();
      await loadHospitals();

      showToast("Hospital request sent successfully.", "success");
    } catch (error) {
      showToast(
        getApiErrorMessage(error, "Unable to send hospital request.")
      );
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="hp-page">
      {toast.message && (
        <div className={`hp-toast ${toast.type === "success" ? "success" : "error"}`}>
          {toast.message}
        </div>
      )}

      <section className="hp-hero">
        <div className="hp-hero-copy">
          <span className="hp-kicker">Hospital care</span>
          <h1>Find hospitals and send admission requests with confidence</h1>
          <p>
            Search verified hospitals, check departments, choose a bed type and
            send a request. The hospital team will confirm your request soon.
          </p>
        </div>

        <div className="hp-hero-stats">
          <div className="hp-stat-card primary">
            <span>Hospitals</span>
            <strong>{hospitals.length}</strong>
          </div>

          <div className="hp-stat-card">
            <span>Available beds</span>
            <strong>{totalAvailableBeds}</strong>
          </div>

          <div className="hp-stat-card">
            <span>Your requests</span>
            <strong>{hospitalRequests.length}</strong>
          </div>
        </div>
      </section>

      <section className="hp-filter-panel">
        <div className="hp-search-box">
          <span>Search</span>

          <input
            type="text"
            value={search}
            placeholder="Search hospital, city, area or department"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="hp-filter-grid">
          <select
            value={cityFilter}
            onChange={(event) => setCityFilter(event.target.value)}
          >
            <option value="">All cities</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          <select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
          >
            <option value="">All departments</option>
            {departmentOptions.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>

          <select
            value={bedFilter}
            onChange={(event) => setBedFilter(event.target.value)}
          >
            <option value="">Any bed type</option>
            {BED_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <button type="button" className="hp-filter-reset" onClick={handleReset}>
            Reset
          </button>
        </div>
      </section>

      <section className="hp-list-section">
        <div className="hp-section-head">
          <div>
            <h2>Available hospitals</h2>
            <p>
              {hospitalLoading
                ? "Loading hospitals..."
                : `${hospitals.length} hospital${hospitals.length === 1 ? "" : "s"} found`}
            </p>
          </div>

          <button
            type="button"
            className="hp-refresh-btn"
            onClick={handleRefresh}
            disabled={hospitalLoading}
          >
            Refresh
          </button>
        </div>

        {hospitalError && (
          <div className="hp-state-card error">
            <h3>Unable to load hospitals</h3>
            <p>{hospitalError}</p>
            <button type="button" onClick={handleRefresh}>
              Try again
            </button>
          </div>
        )}

        {hospitalLoading && (
          <div className="hp-card-grid">
            {[1, 2, 3].map((item) => (
              <div key={item} className="hp-skeleton-card">
                <div />
                <span />
                <span />
                <span />
              </div>
            ))}
          </div>
        )}

        {!hospitalLoading && !hospitalError && hospitals.length === 0 && (
          <div className="hp-state-card">
            <h3>No hospitals found</h3>
            <p>Try changing the search text or filters.</p>
            <button type="button" onClick={handleReset}>
              Clear filters
            </button>
          </div>
        )}

        {!hospitalLoading && !hospitalError && hospitals.length > 0 && (
          <div className="hp-card-grid">
            {hospitals.map((hospital) => (
              <article key={hospital.id} className="hp-hospital-card">
                <div className="hp-card-image">
                  <img
                    src={hospital.imageUrl || FALLBACK_HOSPITAL_IMAGE}
                    alt={hospital.hospitalName}
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_HOSPITAL_IMAGE;
                    }}
                  />

                  <span className="hp-rating-badge">
                    {Number(hospital.rating || 0).toFixed(1)} rating
                  </span>
                </div>

                <div className="hp-card-body">
                  <div className="hp-card-title-row">
                    <div>
                      <h3>{hospital.hospitalName}</h3>
                      <p>
                        {hospital.area
                          ? `${hospital.area}, ${hospital.city}`
                          : hospital.city}
                      </p>
                    </div>

                    {hospital.emergencyAvailable && (
                      <span className="hp-emergency-pill">Emergency</span>
                    )}
                  </div>

                  <p className="hp-address-text">{hospital.address}</p>

                  <div className="hp-card-metrics">
                    <div>
                      <span>Available beds</span>
                      <strong>{hospital.availableBeds}</strong>
                    </div>

                    <div>
                      <span>Total beds</span>
                      <strong>{hospital.totalBeds}</strong>
                    </div>
                  </div>

                  {hospital.departments.length > 0 && (
                    <div className="hp-dept-strip">
                      {hospital.departments.slice(0, 4).map((department) => (
                        <span key={department}>{department}</span>
                      ))}

                      {hospital.departments.length > 4 && (
                        <span>+{hospital.departments.length - 4} more</span>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    className="hp-primary-btn"
                    onClick={() => handleOpenHospital(hospital)}
                  >
                    View details & request
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="hp-requests-panel">
        <div className="hp-section-head compact">
          <div>
            <h2>My hospital requests</h2>
            <p>Track your recent hospital booking requests.</p>
          </div>

          <button
            type="button"
            className="hp-refresh-btn"
            onClick={loadHospitalRequests}
            disabled={requestsLoading}
          >
            Refresh
          </button>
        </div>

        {requestsLoading && <p className="hp-muted-line">Loading requests...</p>}

        {!requestsLoading && hospitalRequests.length === 0 && (
          <div className="hp-empty-requests">
            No hospital request found yet.
          </div>
        )}

        {!requestsLoading && hospitalRequests.length > 0 && (
          <div className="hp-request-list">
            {hospitalRequests.slice(0, 5).map((request) => (
              <div key={request.appointmentId} className="hp-request-item">
                <div>
                  <h3>{request.hospitalName}</h3>
                  <p>
                    {request.departmentName} • {request.bedType} •{" "}
                    {formatDisplayDate(request.appointmentDate)}
                  </p>
                  <span>
                    {formatTime(request.slotStartTime)} -{" "}
                    {formatTime(request.slotEndTime)}
                  </span>
                </div>

                <strong className={`hp-status ${String(request.status).toLowerCase()}`}>
                  {request.status}
                </strong>
              </div>
            ))}
          </div>
        )}
      </section>

      {modalOpen && selectedHospital && (
        <div className="hp-modal-overlay" onMouseDown={handleCloseModal}>
          <div className="hp-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="hp-modal-close"
              onClick={handleCloseModal}
              disabled={bookingLoading}
              aria-label="Close hospital details"
            >
              ×
            </button>

            {detailLoading && (
              <div className="hp-modal-loader">
                Loading hospital details...
              </div>
            )}

            {!detailLoading && detailError && (
              <div className="hp-state-card error inside-modal">
                <h3>Unable to load details</h3>
                <p>{detailError}</p>
                <button type="button" onClick={handleCloseModal}>
                  Close
                </button>
              </div>
            )}

            {!detailLoading && !detailError && (
              <div className="hp-modal-grid">
                <div className="hp-modal-info">
                  <div className="hp-image-frame">
                    <img
                      src={modalImages[currentImageIndex] || FALLBACK_HOSPITAL_IMAGE}
                      alt={selectedHospital.hospitalName}
                      onClick={() =>
                        setPreviewImage(
                          modalImages[currentImageIndex] || FALLBACK_HOSPITAL_IMAGE
                        )
                      }
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_HOSPITAL_IMAGE;
                      }}
                    />

                    {modalImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          className="hp-image-arrow left"
                          onClick={handlePreviousImage}
                        >
                          ‹
                        </button>

                        <button
                          type="button"
                          className="hp-image-arrow right"
                          onClick={handleNextImage}
                        >
                          ›
                        </button>
                      </>
                    )}
                  </div>

                  {modalImages.length > 1 && (
                    <div className="hp-thumbnail-row">
                      {modalImages.map((image, index) => (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          className={index === currentImageIndex ? "active" : ""}
                          onClick={() => setCurrentImageIndex(index)}
                        >
                          <img
                            src={image}
                            alt={`${selectedHospital.hospitalName} ${index + 1}`}
                            onError={(event) => {
                              event.currentTarget.src = FALLBACK_HOSPITAL_IMAGE;
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="hp-modal-title">
                    <div>
                      <span className="hp-kicker">Hospital details</span>
                      <h2>{selectedHospital.hospitalName}</h2>
                      <p>
                        {selectedHospital.area
                          ? `${selectedHospital.area}, ${selectedHospital.city}`
                          : selectedHospital.city}
                      </p>
                    </div>

                    <span className="hp-rating-large">
                      {Number(selectedHospital.rating || 0).toFixed(1)}
                    </span>
                  </div>

                  <div className="hp-info-block">
                    <h3>Address</h3>
                    <p>{selectedHospital.address}</p>
                  </div>

                  <div className="hp-info-block">
                    <h3>Departments</h3>
                    {departments.length > 0 ? (
                      <div className="hp-modal-dept-grid">
                        {departments.map((department) => (
                          <span key={department.id}>
                            {department.departmentName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p>No departments available.</p>
                    )}
                  </div>

                  <div className="hp-facility-grid">
                    <div>
                      <span>Available beds</span>
                      <strong>{selectedHospital.availableBeds}</strong>
                    </div>

                    <div>
                      <span>Total beds</span>
                      <strong>{selectedHospital.totalBeds}</strong>
                    </div>

                    <div>
                      <span>Emergency</span>
                      <strong>
                        {selectedHospital.emergencyAvailable ? "Yes" : "No"}
                      </strong>
                    </div>
                  </div>
                </div>

                <aside className="hp-booking-panel">
                  {!bookingSuccess ? (
                    <>
                      <div className="hp-booking-head">
                        <span>Admission request</span>
                        <h3>Send hospital request</h3>
                        <p>
                          This is a request only. The hospital team will confirm
                          availability after reviewing your details.
                        </p>
                      </div>

                      <form onSubmit={handleBookHospital}>
                        <div className="hp-form-group">
                          <label>Selected patient profile</label>

                          {selectedBookingProfile ? (
                            <div className="hp-selected-profile-card">
                              <div>
                                <strong>{selectedBookingProfile.fullName}</strong>
                                <span>
                                  {selectedBookingProfile.relation} •{" "}
                                  {selectedBookingProfile.type}
                                  {selectedBookingProfile.gender
                                    ? ` • ${selectedBookingProfile.gender}`
                                    : ""}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => navigate("/patient/profile")}
                              >
                                Change
                              </button>
                            </div>
                          ) : (
                            <div className="hp-selected-profile-card warning">
                              <div>
                                <strong>No patient profile selected</strong>
                                <span>Please select profile before booking.</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => navigate("/patient/profile")}
                              >
                                Select
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="hp-form-group">
                          <label>Department</label>
                          <select
                            value={selectedDepartmentId}
                            onChange={(event) =>
                              setSelectedDepartmentId(event.target.value)
                            }
                            disabled={departments.length === 0}
                          >
                            <option value="">Select department</option>
                            {departments.map((department) => (
                              <option key={department.id} value={department.id}>
                                {department.departmentName}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="hp-form-group">
                          <label>Bed type</label>
                          <select
                            value={bedType}
                            onChange={(event) => setBedType(event.target.value)}
                          >
                            {BED_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="hp-form-group">
                          <label>Date</label>
                          <div className="hp-date-row">
                            {dateOptions.slice(0, 7).map((date) => (
                              <button
                                key={date.value}
                                type="button"
                                className={
                                  selectedDate === date.value ? "active" : ""
                                }
                                onClick={() => setSelectedDate(date.value)}
                              >
                                <strong>{date.label}</strong>
                                <span>{date.helper}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="hp-form-group">
                          <div className="hp-slot-head">
                            <label>Available slots</label>
                            <button
                              type="button"
                              onClick={loadSlots}
                              disabled={slotLoading}
                            >
                              Refresh slots
                            </button>
                          </div>

                          {slotLoading && (
                            <div className="hp-slot-state">
                              Loading slots...
                            </div>
                          )}

                          {!slotLoading && slotError && (
                            <div className="hp-slot-state error">
                              {slotError}
                            </div>
                          )}

                          {!slotLoading && !slotError && slots.length === 0 && (
                            <div className="hp-slot-state">
                              Select department and date to view slots.
                            </div>
                          )}

                          {!slotLoading && !slotError && slots.length > 0 && (
                            <div className="hp-slot-grid">
                              {slots.map((slot) => {
                                const key = `${slot.startTime}-${slot.endTime}`;
                                const isAvailable = slot.status === "AVAILABLE";
                                const isSelected =
                                  selectedSlot?.startTime === slot.startTime &&
                                  selectedSlot?.endTime === slot.endTime;

                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    className={`${isSelected ? "active" : ""} ${
                                      !isAvailable ? "disabled" : ""
                                    }`}
                                    disabled={!isAvailable}
                                    onClick={() => setSelectedSlot(slot)}
                                  >
                                    <strong>
                                      {formatTime(slot.startTime)} -{" "}
                                      {formatTime(slot.endTime)}
                                    </strong>
                                    <span>{slot.status}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="hp-form-group">
                          <label>Reason</label>
                          <input
                            type="text"
                            value={reason}
                            placeholder="Example: Need admission consultation"
                            onChange={(event) => setReason(event.target.value)}
                          />
                        </div>

                        <div className="hp-form-group">
                          <label>Notes for hospital</label>
                          <textarea
                            rows="4"
                            value={patientNote}
                            placeholder="Mention symptoms, urgency, or any special requirement"
                            onChange={(event) => setPatientNote(event.target.value)}
                          />
                        </div>

                        <button
                          type="submit"
                          className="hp-submit-btn"
                          disabled={bookingLoading}
                        >
                          {bookingLoading
                            ? "Sending request..."
                            : "Send hospital request"}
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="hp-success-box">
                      <span>Request sent</span>
                      <h3>Hospital request sent successfully</h3>
                      <p>
                        {bookingSuccess.message ||
                          "Hospital team will confirm your request soon."}
                      </p>

                      <div className="hp-success-summary">
                        <div>
                          <span>Hospital</span>
                          <strong>{bookingSuccess.hospitalName}</strong>
                        </div>

                        <div>
                          <span>Department</span>
                          <strong>{bookingSuccess.departmentName}</strong>
                        </div>

                        <div>
                          <span>Bed type</span>
                          <strong>{bookingSuccess.bedType}</strong>
                        </div>

                        <div>
                          <span>Status</span>
                          <strong>{bookingSuccess.status}</strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="hp-submit-btn"
                        onClick={handleCloseModal}
                      >
                        Done
                      </button>
                    </div>
                  )}
                </aside>
              </div>
            )}
          </div>
        </div>
      )}

      {previewImage && (
        <div className="hp-preview-overlay" onClick={() => setPreviewImage("")}>
          <button
            type="button"
            className="hp-preview-close"
            onClick={() => setPreviewImage("")}
          >
            ×
          </button>

          {modalImages.length > 1 && (
            <button
              type="button"
              className="hp-preview-arrow left"
              onClick={handlePreviewPrevious}
            >
              ‹
            </button>
          )}

          <img
            src={previewImage}
            alt="Hospital preview"
            onClick={(event) => event.stopPropagation()}
            onError={(event) => {
              event.currentTarget.src = FALLBACK_HOSPITAL_IMAGE;
            }}
          />

          {modalImages.length > 1 && (
            <button
              type="button"
              className="hp-preview-arrow right"
              onClick={handlePreviewNext}
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  );
}