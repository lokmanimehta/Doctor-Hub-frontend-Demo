
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Patients.css";
import { useEffect } from "react";
import { getPatients } from "../../services/doctorService";
const Patients = () => {
  const navigate = useNavigate();
const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("All");
  const [clinicFilter, setClinicFilter] = useState("All");
  const [criticalFilter, setCriticalFilter] = useState(false);

  useEffect(() => {
  getPatients().then(setPatients);
}, []);
  const clinicOptions = useMemo(() => {
    return [...new Set(patients.map(p => p.hospital_name))];
  }, [patients]);

  const filteredPatients = useMemo(() => {
    let temp = [...patients];

    if (genderFilter !== "All") {
      temp = temp.filter(p => p.gender === genderFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      temp = temp.filter(p =>
        p.full_name.toLowerCase().includes(term) ||
        p.complaint.toLowerCase().includes(term)
      );
    }

    if (clinicFilter !== "All") {
      temp = temp.filter(p => p.hospital_name === clinicFilter);
    }

    if (criticalFilter) {
      temp = temp.filter(p => p.is_critical);
    }

    return temp;
  }, [patients, searchTerm, genderFilter, clinicFilter, criticalFilter]);

  return (
    <div className="patients-page">
      <div className="patients-header">
        <h2>Patient Directory</h2>
        <span className="count-badge">{filteredPatients.length}</span>
      </div>

      {/* Filters */}
<div className="filters">
  <div className="filter-left">
    <input
      type="text"
      className="search-input"
      placeholder="Search by name or complaint..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />

    <select
      value={genderFilter}
      onChange={(e) => setGenderFilter(e.target.value)}
    >
      <option value="All">All Gender</option>
      <option value="Male">Male</option>
      <option value="Female">Female</option>
    </select>

    <select
      value={clinicFilter}
      onChange={(e) => setClinicFilter(e.target.value)}
    >
      <option value="All">All Clinics</option>
      {clinicOptions.map((clinic, index) => (
        <option key={index} value={clinic}>
          {clinic}
        </option>
      ))}
    </select>

    <div className="critical-wrapper">
      <input
        type="checkbox"
        id="criticalOnly"
        checked={criticalFilter}
        onChange={(e) => setCriticalFilter(e.target.checked)}
      />
      <label htmlFor="criticalOnly">Critical Only</label>
    </div>
  </div>

  <button
    className="reset-btn"
    onClick={() => {
      setSearchTerm("");
      setGenderFilter("All");
      setClinicFilter("All");
      setCriticalFilter(false);
    }}
  >
    Reset
  </button>
</div>


      {/* Desktop Table */}
      <div className="table-view">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Complaint</th>
              <th>Clinic</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.full_name}</td>
                <td>{p.age}</td>
                <td>{p.gender}</td>
                <td>{p.complaint}</td>
                <td>{p.hospital_name}</td>
                <td>
                  {p.is_critical ? (
                    <span className="critical-badge">Critical</span>
                  ) : (
                    "Normal"
                  )}
                </td>
                <td>
                  <button className="" onClick={() => navigate(`/doctor/patients/${p.id}`)}>
                   👁️‍🗨️ 
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="card-view">
        {filteredPatients.map((p) => (
          <div className="patient-card" key={p.id}>
            <h4>{p.full_name}</h4>
            <p><strong>Age:</strong> {p.age}</p>
            <p><strong>Gender:</strong> {p.gender}</p>
            <p><strong>Complaint:</strong> {p.complaint}</p>
            <p><strong>Clinic:</strong> {p.hospital_name}</p>
            <p>
              <strong>Status:</strong>{" "}
              {p.is_critical ? (
                <span className="critical-badge">Critical</span>
              ) : (
                "Normal"
              )}
            </p>
            <button onClick={() => navigate(`/doctor/patients/${p.id}`)}>
             👁️‍🗨️ 
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Patients;
