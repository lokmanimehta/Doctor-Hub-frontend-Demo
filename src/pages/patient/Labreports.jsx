import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Upload,
  Download,
  Share2,
  FileText,
  CheckCircle2,
  Building2,
  X,
  Info,
  Eye,
  Trash2,
  Loader2,
  UserRound,
  ShieldCheck,
  RefreshCw,
  CalendarDays
} from "lucide-react";
import "./Labreports.css";
import { useProfile } from "../../context/useProfile";
import {
  deletePatientMedicalRecord,
  downloadPatientMedicalRecord,
  getPatientMedicalRecordShareableDoctors,
  getPatientMedicalRecords,
  getPatientProfile,
  sharePatientMedicalRecord,
  uploadPatientMedicalRecord
} from "../../services/patientService";

const FILTERS = [
  { label: "All Reports", value: "ALL" },
  { label: "Sent by Doctor", value: "DOCTOR" },
  { label: "Uploaded by Me", value: "PATIENT" }
];

const DATE_FILTERS = [
  { label: "All Time", value: "ALL" },
  { label: "Last 7 Days", value: "7" },
  { label: "Last 30 Days", value: "30" },
  { label: "Last 90 Days", value: "90" }
];

const MAX_FILE_SIZE_MB = 10;

const getTodayDate = () => {
  return new Date().toISOString().slice(0, 10);
};

const safeText = (value, fallback = "Not available") => {
  if (value === null || value === undefined) return fallback;

  const text = String(value).trim();
  return text || fallback;
};

const getFileBaseName = (fileName = "") => {
  const cleanName = String(fileName || "").trim();
  if (!cleanName) return "Lab Report";

  const lastDot = cleanName.lastIndexOf(".");
  return lastDot > 0 ? cleanName.slice(0, lastDot) : cleanName;
};

const formatDate = (value) => {
  if (!value) return "Date not available";

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}-${month}-${year}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const formatFileSize = (bytes) => {
  const size = Number(bytes || 0);

  if (!size) return "File size not available";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const isPatientUploadedRecord = (record) => {
  return (
    record?.source === "PATIENT_UPLOADED" ||
    record?.sourceEntityType === "PATIENT_UPLOAD"
  );
};

const getRecordSourceType = (record) => {
  return isPatientUploadedRecord(record) ? "PATIENT" : "DOCTOR";
};

const getRecordProvider = (record) => {
  return (
    record?.providerName ||
    record?.clinicName ||
    record?.doctorName ||
    record?.sourceLabel ||
    "Medical Provider"
  );
};

const getRecordTitle = (record) => {
  return record?.title || record?.originalFileName || "Lab Report";
};

const getRecordDate = (record) => {
  return record?.recordDate || record?.createdAt || null;
};

const getProfileType = (profile) => {
  if (!profile) return null;

  const rawType =
    profile.profileType ||
    profile.type ||
    profile.patientProfileType ||
    profile.relation ||
    null;

  if (!rawType) return null;

  const normalized = String(rawType).trim().toUpperCase();

  if (normalized === "SELF") return "SELF";
  if (normalized === "FAMILY") return "FAMILY";
  if (normalized !== "SELF") return "FAMILY";

  return "SELF";
};

const getProfileName = (profile) => {
  if (!profile) return "No patient selected";

  return (
    profile.fullName ||
    profile.name ||
    profile.patientName ||
    profile.memberName ||
    "Selected Patient"
  );
};

const downloadBlob = ({ blob, fileName }) => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = fileName || "lab-report";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(objectUrl);
};

const LabReports = () => {
  const { selectedProfile } = useProfile();

  const [records, setRecords] = useState([]);
  const [sharedRecordIds, setSharedRecordIds] = useState(() => new Set());

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [toast, setToast] = useState(null);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    providerName: "",
    recordDate: getTodayDate(),
    notes: "",
    doctorPatientId: ""
  });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [shareOpen, setShareOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);
  const [shareDoctors, setShareDoctors] = useState([]);
  const [doctorListLoading, setDoctorListLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState("");
  const [shareForm, setShareForm] = useState({
    doctorPatientId: "",
    note: ""
  });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewError, setPreviewError] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [infoModal, setInfoModal] = useState(null);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });

    window.setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

const getSelectedProfileId = (profile) => {
  if (!profile) return null;

  return (
    profile.patientProfileId ||
    profile.profileId ||
    profile.id ||
    profile.memberId ||
    null
  );
};

const resolveProfileForApi = useCallback(
  async ({ required = false } = {}) => {
    if (!selectedProfile) {
      if (required) {
        throw new Error("Please select patient profile first.");
      }

      return {
        profileId: null,
        profileType: null
      };
    }

    const profileType = getProfileType(selectedProfile) || "SELF";
    const selectedProfileId = getSelectedProfileId(selectedProfile);

    if (selectedProfileId) {
      return {
        profileId: selectedProfileId,
        profileType
      };
    }

    if (profileType === "SELF") {
      const profile = await getPatientProfile();

      const profileId =
        profile?.patientProfileId ||
        profile?.profileId ||
        profile?.id ||
        null;

      if (!profileId) {
        throw new Error("Please complete your patient profile first.");
      }

      return {
        profileId,
        profileType: "SELF"
      };
    }

    throw new Error("Selected patient profile is invalid.");
  },
  [selectedProfile]
);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");

      const profile = await resolveProfileForApi({ required: false });

      const response = await getPatientMedicalRecords({
        profileId: profile.profileId,
        profileType: profile.profileType,
        recordType: "LAB_REPORT"
      });

      setRecords(Array.isArray(response?.records) ? response.records : []);
    } catch (error) {
      console.error("Failed to load lab reports", error);
      setPageError(
        error.response?.data?.message ||
        error.message ||
        "Unable to load lab reports right now."
      );
    } finally {
      setLoading(false);
    }
  }, [resolveProfileForApi]);

  const loadShareableDoctors = useCallback(async () => {
    const profile = await resolveProfileForApi({ required: true });

    const response = await getPatientMedicalRecordShareableDoctors({
      profileId: profile.profileId,
      profileType: profile.profileType
    });

    return Array.isArray(response) ? response : [];
  }, [resolveProfileForApi]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    const hasModal =
      uploadOpen ||
      shareOpen ||
      previewOpen ||
      deleteOpen ||
      Boolean(infoModal);

    if (!hasModal) {
      document.body.style.overflow = "unset";
      return undefined;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [uploadOpen, shareOpen, previewOpen, deleteOpen, infoModal]);

  useEffect(() => {
    return () => {
      if (previewData?.url) {
        URL.revokeObjectURL(previewData.url);
      }
    };
  }, [previewData?.url]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records
      .filter((record) => {
        const sourceType = getRecordSourceType(record);
        const matchesTab = activeTab === "ALL" || sourceType === activeTab;

        const searchable = [
          getRecordTitle(record),
          getRecordProvider(record),
          record.doctorName,
          record.clinicName,
          record.recordTypeLabel,
          record.sourceLabel,
          record.originalFileName,
          record.notes,
          record.summary,
          record.recordDate
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch = query ? searchable.includes(query) : true;

        let matchesDate = true;

        if (dateFilter !== "ALL") {
          const recordDate = new Date(getRecordDate(record));
          const today = new Date();

          if (Number.isNaN(recordDate.getTime())) {
            matchesDate = false;
          } else {
            const diffDays =
              (today.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24);

            matchesDate = diffDays <= Number(dateFilter);
          }
        }

        return matchesTab && matchesSearch && matchesDate;
      })
      .sort((a, b) => {
        const aTime = new Date(getRecordDate(a)).getTime() || 0;
        const bTime = new Date(getRecordDate(b)).getTime() || 0;
        return bTime - aTime;
      });
  }, [records, activeTab, search, dateFilter]);

  const stats = useMemo(() => {
    const doctorSent = records.filter(
      (record) => getRecordSourceType(record) === "DOCTOR"
    ).length;

    const uploaded = records.filter(
      (record) => getRecordSourceType(record) === "PATIENT"
    ).length;

    return {
      total: records.length,
      doctorSent,
      uploaded,
      shared: sharedRecordIds.size
    };
  }, [records, sharedRecordIds]);

  const openUploadModal = async (file) => {
    if (!file) return;

    const sizeInMb = file.size / (1024 * 1024);

    if (sizeInMb > MAX_FILE_SIZE_MB) {
      setInfoModal({
        type: "error",
        title: "File is too large",
        message: `Please upload a file under ${MAX_FILE_SIZE_MB} MB.`
      });
      return;
    }

    setUploadFile(file);
    setUploadForm({
      title: getFileBaseName(file.name),
      providerName: "",
      recordDate: getTodayDate(),
      notes: "",
      doctorPatientId: ""
    });

    setUploadError("");
    setShareDoctors([]);
    setUploadOpen(true);

    try {
      setDoctorListLoading(true);

      const doctors = await loadShareableDoctors();

      setShareDoctors(doctors);

      if (!doctors.length) {
        setUploadError(
          "No consulted doctor found for this patient profile. You can still save this report to your vault."
        );
      }
    } catch (error) {
      console.error("Failed to load shareable doctors", error);
      setShareDoctors([]);
      setUploadError(
        error.response?.data?.message ||
        error.message ||
        "Unable to load consulted doctors. You can still save this report to your vault."
      );
    } finally {
      setDoctorListLoading(false);
    }
  };

  const closeUploadModal = () => {
    if (uploadLoading) return;

    setUploadOpen(false);
    setUploadFile(null);
    setUploadError("");
  };

  const handleFileInput = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    openUploadModal(file);
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      setUploadError("Please select a report file.");
      return;
    }

    if (!uploadForm.title.trim()) {
      setUploadError("Report title is required.");
      return;
    }

    if (!uploadForm.recordDate) {
      setUploadError("Report date is required.");
      return;
    }

    try {
      setUploadLoading(true);
      setUploadError("");

      const profile = await resolveProfileForApi({ required: true });

      const uploadedRecord = await uploadPatientMedicalRecord({
        file: uploadFile,
        title: uploadForm.title.trim(),
        recordType: "LAB_REPORT",
        recordDate: uploadForm.recordDate,
        profileId: profile.profileId,
        profileType: profile.profileType,
        providerName: uploadForm.providerName.trim() || "Patient uploaded",
        notes: uploadForm.notes.trim()
      });

      if (uploadForm.doctorPatientId) {
        const shareResponse = await sharePatientMedicalRecord(
          uploadedRecord.recordId,
          {
            doctorPatientId: Number(uploadForm.doctorPatientId),
            note:
              uploadForm.notes.trim() ||
              `Please review ${uploadForm.title.trim()} report.`
          }
        );

        setSharedRecordIds((prev) => {
          const next = new Set(prev);
          next.add(uploadedRecord.recordId);
          return next;
        });

        showToast(
          "success",
          shareResponse?.message ||
          "Report uploaded and shared with doctor successfully."
        );
      } else {
        showToast("success", "Report uploaded successfully.");
      }

      closeUploadModal();
      await loadRecords();
    } catch (error) {
      console.error("Upload report failed", error);
      setUploadError(
        error.response?.data?.message ||
        error.message ||
        "Unable to upload report. Please try again."
      );
    } finally {
      setUploadLoading(false);
    }
  };

  const openShareModal = async (record) => {
    if (!isPatientUploadedRecord(record)) {
      setInfoModal({
        type: "info",
        title: "Doctor-sent report",
        message:
          "Only reports uploaded by you can be shared with consulted doctors. Doctor-sent reports are already available in your vault."
      });
      return;
    }

    setShareTarget(record);
    setShareForm({
      doctorPatientId: "",
      note: `Please review ${getRecordTitle(record)}.`
    });
    setShareError("");
    setShareOpen(true);

    try {
      setShareLoading(true);
      const doctors = await loadShareableDoctors();
      setShareDoctors(doctors);
    } catch (error) {
      console.error("Failed to load shareable doctors", error);
      setShareError(
        error.response?.data?.message ||
        error.message ||
        "Unable to load consulted doctors."
      );
      setShareDoctors([]);
    } finally {
      setShareLoading(false);
    }
  };

  const closeShareModal = () => {
    if (shareLoading) return;

    setShareOpen(false);
    setShareTarget(null);
    setShareError("");
  };

  const handleShareSubmit = async () => {
    if (!shareTarget?.recordId) {
      setShareError("Report not found. Please refresh and try again.");
      return;
    }

    if (!shareForm.doctorPatientId) {
      setShareError("Please select a doctor.");
      return;
    }

    try {
      setShareLoading(true);
      setShareError("");

      const response = await sharePatientMedicalRecord(shareTarget.recordId, {
        doctorPatientId: Number(shareForm.doctorPatientId),
        note: shareForm.note.trim()
      });

      setSharedRecordIds((prev) => {
        const next = new Set(prev);
        next.add(shareTarget.recordId);
        return next;
      });

      closeShareModal();
      showToast(
        "success",
        response?.message || "Report shared with doctor successfully."
      );
    } catch (error) {
      console.error("Share report failed", error);
      setShareError(
        error.response?.data?.message ||
        "Unable to share report. Please try again."
      );
    } finally {
      setShareLoading(false);
    }
  };

  const handleDownload = async (record) => {
    if (!record?.downloadAllowed) {
      setInfoModal({
        type: "error",
        title: "Download unavailable",
        message: "This report cannot be downloaded right now."
      });
      return;
    }

    try {
      const file = await downloadPatientMedicalRecord(record.recordId);

      downloadBlob({
        blob: file.blob,
        fileName: file.fileName || record.originalFileName || getRecordTitle(record)
      });

      showToast("success", "Report download started.");
    } catch (error) {
      console.error("Download failed", error);
      setInfoModal({
        type: "error",
        title: "Download failed",
        message:
          error.response?.data?.message ||
          "Unable to download this report right now."
      });
    }
  };

  const openPreview = async (record) => {
    if (!record?.downloadAllowed) {
      setInfoModal({
        type: "error",
        title: "Preview unavailable",
        message: "This report cannot be previewed right now."
      });
      return;
    }

    try {
      setPreviewOpen(true);
      setPreviewLoading(true);
      setPreviewError("");

      if (previewData?.url) {
        URL.revokeObjectURL(previewData.url);
      }

      const file = await downloadPatientMedicalRecord(record.recordId);
      const url = URL.createObjectURL(file.blob);

      setPreviewData({
        url,
        title: getRecordTitle(record),
        fileName: file.fileName || record.originalFileName || getRecordTitle(record),
        contentType:
          file.contentType ||
          record.fileContentType ||
          "application/octet-stream"
      });
    } catch (error) {
      console.error("Preview failed", error);
      setPreviewError(
        error.response?.data?.message ||
        "Unable to preview this report right now."
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewData?.url) {
      URL.revokeObjectURL(previewData.url);
    }

    setPreviewOpen(false);
    setPreviewData(null);
    setPreviewError("");
  };

  const openDeleteModal = (record) => {
    if (!record?.deleteAllowed) {
      setInfoModal({
        type: "error",
        title: "Delete unavailable",
        message: "Doctor-sent reports cannot be deleted from your vault."
      });
      return;
    }

    setDeleteTarget(record);
    setDeleteError("");
    setDeleteOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;

    setDeleteOpen(false);
    setDeleteTarget(null);
    setDeleteError("");
  };

  const handleDelete = async () => {
    if (!deleteTarget?.recordId) {
      setDeleteError("Report not found. Please refresh and try again.");
      return;
    }

    try {
      setDeleteLoading(true);
      setDeleteError("");

      await deletePatientMedicalRecord(deleteTarget.recordId);

      closeDeleteModal();
      showToast("success", "Report removed from your vault.");
      await loadRecords();
    } catch (error) {
      console.error("Delete failed", error);
      setDeleteError(
        error.response?.data?.message ||
        "Unable to delete report. Please try again."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderPreviewContent = () => {
    if (previewLoading) {
      return (
        <div className="reports-preview-state">
          <Loader2 size={28} className="spin" />
          <p>Preparing preview...</p>
        </div>
      );
    }

    if (previewError) {
      return (
        <div className="reports-preview-state error">
          <Info size={30} />
          <p>{previewError}</p>
        </div>
      );
    }

    if (!previewData?.url) {
      return null;
    }

    const type = String(previewData.contentType || "").toLowerCase();

    if (type.includes("image")) {
      return (
        <img
          className="reports-preview-image"
          src={previewData.url}
          alt={previewData.title}
        />
      );
    }

    if (type.includes("pdf")) {
      return (
        <iframe
          className="reports-preview-frame"
          src={previewData.url}
          title={previewData.title}
        />
      );
    }

    return (
      <div className="reports-preview-state">
        <FileText size={34} />
        <p>Preview is not available for this file type.</p>
        <button
          type="button"
          className="reports-primary-btn"
          onClick={() =>
            downloadBlob({
              blob: previewData.url,
              fileName: previewData.fileName
            })
          }
        >
          Download File
        </button>
      </div>
    );
  };

  return (
    <div className="reports-page">
      {toast && (
        <div className={`reports-toast ${toast.type}`}>
          <CheckCircle2 size={18} />
          <span>{toast.message}</span>
        </div>
      )}

      <section className="reports-hero">
        <div>
          <span className="reports-kicker">Medical Vault</span>
          <h1>Lab Reports</h1>
          <p>
            View reports sent by doctors, upload your own lab files, download
            records, and securely share patient-uploaded reports with consulted
            doctors.
          </p>
        </div>

        <label className="reports-upload-btn">
          <Upload size={18} />
          <span>Upload Report</span>
          <input
            type="file"
            hidden
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleFileInput}
          />
        </label>
      </section>

      <section className="reports-stats-grid">
        <div className="reports-stat-card">
          <span>Total Reports</span>
          <strong>{stats.total}</strong>
        </div>

        <div className="reports-stat-card">
          <span>Sent by Doctor</span>
          <strong>{stats.doctorSent}</strong>
        </div>

        <div className="reports-stat-card">
          <span>Uploaded by Me</span>
          <strong>{stats.uploaded}</strong>
        </div>

        <div className="reports-stat-card">
          <span>Shared This Session</span>
          <strong>{stats.shared}</strong>
        </div>
      </section>

      <section className="reports-toolbar">
        <div className="reports-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search reports, doctors, labs, file names..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {search && (
            <button type="button" onClick={() => setSearch("")}>
              Clear
            </button>
          )}
        </div>

        <div className="reports-filter-pills">
          {FILTERS.map((filter) => (
            <button
              type="button"
              key={filter.value}
              className={activeTab === filter.value ? "active" : ""}
              onClick={() => setActiveTab(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <select
          className="reports-date-filter"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
        >
          {DATE_FILTERS.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="reports-refresh-btn"
          onClick={loadRecords}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          Refresh
        </button>
      </section>

      <section className="reports-profile-note">
        <UserRound size={18} />
        <div>
          <strong>Booking for {getProfileName(selectedProfile)}</strong>
          <span>
            {selectedProfile
              ? "Reports are filtered for the selected patient profile."
              : "Select patient profile to upload or share reports."}
          </span>
        </div>
      </section>

      <section className="reports-list">
        {loading && (
          <div className="reports-state-card">
            <Loader2 size={28} className="spin" />
            <p>Loading lab reports...</p>
          </div>
        )}

        {!loading && pageError && (
          <div className="reports-state-card error">
            <Info size={32} />
            <p>{pageError}</p>
            <button type="button" onClick={loadRecords}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !pageError && filteredRecords.length === 0 && (
          <div className="reports-state-card">
            <FileText size={36} />
            <p>No lab reports found.</p>
            <span>Upload a report or change your filters.</span>
          </div>
        )}

        {!loading &&
          !pageError &&
          filteredRecords.map((record) => {
            const sourceType = getRecordSourceType(record);
            const patientUploaded = sourceType === "PATIENT";
            const shared = sharedRecordIds.has(record.recordId);

            return (
              <article className="report-card" key={record.recordId}>
                <div className="report-card-main">
                  <div
                    className={`report-file-icon ${patientUploaded ? "patient" : "doctor"
                      }`}
                  >
                    <FileText size={22} />
                  </div>

                  <div className="report-info">
                    <div className="report-title-row">
                      <h3>{getRecordTitle(record)}</h3>

                      <span
                        className={`report-source-chip ${patientUploaded ? "patient" : "doctor"
                          }`}
                      >
                        {patientUploaded ? "Uploaded by Me" : "Sent by Doctor"}
                      </span>

                      {shared && (
                        <span className="report-shared-chip">
                          <CheckCircle2 size={12} />
                          Shared
                        </span>
                      )}
                    </div>

                    <div className="report-meta">
                      <span>
                        <Building2 size={13} />
                        {getRecordProvider(record)}
                      </span>

                      <span>
                        <CalendarDays size={13} />
                        {formatDate(record.recordDate)}
                      </span>

                      <span>{formatFileSize(record.fileSizeBytes)}</span>
                    </div>

                    {(record.doctorName || record.notes || record.summary) && (
                      <p className="report-summary">
                        {record.doctorName ? `Dr. ${record.doctorName} • ` : ""}
                        {record.notes || record.summary || "No notes added"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="report-actions">
                  <button
                    type="button"
                    className="report-action-main"
                    onClick={() => openPreview(record)}
                  >
                    <Eye size={16} />
                    Preview
                  </button>

                  <div className="report-icon-actions">
                    <button
                      type="button"
                      title="Download report"
                      onClick={() => handleDownload(record)}
                    >
                      <Download size={17} />
                    </button>

                    <button
                      type="button"
                      title={
                        patientUploaded
                          ? "Share with doctor"
                          : "Doctor-sent reports cannot be shared"
                      }
                      onClick={() => openShareModal(record)}
                    >
                      <Share2 size={17} />
                    </button>

                    {record.deleteAllowed && (
                      <button
                        type="button"
                        title="Delete report"
                        className="danger"
                        onClick={() => openDeleteModal(record)}
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
      </section>

      {uploadOpen && (
        <div className="reports-modal-overlay">
          <div className="reports-modal-card large">
            <div className="reports-modal-header">
              <div>
                <span>Upload Lab Report</span>
                <h2>Save report to medical vault</h2>
              </div>

              <button type="button" onClick={closeUploadModal}>
                <X size={20} />
              </button>
            </div>

            <div className="reports-modal-body">
              <div className="reports-file-preview">
                <FileText size={22} />
                <div>
                  <strong>{uploadFile?.name}</strong>
                  <span>{formatFileSize(uploadFile?.size)}</span>
                </div>
              </div>

              <div className="reports-form-grid">
                <label>
                  <span>Report Title</span>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(event) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        title: event.target.value
                      }))
                    }
                    placeholder="CBC Blood Test"
                  />
                </label>

                <label>
                  <span>Lab / Provider Name</span>
                  <input
                    type="text"
                    value={uploadForm.providerName}
                    onChange={(event) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        providerName: event.target.value
                      }))
                    }
                    placeholder="Apollo Diagnostics"
                  />
                </label>

                <label>
                  <span>Report Date</span>
                  <input
                    type="date"
                    value={uploadForm.recordDate}
                    onChange={(event) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        recordDate: event.target.value
                      }))
                    }
                  />
                </label>

                <div className="reports-upload-share-section">
                  <div className="reports-upload-share-head">
                    <div>
                      <span>Share With Consulted Doctor</span>
                      <strong>Choose doctor for this report</strong>
                      <p>
                        Select a doctor only if you want this uploaded report to appear on the
                        doctor side under this patient profile.
                      </p>
                    </div>

                    {doctorListLoading && (
                      <div className="reports-mini-loader">
                        <Loader2 size={15} className="spin" />
                        Loading doctors
                      </div>
                    )}
                  </div>

                  <div className="reports-doctor-choice-grid">
                    <button
                      type="button"
                      className={!uploadForm.doctorPatientId ? "selected" : ""}
                      onClick={() =>
                        setUploadForm((prev) => ({
                          ...prev,
                          doctorPatientId: ""
                        }))
                      }
                    >
                      <div className="reports-choice-icon vault">V</div>

                      <div>
                        <strong>Save only to vault</strong>
                        <span>Doctor will not receive this report.</span>
                      </div>

                      <CheckCircle2 size={18} />
                    </button>

                    {shareDoctors.map((doctor) => (
                      <button
                        type="button"
                        key={doctor.doctorPatientId}
                        className={
                          Number(uploadForm.doctorPatientId) ===
                            Number(doctor.doctorPatientId)
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          setUploadForm((prev) => ({
                            ...prev,
                            doctorPatientId: doctor.doctorPatientId
                          }))
                        }
                      >
                        <div className="reports-choice-icon doctor">
                          {safeText(doctor.doctorName, "D").charAt(0)}
                        </div>

                        <div>
                          <strong>{doctor.doctorName}</strong>
                          <span>
                            {doctor.clinicName || "Clinic not updated"} •{" "}
                            {doctor.sourcePatientProfileType || "Patient"}
                          </span>
                        </div>

                        <CheckCircle2 size={18} />
                      </button>
                    ))}
                  </div>

                  {!doctorListLoading && shareDoctors.length === 0 && (
                    <div className="reports-doctor-empty-note">
                      No booked or consulted doctor found for the selected patient profile.
                      Upload will be saved only to patient vault.
                    </div>
                  )}
                </div>
              </div>

              <label className="reports-textarea-field">
                <span>Notes</span>
                <textarea
                  rows="4"
                  value={uploadForm.notes}
                  onChange={(event) =>
                    setUploadForm((prev) => ({
                      ...prev,
                      notes: event.target.value
                    }))
                  }
                  placeholder="Add report notes or instructions for doctor..."
                />
              </label>

              {uploadError && (
                <div className="reports-inline-error">{uploadError}</div>
              )}
            </div>

            <div className="reports-modal-footer">
              <button
                type="button"
                className="reports-secondary-btn"
                onClick={closeUploadModal}
                disabled={uploadLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="reports-primary-btn"
                onClick={handleUploadSubmit}
                disabled={uploadLoading}
              >
                {uploadLoading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Saving...
                  </>
                ) : (
                  "Upload Report"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {shareOpen && shareTarget && (
        <div className="reports-modal-overlay">
          <div className="reports-modal-card">
            <div className="reports-modal-header">
              <div>
                <span>Secure Share</span>
                <h2>Share report with doctor</h2>
              </div>

              <button type="button" onClick={closeShareModal}>
                <X size={20} />
              </button>
            </div>

            <div className="reports-modal-body">
              <div className="reports-file-preview">
                <ShieldCheck size={22} />
                <div>
                  <strong>{getRecordTitle(shareTarget)}</strong>
                  <span>{getRecordProvider(shareTarget)}</span>
                </div>
              </div>

              {shareLoading && (
                <div className="reports-small-state">
                  <Loader2 size={18} className="spin" />
                  Loading consulted doctors...
                </div>
              )}

              {!shareLoading && shareDoctors.length === 0 && (
                <div className="reports-small-state">
                  No consulted doctors found for selected profile.
                </div>
              )}

              {!shareLoading && shareDoctors.length > 0 && (
                <div className="reports-doctor-list">
                  {shareDoctors.map((doctor) => (
                    <button
                      type="button"
                      key={doctor.doctorPatientId}
                      className={
                        Number(shareForm.doctorPatientId) ===
                          Number(doctor.doctorPatientId)
                          ? "selected"
                          : ""
                      }
                      onClick={() =>
                        setShareForm((prev) => ({
                          ...prev,
                          doctorPatientId: doctor.doctorPatientId
                        }))
                      }
                    >
                      <div className="reports-doctor-avatar">
                        {safeText(doctor.doctorName, "D").charAt(0)}
                      </div>

                      <div>
                        <strong>{doctor.doctorName}</strong>
                        <span>{doctor.clinicName || "Clinic not updated"}</span>
                      </div>

                      <CheckCircle2 size={18} />
                    </button>
                  ))}
                </div>
              )}

              <label className="reports-textarea-field">
                <span>Note for Doctor</span>
                <textarea
                  rows="3"
                  value={shareForm.note}
                  onChange={(event) =>
                    setShareForm((prev) => ({
                      ...prev,
                      note: event.target.value
                    }))
                  }
                  placeholder="Please review this lab report..."
                />
              </label>

              {shareError && (
                <div className="reports-inline-error">{shareError}</div>
              )}
            </div>

            <div className="reports-modal-footer">
              <button
                type="button"
                className="reports-secondary-btn"
                onClick={closeShareModal}
                disabled={shareLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="reports-primary-btn"
                onClick={handleShareSubmit}
                disabled={shareLoading}
              >
                {shareLoading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Sharing...
                  </>
                ) : (
                  "Share Report"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewOpen && (
        <div className="reports-modal-overlay preview">
          <div className="reports-modal-card preview-card">
            <div className="reports-modal-header">
              <div>
                <span>Report Preview</span>
                <h2>{previewData?.title || "Lab Report"}</h2>
              </div>

              <button type="button" onClick={closePreview}>
                <X size={20} />
              </button>
            </div>

            <div className="reports-preview-body">{renderPreviewContent()}</div>
          </div>
        </div>
      )}

      {deleteOpen && deleteTarget && (
        <div className="reports-modal-overlay">
          <div className="reports-modal-card compact">
            <div className="reports-warning-icon">
              <Trash2 size={22} />
            </div>

            <h2>Delete this report?</h2>
            <p>
              This will remove <strong>{getRecordTitle(deleteTarget)}</strong>{" "}
              from your medical vault. Doctor-sent reports cannot be deleted.
            </p>

            {deleteError && (
              <div className="reports-inline-error">{deleteError}</div>
            )}

            <div className="reports-modal-footer no-padding">
              <button
                type="button"
                className="reports-secondary-btn"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
              >
                Keep Report
              </button>

              <button
                type="button"
                className="reports-danger-btn"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Report"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {infoModal && (
        <div className="reports-modal-overlay">
          <div className="reports-modal-card compact">
            <div
              className={`reports-info-icon ${infoModal.type === "error" ? "error" : ""
                }`}
            >
              <Info size={22} />
            </div>

            <h2>{infoModal.title}</h2>
            <p>{infoModal.message}</p>

            <div className="reports-modal-footer no-padding">
              <button
                type="button"
                className="reports-primary-btn full"
                onClick={() => setInfoModal(null)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabReports;