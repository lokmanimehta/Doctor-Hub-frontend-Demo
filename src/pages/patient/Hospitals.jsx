import React, { useState } from 'react';
import './Hospitals.css';
import { useNavigate } from 'react-router-dom';
const Hospitals = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("");
  const [specialityFilter, setSpecialityFilter] = useState("");
  const [preview, setPreview] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const selectedProfile = JSON.parse(localStorage.getItem("selectedProfile"));
  const [bedType, setBedType] = useState("General Ward");
  const hospitalsData = [
    { id: 1, name: "Apollo Hospital", location: "Chennai, Tamil Nadu", rating: "4.8", image: "https://images.unsplash.com/photo-1587350846662-3c0c591f4a4c?q=80&w=800", depts: ["Cardiology", "Orthopedics", "Neurology", "Pediatrics", "General"], bedsAvailable: 23, totalBeds: 50 },
    { id: 2, name: "Manipal Hospital", location: "Bengaluru, Karnataka", rating: "4.6", image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800", depts: ["Oncology", "Orthopedics"], bedsAvailable: 12, totalBeds: 40 },
    { id: 3, name: "Fortis Healthcare", location: "Mumbai, Maharashtra", rating: "4.7", image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=800", depts: ["Pediatrics", "Surgery"], bedsAvailable: 18, totalBeds: 45 },
    {
      id: 4, name: "Max Super Speciality", location: "Delhi, DL", rating: "4.5", images: [
        "https://images.unsplash.com/photo-1587350846662-3c0c591f4a4c",
        "https://images.unsplash.com/photo-1538108197017-c1a7148ef88f",
        "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d",
        "https://images.unsplash.com/photo-1629909613654-28e377c37b09"
      ], depts: ["Gastro", "Cardiology"], bedsAvailable: 9, totalBeds: 30
    },
    {
      id: 5, name: "Medanta Hospital", location: "Gurgaon, HR", rating: "4.9", images: [
        "https://images.unsplash.com/photo-1587350846662-3c0c591f4a4c",
        "https://images.unsplash.com/photo-1538108197017-c1a7148ef88f",
        "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d",
        "https://images.unsplash.com/photo-1629909613654-28e377c37b09"
      ], depts: ["Neurology", "Urology"], bedsAvailable: 31, totalBeds: 60
    },
    {
      id: 6, name: "Lilavati Hospital", location: "Mumbai, MH", rating: "4.4", images: [
        "https://images.unsplash.com/photo-1587350846662-3c0c591f4a4c",
        "https://images.unsplash.com/photo-1538108197017-c1a7148ef88f",
        "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d",
        "https://images.unsplash.com/photo-1629909613654-28e377c37b09"
      ], depts: ["General", "ENT"], bedsAvailable: 15, totalBeds: 35
    },
    {
      id: 7, name: "Cloudnine", location: "Pune, MH", rating: "4.7", images: [
        "https://images.unsplash.com/photo-1587350846662-3c0c591f4a4c",
        "https://images.unsplash.com/photo-1538108197017-c1a7148ef88f",
        "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d",
        "https://images.unsplash.com/photo-1629909613654-28e377c37b09"
      ], depts: ["Maternity", "Pediatrics"], bedsAvailable: 20, totalBeds: 40
    },
    {
      id: 8, name: "Global Hospital", location: "Hyderabad, TS", rating: "4.3", images: [
        "https://images.unsplash.com/photo-1587350846662-3c0c591f4a4c",
        "https://images.unsplash.com/photo-1538108197017-c1a7148ef88f",
        "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d",
        "https://images.unsplash.com/photo-1629909613654-28e377c37b09"
      ], depts: ["Multi-Speciality"], bedsAvailable: 27, totalBeds: 50
    },
    {
      id: 9, name: "Aster CMI", location: "Bangalore, KA", rating: "4.8", images: [
        "https://images.unsplash.com/photo-1587350846662-3c0c591f4a4c",
        "https://images.unsplash.com/photo-1538108197017-c1a7148ef88f",
        "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d",
        "https://images.unsplash.com/photo-1629909613654-28e377c37b09"
      ], depts: ["Neuroscience"], bedsAvailable: 14, totalBeds: 30
    },
    {
      id: 10, name: "Jaslok Hospital", location: "Mumbai, MH", rating: "4.6", images: [
        "https://images.unsplash.com/photo-1587350846662-3c0c591f4a4c",
        "https://images.unsplash.com/photo-1538108197017-c1a7148ef88f",
        "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d",
        "https://images.unsplash.com/photo-1629909613654-28e377c37b09"
      ], depts: ["Oncology", "IVF"], bedsAvailable: 11, totalBeds: 25
    },
  ];

  const handleOpenDetails = (hosp) => {
    setSelectedHospital(hosp);
    setIsModalOpen(true);
    setCurrentImageIndex(0);
  };

  const handleConfirm = (e) => {
    e.preventDefault();

    // ✅ SAFETY CHECK (VERY IMPORTANT)
    if (!selectedHospital) {
      alert("Something went wrong");
      return;
    }

    // ✅ Profile check
    if (!selectedProfile) {
      alert("Please select patient profile first");
      navigate("/patient/profile");
      return;
    }

    // ✅ Create booking object
    const booking = {
      type: "HOSPITAL",
      hospitalId: selectedHospital.id,
      hospitalName: selectedHospital.name,
      patientId: selectedProfile.id,
      patientName: selectedProfile.fullName,
      relation: selectedProfile.relation,
      bedsRequested: bedType, // ✅ GOOD: dynamic ho gaya
      date: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem("appointments")) || [];

    localStorage.setItem(
      "appointments",
      JSON.stringify([...existing, booking])
    );

    setIsModalOpen(false);
    setShowConfirmation(true);
  };
  const handleReset = () => {
    setSearchText("");
    setLocationFilter("");
    setBedFilter("");
    setSpecialityFilter("");
  };

  const filteredHospitals = hospitalsData.filter(hosp => {
    const matchSearch = hosp.name.toLowerCase().includes(searchText.toLowerCase());
    const matchLocation = locationFilter === "" || hosp.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchBeds = bedFilter === "" || (bedFilter === "ICU" && hosp.bedsAvailable > 0);
    const matchSpeciality = specialityFilter === "" || hosp.depts.join(" ").toLowerCase().includes(specialityFilter.toLowerCase());
    return matchSearch && matchLocation && matchBeds && matchSpeciality;
  });

  return (
    <div className="hospitals-page">

      {/* TOP SEARCH SECTION */}
      <header className="top-search-section">
        <div className="search-wrapper">
          <input
            type="text"
            className="global-search-input"
            placeholder="Search hospitals, treatments..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <div className="filter-row">
            <select className="filter-select" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
              <option value="">Location</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Pune">Pune</option>
              <option value="Delhi">Delhi</option>
              <option value="Chennai">Chennai</option>
              <option value="Bangalore">Bangalore</option>
            </select>

            <select className="filter-select" value={bedFilter} onChange={(e) => setBedFilter(e.target.value)}>
              <option value="">Beds</option>
              <option value="ICU">ICU Available</option>
              <option>Private Room</option>
              <option>General Ward</option>
            </select>

            <select className="filter-select" value={specialityFilter} onChange={(e) => setSpecialityFilter(e.target.value)}>
              <option value="">Speciality</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Neurology">Neurology</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Oncology">Oncology</option>
            </select>

            <button className="reset-filter-btn" onClick={handleReset}>Reset</button>
          </div>
        </div>
      </header>

      {/* HOSPITAL CARDS */}
      <section className="hospital-card-list">
        <h2>All Hospitals</h2>
        <div className="hospitals-grid">
          {filteredHospitals.map(hosp => (
            <div key={hosp.id} className="hosp-standard-card">
              <div className="hosp-card-img">
                <img src={hosp.images?.[0] || hosp.image} alt={hosp.name} />
                <span className="rating-tag">⭐ {hosp.rating}</span>
              </div>
              <div className="hosp-card-info">
                <h3>{hosp.name}</h3>
                <p className="loc-text">📍 {hosp.location}</p>
                <div className="hosp-meta">
                  <span>❤️ {hosp.depts[0]} • {hosp.depts[1] || "General"}</span>
                  <span>🏠 Emergency • ICU Available</span>
                </div>
                <p className="bed-types">Bed Types: ICU, Private</p>
                <button className="view-details-btn" onClick={() => handleOpenDetails(hosp)}>View Details</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MODAL & BOOKING */}
      {isModalOpen && selectedHospital && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            <div className="modal-flex">
              <div className="modal-info-side">
                {/* Hero Image + Gallery */}
                {(selectedHospital.images || [selectedHospital.image]).length > 0 && (
                  <>
                    <img
                      src={selectedHospital.images ? selectedHospital.images[currentImageIndex] : selectedHospital.image}
                      className="modal-hero-img"
                      alt=""
                      onClick={() => setPreview(selectedHospital.images?.[currentImageIndex] || selectedHospital.image)}
                    />
                    {selectedHospital.images?.length > 1 && (
                      <>
                        <button className="arrow left" onClick={() =>
                          setCurrentImageIndex(prev => prev === 0 ? selectedHospital.images.length - 1 : prev - 1)
                        }>◀</button>
                        <button className="arrow right" onClick={() =>
                          setCurrentImageIndex(prev => prev === selectedHospital.images.length - 1 ? 0 : prev + 1)
                        }>▶</button>
                      </>
                    )}
                    {selectedHospital.images && (
                      <div className="modal-gallery">
                        {selectedHospital.images.map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt=""
                            onClick={() => setCurrentImageIndex(i)}
                            style={{ border: i === currentImageIndex ? '2px solid var(--primary-color)' : '1px solid #eee' }}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Info */}
                <div className="modal-header-info">
                  <div className="hosp-logo-mini"><img src={selectedHospital.image} alt="" /></div>
                  <div className="hosp-title-wrap">
                    <h2>{selectedHospital.name}</h2>
                    <p>📍 {selectedHospital.location} <span className="star-span">⭐ {selectedHospital.rating}</span></p>
                  </div>
                </div>

                <div className="about-section">
                  <h4>About Hospital</h4>
                  <p>Multi-specialty care is mated to provide clinical physiology, and community co.</p>
                </div>

                <div className="depts-section">
                  <h4>Departments</h4>
                  <div className="icon-grid">
                    {selectedHospital.depts.map(d => (
                      <div key={d} className="dept-icon-item">
                        <span>⚕️</span>
                        <small>{d}</small>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="facilities-section">
                  <h4>Facilities</h4>
                  <div className="icon-grid">
                    <div className="dept-icon-item"><span>🏥</span><small>ICU</small></div>
                    <div className="dept-icon-item"><span>🚑</span><small>Ambulance</small></div>
                    <div className="dept-icon-item"><span>💊</span><small>Pharmacy</small></div>
                  </div>
                </div>
              </div>

              {/* Booking Form */}
              <div className="modal-form-side">
                <h3>Booking & Admission Request</h3>
                <form onSubmit={handleConfirm}>
                  <div className="form-group">
                    <label>Bed Selection</label>
                    <select
                      className="form-select"
                      value={bedType}
                      onChange={(e) => setBedType(e.target.value)}
                    >
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
                    <p>Bed Availability UI (Real-Time)</p>
                    <small className="green-text">Beds Available: {selectedHospital.bedsAvailable} / {selectedHospital.totalBeds}</small>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${(selectedHospital.bedsAvailable / selectedHospital.totalBeds) * 100}%` }}></div>
                    </div>
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

                  <button type="submit" className="book-bed-btn">Book Bed Now</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION */}
      {showConfirmation && (
        <div className="success-overlay">
          <div className="success-toast">
            <p style={{ fontWeight: 'bold', color: '#10B981' }}>Bed booked successfully ✅</p>
            <div style={{ fontSize: '13px', margin: '10px 0', color: '#666' }}>
              <p><strong>Hospital:</strong> {selectedHospital?.name}</p>
              <p><strong>Type:</strong> {bedType}</p>
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

    </div>
  );
};

export default Hospitals;