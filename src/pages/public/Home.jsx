import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import heroImg from "../../assets/images/doctor1.png";
import "./Home.css";
import Logo from "../../assets/images/logo.jpeg";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useAuthActions } from "../../services/authService";
import { useProfile } from "../../context/useProfile";
import defaultDoctorAvatar from "../../assets/images/avtar.png";

const formatDateForApi = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const formatDateLabel = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
};

const getDoctorLocation = (doctor) => {
  return (
    [doctor?.area, doctor?.city].filter(Boolean).join(", ") ||
    doctor?.location ||
    "Location not updated"
  );
};

const getDoctorRating = (doctor) => {
  if (doctor?.avgRating === null || doctor?.avgRating === undefined) {
    return "New";
  }

  return Number(doctor.avgRating).toFixed(1);
};

const HomePage = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActivePath = (path) => {
    if (path === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(path);
  };
  const [searchText, setSearchText] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [patientSub, setPatientSub] = useState(false);
  const { currentUser, setCurrentUser } = useContext(AuthContext);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDoctorDetail, setSelectedDoctorDetail] = useState(null);
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const [showDoctorProfileModal, setShowDoctorProfileModal] =
    useState(false);
  const [showDoctorBookingModal, setShowDoctorBookingModal] =
    useState(false);

  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [selectedCost, setSelectedCost] = useState(null);
  const [selectedShowcase, setSelectedShowcase] = useState(null);
  const { logoutUser } = useAuthActions(setCurrentUser);

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingDoctorForBooking, setPendingDoctorForBooking] =
    useState(null);

  const [publicDoctors, setPublicDoctors] = useState([]);
  const [doctorLoading, setDoctorLoading] = useState(true);
  const [doctorError, setDoctorError] = useState("");
  const [doctorDetailLoading, setDoctorDetailLoading] = useState(false);
  const [doctorDetailError, setDoctorDetailError] = useState("");

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");

  const { clearProfile, selectedProfile } = useProfile();

  const [publicHospitals, setPublicHospitals] = useState([]);
  const [publicLabs, setPublicLabs] = useState([]);

  // --- Auth State Logic ---
  const getSafeDoctorImage = (url) => {
    if (!url || typeof url !== "string") return defaultDoctorAvatar;

    if (url.includes("localhost:8080")) {
      return defaultDoctorAvatar;
    }

    return url;
  };

  const handleLogout = async () => {
    clearProfile();
    setDropdownOpen(false);
    await logoutUser();
  };

  // --- Hospital Ad Slider Logic ---
  const [adIndex, setAdIndex] = useState(0);

  const ads = [
    {
      badge: "24/7 Emergency",
      title: "Advanced Multi-Specialty Hospital",
      desc: "Get flat 15% OFF on Health Checkups. Equipped with ICU & Robotic Surgery.",
      btnText: "Visit Hospital",
    },
    {
      badge: "Special Offer",
      title: "Premium Dental Care Center",
      desc: "Free consultation for first-time visitors. Smile brighter with our experts.",
      btnText: "Book Dental Hub",
    },
    {
      badge: "Health First",
      title: "Full Body Checkup @ ₹999",
      desc: "Including Diabetes, Thyroid & Cardiac profile. Home sample collection available.",
      btnText: "Grab Offer",
    },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        setSearchLoading(true);
        setSearchError("");
        setDoctorError("");

        const query = debouncedSearchText.trim();

        const doctorEndpoint =
          query.length >= 2
            ? `/public/doctors/search?q=${encodeURIComponent(query)}`
            : "/public/doctors";

        const [doctorRes, hospitalRes, labRes] = await Promise.all([
          api.get(doctorEndpoint),
          api.get("/public/hospitals"),
          api.get("/public/labs"),
        ]);

        const mappedDoctors = (doctorRes.data || []).map((doctor) => ({
          ...doctor,

          id: doctor.doctorProfileId,
          userId: doctor.userId,
          name: doctor.fullName,
          specialty:
            doctor.primarySpecialization || "General Physician",
          specializations: doctor.specializations || [],
          city: doctor.city || "Mumbai",
          location: doctor.area || doctor.city || "Mumbai",
          hospitalName: doctor.clinicName || "Clinic not updated",
          experience: doctor.experienceYears || 0,
          fees: doctor.consultationFee || 500,
          profileImage: getSafeDoctorImage(doctor.profilePictureUrl),
          bio: doctor.bio || "Verified healthcare professional.",
          tags: doctor.specializations || [],
          conditions: [],

          searchKeywords: [
            doctor.fullName,
            doctor.primarySpecialization,
            doctor.city,
            doctor.area,
            doctor.clinicName,
            ...(doctor.specializations || []),
          ].filter(Boolean),

          languages: [],
        }));

        setPublicDoctors(mappedDoctors);

        setPublicHospitals(
          Array.isArray(hospitalRes.data) ? hospitalRes.data : []
        );

        setPublicLabs(
          Array.isArray(labRes.data) ? labRes.data : []
        );
      } catch (error) {
        console.error("Failed to search:", error);

        setSearchError("Unable to search right now.");
        setPublicDoctors([]);
        setPublicHospitals([]);
        setPublicLabs([]);
      } finally {
        setSearchLoading(false);
        setDoctorLoading(false);
      }
    };

    fetchSearchResults();
  }, [debouncedSearchText]);

  useEffect(() => {
    const timer = setInterval(() => {
      setAdIndex((prev) => (prev + 1) % ads.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [ads.length]);

  const [specialties, setSpecialties] = useState([]);

  const getSpecialtyIcon = (name) => {
    const normalized = name.toLowerCase();

    if (normalized.includes("cardio")) return "❤️";
    if (normalized.includes("neuro")) return "🧠";
    if (normalized.includes("pedia")) return "👶";
    if (normalized.includes("derma")) return "✨";
    if (normalized.includes("ortho")) return "🦴";
    if (normalized.includes("dental")) return "🦷";

    if (
      normalized.includes("eye") ||
      normalized.includes("ophthal")
    ) {
      return "👁️";
    }

    if (normalized.includes("ent")) return "👂";

    return "🩺";
  };

  useEffect(() => {
    const fetchSpecializations = async () => {
      try {
        const response = await api.get("/public/specializations");

        const mainSpecializations = [
          "General Physician",
          "Cardiology",
          "Dermatology",
          "Neurology",
          "Pediatrics",
          "Orthopedics",
          "Gynecology",
          "ENT",
          "Dentistry",
          "Ophthalmology",
        ];

        const mapped = response.data
          .filter((name) => mainSpecializations.includes(name))
          .map((name) => ({
            name,
            icon: getSpecialtyIcon(name),
          }));

        setSpecialties(mapped);
      } catch (error) {
        console.error(
          "Failed to fetch specializations:",
          error
        );

        setSpecialties([]);
      }
    };

    fetchSpecializations();
  }, []);

  const costPackages = useMemo(
    () => [
      {
        title: "Maternity Care",
        desc: "Luxury delivery suites & neonatal care.",
        price: "45,000",
        image:
          "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=800&q=80",
        badge: "Trending",
        emi: "₹3,750/mo",
        features: ["Private Room", "Nursing", "Medicines"],
      },
      {
        title: "Knee Surgery",
        desc: "Robotic assisted with fast recovery.",
        price: "1,20,000",
        image:
          "https://images.pexels.com/photos/4226119/pexels-photo-4226119.jpeg?auto=compress&cs=tinysrgb&w=800",
        badge: "New",
        emi: "₹10,000/mo",
        features: ["Implants", "Physio", "Post-Op Care"],
      },
      {
        title: "Heart Checkup",
        desc: "Full cardiac screening & consultation.",
        price: "4,999",
        image:
          "https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=800",
        badge: "Essential",
        emi: "₹499/mo",
        features: ["ECG/Echo", "Blood Tests", "Expert Opinion"],
      },
      {
        title: "Transplant Care",
        desc: "Advanced organ transplant center.",
        price: "4,50,000",
        image:
          "https://images.pexels.com/photos/247786/pexels-photo-247786.jpeg?auto=compress&cs=tinysrgb&w=800",
        badge: "Specialist",
        emi: "₹37,500/mo",
        features: ["Pre-Op Tests", "ICU Support", "NABH Center"],
      },
    ],
    []
  );

  const trendingSearches = [
    "Fever",
    "Knee Pain",
    "Skin Allergy",
    "Diabetes",
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const filteredDoctors = publicDoctors;

  const handleSearchSubmit = () => {
    const query = searchText.trim();

    if (query.length < 2) {
      setShowSearchResults(false);
      return;
    }

    setDebouncedSearchText(query);
    setShowSearchResults(true);
  };

  // =========================================================
  // DOCTOR DETAILS + BOOKING FLOW
  // =========================================================

  const primaryClinic =
    selectedDoctorDetail?.clinics?.find(
      (clinic) => clinic.isPrimary || clinic.primary
    ) ||
    selectedDoctorDetail?.clinics?.[0] ||
    selectedDoctorDetail?.doctorClinics?.[0] ||
    null;

  const profileDoctor =
    selectedDoctorDetail || selectedDoctor;

  const detailClinics =
    selectedDoctorDetail?.clinics ||
    selectedDoctorDetail?.doctorClinics ||
    [];

  const clinicOptions =
    selectedDoctorDetail?.clinics ||
    selectedDoctorDetail?.doctorClinics ||
    [];

  const selectedBookingClinic =
    clinicOptions.find(
      (clinic) =>
        String(clinic.id) === String(selectedClinicId)
    ) || primaryClinic;

  const openDoctorProfile = async (doctor) => {
    const doctorId =
      doctor?.doctorProfileId || doctor?.id;

    if (!doctorId) return;

    setSelectedDoctor(doctor);
    setShowDoctorProfileModal(true);
    setShowDoctorBookingModal(false);
    setSelectedDoctorDetail(null);
    setSelectedClinicId("");
    setDoctorDetailLoading(true);
    setDoctorDetailError("");
    setBookingMessage("");

    try {
      const response = await api.get(
        `/public/doctors/${doctorId}`
      );

      setSelectedDoctorDetail(response.data);

      const clinics =
        response.data?.clinics ||
        response.data?.doctorClinics ||
        [];

      const defaultClinic =
        clinics.find(
          (clinic) =>
            clinic.isPrimary || clinic.primary
        ) || clinics[0];

      setSelectedClinicId(
        defaultClinic?.id
          ? String(defaultClinic.id)
          : ""
      );
    } catch (error) {
      console.error(
        "Failed to fetch doctor detail",
        error
      );

      setSelectedDoctorDetail(null);

      setDoctorDetailError(
        "Unable to load doctor details right now."
      );
    } finally {
      setDoctorDetailLoading(false);
    }
  };

  const openDoctorBooking = async (doctor) => {
    if (!currentUser) {
      setPendingDoctorForBooking(doctor);
      setShowLoginPrompt(true);
      return;
    }

    const doctorId =
      doctor?.doctorProfileId || doctor?.id;

    if (!doctorId) return;

    setSelectedDoctor(doctor);
    setShowDoctorProfileModal(false);
    setShowDoctorBookingModal(true);
    setSelectedDoctorDetail(null);
    setSelectedClinicId("");
    setSelectedDate(0);
    setSelectedSlot(null);
    setSlots([]);
    setSlotError("");
    setBookingMessage("");
    setDoctorDetailLoading(true);
    setDoctorDetailError("");

    try {
      const response = await api.get(
        `/public/doctors/${doctorId}`
      );

      setSelectedDoctorDetail(response.data);

      const clinics =
        response.data?.clinics ||
        response.data?.doctorClinics ||
        [];

      const defaultClinic =
        clinics.find(
          (clinic) =>
            clinic.isPrimary || clinic.primary
        ) || clinics[0];

      setSelectedClinicId(
        defaultClinic?.id
          ? String(defaultClinic.id)
          : ""
      );
    } catch (error) {
      console.error(
        "Failed to fetch doctor detail",
        error
      );

      setSlotError(
        "Unable to load doctor clinic details."
      );
    } finally {
      setDoctorDetailLoading(false);
    }
  };

  useEffect(() => {
    const fetchAvailability = async () => {
      const doctorId =
        selectedDoctor?.doctorProfileId ||
        selectedDoctor?.id;

      if (
        !showDoctorBookingModal ||
        !doctorId ||
        !selectedBookingClinic?.id
      ) {
        return;
      }

      try {
        setSlotLoading(true);
        setSlotError("");
        setSelectedSlot(null);

        const date =
          formatDateForApi(selectedDate);

        const response = await api.get(
          `/public/doctors/${doctorId}/clinics/${selectedBookingClinic.id}/availability`,
          {
            params: {
              date,
            },
          }
        );

        setSlots(
          Array.isArray(response.data?.slots)
            ? response.data.slots
            : []
        );
      } catch (error) {
        console.error(
          "Failed to fetch availability",
          error
        );

        setSlots([]);

        setSlotError(
          "Unable to load slots for selected date."
        );
      } finally {
        setSlotLoading(false);
      }
    };

    fetchAvailability();
  }, [
    showDoctorBookingModal,
    selectedDoctor,
    selectedBookingClinic?.id,
    selectedDate,
  ]);

  const closeDoctorModals = () => {
    setShowDoctorProfileModal(false);
    setShowDoctorBookingModal(false);
    setSelectedDoctor(null);
    setSelectedDoctorDetail(null);
    setSelectedClinicId("");
    setSelectedDate(0);
    setSelectedSlot(null);
    setSlots([]);
    setSlotError("");
    setBookingMessage("");
    setDoctorDetailError("");
  };

  const handleConfirmAppointment = async () => {
    const doctorId =
      selectedDoctor?.doctorProfileId ||
      selectedDoctor?.id;

    if (!currentUser) {
      setPendingDoctorForBooking(selectedDoctor);
      setShowDoctorBookingModal(false);
      setShowLoginPrompt(true);
      return;
    }

    if (currentUser.role !== "PATIENT") {
      setBookingMessage(
        "Only patients can book appointments."
      );
      return;
    }

    if (!selectedProfile) {
      setBookingMessage(
        "Please select patient profile first."
      );
      return;
    }

    if (!doctorId) {
      setBookingMessage(
        "Please select a doctor first."
      );
      return;
    }

    if (!selectedBookingClinic?.id) {
      setBookingMessage(
        "Clinic is not available for this doctor."
      );
      return;
    }

    if (!selectedSlot?.startTime) {
      setBookingMessage(
        "Please select an available slot."
      );
      return;
    }

    try {
      setBookingLoading(true);
      setBookingMessage("");

      const payload = {
        doctorProfileId: doctorId,
        clinicId: selectedBookingClinic.id,
        patientProfileId: selectedProfile.id,
        patientProfileType:
          selectedProfile.type || "SELF",
        appointmentDate:
          formatDateForApi(selectedDate),
        slotStartTime: selectedSlot.startTime,
        slotEndTime: selectedSlot.endTime,
        notes: "Booked from Home page",
      };

      const response = await api.post(
        "/patient/public-appointments",
        payload
      );

      if (response.data?.success === false) {
        setBookingMessage(
          response.data?.message ||
          "Unable to book appointment."
        );
        return;
      }

      setBookingMessage(
        response.data?.message ||
        "Appointment booked successfully."
      );

      setTimeout(() => {
        closeDoctorModals();
      }, 900);
    } catch (error) {
      console.error(
        "Appointment booking failed",
        error
      );

      setBookingMessage(
        error.response?.data?.message ||
        error.message ||
        "Unable to book appointment."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    if (
      showDoctorProfileModal ||
      showDoctorBookingModal
    ) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [
    showDoctorProfileModal,
    showDoctorBookingModal,
  ]);

  const searchResults = useMemo(() => {
    if (!searchText.trim()) return [];

    const query = searchText.toLowerCase();

    const doctorResults = publicDoctors
      .filter((doc) => {
        const searchableText = `
          ${doc.name}
          ${doc.specialty}
          ${doc.city}
          ${doc.location}
          ${doc.hospitalName}
          ${doc.tags.join(" ")}
          ${doc.searchKeywords.join(" ")}
          ${doc.bio}
        `.toLowerCase();

        return searchableText.includes(query);
      })
      .map((doc) => ({
        type: "doctor",
        data: doc,
      }));

    const hospitalResults = publicHospitals
      .filter((hospital) => {
        const searchableText = `
          ${hospital.hospitalName}
          ${hospital.city}
          ${hospital.area}
          ${hospital.address}
          ${hospital.badge}
          ${hospital.description}
        `.toLowerCase();

        return searchableText.includes(query);
      })
      .map((hospital) => ({
        type: "hospital",
        data: hospital,
      }));

    const labResults = publicLabs
      .filter((lab) => {
        const searchableText = `
          ${lab.name}
          ${lab.city}
          ${lab.area}
          ${lab.state}
          ${lab.addressLine1}
          ${lab.addressLine2}
          ${(lab.services || []).join(" ")}
        `.toLowerCase();

        return searchableText.includes(query);
      })
      .map((lab) => ({
        type: "lab",
        data: lab,
      }));

    return [
      ...doctorResults,
      ...hospitalResults,
      ...labResults,
    ];
  }, [
    searchText,
    publicDoctors,
    publicHospitals,
    publicLabs,
  ]);

  return (
    <div className="home-wrapper">
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>

      {showLoginPrompt && (
        <div
          className="login-prompt-overlay"
          onClick={() =>
            setShowLoginPrompt(false)
          }
        >
          <div
            className="login-prompt-card"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="login-prompt-close"
              onClick={() =>
                setShowLoginPrompt(false)
              }
            >
              ×
            </button>

            <div className="login-prompt-icon">
              🔐
            </div>

            <h2>Login Required</h2>

            <p>
              Please login first to book a doctor
              appointment. You can still explore doctors,
              services, blogs, and contact pages without
              logging in.
            </p>

            {pendingDoctorForBooking && (
              <div className="login-prompt-doctor">
                <span>Selected Doctor</span>

                <strong>
                  {pendingDoctorForBooking.fullName ||
                    pendingDoctorForBooking.name}
                </strong>
              </div>
            )}

            <div className="login-prompt-actions">
              <button
                className="login-prompt-primary"
                onClick={() => {
                  setShowLoginPrompt(false);
                  navigate("/login");
                }}
              >
                Go to Login
              </button>

              <button
                className="login-prompt-secondary"
                onClick={() => {
                  setShowLoginPrompt(false);

                  setPendingDoctorForBooking(
                    null
                  );
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDoctorProfileModal &&
        selectedDoctor && (
          <div
            className="modal-overlay"
            onClick={closeDoctorModals}
          >
            <div
              className="profile-modal-card"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <button
                className="modal-close-x"
                onClick={closeDoctorModals}
              >
                ×
              </button>

              <div className="modal-header-top">
                <img
                  src={getSafeDoctorImage(
                    selectedDoctor.profilePictureUrl ||
                    selectedDoctor.profileImage
                  )}
                  className="modal-avatar"
                  alt={
                    selectedDoctor.fullName ||
                    selectedDoctor.name ||
                    "Doctor"
                  }
                  onError={(e) => {
                    e.currentTarget.onerror = null;

                    e.currentTarget.src =
                      defaultDoctorAvatar;
                  }}
                />

                <div className="modal-title-info">
                  <h2>
                    {selectedDoctor.fullName ||
                      selectedDoctor.name ||
                      "Doctor"}
                  </h2>

                  <span className="modal-spec-badge">
                    {selectedDoctor.primarySpecialization ||
                      selectedDoctor.specialty ||
                      "General Physician"}
                  </span>

                  <p>
                    ⭐{" "}
                    {getDoctorRating(
                      selectedDoctor
                    )}{" "}
                    •{" "}
                    {selectedDoctor.experienceYears ||
                      selectedDoctor.experience ||
                      0}{" "}
                    yrs
                  </p>
                </div>
              </div>

              <div className="modal-body-content">
                {doctorDetailLoading ? (
                  <div className="section-state-card">
                    Loading doctor details...
                  </div>
                ) : doctorDetailError ? (
                  <div className="section-error-card">
                    {doctorDetailError}
                  </div>
                ) : (
                  <>
                    <div className="info-row">
                      <strong>
                        📍 Location:
                      </strong>{" "}
                      {[
                        profileDoctor?.area,
                        profileDoctor?.city ||
                        primaryClinic?.city,
                      ]
                        .filter(Boolean)
                        .join(", ") ||
                        selectedDoctor.location ||
                        "Location not updated"}
                    </div>

                    <div className="info-row">
                      <strong>
                        🏥 Primary Clinic:
                      </strong>{" "}
                      {primaryClinic?.clinicName ||
                        selectedDoctor?.clinicName ||
                        selectedDoctor?.hospitalName ||
                        "Clinic not updated"}
                    </div>

                    <div className="info-row">
                      <strong>
                        🎓 Education:
                      </strong>{" "}
                      {profileDoctor?.degrees
                        ?.length > 0
                        ? profileDoctor.degrees.join(
                          ", "
                        )
                        : "Not updated"}
                    </div>

                    <div className="info-row">
                      <strong>
                        🩺 Specializations:
                      </strong>{" "}
                      {profileDoctor
                        ?.specializations?.length >
                        0
                        ? profileDoctor.specializations.join(
                          ", "
                        )
                        : selectedDoctor?.primarySpecialization ||
                        selectedDoctor?.specialty ||
                        "General Physician"}
                    </div>

                    <div className="info-row">
                      <strong>
                        ⏳ Experience:
                      </strong>{" "}
                      {profileDoctor?.experienceYears ||
                        selectedDoctor?.experienceYears ||
                        selectedDoctor?.experience ||
                        0}
                      + Years
                    </div>

                    <div className="info-row">
                      <strong>
                        💰 Consultation Fee:
                      </strong>{" "}
                      ₹
                      {primaryClinic?.consultationFee ||
                        selectedDoctor?.consultationFee ||
                        selectedDoctor?.fees ||
                        "N/A"}
                    </div>

                    <div className="info-row">
                      <strong>🏛️ Council:</strong>{" "}
                      {profileDoctor?.councilName ||
                        "Not updated"}
                    </div>

                    <div className="info-row">
                      <strong>
                        📄 Registration:
                      </strong>{" "}
                      {profileDoctor?.registrationNumber ||
                        "Not updated"}

                      {profileDoctor?.registrationYear
                        ? ` (${profileDoctor.registrationYear})`
                        : ""}
                    </div>

                    {detailClinics.length > 0 && (
                      <div className="modal-bio-box">
                        <strong>
                          Clinics / Hospitals:
                        </strong>

                        {detailClinics.map(
                          (clinic) => (
                            <p key={clinic.id}>
                              {clinic.isPrimary ||
                                clinic.primary
                                ? "⭐ "
                                : ""}

                              {clinic.clinicName ||
                                "Clinic"}{" "}
                              —{" "}
                              {clinic.city ||
                                "City not updated"}

                              {clinic.area
                                ? `, ${clinic.area}`
                                : ""}

                              {clinic.consultationFee
                                ? ` • ₹${clinic.consultationFee}`
                                : ""}
                            </p>
                          )
                        )}
                      </div>
                    )}

                    <div className="modal-bio-box">
                      <strong>
                        About Doctor:
                      </strong>

                      <p>
                        {profileDoctor?.bio ||
                          selectedDoctor?.bio ||
                          `Verified expert in ${selectedDoctor?.primarySpecialization ||
                          selectedDoctor?.specialty ||
                          "healthcare"
                          }.`}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-actions">
                <button
                  className="primary-modal-btn"
                  onClick={() => {
                    setShowDoctorProfileModal(
                      false
                    );

                    openDoctorBooking(
                      selectedDoctor
                    );
                  }}
                >
                  Book Appointment Now
                </button>

                <button
                  className="secondary-modal-btn"
                  onClick={() => {
                    const doctorId =
                      selectedDoctorDetail?.doctorProfileId ||
                      selectedDoctor?.doctorProfileId ||
                      selectedDoctor?.id;

                    setShowDoctorProfileModal(
                      false
                    );

                    navigate(
                      `/patient/doctorsprofile/${doctorId}`,
                      {
                        state:
                          selectedDoctorDetail ||
                          selectedDoctor,
                      }
                    );
                  }}
                >
                  View Full Profile
                </button>
              </div>
            </div>
          </div>
        )}

      {/* --- MOBILE SIDEBAR (PREMIUM UPDATED) --- */}
      <aside
        className={`mobile-sidebar ${isSidebarOpen ? "open" : ""
          }`}
      >
        <div className="sidebar-header">
          <div
            className="sucura-brand sucura-brand--sidebar"
            onClick={() => {
              navigate("/");
              setIsSidebarOpen(false);
            }}
          >
            <img
              src={Logo}
              alt="Sucura"
              className="sucura-brand__logo"
            />

            <span className="sucura-brand__name">
              Sucura
            </span>
          </div>

          <button
            className="close-sidebar-btn"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close navigation"
          >
            ×
          </button>
        </div>

        <div className="sidebar-content">
          {currentUser && (
            <div className="sidebar-user-container">
              <div
                className={`sidebar-profile-card ${patientSub ? "expanded" : ""
                  }`}
                onClick={() =>
                  setPatientSub(!patientSub)
                }
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px",
                }}
              >
                <div className="sidebar-avatar">
                  {currentUser.fullName
                    ? currentUser.fullName
                      .charAt(0)
                      .toUpperCase()
                    : "U"}
                </div>

                <div
                  className="sidebar-info"
                  style={{
                    flex: 1,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "14px",
                    }}
                  >
                    {currentUser.fullName ||
                      "User"}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    {currentUser.email}
                  </p>
                </div>

                <span className="side-chevron">
                  {patientSub ? "▲" : "▼"}
                </span>
              </div>

              {patientSub && (
                <div
                  className="sidebar-inner-dropdown"
                  style={{
                    paddingLeft: "15px",
                    marginTop: "5px",
                  }}
                >
                  <div
                    className="dropdown-item"
                    onClick={() => {
                      const rolePath =
                        currentUser?.role?.toLowerCase() ||
                        "patient";

                      navigate(
                        `/${rolePath}/profile`
                      );

                      setPatientSub(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <span>👤</span> Edit Profile
                  </div>

                  <div
                    className="dropdown-item"
                    onClick={() => {
                      const rolePath =
                        currentUser?.role?.toLowerCase() ||
                        "patient";

                      navigate(
                        `/${rolePath}/dashboard`
                      );

                      setPatientSub(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <span>📊</span> Dashboard
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="sidebar-label">
            Navigation
          </p>

          <div
            className={`sidebar-link ${isActivePath("/") ? "active-side" : ""
              }`}
            onClick={() => {
              navigate("/");
              setIsSidebarOpen(false);
              setPatientSub(false);
            }}
          >
            <span className="sidebar-link-icon">🏠</span>
            <span>Home</span>
          </div>

          <div
            className={`sidebar-link ${isActivePath("/about") ? "active-side" : ""
              }`}
            onClick={() => {
              navigate("/about");
              setIsSidebarOpen(false);
              setPatientSub(false);
            }}
          >
            <span className="sidebar-link-icon">ℹ️</span>
            <span>About Us</span>
          </div>

          <div
            className={`sidebar-link ${isActivePath("/all-services") ? "active-side" : ""
              }`}
            onClick={() => {
              navigate("/all-services");
              setIsSidebarOpen(false);
              setPatientSub(false);
            }}
          >
            <span className="sidebar-link-icon">🛠️</span>
            <span>Services</span>
          </div>

          <div
            className={`sidebar-link ${isActivePath("/blogs") ? "active-side" : ""
              }`}
            onClick={() => {
              navigate("/blogs");
              setIsSidebarOpen(false);
              setPatientSub(false);
            }}
          >
            <span className="sidebar-link-icon">📰</span>
            <span>Doctor Blogs</span>
          </div>

          <div
            className={`sidebar-link ${isActivePath("/contact") ? "active-side" : ""
              }`}
            onClick={() => {
              navigate("/contact");
              setIsSidebarOpen(false);
              setPatientSub(false);
            }}
          >
            <span className="sidebar-link-icon">📞</span>
            <span>Contact Us</span>
          </div>
        </div>

        <div className="sidebar-footer">
          {!currentUser ? (
            <div className="sidebar-auth-grid">
              <button
                className="secondary-btn-mob"
                onClick={() =>
                  navigate("/login")
                }
              >
                Login
              </button>

              <button
                className="primary-btn-mob"
                onClick={() =>
                  navigate("/signup")
                }
              >
                Sign Up
              </button>
            </div>
          ) : (
            <button
              className="primary-btn-mob logout-red"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}
        </div>
      </aside>

      {/* ---------------- HEADER ---------------- */}
      <header className="home-header">
        <div
          className="header-brand sucura-brand"
          onClick={() => navigate("/")}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              navigate("/");
            }
          }}
        >
          <img
            src={Logo}
            alt="Sucura"
            className="logo-img sucura-brand__logo"
          />

          <span className="sucura-brand__name">
            Sucura
          </span>
        </div>

        <nav className="header-nav desktop-only">
          <span
            className="nav-item active-tab"
            onClick={() => navigate("/")}
          >
            Home
          </span>

          <span
            className="nav-item"
            onClick={() => navigate("/about")}
          >
            About Us
          </span>

          <span
            className="nav-item"
            onClick={() =>
              navigate("/all-services")
            }
          >
            Services
          </span>

          <span
            className="nav-item"
            onClick={() => navigate("/blogs")}
          >
            Doctor Blogs
          </span>

          <span
            className="nav-item"
            onClick={() => navigate("/contact")}
          >
            Contact Us
          </span>
        </nav>

        <div className="auth-buttons">
          {!currentUser ? (
            <>
              <button
                className="login-btn-styled desktop-only"
                onClick={() =>
                  navigate("/login")
                }
              >
                Login
              </button>

              <button
                className="primary-btn-styled desktop-only"
                onClick={() =>
                  navigate("/signup")
                }
              >
                SignUp
              </button>
            </>
          ) : (
            <div
              className="profile-wrapper desktop-only"
              ref={dropdownRef}
            >
              <div
                className="profile-icon"
                onClick={() =>
                  setDropdownOpen(!dropdownOpen)
                }
              >
                {currentUser?.fullName
                  ? currentUser.fullName
                    .charAt(0)
                    .toUpperCase()
                  : "U"}
              </div>

              {dropdownOpen && (
                <div className="dropdown-menu alignment-fix">
                  <div className="user-info-header">
                    <div className="user-avatar-mini">
                      {currentUser.fullName
                        ? currentUser.fullName
                          .charAt(0)
                          .toUpperCase()
                        : "P"}
                    </div>

                    <div className="user-details">
                      <p className="user-name">
                        {currentUser.fullName}
                      </p>

                      <p className="user-email">
                        {currentUser.email}
                      </p>
                    </div>
                  </div>

                  <div className="dropdown-divider"></div>
                  <div className="dropdown-divider"></div>

                  <div
                    className="dropdown-item"
                    onClick={() => {
                      if (
                        currentUser?.role ===
                        "ADMIN"
                      ) {
                        navigate("/admin/profile");
                      } else if (
                        currentUser?.role ===
                        "DOCTOR"
                      ) {
                        navigate("/doctor/profile");
                      } else {
                        navigate("/patient/profile");
                      }
                    }}
                  >
                    <span>👤</span> Edit Profile
                  </div>

                  <div
                    className="dropdown-item"
                    onClick={() => {
                      if (
                        currentUser?.role ===
                        "ADMIN"
                      ) {
                        navigate(
                          "/admin/dashboard"
                        );
                      } else if (
                        currentUser?.role ===
                        "DOCTOR"
                      ) {
                        navigate(
                          "/doctor/dashboard"
                        );
                      } else {
                        navigate(
                          "/patient/dashboard"
                        );
                      }
                    }}
                  >
                    <span>📊</span> Dashboard
                  </div>

                  <div
                    className="dropdown-item logout-btn"
                    onClick={handleLogout}
                  >
                    <span>🚪</span> Logout
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            className="hamburger-menu"
            onClick={() =>
              setIsSidebarOpen(true)
            }
          >
            ☰
          </button>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content-main">
            <span className="hero-badge-top">
              ✨ Verified Professionals Only
            </span>

            <h2>
              Find Your <br />
              <span>Trusted Expert</span>
            </h2>

            <div className="search-box-centered">
              <div className="search-input-wrapper">
                <span className="search-icon-hero">
                  🔍
                </span>

                <input
                  type="text"
                  placeholder="Search doctors, hospitals, labs, clinics..."
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(
                      e.target.value
                    );

                    setShowSearchResults(true);
                  }}
                  onFocus={() =>
                    setShowSearchResults(true)
                  }
                />

                {searchText && (
                  <button
                    className="search-clear-btn"
                    onClick={() => {
                      setSearchText("");

                      setShowSearchResults(
                        false
                      );
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                className="hero-search-btn"
                onClick={handleSearchSubmit}
              >
                Search
              </button>
            </div>

            <div className="trending-tags">
              <span className="trending-label">
                🔥 Trending :-
              </span>

              <div className="tags-flex">
                {trendingSearches.map(
                  (item) => (
                    <button
                      key={item}
                      className="trend-tag"
                      onClick={() => {
                        setSearchText(item);
                        setDebouncedSearchText(
                          item
                        );
                        setShowSearchResults(
                          true
                        );
                      }}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="hero-visual desktop-only">
            <img
              src={heroImg}
              alt="Doctor"
            />
          </div>
        </div>
      </section>

      {showSearchResults && searchText && (
        <section className="search-results">
          <h2 className="section-title">
            Search Results:{" "}
            {searchResults.length}
          </h2>

          {searchLoading && (
            <div
              className="no-results-box"
              style={{
                textAlign: "center",
                width: "100%",
                padding: "30px",
              }}
            >
              <h3>Searching doctors...</h3>
              <p>Please wait.</p>
            </div>
          )}

          {searchError && !searchLoading && (
            <div
              className="no-results-box"
              style={{
                textAlign: "center",
                width: "100%",
                padding: "30px",
              }}
            >
              <h3>{searchError}</h3>
              <p>Please try again.</p>
            </div>
          )}

          <div className="doctor-grid-v3">
            {searchResults.length > 0 ? (
              searchResults.map(
                (item, index) => {
                  if (item.type === "doctor") {
                    const doc = item.data;

                    return (
                      <div
                        key={`doctor-${doc.doctorProfileId ||
                          doc.id ||
                          index
                          }`}
                        className="premium-v3-card"
                        onClick={() =>
                          openDoctorProfile(doc)
                        }
                      >
                        <div className="v3-card-top">
                          <img
                            src={getSafeDoctorImage(
                              doc.profilePictureUrl ||
                              doc.profileImage
                            )}
                            alt={
                              doc.fullName ||
                              doc.name ||
                              "Doctor"
                            }
                            onError={(e) => {
                              e.currentTarget.onerror =
                                null;

                              e.currentTarget.src =
                                defaultDoctorAvatar;
                            }}
                          />

                          <div className="v3-rating">
                            ⭐{" "}
                            {getDoctorRating(
                              doc
                            )}
                          </div>
                        </div>

                        <div className="v3-card-body">
                          <h3>
                            {doc.fullName ||
                              doc.name ||
                              "Doctor"}
                          </h3>

                          <p className="v3-spec">
                            {doc.primarySpecialization ||
                              doc.specialty ||
                              "General Physician"}
                          </p>

                          <p className="v3-loc">
                            📍{" "}
                            {getDoctorLocation(
                              doc
                            )}
                          </p>

                          <p className="v3-exp">
                            💼{" "}
                            {doc.experienceYears ??
                              doc.experience ??
                              0}{" "}
                            yrs experience
                          </p>

                          <p className="v3-exp">
                            🏥{" "}
                            {doc.clinicName ||
                              doc.hospitalName ||
                              "Clinic not updated"}
                          </p>

                          <p className="v3-exp">
                            💰 ₹
                            {doc.consultationFee ??
                              doc.fees ??
                              "N/A"}{" "}
                            consultation
                          </p>

                          <div className="v3-btn-group">
                            <button
                              className="v3-btn secondary"
                              onClick={(e) => {
                                e.stopPropagation();

                                openDoctorProfile(
                                  doc
                                );
                              }}
                            >
                              View Details
                            </button>

                            <button
                              className="v3-btn secondary"
                              onClick={(e) => {
                                e.stopPropagation();

                                openDoctorBooking(
                                  doc
                                );
                              }}
                            >
                              Book Now
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (
                    item.type === "hospital"
                  ) {
                    const hospital =
                      item.data;

                    return (
                      <div
                        key={`hospital-${hospital.id || index
                          }`}
                        className="premium-v3-card"
                        onClick={() =>
                          navigate(
                            "/all-services"
                          )
                        }
                      >
                        <div className="v3-card-top">
                          <img
                            src={
                              hospital.imageUrl
                            }
                            alt={
                              hospital.hospitalName ||
                              "Hospital"
                            }
                          />

                          <div className="v3-rating">
                            🏥 Hospital
                          </div>
                        </div>

                        <div className="v3-card-body">
                          <h3>
                            {
                              hospital.hospitalName
                            }
                          </h3>

                          <p className="v3-spec">
                            {hospital.badge ||
                              "Premium Hospital"}
                          </p>

                          <p className="v3-loc">
                            📍{" "}
                            {[hospital.area, hospital.city]
                              .filter(Boolean)
                              .join(", ") ||
                              "Location not updated"}
                          </p>

                          <p className="v3-exp">
                            🛏️{" "}
                            {hospital.availableBeds ||
                              0}{" "}
                            beds available
                          </p>

                          <div className="v3-btn-group">
                            <button className="v3-btn secondary">
                              View Hospital
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (item.type === "lab") {
                    const lab = item.data;

                    return (
                      <div
                        key={`lab-${lab.id || index
                          }`}
                        className="premium-v3-card"
                        onClick={() =>
                          navigate(
                            "/all-services"
                          )
                        }
                      >
                        <div className="v3-card-top">
                          <img
                            src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800"
                            alt={
                              lab.name || "Lab"
                            }
                          />

                          <div className="v3-rating">
                            🧪 Lab
                          </div>
                        </div>

                        <div className="v3-card-body">
                          <h3>{lab.name}</h3>

                          <p className="v3-spec">
                            {(lab.services || [])
                              .slice(0, 2)
                              .join(", ") ||
                              "Diagnostic Lab"}
                          </p>

                          <p className="v3-loc">
                            📍{" "}
                            {[lab.area, lab.city]
                              .filter(Boolean)
                              .join(", ") ||
                              "Location not updated"}
                          </p>

                          <p className="v3-exp">
                            ✅ Verified diagnostic
                            center
                          </p>

                          <div className="v3-btn-group">
                            <button className="v3-btn secondary">
                              View Lab
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return null;
                }
              )
            ) : (
              <div
                className="no-results-box"
                style={{
                  textAlign: "center",
                  width: "100%",
                  padding: "40px",
                }}
              >
                <h3>No Results Found</h3>

                <p>
                  Try searching for doctors,
                  hospitals, labs, city, clinic, or
                  service name.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {!searchText && (
        <>
          {/* --- DYNAMIC HOSPITAL AD BANNER --- */}
          <section className="hospital-ad-section">
            <div className="hospital-ad-card">
              <div
                className="ad-content-left"
                key={adIndex}
              >
                <span className="ad-badge">
                  {ads[adIndex].badge}
                </span>

                <h3 className="fade-in-text">
                  {ads[adIndex].title}
                </h3>

                <p className="fade-in-text">
                  {ads[adIndex].desc}
                </p>
              </div>

              <button className="visit-hosp-btn">
                {ads[adIndex].btnText}
              </button>
            </div>
          </section>

          {/* --- SPECIALTY GRID --- */}
          <section className="specialties-section">
            <div className="specialties-grid">
              {specialties
                .slice(0, 10)
                .map((spec, index) => (
                  <div
                    key={index}
                    className="spec-chip"
                    onClick={() => {
                      setSearchText(spec.name);
                      setShowSearchResults(
                        true
                      );
                    }}
                  >
                    <span className="spec-icon-box">
                      {spec.icon}
                    </span>

                    <span className="spec-name-box">
                      {spec.name}
                    </span>
                  </div>
                ))}
            </div>
          </section>

          {/* --- DOCTOR SECTION --- */}
          <section className="doctors-section">
            <div className="section-header-pro">
              <h2>
                Expert{" "}
                <span>Healthcare Team</span>
              </h2>

              <div className="accent-line-small"></div>
            </div>

            <div className="doctor-grid-v3">
              {doctorLoading ||
                searchLoading ? (
                <div
                  className="no-results-box"
                  style={{
                    textAlign: "center",
                    width: "100%",
                    padding: "40px",
                  }}
                >
                  <h3>Loading doctors...</h3>

                  <p>
                    Please wait while we fetch
                    verified doctors.
                  </p>
                </div>
              ) : doctorError ||
                searchError ? (
                <div
                  className="no-results-box"
                  style={{
                    textAlign: "center",
                    width: "100%",
                    padding: "40px",
                  }}
                >
                  <h3>
                    {doctorError ||
                      searchError}
                  </h3>

                  <p>
                    Please try again after some
                    time.
                  </p>
                </div>
              ) : filteredDoctors.length ===
                0 ? (
                <div
                  className="no-results-box"
                  style={{
                    textAlign: "center",
                    width: "100%",
                    padding: "40px",
                  }}
                >
                  <h3>
                    No verified doctors available
                  </h3>

                  <p>
                    Doctors will appear here once
                    admin verifies them.
                  </p>
                </div>
              ) : (
                filteredDoctors.map((doc) => (
                  <div
                    key={
                      doc.doctorProfileId ||
                      doc.id
                    }
                    className="premium-v3-card"
                    onClick={() =>
                      openDoctorProfile(doc)
                    }
                  >
                    <div className="v3-card-top">
                      <img
                        src={getSafeDoctorImage(
                          doc.profilePictureUrl ||
                          doc.profileImage
                        )}
                        alt={
                          doc.fullName ||
                          doc.name ||
                          "Doctor"
                        }
                        onError={(e) => {
                          e.currentTarget.onerror =
                            null;

                          e.currentTarget.src =
                            defaultDoctorAvatar;
                        }}
                      />

                      <div className="v3-rating">
                        ⭐{" "}
                        {getDoctorRating(doc)}
                      </div>
                    </div>

                    <div className="v3-card-body">
                      <h3>
                        {doc.fullName ||
                          doc.name ||
                          "Doctor"}
                      </h3>

                      <p className="v3-spec">
                        {doc.primarySpecialization ||
                          doc.specialty ||
                          "General Physician"}
                      </p>

                      <p className="v3-loc">
                        📍{" "}
                        {getDoctorLocation(doc)}
                      </p>

                      <p className="v3-exp">
                        💼{" "}
                        {doc.experienceYears ??
                          doc.experience ??
                          0}{" "}
                        yrs experience
                      </p>

                      <p className="v3-exp">
                        🏥{" "}
                        {doc.clinicName ||
                          doc.hospitalName ||
                          "Clinic not updated"}
                      </p>

                      <p className="v3-exp">
                        💰 ₹
                        {doc.consultationFee ??
                          doc.fees ??
                          "N/A"}{" "}
                        consultation
                      </p>

                      <div className="v3-btn-group">
                        <button
                          className="v3-btn secondary"
                          onClick={(e) => {
                            e.stopPropagation();

                            openDoctorProfile(
                              doc
                            );
                          }}
                        >
                          View Details
                        </button>

                        <button
                          className="v3-btn secondary"
                          onClick={(e) => {
                            e.stopPropagation();

                            openDoctorBooking(
                              doc
                            );
                          }}
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* --- PREMIUM COSTS SECTION WITH POPUP --- */}
          <section className="costs-section">
            <div className="section-header-pro">
              <h2>
                Specialized Care &{" "}
                <span>Costs</span>
              </h2>

              <p className="section-sub-tag">
                🛡️ Cashless Insurance & 0% EMI
                Options Available
              </p>

              <div className="accent-line-small"></div>
            </div>

            <div className="costs-grid">
              {costPackages.map(
                (pkg, index) => (
                  <div
                    key={index}
                    className="cost-card-styled"
                    onClick={() =>
                      setSelectedCost(pkg)
                    }
                  >
                    <div className="pkg-badge">
                      {pkg.badge}
                    </div>

                    <div className="cost-image-box">
                      <img
                        src={pkg.image}
                        alt={pkg.title}
                      />
                    </div>

                    <h4>{pkg.title}</h4>

                    <p className="pkg-desc-text">
                      {pkg.desc}
                    </p>

                    <ul className="pkg-mini-features">
                      {pkg.features.map(
                        (feature, featureIndex) => (
                          <li
                            key={featureIndex}
                          >
                            <span>✓</span>{" "}
                            {feature}
                          </li>
                        )
                      )}
                    </ul>

                    <div className="cost-info-footer">
                      <div className="cost-price-tag">
                        Starts ₹{pkg.price}
                      </div>

                      {pkg.emi !== "N/A" && (
                        <div className="emi-tag">
                          EMI: {pkg.emi}
                        </div>
                      )}
                    </div>

                    <button className="pkg-book-btn">
                      Get Free Quote
                    </button>
                  </div>
                )
              )}
            </div>

            {selectedCost && (
              <div
                className="modal-overlay"
                onClick={() =>
                  setSelectedCost(null)
                }
              >
                <div
                  className="cost-modal-card"
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                >
                  <button
                    className="modal-close-x"
                    onClick={() =>
                      setSelectedCost(null)
                    }
                  >
                    ×
                  </button>

                  <div className="modal-header">
                    <div className="cost-image-box">
                      <img
                        src={selectedCost.image}
                        alt={selectedCost.title}
                      />
                    </div>

                    <h2>
                      {selectedCost.title}
                    </h2>

                    <span className="pkg-badge">
                      {selectedCost.badge}
                    </span>
                  </div>

                  <p className="pkg-desc-text">
                    {selectedCost.desc}
                  </p>

                  <ul className="pkg-mini-features">
                    {selectedCost.features.map(
                      (feature, index) => (
                        <li key={index}>
                          <span>✓</span>{" "}
                          {feature}
                        </li>
                      )
                    )}
                  </ul>

                  <div className="cost-info-footer">
                    <div className="cost-price-tag">
                      Starts ₹
                      {selectedCost.price}
                    </div>

                    {selectedCost.emi !==
                      "N/A" && (
                        <div className="emi-tag">
                          EMI:{" "}
                          {selectedCost.emi}
                        </div>
                      )}
                  </div>

                  <button className="know-more-btn">
                    Know More
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* --- SHOWCASE SECTION WITH POPUP --- */}
          <section className="showcase-section">
            <div className="section-header-pro">
              <h2>
                Latest <span>Updates</span>
              </h2>

              <div className="accent-line-small"></div>

              <p className="section-sub-tag">
                Stay updated with new doctors,
                hospitals, treatments & medicines
              </p>
            </div>

            <div className="showcase-grid">
              {[
                {
                  title:
                    "Dr. A. Sharma Joined",
                  type: "Doctor",
                  desc: "Cardiologist with 15 yrs experience",
                  badge: "New",
                },
                {
                  title:
                    "City Care Hospital Upgrade",
                  type: "Hospital",
                  desc: "Now with Robotic Surgery",
                  badge: "Featured",
                },
                {
                  title:
                    "Diabetes Awareness Campaign",
                  type: "Disease",
                  desc: "Free screening this month",
                  badge: "Alert",
                },
                {
                  title:
                    "New Medicine: CardioPlus",
                  type: "Medicine",
                  desc: "Reduces cholesterol effectively",
                  badge: "New",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="showcase-card"
                  onClick={() =>
                    setSelectedShowcase(item)
                  }
                >
                  <div
                    className={`showcase-badge badge-${item.badge.toLowerCase()}`}
                  >
                    {item.badge}
                  </div>

                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>

                  <span className="showcase-type">
                    {item.type}
                  </span>
                </div>
              ))}
            </div>

            {selectedShowcase && (
              <div
                className="popup-overlay"
                onClick={() =>
                  setSelectedShowcase(null)
                }
              >
                <div
                  className="popup-content"
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                >
                  <h3>
                    {selectedShowcase.title}
                  </h3>

                  <p>
                    <strong>Type:</strong>{" "}
                    {selectedShowcase.type}
                  </p>

                  <p>
                    {selectedShowcase.desc}
                  </p>

                  <div className="popup-btn-group">
                    <button
                      className="popup-btn-knowmore"
                      onClick={() =>
                        navigate("/blogs")
                      }
                    >
                      Know More
                    </button>

                    <button
                      className="popup-btn-close"
                      onClick={() =>
                        setSelectedShowcase(null)
                      }
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {showDoctorBookingModal &&
        selectedDoctor && (
          <div
            className="booking-modal-overlay"
            onClick={closeDoctorModals}
          >
            <div
              className="booking-modal-card"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <button
                className="modal-close"
                onClick={closeDoctorModals}
              >
                ✕
              </button>

              <div className="booking-scroll">
                <h2>Book Appointment</h2>

                <div className="booking-doctor">
                  <img
                    src={getSafeDoctorImage(
                      selectedDoctor?.profilePictureUrl ||
                      selectedDoctor?.profileImage
                    )}
                    alt={
                      selectedDoctor?.fullName ||
                      selectedDoctor?.name ||
                      "Doctor"
                    }
                    onError={(e) => {
                      e.currentTarget.onerror = null;

                      e.currentTarget.src =
                        defaultDoctorAvatar;
                    }}
                  />

                  <div>
                    <h3>
                      {selectedDoctor.fullName ||
                        selectedDoctor.name ||
                        "Doctor"}
                    </h3>

                    <p>
                      {selectedDoctor.primarySpecialization ||
                        selectedDoctor.specialty ||
                        "General Physician"}
                    </p>

                    <small>
                      {primaryClinic?.clinicName ||
                        selectedDoctor.clinicName ||
                        selectedDoctor.hospitalName ||
                        "Clinic loading..."}
                    </small>
                  </div>
                </div>

                {doctorDetailLoading && (
                  <div className="section-state-card">
                    Loading clinic details...
                  </div>
                )}

                {!doctorDetailLoading &&
                  !primaryClinic && (
                    <div className="section-error-card">
                      No active clinic found for
                      this doctor.
                    </div>
                  )}

                {!doctorDetailLoading &&
                  clinicOptions.length > 0 && (
                    <div className="booking-section">
                      <p>Select Clinic</p>

                      <select
                        className="booking-clinic-select"
                        value={selectedClinicId}
                        onChange={(e) => {
                          setSelectedClinicId(
                            e.target.value
                          );

                          setSelectedSlot(null);
                          setSlots([]);
                          setSlotError("");
                        }}
                      >
                        {clinicOptions.map(
                          (clinic) => (
                            <option
                              key={clinic.id}
                              value={clinic.id}
                            >
                              {clinic.clinicName ||
                                "Clinic"}{" "}
                              - ₹
                              {clinic.consultationFee ||
                                selectedDoctor?.consultationFee ||
                                selectedDoctor?.fees ||
                                "N/A"}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  )}

                <div className="booking-section">
                  <p>Select Date</p>

                  <div className="date-list">
                    {[0, 1, 2, 3, 4].map(
                      (day) => (
                        <button
                          key={day}
                          className={`date-chip ${selectedDate === day
                            ? "active"
                            : ""
                            }`}
                          onClick={() =>
                            setSelectedDate(day)
                          }
                        >
                          {formatDateLabel(day)}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="booking-section">
                  <p>Select Time</p>

                  {slotLoading && (
                    <div className="section-state-card">
                      Loading available slots...
                    </div>
                  )}

                  {slotError && (
                    <div className="section-error-card">
                      {slotError}
                    </div>
                  )}

                  {!slotLoading &&
                    !slotError &&
                    slots.length === 0 && (
                      <div className="section-state-card">
                        No slots available for this
                        date.
                      </div>
                    )}

                  {!slotLoading &&
                    !slotError &&
                    slots.length > 0 && (
                      <div className="slot-list">
                        {slots.map((slot) => {
                          const isAvailable =
                            String(
                              slot.status || ""
                            ).toUpperCase() ===
                            "AVAILABLE";

                          return (
                            <button
                              key={`${slot.startTime}-${slot.endTime}`}
                              className={`slot ${selectedSlot?.startTime ===
                                slot.startTime
                                ? "active"
                                : ""
                                }`}
                              disabled={!isAvailable}
                              onClick={() =>
                                isAvailable &&
                                setSelectedSlot(
                                  slot
                                )
                              }
                            >
                              {slot.displayTime ||
                                `${slot.startTime} - ${slot.endTime}`}
                            </button>
                          );
                        })}
                      </div>
                    )}
                </div>

                <div className="booking-section">
                  <p className="section-label">
                    Patient Info
                  </p>

                  {selectedProfile ? (
                    <div className="selected-patient-card">
                      <h4>
                        {selectedProfile.fullName}
                      </h4>

                      <p>
                        {selectedProfile.relation} •{" "}
                        {selectedProfile.gender ||
                          "N/A"}{" "}
                        •{" "}
                        {selectedProfile.type ||
                          "SELF"}
                      </p>
                    </div>
                  ) : (
                    <div className="selected-patient-card error-card">
                      <p>
                        No profile selected
                      </p>
                    </div>
                  )}
                </div>

                {bookingMessage && (
                  <div className="section-state-card">
                    {bookingMessage}
                  </div>
                )}

                <button
                  className="primary-btn confirm-btn"
                  onClick={
                    handleConfirmAppointment
                  }
                  disabled={bookingLoading}
                >
                  {bookingLoading
                    ? "Booking..."
                    : "Confirm Appointment"}
                </button>

                <button
                  className="secondary-btn confirm-btn"
                  onClick={closeDoctorModals}
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        )}

      {/* --- FOOTER --- */}
      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-column brand-col">
            <h2 className="footer-logo">Suc<span style={{ color: 'var(--text-dark)', background: 'white', padding: '0 5px', borderRadius: '4px', marginLeft: '5px' }}>ura</span></h2>


            <p className="footer-desc">
              Mumbai's trusted healthcare network.
              Booking appointments, finding labs,
              and managing health records made
              simple.
            </p>

            <div className="footer-socials">
              <ul className="example-1">
                <li className="icon-content">
                  <a
                    href="#"
                    aria-label="Facebook"
                    data-social="facebook"
                    className="link"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 32 32"
                    >
                      <path
                        d="M29.059 15.085C29.058 7.322 22.764 1.028 15 1.028S0.941 7.323 0.941 15.087c0 6.989 5.1 12.787 11.781 13.875l0.081 0.011V19.15H9.232v-4.065h3.57v-3.096a4.962 4.962 0 0 1 5.329 -5.469l-0.017 -0.001c1.124 0.016 2.212 0.115 3.273 0.292l-0.126 -0.018v3.459h-1.774a2.033 2.033 0 0 0 -2.291 2.204l-0.001 -0.008v2.636h3.899l-0.623 4.065h-3.276v9.823c6.762 -1.101 11.862 -6.899 11.863 -13.888"
                        fill="currentColor"
                      ></path>
                    </svg>
                  </a>

                  <div className="tooltip">
                    Facebook
                  </div>
                </li>

                <li className="icon-content">
                  <a
                    href="#"
                    aria-label="Instagram"
                    data-social="instagram"
                    className="link"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                        fill="currentColor"
                      ></path>
                    </svg>
                  </a>

                  <div className="tooltip">
                    Instagram
                  </div>
                </li>

                <li className="icon-content">
                  <a
                    href="#"
                    aria-label="LinkedIn"
                    data-social="linkedin"
                    className="link"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"
                        fill="currentColor"
                      ></path>
                    </svg>
                  </a>

                  <div className="tooltip">
                    LinkedIn
                  </div>
                </li>

                <li className="icon-content">
                  <a
                    href="#"
                    aria-label="WhatsApp"
                    data-social="whatsapp"
                    className="link"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.407 3.481s3.48 5.223 3.48 8.405c-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.3 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"
                        fill="currentColor"
                      ></path>
                    </svg>
                  </a>

                  <div className="tooltip">
                    WhatsApp
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-column">
            <h4>Services</h4>

            <ul className="footer-list">
              <li
                onClick={() =>
                  navigate("/all-services")
                }
              >
                Find Doctors
              </li>

              <li
                onClick={() =>
                  navigate("/all-services")
                }
              >
                Find Hospitals
              </li>

              <li
                onClick={() =>
                  navigate("/all-services")
                }
              >
                Find Labs
              </li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Support</h4>

            <ul className="footer-list">
              <li
                onClick={() => navigate("/")}
              >
                Home
              </li>

              <li
                onClick={() =>
                  navigate("/about")
                }
              >
                About Us
              </li>

              <li
                onClick={() =>
                  navigate("/blogs")
                }
              >
                Doctor Blogs
              </li>

              <li
                onClick={() =>
                  navigate("/all-services")
                }
              >
                Services
              </li>

              <li
                onClick={() =>
                  navigate("/contact")
                }
              >
                Contact Us
              </li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Contact Us</h4>

            <div className="footer-contact-info">
              <p>
                📍 Andheri East, Mumbai, MH
              </p>

              <p>📞 +91 98765 - 43210</p>

              <p>✉️ support@Sucura.com</p>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p>&copy; 2026 Sucura Mumbai. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;