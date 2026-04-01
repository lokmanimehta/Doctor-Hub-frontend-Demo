import React, { useState, useEffect } from 'react';
import './LabsPage.css';
const StandardToggle = ({ id, checked, onChange }) => {
  return (
    <label className="switch-container" htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
      />
      <span className="slider-round"></span>
    </label>
  );
};
const labData = [
  { id: 1, name: 'Aarogya Diagnostic Center', discount: '20% OFF', rating: '4.8 (120 Reviews)', loc: 'Andheri East, Mumbai | 2.5 km away', pickup: 'Available', time: 'Within 24 hours', price: '299' },
  { id: 2, name: 'Thyrocare Labs', discount: '20% OFF', rating: '4.6 (120 Reviews)', loc: 'Andheri East, Mumbai | 2.5 km away', pickup: 'Available', time: 'Within 24 hours', price: '299' },
  { id: 3, name: 'Aarogya Diagnostic', discount: '20% OFF', rating: '4.8 (120 Reviews)', loc: 'Andheri East, Mumbai | 2.5 km away', pickup: 'Available', time: 'Within 24 hours', price: '299' },
  { id: 4, name: 'Thyrocare Labs', discount: '15% OFF', rating: '4.5 (90 Reviews)', loc: 'Andheri East, Mumbai | 3.1 km away', pickup: 'Available', time: 'Within 24 hours', price: '350' },
];
const LabsPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('Available Tests');
  const [selectedTests, setSelectedTests] = useState([1, 2, 3]); // IDs of tests
  const [testSearch, setTestSearch] = useState("");
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [homePickup, setHomePickup] = useState(false);
  const [homePickupFilter, setHomePickupFilter] = useState(false);
  const [selectedReportTime, setSelectedReportTime] = useState([]);
  const [modalSearch, setModalSearch] = useState("");
  const [priceRange, setPriceRange] = useState(5000);
  const selectedProfile = JSON.parse(localStorage.getItem("selectedProfile"));
  // Modal scroll lock
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [showModal]);

  const testCategories = [
    { name: 'Full Body Checkup', icon: '🩺' },
    { name: 'Blood Test', icon: '🩸' },
    { name: 'Diabetes', icon: '💉' },
    { name: 'Thyroid', icon: '🦋' },
    { name: 'Vitamin', icon: '💊' },
    { name: 'Fever / Covid', icon: '🌡️' },
  ];



  const allAvailableTests = [
    { id: 1, name: 'Full Body Checkup', price: 2500 },
    { id: 2, name: 'Thyroid Profile', price: 400 },
    { id: 3, name: 'Blood Test (CBC)', price: 150 },
    { id: 4, name: 'Liver Function Test', price: 800 },
    { id: 5, name: 'Lipid Profile', price: 600 },
    { id: 6, name: 'Kidney Function Test', price: 750 },
  ];
  const packagesData = [
    { id: 101, name: "Full Body Advanced", price: 3999 },
    { id: 102, name: "Diabetes Care Package", price: 1499 },
    { id: 103, name: "Heart Checkup Package", price: 2599 },
  ];
  const filteredTests = allAvailableTests.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(modalSearch.toLowerCase())

    const matchCategory = activeCategory
      ? t.name.toLowerCase().includes(activeCategory.toLowerCase())
      : true;

    return matchSearch && matchCategory;
  });

  const toggleTest = (id) => {
    if (selectedTests.includes(id)) {
      setSelectedTests(selectedTests.filter(tid => tid !== id));
    } else {
      setSelectedTests([...selectedTests, id]);
    }
  };

  const calculateSubtotal = () => {
    const testTotal = allAvailableTests
      .filter(t => selectedTests.includes(t.id))
      .reduce((acc, curr) => acc + curr.price, 0);

    const packageTotal = packagesData
      .filter(p => selectedPackages.includes(p.id))
      .reduce((acc, curr) => acc + curr.price, 0);

    return testTotal + packageTotal;
  };

  const subtotal = calculateSubtotal();
  const gst = Math.round(subtotal * 0.05); // 5% Medical GST
  const serviceCharge = 50;
  const pickupFee = 120;
  const grandTotal = subtotal + gst + serviceCharge + (homePickup ? pickupFee : 0);
  const filteredLabs = labData.filter(lab => {
    const matchSearch = testSearch
      ? lab.name.toLowerCase().includes(testSearch.toLowerCase()) ||
      lab.loc.toLowerCase().includes(testSearch.toLowerCase())
      : true;

    const matchPickup = homePickupFilter
      ? lab.pickup === "Available"
      : true;

    const matchTime =
      selectedReportTime.length > 0
        ? selectedReportTime.includes(lab.time)
        : true;
    const matchPrice = Number(lab.price) <= priceRange;

    return matchSearch && matchPickup && matchTime && matchPrice;
  });
  const handleLabBooking = () => {

    // ✅ Safety check
    if (!selectedProfile) {
      alert("Please select patient profile first");
      return;
    }

    if (selectedTests.length === 0 && selectedPackages.length === 0) {
      alert("Please select at least one test or package");
      return;
    }

    // ✅ Create booking object
    const booking = {
      type: "LAB",
      labName: "Aarogya Diagnostic Center", // later dynamic
      patientId: selectedProfile.id,
      patientName: selectedProfile.fullName,
      relation: selectedProfile.relation,
      tests: allAvailableTests.filter(t => selectedTests.includes(t.id)),
      packages: packagesData.filter(p => selectedPackages.includes(p.id)),
      homePickup: homePickup,
      totalAmount: grandTotal,
      date: new Date().toISOString(),
    };

    // ✅ Save in localStorage
    const existing = JSON.parse(localStorage.getItem("appointments")) || [];

    localStorage.setItem(
      "appointments",
      JSON.stringify([...existing, booking])
    );

    alert("Lab Test Booked ✅");

    setShowModal(false);
  };
  return (
    <div className="labs-view-container">
      {/* HERO SECTION */}
      <div className="labs-hero-section">
        <h1 className="hero-title">Book Diagnostic Tests & Health Packages Online</h1>
        <div className="hero-controls">
          <div className="search-bar-wrapper">

            <input
              type="text"
              placeholder="Search tests or labs..."
              onChange={(e) => setTestSearch(e.target.value)}
            />
            <button className="search-btn">🔍</button>
          </div>
          <button
            className="reset-btn"
            onClick={() => {
              setTestSearch("");
              setHomePickupFilter(false);
              setSelectedReportTime([]);
              setActiveCategory(null);
            }}
          >
            Reset
          </button>
        </div>
        <div className="popular-searches-chips">
          <small>Popular:</small>
          {['Full Body Checkup', 'Thyroid Profile', 'Vitamin D', 'Diabetes'].map(chip => (
            <span
              key={chip}
              className="search-chip"
              onClick={() => setTestSearch(chip)}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      <div className="labs-main-content">
        {/* TEST CATEGORIES */}
        <section className="category-section">
          <h3 className="section-heading">Test Categories</h3>
          <div className="cat-card-grid">
            {testCategories.map(cat => (
              <div
                key={cat.name}
                className={`cat-item-card ${activeCategory === cat.name ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.name)}
              >
                <div className="cat-icon-box">{cat.icon}</div>
                <p>{cat.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* MAIN LAYOUT */}
        <div className="layout-body">
          <aside className="filters-pane">
            <h3 className="filter-title">Filters</h3>
            <div className="filter-group">
              <label>Price Range</label>
              <div className="range-container">
                <input
                  type="range"
                  className="range-slider"
                  min="0"
                  max="5000"
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                />

                <div className="range-value">₹{priceRange}</div>
                <div className="range-labels"><span>₹0</span><span>₹5000+</span></div>
              </div>
            </div>

            <div className="filter-group toggle-row-flex">
              <label>Home Pickup</label>
              <StandardToggle
                id="homePickup"
                checked={homePickup}
                onChange={() => setHomePickup(!homePickup)}
              />
            </div>

            <div className="filter-group">
              <label>Report Time</label>
              <div className="checkbox-list">
                {['Within 6 hours', 'Same Day', 'Within 24 hours'].map(t => (
                  <label key={t} className="checkbox-row"><input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedReportTime([...selectedReportTime, t]);
                      } else {
                        setSelectedReportTime(selectedReportTime.filter(i => i !== t));
                      }
                    }}
                  /> {t}</label>
                ))}
              </div>
            </div>
          </aside>

          <section className="listings-pane">
            <div className="listing-header">
              <h3>Available Labs</h3>
              <span className="results-count">Showing {filteredLabs.length} Labs</span>
            </div>
            <div className="labs-grid">
              {filteredLabs.map(lab => (
                <div key={lab.id} className="enterprise-lab-card">
                  <div className="card-top">
                    <div className="name-area">
                      <h4>{lab.name}</h4>
                      <span className="discount-tag">{lab.discount}</span>
                    </div>
                    <p className="rating-row">⭐ {lab.rating}</p>
                  </div>
                  <div className="card-details">
                    <p>📍 {lab.loc}</p>
                    <p>🚚 Home Pickup: <span className="status-green">{lab.pickup}</span></p>
                    <p>⏱ Report Time: {lab.time}</p>
                    <div className="price-box">
                      <span className="from-text">From</span>
                      <span className="price-val">₹{lab.price}</span>
                    </div>
                    <p className="lab-certs">NABL Certified | Trusted Lab</p>
                  </div>
                  <div className="card-footer">
                    <button className="btn-secondary" onClick={() => setShowModal(true)}>View Details</button>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>Book Test</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* POPUP MODAL */}
      {showModal && (
        <div className="modal-root-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container-main" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-banner">
              <div className="header-content-left">
                <h2>Aarogya Diagnostic Center</h2>
                <div className="sub-meta">
                  <span>⭐ 4.6</span> | <span>📍 Andheri East, Mumbai</span> | <span>2.5 km away</span>
                </div>
              </div>
              <div className="header-actions">
                <button className="btn-call-lab">
                  <span className="call-icon">📞</span> Call Lab
                </button>
                <button className="modal-close-icon" onClick={() => setShowModal(false)}>✕</button>
              </div>
            </div>

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

            <div className="modal-scroll-area">
              <div className="modal-grid-body">
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
                                <input
                                  type="checkbox"
                                  checked={selectedTests.includes(test.id)}
                                  readOnly
                                />
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
                        <input type="date" className="input-styled" defaultValue="2026-03-22" />
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

                {activeTab === 'Packages' && (
                  <div className="booking-form-side">
                    <h3 className="form-heading">Health Packages</h3>
                    <div className="package-list">
                      {packagesData.map(pkg => (
                        <div key={pkg.id} className="package-mini-card">
                          <div className="pkg-info">
                            <h4>{pkg.name}</h4>
                            <p>Includes 85+ parameters (Heart, Liver, Kidney...)</p>
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

                {activeTab === 'Reviews' && (
                  <div className="booking-form-side">
                    <h3 className="form-heading">User Reviews</h3>
                    <div className="review-item">
                      <div className="rev-head">
                        <strong>Rohan Sharma</strong>
                        <span>⭐⭐⭐⭐⭐</span>
                      </div>
                      <p>"Very professional staff. Reports were delivered on time via WhatsApp."</p>
                    </div>
                    <div className="review-item">
                      <div className="rev-head">
                        <strong>Anita Desai</strong>
                        <span>⭐⭐⭐⭐</span>
                      </div>
                      <p>"Good service, home collection was smooth."</p>
                    </div>
                  </div>

                )}


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
                    <button
                      className="btn-confirm-booking"
                      onClick={handleLabBooking}
                    >
                      Confirm Booking
                    </button>
                    <p className="safe-text">🔒 100% Safe & Secure Payments</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabsPage;