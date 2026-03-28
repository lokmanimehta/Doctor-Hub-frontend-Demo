import React, { useState, useMemo } from 'react';
import './Appointments.css';

const Appointment = () => {
    // --- DUMMY DATA GENERATOR ---
    const initialData = Array.from({ length: 100 }, (_, i) => ({
        id: `APT-${1000 + i}`,
        patient: i % 2 === 0 ? "Rahul Sharma" : "Amit Kumar",
        doctor: i % 3 === 0 ? "Dr. Amit Verma" : "Dr. Sneha Rao",
        hospital: i % 2 === 0 ? "City Hospital" : "Global Clinic",
        speciality: "Cardiology",
        appointmentDate: `2026-03-${((i % 28) + 1).toString().padStart(2, '0')}`,
        appointmentTime: "10:30 AM",
        createdAt: "2026-02-15",
        updatedAt: "2026-02-20",
        updatedBy: "System",
        notes: [
            { text: "Initial consultation required.", date: "2026-02-16", by: "Receptionist" }
        ],
        mode: i % 2 === 0 ? "Online" : "Offline",
        status: ["Confirmed", "Pending", "Cancelled by Patient", "Rescheduled", "No Show"][i % 5],
        critical: i % 4 === 0 ? "Yes" : "No",
        complaint: "Patient reports chronic chest pain and shortness of breath during physical activity.",
        age: 25 + (i % 15),
        contact: "+91 987654-****",
        email: "patient@example.com"
    }));

    // --- STATES ---
    const [appointments, setAppointments] = useState(initialData);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDoctor, setFilterDoctor] = useState('All');
    const [filterHospital, setFilterHospital] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterMode, setFilterMode] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modals State
    const [selectedAppt, setSelectedAppt] = useState(null); 
    const [cancelTarget, setCancelTarget] = useState(null);
    const [newNote, setNewNote] = useState('');
    const [rescheduleDate, setRescheduleDate] = useState('');

    // --- LOGIC: FILTERING ---
    const filteredData = useMemo(() => {
        return appointments.filter(item => {
            const val = searchTerm.toLowerCase();
            const matchesSearch = 
                item.patient.toLowerCase().includes(val) || 
                item.id.toLowerCase().includes(val) ||
                item.doctor.toLowerCase().includes(val) ||
                item.contact.includes(val);

            const matchesDoctor = filterDoctor === 'All' || item.doctor === filterDoctor;
            const matchesHospital = filterHospital === 'All' || item.hospital === filterHospital;
            const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
            const matchesMode = filterMode === 'All' || item.mode === filterMode;
            
            const itemDate = new Date(item.appointmentDate);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            const matchesDate = (!start || itemDate >= start) && (!end || itemDate <= end);

            return matchesSearch && matchesDoctor && matchesHospital && matchesStatus && matchesMode && matchesDate;
        });
    }, [searchTerm, filterDoctor, filterHospital, filterStatus, filterMode, startDate, endDate, appointments]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    // --- HANDLERS ---
    const handleReset = () => {
        setSearchTerm('');
        setFilterDoctor('All');
        setFilterHospital('All');
        setFilterStatus('All');
        setFilterMode('All');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    const updateStatus = (id, newStatus) => {
        if(!newStatus) return;
        const timestamp = new Date().toISOString().split('T')[0];
        setAppointments(prev => prev.map(a => 
            a.id === id ? { ...a, status: newStatus, updatedAt: timestamp, updatedBy: 'Admin' } : a
        ));
        if(selectedAppt) setSelectedAppt(prev => ({ ...prev, status: newStatus }));
    };

    const handleAddNote = () => {
        if (!newNote.trim()) return;
        const noteObj = {
            text: newNote,
            date: new Date().toISOString().split('T')[0],
            by: "Admin"
        };
        setAppointments(prev => prev.map(a => 
            a.id === selectedAppt.id ? { ...a, notes: [...a.notes, noteObj] } : a
        ));
        setSelectedAppt(prev => ({ ...prev, notes: [...prev.notes, noteObj] }));
        setNewNote('');
    };

    const handleReschedule = () => {
        if (!rescheduleDate) {
            alert("Please select a valid date.");
            return;
        }
        setAppointments(prev => prev.map(a => 
            a.id === selectedAppt.id ? { ...a, appointmentDate: rescheduleDate, status: 'Rescheduled' } : a
        ));
        setSelectedAppt(prev => ({ ...prev, appointmentDate: rescheduleDate, status: 'Rescheduled' }));
        setRescheduleDate('');
        alert("Appointment Rescheduled Successfully!");
    };

    const confirmForceCancel = () => {
        updateStatus(cancelTarget.id, 'Cancelled by Admin');
        setCancelTarget(null);
    };

    const getStatusClass = (status) => {
        const s = status.toLowerCase();
        if (s.includes('confirmed')) return 'status-confirmed';
        if (s.includes('pending')) return 'status-pending';
        if (s.includes('cancelled')) return 'status-cancelled';
        if (s.includes('rescheduled')) return 'status-rescheduled';
        return 'status-noshow';
    };

    return (
        <div className="appointment-page-wrapper">
            <header className="page-header">
                <div className="header-content">
                    <h2>APPOINTMENT COMMAND CENTER</h2>
                    <p>Manage, Monitor and Modify Patient Bookings</p>
                </div>
            </header>

            {/* --- ALL FILTERS IN ONE GRID --- */}
            <section className="filter-card">
                <div className="filter-grid">
                    <div className="f-grp">
                        <label>Start Date</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="f-grp">
                        <label>End Date</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                    <div className="f-grp">
                        <label>Doctor</label>
                        <select value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)}>
                            <option value="All">All Doctors</option>
                            <option value="Dr. Amit Verma">Dr. Amit Verma</option>
                            <option value="Dr. Sneha Rao">Dr. Sneha Rao</option>
                        </select>
                    </div>
                    <div className="f-grp">
                        <label>Hospital</label>
                        <select value={filterHospital} onChange={(e) => setFilterHospital(e.target.value)}>
                            <option value="All">All Hospitals</option>
                            <option value="City Hospital">City Hospital</option>
                            <option value="Global Clinic">Global Clinic</option>
                        </select>
                    </div>
                    <div className="f-grp">
                        <label>Status</label>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="All">All Status</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Pending">Pending</option>
                            <option value="Rescheduled">Rescheduled</option>
                            <option value="No Show">No Show</option>
                            <option value="Cancelled by Patient">Cancelled (Patient)</option>
                            <option value="Cancelled by Admin">Cancelled (Admin)</option>
                        </select>
                    </div>
                    <div className="f-grp">
                        <label>Mode</label>
                        <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)}>
                            <option value="All">All Modes</option>
                            <option value="Online">Online</option>
                            <option value="Offline">Offline</option>
                        </select>
                    </div>
                </div>

                <div className="search-bar-row">
                    <div className="search-input-wrapper">
                        <span className="search-icon">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Search by Patient Name, ID, or Phone..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="reset-btn-premium" onClick={handleReset}>🔄 Reset Filters</button>
                </div>
            </section>

            <div className="content-card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>APPT ID</th>
                                <th>PATIENT</th>
                                <th>DOCTOR</th>
                                <th>SCHEDULED DATE</th>
                                <th>MODE</th>
                                <th>STATUS</th>
                                <th>CRITICAL</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? currentItems.map((item) => (
                                <tr key={item.id} className="table-row">
                                    <td><span className="id-badge">{item.id}</span></td>
                                    <td>
                                        <div className="patient-info">
                                            <span className="p-name">{item.patient}</span>
                                            <span className="p-sub">{item.contact}</span>
                                        </div>
                                    </td>
                                    <td>{item.doctor}</td>
                                    <td>
                                        <div className="date-info">
                                            <strong>{item.appointmentDate}</strong>
                                            <span style={{fontSize:'12px', color:'#64748b'}}>{item.appointmentTime}</span>
                                        </div>
                                    </td>
                                    <td>{item.mode === "Online" ? "🌐 Online" : "🏥 Clinic"}</td>
                                    <td>
                                        <span className={`badge-premium ${getStatusClass(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td>
                                        {item.critical === "Yes" ? <span className="crit-pulse">🚩 Critical</span> : "Normal"}
                                    </td>
                                    <td className="action-cell">
                                        <button className="act-view" onClick={() => setSelectedAppt(item)}>Details</button>
                                        <button className="act-cancel" onClick={() => setCancelTarget(item)}>Cancel</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="8" style={{textAlign:'center', padding:'40px'}}>No appointments found matching your filters.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="premium-pagination">
                    <div className="pg-info">Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} entries</div>
                    <div className="pg-buttons">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button 
                                key={i} 
                                onClick={() => setCurrentPage(i + 1)} 
                                className={currentPage === i + 1 ? 'active' : ''}
                            >
                                {i + 1}
                            </button>
                        )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
                    </div>
                </div>
            </div>

            {/* --- PREMIUM MODAL --- */}
            {selectedAppt && (
                <div className="modal-overlay">
                    <div className="premium-modal">
                        <div className="m-header-dark">
                            <div className="m-title">
                                <h3>Appointment Dossier</h3>
                                <span>Ref: {selectedAppt.id} • Created on {selectedAppt.createdAt}</span>
                            </div>
                            <button className="close-btn" onClick={() => setSelectedAppt(null)}>&times;</button>
                        </div>
                        
                        <div className="m-scroll-body">
                            <div className="m-grid-3">
                                <div className="info-box">
                                    <label>Patient Identity</label>
                                    <p><strong>{selectedAppt.patient}</strong> ({selectedAppt.age} yrs)</p>
                                    <p>{selectedAppt.contact}</p>
                                    <p className="sub-text">{selectedAppt.email}</p>
                                </div>
                                <div className="info-box">
                                    <label>Medical Assignment</label>
                                    <p><strong>{selectedAppt.doctor}</strong></p>
                                    <p>{selectedAppt.speciality}</p>
                                    <p className="sub-text">{selectedAppt.hospital}</p>
                                </div>
                                <div className="info-box">
                                    <label>Booking Metadata</label>
                                    <p>Status: <span className={`badge-premium ${getStatusClass(selectedAppt.status)}`}>{selectedAppt.status}</span></p>
                                    <p>Date: <strong>{selectedAppt.appointmentDate}</strong></p>
                                    <p className="sub-text">Mode: {selectedAppt.mode}</p>
                                </div>
                            </div>

                            <div className="m-complaint-section">
                                <h4>Chief Complaint</h4>
                                <div className="complaint-box">{selectedAppt.complaint}</div>
                            </div>

                            <div className="m-notes-section">
                                <h4>Internal Clinical Notes</h4>
                                <div className="notes-list">
                                    {selectedAppt.notes.map((n, idx) => (
                                        <div key={idx} className="single-note">
                                            <div className="note-meta"><span>{n.by}</span> • <span>{n.date}</span></div>
                                            <p style={{margin:0, fontSize:'13px'}}>{n.text}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="add-note-box">
                                    <textarea 
                                        placeholder="Add private note for medical staff..." 
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                    />
                                    <button onClick={handleAddNote}>Post Note</button>
                                </div>
                            </div>

                            <div className="m-admin-actions">
                                <h4>Administrative Controls</h4>
                                <div className="control-row">
                                    <div className="ctrl-grp">
                                        <label>Quick Status Update</label>
                                        <select 
                                            value={selectedAppt.status} 
                                            onChange={(e) => updateStatus(selectedAppt.id, e.target.value)}
                                            className="admin-select"
                                        >
                                            <option value="">Update Status...</option>
                                            <option value="Confirmed">Confirm Appointment</option>
                                            <option value="Completed">Mark Completed</option>
                                            <option value="No Show">Mark No Show</option>
                                            <option value="Pending">Keep Pending</option>
                                        </select>
                                    </div>
                                    <div className="ctrl-grp">
                                        <label>Reschedule Appointment</label>
                                        <div className="resched-input-group">
                                            <input 
                                                type="date" 
                                                value={rescheduleDate} 
                                                onChange={(e) => setRescheduleDate(e.target.value)} 
                                            />
                                            <button className="apply-resched-btn" onClick={handleReschedule}>Apply</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- FORCE CANCEL MODAL --- */}
            {cancelTarget && (
                <div className="modal-overlay">
                    <div className="confirm-modal" style={{background:'white', padding:'30px', borderRadius:'15px', textAlign:'center', width:'400px'}}>
                        <div style={{fontSize:'50px', marginBottom:'15px'}}>⚠️</div>
                        <h3 style={{margin:'0 0 10px 0'}}>Cancel Appointment?</h3>
                        <p style={{color:'#64748b', fontSize:'14px'}}>Are you sure you want to cancel the appointment for <strong>{cancelTarget.patient}</strong>? This action cannot be undone.</p>
                        <div style={{display:'flex', gap:'10px', marginTop:'25px'}}>
                            <button onClick={() => setCancelTarget(null)} style={{flex:1, padding:'12px', borderRadius:'8px', border:'none', background:'#f1f5f9', cursor:'pointer', fontWeight:'600'}}>Dismiss</button>
                            <button onClick={confirmForceCancel} style={{flex:1, padding:'12px', borderRadius:'8px', border:'none', background:'var(--danger)', color:'white', cursor:'pointer', fontWeight:'600'}}>Yes, Cancel Now</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Appointment;