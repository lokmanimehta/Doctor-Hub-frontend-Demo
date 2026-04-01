
import React from "react";
import "./DoctorDashboard.css";
import { doctorDashboardData } from "../../utils/doctorDashboardDummyData";
import { calculateProfileCompletion } from "../../utils/profileCompletion";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useNavigate } from "react-router-dom";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const DoctorDashboard = () => {
  const { stats, todaysAppointments } = doctorDashboardData;
  const navigate = useNavigate();
  const [profileCompletion, setProfileCompletion] = React.useState(0);

React.useEffect(() => {
  const getProfileCompletion = () => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser")) || {};
    const completion = calculateProfileCompletion(
  storedUser,
  storedUser.files
);
    setProfileCompletion(completion);
  };

  getProfileCompletion();

  window.addEventListener("storage", getProfileCompletion);

  return () => {
    window.removeEventListener("storage", getProfileCompletion);
  };
}, []);


  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        position: "bottom",
        labels: { boxWidth: 12, font: { size: 11 } } 
      } 
    }
  };

  const barData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [{
      label: "New Patients",
      data: [12, 19, 8, 15, 22, 10],
      backgroundColor: "rgba(16, 185, 129, 0.7)",
      borderRadius: 6,
    }],
  };

  const pieData = {
    labels: ["Visits", "Prescriptions", "Reports"],
    datasets: [{
      data: [45, 25, 30],
      backgroundColor: ["#3b82f6", "#f59e0b", "#6b7280"],
      borderWidth: 0,
    }],
  };

  return (
    <div className="doctor-dashboard-container">
      {/* 1. PROFILE ALERT BOX */}
     {profileCompletion < 100 ? (
  <div className="profile-alert-box">
    <div className="alert-content-left">
      <span className="icon-warning">⚠️</span>
      <div className="alert-text-wrapper">
        <h4>Complete Your Profile</h4>
        <p>Your profile is {profileCompletion}% completed.</p>
        <p className="profile-hint">
  {profileCompletion < 50 && "Complete your profile to get more patients"}
  {profileCompletion >= 50 && profileCompletion < 100 && "Add documents to get verified"}
</p>
      </div>
    </div>
    <div className="alert-content-right">
     <div className="custom-progress-bar">
  <div
    className="progress-active"
    style={{ width: `${profileCompletion}%` }}
  />
</div>
      <button
        className="btn-complete"
        onClick={() => navigate("/doctor/profile")}
      >
        Complete Now
      </button>
    </div>
  </div>
) : (
  <div className="profile-success-box">
    <div className="success-left">
      <span className="icon-success">✅</span>
      <div>
        <h4>Profile Completed</h4>
        <p>Your profile is verified and live for patients.</p>
      </div>
    </div>

    <div className="success-right">
      <button onClick={() => navigate("/doctor/profile")}>
        View Profile
      </button>
    </div>
  </div>
)}

      {/* 2. STATS CARDS */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="label">Total Patients</span>
          <h3>{stats.totalPatients}</h3>
        </div>
        <div className="stat-card">
          <span className="label">Today's Appointments</span>
          <h3>{stats.todayAppointments}</h3>
        </div>
        <div className="stat-card">
          <span className="label">Pending Approvals</span>
          <h3>{stats.pendingApprovals}</h3>
        </div>
      </div>

      {/* 3. APPOINTMENTS SECTION */}
      <div className="appointments-section">
        <h4 className="section-title">Today's Appointments</h4>
        
        {/* Desktop Table View */}
        <div className="desktop-table-view">
          <table className="doctor-data-table">
            <thead>
              <tr>
                <th>TIME</th>
                <th>PATIENT NAME</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {todaysAppointments.map((item) => (
                <tr key={item.id}>
                  <td>{item.time}</td>
                  <td className="name-highlight">{item.patient}</td>
                  <td>
                    <span className={`badge-status ${item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View (Hidden on Desktop) */}
        <div className="mobile-cards-view">
          {todaysAppointments.map((item) => (
            <div className="appointment-mobile-card" key={item.id}>
              <div className="card-row">
                <span className="card-label">TIME</span>
                <span className="card-value time-val">{item.time}</span>
              </div>
              <div className="card-row">
                <span className="card-label">PATIENT</span>
                <span className="card-value name-val">{item.patient}</span>
              </div>
              <div className="card-row">
                <span className="card-label">STATUS</span>
                <span className={`badge-status ${item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. CHARTS SECTION */}
      <div className="dashboard-charts">
        <div className="chart-item">
          <h5>New Patients (Monthly)</h5>
          <div className="canvas-container">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
        <div className="chart-item">
          <h5>Records Distribution</h5>
          <div className="canvas-container">
            <Pie data={pieData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;