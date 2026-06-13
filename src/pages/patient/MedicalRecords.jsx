import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./MedicalRecords.css";
import { useProfile } from "../../context/useProfile";
import {
  deletePatientMedicalRecord,
  downloadPatientMedicalRecord,
  getPatientMedicalRecordById,
  getPatientMedicalRecords,
  uploadPatientMedicalRecord
} from "../../services/patientService";

const RECORD_TYPES = [
  { value: "ALL", label: "All Records" },
  { value: "VISIT_SUMMARY", label: "Visit Summary" },
  { value: "PRESCRIPTION", label: "Prescriptions" },
  { value: "LAB_REPORT", label: "Lab Reports" },
  { value: "RADIOLOGY", label: "Radiology" },
  { value: "DISCHARGE_SUMMARY", label: "Discharge Summary" },
  { value: "VACCINATION", label: "Vaccination" },
  { value: "OTHER", label: "Other" }
];

const SOURCE_FILTERS = [
  { value: "ALL", label: "All Sources" },
  { value: "DOCTOR_ADDED", label: "Doctor Added" },
  { value: "PATIENT_UPLOADED", label: "Patient Uploaded" }
];

const UPLOAD_RECORD_TYPES = [
  { value: "LAB_REPORT", label: "Lab Report" },
  { value: "RADIOLOGY", label: "Radiology" },
  { value: "PRESCRIPTION", label: "Prescription" },
  { value: "DISCHARGE_SUMMARY", label: "Discharge Summary" },
  { value: "VACCINATION", label: "Vaccination" },
  { value: "OTHER", label: "Other" }
];

const initialUploadForm = {
  title: "",
  recordType: "LAB_REPORT",
  recordDate: "",
  providerName: "",
  notes: "",
  file: null
};

const MedicalRecords = () => {
  const profileContext = useProfile();

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const [recordType, setRecordType] = useState("ALL");
  const [source, setSource] = useState("ALL");
  const [search, setSearch] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState(initialUploadForm);
  const [isUploading, setIsUploading] = useState(false);

  const [toast, setToast] = useState(null);

  const fileInputRef = useRef(null);

  const selectedProfile = useMemo(() => {
    return (
      profileContext?.selectedProfile ||
      profileContext?.activeProfile ||
      profileContext?.currentProfile ||
      profileContext?.profile ||
      profileContext?.patientProfile ||
      null
    );
  }, [profileContext]);

  const resolvedProfile = useMemo(() => {
    if (!selectedProfile) {
      return {
        id: null,
        type: null,
        label: "All profiles"
      };
    }

    const id =
      selectedProfile.id ||
      selectedProfile.profileId ||
      selectedProfile.patientProfileId ||
      selectedProfile.memberId ||
      null;

    const type =
      selectedProfile.profileType ||
      selectedProfile.type ||
      selectedProfile.patientProfileType ||
      selectedProfile.relation ||
      "SELF";

    const name =
      selectedProfile.fullName ||
      selectedProfile.name ||
      selectedProfile.memberName ||
      selectedProfile.patientName ||
      null;

    return {
      id,
      type: String(type || "SELF").toUpperCase(),
      label: name ? `${name} (${String(type || "SELF").toUpperCase()})` : String(type || "SELF").toUpperCase()
    };
  }, [selectedProfile]);

  const showToast = useCallback((message, type = "success") => {
    setToast({
      message,
      type
    });

    window.setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  const getReadableError = (err, fallbackMessage) => {
    return (
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      fallbackMessage
    );
  };

  const formatDate = (value) => {
    if (!value) {
      return "Not available";
    }

    try {
      if (typeof value === "number") {
        return new Date(value).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        });
      }

      return new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch {
      return value;
    }
  };

  const formatDateTime = (value) => {
    if (!value) {
      return "Not available";
    }

    try {
      return new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "Not available";
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) {
      return "No file";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFallbackFileName = (record) => {
    if (record?.originalFileName) {
      return record.originalFileName;
    }

    const extension = record?.fileContentType?.includes("pdf") ? "pdf" : "file";
    const safeTitle = (record?.title || "medical-record")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    return `${safeTitle || "medical-record"}.${extension}`;
  };

  const getRecordIcon = (type) => {
    switch (type) {
      case "VISIT_SUMMARY":
        return "fa-notes-medical";
      case "PRESCRIPTION":
        return "fa-prescription-bottle-medical";
      case "LAB_REPORT":
        return "fa-vial";
      case "RADIOLOGY":
        return "fa-x-ray";
      case "DISCHARGE_SUMMARY":
        return "fa-hospital-user";
      case "VACCINATION":
        return "fa-syringe";
      default:
        return "fa-file-medical";
    }
  };

  const getStatusClassName = (status) => {
    const normalized = String(status || "").toUpperCase();

    if (normalized === "AVAILABLE" || normalized === "REVIEWED") {
      return "is-ready";
    }

    if (normalized === "PENDING" || normalized === "PENDING_REVIEW") {
      return "is-pending";
    }

    if (normalized === "DELETED") {
      return "is-deleted";
    }

    return "is-neutral";
  };

  const buildRequestParams = useCallback(() => {
    return {
      profileId: resolvedProfile.id,
      profileType: resolvedProfile.type,
      recordType,
      source,
      search
    };
  }, [recordType, resolvedProfile.id, resolvedProfile.type, search, source]);

  const loadRecords = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        setError("");

        const response = await getPatientMedicalRecords(buildRequestParams());

        setRecords(Array.isArray(response?.records) ? response.records : []);
        setSummary(response?.summary || null);
        setTotalCount(response?.totalCount || 0);
      } catch (err) {
        setError(
          getReadableError(
            err,
            "Unable to load medical records. Please try again."
          )
        );
        setRecords([]);
        setSummary(null);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [buildRequestParams]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadRecords();
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadRecords]);

  const handleRefresh = async () => {
    await loadRecords({ silent: true });
    showToast("Medical records refreshed.");
  };

  const handleOpenDetails = async (record) => {
    if (!record?.recordId) {
      return;
    }

    try {
      setSelectedRecord(record);
      setIsDetailsLoading(true);

      const details = await getPatientMedicalRecordById(record.recordId);
      setSelectedRecord(details);
    } catch (err) {
      showToast(
        getReadableError(err, "Unable to open record details."),
        "error"
      );
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleDownload = async (record, openInNewTab = false) => {
    if (!record?.recordId || !record?.downloadAllowed) {
      showToast("This record does not have a downloadable file.", "error");
      return;
    }

    try {
      showToast("Preparing secure download...", "success");

      const response = await downloadPatientMedicalRecord(record.recordId);
      const blob = response.blob;
      const blobUrl = window.URL.createObjectURL(blob);
      const fileName = response.fileName || getFallbackFileName(record);

      if (openInNewTab) {
        window.open(blobUrl, "_blank", "noopener,noreferrer");

        window.setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
        }, 60000);

        return;
      }

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);
      showToast("Download started.");
    } catch (err) {
      showToast(
        getReadableError(err, "Unable to download this record."),
        "error"
      );
    }
  };

  const handleDelete = async (record) => {
    if (!record?.recordId || !record?.deleteAllowed) {
      showToast("Only patient uploaded records can be deleted.", "error");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this uploaded medical record?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deletePatientMedicalRecord(record.recordId);
      showToast("Medical record deleted.");
      setSelectedRecord(null);
      await loadRecords({ silent: true });
    } catch (err) {
      showToast(
        getReadableError(err, "Unable to delete this record."),
        "error"
      );
    }
  };

  const handleUploadFieldChange = (event) => {
    const { name, value } = event.target;

    setUploadForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleUploadFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    setUploadForm((previous) => ({
      ...previous,
      file
    }));
  };

  const resetUploadModal = () => {
    setUploadForm(initialUploadForm);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const closeUploadModal = () => {
    if (isUploading) {
      return;
    }

    setShowUploadModal(false);
    resetUploadModal();
  };

  const handleUploadSubmit = async (event) => {
    event.preventDefault();

    const title = uploadForm.title.trim();
    const providerName = uploadForm.providerName.trim();
    const notes = uploadForm.notes.trim();

    if (!resolvedProfile.id || !resolvedProfile.type) {
      showToast("Please select a patient profile before uploading.", "error");
      return;
    }

    if (!title) {
      showToast("Record title is required.", "error");
      return;
    }

    if (!uploadForm.recordType) {
      showToast("Record type is required.", "error");
      return;
    }

    if (!uploadForm.recordDate) {
      showToast("Record date is required.", "error");
      return;
    }

    const selectedDate = new Date(uploadForm.recordDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (selectedDate > today) {
      showToast("Record date cannot be in the future.", "error");
      return;
    }

    if (!uploadForm.file) {
      showToast("Please select a file to upload.", "error");
      return;
    }

    try {
      setIsUploading(true);

      await uploadPatientMedicalRecord({
        file: uploadForm.file,
        title,
        recordType: uploadForm.recordType,
        recordDate: uploadForm.recordDate,
        profileId: resolvedProfile.id,
        profileType: resolvedProfile.type,
        providerName,
        notes
      });

      showToast("Medical record uploaded successfully.");
      setShowUploadModal(false);
      resetUploadModal();
      await loadRecords({ silent: true });
    } catch (err) {
      showToast(
        getReadableError(err, "Unable to upload medical record."),
        "error"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const summaryCards = useMemo(() => {
    return [
      {
        label: "Total Records",
        value: summary?.totalRecords ?? totalCount,
        helper: "All available records"
      },
      {
        label: "Doctor Added",
        value: summary?.doctorAdded ?? 0,
        helper: "Visits, reports, prescriptions"
      },
      {
        label: "Patient Uploaded",
        value: summary?.patientUploaded ?? 0,
        helper: "Uploaded by you"
      },
      {
        label: "Downloadable",
        value: summary?.downloadableRecords ?? 0,
        helper: "Files ready to download"
      }
    ];
  }, [summary, totalCount]);

  return (
    <div className="medical-records-page">
      {toast && (
        <div className={`mr-toast ${toast.type === "error" ? "is-error" : ""}`}>
          {toast.message}
        </div>
      )}

      <section className="mr-header-card">
        <div className="mr-header-content">
          <span className="mr-eyebrow">Patient Health Documents</span>
          <h1>Medical Records</h1>
          <p>
            View doctor visit summaries, prescriptions, lab reports and your
            uploaded health documents in one secure place.
          </p>

          <div className="mr-profile-pill">
            <span>Active profile</span>
            <strong>{resolvedProfile.label}</strong>
          </div>
        </div>

        <div className="mr-header-actions">
          <button
            type="button"
            className="mr-secondary-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <i className={`fas fa-rotate ${isRefreshing ? "fa-spin" : ""}`}></i>
            {isRefreshing ? "Refreshing" : "Refresh"}
          </button>

          <button
            type="button"
            className="mr-primary-btn"
            onClick={() => setShowUploadModal(true)}
          >
            <i className="fas fa-upload"></i>
            Upload Record
          </button>
        </div>
      </section>

      <section className="mr-summary-grid">
        {summaryCards.map((item) => (
          <article className="mr-summary-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.helper}</small>
          </article>
        ))}
      </section>

      <section className="mr-filter-card">
        <div className="mr-search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            value={search}
            placeholder="Search by title, doctor, clinic, notes, file name..."
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <button
              type="button"
              className="mr-clear-search"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="mr-filter-row">
          <label>
            Record type
            <select
              value={recordType}
              onChange={(event) => setRecordType(event.target.value)}
            >
              {RECORD_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Source
            <select
              value={source}
              onChange={(event) => setSource(event.target.value)}
            >
              {SOURCE_FILTERS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="mr-record-section">
        <div className="mr-section-heading">
          <div>
            <h2>Clinical Records</h2>
            <p>
              {totalCount} record{totalCount === 1 ? "" : "s"} found
              {summary?.latestRecordDate
                ? ` • Latest: ${formatDate(summary.latestRecordDate)}`
                : ""}
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="mr-state-card">
            <div className="mr-loader"></div>
            <h3>Loading medical records...</h3>
            <p>Please wait while we fetch your latest health documents.</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="mr-state-card is-error">
            <i className="fas fa-circle-exclamation"></i>
            <h3>Unable to load records</h3>
            <p>{error}</p>
            <button type="button" className="mr-primary-btn" onClick={handleRefresh}>
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !error && records.length === 0 && (
          <div className="mr-state-card">
            <i className="fas fa-folder-open"></i>
            <h3>No medical records found</h3>
            <p>
              Try changing filters or upload your first report to keep your
              medical history organized.
            </p>
            <button
              type="button"
              className="mr-primary-btn"
              onClick={() => setShowUploadModal(true)}
            >
              Upload Record
            </button>
          </div>
        )}

        {!isLoading && !error && records.length > 0 && (
          <div className="mr-record-list">
            {records.map((record) => (
              <article className="mr-record-card" key={record.recordId}>
                <div className="mr-record-icon">
                  <i className={`fas ${getRecordIcon(record.recordType)}`}></i>
                </div>

                <div className="mr-record-main">
                  <div className="mr-record-top">
                    <div>
                      <div className="mr-record-badges">
                        <span className="mr-type-badge">
                          {record.recordTypeLabel || "Medical Record"}
                        </span>
                        <span className="mr-source-badge">
                          {record.sourceLabel || "Source unavailable"}
                        </span>
                      </div>

                      <h3>{record.title || "Medical Record"}</h3>

                      <p className="mr-record-meta">
                        <span>
                          <i className="fas fa-calendar-day"></i>
                          {formatDate(record.recordDate)}
                        </span>

                        {record.doctorName && (
                          <span>
                            <i className="fas fa-user-doctor"></i>
                            Dr. {record.doctorName}
                          </span>
                        )}

                        {record.clinicName && (
                          <span>
                            <i className="fas fa-hospital"></i>
                            {record.clinicName}
                          </span>
                        )}
                      </p>
                    </div>

                    <span className={`mr-status ${getStatusClassName(record.status)}`}>
                      {record.status || "AVAILABLE"}
                    </span>
                  </div>

                  <p className="mr-record-summary">
                    {record.summary ||
                      record.doctorNote ||
                      record.notes ||
                      "No summary available for this record."}
                  </p>

                  <div className="mr-record-footer">
                    <div className="mr-file-info">
                      <i className={record.hasFile ? "fas fa-file-arrow-down" : "fas fa-file-lines"}></i>
                      <span>
                        {record.hasFile
                          ? `${record.originalFileName || "Attached file"} • ${formatFileSize(record.fileSizeBytes)}`
                          : "No downloadable file attached"}
                      </span>
                    </div>

                    <div className="mr-card-actions">
                      <button
                        type="button"
                        className="mr-light-btn"
                        onClick={() => handleOpenDetails(record)}
                      >
                        View Details
                      </button>

                      {record.downloadAllowed && (
                        <button
                          type="button"
                          className="mr-download-btn"
                          onClick={() => handleDownload(record)}
                        >
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedRecord && (
        <div
          className="mr-modal-backdrop"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="mr-modal mr-detail-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mr-modal-header">
              <div>
                <span className="mr-eyebrow">Record Details</span>
                <h2>{selectedRecord.title || "Medical Record"}</h2>
              </div>

              <button
                type="button"
                className="mr-close-btn"
                onClick={() => setSelectedRecord(null)}
                aria-label="Close details"
              >
                ×
              </button>
            </div>

            {isDetailsLoading ? (
              <div className="mr-modal-loading">
                <div className="mr-loader"></div>
                <p>Loading complete details...</p>
              </div>
            ) : (
              <>
                <div className="mr-detail-badges">
                  <span>{selectedRecord.recordTypeLabel || "Medical Record"}</span>
                  <span>{selectedRecord.sourceLabel || "Source unavailable"}</span>
                  <span className={getStatusClassName(selectedRecord.status)}>
                    {selectedRecord.status || "AVAILABLE"}
                  </span>
                </div>

                <div className="mr-detail-grid">
                  <div>
                    <label>Record date</label>
                    <strong>{formatDate(selectedRecord.recordDate)}</strong>
                  </div>

                  <div>
                    <label>Patient profile</label>
                    <strong>{selectedRecord.patientProfileType || "Not available"}</strong>
                  </div>

                  <div>
                    <label>Provider</label>
                    <strong>{selectedRecord.providerName || "Not available"}</strong>
                  </div>

                  <div>
                    <label>Doctor</label>
                    <strong>
                      {selectedRecord.doctorName
                        ? `Dr. ${selectedRecord.doctorName}`
                        : "Not linked"}
                    </strong>
                  </div>

                  <div>
                    <label>Clinic</label>
                    <strong>{selectedRecord.clinicName || "Not linked"}</strong>
                  </div>

                  <div>
                    <label>Location</label>
                    <strong>{selectedRecord.location || "Not available"}</strong>
                  </div>

                  <div>
                    <label>Created at</label>
                    <strong>{formatDateTime(selectedRecord.createdAt)}</strong>
                  </div>

                  <div>
                    <label>File size</label>
                    <strong>{formatFileSize(selectedRecord.fileSizeBytes)}</strong>
                  </div>
                </div>

                <div className="mr-detail-section">
                  <h3>Summary</h3>
                  <p>
                    {selectedRecord.summary ||
                      "No summary available for this record."}
                  </p>
                </div>

                {selectedRecord.doctorNote && (
                  <div className="mr-detail-section">
                    <h3>Doctor Note</h3>
                    <p>{selectedRecord.doctorNote}</p>
                  </div>
                )}

                {selectedRecord.notes && (
                  <div className="mr-detail-section">
                    <h3>Additional Notes</h3>
                    <p>{selectedRecord.notes}</p>
                  </div>
                )}

                {selectedRecord.medicines?.length > 0 && (
                  <div className="mr-detail-section">
                    <h3>Medicines</h3>
                    <div className="mr-medicine-list">
                      {selectedRecord.medicines.map((medicine) => (
                        <div className="mr-medicine-row" key={medicine.id}>
                          <strong>{medicine.medicineName}</strong>
                          <span>{medicine.dosage}</span>
                          <span>{medicine.duration}</span>
                          <small>{medicine.instruction}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mr-id-grid">
                  <span>Record ID: {selectedRecord.recordId}</span>
                  {selectedRecord.patientPublicAppointmentId && (
                    <span>
                      Appointment ID: {selectedRecord.patientPublicAppointmentId}
                    </span>
                  )}
                  {selectedRecord.doctorPatientVisitId && (
                    <span>Visit ID: {selectedRecord.doctorPatientVisitId}</span>
                  )}
                  {selectedRecord.doctorPatientPrescriptionId && (
                    <span>
                      Prescription ID: {selectedRecord.doctorPatientPrescriptionId}
                    </span>
                  )}
                  {selectedRecord.doctorPatientMedicalReportId && (
                    <span>
                      Report ID: {selectedRecord.doctorPatientMedicalReportId}
                    </span>
                  )}
                </div>

                <div className="mr-modal-actions">
                  {selectedRecord.downloadAllowed && (
                    <>
                      <button
                        type="button"
                        className="mr-secondary-btn"
                        onClick={() => handleDownload(selectedRecord, true)}
                      >
                        Open File
                      </button>

                      <button
                        type="button"
                        className="mr-download-btn"
                        onClick={() => handleDownload(selectedRecord)}
                      >
                        Download
                      </button>
                    </>
                  )}

                  {selectedRecord.deleteAllowed && (
                    <button
                      type="button"
                      className="mr-danger-btn"
                      onClick={() => handleDelete(selectedRecord)}
                    >
                      Delete Upload
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="mr-modal-backdrop" onClick={closeUploadModal}>
          <div
            className="mr-modal mr-upload-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mr-modal-header">
              <div>
                <span className="mr-eyebrow">Patient Upload</span>
                <h2>Upload Medical Record</h2>
              </div>

              <button
                type="button"
                className="mr-close-btn"
                onClick={closeUploadModal}
                aria-label="Close upload modal"
              >
                ×
              </button>
            </div>

            <form className="mr-upload-form" onSubmit={handleUploadSubmit}>
              <div className="mr-upload-note">
                <i className="fas fa-lock"></i>
                <p>
                  This file will be linked with{" "}
                  <strong>{resolvedProfile.label}</strong>. Supported formats:
                  PDF, JPG, JPEG, PNG and WEBP up to 10 MB.
                </p>
              </div>

              <label>
                Record title <span>*</span>
                <input
                  type="text"
                  name="title"
                  value={uploadForm.title}
                  placeholder="Example: CBC Blood Test"
                  onChange={handleUploadFieldChange}
                  maxLength={255}
                />
              </label>

              <div className="mr-form-grid">
                <label>
                  Record type <span>*</span>
                  <select
                    name="recordType"
                    value={uploadForm.recordType}
                    onChange={handleUploadFieldChange}
                  >
                    {UPLOAD_RECORD_TYPES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Record date <span>*</span>
                  <input
                    type="date"
                    name="recordDate"
                    value={uploadForm.recordDate}
                    onChange={handleUploadFieldChange}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </label>
              </div>

              <label>
                Provider / lab / hospital name
                <input
                  type="text"
                  name="providerName"
                  value={uploadForm.providerName}
                  placeholder="Example: Apollo Diagnostics"
                  onChange={handleUploadFieldChange}
                  maxLength={255}
                />
              </label>

              <label>
                Notes
                <textarea
                  name="notes"
                  value={uploadForm.notes}
                  placeholder="Add a short note about this record"
                  onChange={handleUploadFieldChange}
                  maxLength={3000}
                />
              </label>

              <div className="mr-file-drop">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                  onChange={handleUploadFileChange}
                />

                <div>
                  <i className="fas fa-file-arrow-up"></i>
                  <strong>
                    {uploadForm.file ? uploadForm.file.name : "Choose file"}
                  </strong>
                  <span>
                    {uploadForm.file
                      ? formatFileSize(uploadForm.file.size)
                      : "PDF, JPG, JPEG, PNG, WEBP"}
                  </span>
                </div>
              </div>

              <div className="mr-modal-actions">
                <button
                  type="button"
                  className="mr-secondary-btn"
                  onClick={closeUploadModal}
                  disabled={isUploading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="mr-primary-btn"
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Upload Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;