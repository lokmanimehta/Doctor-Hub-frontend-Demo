import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./blogs.css";
import Logo from "../../assets/images/logo.png";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { useAuthActions } from "../../services/authService";
import { useProfile } from "../../context/useProfile";

const BlogImage = ({ blog, className }) => {
  const [imageFailed, setImageFailed] = useState(false);

  const getCategoryIcon = (category) => {
    const value = (category || "").toLowerCase();

    if (value.includes("cardio")) return "❤️";
    if (value.includes("diabetes")) return "🩺";
    if (value.includes("sleep")) return "🌙";
    if (value.includes("skin") || value.includes("derma")) return "✨";
    if (value.includes("mental") || value.includes("stress")) return "🧠";
    if (value.includes("eye") || value.includes("ophthal")) return "👁️";
    if (value.includes("ortho") || value.includes("back")) return "🦴";
    if (value.includes("nutrition") || value.includes("weight")) return "🥗";
    if (value.includes("medicine")) return "⚕️";

    return "📘";
  };

  return (
    <div className={className}>
      {!imageFailed && blog?.coverImageUrl ? (
        <img
          src={blog.coverImageUrl}
          alt={blog.title || "Doctor blog"}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="blogs-image-fallback">
          <span>{getCategoryIcon(blog?.category)}</span>
          <strong>{blog?.category || "Health Article"}</strong>
          <p>Doctor's Hub Medical Journal</p>
        </div>
      )}
    </div>
  );
};

const Blogs = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const { currentUser, setCurrentUser } = useContext(AuthContext);
  const { logoutUser } = useAuthActions(setCurrentUser);
  const { clearProfile } = useProfile();

  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [sidebarProfileOpen, setSidebarProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setSidebarProfileOpen(false);
  };

  const getUserInitial = () => {
    return currentUser?.fullName
      ? currentUser.fullName.charAt(0).toUpperCase()
      : "U";
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

  const handleLogout = async () => {
    clearProfile();
    setProfileDropdownOpen(false);
    closeSidebar();
    await logoutUser();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "Recently published";
    }

    return new Date(timestamp).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getReadTime = (content) => {
    if (!content) {
      return "2 min read";
    }

    const words = content.trim().split(/\s+/).length;
    const minutes = Math.max(2, Math.ceil(words / 180));

    return `${minutes} min read`;
  };

  const getParagraphs = (content) => {
    if (!content) {
      return [];
    }

    return content
      .split("\n")
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  };

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/public/blogs", {
          params: {
            page: 0,
            size: 20,
          },
        });

        setBlogs(response?.data?.blogs || []);
      } catch (err) {
        setError(err?.message || "Unable to load blogs right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedBlog) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedBlog]);

  const featuredBlog = blogs[0];
  const remainingBlogs = blogs.slice(1);

  return (
    <div className="blogs-page">
      <div
        className={`blogs-sidebar-overlay ${isSidebarOpen ? "active" : ""}`}
        onClick={closeSidebar}
      />

      <aside className={`blogs-mobile-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="blogs-sidebar-top">
          <div className="blogs-sidebar-logo" onClick={() => navigate("/")}>
            <img src={Logo} alt="Doctor's Hub Logo" />
            <h2>
              Doctor's <span>Hub</span>
            </h2>
          </div>

          <button className="blogs-sidebar-close" onClick={closeSidebar}>
            ×
          </button>
        </div>

        {currentUser && (
          <div className="blogs-sidebar-user-container">
            <div
              className={`blogs-sidebar-profile-card ${sidebarProfileOpen ? "expanded" : ""
                }`}
              onClick={() => setSidebarProfileOpen(!sidebarProfileOpen)}
            >
              <div className="blogs-sidebar-avatar">{getUserInitial()}</div>

              <div className="blogs-sidebar-info">
                <h3>{currentUser?.fullName || "User"}</h3>
                <p>{currentUser?.email || "Logged in user"}</p>
              </div>

              <span className="blogs-side-chevron">
                {sidebarProfileOpen ? "▲" : "▼"}
              </span>
            </div>

            {sidebarProfileOpen && (
              <div className="blogs-sidebar-inner-dropdown">
                <div
                  className="blogs-inner-opt"
                  onClick={() => {
                    goToRoleProfile();
                    closeSidebar();
                  }}
                >
                  <span>👤</span>
                  Edit Profile
                </div>

                <div
                  className="blogs-inner-opt"
                  onClick={() => {
                    goToRoleDashboard();
                    closeSidebar();
                  }}
                >
                  <span>📊</span>
                  Dashboard
                </div>
              </div>
            )}
          </div>
        )}

        <p className="blogs-sidebar-label">Navigation</p>

        <div
          className="blogs-sidebar-link"
          onClick={() => {
            navigate("/");
            closeSidebar();
          }}
        >
          <span>🏠</span>
          Home
        </div>

        <div
          className="blogs-sidebar-link"
          onClick={() => {
            navigate("/about");
            closeSidebar();
          }}
        >
          <span>ℹ️</span>
          About Us
        </div>

        <div
          className="blogs-sidebar-link"
          onClick={() => {
            navigate("/all-services");
            closeSidebar();
          }}
        >
          <span>🛠️</span>
          Services
        </div>

        <div className="blogs-sidebar-link active-side">
          <span>📰</span>
          Doctor Blogs
        </div>

        <div
          className="blogs-sidebar-link"
          onClick={() => {
            navigate("/contact");
            closeSidebar();
          }}
        >
          <span>📞</span>
          Contact Us
        </div>

        <div className="blogs-sidebar-footer">
          {!currentUser ? (
            <div className="blogs-sidebar-auth-grid">
              <button
                className="blogs-secondary-btn-mob"
                onClick={() => {
                  navigate("/login");
                  closeSidebar();
                }}
              >
                Login
              </button>

              <button
                className="blogs-primary-btn-mob"
                onClick={() => {
                  navigate("/signup");
                  closeSidebar();
                }}
              >
                Sign Up
              </button>
            </div>
          ) : (
            <button
              className="blogs-secondary-btn-mob blogs-logout-red"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}
        </div>
      </aside>

      <header className="blogs-header">
        <div className="blogs-header-brand" onClick={() => navigate("/")}>
          <img src={Logo} alt="Doctor's Hub Logo" />
          <h1>
            Doctor's <span>Hub</span>
          </h1>
        </div>

        <nav className="blogs-header-nav">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/about")}>About Us</button>
          <button onClick={() => navigate("/all-services")}>Services</button>
          <button className="active">Doctor Blogs</button>
          <button onClick={() => navigate("/contact")}>Contact Us</button>
        </nav>

        <div className="blogs-header-actions">
          {!currentUser ? (
            <>
              <button
                className="blogs-login-btn"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
              <button
                className="blogs-signup-btn"
                onClick={() => navigate("/signup")}
              >
                Sign Up
              </button>
            </>
          ) : (
            <div className="blogs-profile-wrapper" ref={dropdownRef}>
              <div
                className="blogs-profile-icon"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                {getUserInitial()}
              </div>

              {profileDropdownOpen && (
                <div className="blogs-dropdown-menu">
                  <div className="blogs-user-info-header">
                    <div className="blogs-user-avatar-mini">
                      {getUserInitial()}
                    </div>

                    <div className="blogs-user-details">
                      <span className="blogs-user-name">
                        {currentUser?.fullName || "User"}
                      </span>
                      <span className="blogs-user-email">
                        {currentUser?.email || "Logged in user"}
                      </span>
                    </div>
                  </div>

                  <div
                    className="blogs-dropdown-item"
                    onClick={() => {
                      goToRoleProfile();
                      setProfileDropdownOpen(false);
                    }}
                  >
                    <span className="blogs-icon-box">👤</span>
                    Edit Profile
                  </div>

                  <div
                    className="blogs-dropdown-item"
                    onClick={() => {
                      goToRoleDashboard();
                      setProfileDropdownOpen(false);
                    }}
                  >
                    <span className="blogs-icon-box">📊</span>
                    Dashboard
                  </div>

                  <div
                    className="blogs-dropdown-item blogs-logout-btn"
                    onClick={handleLogout}
                  >
                    <span className="blogs-icon-box">🚪</span>
                    Logout
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            className="blogs-hamburger"
            onClick={() => setIsSidebarOpen(true)}
          >
            ☰
          </button>
        </div>
      </header>

      <main>
        <section className="blogs-hero-section">
          <div className="blogs-hero-content">
            <span className="blogs-hero-badge">Health Articles</span>
            <h2>Read, learn, and stay aware.</h2>
            <p>
              Simple health reads on prevention, wellness, and everyday care.
            </p>
          </div>
        </section>

        <section className="blogs-content-section">



          {loading && (
            <div className="blogs-state-card">
              <div className="blogs-loader"></div>
              <h3>Loading blogs...</h3>
              <p>Fetching latest health articles from backend.</p>
            </div>
          )}

          {!loading && error && (
            <div className="blogs-state-card error">
              <h3>Unable to load blogs</h3>
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}

          {!loading && !error && blogs.length === 0 && (
            <div className="blogs-state-card">
              <h3>No blogs found</h3>
              <p>Published blogs will appear here.</p>
            </div>
          )}

          {!loading && !error && featuredBlog && (
            <article className="blogs-featured-card">
              <BlogImage blog={featuredBlog} className="blogs-featured-image" />

              <div className="blogs-featured-content">
                <div className="blogs-meta-row">
                  <small>{formatDate(featuredBlog.publishedAt)}</small>
                  <small>{getReadTime(featuredBlog.content)}</small>
                </div>

                <h3>{featuredBlog.title}</h3>
                <p>{featuredBlog.summary}</p>

                <div className="blogs-author-row">
                  <div className="blogs-author-avatar">DH</div>
                  <div>
                    <strong>{featuredBlog.authorName}</strong>
                    <span>Medical editorial content</span>
                  </div>
                </div>

                <button onClick={() => setSelectedBlog(featuredBlog)}>
                  Read Full Article
                </button>
              </div>
            </article>
          )}

          {!loading && !error && remainingBlogs.length > 0 && (
            <div className="blogs-grid">
              {remainingBlogs.map((blog) => (
                <article className="blogs-card" key={blog.id}>
                  <BlogImage blog={blog} className="blogs-card-image" />

                  <div className="blogs-card-body">
                    <div className="blogs-card-meta">
                      <span>{formatDate(blog.publishedAt)}</span>
                      <span>{getReadTime(blog.content)}</span>
                    </div>

                    <h3>{blog.title}</h3>
                    <p>{blog.summary}</p>

                    <div className="blogs-card-footer">
                      <div>
                        <strong>{blog.authorName}</strong>
                        <small>Medical editorial content</small>
                      </div>

                      <button onClick={() => setSelectedBlog(blog)}>Read</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="blogs-cta-section">
          <div>
            <span>Need care?</span>
            <h2>Use health knowledge with the right medical guidance.</h2>
            <p>
              Blogs help awareness, but personal symptoms need a qualified
              doctor consultation.
            </p>
          </div>

          <button onClick={() => navigate("/")}>Find Doctors</button>
        </section>
      </main>

      {selectedBlog && (
        <div className="blogs-modal-overlay" onClick={() => setSelectedBlog(null)}>
          <div
            className="blogs-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="blogs-modal-close"
              onClick={() => setSelectedBlog(null)}
              aria-label="Close article"
            >
              ×
            </button>

            <div className="blogs-modal-layout">
              <BlogImage blog={selectedBlog} className="blogs-modal-side-image" />

              <div className="blogs-modal-body">
                <div className="blogs-modal-meta">
                  <span>Clinical Review</span>
                  <span>{formatDate(selectedBlog.publishedAt)}</span>
                  <span>{getReadTime(selectedBlog.content)}</span>
                </div>

                <h2>{selectedBlog.title}</h2>

                <div className="blogs-modal-author">
                  <div className="blogs-modal-author-avatar">DH</div>
                  <div>
                    <strong>{selectedBlog.authorName}</strong>
                    <p>Reviewed health education content</p>
                  </div>
                </div>

                <p className="blogs-modal-summary">{selectedBlog.summary}</p>

                <div className="blogs-modal-content">
                  {getParagraphs(selectedBlog.content).map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>

                <div className="blogs-modal-disclaimer">
                  <strong>Disclaimer:</strong> This article is for informational
                  purposes only and does not replace medical advice. Always
                  consult a qualified healthcare provider for personal health
                  concerns.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default Blogs;