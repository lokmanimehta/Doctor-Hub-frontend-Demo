import React, { useState, useEffect } from "react";
import { 
  Eye, Search, MapPin, Award, User, Phone, Mail, X, 
  Briefcase, GraduationCap, DollarSign, Calendar, 
  Star, Activity, ShieldCheck 
} from "lucide-react";
import "./Doctors.css";

const MOCK_DOCTORS = [
  {
    id: 1,
    name: "Dr. Arvind Kulkarni",
    email: "arvind.k@vitanex.com",
    phone: "+91 98200 12345",
    gender: "Male",
    speciality: "Cardiology",
    experience: "14",
    qualification: "MBBS, MD, FACC",
    registration: "MCIM/2010/0542",
    fee: "₹1200",
    status: "Verified",
    city: "Mumbai",
    rating: "4.9",
    totalPatients: "12,400+",
    joinedDate: "12 Jan 2024",
    clinic: {
      name: "Elite Heart Center",
      address: "102 Blue Terrace, Link Road",
      area: "Andheri West"
    },
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop"
  },
  {
    id: 2,
    name: "Dr. Sarah D'Souza",
    email: "sarah.dsouza@health.in",
    phone: "+91 99300 54321",
    gender: "Female",
    speciality: "Dermatology",
    experience: "8",
    qualification: "MBBS, DDVL",
    registration: "DMC/REG/8874",
    fee: "₹800",
    status: "Verified",
    city: "Pune",
    rating: "4.7",
    totalPatients: "8,200+",
    joinedDate: "05 Feb 2024",
    clinic: {
      name: "Glow Skin Clinic",
      address: "Park Avenue, Suite 4",
      area: "Koregaon Park"
    },
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop"
  },
  {
    id: 3,
    name: "Dr. Rajesh Iyer",
    email: "rajesh.iyer@neuro.com",
    phone: "+91 91670 99880",
    gender: "Male",
    speciality: "Neurology",
    experience: "20",
    qualification: "MBBS, MD, DM (Neuro)",
    registration: "MCI/77412",
    fee: "₹1500",
    status: "Verified",
    city: "Bangalore",
    rating: "5.0",
    totalPatients: "15,000+",
    joinedDate: "20 Nov 2023",
    clinic: {
      name: "Brain & Spine Hub",
      address: "Indiranagar 80 Feet Road",
      area: "Indiranagar"
    },
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop"
  }
];

export default function Doctors() {
  const [doctors] = useState(MOCK_DOCTORS);
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("");
  const [activeDoctor, setActiveDoctor] = useState(null);

  useEffect(() => {
    if (activeDoctor) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [activeDoctor]);

  const cities = [...new Set(doctors.map(d => d.city))];
  const specialities = [...new Set(doctors.map(d => d.speciality))];

  const filteredData = doctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase()) || 
                          doc.registration.toLowerCase().includes(search.toLowerCase()) ||
                          doc.email.toLowerCase().includes(search.toLowerCase());
    const matchesCity = selectedCity ? doc.city === selectedCity : true;
    const matchesSpec = selectedSpec ? doc.speciality === selectedSpec : true;
    return matchesSearch && matchesCity && matchesSpec;
  });

  return (
    <div className="admin-container">
      <div className="header-section">
        <h1>All Doctors</h1>
        <p style={{color: '#64748b', fontSize: '14px', marginTop: '5px'}}>Manage and verify medical professional profiles</p>
      </div>
      <div className="stats-grid">

<div className="stat-card">
<h3>124</h3>
<p>Total Doctors</p>
</div>

<div className="stat-card">
<h3>110</h3>
<p>Verified</p>
</div>

<div className="stat-card">
<h3>8</h3>
<p>Pending</p>
</div>

</div>
      <div className="controls-card">
        <div className="search-wrapper">
          <Search size={18} style={{position:'absolute', left: '15px', top: '13px', color: '#94a3b8'}} />
          <input 
            type="text" 
            placeholder="Search by name, Registration ID or Email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="filter-select" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
          <option value="">All Cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select className="filter-select" value={selectedSpec} onChange={(e) => setSelectedSpec(e.target.value)}>
          <option value="">All Specialities</option>
          {specialities.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    {filteredData.length === 0 && (
<div className="empty-state">
No doctors found
</div>
)}
      <div className="table-container">
        <table className="doctors-table">
          <thead>
            <tr>
              <th>Doctor Details</th>
              <th>Speciality</th>
              <th>Registration</th>
              <th>City</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(doc => (
              <tr key={doc.id}>
                <td>
                  <div className="doctor-info-cell">
                    <img src={doc.image} alt="dr" className="doctor-avatar" />
                    <div className="doctor-details">
                      <h4>{doc.name}</h4>
                      <p>{doc.email}</p>
                    </div>
                  </div>
                </td>
                <td>
                    <span style={{fontWeight: '600'}}>{doc.speciality}</span>
                    <div style={{fontSize: '11px', color: '#64748b'}}>{doc.experience} Yrs Exp</div>
                </td>
                <td style={{fontFamily: 'monospace', color: '#475569', fontSize: '13px'}}>{doc.registration}</td>
                <td>{doc.city}</td>
                <td>
                  <div className="status-pill">
                    <div className="status-dot"></div>
                    {doc.status}
                  </div>
                </td>
                <td>
                  <button className="action-btn" title="View Profile" onClick={() => setActiveDoctor(doc)}>
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeDoctor && (
        <div className="modal-backdrop" onClick={() => setActiveDoctor(null)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setActiveDoctor(null)}>
              <X size={20} />
            </button>

            <div className="modal-body">
              <div className="profile-top">
                <img src={activeDoctor.image} alt="profile" />
                <div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <h2 style={{margin: 0, fontSize: '24px'}}>{activeDoctor.name}</h2>
                    <ShieldCheck size={20} color="#10b981" />
                  </div>
                  <p style={{color: '#10b981', fontWeight: '700', fontSize: '15px', margin: '4px 0'}}>
                    {activeDoctor.qualification} • {activeDoctor.speciality}
                  </p>
                  <div style={{display: 'flex', gap: '15px', marginTop: '8px'}}>
                    <span style={{fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b'}}>
                      <Star size={14} fill="#f59e0b" color="#f59e0b" /> {activeDoctor.rating} Rating
                    </span>
                    <span style={{fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b'}}>
                      <User size={14} /> {activeDoctor.totalPatients} Patients
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-grid">
                <div className="info-item">
                  <label><User size={12}/> Gender</label>
                  <span>{activeDoctor.gender}</span>
                </div>
                <div className="info-item">
                  <label><Briefcase size={12}/> Experience</label>
                  <span>{activeDoctor.experience} Years of Practice</span>
                </div>
                <div className="info-item">
                  <label><Award size={12}/> Registration No.</label>
                  <span>{activeDoctor.registration}</span>
                </div>
                <div className="info-item">
                  <label><Calendar size={12}/> Onboarded Date</label>
                  <span>{activeDoctor.joinedDate}</span>
                </div>
                <div className="info-item">
                  <label><Mail size={12}/> Official Email</label>
                  <span>{activeDoctor.email}</span>
                </div>
                <div className="info-item">
                  <label><Phone size={12}/> Contact Number</label>
                  <span>{activeDoctor.phone}</span>
                </div>
                <div className="info-item">
                  <label><DollarSign size={12}/> Consultation Fee</label>
                  <span style={{color: '#10b981', fontSize: '18px'}}>{activeDoctor.fee}</span>
                </div>
                <div className="info-item">
                    <label><Activity size={12}/> Current Status</label>
                    <div className="status-pill" style={{width: 'fit-content'}}>
                        <div className="status-dot"></div>
                        {activeDoctor.status}
                    </div>
                </div>
              </div>

              <div className="clinic-section">
                <h4 style={{margin: '0 0 12px 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a'}}>
                  <MapPin size={16} color="#10b981" /> Clinic & Location Details
                </h4>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <div>
                        <p style={{margin: '0 0 4px 0', fontWeight: '700', fontSize: '15px'}}>{activeDoctor.clinic.name}</p>
                        <p style={{margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.5'}}>
                        {activeDoctor.clinic.address}<br/>
                        {activeDoctor.clinic.area}, {activeDoctor.city}
                        </p>
                    </div>
                    <button style={{padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer'}}>
                        View on Maps
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="pagination">

<button>Prev</button>
<button className="active">1</button>
<button>2</button>
<button>3</button>
<button>Next</button>

</div>
    </div>
  );
}