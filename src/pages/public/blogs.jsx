

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./blogs.css";
import Logo from "../../assets/images/logo.png"

const Blogs = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [saasDropdown, setSaasDropdown] = useState(false);
  const [doctorSub, setDoctorSub] = useState(false);
  const [patientSub, setPatientSub] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null); // State for Modal
  const saasRef = useRef(null);

  const articles = [
    { 
      title: "The Microbiome Connection: Gut Health & Immunity", 
      cat: "Gastroenterology", 
      date: "Feb 10", 
      img: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=800",
      desc: "Recent clinical studies reveal how your gut flora dictates your body's immune response to viral infections.",
      content: "The human gut is home to trillions of microbes that play a crucial role in our overall health. In 2026, research has solidified the 'Gut-Lung Axis' theory, showing that a diverse microbiome can significantly reduce the severity of respiratory illnesses. To maintain this balance, doctors recommend a diet rich in fermented foods like Kefir and Kimchi, alongside high-fiber prebiotics. Avoiding over-processed sugars is vital, as they feed harmful bacteria that trigger systemic inflammation. This article explores how personalized probiotic therapy is becoming the next frontier in preventive medicine in Mumbai's leading clinics."
    },
    { 
      title: "Advancements in Early Cardiac Detection", 
      cat: "Cardiology", 
      date: "Jan 28", 
      img: "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?auto=format&fit=crop&q=80&w=800",
      desc: "How AI-integrated ECG wearables are saving lives by detecting silent arrhythmias before symptoms occur.",
      content: "Cardiovascular diseases remains a top concern in urban populations. However, the rise of medical-grade wearables has changed the game. These devices now monitor heart rate variability (HRV) and QT intervals with 98% accuracy. Cardiologists emphasize that early detection of Atrial Fibrillation can prevent up to 80% of related strokes. At Doctor's Hub, we analyze how these data points are synced directly with physician dashboards for real-time intervention. We also discuss the importance of 'Heart-Healthy' sleep cycles and why deep sleep is the heart's primary recovery phase."
    },
    { 
      title: "The Silent Epidemic: Vitamin D Deficiency in Tropics", 
      cat: "Endocrinology", 
      date: "Jan 15", 
      img: "https://images.unsplash.com/photo-1505151741134-b8296518f2b8?auto=format&fit=crop&q=80&w=800",
      desc: "Why 70% of urban Indians are deficient in Vitamin D despite abundant sunlight, and its impact on bone density.",
      content: "It is a medical irony: despite being a sun-drenched country, Vitamin D deficiency is rampant. This is largely due to increased indoor lifestyles and high pollution levels blocking UVB rays. Vitamin D isn't just a vitamin; it's a pro-hormone that regulates calcium absorption and mood stability. Doctors now recommend 'Sun-Drenching' during specific hours (11 AM to 1 PM) for at least 15 minutes, or supplementation under clinical supervision. This blog breaks down the link between low Vitamin D and chronic fatigue, and why a simple blood test could be the key to unlocking your energy levels."
    },
    { 
      title: "Understanding Cortisol: Managing Stress Biologically", 
      cat: "Psychiatry", 
      date: "Jan 05", 
      img: "https://images.unsplash.com/photo-1499209974431-9dac3adaf471?auto=format&fit=crop&q=80&w=800",
      desc: "An in-depth look at how chronic stress hormone elevation leads to metabolic syndrome and brain fog.",
      content: "Stress is often viewed as a feeling, but it is a biological process driven by Cortisol. When your body stays in 'fight or flight' mode for too long, it leads to muscle breakdown, abdominal fat storage, and impaired cognitive function. Professional wellness strategies now focus on Vagus Nerve stimulation and diaphragmatic breathing to switch the body into the 'Rest and Digest' parasympathetic state. We cover evidence-based techniques like Forest Bathing (Shinrin-yoku) and how even 10 minutes of nature exposure can drop salivary cortisol levels by 20%."
    },
    { 
      title: "Precision Nutrition: The End of One-Size-Fits-All Diets", 
      cat: "Nutrition", 
      date: "Dec 28", 
      img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=800",
      desc: "Using genetic markers to determine the perfect macronutrient ratio for your unique DNA profile.",
      content: "Why does one person lose weight on a keto diet while another feels sluggish? The answer lies in Nutrigenomics. In 2026, we are moving away from generic diet charts. By analyzing DNA markers related to carbohydrate metabolism and fat oxidation, nutritionists can now craft plans that optimize cellular energy. This article explains the role of Continuous Glucose Monitors (CGM) in understanding how specific foods—like white rice or whole wheat—affect your blood sugar spikes individually. It's time to stop guessing and start measuring your metabolic health."
    },
    { 
      title: "Digital Eye Strain: Protecting Vision in the AI Era", 
      cat: "Ophthalmology", 
      date: "Dec 20", 
      img: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&q=80&w=800",
      desc: "Preventing Computer Vision Syndrome with the latest ergonomic research and blue-light filtration truths.",
      content: "With screen time averaging 9 hours a day for working professionals, our eyes are under constant fatigue. Digital Eye Strain (DES) causes headaches, dry eyes, and blurred vision. Ophthalmic experts suggest that the 'Blue Light' concern is secondary to 'Blink Rate' reduction. When staring at screens, we blink 60% less, leading to tear film evaporation. This blog details the 'Rule of 20s', the importance of proper ambient lighting to reduce glare, and why artificial tears are becoming a desk-staple for the modern workforce."
    }
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (saasRef.current && !saasRef.current.contains(e.target)) setSaasDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="home-wrapper">
      {/* --- BACKGROUND BLOBS --- */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>

      {/* --- SIDEBAR OVERLAY --- */}
      <div className={`sidebar-overlay ${isSidebarOpen ? "active" : ""}`} onClick={() => setIsSidebarOpen(false)}></div>

      {/* --- MOBILE SIDEBAR --- */}
      <aside className={`mobile-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2 style={{color:'var(--primary)', fontWeight:'800'}}>Doc<span>Hub</span></h2>
          <button onClick={() => setIsSidebarOpen(false)} className="close-sidebar-btn">×</button>
        </div>
        <div className="sidebar-content">
          <p className="sidebar-label">Navigation</p>
          <div className="sidebar-nav-link" onClick={() => {navigate("/"); setIsSidebarOpen(false);}}>🏠 Home</div>
          <div className="sidebar-nav-link" onClick={() => {navigate("/about"); setIsSidebarOpen(false);}}>ℹ️ About Us</div>
          <div className="sidebar-nav-link" onClick={() => {navigate("/all-services"); setIsSidebarOpen(false);}}>🛠️Services</div>
          <div className="sidebar-nav-link active-side" onClick={() => {navigate("/blogs"); setIsSidebarOpen(false);}}>📰 Doctor Blogs</div>
          <div className="sidebar-nav-link" onClick={() => {navigate("/contact"); setIsSidebarOpen(false);}}>📞 Contact Us</div>
          
          <p className="sidebar-label">SaaS Solutions</p>
          <div className="sidebar-nav-link" onClick={() => setDoctorSub(!doctorSub)}>👨‍⚕️ For Doctors {doctorSub ? "▾" : "▸"}</div>
          {doctorSub && <div className="sidebar-sub-link" onClick={() => navigate("/doctor/dashboard")}>→ Dashboard</div>}
          <div className="sidebar-nav-link" onClick={() => setPatientSub(!patientSub)}>👤 For Patients {patientSub ? "▾" : "▸"}</div>
          {patientSub && <div className="sidebar-sub-link" onClick={() => navigate("/patient/dashboard")}>→ Portal</div>}
        </div>
        <div className="sidebar-footer">
          <button className="secondary-btn-mob" onClick={() => navigate("/login")}>Login</button>
          <button className="primary-btn-mob" onClick={() => navigate("/signup")}>Sign Up</button>
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
          {/* Updated Services Dropdown in Navbar */}
<div className="nav-item dropdown-toggle" ref={saasRef}>
  <span onClick={() => setSaasDropdown(!saasDropdown)}>
    Services {saasDropdown ? "▴" : "▾"}
  </span>
  {saasDropdown && (
    <div className="dropdown-menu-desktop">
      {/* Existing SaaS options now under Services */}
      <div className="dropdown-item" onClick={() => navigate("/doctor/dashboard")}>For Doctors</div>
      <div className="dropdown-item" onClick={() => navigate("/patient/dashboard")}>For Patients</div>
      
      {/* Agar aapko purana 'All Services' link bhi yahan chahiye toh: */}
      <div className="dropdown-divider"></div>
      <div className="dropdown-item" onClick={() => navigate("/all-services")}>View All Services</div>
    </div>
  )}
</div>
          <span className="nav-item active-tab" onClick={() => navigate("/blogs")}> Doctor'sBlogs</span>
          <span className="nav-item" onClick={() => navigate("/contact")}>Contact Us</span>
                
        </nav>

        <div className="auth-buttons">
          <button className="login-btn-styled desktop-only" onClick={() => navigate("/login")}>Login</button>
          <button className="primary-btn-styled desktop-only" onClick={() => navigate("/signup")}>SignUp</button>
          <button className="hamburger-menu" onClick={() => setIsSidebarOpen(true)}>☰</button>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="main-content">
        <section className="blogs-hero">
          <div className="section-header">
            <h2>Medical <span>Journal</span></h2>
            <p style={{color:'var(--text-light)', marginTop:'10px', fontSize:'15px'}}>Verified health insights and research from Mumbai's top clinical specialists</p>
            <div className="accent-line"></div>
          </div>
        </section>

        <div className="blogs-grid-container">
          {articles.map((post, i) => (
            <div key={i} className="modern-doctor-card">
              <div 
                className="card-img-wrapper" 
                style={{backgroundImage: `url(${post.img})`, backgroundSize: 'cover', backgroundPosition: 'center'}}
              ></div>
              <div className="card-details">
                <span className="specialty-tag">{post.cat}</span>
                <h3>{post.title}</h3>
                <p className="experience-text" style={{margin:'5px 0 15px', lineHeight:'1.5', color:'#475569'}}>{post.desc}</p>
                <div style={{marginTop:'auto', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <span className="experience-text" style={{fontWeight:'600'}}>📅 {post.date}, 2026</span>
                    <button className="book-mini-btn" onClick={() => setSelectedPost(post)}>Read Article</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* --- RESEARCH-GRADE BLOG MODAL --- */}
      {selectedPost && (
        <div className="blog-modal-overlay" onClick={() => setSelectedPost(null)}>
            <div className="blog-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-modal-btn" onClick={() => setSelectedPost(null)}>×</button>
                
                <div className="modal-scroll-area">
                    <div className="modal-image-header" style={{backgroundImage: `url(${selectedPost.img})`}}>
                        <div className="modal-img-overlay">
                            <span className="specialty-tag modal-tag">{selectedPost.cat}</span>
                        </div>
                    </div>
                    
                    <div className="modal-body-text">
                        <div className="modal-header-info">
                            <span className="modal-date">Clinical Review • {selectedPost.date}, 2026</span>
                            <h2>{selectedPost.title}</h2>
                            <div className="author-badge">
                                <img src={Logo} alt="DocHub" className="author-img" />
                                <div>
                                    <p className="author-name">DocHub Medical Editorial Board</p>
                                    <p className="author-sub">Reviewed by Chief Medical Officer</p>
                                </div>
                            </div>
                        </div>

                        <hr className="modal-divider" />
                        
                        <div className="modal-article-content">
                            {selectedPost.content.split('. ').map((para, idx) => (
                                <p key={idx} className="content-paragraph">{para}.</p>
                            ))}
                        </div>

                        <div className="modal-disclaimer">
                            <p><strong>Disclaimer:</strong> This article is for informational purposes only and does not constitute medical advice. Always consult with a qualified healthcare provider for personal health concerns.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- FOOTER --- */}
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