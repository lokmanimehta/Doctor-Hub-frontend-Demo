import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./About.css";
import Logo from "../../assets/images/logo.png";
import aboutHero1 from "../../assets/images/aboutHero1.png";
import aboutHero2 from "../../assets/images/aboutHero2.png";
import aboutHero3 from "../../assets/images/aboutHero3.png";
import { AuthContext } from "../../context/AuthContext";
import { useAuthActions } from "../../services/authService";
import { useProfile } from "../../context/useProfile";

const AboutUs = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const { currentUser, setCurrentUser } = useContext(AuthContext);
  const { logoutUser } = useAuthActions(setCurrentUser);
  const { clearProfile } = useProfile();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [sidebarProfileOpen, setSidebarProfileOpen] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);

  const heroSlides = useMemo(
    () => [
      {
        image: aboutHero1,
        badge: "Since 2026",
        title: "Your Health, Our Mission",
        desc: "Simplifying healthcare access with verified doctors, trusted clinics, and seamless appointment booking."
      },
      {
        image: aboutHero2,
        badge: "Trusted Care Network",
        title: "Healthcare Made Simple",
        desc: "Helping patients discover reliable healthcare services without confusion, delay, or unnecessary friction."
      },
      {
        image: aboutHero3,
        badge: "Patient First Platform",
        title: "Built For Better Care",
        desc: "A modern healthcare platform designed for patients, doctors, clinics, labs, and future digital health workflows."
      }
    ],
    []
  );

  const values = [
    {
      icon: "🛡️",
      title: "Verified Doctors",
      desc: "We keep trust first by building doctor discovery around verified profiles and clean medical information."
    },
    {
      icon: "⚡",
      title: "Faster Healthcare Access",
      desc: "Patients can search, compare, and move toward appointments without unnecessary phone calls or confusion."
    },
    {
      icon: "📱",
      title: "Simple Digital Experience",
      desc: "Doctor’s Hub is designed to feel clean, readable, and comfortable for patients, doctors, and clinics."
    }
  ];

  const processSteps = [
    {
      number: "01",
      title: "Search",
      desc: "Find doctors by speciality, clinic, city, area, or health need."
    },
    {
      number: "02",
      title: "Compare",
      desc: "Check profile, experience, clinic, consultation fee, and availability."
    },
    {
      number: "03",
      title: "Book",
      desc: "Choose the right slot and manage appointments digitally."
    }
  ];

  const stats = [
    { value: "500+", label: "Specialists" },
    { value: "50k+", label: "Appointments" },
    { value: "4.9/5", label: "User Rating" }
  ];


  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeSlide = heroSlides[heroIndex];

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setSidebarProfileOpen(false);
  };

  const goToSlide = (index) => {
    setHeroIndex(index);
  };

  const goToPreviousSlide = () => {
    setHeroIndex((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };

  const goToNextSlide = () => {
    setHeroIndex((prev) => (prev + 1) % heroSlides.length);
  };

  const handleLogout = async () => {
    clearProfile();
    setProfileDropdownOpen(false);
    closeSidebar();
    await logoutUser();
  };

  const goToRoleProfile = () => {
    if (currentUser?.role === "ADMIN") {
      navigate("/admin/profile");
    } else if (currentUser?.role === "DOCTOR") {
      navigate("/doctor/profile");
    } else {
      navigate("/patient/profile");
    }
  };

  const goToRoleDashboard = () => {
    if (currentUser?.role === "ADMIN") {
      navigate("/admin/dashboard");
    } else if (currentUser?.role === "DOCTOR") {
      navigate("/doctor/dashboard");
    } else {
      navigate("/patient/dashboard");
    }
  };

  const getUserInitial = () => {
    return currentUser?.fullName
      ? currentUser.fullName.charAt(0).toUpperCase()
      : "U";
  };

  return (
    <div className="about-page">
      <div
        className={`about-sidebar-overlay ${isSidebarOpen ? "active" : ""}`}
        onClick={closeSidebar}
      />

      <aside className={`mobile-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="about-sidebar-top">
          <div className="about-sidebar-logo" onClick={() => navigate("/")}>
            <img src={Logo} alt="Doctor's Hub Logo" />
            <h2>
              Doctor's <span>Hub</span>
            </h2>
          </div>

          <button className="about-sidebar-close" onClick={closeSidebar}>
            ×
          </button>
        </div>

        {currentUser && (
          <div className="sidebar-user-container">
            <div
              className={`sidebar-profile-card ${sidebarProfileOpen ? "expanded" : ""
                }`}
              onClick={() => setSidebarProfileOpen(!sidebarProfileOpen)}
            >
              <div className="sidebar-avatar">{getUserInitial()}</div>

              <div className="sidebar-info">
                <h3>{currentUser?.fullName || "User"}</h3>
                <p>{currentUser?.email || "Logged in user"}</p>
              </div>

              <span className="side-chevron">
                {sidebarProfileOpen ? "▲" : "▼"}
              </span>
            </div>

            {sidebarProfileOpen && (
              <div className="sidebar-inner-dropdown">
                <div
                  className="inner-opt"
                  onClick={() => {
                    goToRoleProfile();
                    closeSidebar();
                  }}
                >
                  <span className="inner-icon">👤</span>
                  Edit Profile
                </div>

                <div
                  className="inner-opt"
                  onClick={() => {
                    goToRoleDashboard();
                    closeSidebar();
                  }}
                >
                  <span className="inner-icon">📊</span>
                  Dashboard
                </div>
              </div>
            )}
          </div>
        )}

        <p className="sidebar-label">Navigation</p>

        <div
          className="sidebar-link"
          onClick={() => {
            navigate("/");
            closeSidebar();
          }}
        >
          <span>🏠</span>
          Home
        </div>

        <div className="sidebar-link active-side">
          <span>ℹ️</span>
          About Us
        </div>

        <div
          className="sidebar-link"
          onClick={() => {
            navigate("/all-services");
            closeSidebar();
          }}
        >
          <span>🛠️</span>
          Services
        </div>

        <div
          className="sidebar-link"
          onClick={() => {
            navigate("/blogs");
            closeSidebar();
          }}
        >
          <span>📰</span>
          Doctor Blogs
        </div>

        <div
          className="sidebar-link"
          onClick={() => {
            navigate("/contact");
            closeSidebar();
          }}
        >
          <span>📞</span>
          Contact Us
        </div>

        <div className="sidebar-footer">
          {!currentUser ? (
            <div className="sidebar-auth-grid">
              <button
                className="secondary-btn-mob"
                onClick={() => {
                  navigate("/login");
                  closeSidebar();
                }}
              >
                Login
              </button>

              <button
                className="primary-btn-mob"
                onClick={() => {
                  navigate("/signup");
                  closeSidebar();
                }}
              >
                Sign Up
              </button>
            </div>
          ) : (
            <button className="secondary-btn-mob logout-red" onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </aside>

      <header className="about-header">
        <div className="about-header-brand" onClick={() => navigate("/")}>
          <img src={Logo} alt="Doctor's Hub Logo" />
          <h1>
            Doctor's <span>Hub</span>
          </h1>
        </div>

        <nav className="about-header-nav">
          <button onClick={() => navigate("/")}>Home</button>
          <button className="active">About Us</button>
          <button onClick={() => navigate("/all-services")}>Services</button>
          <button onClick={() => navigate("/blogs")}>Doctor Blogs</button>
          <button onClick={() => navigate("/contact")}>Contact Us</button>
        </nav>

        <div className="about-header-actions">
          {!currentUser ? (
            <>
              <button className="about-login-btn" onClick={() => navigate("/login")}>
                Login
              </button>
              <button
                className="about-signup-btn"
                onClick={() => navigate("/signup")}
              >
                Sign Up
              </button>
            </>
          ) : (
            <div className="profile-wrapper about-desktop-profile" ref={dropdownRef}>
              <div
                className="profile-icon"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                {getUserInitial()}
              </div>

              {profileDropdownOpen && (
                <div className="dropdown-menu">
                  <div className="user-info-header">
                    <div className="user-avatar-mini">{getUserInitial()}</div>

                    <div className="user-details">
                      <span className="user-name">
                        {currentUser?.fullName || "User"}
                      </span>
                      <span className="user-email">
                        {currentUser?.email || "Logged in user"}
                      </span>
                    </div>
                  </div>

                  <div
                    className="dropdown-item"
                    onClick={() => {
                      goToRoleProfile();
                      setProfileDropdownOpen(false);
                    }}
                  >
                    <span className="icon-box">👤</span>
                    Edit Profile
                  </div>

                  <div
                    className="dropdown-item"
                    onClick={() => {
                      goToRoleDashboard();
                      setProfileDropdownOpen(false);
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
          )}

          <button
            className="about-hamburger"
            onClick={() => setIsSidebarOpen(true)}
          >
            ☰
          </button>
        </div>
      </header>

      <main>
        <section className="about-hero">
          <div className="about-hero-image-wrap">
            <img
              src={activeSlide.image}
              alt={activeSlide.title}
              className="about-hero-image"
            />

            <div className="about-hero-overlay" />

            <button
              className="about-slider-arrow about-slider-arrow-left"
              onClick={goToPreviousSlide}
              aria-label="Previous slide"
            >
              ‹
            </button>

            <button
              className="about-slider-arrow about-slider-arrow-right"
              onClick={goToNextSlide}
              aria-label="Next slide"
            >
              ›
            </button>

            <div className="about-hero-content">
              <span className="about-hero-badge">{activeSlide.badge}</span>
              <h2>{activeSlide.title}</h2>
              <p>{activeSlide.desc}</p>

              <div className="about-hero-buttons">
                <button onClick={() => navigate("/all-services")}>
                  Explore Services
                </button>
                <button onClick={() => navigate("/contact")}>
                  Contact Support
                </button>
              </div>

              <div className="about-slider-dots">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.title}
                    className={heroIndex === index ? "active" : ""}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="about-intro-section">
          <div className="about-section-heading">
            <span>About Doctor's Hub</span>
            <h2>One platform for simple, trusted healthcare access.</h2>
            <p>
              Doctor’s Hub is built to reduce healthcare confusion by connecting
              patients with verified doctors, clinics, appointments, and future
              digital health workflows in one clean platform.
            </p>
          </div>

          <div className="about-stats-grid">
            {stats.map((item) => (
              <div className="about-stat-card" key={item.label}>
                <h3>{item.value}</h3>
                <p>{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="about-values-section">
          <div className="about-section-heading">
            <span>Our Values</span>
            <h2>Built around trust, speed, and simplicity.</h2>
          </div>

          <div className="about-values-grid">
            {values.map((value) => (
              <div className="about-value-card" key={value.title}>
                <div className="about-value-icon">{value.icon}</div>
                <h3>{value.title}</h3>
                <p>{value.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="about-process-section">
          <div className="about-process-content">
            <span>How It Works</span>
            <h2>Healthcare journey made easier.</h2>
            <p>
              From discovery to appointment management, Doctor’s Hub focuses on
              clear steps so patients can make decisions confidently.
            </p>
          </div>

          <div className="about-process-grid">
            {processSteps.map((step) => (
              <div className="about-process-card" key={step.number}>
                <strong>{step.number}</strong>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>


        <section className="about-cta-section">
          <div>
            <span>Ready to start?</span>
            <h2>Find trusted healthcare support with Doctor’s Hub.</h2>
            <p>
              Explore doctors, clinics, services, and appointment options from a
              clean and patient-friendly experience.
            </p>
          </div>

          <button onClick={() => navigate("/")}>Go to Home</button>
        </section>
      </main>

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

export default AboutUs;