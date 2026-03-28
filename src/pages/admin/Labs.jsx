import React, { useState } from 'react';
import './Labs.css';

const Labs = () => {
  const initialLabs = [
    {
      id: 1,
      name: 'CityLab Diagnostics',
      location: 'Mumbai',
      contact: '+91 ****546574',
      email: 'info@citylab.in',
      type: 'Pathology',
      addedBy: 'Admin',
      status: 'Active',
      badge: 'System-Verified',
      testsAssigned: 154,
      activeDoctors: 12
    },
    {
      id: 2,
      name: 'Local Diagnostics Center',
      location: 'Bangalore',
      contact: '+91 ****666573',
      email: 'local@diag.com',
      type: 'Radiology',
      addedBy: 'Dr. Priya Patel',
      status: 'Active',
      badge: 'Doctor-Added',
      testsAssigned: 45,
      activeDoctors: 3
    },
    {
      id: 3,
      name: 'TrustCare Labs',
      location: 'Hyderabad',
      contact: '+91 ****229464',
      email: 'contact@trustcare.in',
      type: 'Collection',
      addedBy: 'Admin',
      status: 'Suspended',
      badge: 'System-Verified',
      testsAssigned: 89,
      activeDoctors: 8
    }
  ];

  const [labs, setLabs] = useState(initialLabs);
const [searchTerm, setSearchTerm] = useState('');
const [filterCity, setFilterCity] = useState('All');

const [selectedLab, setSelectedLab] = useState(null);

const [actionLab, setActionLab] = useState(null);
const [actionType, setActionType] = useState("");
const [actionReason, setActionReason] = useState("");

const [isAddModalOpen, setIsAddModalOpen] = useState(false);

const [newLab, setNewLab] = useState({
  name: '',
  location: '',
  contact: '',
  email: '',
  type: 'Pathology'
});

const verifyLab = (lab) => {
  setActionLab(lab);
  setActionType("verify");
};

  // Logic to Add Lab to Table
  const handleAddLab = (e) => {
    e.preventDefault();
    const labToAdd = {
      ...newLab,
      id: Date.now(), 
      addedBy: 'Admin',
      status: 'Active',
      badge: 'System-Verified', // FIXED: Admin add kar raha hai toh verified hi aayega
      testsAssigned: 0,
      activeDoctors: 0
    };
    setLabs([...labs, labToAdd]);
    setIsAddModalOpen(false); 
    setNewLab({ name: '', location: '', contact: '', email: '', type: 'Pathology' }); 
  };

const toggleStatus = (lab) => {
  setActionLab(lab);
  setActionType(lab.status === "Active" ? "suspend" : "activate");
};


  const filteredLabs = labs.filter(lab => {
    const matchesSearch = lab.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = filterCity === 'All' || lab.location === filterCity;
    return matchesSearch && matchesCity;
  });
const handleConfirmAction = () => {

  if (!actionLab) return;

  if (actionType === "verify") {

    setLabs(labs.map(l =>
      l.id === actionLab.id
        ? { ...l, badge: "System-Verified" }
        : l
    ));

  }

  if (actionType === "suspend") {

    if (!actionReason.trim()) {
  return;
}

    setLabs(labs.map(l =>
      l.id === actionLab.id
        ? { ...l, status: "Suspended" }
        : l
    ));

  }

  if (actionType === "activate") {

    setLabs(labs.map(l =>
      l.id === actionLab.id
        ? { ...l, status: "Active" }
        : l
    ));

  }

  setActionLab(null);
  setActionType("");
  setActionReason("");

};
  return (
    <div className="labs-container">
      <div className="labs-header">
        <div className="header-text">
          <h1>1️⃣ LABS LIST</h1>
          <p>Centralized Laboratory Management</p>
        </div>
        <button className="add-lab-btn-pro" onClick={() => setIsAddModalOpen(true)}>
          <span>＋</span> Add New Lab
        </button>
      </div>

      <div className="labs-stats-pro">
        <div className="stat-card">Total: <b>{labs.length}</b></div>
        <div className="stat-card v-green">Verified: <b>{labs.filter(l => l.badge === 'System-Verified').length}</b></div>
        <div className="stat-card v-amber">Doctor-Added: <b>{labs.filter(l => l.badge === 'Doctor-Added').length}</b></div>
      </div>

      <div className="filters-container">
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Search lab name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="select-group">
          <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)}>
            <option value="All">All Cities</option>
            {[...new Set(labs.map(l => l.location))].map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="labs-table">
          <thead>
            <tr>
              <th>Lab Name</th>
              <th>City</th>
              <th>Contact</th>
              <th className="hide-mobile">Type</th>
              <th>Status</th>
              <th>Badge</th>
              <th>Added By</th>
              <th>Actions</th>
              
            </tr>
          </thead>
          <tbody>
            {filteredLabs.map((lab) => (
              <tr key={lab.id}>
                <td data-label="Lab Name" className="primary-cell">
                  <div className="lab-title">{lab.name}</div>
                </td>
                <td data-label="City"><span>{lab.location}</span></td>
                <td data-label="Contact"><span className="full-number">{lab.contact}</span></td>
                <td data-label="Type" className="hide-mobile"><span>{lab.type}</span></td>
                <td data-label="Status">
                  <span className={`status-pill-pro ${lab.status.toLowerCase()}`}>{lab.status}</span>
                </td>
                <td data-label="Badge">
                  <span className={lab.badge === 'System-Verified' ? 'badge-v' : 'badge-d'}>
                    {lab.badge === 'System-Verified' ? '✅ Verified' : '⚠️ Doctor-Added'}
                  </span>
                </td>
                <td data-label="Added By">
  <span>{lab.addedBy}</span>
</td>
                <td data-label="Actions" className="action-cell">
                  <button className="view-details-btn" onClick={() => setSelectedLab(lab)}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VIEW DETAILS MODAL */}
      {selectedLab && (
        <div className="modal-overlay" onClick={() => setSelectedLab(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Lab Details</h2>
              <button className="close-x" onClick={() => setSelectedLab(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="modal-info-grid">
                <div className="info-row"><b>Lab Name:</b> <span>{selectedLab.name}</span></div>
                <div className="info-row"><b>Location:</b> <span>{selectedLab.location}</span></div>
                <div className="info-row"><b>Contact:</b> <span className="full-number">{selectedLab.contact}</span></div>
                <div className="info-row"><b>Email:</b> <span>{selectedLab.email}</span></div>
                <div className="info-row"><b>Added By:</b> <span>{selectedLab.addedBy}</span></div>
                <div className="info-row"><b>Tests:</b> <span>{selectedLab.testsAssigned}</span></div>
                <div className="info-row"><b>Doctors:</b> <span>{selectedLab.activeDoctors}</span></div>
                <div className="info-row">
  <b>Payment Mode:</b>
  <span>
    {selectedLab.badge === 'System-Verified'
      ? 'Platform Settlement'
      : 'Offline / Doctor Managed'}
  </span>
</div>
              </div>
              <div className="modal-status-box">
                <span className={`status-pill-pro ${selectedLab.status.toLowerCase()}`}>{selectedLab.status}</span>
                <span className={selectedLab.badge === 'System-Verified' ? 'badge-v' : 'badge-d'}>{selectedLab.badge}</span>
              </div>
              {selectedLab.badge === 'Doctor-Added' && (
  <div className="warning-text">
    ⚠️ This lab is added by doctor and not platform verified.
  </div>
)}
            </div>
            <div className="modal-footer">
              {selectedLab.badge !== 'System-Verified' && (
                <button className="btn-verify" onClick={() => verifyLab(selectedLab)}>Verify Now</button>
              )}
              <button 
                className={selectedLab.status === 'Active' ? 'btn-suspend' : 'btn-reactivate'}
                onClick={() => toggleStatus(selectedLab)}
              >
                {selectedLab.status === 'Active' ? 'Suspend' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD LAB MODAL POPUP */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Laboratory</h2>
              <button className="close-x" onClick={() => setIsAddModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddLab}>
              <div className="modal-body">
                <div className="form-group-pro">
                  <label>Lab Name</label>
                  <input type="text" placeholder="Enter lab name" required 
                    value={newLab.name}
                    onChange={(e) => setNewLab({...newLab, name: e.target.value})} />
                </div>
                <div className="form-group-pro">
                  <label>Location (City)</label>
                  <input type="text" placeholder="e.g. Mumbai" required 
                    value={newLab.location}
                    onChange={(e) => setNewLab({...newLab, location: e.target.value})} />
                </div>
                <div className="form-group-pro">
                  <label>Contact Number</label>
                  <input type="text" placeholder="+91..." required 
                    value={newLab.contact}
                    onChange={(e) => setNewLab({...newLab, contact: e.target.value})} />
                </div>
                <div className="form-group-pro">
                  <label>Email Address</label>
                  <input type="email" placeholder="lab@example.com" required 
                    value={newLab.email}
                    onChange={(e) => setNewLab({...newLab, email: e.target.value})} />
                </div>
                <div className="form-group-pro">
                  <label>Lab Type</label>
                  <select value={newLab.type} onChange={(e) => setNewLab({...newLab, type: e.target.value})}>
                    <option value="Pathology">Pathology</option>
                    <option value="Radiology">Radiology</option>
                    <option value="Collection">Collection Center</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-submit-pro">Save Laboratory</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {actionLab && (
  <div className="modal-overlay">

    <div className="modal-content">

      <div className="modal-header">
        <h2>
          {actionType === "verify" && "Verify Laboratory"}
          {actionType === "suspend" && "Suspend Laboratory"}
          {actionType === "activate" && "Activate Laboratory"}
        </h2>
      </div>

      <div className="modal-body">

        <p>
          {actionType === "verify" &&
            "Are you sure you want to verify this lab?"
          }

          {actionType === "activate" &&
            "Do you want to activate this lab again?"
          }

          {actionType === "suspend" &&
            "Please enter reason for suspension"
          }
        </p>

        {actionType === "suspend" && (
          <textarea
  placeholder="Enter suspension reason"
  value={actionReason}
  onChange={(e) => setActionReason(e.target.value)}
  required
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "10px"
            }}
          />
        )}

      </div>

      <div className="modal-footer">

        <button
          className="btn-cancel"
          onClick={() => {
            setActionLab(null);
            setActionType("");
          }}
        >
          Cancel
        </button>

        <button
  className="btn-submit-pro"
  onClick={handleConfirmAction}
  disabled={actionType === "suspend" && !actionReason.trim()}
>
  Confirm
</button>

      </div>

    </div>

  </div>
)}
    </div>
    
  );
};

export default Labs;