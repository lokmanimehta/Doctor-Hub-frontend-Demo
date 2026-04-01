import React, { useState } from "react";
import "./PendingVerifications.css"; 
import { adminDashboarddoctorData } from "../../utils/adminDashboardDummyData";
import PendingDoctorModal from "../../pages/admin/PendingDoctorModal";

const PendingVerifications = () => {
  const [pendingDoctors, setPendingDoctors] = useState(
    adminDashboarddoctorData.pendingDoctors
  );
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // ✅ Verify doctor (modal ke through)
  const handleVerify = (id) => {
    console.log("Verified doctor ID:", id);
    setPendingDoctors(prev => prev.filter(doc => doc.id !== id));
    setSelectedDoctor(null);
  };

  // ✅ Reject doctor (modal ke through)
  const handleReject = (id, reason) => {
    console.log("Rejected doctor ID:", id, "Reason:", reason);
    setPendingDoctors(prev => prev.filter(doc => doc.id !== id));
    setSelectedDoctor(null);
  };

  // ✅ Ignore doctor (instant card remove)
 

  return (
    <div className="pending-verifications-page">
      <h2>Pending Doctor Verifications</h2>

      {pendingDoctors.length === 0 ? (
        <p className="no-pending-msg">No pending verifications</p>
      ) : (
        <div className="doctor-cards">
          {pendingDoctors.map((doc) => (
            <div key={doc.id} className="doctor-verification-card">
              <div className="card-profile-section">
                <img className="card-avatar" src={doc.image} alt={doc.name} />
                <div className="doctor-name-meta">
                  <h3>{doc.name}</h3>
                  <span className="doctor-specialty-tag">{doc.specialty}</span>
                </div>
              </div>

              <div className="card-details">
                {doc.experience} yrs • {doc.clinic?.city || "N/A"}, {doc.clinic?.area || "N/A"} • Fee: {doc.consultationFee}
              </div>

              <div className="card-actions">
                {/* Review opens modal */}
                <button className="btn-review" onClick={() => setSelectedDoctor(doc)}>
                  Review
                </button>

                {/* Ignore instantly removes card */}
               
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal only for Review / Verify / Reject */}
      {selectedDoctor && (
        <PendingDoctorModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          onVerify={handleVerify}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

export default PendingVerifications;