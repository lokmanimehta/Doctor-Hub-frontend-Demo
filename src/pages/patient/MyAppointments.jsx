import React, { useState, useMemo } from "react";
import "./MyAppointments.css";
import { FiSearch, FiCalendar, FiClock, FiMapPin, FiFilter, FiDownload, FiMessageSquare, FiPhone, FiX, FiCheckCircle, FiBell, FiTrash2, FiChevronDown } from "react-icons/fi";
const initialData = {
    upcoming: [
        { id: 1, doctorName: "Dr. Aisha Khan", specialty: "Dermatologist", date: "2026-02-10", time: "10:00 AM", location: "Andheri, Mumbai", clinicName: "Skin Care Clinic", status: "Confirmed", fee: "₹1,200", paymentStatus: "Paid", image: "https://i.pravatar.cc/150?u=aisha", symptoms: "Skin rashes and itching", notes: "Follow-up after 1 month" },
        { id: 3, doctorName: "Dr. Sameer Verma", specialty: "Cardiologist", date: "2026-02-15", time: "11:30 AM", location: "Bandra West, Mumbai", clinicName: "Heart Care Center", status: "Rescheduled", fee: "₹1,500", paymentStatus: "Pending", image: "https://i.pravatar.cc/150?u=sameer", symptoms: "Chest pain during exercise", notes: "Bring previous ECG reports" }
    ],
    past: [
        { id: 2, doctorName: "Dr. Raj Patel", specialty: "Orthopedic", date: "2026-01-25", time: "04:00 PM", location: "Juhu, Mumbai", clinicName: "Orthofit Clinic", status: "Completed", fee: "₹1,000", paymentStatus: "Paid", image: "https://i.pravatar.cc/150?u=raj", symptoms: "Knee pain", notes: "Physiotherapy recommended" }
    ],
    cancelled: [
        { id: 4, doctorName: "Dr. Neha Sharma", specialty: "Pediatrician", date: "2026-01-05", time: "12:00 PM", location: "Versova, Mumbai", clinicName: "Kids Health First", status: "Cancelled", fee: "₹800", paymentStatus: "Refunded", image: "https://i.pravatar.cc/150?u=neha", symptoms: "Regular vaccination", notes: "Cancelled by patient" }
    ]
};
const PatientAppointments = () => {
    const [appointments, setAppointments] = useState(initialData);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [filterSpecialty, setFilterSpecialty] = useState("All");
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [rescheduleTarget, setRescheduleTarget] = useState(null);
    const [newDate, setNewDate] = useState("");
    const [newTime, setNewTime] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [showReminderToast, setShowReminderToast] = useState(false);
    const allData = useMemo(() => [...appointments.upcoming, ...appointments.past, ...appointments.cancelled], [appointments]);
    const filteredData = useMemo(() => {
        let list = activeTab === "all" ? allData : (appointments[activeTab] || []);
      return list.filter((app) => {
    const searchTerm = search.toLowerCase().trim();

    const fields = [
        app.doctorName,
        app.specialty,
        app.location,
        app.status,
        app.date,
        app.clinicName
    ];

    const matchesSearch = fields.some(field =>
        field?.toLowerCase().includes(searchTerm)
    );

    const matchesFilter =
        filterSpecialty === "All" ||
        app.specialty === filterSpecialty;

    return matchesSearch && matchesFilter;
});
    }, [search, activeTab, filterSpecialty, allData, appointments]);
    const handleDelete = (id) => {
        const updatedData = {
            upcoming: appointments.upcoming.filter(a => a.id !== id),
            past: appointments.past.filter(a => a.id !== id),
            cancelled: appointments.cancelled.filter(a => a.id !== id)
        };
        setAppointments(updatedData);
        setShowDeleteConfirm(null);
    };
    const handleRescheduleUpdate = () => {
        if (!newDate || !newTime) return alert("Please select date and time");
        const updateList = (list) => list.map(app => app.id === rescheduleTarget.id ? { ...app, date: newDate, time: newTime, status: "Rescheduled" } : app);
        setAppointments({ upcoming: updateList(appointments.upcoming), past: updateList(appointments.past), cancelled: updateList(appointments.cancelled) });
        setRescheduleTarget(null);
        setNewDate("");
        setNewTime("");
    };
    const triggerReminder = () => {
        setShowReminderToast(true);
        setTimeout(() => setShowReminderToast(false), 3000);
    };
    return (
        <div className="appointments-view-container">
            <section className="top-search-section">
                <div className="search-filter-wrapper">
                    <div className="search-box-wrapper">
                        <FiSearch className="search-icon" />
                        <input type="text" placeholder="Search by name, specialty, or date..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="premium-dropdown-wrapper">
                        <FiFilter className="filter-icon-inline" />
                        <select className="premium-select" value={filterSpecialty} onChange={(e) => setFilterSpecialty(e.target.value)}>
                            <option value="All">All Specialties</option>
                            <option value="Dermatologist">Dermatologist</option>
                            <option value="Cardiologist">Cardiologist</option>
                            <option value="Orthopedic">Orthopedic</option>
                            <option value="Pediatrician">Pediatrician</option>
                        </select>
                        <FiChevronDown className="dropdown-arrow" />
                    </div>
                    <button className="text-reset-btn" onClick={() => { setSearch(""); setFilterSpecialty("All"); }}>Reset</button>
                </div>
            </section>
            <div className="appointments-tabs-wrapper">
                <div className="appointments-tabs">
                    {["all", "upcoming", "past", "cancelled"].map((tab) => (
                        <button key={tab} className={`tab-btn ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            <span className="count-pill">{tab === "all" ? allData.length : appointments[tab]?.length || 0}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="appointments-list-grid">
                {filteredData.length > 0 ? (filteredData.map((app) => (
                    <div key={app.id} className={`premium-apt-card ${app.status?.toLowerCase()}`}>
                        <div className="card-top-content">
                            <div className="dr-img-container"><img src={app.image} alt={app.doctorName} /></div>
                            <div className="dr-info-container">
                                <div className="header-row">
                                    <h4 className="doctor-name">{app.doctorName} <span className="type-badge">{app.type}</span> <span className="verified-badge">✔</span></h4>
                                    <p className="clinic-name">{app.clinicName}</p>
                                    <p className="exp-text">{app.experience}</p>
                                    <span className={`status-pill-badge ${app.status.toLowerCase()}`}>{app.status}</span>
                                </div>
                                <p className="specialty-label">{app.specialty}</p>
                                <div className="meta-info-row">
                                    <span><FiCalendar /> {app.date}</span>
                                    <span><FiClock /> {app.time}</span>
                                </div>
                                <p className="location-info-p"><FiMapPin /> {app.location}</p>
                                <p className={`payment-status ${app.paymentStatus?.toLowerCase()}`}>Payment: {app.paymentStatus}</p>
                            </div>
                        </div>
                        <div className="reminder-settings-strip">
                            <span className="reminder-title">Reminders:</span>
                            <div className="rem-checkboxes">
                                <label><input type="checkbox" defaultChecked /> SMS</label>
                                <label><input type="checkbox" defaultChecked /> Email</label>
                                <label><input type="checkbox" defaultChecked /> Push</label>
                            </div>
                        </div>
                        <div className="card-actions-container">
                            <button className="btn-view-main" onClick={() => setSelectedAppointment(app)}> 👁️‍🗨️ View Details</button>
                            {app.status !== "Cancelled" && app.status !== "Completed" && (
                                <>
                                    <button className="btn-reschedule-sub" onClick={() => setRescheduleTarget(app)}>Reschedule</button>
                                    <button className="btn-delete-icon" onClick={() => setShowDeleteConfirm(app.id)}>Cancel </button>
                                </>
                            )}
                            <button className="btn-reminder-icon" onClick={triggerReminder}><FiBell /></button>
                        </div>
                    </div>
                ))) : (
                    <div className="empty-state-card" style={{ gridColumn: "1/-1", textAlign: "center", padding: "50px", color: "var(--text-muted)" }}>
                        <p>No appointments found. Try a different search term.</p>
                    </div>
                )}
            </div>
            {selectedAppointment && (
                <div className="apt-modal-overlay-bg" onClick={() => setSelectedAppointment(null)}>
                    <div className="apt-modal-sheet-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-section">
                            <h3>Appointment Details</h3>
                            <button className="modal-close-icon-btn" onClick={() => setSelectedAppointment(null)}><FiX /></button>
                        </div>
                        <div className="modal-inner-body">
                            <div className="info-block">
                                <label>Clinic Information</label>
                                <p><strong>{selectedAppointment.clinicName}</strong></p>
                                <p className="sub-detail-text" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{selectedAppointment.location}</p>
                            </div>
                            <div className="info-flex-row">
                                <div className="info-block">
                                    <label>Symptoms</label>
                                    <p style={{ fontSize: '14px' }}>{selectedAppointment.symptoms}</p>
                                </div>
                                <div className="info-block">
                                    <label>Payment</label>
                                    <div className="payment-status-tag">
                                        <span>{selectedAppointment.fee}</span>
                                        <span className="is-paid">{selectedAppointment.paymentStatus}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="info-block full-width">
                                <label>Notes & Instructions</label>
                                <div className="notes-box-styled">{selectedAppointment.notes}</div>
                            </div>
                            <div className="modal-action-buttons-grid">
                                <button className="m-action-btn"><FiMessageSquare /> Message</button>
                                <button className="m-action-btn"><FiPhone /> Call Clinic</button>
                                <button className="m-action-btn"><FiDownload /> Invoice</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {rescheduleTarget && (
                <div className="apt-modal-overlay-bg" onClick={() => setRescheduleTarget(null)}>
                    <div className="apt-modal-sheet-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-section">
                            <h3>Reschedule Appointment</h3>
                            <button className="modal-close-icon-btn" onClick={() => setRescheduleTarget(null)}><FiX /></button>
                        </div>
                        <div className="reschedule-modal-body">
                            <div className="info-block">
                                <label>Pick a New Date</label>
                                <input type="date" className="date-picker-custom" onChange={(e) => setNewDate(e.target.value)} />
                            </div>
                            <div className="info-block">
                                <label>Select Time Slot</label>
                                <div className="slots-grid-container">
                                    {["10:00 AM", "12:30 PM", "03:00 PM", "05:30 PM"].map(s => (
                                        <button key={s} className={`slot-pill-btn ${newTime === s ? "active-slot" : ""}`} onClick={() => setNewTime(s)}>{s}</button>
                                    ))}
                                </div>
                            </div>
                            <button className="btn-confirm-final" onClick={handleRescheduleUpdate}>Update Appointment</button>
                        </div>
                    </div>
                </div>
            )}
            {showDeleteConfirm && (
                <div className="apt-modal-overlay-bg">
                    <div className="confirmation-popup-box">
                        <div className="warn-icon"><FiTrash2 /></div>
                        <h4 style={{ fontSize: '20px', marginBottom: '10px' }}>Cancel Appointment?</h4>
                        <p style={{ color: 'var(--text-muted)' }}>Are you sure you want to cancel? This action will remove your scheduled slot.</p>
                        <div className="popup-buttons-row">
                            <button className="btn-no" onClick={() => setShowDeleteConfirm(null)}>Go Back</button>
                            <button className="btn-yes" onClick={() => handleDelete(showDeleteConfirm)}>Yes, Cancel</button>
                        </div>
                    </div>
                </div>
            )}
            {showReminderToast && (
                <div className="success-toast-notification">
                    <FiCheckCircle /> Reminder updated for this appointment!
                </div>
            )}
        </div>
    );
};
export default PatientAppointments;