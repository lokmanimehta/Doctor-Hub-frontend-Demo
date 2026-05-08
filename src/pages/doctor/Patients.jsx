import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Patients.css";
import {
  getPatients,
  getDoctorProfile,
  archivePatient,
  unarchivePatient
} from "../../services/doctorService";

const PAGE_SIZE = 10;

const Patients = () => {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [clinics, setClinics] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("All");
  const [clinicFilter, setClinicFilter] = useState("All");
  const [criticalFilter, setCriticalFilter] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: "",
    message: "",
    actionType: "",
    patientId: null,
    patientName: ""
  });

  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState({
    page: 0,
    size: PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  });

  const [loading, setLoading] = useState(true);
  const [clinicsLoading, setClinicsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    const loadClinics = async () => {
      try {
        setClinicsLoading(true);
        const profile = await getDoctorProfile();
        const clinicList = Array.isArray(profile?.clinics) ? profile.clinics : [];
        setClinics(clinicList);
      } catch (err) {
        console.error("Failed to load clinics", err);
      } finally {
        setClinicsLoading(false);
      }
    };

    loadClinics();
  }, []);

  const clinicOptions = useMemo(() => {
    return clinics.map((clinic) => ({
      id: clinic.id,
      name: clinic.clinicName
    }));
  }, [clinics]);

  const totalPagesForUI = Math.max(pageData.totalPages, 1);

  const pageNumbers = useMemo(() => {
    const total = pageData.totalPages || 0;
    if (total <= 1) return [];

    const current = pageData.page;
    const pages = [];

    const start = Math.max(0, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    if (!pages.includes(0)) pages.unshift(0);
    if (!pages.includes(total - 1)) pages.push(total - 1);

    return [...new Set(pages)];
  }, [pageData.page, pageData.totalPages]);

  const refetchPatients = async () => {
    const response = await getPatients({
      search: searchTerm,
      gender: genderFilter,
      clinicId: clinicFilter,
      critical: criticalFilter ? true : undefined,
      archived: showArchived,
      page,
      size: PAGE_SIZE
    });

    const content = response?.content || [];
    const totalPages = response?.totalPages ?? 0;

    if (content.length === 0 && page > 0 && totalPages > 0) {
      setPage((prev) => prev - 1);
      return;
    }

    setPatients(content);
    setPageData({
      page: response?.page ?? 0,
      size: response?.size ?? PAGE_SIZE,
      totalElements: response?.totalElements ?? 0,
      totalPages: totalPages,
      hasNext: response?.hasNext ?? false,
      hasPrevious: response?.hasPrevious ?? false
    });
  };

  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getPatients({
          search: searchTerm,
          gender: genderFilter,
          clinicId: clinicFilter,
          critical: criticalFilter ? true : undefined,
          archived: showArchived,
          page,
          size: PAGE_SIZE
        });

        setPatients(response?.content || []);
        setPageData({
          page: response?.page ?? 0,
          size: response?.size ?? PAGE_SIZE,
          totalElements: response?.totalElements ?? 0,
          totalPages: response?.totalPages ?? 0,
          hasNext: response?.hasNext ?? false,
          hasPrevious: response?.hasPrevious ?? false
        });
      } catch (err) {
        setError(err.message || "Failed to load patients");
        setPatients([]);
        setPageData({
          page: 0,
          size: PAGE_SIZE,
          totalElements: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false
        });
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, [searchTerm, genderFilter, clinicFilter, criticalFilter, page, showArchived]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setGenderFilter("All");
    setClinicFilter("All");
    setCriticalFilter(false);
    setPage(0);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleGenderChange = (e) => {
    setGenderFilter(e.target.value);
    setPage(0);
  };

  const handleClinicChange = (e) => {
    setClinicFilter(e.target.value);
    setPage(0);
  };

  const handleCriticalChange = (e) => {
    setCriticalFilter(e.target.checked);
    setPage(0);
  };

  const openArchiveConfirm = (patientId, patientName) => {
    setConfirmConfig({
      title: "Archive Patient",
      message: `${patientName} will be removed from the active list. You can restore this patient later from Archived Patients.`,
      actionType: "archive",
      patientId,
      patientName
    });
    setConfirmModalOpen(true);
  };

  const openUnarchiveConfirm = (patientId, patientName) => {
    setConfirmConfig({
      title: "Restore Patient",
      message: `${patientName} will be moved back to the active patient list.`,
      actionType: "unarchive",
      patientId,
      patientName
    });
    setConfirmModalOpen(true);
  };

  const handleConfirmAction = async () => {
    const { actionType, patientId } = confirmConfig;

    if (!patientId || !actionType) return;

    try {
      setActionLoadingId(patientId);

      if (actionType === "archive") {
        await archivePatient(patientId);
      }

      if (actionType === "unarchive") {
        await unarchivePatient(patientId);
      }

      setConfirmModalOpen(false);

      await refetchPatients();
    } catch (err) {
      alert(err.message || `Failed to ${actionType} patient`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderState = () => {
    if (loading) {
      return <div className="patients-state">Loading patients...</div>;
    }

    if (error) {
      return <div className="patients-state error">{error}</div>;
    }

    if (!patients.length) {
      return (
        <div className="patients-state">
          {showArchived ? "No archived patients found." : "No patients found."}
        </div>
      );
    }

    return null;
  };

  const stateBlock = renderState();

  return (
    <div className="patients-page">
      <div className="patients-topbar">
        <div>
          <p className="patients-eyebrow">Doctor Workspace</p>

          <div className="patients-mode-toggle">
            <button
              type="button"
              className={`mode-btn ${!showArchived ? "active" : ""}`}
              onClick={() => {
                setShowArchived(false);
                setPage(0);
              }}
            >
              Active Patients
            </button>

            <button
              type="button"
              className={`mode-btn ${showArchived ? "active" : ""}`}
              onClick={() => {
                setShowArchived(true);
                setPage(0);
              }}
            >
              Archived Patients
            </button>
          </div>

          <div className="patients-header-row">
            <h1 className="patients-title">
              {showArchived ? "Archived Patients" : "Patient Directory"}
            </h1>
            <span className="count-badge">{pageData.totalElements}</span>
          </div>

          <p className="patients-subtitle">
            {showArchived
              ? "Review archived patient records and restore them when needed."
              : "Search, review, and manage your active patient records with clean pagination and filters."}
          </p>
        </div>
      </div>

      <div className="patients-filters-card">
        <div className="filters-grid">
          <div className="field-group field-search">
            <label htmlFor="patientSearch">Search</label>
            <input
              id="patientSearch"
              type="text"
              className="search-input"
              placeholder="Search by name, age, complaint or phone..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          <div className="field-group">
            <label htmlFor="genderFilter">Gender</label>
            <select
              id="genderFilter"
              value={genderFilter}
              onChange={handleGenderChange}
            >
              <option value="All">All Gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="clinicFilter">Clinic</label>
            <select
              id="clinicFilter"
              value={clinicFilter}
              onChange={handleClinicChange}
              disabled={clinicsLoading}
            >
              <option value="All">All Clinics</option>
              {clinicOptions.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group critical-field">
            <label>Priority</label>
            <div className="critical-wrapper">
              <input
                type="checkbox"
                id="criticalOnly"
                checked={criticalFilter}
                onChange={handleCriticalChange}
              />
              <label htmlFor="criticalOnly">Critical only</label>
            </div>
          </div>
        </div>

        <div className="filters-footer">
          <div className="filters-summary">
            <span>
              Page {pageData.page + 1} of {totalPagesForUI}
            </span>
            <span>•</span>
            <span>
              {pageData.totalElements} {showArchived ? "archived" : "active"} patient
              {pageData.totalElements === 1 ? "" : "s"}
            </span>
          </div>

          <button
            type="button"
            className="reset-btn"
            onClick={handleResetFilters}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {stateBlock ? (
        stateBlock
      ) : (
        <>
          <div className="table-card">
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
                    <th className="action-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id}>
                      <td>#{patient.id}</td>
                      <td>
                        <div className="patient-name-cell">
                          <span className="patient-name">{patient.fullName}</span>
                        </div>
                      </td>
                      <td>{patient.age ?? "-"}</td>
                      <td>{patient.gender}</td>
                      <td>{patient.complaint || "-"}</td>
                      <td>{patient.clinicName || "-"}</td>
                      <td>
                        {patient.isCritical ? (
                          <span className="critical-badge">Critical</span>
                        ) : (
                          <span className="normal-badge">Normal</span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {!showArchived && (
                            <button
                              type="button"
                              className="view-btn"
                              onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                            >
                              View
                            </button>
                          )}

                          {showArchived ? (
                            <button
                              type="button"
                              className="unarchive-btn"
                              onClick={() => openUnarchiveConfirm(patient.id, patient.fullName)}
                              disabled={actionLoadingId === patient.id}
                            >
                              {actionLoadingId === patient.id ? "Restoring..." : "Unarchive"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="archive-btn"
                              onClick={() => openArchiveConfirm(patient.id, patient.fullName)}
                              disabled={actionLoadingId === patient.id}
                            >
                              {actionLoadingId === patient.id ? "Archiving..." : "Archive"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card-view">
              {patients.map((patient) => (
                <div className="patient-card" key={patient.id}>
                  <div className="patient-card-top">
                    <div>
                      <p className="patient-card-id">Patient #{patient.id}</p>
                      <h3>{patient.fullName}</h3>
                    </div>

                    {patient.isCritical ? (
                      <span className="critical-badge">Critical</span>
                    ) : (
                      <span className="normal-badge">Normal</span>
                    )}
                  </div>

                  <div className="patient-card-grid">
                    <div>
                      <span className="label">Age</span>
                      <p>{patient.age ?? "-"}</p>
                    </div>
                    <div>
                      <span className="label">Gender</span>
                      <p>{patient.gender}</p>
                    </div>
                    <div>
                      <span className="label">Complaint</span>
                      <p>{patient.complaint || "-"}</p>
                    </div>
                    <div>
                      <span className="label">Clinic</span>
                      <p>{patient.clinicName || "-"}</p>
                    </div>
                  </div>

                  <div className="card-actions">
                    {!showArchived && (
                      <button
                        type="button"
                        className="view-btn"
                        onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                      >
                        View Details
                      </button>
                    )}

                    {showArchived ? (
                      <button
                        type="button"
                        className="unarchive-btn"
                        onClick={() => openUnarchiveConfirm(patient.id, patient.fullName)}
                        disabled={actionLoadingId === patient.id}
                      >
                        {actionLoadingId === patient.id ? "Restoring..." : "Unarchive"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="archive-btn"
                        onClick={() => openArchiveConfirm(patient.id, patient.fullName)}
                        disabled={actionLoadingId === patient.id}
                      >
                        {actionLoadingId === patient.id ? "Archiving..." : "Archive"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pagination-card">
            <div className="pagination-info">
              <span>
                Showing page <strong>{pageData.page + 1}</strong> of{" "}
                <strong>{totalPagesForUI}</strong>
              </span>
              <span>
                Total records: <strong>{pageData.totalElements}</strong>
              </span>
            </div>

            <div className="pagination-controls">
              <button
                type="button"
                className="page-btn"
                disabled={!pageData.hasPrevious}
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              >
                Previous
              </button>

              <div className="page-numbers">
                {pageNumbers.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={`page-number ${pageNumber === pageData.page ? "active" : ""}`}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber + 1}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="page-btn"
                disabled={!pageData.hasNext}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {confirmModalOpen && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <div className="confirm-modal-header">
              <h3>{confirmConfig.title}</h3>
              <button
                type="button"
                className="confirm-close-btn"
                onClick={() => setConfirmModalOpen(false)}
                disabled={actionLoadingId === confirmConfig.patientId}
              >
                ×
              </button>
            </div>

            <div className="confirm-modal-body">
              <p>{confirmConfig.message}</p>
            </div>

            <div className="confirm-modal-footer">
              <button
                type="button"
                className="confirm-cancel-btn"
                onClick={() => setConfirmModalOpen(false)}
                disabled={actionLoadingId === confirmConfig.patientId}
              >
                Cancel
              </button>

              <button
                type="button"
                className={`confirm-action-btn ${
                  confirmConfig.actionType === "archive" ? "danger" : "success"
                }`}
                onClick={handleConfirmAction}
                disabled={actionLoadingId === confirmConfig.patientId}
              >
                {actionLoadingId === confirmConfig.patientId
                  ? confirmConfig.actionType === "archive"
                    ? "Archiving..."
                    : "Restoring..."
                  : confirmConfig.actionType === "archive"
                  ? "Archive Patient"
                  : "Restore Patient"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;