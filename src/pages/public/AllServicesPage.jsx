import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./AllServices.css";
import Logo from "../../assets/images/logo.png";

const AllServicesPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // SaaS states
  const [saasDropdown, setSaasDropdown] = useState(false);
  const [doctorSub, setDoctorSub] = useState(false);
  const [patientSub, setPatientSub] = useState(false);
  const saasRef = useRef(null);





  // --- Refs for Click & Drag Horizontal Scroll ---
  const doctorScrollRef = useRef(null);
  const hospitalScrollRef = useRef(null);
  const labScrollRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (saasRef.current && !saasRef.current.contains(e.target)) setSaasDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const doctors = [
    { id: 1, name: "Dr. Anjali Mehta", specialty: "Cardiologist", location: "Andheri West, Mumbai", rating: 4.9, experience: "12 yrs", img: "https://randomuser.me/api/portraits/women/44.jpg" },
    { id: 2, name: "Dr. Rajesh Sharma", specialty: "Orthopedic", location: "Bandra East, Mumbai", rating: 4.7, experience: "10 yrs", img: "https://randomuser.me/api/portraits/men/32.jpg" },
    { id: 3, name: "Dr. Neha Verma", specialty: "Dermatologist", location: "Powai, Mumbai", rating: 4.8, experience: "8 yrs", img: "https://randomuser.me/api/portraits/women/68.jpg" },
    { id: 4, name: "Dr. Amit Patel", specialty: "Neurologist", location: "Malad West, Mumbai", rating: 4.6, experience: "15 yrs", img: "https://randomuser.me/api/portraits/men/12.jpg" },
    { id: 5, name: "Dr. Karan Shah", specialty: "Pediatrician", location: "Borivali, Mumbai", rating: 4.5, experience: "9 yrs", img: "https://randomuser.me/api/portraits/men/45.jpg" },
  ];

  const hospitals = [
    { id: 1, name: "Apollo Hospital", location: "Chennai", rating: 4.8, img: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3" },
    { id: 2, name: "Fortis Healthcare", location: "Mumbai", rating: 4.7, img: "https://images.unsplash.com/photo-1576091160550-2173dba999ef" },
    { id: 3, name: "Manipal Hospital", location: "Bangalore", rating: 4.6, img: "https://images.unsplash.com/photo-1538108149393-fbbd81895907" },
    { id: 4, name: "Max Hospital", location: "Delhi", rating: 4.5, img: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d" },
    { id: 5, name: "Medanta", location: "Gurgaon", rating: 4.7, img: "https://images.unsplash.com/photo-1504439468489-c8920d796a29" }
  ];

  const labs = [
    { id: 1, name: "Thyrocare Lab", location: "Mumbai", rating: 4.6, img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b" },
    { id: 2, name: "Dr Lal PathLabs", location: "Delhi", rating: 4.7, img: "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b" },
    { id: 3, name: "Metropolis Lab", location: "Chennai", rating: 4.5, img: "https://images.unsplash.com/photo-1579154204601-01588f351e67" },
    { id: 4, name: "SRL Diagnostics", location: "Bangalore", rating: 4.4, img: "https://images.unsplash.com/photo-1582719508461-905c673771fd" },
    { id: 5, name: "Healthians", location: "Hyderabad", rating: 4.6, img: "https://images.unsplash.com/photo-1580281657527-47b8d3d8b5a3" }
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
          <div className="nav-item dropdown-toggle" ref={saasRef}>
            <span onClick={() => setSaasDropdown(!saasDropdown)}>
              Services {saasDropdown ? "▴" : "▾"}
            </span>
            {saasDropdown && (
              <div className="dropdown-menu-desktop">
                <div className="dropdown-item" onClick={() => navigate("/doctor/dashboard")}>For Doctors</div>
                <div className="dropdown-item" onClick={() => navigate("/patient/dashboard")}>For Patients</div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item" onClick={() => navigate("/all-services")}>View All Services</div>
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

  {/* ASSISTANT */}
  <div 
    className="premium-service-card"
    onClick={() => navigate("/assistant")}
  >
    <div className="service-text">
      <h3>Smart Health Assistant</h3>
      <p>
        Check symptoms, understand possible conditions, and get guided to the right care.
      </p>
    </div>

    <button
      onClick={(e) => {
        e.stopPropagation();
        navigate("/assistant");
      }}
    >
      Start →
    </button>
  </div>

  {/* INSURANCE */}
  <div 
    className="premium-service-card"
    onClick={() => navigate("/insurance")}
  >
    <div className="service-text">
      <h3>Health Insurance</h3>
      <p>
        Explore trusted insurance plans and secure your healthcare expenses.
      </p>
    </div>

    <button
      onClick={(e) => {
        e.stopPropagation();
        navigate("/insurance");
      }}
    >
      Explore →
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
        e.stopPropagation(); // 🔥 MOST IMPORTANT
        navigate("/patient/finddoctors");
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
    <img src={item.img} alt={item.name} />
    <div className="v3-rating">⭐ {item.rating}</div>
  </div>

  <div className="v3-card-body">
    <h3>{item.name}</h3>
    <p className="v3-loc">📍 {item.location}</p>

    <button 
      className="v3-btn secondary"
      onClick={(e) => {
        e.stopPropagation();
        navigate("/patient/hospitals");
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

    <button 
      className="v3-btn secondary"
      onClick={(e) => {
        e.stopPropagation();
        navigate("/patient/labs");
      }}
    >
      Book Test
    </button>
  </div>
</div>
            ))}
          </div>
        </section>
        

      </div>

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
              <li onClick={() => navigate("/all-services")}>Hospitals</li>
              <li onClick={() => navigate("/all-services")}>Diagnostic Labs</li>
              <li onClick={() => navigate("/all-services")}>Online Pharmacy</li>
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
              <p>📞 +91 98765 43210</p>
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