import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./AllServices.css";
import Logo from "../../assets/images/logo.png";

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

const AllServicesPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // SaaS states
  const [saasDropdown, setSaasDropdown] = useState(false);
  const [doctorSub, setDoctorSub] = useState(false);
  const [patientSub, setPatientSub] = useState(false);
  const saasRef = useRef(null);

  // Booking Modal States
  const [selected, setSelected] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTime, setSelectedTime] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [preview, setPreview] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [showModal, setShowModal] = useState(false); // keep only one

  const selectedProfile = JSON.parse(localStorage.getItem("selectedProfile"));

  const [activeTab, setActiveTab] = useState("Available Tests");
  const [selectedTests, setSelectedTests] = useState([1, 2]);
  const [modalSearch, setModalSearch] = useState("");
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [selectedLab, setSelectedLab] = useState({});
  const [homePickup, setHomePickup] = useState(false); // For dynamic lab info
  // Refs for scroll
  const doctorScrollRef = useRef(null);
  const hospitalScrollRef = useRef(null);
  const labScrollRef = useRef(null);// keep only one // Fixes 'selectedLab' & 'setSelectedLab' is not defined

  // --- Dummy Data (Fixes 'allAvailableTests' & 'packagesData' is not defined) ---
  const allAvailableTests = [
    { id: 1, name: "Full Body Checkup", price: 1500 },
    { id: 2, name: "Blood Glucose (Fasting)", price: 200 },
    { id: 3, name: "Lipid Profile", price: 600 },
    { id: 4, name: "Thyroid Profile (T3 T4 TSH)", price: 800 },
  ];

  const packagesData = [
    { id: 101, name: "Comprehensive Gold", price: 2999, parameters: 85 },
    { id: 102, name: "Basic Health Screen", price: 999, parameters: 40 },
  ];

  // --- Calculation Logic (For Billing Summary) ---// Toggle selected test
  const toggleTest = (id) => {
    if (selectedTests.includes(id)) {
      setSelectedTests(selectedTests.filter(tid => tid !== id));
    } else {
      setSelectedTests([...selectedTests, id]);
    }
  };
  const filteredTests = allAvailableTests.filter(t =>
    t.name.toLowerCase().includes(modalSearch.toLowerCase())
  );
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [showModal]);


  // Calculate subtotal, gst, service charge
  const subtotal =
    allAvailableTests
      .filter(t => selectedTests.includes(t.id))
      .reduce((acc, curr) => acc + curr.price, 0)
    +
    packagesData
      .filter(p => selectedPackages.includes(p.id))
      .reduce((acc, curr) => acc + curr.price, 0);

  const gst = Math.round(subtotal * 0.05);
  const serviceCharge = 50;
  const pickupFee = 120;

  const grandTotal = subtotal + gst + serviceCharge + (homePickup ? pickupFee : 0);

  useEffect(() => {
    const initDragScroll = (ref) => {
      const slider = ref.current;
      if (!slider) return;

      let isDown = false;
      let startX;
      let scrollLeft;

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

    initDragScroll(doctorScrollRef);
    initDragScroll(hospitalScrollRef);
    initDragScroll(labScrollRef);
  }, []);

  const handleConfirmBooking = () => {

    // ✅ STEP 1: Profile check
    if (!selectedProfile) {
      alert("Please select patient profile first");
      navigate("/patient/profile");
      return;
    }

    // ✅ STEP 2: Time check
    if (!selectedTime) {
      alert("Please select time slot");
      return;
    }

    // ✅ STEP 3: Proper date
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() + selectedDate);

    // ✅ STEP 4: Create booking
    const booking = {
      doctorId: selected.id,
      doctorName: selected.name,
      patientId: selectedProfile.id,
      patientName: selectedProfile.fullName,
      relation: selectedProfile.relation,
      time: selectedTime,
      date: dateObj.toISOString(),
    };

    // ✅ STEP 5: Get existing bookings
    const existing = JSON.parse(localStorage.getItem("appointments")) || [];

    // ✅ STEP 6: Duplicate check
    const alreadyBooked = existing.some(
      (a) =>
        a.doctorId === booking.doctorId &&
        a.time === booking.time &&
        a.date === booking.date
    );

    if (alreadyBooked) {
      alert("Slot already booked ❌");
      return;
    }

    // ✅ STEP 7: Save
    localStorage.setItem("appointments", JSON.stringify([...existing, booking]));

    alert("Appointment Booked ✅");

    // ✅ STEP 8: Reset
    setSelectedTime("");
    setSelectedDate(0);

    closeModals();
  };
  const closeModals = () => {
    setShowBooking(false);
    setShowConfirmation(false);
    setShowModal(false);
    setSelected(null);
    setSelectedHospital(null);
    setSelectedDate(0);
    setSelectedTime("");
  };
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (saasRef.current && !saasRef.current.contains(e.target)) setSaasDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const doctors = [
    { id: 1, name: "Dr. Anjali Mehta", specialty: "Cardiologist", location: "Andheri West, Mumbai", rating: 4.9, experience: "12 yrs", img: "https://images.pexels.com/photos/8376318/pexels-photo-8376318.jpeg" },
    { id: 2, name: "Dr. Rajesh Sharma", specialty: "Orthopedic", location: "Bandra East, Mumbai", rating: 4.7, experience: "10 yrs", img: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=800" },
    { id: 3, name: "Dr. Neha Verma", specialty: "Dermatologist", location: "Powai, Mumbai", rating: 4.8, experience: "8 yrs", img: "https://images.pexels.com/photos/3881247/pexels-photo-3881247.jpeg" },
    { id: 4, name: "Dr. Amit Patel", specialty: "Neurologist", location: "Malad West, Mumbai", rating: 4.6, experience: "15 yrs", img: "https://images.pexels.com/photos/19438560/pexels-photo-19438560.jpeg" },
    { id: 5, name: "Dr. Karan Shah", specialty: "Pediatrician", location: "Borivali, Mumbai", rating: 4.5, experience: "9 yrs", img: "https://images.pexels.com/photos/6303602/pexels-photo-6303602.jpeg" },
  ];

  const hospitals = [
    {
      id: 1,
      name: "Apollo Hospital",
      location: "Chennai, Tamil Nadu",
      rating: "4.8",
      img: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=800",
      images: [
        "https://images.unsplash.com/photo-1587350846662-3c0c591f4a4c?q=80&w=800",
        "https://images.unsplash.com/photo-1538108197017-c1a7148ef88f?q=80&w=800",
        "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800"
      ],
      depts: ["Cardiology", "Orthopedics", "Neurology", "Pediatrics"],
      bedsAvailable: 23,
      totalBeds: 50
    },

    {
      id: 2,
      name: "Manipal Hospital",
      location: "Bengaluru, Karnataka",
      rating: "4.6",
      img: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800",
      images: [
        "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800",
        "https://images.unsplash.com/photo-1538108197017-c1a7148ef88f?q=80&w=800"
      ],
      depts: ["Oncology", "Orthopedics", "General"],
      bedsAvailable: 12,
      totalBeds: 40
    },

    {
      id: 3,
      name: "Fortis Healthcare",
      location: "Mumbai, Maharashtra",
      rating: "4.7",
      img: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=800",
      images: [
        "https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=800",
        "https://images.unsplash.com/photo-1587350846662-3c0c591f4a4c?q=80&w=800"
      ],
      depts: ["Pediatrics", "Surgery", "Cardiology"],
      bedsAvailable: 18,
      totalBeds: 45
    },

    {
      id: 4,
      name: "Max Super Speciality",
      location: "Delhi",
      rating: "4.5",
      img: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=800",
      images: [
        "https://images.unsplash.com/photo-1587350846662-3c0c591f4a4c?q=80&w=800",
        "https://images.unsplash.com/photo-1538108197017-c1a7148ef88f?q=80&w=800",
        "https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=800"
      ],
      depts: ["Gastro", "Cardiology"],
      bedsAvailable: 9,
      totalBeds: 30
    },

    {
      id: 5,
      name: "Medanta Hospital",
      location: "Gurgaon, Haryana",
      rating: "4.9",
      img: "https://images.unsplash.com/photo-1504439468489-c8920d796a29?q=80&w=800",
      images: [
        "https://images.unsplash.com/photo-1587350846662-3c0c591f4a4c?q=80&w=800",
        "https://images.unsplash.com/photo-1538108197017-c1a7148ef88f?q=80&w=800",
        "https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=800"
      ],
      depts: ["Neurology", "Urology", "Cardiology"],
      bedsAvailable: 31,
      totalBeds: 60
    }
  ];

  const labs = [
    {
      id: 1,
      name: "Thyrocare Lab",
      location: "Mumbai",
      rating: 4.6,
      img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
      about: "Thyrocare is one of India's leading diagnostic labs known for affordable and accurate testing with fast report delivery.",
      reviews: [
        { name: "Rohit Sharma", ratingNumber: 5, comment: "Very fast service and accurate reports." },
        { name: "Neha Gupta", ratingNumber: 4, comment: "Good experience, home collection was smooth." }
      ]
    },
    {
      id: 2,
      name: "Dr Lal PathLabs",
      location: "Delhi",
      rating: 4.7,
      img: "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b",
      about: "Dr Lal PathLabs offers a wide range of diagnostic services with NABL accreditation and trusted by millions.",
      reviews: [
        { name: "Rohit Sharma", ratingNumber: 5, comment: "Very fast service and accurate reports." },
        { name: "Neha Gupta", ratingNumber: 4, comment: "Good experience, home collection was smooth." }
      ]
    },
    {
      id: 3,
      name: "Metropolis Lab",
      location: "Chennai",
      rating: 4.5,
      img: "https://images.unsplash.com/photo-1579154204601-01588f351e67",
      about: "Metropolis Healthcare provides advanced pathology services with a strong focus on quality and innovation.",
      reviews: [
        { name: "Rohit Sharma", ratingNumber: 5, comment: "Very fast service and accurate reports." },
        { name: "Neha Gupta", ratingNumber: 4, comment: "Good experience, home collection was smooth." }
      ]
    },
    {
      id: 4,
      name: "SRL Diagnostics",
      location: "Bangalore",
      rating: 4.4,
      img: "https://images.unsplash.com/photo-1582719508461-905c673771fd",
      about: "SRL Diagnostics is a trusted name offering a wide network of labs with high-quality diagnostic services.",
      reviews: [
        { name: "Rohit Sharma", ratingNumber: 5, comment: "Very fast service and accurate reports." },
        { name: "Neha Gupta", ratingNumber: 4, comment: "Good experience, home collection was smooth." }
      ]
    },
    {
      id: 5,
      name: "Healthians",
      location: "Hyderabad",
      rating: 4.6,
      img: "https://images.unsplash.com/photo-1580281657527-47b8d3d8b5a3",
      about: "Healthians specializes in home sample collection with a strong focus on convenience and affordability.",
      reviews: [
        { name: "Rohit Sharma", ratingNumber: 5, comment: "Very fast service and accurate reports." },
        { name: "Neha Gupta", ratingNumber: 4, comment: "Good experience, home collection was smooth." }
      ]
    }
  ];
  const TIME_SLOTS = [
    "10:00 AM", "10:30 AM", "11:00 AM",
    "05:00 PM", "05:30 PM", "06:00 PM"
  ];
  const filterData = (data) => {
    return data.filter(item =>
      (item.name && item.name.toLowerCase().includes(search.toLowerCase())) ||
      (item.location && item.location.toLowerCase().includes(search.toLowerCase())) ||
      (item.specialty && item.specialty.toLowerCase().includes(search.toLowerCase())) ||
      item.rating?.toString().includes(search)
    );
  };


  return (
    <div className="home-wrapper">
      {/* --- SIDEBAR SYSTEM --- */}
      <div className={`sidebar-overlay ${isSidebarOpen ? "active" : ""}`} onClick={() => setIsSidebarOpen(false)}></div>
      <aside className={`mobile-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2 className="brand-logo-sidebar">Doc<span>Hub</span></h2>
          <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>×</button>
        </div>
        <div className="sidebar-content">
          <p className="sidebar-label">Navigation</p>
          <div className="sidebar-nav-link" onClick={() => { navigate("/"); setIsSidebarOpen(false); }}>🏠 Home</div>
          <div className="sidebar-nav-link" onClick={() => { navigate("/about"); setIsSidebarOpen(false); }}>ℹ️ About Us</div>
          <div className="sidebar-nav-link active-side">🛠️ Services</div>
          <div className="sidebar-nav-link" onClick={() => { navigate("/blogs"); setIsSidebarOpen(false); }}>📰 Doctor Blogs</div>
          <div className="sidebar-nav-link" onClick={() => { navigate("/contact"); setIsSidebarOpen(false); }}>📞 Contact Us</div>
          <p className="sidebar-label">SaaS Solutions</p>
          <div className="sidebar-nav-link" onClick={() => setDoctorSub(!doctorSub)}>👨‍⚕️ For Doctors {doctorSub ? "▾" : "▸"}</div>
          {doctorSub && <div className="sidebar-sub-link" onClick={() => navigate("/doctor/dashboard")}>→ Dashboard</div>}
          <div className="sidebar-nav-link" onClick={() => setPatientSub(!patientSub)}>👤 For Patients {patientSub ? "▾" : "▸"}</div>
          {patientSub && <div className="sidebar-sub-link" onClick={() => navigate("/patient/dashboard")}>→ Portal</div>}
        </div>
        <div className="sidebar-footer">
          <button className="secondary-btn-mob" onClick={() => navigate("/login")}>Login</button>
          <button className="primary-btn-mob" onClick={() => navigate("/signup")}>Sign Up Now</button>
        </div>
      </aside>

      {/* --- HEADER --- */}
      <header className="home-header">
        <div className="header-brand" onClick={() => navigate("/")}>
          <img src={Logo} alt="Doctor's Hub Logo" className="logo-img" />
          <h1>Doctor's <span>Hub</span></h1>
        </div>
        <nav className="header-nav desktop-only">
          <span className="nav-item" onClick={() => navigate("/")}>Home</span>
          <span className="nav-item" onClick={() => navigate("/about")}>About Us</span>
          <div className="nav-item dropdown-toggle " ref={saasRef}>
            <span className="nav-item active-tab" onClick={() => setSaasDropdown(!saasDropdown)}>
              Services {saasDropdown ? "▴" : "▾"}
            </span>
            {saasDropdown && (
              <div className="dropdown-menu-desktop">
                <div className="dropdown-item" onClick={() => navigate("/doctor/dashboard")}>For Doctors</div>
                <div className="dropdown-item" onClick={() => navigate("/patient/dashboard")}>For Patients</div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item active-tab" onClick={() => navigate("/all-services")}>View All Services</div>
              </div>
            )}
          </div>
          <span className="nav-item" onClick={() => navigate("/blogs")}>Doctor Blogs</span>
          <span className="nav-item" onClick={() => navigate("/contact")}>Contact Us</span>
        </nav>
        <div className="auth-buttons">
          <button className="login-btn-styled desktop-only" onClick={() => navigate("/login")}>Login</button>
          <button className="primary-btn desktop-only" onClick={() => navigate("/signup")}>SignUp</button>
          <button className="hamburger-menu" onClick={() => setIsSidebarOpen(true)}>☰</button>
        </div>
      </header>

      <div className="services-container-premium">
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
              <span className="clear-search" onClick={() => setSearch("")}>✕</span>
            )}
          </div>
        </div>
        {/* 🔥 PREMIUM SERVICES SECTION */}
        <div className="premium-services">

          {/* PERSONAL CARE COORDINATOR */}
          <div
            className="premium-service-card"
            onClick={() => navigate("/care-coordinator")}
          >
            <div className="service-text">
              <h3>Personal Care Coordinator</h3>
              <p>
                Planning treatment from another city or country? We help you find the right hospital, arrange your stay, and guide you throughout your medical journey.
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

          {/* HEALTH INSURANCE */}
          <div
            className="premium-service-card"
            onClick={() => navigate("/insurance")}
          >
            <div className="service-text">
              <h3>Secure Your Health</h3>
              <p>
                Avoid unexpected medical expenses. Compare trusted insurance plans with cashless hospital benefits.
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

        {/* DOCTORS SECTION */}
        <section className="service-section">
          <div className="section-title-box">
            <div style={{ flex: 1 }}>
              <h2 className="title-text">Top <span>Doctors</span></h2>
              <div className="title-line"></div>
            </div>
            <button className="view-all-arrow-btn" onClick={() => navigate("/patient/finddoctors")}>
              View ALL <span>→</span>
            </button>
          </div>

          <div className="horizontal-card-row" ref={doctorScrollRef} style={{ cursor: 'grab' }}>
            {filterData(doctors).map((item) => (
              <div
                key={item.id}
                className="premium-v3-card"
                onClick={() => {
                  setSelected(item);
                  setShowBooking(false);
                }}
              >
                <div className="v3-card-top">
                  <img src={item.img} alt={item.name} />
                  <div className="v3-rating">⭐ {item.rating}</div>
                </div>

                <div className="v3-card-body">
                  <h3>{item.name}</h3>
                  <p className="v3-spec">{item.specialty}</p>
                  <p className="v3-loc">📍 {item.location}</p>
                  <p className="v3-exp">💼 {item.experience} experience</p>

                  <button
                    className="v3-btn secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(item);
                      setShowBooking(true); // 🔥 directly booking open
                    }}
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* HOSPITALS SECTION */}
        <section className="service-section">
          <div className="section-title-box" >
            <div style={{ flex: 1 }}>
              <h2 className="title-text">Premium <span>Hospitals</span></h2>
              <div className="title-line"></div>
            </div>
            <button className="view-all-arrow-btn" onClick={() => navigate("/patient/hospitals")}>
              View ALL <span>→</span>
            </button>
          </div>

          <div className="horizontal-card-row" ref={hospitalScrollRef} style={{ cursor: 'grab' }}>
            {filterData(hospitals).map((item) => (
              <div
                key={item.id}
                className="premium-v3-card"

              >
                <div className="v3-card-top">
                  <img src={item.img}
                    alt={item.name}
                  />
                  <div className="v3-rating">⭐ {item.rating}</div>
                </div>

                <div className="v3-card-body">
                  <h3>{item.name}</h3>
                  <p className="v3-loc">📍 {item.location}</p>

                  <button
                    className="v3-btn secondary"
                    onClick={(e) => {
                      e.stopPropagation();      // 🔥 IMPORTANT (card click double trigger avoid)
                      setSelectedHospital(item); // 🔥 SAME modal open
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* LABS SECTION */}
        <section className="service-section">
          <div className="section-title-box">
            <div style={{ flex: 1 }}>
              <h2 className="title-text">Diagnostic <span>Labs</span></h2>
              <div className="title-line"></div>
            </div>
            <button className="view-all-arrow-btn" onClick={() => navigate("/patient/labs")}>
              View ALL <span>→</span>
            </button>
          </div>

          <div className="horizontal-card-row" ref={labScrollRef} style={{ cursor: 'grab' }}>
            {filterData(labs).map((item) => (
              <div
                key={item.id}
                className="premium-v3-card"

              >
                <div className="v3-card-top">
                  <img src={item.img} alt={item.name} />
                  <div className="v3-rating">⭐ {item.rating}</div>
                </div>

                <div className="v3-card-body">
                  <h3>{item.name}</h3>
                  <p className="v3-loc">📍 {item.location}</p>

                  <button className="v3-btn secondary" onClick={() => {
                    setSelectedLab(item); // lab is clicked lab data
                    setShowModal(true);
                  }}>Book Test</button>
                </div>
              </div>
            ))}
          </div>
        </section>


      </div>
      {selected && !showBooking && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>

            <button className="modal-close-x" onClick={() => setSelected(null)}>×</button>

            <div className="modal-header-top">
              <img src={selected.img} className="modal-avatar" />

              <div className="modal-title-info">
                <h2>{selected.name}</h2>
                <span className="modal-spec-badge">{selected.specialty}</span>
                <p>⭐ {selected.rating} ({selected.experience})</p>
              </div>
            </div>

            <div className="modal-body-content">
              <div className="info-row"><strong>📍 Location:</strong> {selected.location}</div>
              <div className="info-row"><strong>🏥 Clinic:</strong> City Care Hospital</div>
              <div className="info-row"><strong>🎓 Education:</strong> MBBS, MD</div>
              <div className="info-row"><strong>💼 Experience:</strong> {selected.experience}</div>
              <div className="info-row"><strong>💰 Fee:</strong> ₹500</div>

              <div className="modal-bio-box">
                <strong>About Doctor:</strong>
                <p>Experienced {selected.specialty} specialist providing quality care.</p>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="primary-modal-btn"
                onClick={() => setShowBooking(true)}
              >
                Book Appointment
              </button>
            </div>

          </div>
        </div>
      )}
      {selected && showBooking && (
        <div className="booking-modal-overlay" onClick={() => setShowBooking(false)}>
          <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>

            <button className="modal-close" onClick={() => setShowBooking(false)}>✕</button>

            <div className="booking-scroll">

              <h2>Book Appointment</h2>

              {/* Doctor mini info */}
              <div className="booking-doctor">
                <img src={selected.img} />
                <div>
                  <h3>{selected.name}</h3>
                  <p>{selected.specialty}</p>
                </div>
              </div>

              {/* Date */}
              <div className="booking-section">
                <p>Select Date</p>
                <div className="date-list">
                  {[0, 1, 2, 3, 4].map((d) => {
                    const date = new Date();
                    date.setDate(date.getDate() + d);
                    return (
                      <button
                        key={d}
                        className={`date-chip ${selectedDate === d ? "active" : ""}`}
                        onClick={() => setSelectedDate(d)}
                      >
                        {date.toDateString().slice(0, 10)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time */}
              <div className="booking-section">
                <p>Select Time</p>
                <div className="slot-list">
                  {TIME_SLOTS.map((t) => (
                    <button
                      key={t}
                      className={`slot ${selectedTime === t ? "active" : ""}`}
                      onClick={() => setSelectedTime(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form */}
               <div className="booking-section">
                <p className="section-label">Patient Info</p>

                {selectedProfile ? (
                  <div className="selected-patient-card">
                    <h4>{selectedProfile.fullName}</h4>
                    <p>
                      {selectedProfile.relation} • {selectedProfile.age || "N/A"} yrs • {selectedProfile.gender}
                    </p>
                  </div>
                ) : (
                  <div className="selected-patient-card" style={{ borderColor: '#fee2e2' }}>
                    <p style={{ color: "#ef4444", margin: 0 }}>No profile selected</p>
                  </div>
                )}
              </div>

              <button className="primary-btn confirm-btn" onClick={handleConfirmBooking}>
                Confirm Appointment
              </button>

              <button
                className="secondary-btn confirm-btn"
                onClick={() => setShowBooking(false)}
              >
                Go Back
              </button>

            </div>
          </div>
        </div>
      )}
      {selectedHospital && (
        <div className="modal-overlay" onClick={() => setSelectedHospital(null)}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedHospital(null)}>
              &times;
            </button>

            <div className="modal-flex">

              {/* LEFT SIDE */}
              <div className="modal-info-side">

                {/* ✅ IMAGE SECTION FIXED */}
                {selectedHospital.images?.length > 0 && (
                  <>
                    <img
                      src={selectedHospital.images[currentImageIndex]}
                      className="modal-hero-img"
                      alt=""
                      onClick={() =>
                        setPreview(selectedHospital.images[currentImageIndex])
                      }
                    />

                    {selectedHospital.images.length > 1 && (
                      <>
                        <button
                          className="arrow left"
                          onClick={() =>
                            setCurrentImageIndex((prev) =>
                              prev === 0
                                ? selectedHospital.images.length - 1
                                : prev - 1
                            )
                          }
                        >
                          ◀
                        </button>

                        <button
                          className="arrow right"
                          onClick={() =>
                            setCurrentImageIndex((prev) =>
                              prev === selectedHospital.images.length - 1
                                ? 0
                                : prev + 1
                            )
                          }
                        >
                          ▶
                        </button>
                      </>
                    )}

                    <div className="modal-gallery">
                      {selectedHospital.images.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt=""
                          onClick={() => setCurrentImageIndex(i)}
                          style={{
                            border:
                              i === currentImageIndex
                                ? "2px solid #10b981"
                                : "1px solid #eee",
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* HEADER */}
                <div className="modal-header-info">
                  <div className="hosp-logo-mini">
                    <img src={selectedHospital.images?.[0]} alt="" />
                  </div>

                  <div className="hosp-title-wrap">
                    <h2>{selectedHospital.name}</h2>
                    <p>
                      📍 {selectedHospital.location}
                      <span className="star-span">
                        ⭐ {selectedHospital.rating}
                      </span>
                    </p>
                  </div>
                </div>

                {/* ABOUT */}
                <div className="about-section">
                  <h4>About Hospital</h4>
                  <p>
                    Multi-specialty hospital with advanced ICU, emergency,
                    diagnostics and surgical care.
                  </p>
                </div>

                {/* DEPARTMENTS */}
                <div className="depts-section">
                  <h4>Departments</h4>
                  <div className="icon-grid">
                    {selectedHospital.depts?.map((d, i) => (
                      <div key={i} className="dept-icon-item">
                        <span>⚕️</span>
                        <small>{d}</small>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FACILITIES */}
                <div className="facilities-section">
                  <h4>Facilities</h4>
                  <div className="icon-grid">
                    <div className="dept-icon-item">
                      <span>🏥</span>
                      <small>ICU</small>
                    </div>
                    <div className="dept-icon-item">
                      <span>🚑</span>
                      <small>Ambulance</small>
                    </div>
                    <div className="dept-icon-item">
                      <span>💊</span>
                      <small>Pharmacy</small>
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT SIDE */}
              <div className="modal-form-side">

                <h3>Booking & Admission Request</h3>

                <div className="form-group">
                  <label>Bed Selection</label>
                  <select className="form-select">
                    <option>General Ward</option>
                    <option>Private Room</option>
                    <option>Deluxe Room</option>
                    <option>ICU</option>
                    <option>Ventilator ICU</option>
                    <option>Emergency Bed</option>
                    <option>Isolation Ward</option>
                    <option>Maternity Ward</option>
                    <option>Pediatric Ward</option>
                  </select>
                </div>

                <div className="bed-availability-ui">
                  <p>Bed Availability</p>
                  <small className="green-text">
                    Beds Available: {selectedHospital.bedsAvailable} /{" "}
                    {selectedHospital.totalBeds}
                  </small>
                  <div className="booking-section">
                    <p>Patient Info</p>

                    {selectedProfile ? (
                      <div className="selected-patient-card">
                        <h4>{selectedProfile.fullName}</h4>
                        <p>
                          {selectedProfile.relation} • {selectedProfile.age || "N/A"} yrs • {selectedProfile.gender}
                        </p>
                      </div>
                    ) : (
                      <p style={{ color: "red" }}>No profile selected</p>
                    )}


                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(selectedHospital.bedsAvailable /
                          selectedHospital.totalBeds) *
                          100
                          }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="form-group">
                  <textarea placeholder="Reason for admission" rows="3"></textarea>
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Emergency Contact Number"
                  />
                </div>

                <button className="book-bed-btn">
                  Book Bed Now
                </button>

              </div>
            </div>
          </div>
        </div>
      )}
      {showConfirmation && (
        <div className="success-overlay">
          <div className="success-toast">
            <p style={{ fontWeight: 'bold', color: '#10B981' }}>Bed booked successfully ✅</p>
            <div style={{ fontSize: '13px', margin: '10px 0', color: '#666' }}>
              <p><strong>Hospital:</strong> {selectedHospital?.name}</p>
              <p><strong>Type:</strong> ICU Bed</p>
            </div>
            <button className="view-details-btn" onClick={() => setShowConfirmation(false)}>Confirm</button>
          </div>
        </div>
      )}

      {/* IMAGE FULL PREVIEW */}
      {preview && (
        <div className="full-preview-overlay active" onClick={() => setPreview(null)}>
          <img src={preview} className="full-preview-img" alt="Preview" onClick={(e) => e.stopPropagation()} />
          <button className="preview-close-btn" onClick={() => setPreview(null)}>×</button>

          {selectedHospital?.images?.length > 1 && (
            <>
              <button className="full-preview-arrow left" onClick={(e) => {
                e.stopPropagation();
                const idx = selectedHospital.images.indexOf(preview);
                const newIndex = idx === 0 ? selectedHospital.images.length - 1 : idx - 1;
                setPreview(selectedHospital.images[newIndex]);
              }}>◀</button>

              <button className="full-preview-arrow right" onClick={(e) => {
                e.stopPropagation();
                const idx = selectedHospital.images.indexOf(preview);
                const newIndex = idx === selectedHospital.images.length - 1 ? 0 : idx + 1;
                setPreview(selectedHospital.images[newIndex]);
              }}>▶</button>
            </>
          )}
        </div>
      )}
      {/* POPUP MODAL */}
      {showModal && (
        <div className="modal-root-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container-main" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="modal-header-banner">
              <div className="header-content-left">
                <h2>{selectedLab?.name || "Aarogya Diagnostic Center"}</h2>
                <div className="sub-meta">
                  <span>⭐ {selectedLab.rating || "4.8"}</span> | <span>📍 {selectedLab.location || "Andheri East, Mumbai"}</span>
                </div>
              </div>
              <div className="header-actions">
                <button className="btn-call-lab">📞 Call Lab</button>
                <button className="modal-close-icon" onClick={() => setShowModal(false)}>✕</button>
              </div>
            </div>

            {/* Tabs */}
            <div className="modal-nav-tabs">
              {['Available Tests', 'Packages', 'About Lab', 'Reviews'].map(tab => (
                <button
                  key={tab}
                  className={`tab-item ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Modal Scrollable Content */}
            <div className="modal-scroll-area">
              <div className="modal-grid-body">
                {/* Available Tests Tab */}
                {activeTab === 'Available Tests' && (
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
                          {filteredTests.map(test => (
                            <div className="check-item" key={test.id} onClick={() => toggleTest(test.id)}>
                              <div className="check-label-grp">
                                <input type="checkbox" checked={selectedTests.includes(test.id)} readOnly />
                                <span>{test.name}</span>
                              </div>
                              <span className="item-price">₹{test.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="two-col-row">
                      <div className="form-field">
                        <label>Date</label>
                        <input type="date" className="input-styled" defaultValue={new Date().toISOString().split('T')[0]} />
                      </div>
                      <div className="form-field">
                        <label>Time Slot</label>
                        <select className="input-styled">
                          <option>08:00 AM - 09:00 AM</option>
                          <option>10:00 AM - 11:00 AM</option>
                          <option>02:00 PM - 03:00 PM</option>
                          <option>05:00 PM - 06:00 PM</option>
                        </select>
                      </div>
                    </div>

                    <div className="pickup-info-toggle">
                      <div className="text-col">
                        <strong>Home Sample Pickup</strong>
                        <p>Technician will visit your address</p>
                      </div>
                      <StandardToggle
                        id="homePickup"
                        checked={homePickup}
                        onChange={() => setHomePickup(!homePickup)}
                      />
                    </div>

                    <div className="form-field">
                      <label>Pickup Address</label>
                      <textarea className="input-styled textarea" placeholder="Flat No, Building, Area Name..."></textarea>
                    </div>
                    <div className="booking-section">
                      <p>Patient Info</p>

                      {selectedProfile ? (
                        <div className="selected-patient-card">
                          <h4>{selectedProfile.fullName}</h4>
                          <p>
                            {selectedProfile.relation} • {selectedProfile.age || "N/A"} yrs • {selectedProfile.gender}
                          </p>
                        </div>
                      ) : (
                        <p style={{ color: "red" }}>No profile selected</p>
                      )}


                    </div>
                  </div>
                )}

                {/* Packages Tab */}
                {activeTab === 'Packages' && (
                  <div className="booking-form-side">
                    <h3 className="form-heading">Health Packages</h3>
                    {packagesData.map(pkg => (
                      <div key={pkg.id} className="package-mini-card">
                        <div className="pkg-info">
                          <h4>{pkg.name}</h4>
                          <p>Includes multiple parameters...</p>
                          <span className="pkg-price">₹{pkg.price}</span>
                        </div>
                        <button
                          className="btn-add-pkg"
                          onClick={() => {
                            if (selectedPackages.includes(pkg.id)) {
                              setSelectedPackages(selectedPackages.filter(id => id !== pkg.id));
                            } else {
                              setSelectedPackages([...selectedPackages, pkg.id]);
                            }
                          }}
                        >
                          {selectedPackages.includes(pkg.id) ? "Remove" : "Add"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'About Lab' && (
                  <div className="booking-form-side">
                    <h3 className="form-heading">About Aarogya Diagnostic</h3>
                    <p className="about-text">
                      Aarogya Diagnostic Center is a leading medical laboratory in Mumbai, established in 2010.
                      We use state-of-the-art automated equipment to ensure the highest accuracy.
                    </p>
                    <ul className="certs-list">
                      <li>✅ NABL Accredited</li>
                      <li>✅ ISO Certified</li>
                      <li>✅ 15+ Years Experience</li>
                    </ul>
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'Reviews' && (
                  <div className="booking-form-side">
                    <h3 className="form-heading">User Reviews</h3>

                    {selectedLab.reviews?.length > 0 ? (
                      selectedLab.reviews.map((rev, i) => (
                        <div className="review-item" key={i}>
                          <div className="rev-head">
                            <strong>{rev.name}</strong>
                            <span>{"⭐".repeat(Math.round(rev.ratingNumber))}</span>
                          </div>
                          <p>"{rev.comment}"</p>
                        </div>
                      ))
                    ) : (
                      <p>No reviews available</p>
                    )}
                  </div>
                )}


                {/* Billing Summary */}
                <div className="billing-summary-side">
                  <div className="summary-card">
                    <h4>Bill Details</h4>
                    <div className="summary-row"><span>Test Subtotal</span><span>₹{subtotal}</span></div>
                    <div className="summary-row"><span>Medical Tax (GST 5%)</span><span>₹{gst}</span></div>
                    <div className="summary-row"><span>Service Charge</span><span>₹{serviceCharge}</span></div>
                    {/* Conditional Rendering */}
                    {homePickup && (
                      <div className="summary-row"><span>Home Pickup Fee</span><span>₹{pickupFee}</span></div>
                    )}
                    <div className="grand-total-row"><span>Payable Amount</span><span>₹{grandTotal}</span></div>
                    <button className="btn-confirm-booking">Confirm Booking</button>
                    <p className="safe-text">🔒 100% Safe & Secure Payments</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
      {/* --- FOOTER SECTION --- */}
      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-column brand-col">
            <h2 className="footer-logo">Doc<span>Hub</span></h2>
            <p className="footer-desc">
              Mumbai's trusted healthcare network. Booking appointments,
              finding labs, and managing health records made simple.
            </p>
            <div className="footer-socials">
              <ul className="example-1">
                <li className="icon-content">
                  <a href="#" aria-label="Facebook" className="link">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                      <path d="M29.059 15.085C29.058 7.322 22.764 1.028 15 1.028S0.941 7.323 0.941 15.087c0 6.989 5.1 12.787 11.781 13.875l0.081 0.011V19.15H9.232v-4.065h3.57v-3.096a4.962 4.962 0 0 1 5.329 -5.469l-0.017 -0.001c1.124 0.016 2.212 0.115 3.273 0.292l-0.126 -0.018v3.459h-1.774a2.033 2.033 0 0 0 -2.291 2.204l-0.001 -0.008v2.636h3.899l-0.623 4.065h-3.276v9.823c6.762 -1.101 11.862 -6.899 11.863 -13.888" fill="currentColor"></path>
                    </svg>
                  </a>
                  <div className="tooltip">Facebook</div>
                </li>
                <li className="icon-content">
                  <a href="#" aria-label="Instagram" className="link">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="currentColor"></path>
                    </svg>
                  </a>
                  <div className="tooltip">Instagram</div>
                </li>
                <li className="icon-content">
                  <a href="#" aria-label="LinkedIn" className="link">
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
              <p>📞 +91  98765 - 43210</p>
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

export default AllServicesPage;