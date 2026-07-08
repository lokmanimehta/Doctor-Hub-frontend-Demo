import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./AllServices.css";
import Logo from "../../assets/images/logo.jpeg";
import { AuthContext } from "../../context/AuthContext";
import { useAuthActions } from "../../services/authService";
import { useProfile } from "../../context/useProfile";
import defaultDoctorAvatar from "../../assets/images/avtar.png";
const DEFAULT_DOCTOR_IMAGE =
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=800";

const DEFAULT_LAB_IMAGE =
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800";
const getSafeDoctorImage = (url) => {
  if (!url || typeof url !== "string") return defaultDoctorAvatar;

  if (url.includes("localhost:8080")) {
    return defaultDoctorAvatar;
  }

  return url;
};
const StandardToggle = ({ id, checked, onChange }) => {
  return (
    <label className="switch-container" htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        checked={checked || false}
        onChange={onChange || (() => { })}
      />
      <span className="slider-round"></span>
    </label>
  );
};

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
  return [doctor?.area, doctor?.city].filter(Boolean).join(", ") || "Location not updated";
};

const getLabLocation = (lab) => {
  return [lab?.area, lab?.city, lab?.state].filter(Boolean).join(", ") || "Location not updated";
};

const getDoctorRating = (doctor) => {
  if (doctor?.avgRating === null || doctor?.avgRating === undefined) return "New";
  return Number(doctor.avgRating).toFixed(1);
};

const getLabRating = () => {
  return "Verified";
};

const AllServicesPage = () => {
  const navigate = useNavigate();

  const { currentUser, setCurrentUser } = useContext(AuthContext);
  const { logoutUser } = useAuthActions(setCurrentUser);
  const { clearProfile, selectedProfile } = useProfile();

  const [search, setSearch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarProfileOpen, setSidebarProfileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const doctorScrollRef = useRef(null);
  const hospitalScrollRef = useRef(null);
  const labScrollRef = useRef(null);

  const [doctors, setDoctors] = useState([]);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorError, setDoctorError] = useState("");

  const [labs, setLabs] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [labLoading, setLabLoading] = useState(false);
  const [labError, setLabError] = useState("");

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDoctorDetail, setSelectedDoctorDetail] = useState(null);
  const [doctorDetailLoading, setDoctorDetailLoading] = useState(false);
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const [showDoctorProfileModal, setShowDoctorProfileModal] = useState(false);
  const [showDoctorBookingModal, setShowDoctorBookingModal] = useState(false);

  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");

  const [selectedHospital, setSelectedHospital] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [preview, setPreview] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [selectedLab, setSelectedLab] = useState(null);
  const [showLabModal, setShowLabModal] = useState(false);
  const [activeTab, setActiveTab] = useState("Available Tests");
  const [selectedTests, setSelectedTests] = useState([]);
  const [modalSearch, setModalSearch] = useState("");
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [homePickup, setHomePickup] = useState(false);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [hospitalsError, setHospitalsError] = useState("");
  const [hospitalDepartments, setHospitalDepartments] = useState([]);
  const [hospitalSlots, setHospitalSlots] = useState([]);
  const [hospitalDeptLoading, setHospitalDeptLoading] = useState(false);
  const [hospitalSlotLoading, setHospitalSlotLoading] = useState(false);
  const [hospitalBookingLoading, setHospitalBookingLoading] = useState(false);
  const [hospitalSelectedDepartment, setHospitalSelectedDepartment] = useState(null);
  const [hospitalSelectedDate, setHospitalSelectedDate] = useState(1);
  const [hospitalSelectedSlot, setHospitalSelectedSlot] = useState(null);
  const [hospitalPatientNote, setHospitalPatientNote] = useState("");
  const [hospitalBookingMessage, setHospitalBookingMessage] = useState("");
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [loginRedirectPath, setLoginRedirectPath] = useState("");
  const packagesData = useMemo(
    () => [
      { id: 101, name: "Comprehensive Health Package", price: 2999, parameters: 85 },
      { id: 102, name: "Basic Health Screen", price: 999, parameters: 40 },
    ],
    []
  );

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setHospitalsLoading(true);
        setHospitalsError("");

        const response = await api.get("/public/hospitals");
        setHospitals(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Failed to fetch hospitals", error);
        setHospitalsError("Unable to load hospitals right now.");
      } finally {
        setHospitalsLoading(false);
      }
    };

    fetchHospitals();
  }, []);

  const handleLogout = async () => {
    clearProfile();
    setDropdownOpen(false);
    setSidebarProfileOpen(false);
    setIsSidebarOpen(false);
    await logoutUser();
  };

  const handleProtectedViewAll = (path) => {
    if (!currentUser) {
      setLoginRedirectPath(path);
      setLoginPromptOpen(true);
      return;
    }

    navigate(path);
  };
  const navigateToRoleProfile = () => {
    if (!currentUser) return;

    if (currentUser.role === "DOCTOR") {
      navigate("/doctor/profile");
      return;
    }

    if (currentUser.role === "ADMIN") {
      navigate("/admin/profile");
      return;
    }

    navigate("/patient/profile");
  };

  const navigateToRoleDashboard = () => {
    if (!currentUser) return;

    if (currentUser.role === "DOCTOR") {
      navigate("/doctor/dashboard");
      return;
    }

    if (currentUser.role === "ADMIN") {
      navigate("/admin/dashboard");
      return;
    }

    navigate("/patient/dashboard");
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setDoctorLoading(true);
        setDoctorError("");

        const response = await api.get("/public/doctors?page=0&size=8");
        setDoctors(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Failed to fetch doctors", error);
        setDoctorError("Unable to load doctors right now.");
      } finally {
        setDoctorLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  useEffect(() => {
    const fetchLabsAndTests = async () => {
      try {
        setLabLoading(true);
        setLabError("");

        const [labsResponse, testsResponse] = await Promise.all([
          api.get("/public/labs"),
          api.get("/public/lab-tests"),
        ]);

        setLabs(Array.isArray(labsResponse.data) ? labsResponse.data : []);
        setLabTests(Array.isArray(testsResponse.data) ? testsResponse.data : []);
      } catch (error) {
        console.error("Failed to fetch labs/tests", error);
        setLabError("Unable to load labs right now.");
      } finally {
        setLabLoading(false);
      }
    };

    fetchLabsAndTests();
  }, []);

  useEffect(() => {
    const initDragScroll = (ref) => {
      const slider = ref.current;
      if (!slider) return undefined;

      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;

      const onMouseDown = (e) => {
        isDown = true;
        slider.classList.add("active-drag");
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      };

      const onMouseLeave = () => {
        isDown = false;
        slider.classList.remove("active-drag");
      };

      const onMouseUp = () => {
        isDown = false;
        slider.classList.remove("active-drag");
      };

      const onMouseMove = (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2;
        slider.scrollLeft = scrollLeft - walk;
      };

      slider.addEventListener("mousedown", onMouseDown);
      slider.addEventListener("mouseleave", onMouseLeave);
      slider.addEventListener("mouseup", onMouseUp);
      slider.addEventListener("mousemove", onMouseMove);

      return () => {
        slider.removeEventListener("mousedown", onMouseDown);
        slider.removeEventListener("mouseleave", onMouseLeave);
        slider.removeEventListener("mouseup", onMouseUp);
        slider.removeEventListener("mousemove", onMouseMove);
      };
    };

    const cleanupDoctor = initDragScroll(doctorScrollRef);
    const cleanupHospital = initDragScroll(hospitalScrollRef);
    const cleanupLab = initDragScroll(labScrollRef);

    return () => {
      cleanupDoctor?.();
      cleanupHospital?.();
      cleanupLab?.();
    };
  }, [doctors.length, hospitals.length, labs.length]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showDoctorProfileModal || showDoctorBookingModal || selectedHospital || showLabModal || preview) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showDoctorProfileModal, showDoctorBookingModal, selectedHospital, showLabModal, preview]);

  const filteredDoctors = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return doctors;

    return doctors.filter((doctor) => {
      const searchable = [
        doctor.fullName,
        doctor.primarySpecialization,
        doctor.clinicName,
        doctor.city,
        doctor.area,
        doctor.consultationFee,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [doctors, search]);

  const filteredHospitals = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return hospitals;

    return hospitals.filter((hospital) => {
      const searchable = [
        hospital.hospitalName,
        hospital.city,
        hospital.area,
        hospital.address,
        hospital.rating,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [hospitals, search]);

  const getHospitalImages = (hospital) => {
    if (Array.isArray(hospital?.imageUrls) && hospital.imageUrls.length > 0) {
      return hospital.imageUrls;
    }

    if (hospital?.imageUrl) {
      return [hospital.imageUrl];
    }

    return [];
  };

  const getCurrentHospitalImage = () => {
    const images = getHospitalImages(selectedHospital);
    return images[currentImageIndex] || selectedHospital?.imageUrl || "";
  };

  const goToNextHospitalImage = () => {
    const images = getHospitalImages(selectedHospital);
    if (images.length <= 1) return;

    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const goToPreviousHospitalImage = () => {
    const images = getHospitalImages(selectedHospital);
    if (images.length <= 1) return;

    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const filteredLabs = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return labs;

    return labs.filter((lab) => {
      const searchable = [
        lab.name,
        lab.city,
        lab.area,
        lab.state,
        lab.addressLine1,
        lab.addressLine2,
        ...(lab.services || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [labs, search]);

  const handleOpenHospitalModal = async (hospital) => {
    setSelectedHospital(hospital);
    setCurrentImageIndex(0);
    setHospitalDepartments([]);
    setHospitalSlots([]);
    setHospitalSelectedDepartment(null);
    setHospitalSelectedDate(1);
    setHospitalSelectedSlot(null);
    setHospitalPatientNote("");
    setHospitalBookingMessage("");

    try {
      setHospitalDeptLoading(true);

      const response = await api.get(`/public/hospitals/${hospital.id}/departments`);
      const departments = Array.isArray(response.data) ? response.data : [];

      setHospitalDepartments(departments);
      setHospitalSelectedDepartment(departments[0] || null);
    } catch (error) {
      console.error("Failed to fetch hospital departments", error);
      setHospitalBookingMessage("Unable to load hospital departments.");
    } finally {
      setHospitalDeptLoading(false);
    }
  };

  useEffect(() => {
    const fetchHospitalSlots = async () => {
      if (!selectedHospital?.id || !hospitalSelectedDepartment?.id) return;

      try {
        setHospitalSlotLoading(true);
        setHospitalBookingMessage("");
        setHospitalSelectedSlot(null);

        const date = formatDateForApi(hospitalSelectedDate);

        const response = await api.get(
          `/public/hospitals/${selectedHospital.id}/departments/${hospitalSelectedDepartment.id}/slots?date=${date}`
        );

        setHospitalSlots(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Failed to fetch hospital slots", error);
        setHospitalSlots([]);
        setHospitalBookingMessage("Unable to load slots for selected date.");
      } finally {
        setHospitalSlotLoading(false);
      }
    };

    fetchHospitalSlots();
  }, [selectedHospital?.id, hospitalSelectedDepartment?.id, hospitalSelectedDate]);

  const handleHospitalBooking = async () => {
    if (!currentUser) {
      alert("Please login first to book hospital appointment");
      navigate("/login");
      return;
    }

    if (currentUser.role !== "PATIENT") {
      setHospitalBookingMessage("Only patients can book hospital appointments.");
      return;
    }

    if (!selectedProfile) {
      alert("Please select patient profile first");
      navigate("/patient/profile");
      return;
    }

    if (!selectedHospital?.id) {
      setHospitalBookingMessage("Please select hospital.");
      return;
    }

    if (!hospitalSelectedDepartment?.id) {
      setHospitalBookingMessage("Please select department.");
      return;
    }

    if (!hospitalSelectedSlot?.startTime) {
      setHospitalBookingMessage("Please select an available slot.");
      return;
    }

    try {
      setHospitalBookingLoading(true);
      setHospitalBookingMessage("");

      const payload = {
        hospitalId: selectedHospital.id,
        departmentId: hospitalSelectedDepartment.id,
        patientProfileId: selectedProfile.id,
        appointmentDate: formatDateForApi(hospitalSelectedDate),
        slotStartTime: hospitalSelectedSlot.startTime,
        slotEndTime: hospitalSelectedSlot.endTime,
        patientNote: hospitalPatientNote || "Booked from services page",
      };

      const response = await api.post("/patient/hospital-appointments", payload);

      if (response.data?.success) {
        setHospitalBookingMessage(response.data.message || "Hospital appointment booked successfully.");
        setShowConfirmation(true);
      } else {
        setHospitalBookingMessage(response.data?.message || "Unable to book hospital appointment.");
      }
    } catch (error) {
      console.error("Hospital appointment booking failed", error);
      setHospitalBookingMessage(
        error.response?.data?.message || "Unable to book hospital appointment."
      );
    } finally {
      setHospitalBookingLoading(false);
    }
  };

  const filteredTests = useMemo(() => {
    const q = modalSearch.trim().toLowerCase();

    if (!q) return labTests;

    return labTests.filter((test) => {
      const searchable = [test.testName, test.testCode, test.category, test.serviceType]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [labTests, modalSearch]);

  const subtotal =
    labTests
      .filter((test) => selectedTests.includes(test.id))
      .reduce((acc, curr) => acc + Number(curr.price || 0), 0) +
    packagesData
      .filter((pack) => selectedPackages.includes(pack.id))
      .reduce((acc, curr) => acc + Number(curr.price || 0), 0);

  const gst = Math.round(subtotal * 0.05);
  const serviceCharge = subtotal > 0 ? 50 : 0;
  const pickupFee = homePickup ? 120 : 0;
  const grandTotal = subtotal + gst + serviceCharge + pickupFee;

  const primaryClinic =
    selectedDoctorDetail?.clinics?.find((clinic) => clinic.isPrimary || clinic.primary) ||
    selectedDoctorDetail?.clinics?.[0] ||
    selectedDoctorDetail?.doctorClinics?.[0] ||
    null;

  const profileDoctor = selectedDoctorDetail || selectedDoctor;

  const detailClinics =
    selectedDoctorDetail?.clinics ||
    selectedDoctorDetail?.doctorClinics ||
    [];
  const clinicOptions =
    selectedDoctorDetail?.clinics ||
    selectedDoctorDetail?.doctorClinics ||
    [];

  const selectedBookingClinic =
    clinicOptions.find((clinic) => String(clinic.id) === String(selectedClinicId)) ||
    primaryClinic;
  const openDoctorProfile = async (doctor) => {
    setSelectedDoctor(doctor);
    setShowDoctorProfileModal(true);
    setShowDoctorBookingModal(false);
    setSelectedDoctorDetail(null);
    setDoctorDetailLoading(true);

    try {
      const response = await api.get(`/public/doctors/${doctor.doctorProfileId}`);

      setSelectedDoctorDetail(response.data);

      const clinics = response.data?.clinics || response.data?.doctorClinics || [];
      const defaultClinic =
        clinics.find((clinic) => clinic.isPrimary || clinic.primary) || clinics[0];

      setSelectedClinicId(defaultClinic?.id ? String(defaultClinic.id) : "");
    } catch (error) {
      console.error("Failed to fetch doctor detail", error);
      setSelectedDoctorDetail(null);
    } finally {
      setDoctorDetailLoading(false);
    }
  };

  const openDoctorBooking = async (doctor) => {
    setSelectedDoctor(doctor);
    setShowDoctorProfileModal(false);
    setShowDoctorBookingModal(true);
    setSelectedDoctorDetail(null);
    setSelectedClinicId("");
    setSelectedSlot(null);
    setSlots([]);
    setSlotError("");
    setBookingMessage("");
    setDoctorDetailLoading(true);

    try {
      const response = await api.get(`/public/doctors/${doctor.doctorProfileId}`);

      setSelectedDoctorDetail(response.data);

      const clinics = response.data?.clinics || response.data?.doctorClinics || [];
      const defaultClinic =
        clinics.find((clinic) => clinic.isPrimary || clinic.primary) || clinics[0];

      setSelectedClinicId(defaultClinic?.id ? String(defaultClinic.id) : "");
    } catch (error) {
      console.error("Failed to fetch doctor detail", error);
      setSlotError("Unable to load doctor clinic details.");
    } finally {
      setDoctorDetailLoading(false);
    }
  };

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!showDoctorBookingModal || !selectedDoctor?.doctorProfileId || !selectedBookingClinic?.id) return;
      try {
        setSlotLoading(true);
        setSlotError("");
        setSelectedSlot(null);

        const date = formatDateForApi(selectedDate);
        const response = await api.get(
          `/public/doctors/${selectedDoctor.doctorProfileId}/clinics/${selectedBookingClinic.id}/availability?date=${date}`);

        setSlots(Array.isArray(response.data?.slots) ? response.data.slots : []);
      } catch (error) {
        console.error("Failed to fetch availability", error);
        setSlots([]);
        setSlotError("Unable to load slots for selected date.");
      } finally {
        setSlotLoading(false);
      }
    };

    fetchAvailability();
  }, [showDoctorBookingModal, selectedDoctor?.doctorProfileId, selectedBookingClinic?.id, selectedDate]);
  const closeAllModals = () => {
    setShowDoctorProfileModal(false);
    setShowDoctorBookingModal(false);
    setSelectedDoctor(null);
    setSelectedDoctorDetail(null);
    setSelectedDate(0);
    setSelectedSlot(null);
    setSlots([]);
    setSlotError("");
    setBookingMessage("");

    setSelectedHospital(null);
    setCurrentImageIndex(0);
    setPreview(null);
    setShowConfirmation(false);
    setHospitalDepartments([]);
    setHospitalSlots([]);
    setHospitalSelectedDepartment(null);
    setHospitalSelectedDate(1);
    setHospitalSelectedSlot(null);
    setHospitalPatientNote("");
    setHospitalBookingMessage("");
    setHospitalBookingLoading(false);
    setSelectedLab(null);
    setShowLabModal(false);
    setActiveTab("Available Tests");
    setModalSearch("");
    setSelectedTests([]);
    setSelectedPackages([]);
    setHomePickup(false);
  };

  const handleConfirmAppointment = async () => {
    if (!currentUser) {
      alert("Please login first to book appointment");
      navigate("/login");
      return;
    }

    if (currentUser.role !== "PATIENT") {
      setBookingMessage("Only patients can book appointments.");
      return;
    }

    if (!selectedProfile) {
      alert("Please select patient profile first");
      navigate("/patient/profile");
      return;
    }

    if (!selectedDoctor?.doctorProfileId) {
      setBookingMessage("Please select a doctor first.");
      return;
    }

    if (!selectedBookingClinic?.id) {
      setBookingMessage("Clinic is not available for this doctor.");
      return;
    }

    if (!selectedSlot?.startTime) {
      setBookingMessage("Please select an available slot.");
      return;
    }

    try {
      setBookingLoading(true);
      setBookingMessage("");

      const payload = {
        doctorProfileId: selectedDoctor.doctorProfileId,
        clinicId: selectedBookingClinic.id,
        patientProfileId: selectedProfile.id,
        patientProfileType: selectedProfile.type || "SELF",
        appointmentDate: formatDateForApi(selectedDate),
        slotStartTime: selectedSlot.startTime,
        slotEndTime: selectedSlot.endTime,
        notes: "Booked from services page",
      };

      const response = await api.post("/patient/public-appointments", payload);

      if (response.data?.success) {
        setBookingMessage(response.data.message || "Appointment booked successfully.");
        setTimeout(() => closeAllModals(), 900);
      } else {
        setBookingMessage(response.data?.message || "Unable to book appointment.");
      }
    } catch (error) {
      console.error("Appointment booking failed", error);
      setBookingMessage(error.message || "Unable to book appointment.");
    } finally {
      setBookingLoading(false);
    }
  };

  const toggleTest = (id) => {
    setSelectedTests((prev) => {
      if (prev.includes(id)) return prev.filter((testId) => testId !== id);
      return [...prev, id];
    });
  };

  const togglePackage = (id) => {
    setSelectedPackages((prev) => {
      if (prev.includes(id)) return prev.filter((packageId) => packageId !== id);
      return [...prev, id];
    });
  };

  const handleOpenLabModal = (lab) => {
    setSelectedLab(lab);
    setShowLabModal(true);
    setActiveTab("Available Tests");
    setModalSearch("");
    setSelectedTests([]);
    setSelectedPackages([]);
    setHomePickup(false);
  };

  const handleLabBooking = () => {
    if (!currentUser) {
      alert("Please login first to book lab test");
      navigate("/login");
      return;
    }

    if (currentUser.role !== "PATIENT") {
      alert("Only patients can book lab tests.");
      return;
    }

    if (!selectedProfile) {
      alert("Please select patient profile first");
      navigate("/patient/profile");
      return;
    }

    if (selectedTests.length === 0 && selectedPackages.length === 0) {
      alert("Please select at least one test or package");
      return;
    }

    alert("Lab booking request prepared successfully. Backend lab booking API will be connected in next phase.");
    closeAllModals();
  };

  return (
    <div className="home-wrapper">
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>

      <div
        className={`sidebar-overlay ${isSidebarOpen ? "active" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <aside className={`mobile-sidebar ${isSidebarOpen ? "open" : ""}`}>
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

        {currentUser && (
          <div className="sidebar-user-container">
            <div
              className={`sidebar-profile-card ${sidebarProfileOpen ? "expanded" : ""}`}
              onClick={() => setSidebarProfileOpen(!sidebarProfileOpen)}
            >
              <div className="sidebar-avatar">
                {currentUser.fullName?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div className="sidebar-info">
                <h3>{currentUser.fullName || "User"}</h3>
                <p>{currentUser.email || currentUser.role}</p>
              </div>

              <span className="side-chevron">{sidebarProfileOpen ? "▴" : "▾"}</span>
            </div>

            {sidebarProfileOpen && (
              <div className="sidebar-inner-dropdown">
                <div
                  className="inner-opt"
                  onClick={() => {
                    setIsSidebarOpen(false);
                    navigateToRoleProfile();
                  }}
                >
                  <span className="inner-icon">👤</span>
                  My Profile
                </div>

                <div
                  className="inner-opt"
                  onClick={() => {
                    setIsSidebarOpen(false);
                    navigateToRoleDashboard();
                  }}
                >
                  <span className="inner-icon">📊</span>
                  Dashboard
                </div>
              </div>
            )}
          </div>
        )}

        <div className="sidebar-content">
          <p className="sidebar-label">Navigation</p>

          <div
            className="sidebar-link"
            onClick={() => {
              setIsSidebarOpen(false);
              navigate("/");
            }}
          >
            🏠 Home
          </div>

          <div
            className="sidebar-link"
            onClick={() => {
              setIsSidebarOpen(false);
              navigate("/about");
            }}
          >
            ℹ️ About Us
          </div>

          <div
            className="sidebar-link active-side"
            onClick={() => {
              setIsSidebarOpen(false);
              navigate("/all-services");
            }}
          >
            🛠️ Services
          </div>

          <div
            className="sidebar-link"
            onClick={() => {
              setIsSidebarOpen(false);
              navigate("/blogs");
            }}
          >
            📰 Doctor Blogs
          </div>

          <div
            className="sidebar-link"
            onClick={() => {
              setIsSidebarOpen(false);
              navigate("/contact");
            }}
          >
            📞 Contact Us
          </div>
        </div>

        <div className="sidebar-footer">
          {currentUser ? (
            <button className="secondary-btn-mob logout-red" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <div className="sidebar-auth-grid">
              <button
                className="secondary-btn-mob"
                onClick={() => {
                  setIsSidebarOpen(false);
                  navigate("/login");
                }}
              >
                Login
              </button>
              <button
                className="primary-btn-mob"
                onClick={() => {
                  setIsSidebarOpen(false);
                  navigate("/signup");
                }}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </aside>

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
          <span className="nav-item" onClick={() => navigate("/")}>
            Home
          </span>

          <span className="nav-item" onClick={() => navigate("/about")}>
            About Us
          </span>

          <span className="nav-item active-tab" onClick={() => navigate("/all-services")}>
            Services
          </span>

          <span className="nav-item" onClick={() => navigate("/blogs")}>
            Doctor Blogs
          </span>

          <span className="nav-item" onClick={() => navigate("/contact")}>
            Contact Us
          </span>
        </nav>

        <div className="auth-buttons">
          {currentUser ? (
            <div className="profile-wrapper desktop-only" ref={dropdownRef}>
              <div className="profile-icon" onClick={() => setDropdownOpen(!dropdownOpen)}>
                {currentUser.fullName?.charAt(0)?.toUpperCase() || "U"}
              </div>

              {dropdownOpen && (
                <div className="dropdown-menu alignment-fix">
                  <div className="user-info-header">
                    <div className="user-avatar-mini">
                      {currentUser.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </div>

                    <div className="user-details">
                      <span className="user-name">{currentUser.fullName || "User"}</span>
                      <span className="user-email">{currentUser.email || currentUser.role}</span>
                    </div>
                  </div>

                  <div
                    className="dropdown-item"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigateToRoleProfile();
                    }}
                  >
                    <span className="icon-box">👤</span>
                    My Profile
                  </div>

                  <div
                    className="dropdown-item"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigateToRoleDashboard();
                    }}
                  >
                    <span className="icon-box">📊</span>
                    Dashboard
                  </div>

                  <div className="dropdown-item logout-btn" onClick={handleLogout}>
                    <span className="icon-box">🚪</span>
                    Logout
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <button className="login-btn-styled desktop-only" onClick={() => navigate("/login")}>
                Login
              </button>
              <button className="primary-btn desktop-only" onClick={() => navigate("/signup")}>
                SignUp
              </button>
            </>
          )}

          <button className="hamburger-menu" onClick={() => setIsSidebarOpen(true)}>
            ☰
          </button>
        </div>
      </header>

      <main className="services-container-premium">
        <div className="premium-search-box">
          <div className="search-field-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              value={search}
              placeholder="Search for doctors, hospitals or labs..."
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <span className="clear-search" onClick={() => setSearch("")}>
                ✕
              </span>
            )}
          </div>
        </div>

        <div className="premium-services">
          <div className="premium-service-card" onClick={() => navigate("/care-coordinator")}>
            <div className="service-text">
              <h3>Personal Care Coordinator</h3>
              <p>
                Planning treatment from another city or country? We help you find the right hospital,
                arrange your stay, and guide you throughout your medical journey.
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate("/care-coordinator");
              }}
            >
              Get Assistance →
            </button>
          </div>

          <div className="premium-service-card" onClick={() => navigate("/insurance")}>
            <div className="service-text">
              <h3>Secure Your Health</h3>
              <p>
                Avoid unexpected medical expenses. Compare trusted insurance plans with cashless
                hospital benefits.
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate("/insurance");
              }}
            >
              View Plans →
            </button>
          </div>
        </div>

        <section className="service-section">
          <div className="section-title-box">
            <div>
              <h2 className="title-text">
                Top <span>Doctors</span>
              </h2>
              <div className="title-line" />
            </div>

            <button className="view-all-arrow-btn" onClick={() => handleProtectedViewAll("/patient/finddoctors")}>
              View ALL <span>→</span>
            </button>
          </div>

          {doctorLoading && <div className="section-state-card">Loading verified doctors...</div>}
          {doctorError && <div className="section-error-card">{doctorError}</div>}
          {!doctorLoading && !doctorError && filteredDoctors.length === 0 && (
            <div className="section-state-card">No doctors found.</div>
          )}

          {!doctorLoading && !doctorError && filteredDoctors.length > 0 && (
            <div className="horizontal-card-row" ref={doctorScrollRef}>
              {filteredDoctors.map((doctor) => (
                <div
                  key={doctor.doctorProfileId}
                  className="premium-v3-card"
                  onClick={() => openDoctorProfile(doctor)}
                >
                  <div className="v3-card-top">
                    <img

                      src={getSafeDoctorImage(doctor.profilePictureUrl)}
                      alt={doctor.fullName || "Doctor"}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = defaultDoctorAvatar;
                      }}
                    />
                    <div className="v3-rating">⭐ {getDoctorRating(doctor)}</div>
                  </div>

                  <div className="v3-card-body">
                    <h3>{doctor.fullName || "Doctor"}</h3>
                    <p className="v3-spec">
                      {doctor.primarySpecialization || "General Physician"}
                    </p>
                    <p className="v3-loc">📍 {getDoctorLocation(doctor)}</p>
                    <p className="v3-exp">💼 {doctor.experienceYears || 0} yrs experience</p>
                    <p className="v3-exp">🏥 {doctor.clinicName || "Clinic not updated"}</p>
                    <p className="v3-exp">💰 ₹{doctor.consultationFee || "N/A"} consultation</p>

                    <div className="v3-btn-group">
                      <button
                        className="v3-btn secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDoctorProfile(doctor);
                        }}
                      >
                        View Details
                      </button>

                      <button
                        className="v3-btn secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDoctorBooking(doctor);
                        }}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="service-section">
          <div className="section-title-box">
            <div>
              <h2 className="title-text">
                Premium <span>Hospitals</span>
              </h2>
              <div className="title-line" />
            </div>

            <button className="view-all-arrow-btn" onClick={() => handleProtectedViewAll("/patient/hospitals")}>
              View ALL <span>→</span>
            </button>
          </div>

          {hospitalsLoading && <div className="section-state-card">Loading hospitals...</div>}

          {hospitalsError && <div className="section-error-card">{hospitalsError}</div>}

          {!hospitalsLoading && !hospitalsError && filteredHospitals.length === 0 && (
            <div className="section-state-card">No hospitals found.</div>
          )}

          {!hospitalsLoading && !hospitalsError && filteredHospitals.length > 0 && (
            <div className="hospital-card-row" ref={hospitalScrollRef}>
              {filteredHospitals.map((hospital) => (
                <article
                  key={hospital.id}
                  className="hospital-service-card"
                  onClick={() => handleOpenHospitalModal(hospital)}
                >
                  <div className="hospital-card-image-wrap">
                    <img
                      src={getHospitalImages(hospital)[0] || hospital.imageUrl}
                      alt={hospital.hospitalName}
                    />

                    <span className="hospital-card-rating">
                      ★ {hospital.rating || "New"}
                    </span>

                    {hospital.emergencyAvailable && (
                      <span className="hospital-card-emergency">24x7 Emergency</span>
                    )}
                  </div>

                  <div className="hospital-card-content">
                    <h3>{hospital.hospitalName}</h3>

                    <p className="hospital-card-location">
                      {[hospital.area, hospital.city].filter(Boolean).join(", ")}
                    </p>

                    <div className="hospital-card-meta">
                      <div>
                        <strong>{hospital.availableBeds || 0}</strong>
                        <span>Available beds</span>
                      </div>

                      <div>
                        <strong>{hospital.totalBeds || 0}</strong>
                        <span>Total beds</span>
                      </div>
                    </div>

                    <button
                      className="hospital-card-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenHospitalModal(hospital);
                      }}
                    >
                      View hospital
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="service-section">
          <div className="section-title-box">
            <div>
              <h2 className="title-text">
                Diagnostic <span>Labs</span>
              </h2>
              <div className="title-line" />
            </div>

            <button className="view-all-arrow-btn" onClick={() => handleProtectedViewAll("/patient/labs")}>
              View ALL <span>→</span>
            </button>
          </div>

          {labLoading && <div className="section-state-card">Loading verified labs...</div>}
          {labError && <div className="section-error-card">{labError}</div>}
          {!labLoading && !labError && filteredLabs.length === 0 && (
            <div className="section-state-card">No labs found.</div>
          )}

          {!labLoading && !labError && filteredLabs.length > 0 && (
            <div className="horizontal-card-row" ref={labScrollRef}>
              {filteredLabs.map((lab) => (
                <div key={lab.id} className="premium-v3-card">
                  <div className="v3-card-top">
                    <img src={DEFAULT_LAB_IMAGE} alt={lab.name || "Diagnostic Lab"} />
                    <div className="v3-rating">✅ {getLabRating()}</div>
                  </div>

                  <div className="v3-card-body">
                    <h3>{lab.name || "Diagnostic Lab"}</h3>
                    <p className="v3-spec">Platform Verified</p>
                    <p className="v3-loc">📍 {getLabLocation(lab)}</p>
                    <p className="v3-exp">
                      🧪 {(lab.services || []).slice(0, 2).join(", ") || "Pathology services"}
                    </p>

                    <button
                      className="v3-btn secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenLabModal(lab);
                      }}
                    >
                      Book Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showDoctorProfileModal && selectedDoctor && (
        <div className="modal-overlay" onClick={closeAllModals}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-x" onClick={closeAllModals}>
              ×
            </button>

            <div className="modal-header-top">
              <img
                src={getSafeDoctorImage(selectedDoctor.profilePictureUrl)}
                className="modal-avatar"
                alt={selectedDoctor.fullName || "Doctor"}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = defaultDoctorAvatar;
                }}
              />

              <div className="modal-title-info">
                <h2>{selectedDoctor.fullName || "Doctor"}</h2>
                <span className="modal-spec-badge">
                  {selectedDoctor.primarySpecialization || "General Physician"}
                </span>
                <p>
                  ⭐ {getDoctorRating(selectedDoctor)} • {selectedDoctor.experienceYears || 0} yrs
                </p>
              </div>
            </div>

            <div className="modal-body-content">
              {doctorDetailLoading ? (
                <div className="section-state-card">Loading doctor details...</div>
              ) : (
                <>
                  <div className="info-row">
                    <strong>📍 Location:</strong>{" "}
                    {[
                      profileDoctor?.area,
                      profileDoctor?.city || primaryClinic?.city,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Location not updated"}
                  </div>

                  <div className="info-row">
                    <strong>🏥 Primary Clinic:</strong>{" "}
                    {primaryClinic?.clinicName ||
                      selectedDoctor?.clinicName ||
                      "Clinic not updated"}
                  </div>

                  <div className="info-row">
                    <strong>🎓 Education:</strong>{" "}
                    {profileDoctor?.degrees?.length > 0
                      ? profileDoctor.degrees.join(", ")
                      : "Not updated"}
                  </div>

                  <div className="info-row">
                    <strong>🩺 Specializations:</strong>{" "}
                    {profileDoctor?.specializations?.length > 0
                      ? profileDoctor.specializations.join(", ")
                      : selectedDoctor?.primarySpecialization || "General Physician"}
                  </div>

                  <div className="info-row">
                    <strong>⏳ Experience:</strong>{" "}
                    {profileDoctor?.experienceYears || selectedDoctor?.experienceYears || 0}+ Years
                  </div>

                  <div className="info-row">
                    <strong>💰 Consultation Fee:</strong>{" "}
                    ₹{primaryClinic?.consultationFee || selectedDoctor?.consultationFee || "N/A"}
                  </div>

                  <div className="info-row">
                    <strong>🏛️ Council:</strong>{" "}
                    {profileDoctor?.councilName || "Not updated"}
                  </div>

                  <div className="info-row">
                    <strong>📄 Registration:</strong>{" "}
                    {profileDoctor?.registrationNumber || "Not updated"}
                    {profileDoctor?.registrationYear
                      ? ` (${profileDoctor.registrationYear})`
                      : ""}
                  </div>

                  {detailClinics.length > 0 && (
                    <div className="modal-bio-box">
                      <strong>Clinics / Hospitals:</strong>

                      {detailClinics.map((clinic) => (
                        <p key={clinic.id}>
                          {clinic.isPrimary || clinic.primary ? "⭐ " : ""}
                          {clinic.clinicName || "Clinic"} — {clinic.city || "City not updated"}
                          {clinic.area ? `, ${clinic.area}` : ""}
                          {clinic.consultationFee ? ` • ₹${clinic.consultationFee}` : ""}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="modal-bio-box">
                    <strong>About Doctor:</strong>
                    <p>
                      {profileDoctor?.bio ||
                        selectedDoctor?.bio ||
                        `Verified expert in ${selectedDoctor?.primarySpecialization || "healthcare"
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
                  setShowDoctorProfileModal(false);
                  openDoctorBooking(selectedDoctor);
                }}
              >
                Book Appointment Now
              </button>

              <button
                className="secondary-modal-btn"
                onClick={() => {
                  const doctorId =
                    selectedDoctorDetail?.doctorProfileId ||
                    selectedDoctor?.doctorProfileId;

                  setShowDoctorProfileModal(false);

                  navigate(`/patient/doctorsprofile/${doctorId}`, {
                    state: selectedDoctorDetail || selectedDoctor,
                  });
                }}
              >
                View Full Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {showDoctorBookingModal && selectedDoctor && (
        <div className="booking-modal-overlay" onClick={closeAllModals}>
          <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeAllModals}>
              ✕
            </button>

            <div className="booking-scroll">
              <h2>Book Appointment</h2>

              <div className="booking-doctor">
                <img
                  src={getSafeDoctorImage(selectedDoctor?.profilePictureUrl)}
                  alt={selectedDoctor?.fullName || "Doctor"}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = defaultDoctorAvatar;
                  }}
                />
                <div>
                  <h3>{selectedDoctor.fullName || "Doctor"}</h3>
                  <p>{selectedDoctor.primarySpecialization || "General Physician"}</p>
                  <small>
                    {primaryClinic?.clinicName || selectedDoctor.clinicName || "Clinic loading..."}
                  </small>
                </div>
              </div>

              {doctorDetailLoading && <div className="section-state-card">Loading clinic details...</div>}

              {!doctorDetailLoading && !primaryClinic && (
                <div className="section-error-card">No active clinic found for this doctor.</div>
              )}
              {!doctorDetailLoading && clinicOptions.length > 0 && (
                <div className="booking-section">
                  <p>Select Clinic</p>

                  <select
                    className="booking-clinic-select"
                    value={selectedClinicId}
                    onChange={(e) => {
                      setSelectedClinicId(e.target.value);
                      setSelectedSlot(null);
                      setSlots([]);
                      setSlotError("");
                    }}
                  >
                    {clinicOptions.map((clinic) => (
                      <option key={clinic.id} value={clinic.id}>
                        {clinic.clinicName || "Clinic"} - ₹
                        {clinic.consultationFee || selectedDoctor?.consultationFee || "N/A"}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="booking-section">
                <p>Select Date</p>
                <div className="date-list">
                  {[0, 1, 2, 3, 4].map((day) => (
                    <button
                      key={day}
                      className={`date-chip ${selectedDate === day ? "active" : ""}`}
                      onClick={() => setSelectedDate(day)}
                    >
                      {formatDateLabel(day)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="booking-section">
                <p>Select Time</p>

                {slotLoading && <div className="section-state-card">Loading available slots...</div>}
                {slotError && <div className="section-error-card">{slotError}</div>}

                {!slotLoading && !slotError && slots.length === 0 && (
                  <div className="section-state-card">No slots available for this date.</div>
                )}

                {!slotLoading && !slotError && slots.length > 0 && (
                  <div className="slot-list">
                    {slots.map((slot) => {
                      const isAvailable = String(slot.status || "").toUpperCase() === "AVAILABLE";

                      return (
                        <button
                          key={`${slot.startTime}-${slot.endTime}`}
                          className={`slot ${selectedSlot?.startTime === slot.startTime ? "active" : ""
                            }`}
                          disabled={!isAvailable}
                          onClick={() => isAvailable && setSelectedSlot(slot)}
                        >
                          {slot.displayTime || `${slot.startTime} - ${slot.endTime}`}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="booking-section">
                <p className="section-label">Patient Info</p>

                {selectedProfile ? (
                  <div className="selected-patient-card">
                    <h4>{selectedProfile.fullName}</h4>
                    <p>
                      {selectedProfile.relation} • {selectedProfile.gender || "N/A"} •{" "}
                      {selectedProfile.type || "SELF"}
                    </p>
                  </div>
                ) : (
                  <div className="selected-patient-card error-card">
                    <p>No profile selected</p>
                  </div>
                )}
              </div>

              {bookingMessage && <div className="section-state-card">{bookingMessage}</div>}

              <button
                className="primary-btn confirm-btn"
                onClick={handleConfirmAppointment}
                disabled={bookingLoading}
              >
                {bookingLoading ? "Booking..." : "Confirm Appointment"}
              </button>

              <button className="secondary-btn confirm-btn" onClick={closeAllModals}>
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedHospital && (
        <div className="hospital-modal-overlay" onClick={() => setSelectedHospital(null)}>
          <div className="hospital-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="hospital-close-btn" onClick={() => setSelectedHospital(null)}>
              ×
            </button>

            <div className="hospital-modal-body">
              <div className="hospital-hero-panel">
                <div className="hospital-gallery-box">
                  <img
                    src={getCurrentHospitalImage()}
                    alt={selectedHospital.hospitalName}
                    className="hospital-hero-image"
                    onClick={() => setPreview(getCurrentHospitalImage())}
                  />

                  {getHospitalImages(selectedHospital).length > 1 && (
                    <>
                      <button
                        className="hospital-image-arrow left"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToPreviousHospitalImage();
                        }}
                      >
                        ‹
                      </button>

                      <button
                        className="hospital-image-arrow right"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToNextHospitalImage();
                        }}
                      >
                        ›
                      </button>

                      <div className="hospital-image-count">
                        {currentImageIndex + 1}/{getHospitalImages(selectedHospital).length}
                      </div>
                    </>
                  )}
                </div>
                <div className="hospital-hero-content">
                  <span className="hospital-premium-badge">Verified Hospital</span>
                  <h2>{selectedHospital.hospitalName}</h2>
                  <p>
                    📍 {[selectedHospital.area, selectedHospital.city].filter(Boolean).join(", ")}
                  </p>

                  <div className="hospital-mini-stats">
                    <div>
                      <strong>⭐ {selectedHospital.rating || "New"}</strong>
                      <span>Rating</span>
                    </div>
                    <div>
                      <strong>{selectedHospital.availableBeds}</strong>
                      <span>Beds</span>
                    </div>
                    <div>
                      <strong>{selectedHospital.emergencyAvailable ? "24/7" : "OPD"}</strong>
                      <span>Emergency</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hospital-booking-layout">
                <div className="hospital-booking-main">
                  <div className="hospital-form-section">
                    <div className="hospital-section-heading">
                      <h3>Select Department</h3>
                      <p>Choose the care department for your appointment.</p>
                    </div>

                    {hospitalDeptLoading ? (
                      <div className="hospital-state-box">Loading departments...</div>
                    ) : (
                      <div className="hospital-chip-row">
                        {hospitalDepartments.map((department) => (
                          <button
                            key={department.id}
                            className={`hospital-choice-chip ${hospitalSelectedDepartment?.id === department.id ? "active" : ""
                              }`}
                            onClick={() => {
                              setHospitalSelectedDepartment(department);
                              setHospitalSelectedSlot(null);
                            }}
                          >
                            {department.departmentName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="hospital-form-section">
                    <div className="hospital-section-heading">
                      <h3>Select Date</h3>
                      <p>Pick a date to check live availability.</p>
                    </div>

                    <div className="hospital-date-strip">
                      {[1, 2, 3, 4, 5, 6].map((day) => (
                        <button
                          key={day}
                          className={`hospital-date-card ${hospitalSelectedDate === day ? "active" : ""
                            }`}
                          onClick={() => {
                            setHospitalSelectedDate(day);
                            setHospitalSelectedSlot(null);
                          }}
                        >
                          <span>{day === 1 ? "Tomorrow" : formatDateLabel(day).split(",")[0]}</span>
                          <strong>{formatDateLabel(day)}</strong>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="hospital-form-section">
                    <div className="hospital-section-heading">
                      <h3>Available Slots</h3>
                      <p>Booked and past slots are disabled automatically.</p>
                    </div>

                    {hospitalSlotLoading ? (
                      <div className="hospital-state-box">Loading slots...</div>
                    ) : hospitalSlots.length === 0 ? (
                      <div className="hospital-state-box">No slots available for this date.</div>
                    ) : (
                      <div className="hospital-slot-grid">
                        {hospitalSlots.map((slot) => {
                          const disabled = slot.status !== "AVAILABLE";

                          return (
                            <button
                              key={`${slot.startTime}-${slot.endTime}`}
                              disabled={disabled}
                              className={`hospital-slot-card ${hospitalSelectedSlot?.startTime === slot.startTime ? "active" : ""
                                } ${disabled ? "disabled" : ""}`}
                              onClick={() => {
                                setHospitalSelectedSlot(slot);
                                setHospitalBookingMessage("");
                              }}
                            >
                              <strong>{slot.startTime}</strong>
                              <span>{slot.status}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="hospital-form-section">
                    <div className="hospital-section-heading">
                      <h3>Reason for Visit</h3>
                      <p>Optional note for hospital coordination team.</p>
                    </div>

                    <textarea
                      className="hospital-note-box"
                      value={hospitalPatientNote}
                      onChange={(e) => setHospitalPatientNote(e.target.value)}
                      placeholder="Example: Chest pain consultation, fever, follow-up visit..."
                      rows="4"
                    />
                  </div>
                </div>

                <aside className="hospital-summary-card">
                  <h3>Booking Summary</h3>

                  <div className="hospital-summary-line">
                    <span>Hospital</span>
                    <strong>{selectedHospital.hospitalName}</strong>
                  </div>

                  <div className="hospital-summary-line">
                    <span>Department</span>
                    <strong>{hospitalSelectedDepartment?.departmentName || "Not selected"}</strong>
                  </div>

                  <div className="hospital-summary-line">
                    <span>Date</span>
                    <strong>{formatDateLabel(hospitalSelectedDate)}</strong>
                  </div>

                  <div className="hospital-summary-line">
                    <span>Slot</span>
                    <strong>{hospitalSelectedSlot?.startTime || "Not selected"}</strong>
                  </div>

                  <div className="hospital-patient-summary">
                    <span>Patient Profile</span>
                    {selectedProfile ? (
                      <>
                        <strong>{selectedProfile.fullName}</strong>
                        <small>{selectedProfile.type || "SELF"}</small>
                      </>
                    ) : (
                      <small className="hospital-danger-text">No patient profile selected</small>
                    )}
                  </div>

                  {hospitalBookingMessage && (
                    <div className="hospital-booking-message">{hospitalBookingMessage}</div>
                  )}

                  <button
                    className="hospital-final-btn"
                    disabled={hospitalBookingLoading}
                    onClick={handleHospitalBooking}
                  >
                    {hospitalBookingLoading ? "Booking..." : "Confirm Appointment"}
                  </button>
                </aside>
              </div>
            </div>
          </div>
        </div>
      )}
      {showConfirmation && selectedHospital && (
        <div className="success-overlay">
          <div className="success-toast">
            <p className="success-title">Hospital appointment booked ✅</p>

            <div className="success-details">
              <p>
                <strong>Hospital:</strong> {selectedHospital.hospitalName}
              </p>
              <p>
                <strong>Department:</strong> {hospitalSelectedDepartment?.departmentName}
              </p>
              <p>
                <strong>Date:</strong> {formatDateLabel(hospitalSelectedDate)}
              </p>
              <p>
                <strong>Slot:</strong> {hospitalSelectedSlot?.startTime}
              </p>
            </div>

            <button
              className="view-details-btn"
              onClick={() => {
                setShowConfirmation(false);
                closeAllModals();
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {preview && (
        <div className="full-preview-overlay active" onClick={() => setPreview(null)}>
          <img
            src={preview}
            className="full-preview-img"
            alt="Preview"
            onClick={(e) => e.stopPropagation()}
          />

          <button className="preview-close-btn" onClick={() => setPreview(null)}>
            ×
          </button>

          {selectedHospital && getHospitalImages(selectedHospital).length > 1 && (
            <>
              <button
                className="full-preview-arrow left"
                onClick={(e) => {
                  e.stopPropagation();

                  const images = getHospitalImages(selectedHospital);
                  const nextIndex =
                    currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1;

                  setCurrentImageIndex(nextIndex);
                  setPreview(images[nextIndex]);
                }}
              >
                ‹
              </button>

              <button
                className="full-preview-arrow right"
                onClick={(e) => {
                  e.stopPropagation();

                  const images = getHospitalImages(selectedHospital);
                  const nextIndex = (currentImageIndex + 1) % images.length;

                  setCurrentImageIndex(nextIndex);
                  setPreview(images[nextIndex]);
                }}
              >
                ›
              </button>
            </>
          )}
        </div>
      )}

      {showLabModal && selectedLab && (
        <div className="lab-modal-overlay" onClick={closeAllModals}>
          <div className="lab-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="lab-modal-header">
              <div className="lab-header-left">
                <h2>{selectedLab.name || "Diagnostic Lab"}</h2>
                <div className="lab-meta-row">
                  <span>✅ Platform Verified</span>
                  <span>📍 {getLabLocation(selectedLab)}</span>
                </div>
              </div>

              <div className="lab-header-actions">
                {selectedLab.contactNumber && (
                  <a className="lab-call-btn" href={`tel:${selectedLab.contactNumber}`}>
                    📞 Call Lab
                  </a>
                )}
                <button className="lab-close-btn" onClick={closeAllModals}>
                  ✕
                </button>
              </div>
            </div>

            <div className="lab-tabs">
              {["Available Tests", "Packages", "About Lab", "Reviews"].map((tab) => (
                <button
                  key={tab}
                  className={`lab-tab ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="lab-modal-body">
              <div className="lab-booking-grid">
                {activeTab === "Available Tests" && (
                  <div className="booking-form-side">
                    <h3 className="form-heading">Select Tests & Schedule</h3>

                    <div className="form-field">
                      <label>Search & Select Tests</label>

                      <div className="test-selector-box">
                        <div className="search-box-inner">
                          <span className="search-tiny">🔍</span>
                          <input
                            type="text"
                            placeholder="Type test name..."
                            className="test-search-input"
                            value={modalSearch}
                            onChange={(e) => setModalSearch(e.target.value)}
                          />
                        </div>

                        <div className="test-check-list">
                          {filteredTests.length === 0 && (
                            <div className="section-state-card">No tests found.</div>
                          )}

                          {filteredTests.map((test) => (
                            <div
                              className="check-item"
                              key={test.id}
                              onClick={() => toggleTest(test.id)}
                            >
                              <div className="check-label-grp">
                                <input
                                  type="checkbox"
                                  checked={selectedTests.includes(test.id)}
                                  readOnly
                                />
                                <span>{test.testName}</span>
                              </div>
                              <span className="item-price">₹{test.price || 0}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="form-field">
                      <label>Home Sample Pickup</label>
                      <div className="pickup-row">
                        <div>
                          <strong>{homePickup ? "Enabled" : "Disabled"}</strong>
                          <p>Optional home sample collection with pickup fee.</p>
                        </div>
                        <StandardToggle
                          id="homePickup"
                          checked={homePickup}
                          onChange={() => setHomePickup((prev) => !prev)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "Packages" && (
                  <div className="booking-form-side">
                    <h3 className="form-heading">Health Packages</h3>

                    <div className="test-check-list package-list">
                      {packagesData.map((pack) => (
                        <div
                          className="check-item"
                          key={pack.id}
                          onClick={() => togglePackage(pack.id)}
                        >
                          <div className="check-label-grp">
                            <input
                              type="checkbox"
                              checked={selectedPackages.includes(pack.id)}
                              readOnly
                            />
                            <span>
                              {pack.name}
                              <small>{pack.parameters} parameters</small>
                            </span>
                          </div>
                          <span className="item-price">₹{pack.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "About Lab" && (
                  <div className="booking-form-side">
                    <h3 className="form-heading">About Lab</h3>

                    <div className="lab-about-card">
                      <p>
                        {selectedLab.name} is a platform verified diagnostic partner offering
                        reliable tests and sample collection support.
                      </p>

                      <p>
                        <strong>Address:</strong>{" "}
                        {[
                          selectedLab.addressLine1,
                          selectedLab.addressLine2,
                          selectedLab.area,
                          selectedLab.city,
                        ]
                          .filter(Boolean)
                          .join(", ") || "Address not updated"}
                      </p>

                      <p>
                        <strong>Services:</strong>{" "}
                        {(selectedLab.services || []).join(", ") || "Pathology services"}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "Reviews" && (
                  <div className="booking-form-side">
                    <h3 className="form-heading">Reviews</h3>
                    <div className="lab-about-card">
                      <p>No public reviews available yet.</p>
                    </div>
                  </div>
                )}

                <div className="billing-summary-side">
                  <h3>Billing Summary</h3>

                  <div className="bill-row">
                    <span>Subtotal</span>
                    <strong>₹{subtotal}</strong>
                  </div>

                  <div className="bill-row">
                    <span>GST</span>
                    <strong>₹{gst}</strong>
                  </div>

                  <div className="bill-row">
                    <span>Service Charge</span>
                    <strong>₹{serviceCharge}</strong>
                  </div>

                  <div className="bill-row">
                    <span>Pickup Fee</span>
                    <strong>₹{pickupFee}</strong>
                  </div>

                  <div className="bill-total">
                    <span>Total</span>
                    <strong>₹{grandTotal}</strong>
                  </div>

                  <div className="booking-section">
                    <p className="section-label">Patient Info</p>

                    {selectedProfile ? (
                      <div className="selected-patient-card">
                        <h4>{selectedProfile.fullName}</h4>
                        <p>
                          {selectedProfile.relation} • {selectedProfile.gender || "N/A"} •{" "}
                          {selectedProfile.type || "SELF"}
                        </p>
                      </div>
                    ) : (
                      <div className="selected-patient-card error-card">
                        <p>No profile selected</p>
                      </div>
                    )}
                  </div>

                  <button className="book-bed-btn" onClick={handleLabBooking}>
                    Confirm Lab Booking
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-column brand-col">
            <h2 className="footer-logo">Suc<span style={{ color: 'var(--text-dark)', background: 'white', padding: '0 5px', borderRadius: '4px', marginLeft: '5px' }}>ura</span></h2>
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
              <p>📍 Andheri East, Mumbai, MH</p>
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
      {loginPromptOpen && (
        <div className="login-prompt-overlay" onClick={() => setLoginPromptOpen(false)}>
          <div className="login-prompt-card" onClick={(e) => e.stopPropagation()}>
            <button className="login-prompt-close" onClick={() => setLoginPromptOpen(false)}>
              ×
            </button>

            <div className="login-prompt-icon">🔐</div>

            <h2>Login Required</h2>
            <p>Please login first to view all services and continue booking.</p>

            <div className="login-prompt-actions">
              <button
                className="login-prompt-primary"
                onClick={() => {
                  setLoginPromptOpen(false);
                  navigate("/login", { state: { redirectTo: loginRedirectPath } });
                }}
              >
                Login Now
              </button>

              <button
                className="login-prompt-secondary"
                onClick={() => setLoginPromptOpen(false)}
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllServicesPage;