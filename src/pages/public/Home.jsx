

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import heroImg from "../../assets/images/doctor1.png";
import "./Home.css";
import Logo from "../../assets/images/logo.png";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useAuthActions } from "../../services/authService";
import { useProfile } from "../../context/useProfile";
import defaultDoctorAvatar from "../../assets/images/avtar.png";
const HomePage = () => {
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [patientSub, setPatientSub] = useState(false);
  const { currentUser, setCurrentUser } = useContext(AuthContext);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [selectedCost, setSelectedCost] = useState(null);
  const [selectedShowcase, setSelectedShowcase] = useState(null);
  const { logoutUser } = useAuthActions(setCurrentUser);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingMessageType, setBookingMessageType] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingDoctorForBooking, setPendingDoctorForBooking] = useState(null);
  const [publicDoctors, setPublicDoctors] = useState([]);
  const [doctorLoading, setDoctorLoading] = useState(true);
  const [doctorError, setDoctorError] = useState("");
  const [doctorDetailLoading, setDoctorDetailLoading] = useState(false);
  const [doctorDetailError, setDoctorDetailError] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [bookingClinicId, setBookingClinicId] = useState(null);
  const [bookingDateOffset, setBookingDateOffset] = useState(0);
  const [bookingSlots, setBookingSlots] = useState([]);
  const [bookingSlotLoading, setBookingSlotLoading] = useState(false);
  const [bookingSlotError, setBookingSlotError] = useState("");
  const [selectedBookingSlot, setSelectedBookingSlot] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const { clearProfile, selectedProfile } = useProfile();


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
      btnText: "Visit Hospital"
    },
    {
      badge: "Special Offer",
      title: "Premium Dental Care Center",
      desc: "Free consultation for first-time visitors. Smile brighter with our experts.",
      btnText: "Book Dental Hub"
    },
    {
      badge: "Health First",
      title: "Full Body Checkup @ ₹999",
      desc: "Including Diabetes, Thyroid & Cardiac profile. Home sample collection available.",
      btnText: "Grab Offer"
    }
  ];
  const showBookingMessage = (message, type = "error") => {
    setBookingMessage(message);
    setBookingMessageType(type);

    setTimeout(() => {
      setBookingMessage("");
      setBookingMessageType("");
    }, 2500);
  };

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

        const endpoint =
          query.length >= 2
            ? `/public/doctors/search?q=${encodeURIComponent(query)}`
            : "/public/doctors";

        const response = await api.get(endpoint);

        const mappedDoctors = response.data.map((doctor) => ({
          id: doctor.doctorProfileId,
          userId: doctor.userId,
          name: doctor.fullName,
          specialty: doctor.primarySpecialization || "General Physician",
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
            ...(doctor.specializations || [])
          ].filter(Boolean),
          languages: []
        }));

        setPublicDoctors(mappedDoctors);
      } catch (error) {
        console.error("Failed to search doctors:", error);
        setDoctorError("Unable to load doctors right now.");
        setSearchError("Unable to search doctors right now.");
        setPublicDoctors([]);
      } finally {
        setSearchLoading(false);
        setDoctorLoading(false);
      }
    };

    fetchSearchResults();
  }, [debouncedSearchText]);

  const closeBookingModal = () => {
    setShowBooking(false);
    setBookingMessage("");
    setBookingMessageType("");
  };
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
    if (normalized.includes("eye") || normalized.includes("ophthal")) return "👁️";
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
          "Ophthalmology"
        ];

        const mapped = response.data
          .filter((name) => mainSpecializations.includes(name))
          .map((name) => ({
            name,
            icon: getSpecialtyIcon(name)
          }));

        setSpecialties(mapped);
      } catch (error) {
        console.error("Failed to fetch specializations:", error);
        setSpecialties([]);
      }
    };

    fetchSpecializations();
  }, []);
  const costPackages = useMemo(() => [
    {
      title: "Maternity Care",
      desc: "Luxury delivery suites & neonatal care.",
      price: "45,000",
      // Image: Hospital newborn nursery / baby care
      image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=800&q=80",
      badge: "Trending",
      emi: "₹3,750/mo",
      features: ["Private Room", "Nursing", "Medicines"]
    },
    {
      title: "Knee Surgery",
      desc: "Robotic assisted with fast recovery.",
      price: "1,20,000",
      // Image: Orthopedic surgeon / Knee X-ray/Scan focus
      image: "https://images.pexels.com/photos/4226119/pexels-photo-4226119.jpeg?auto=compress&cs=tinysrgb&w=800",
      badge: "New",
      emi: "₹10,000/mo",
      features: ["Implants", "Physio", "Post-Op Care"]
    },
    {
      title: "Heart Checkup",
      desc: "Full cardiac screening & consultation.",
      price: "4,999",
      // Image: Stethoscope on medical report
      image: "https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=800",
      badge: "Essential",
      emi: "N/A",
      features: ["ECG/Echo", "Blood Tests", "Expert Opinion"]
    },
    {
      title: "Transplant Care",
      desc: "Advanced organ transplant center.",
      price: "4,50,000",
      // Image: High-tech surgical theater
      image: "https://images.pexels.com/photos/247786/pexels-photo-247786.jpeg?auto=compress&cs=tinysrgb&w=800",
      badge: "Specialist",
      emi: "₹37,500/mo",
      features: ["Pre-Op Tests", "ICU Support", "NABH Center"]
    }
  ], []);


  const trendingSearches = ["Fever", "Knee Pain", "Skin Allergy", "Diabetes"];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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

  const mapDoctorDetailToFrontend = (doctor) => {
    const primaryClinic =
      doctor.clinics?.find((clinic) => clinic.isPrimary) ||
      doctor.clinics?.[0] ||
      null;

    return {
      id: doctor.doctorProfileId,
      userId: doctor.userId,
      name: doctor.fullName,
      specialty: doctor.specializations?.[0] || "General Physician",
      specializations: doctor.specializations || [],
      degrees: doctor.degrees || [],
      city: primaryClinic?.city || "Mumbai",
      location: primaryClinic?.area || primaryClinic?.city || "Mumbai",
      hospitalName: primaryClinic?.clinicName || "Clinic not updated",
      clinics: doctor.clinics || [],
      experience: doctor.experienceYears || 0,
      fees: primaryClinic?.consultationFee || doctor.consultationFee || 500,
      profileImage: getSafeDoctorImage(doctor.profilePictureUrl),
      bio: doctor.bio || "Verified healthcare professional.",
      councilName: doctor.councilName,
      registrationNumber: doctor.registrationNumber,
      registrationYear: doctor.registrationYear,
      tags: doctor.specializations || [],
      conditions: [],
      searchKeywords: [
        doctor.fullName,
        ...(doctor.specializations || []),
        primaryClinic?.city,
        primaryClinic?.area,
        primaryClinic?.clinicName
      ].filter(Boolean),
      languages: []
    };
  };
  const openDoctorModal = async (doctorId) => {
    try {
      setDoctorDetailLoading(true);
      setDoctorDetailError("");
      setSelectedDoctor(null);

      const response = await api.get(`/public/doctors/${doctorId}`);
      const mappedDoctor = mapDoctorDetailToFrontend(response.data);

      setSelectedDoctor(mappedDoctor);
    } catch (error) {
      console.error("Failed to load doctor detail:", error);
      setDoctorDetailError("Unable to load doctor details right now.");
    } finally {
      setDoctorDetailLoading(false);
    }
  };
  const handleBookAppointment = async (doctor) => {
    if (!currentUser) {
      setPendingDoctorForBooking(doctor);
      setShowLoginPrompt(true);
      return;
    }

    if (currentUser.role !== "PATIENT") {
      showBookingMessage("Only patients can book appointments.");
      return;
    }

    if (!selectedProfile) {
      showBookingMessage("Please select patient profile first.");
      return;
    }

    try {
      const res = await api.get(`/public/doctors/${doctor.id}`);

      const fullDoctor = mapDoctorDetailToFrontend(res.data);

      setBookingDoctor(fullDoctor);

      const primaryClinic =
        fullDoctor.clinics.find(c => c.isPrimary) ||
        fullDoctor.clinics[0];

      setBookingClinicId(primaryClinic?.id || null);

      setBookingDateOffset(0);
      setSelectedBookingSlot(null);

      setShowBooking(true);

    } catch {
      showBookingMessage("Unable to load doctor booking info.");
    }
  };
  const bookingDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + bookingDateOffset);
    return d.toISOString().split("T")[0];
  }, [bookingDateOffset]);
  useEffect(() => {
    const loadSlots = async () => {
      if (!bookingDoctor || !bookingClinicId) return;

      try {
        setBookingSlotLoading(true);

        const res = await api.get(
          `/public/doctors/${bookingDoctor.id}/clinics/${bookingClinicId}/availability`,
          {
            params: { date: bookingDate }
          }
        );

        setBookingSlots(res.data?.slots || []);
        setSelectedBookingSlot(null);

      } catch {
        setBookingSlotError("Unable to load slots.");
        setBookingSlots([]);
      } finally {
        setBookingSlotLoading(false);
      }
    };

    loadSlots();
  }, [bookingDoctor, bookingClinicId, bookingDate]);

  const confirmBooking = async () => {
    if (!selectedBookingSlot) {
      showBookingMessage("Select slot first.");
      return;
    }

    try {
      setBookingLoading(true);

      await api.post("/patient/public-appointments", {
        doctorProfileId: bookingDoctor.id,
        clinicId: bookingClinicId,
        patientProfileId: selectedProfile.id,
        patientProfileType: selectedProfile.type || "SELF",
        appointmentDate: bookingDate,
        slotStartTime: selectedBookingSlot.startTime,
        slotEndTime: selectedBookingSlot.endTime,
        notes: "Booked from Home page"
      });

      showBookingMessage("Appointment booked successfully", "success");

      setShowBooking(false);

    } catch {
      showBookingMessage("Booking failed.");
    } finally {
      setBookingLoading(false);
    }
  };

  const searchResults = useMemo(() => {

    if (!searchText) return [];

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
      ${doc.conditions.join(" ")}
      ${doc.searchKeywords.join(" ")}
      ${doc.languages.join(" ")}
      ${doc.bio}
    `.toLowerCase();

        return (
          searchableText.includes(query) ||
          doc.specialty.toLowerCase().includes(query) ||
          query.includes(doc.specialty.toLowerCase()) ||
          doc.specialty.toLowerCase().replace("ist", "y").includes(query)
        );

      })
      .map((doc) => ({
        type: "doctor",
        data: doc
      }));

    const specialtyResults = specialties
      .filter((s) => s.name.toLowerCase().includes(query))
      .map((s) => ({
        type: "specialty",
        data: s
      }));

    const costResults = costPackages
      .filter((c) =>
        `${c.title} ${c.desc}`.toLowerCase().includes(query)
      )
      .map((c) => ({
        type: "cost",
        data: c
      }));

    return [
      ...doctorResults,
      ...specialtyResults,
      ...costResults
    ];

  }, [searchText, specialties, costPackages, publicDoctors]);
  return (
    <div className="home-wrapper">
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      {showLoginPrompt && (
        <div className="login-prompt-overlay" onClick={() => setShowLoginPrompt(false)}>
          <div className="login-prompt-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="login-prompt-close"
              onClick={() => setShowLoginPrompt(false)}
            >
              ×
            </button>

            <div className="login-prompt-icon">🔐</div>

            <h2>Login Required</h2>

            <p>
              Please login first to book a doctor appointment. You can still explore
              doctors, services, blogs, and contact pages without logging in.
            </p>

            {pendingDoctorForBooking && (
              <div className="login-prompt-doctor">
                <span>Selected Doctor</span>
                <strong>{pendingDoctorForBooking.name}</strong>
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
                  setPendingDoctorForBooking(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {doctorDetailLoading && (
        <div className="modal-overlay">
          <div className="profile-modal-card">
            <h2>Loading doctor details...</h2>
            <p>Please wait while we fetch latest profile information.</p>
          </div>
        </div>
      )}

      {doctorDetailError && (
        <div className="modal-overlay" onClick={() => setDoctorDetailError("")}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-x" onClick={() => setDoctorDetailError("")}>×</button>
            <h2>Unable to load profile</h2>
            <p>{doctorDetailError}</p>
          </div>
        </div>
      )}
      {/* --- DOCTOR PROFILE MODAL --- */}
      {selectedDoctor && (
        <div className="modal-overlay" onClick={() => setSelectedDoctor(null)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-x" onClick={() => setSelectedDoctor(null)}>×</button>

            <div className="modal-header-top">
              <img
                src={getSafeDoctorImage(selectedDoctor?.profileImage)}
                alt={selectedDoctor.name || "Doctor"}
                className="modal-avatar"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = defaultDoctorAvatar;
                }}
              />

              <div className="modal-title-info">
                <h2>{selectedDoctor.name || "Doctor"}</h2>

                <span className="modal-spec-badge">
                  {selectedDoctor.specialty}
                </span>

                <p>⭐ 4.9/5 (Verified Professional)</p>
              </div>
            </div>

            <div className="modal-body-content">
              <div className="info-row">
                <strong>📍 Location:</strong>{" "}
                {selectedDoctor.city || "Location not updated"}, India
              </div>

              <div className="info-row">
                <strong>🏥 Primary Clinic:</strong>{" "}
                {selectedDoctor.hospitalName || "Clinic not updated"}
              </div>

              <div className="info-row">
                <strong>🎓 Education:</strong>{" "}
                {selectedDoctor.degrees?.length > 0
                  ? selectedDoctor.degrees.join(", ")
                  : "Not updated"}
              </div>

              <div className="info-row">
                <strong>🩺 Specializations:</strong>{" "}
                {selectedDoctor.specializations?.length > 0
                  ? selectedDoctor.specializations.join(", ")
                  : selectedDoctor.specialty}
              </div>

              <div className="info-row">
                <strong>⏳ Experience:</strong>{" "}
                {selectedDoctor.experience || 0}+ Years
              </div>

              <div className="info-row">
                <strong>💰 Consultation Fee:</strong> ₹{selectedDoctor.fees || 500}
              </div>

              <div className="info-row">
                <strong>🏛️ Council:</strong>{" "}
                {selectedDoctor.councilName || "Not updated"}
              </div>

              <div className="info-row">
                <strong>📄 Registration:</strong>{" "}
                {selectedDoctor.registrationNumber || "Not updated"}
                {selectedDoctor.registrationYear
                  ? ` (${selectedDoctor.registrationYear})`
                  : ""}
              </div>

              {selectedDoctor.clinics?.length > 0 && (
                <div className="modal-bio-box">
                  <strong>Clinics / Hospitals:</strong>

                  {selectedDoctor.clinics.map((clinic) => (
                    <p key={clinic.id}>
                      {clinic.isPrimary ? "⭐ " : ""}
                      {clinic.clinicName} — {clinic.city}
                      {clinic.area ? `, ${clinic.area}` : ""}
                      {clinic.consultationFee
                        ? ` • ₹${clinic.consultationFee}`
                        : ""}
                    </p>
                  ))}
                </div>
              )}

              <div className="modal-bio-box">
                <strong>About Doctor:</strong>
                <p>{selectedDoctor.bio || `Verified expert in ${selectedDoctor.specialty}.`}</p>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="primary-modal-btn"
                onClick={() => handleBookAppointment(selectedDoctor)}
              >
                Book Appointment Now
              </button>

              <button
                className="secondary-modal-btn"
                onClick={() => {
                  setSelectedDoctor(null);
                  navigate(`/patient/doctorsprofile/${selectedDoctor.id}`, {
                    state: selectedDoctor
                  });
                }}
              >
                View Full Profile
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- MOBILE SIDEBAR (PREMIUM UPDATED) --- */}
      <aside className={`mobile-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2 style={{ color: 'var(--primary)', fontWeight: '800' }}>Doc<span>Hub</span></h2>
          <button onClick={() => setIsSidebarOpen(false)} className="close-sidebar-btn">×</button>
        </div>

        <div className="sidebar-content">
          {/* Professional User Card in Sidebar with Sub-menu */}
          {currentUser && (
            <div className="sidebar-user-container">
              {/* Profile Card - Click karne par dropdown toggle hoga */}
              <div
                className={`sidebar-profile-card ${patientSub ? "expanded" : ""}`}
                onClick={() => setPatientSub(!patientSub)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px' }}
              >
                <div className="sidebar-avatar">
                  {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="sidebar-info" style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '14px' }}>{currentUser.fullName || "User"}</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{currentUser.email}</p>
                </div>
                {/* Down arrow for open, Up arrow for close */}
                <span className="side-chevron">
                  {patientSub ? "▲" : "▼"}
                </span>
              </div>

              {/* Sidebar Profile Sub-Menu - Sirf patientSub true hone par dikhega */}
              {patientSub && (
                <div className="sidebar-inner-dropdown" style={{ paddingLeft: '15px', marginTop: '5px' }}>

                  {/* Edit Profile Option */}
                  <div className="dropdown-item" onClick={() => {
                    const rolePath = currentUser?.role?.toLowerCase() || "patient";
                    navigate(`/${rolePath}/profile`);
                    setPatientSub(false); // Click ke baad band karne ke liye
                  }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', cursor: 'pointer' }}>
                    <span>👤</span> Edit Profile
                  </div>

                  {/* Dashboard Option */}
                  <div className="dropdown-item" onClick={() => {
                    const rolePath = currentUser?.role?.toLowerCase() || "patient";
                    navigate(`/${rolePath}/dashboard`);
                    setPatientSub(false); // Click ke baad band karne ke liye
                  }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', cursor: 'pointer' }}>
                    <span>📊</span> Dashboard
                  </div>

                </div>
              )}
            </div>
          )}

          <p className="sidebar-label">Navigation</p>
          <div className="sidebar-link active-side" onClick={() => { navigate("/"); setIsSidebarOpen(false); }}>🏠 Home</div>
          <div className="sidebar-link" onClick={() => { navigate("/about"); setIsSidebarOpen(false); }}>ℹ️ About Us</div>
          <div className="sidebar-link" onClick={() => { navigate("/all-services"); setIsSidebarOpen(false); }}>🛠️ Services</div>
          <div className="sidebar-link" onClick={() => { navigate("/blogs"); setIsSidebarOpen(false); }}>📰 Doctor Blogs</div>
          <div className="sidebar-link" onClick={() => { navigate("/contact"); setIsSidebarOpen(false); }}>📞 Contact Us</div>
        </div>

        <div className="sidebar-footer">
          {!currentUser ? (
            <div className="sidebar-auth-grid">
              <button className="secondary-btn-mob" onClick={() => navigate("/login")}>Login</button>
              <button className="primary-btn-mob" onClick={() => navigate("/signup")}>Sign Up</button>
            </div>
          ) : (
            <button className="primary-btn-mob logout-red" onClick={handleLogout}>Logout</button>
          )}
        </div>
      </aside>

      {/* ---------------- HEADER (LAPTOP FIX) ---------------- */}
      <header className="home-header">
        <div className="header-brand" onClick={() => navigate("/")}>
          <img src={Logo} alt="Doctor's Hub Logo" className="logo-img" />
          <h1>Doctor's <span>Hub</span></h1>
        </div>

        <nav className="header-nav desktop-only">
          <span className="nav-item active-tab" onClick={() => navigate("/")}>Home</span>
          <span className="nav-item" onClick={() => navigate("/about")}>About Us</span>
          <span className="nav-item" onClick={() => navigate("/all-services")}>Services</span>
          <span className="nav-item" onClick={() => navigate("/blogs")}>Doctor Blogs</span>
          <span className="nav-item" onClick={() => navigate("/contact")}>Contact Us</span>
        </nav>

        <div className="auth-buttons">
          {!currentUser ? (
            <>
              <button className="login-btn-styled desktop-only" onClick={() => navigate("/login")}>Login</button>
              <button className="primary-btn-styled desktop-only" onClick={() => navigate("/signup")}>SignUp</button>
            </>
          ) : (
            <div className="profile-wrapper desktop-only" ref={dropdownRef}>
              <div className="profile-icon" onClick={() => setDropdownOpen(!dropdownOpen)}>
                {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : "U"}
              </div>

              {dropdownOpen && (
                <div className="dropdown-menu alignment-fix">
                  <div className="user-info-header">
                    <div className="user-avatar-mini">
                      {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : "P"}
                    </div>
                    <div className="user-details">
                      <p className="user-name">{currentUser.fullName}</p>
                      <p className="user-email">{currentUser.email}</p>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  {/* --- Profile Dropdown Items (Role-Based) --- */}
                  <div className="dropdown-divider"></div>

                  <div className="dropdown-item" onClick={() => {
                    // Role check for Edit Profile
                    if (currentUser?.role === "ADMIN") {
                      navigate("/admin/profile");
                    } else if (currentUser?.role === "DOCTOR") {
                      navigate("/doctor/profile");
                    } else {
                      navigate("/patient/profile");
                    }
                  }}>
                    <span>👤</span> Edit Profile
                  </div>

                  <div className="dropdown-item" onClick={() => {
                    // Role check for Dashboard
                    if (currentUser?.role === "ADMIN") {
                      navigate("/admin/dashboard");
                    } else if (currentUser?.role === "DOCTOR") {
                      navigate("/doctor/dashboard");
                    } else {
                      navigate("/patient/dashboard");
                    }
                  }}>
                    <span>📊</span> Dashboard
                  </div>
                  <div className="dropdown-item logout-btn" onClick={handleLogout}><span>🚪</span> Logout</div>
                </div>
              )}
            </div>
          )}
          <button className="hamburger-menu" onClick={() => setIsSidebarOpen(true)}>☰</button>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content-main">
            <span className="hero-badge-top">✨ Verified Professionals Only</span>
            <h2>Find Your <br /><span>Trusted Expert</span></h2>
            <div className="search-box-centered">
              <div className="search-input-wrapper">
                <span className="search-icon-hero">🔍</span>
                <input
                  type="text"
                  placeholder="Search doctors, clinics, hospitals..."
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                />
                {searchText && (
                  <button
                    className="search-clear-btn"
                    onClick={() => {
                      setSearchText("");
                      setShowSearchResults(false);
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
              <button className="hero-search-btn" onClick={handleSearchSubmit}>
                Search
              </button>
            </div>
            <div className="trending-tags">
              <span className="trending-label">🔥 Trending  :-</span>
              <div className="tags-flex">
                {trendingSearches.map((item) => (
                  <button
                    key={item}
                    className="trend-tag"
                    onClick={() => {
                      setSearchText(item);
                      setDebouncedSearchText(item);
                      setShowSearchResults(true);
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="hero-visual desktop-only">
            <img src={heroImg} alt="Doctor" />
          </div>
        </div>
      </section>
      {showSearchResults && searchText && (
        <section className="search-results">
          <h2 className="section-title">
            Doctors Found: {searchResults.filter(i => i.type === "doctor").length}
          </h2>
          {searchLoading && (
            <div className="no-results-box" style={{ textAlign: "center", width: "100%", padding: "30px" }}>
              <h3>Searching doctors...</h3>
              <p>Please wait.</p>
            </div>
          )}

          {searchError && !searchLoading && (
            <div className="no-results-box" style={{ textAlign: "center", width: "100%", padding: "30px" }}>
              <h3>{searchError}</h3>
              <p>Please try again.</p>
            </div>
          )}
          {/* Yahan 'doctor-grid-v3' class use karo consistency ke liye */}
          <div className="doctor-grid-v3">
            {searchResults.filter(item => item.type === "doctor").length > 0 ? (
              searchResults
                .filter((item) => item.type === "doctor")
                .map((item, index) => {
                  const doc = item.data;
                  return (
                    /* Same structure as your Expert Healthcare Team section */
                    <div
                      key={doc.id || index}
                      className="premium-v3-card"
                      onClick={() => openDoctorModal(doc.id)}
                    >
                      {/* TOP IMAGE */}
                      <div className="v3-card-top">
                        <img src={getSafeDoctorImage(selectedDoctor?.profileImage)} alt={doc.name || "Doctor"} onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = defaultDoctorAvatar;
                        }} />
                        <div className="v3-rating">⭐ 4.9</div>
                      </div>

                      {/* BODY */}
                      <div className="v3-card-body">
                        <h3>{doc.name || "Doctor"}</h3>
                        <p className="v3-spec">{doc.specialty}</p>
                        <p className="v3-loc">📍 {doc.city}</p>
                        <p className="v3-exp">💼 {doc.experience || 10}+ yrs</p>
                        <p className="v3-fee">💰 ₹{doc.fees || 500}</p>

                        {/* BUTTONS */}
                        <div className="v3-btn-group">
                          <button
                            className="v3-btn secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDoctor(doc);
                            }}
                          >
                            View Details
                          </button>

                          <button
                            className="v3-btn secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookAppointment(doc);
                            }}
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="no-results-box" style={{ textAlign: 'center', width: '100%', padding: '40px' }}>
                <h3>No Doctors Found</h3>
                <p>Try searching for a different specialty or name.</p>
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
              <div className="ad-content-left" key={adIndex}>
                <span className="ad-badge">{ads[adIndex].badge}</span>
                <h3 className="fade-in-text">{ads[adIndex].title}</h3>
                <p className="fade-in-text">{ads[adIndex].desc}</p>
              </div>
              <button className="visit-hosp-btn">{ads[adIndex].btnText}</button>
            </div>
          </section>

          {/* --- SPECIALTY GRID --- */}
          <section className="specialties-section">
            <div className="specialties-grid">
              {specialties.slice(0, 10).map((spec, i) => (
                <div key={i} className="spec-chip" onClick={() => {
                  setSearchText(spec.name)
                  setShowSearchResults(true)
                }}>
                  <span className="spec-icon-box">{spec.icon}</span>
                  <span className="spec-name-box">{spec.name}</span>
                </div>
              ))}
            </div>
          </section>


          {/* --- Doctor section --- */}
          <section className="doctors-section">
            <div className="section-header-pro">
              <h2>Expert <span>Healthcare Team</span></h2>
              <div className="accent-line-small"></div>
            </div>

            <div className="doctor-grid-v3">
              {doctorLoading || searchLoading ? (
                <div className="no-results-box" style={{ textAlign: "center", width: "100%", padding: "40px" }}>
                  <h3>Loading doctors...</h3>
                  <p>Please wait while we fetch verified doctors.</p>
                </div>
              ) : doctorError || searchError ? (
                <div className="no-results-box" style={{ textAlign: "center", width: "100%", padding: "40px" }}>
                  <h3>{doctorError || searchError}</h3>
                  <p>Please try again after some time.</p>
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="no-results-box" style={{ textAlign: "center", width: "100%", padding: "40px" }}>
                  <h3>No verified doctors available</h3>
                  <p>Doctors will appear here once admin verifies them.</p>
                </div>
              ) : (
                filteredDoctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="premium-v3-card"
                    onClick={() => openDoctorModal(doc.id)}
                  >
                    {/* TOP IMAGE */}
                    <div className="v3-card-top">
                      <img src={getSafeDoctorImage(selectedDoctor?.profileImage)} alt={doc.name || "Doctor"} onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = defaultDoctorAvatar;
                      }} />
                      <div className="v3-rating">⭐ 4.9</div>
                    </div>

                    {/* BODY */}
                    <div className="v3-card-body">
                      <h3>{doc.name || "Doctor"}</h3>
                      <p className="v3-spec">{doc.specialty}</p>
                      <p className="v3-loc">📍 {doc.city}</p>
                      <p className="v3-exp">💼 {doc.experience || 10}+ yrs</p>
                      <p className="v3-fee">💰 ₹{doc.fees || 500}</p>

                      {/* BUTTONS */}
                      <div className="v3-btn-group">
                        <button
                          className="v3-btn secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDoctorModal(doc.id);
                          }}
                        >
                          View Details
                        </button>

                        <button
                          className="v3-btn secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookAppointment(doc);
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
              <h2>Specialized Care & <span>Costs</span></h2>
              <p className="section-sub-tag">🛡️ Cashless Insurance & 0% EMI Options Available</p>
              <div className="accent-line-small"></div>
            </div>

            <div className="costs-grid">
              {costPackages.map((pkg, idx) => (
                <div key={idx} className="cost-card-styled" onClick={() => setSelectedCost(pkg)}>
                  <div className="pkg-badge">{pkg.badge}</div>
                  <div className="cost-image-box">
                    <img src={pkg.image} alt={pkg.title} />
                  </div>
                  <h4>{pkg.title}</h4>
                  <p className="pkg-desc-text">{pkg.desc}</p>

                  <ul className="pkg-mini-features">
                    {pkg.features.map((feat, i) => (
                      <li key={i}><span>✓</span> {feat}</li>
                    ))}
                  </ul>

                  <div className="cost-info-footer">
                    <div className="cost-price-tag">Starts ₹{pkg.price}</div>
                    {pkg.emi !== "N/A" && <div className="emi-tag">EMI: {pkg.emi}</div>}
                  </div>
                  <button className="pkg-book-btn">Get Free Quote</button>
                </div>
              ))}
            </div>

            {/* POPUP MODAL */}
            {selectedCost && (
              <div className="modal-overlay" onClick={() => setSelectedCost(null)}>
                <div className="cost-modal-card" onClick={(e) => e.stopPropagation()}>
                  <button className="modal-close-x" onClick={() => setSelectedCost(null)}>×</button>
                  <div className="modal-header">
                    <div className="cost-image-box">
                      <img src={selectedCost.image} alt={selectedCost.title} />
                    </div>
                    <h2>{selectedCost.title}</h2>
                    <span className="pkg-badge">{selectedCost.badge}</span>
                  </div>
                  <p className="pkg-desc-text">{selectedCost.desc}</p>
                  <ul className="pkg-mini-features">
                    {selectedCost.features.map((feat, i) => (
                      <li key={i}><span>✓</span> {feat}</li>
                    ))}
                  </ul>
                  <div className="cost-info-footer">
                    <div className="cost-price-tag">Starts ₹{selectedCost.price}</div>
                    {selectedCost.emi !== "N/A" && <div className="emi-tag">EMI: {selectedCost.emi}</div>}
                  </div>
                  <button className="know-more-btn">Know More</button>
                </div>
              </div>
            )}
          </section>
          {/* --- SHOWCASE SECTION WITH POPUP --- */}
          <section className="showcase-section">
            <div className="section-header-pro">
              <h2>Latest <span>Updates</span></h2>
              <div className="accent-line-small"></div>
              <p className="section-sub-tag">Stay updated with new doctors, hospitals, treatments & medicines</p>
            </div>

            <div className="showcase-grid">
              {[
                { title: "Dr. A. Sharma Joined", type: "Doctor", desc: "Cardiologist with 15 yrs experience", badge: "New" },
                { title: "City Care Hospital Upgrade", type: "Hospital", desc: "Now with Robotic Surgery", badge: "Featured" },
                { title: "Diabetes Awareness Campaign", type: "Disease", desc: "Free screening this month", badge: "Alert" },
                { title: "New Medicine: CardioPlus", type: "Medicine", desc: "Reduces cholesterol effectively", badge: "New" }
              ].map((item, idx) => (
                <div key={idx} className="showcase-card" onClick={() => setSelectedShowcase(item)}>
                  <div className={`showcase-badge badge-${item.badge.toLowerCase()}`}>{item.badge}</div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                  <span className="showcase-type">{item.type}</span>
                </div>
              ))}
            </div>

            {/* Popup */}
            {selectedShowcase && (
              <div className="popup-overlay" onClick={() => setSelectedShowcase(null)}>
                <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                  <h3>{selectedShowcase.title}</h3>
                  <p><strong>Type:</strong> {selectedShowcase.type}</p>
                  <p>{selectedShowcase.desc}</p>
                  <div className="popup-btn-group">
                    <button className="popup-btn-knowmore" onClick={() => navigate("/blogs")}>Know More</button>
                    <button className="popup-btn-close" onClick={() => setSelectedShowcase(null)}>Close</button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </>
      )}
      {showBooking && bookingDoctor && (
        <div className="booking-modal-overlay" onClick={closeBookingModal}>
          <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>

            <button className="modal-close" onClick={closeBookingModal}>✕</button>

            <div className="booking-scroll">

              <h2>Book Appointment</h2>

              {bookingMessage && (
                <div className={`booking-inline-message ${bookingMessageType}`}>
                  {bookingMessage}
                </div>
              )}

              <div className="booking-doctor">
                <img src={getSafeDoctorImage(selectedDoctor?.profileImage)} alt=""
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = defaultDoctorAvatar;
                  }} />
                <div>
                  <h3>{bookingDoctor.name || "Doctor"}</h3>
                  <p>{bookingDoctor.city}</p>
                </div>
              </div>

              <div className="booking-section">
                <p>Select Clinic</p>

                <select
                  value={bookingClinicId || ""}
                  onChange={(e) => setBookingClinicId(Number(e.target.value))}
                >
                  {bookingDoctor.clinics.map(clinic => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.clinicName} - ₹{clinic.consultationFee}
                    </option>
                  ))}
                </select>
              </div>

              <div className="booking-section">
                <p>Select Date</p>

                <div className="date-list">
                  {[0, 1, 2, 3, 4, 5, 6].map(day => {
                    const d = new Date();
                    d.setDate(d.getDate() + day);

                    return (
                      <button
                        key={day}
                        className={`date-chip ${bookingDateOffset === day ? "active" : ""}`}
                        onClick={() => setBookingDateOffset(day)}
                      >
                        {d.toDateString().slice(0, 10)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="booking-section">
                <p>Select Slot</p>

                <div className="slot-list">

                  {bookingSlotLoading ? (
                    <p className="slot-empty-text">Loading slots...</p>
                  ) : bookingSlots.length === 0 ? (
                    <p className="slot-empty-text">No slots available for this date.</p>
                  ) : (
                    bookingSlots.map(slot => (
                      <button
                        key={slot.startTime}
                        disabled={slot.status === "BOOKED"}
                        className={`slot ${selectedBookingSlot?.startTime === slot.startTime ? "active" : ""
                          }`}
                        onClick={() => setSelectedBookingSlot(slot)}
                      >
                        {slot.displayTime || slot.startTime}
                      </button>
                    ))
                  )}

                </div>

                {bookingSlotError && <p>{bookingSlotError}</p>}
              </div>

              <button
                className="primary-btn confirm-btn"
                onClick={confirmBooking}
              >
                {bookingLoading ? "Booking..." : "Confirm Appointment"}
              </button>

            </div>

          </div>
        </div>
      )}

      {/* --- FOOTER --- */}
      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-column brand-col">
            <h2 className="footer-logo">Doc<span style={{ color: 'var(--text-dark)', background: 'white', padding: '0 5px', borderRadius: '4px', marginLeft: '5px' }}>Hub</span></h2>
            <p className="footer-desc">
              Mumbai's trusted healthcare network. Booking appointments,
              finding labs, and managing health records made simple.
            </p>
            <div className="footer-socials">
              <ul className="example-1">
                {/* Facebook */}
                <li className="icon-content">
                  <a href="#" aria-label="Facebook" data-social="facebook" className="link">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                      <path d="M29.059 15.085C29.058 7.322 22.764 1.028 15 1.028S0.941 7.323 0.941 15.087c0 6.989 5.1 12.787 11.781 13.875l0.081 0.011V19.15H9.232v-4.065h3.57v-3.096a4.962 4.962 0 0 1 5.329 -5.469l-0.017 -0.001c1.124 0.016 2.212 0.115 3.273 0.292l-0.126 -0.018v3.459h-1.774a2.033 2.033 0 0 0 -2.291 2.204l-0.001 -0.008v2.636h3.899l-0.623 4.065h-3.276v9.823c6.762 -1.101 11.862 -6.899 11.863 -13.888" fill="currentColor"></path>
                    </svg>
                  </a>
                  <div className="tooltip">Facebook</div>
                </li>

                {/* Instagram */}
                <li className="icon-content">
                  <a href="#" aria-label="Instagram" data-social="instagram" className="link">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="currentColor"></path>
                    </svg>
                  </a>
                  <div className="tooltip">Instagram</div>
                </li>

                {/* LinkedIn */}
                <li className="icon-content">
                  <a href="#" aria-label="LinkedIn" data-social="linkedin" className="link">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" fill="currentColor"></path>
                    </svg>
                  </a>
                  <div className="tooltip">LinkedIn</div>
                </li>

                {/* WhatsApp */}
                <li className="icon-content">
                  <a href="#" aria-label="WhatsApp" data-social="whatsapp" className="link">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.407 3.481s3.48 5.223 3.48 8.405c-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.3 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" fill="currentColor"></path>
                    </svg>
                  </a>
                  <div className="tooltip">WhatsApp</div>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-column">
            <h4>Services</h4>
            <ul className="footer-list">
              <li onClick={() => navigate("/all-services")}>Find Doctors</li>
              <li onClick={() => navigate("/all-services")}>Find Hospitals</li>
              <li onClick={() => navigate("/all-services")}>Find Labs</li>

            </ul>
          </div>

          <div className="footer-column">
            <h4>Support</h4>
            <ul className="footer-list">
              <li onClick={() => navigate("/")}>Home</li>
              <li onClick={() => navigate("/about")}>About Us</li>
              <li onClick={() => navigate("/blogs")}>Doctor Blogs</li>
              <li onClick={() => navigate("/all-services")}>Services</li>
              <li onClick={() => navigate("/contact")}>Contact Us</li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Contact Us</h4>
            <div className="footer-contact-info">
              <p>📍 Andheri West, Mumbai, MH</p>
              <p>📞 +91 98765 - 43210</p>
              <p>✉️ support@dochub.com</p>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p>&copy; 2026 Doctor's Hub Mumbai. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;