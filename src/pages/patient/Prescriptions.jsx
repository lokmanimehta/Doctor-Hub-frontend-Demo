import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./Prescriptions.css";
import jsPDF from "jspdf";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiClipboard,
  FiEye,
  FiFileText,
  FiMapPin,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiX
} from "react-icons/fi";
import {
  getPatientPrescriptionById,
  getPatientPrescriptions
} from "../../services/patientService";
import { useProfile } from "../../context/useProfile";

const FILTERS = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Past", value: "PAST" }
];

const getProfileId = (profile) => {
  if (!profile) {
    return null;
  }

  return (
    profile.id ||
    profile.profileId ||
    profile.patientProfileId ||
    profile.memberId ||
    null
  );
};

const getProfileType = (profile) => {
  if (!profile) {
    return null;
  }

  const type =
    profile.profileType ||
    profile.type ||
    profile.patientProfileType ||
    profile.relation ||
    null;

  return type ? String(type).trim().toUpperCase() : null;
};

const getProfileName = (profile) => {
  if (!profile) {
    return "All profiles";
  }

  return (
    profile.fullName ||
    profile.name ||
    profile.memberName ||
    profile.patientName ||
    profile.profileName ||
    "Selected profile"
  );
};

const normalizeStatus = (status) => {
  if (!status) {
    return "";
  }

  return String(status).trim().toUpperCase();
};

const safeText = (value, fallback = "Not available") => {
  if (value === null || value === undefined) {
    return fallback;
  }

  const text = String(value).trim();
  return text ? text : fallback;
};

const formatDate = (value) => {
  if (!value) {
    return "Not scheduled";
  }

  if (typeof value === "string") {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not scheduled";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const getMedicineName = (medicine) => {
  return safeText(medicine?.name || medicine?.medicineName, "Medicine");
};

const getMedicineInstruction = (medicine) => {
  return safeText(
    medicine?.instruction || medicine?.timing || medicine?.info,
    "No instruction added"
  );
};

const buildCopyText = (prescription) => {
  const medicines = Array.isArray(prescription?.medicines)
    ? prescription.medicines
    : [];

  const followUps = Array.isArray(prescription?.followUps)
    ? prescription.followUps
    : [];

  const medicineLines =
    medicines.length > 0
      ? medicines
          .map((medicine, index) => {
            return [
              `${index + 1}. ${getMedicineName(medicine)}`,
              `   Dosage: ${safeText(medicine.dosage, "Not added")}`,
              `   Duration: ${safeText(medicine.duration, "Not added")}`,
              `   Instruction: ${getMedicineInstruction(medicine)}`
            ].join("\n");
          })
          .join("\n\n")
      : "No medicines added.";

  const followUpLines =
    followUps.length > 0
      ? followUps
          .map((followUp, index) => {
            return `${index + 1}. ${safeText(
              followUp.task,
              "Follow-up consultation"
            )} - ${formatDate(followUp.date || followUp.followUpDate)} - ${safeText(
              followUp.status,
              "Scheduled"
            )}`;
          })
          .join("\n")
      : "No follow-up scheduled.";

  return [
    "Sucura PRESCRIPTION SUMMARY",
    "================================",
    "",
    `Prescription ID: ${safeText(prescription?.prescriptionId || prescription?.id)}`,
    `Date: ${formatDate(prescription?.date || prescription?.prescriptionDate)}`,
    `Status: ${safeText(prescription?.status)}`,
    "",
    "DOCTOR DETAILS",
    "--------------",
    `Doctor: ${safeText(prescription?.doctorName)}`,
    `Specialization: ${safeText(prescription?.specialization, "General Physician")}`,
    `Clinic: ${safeText(prescription?.clinicName || prescription?.clinic)}`,
    `Location: ${safeText(prescription?.location)}`,
    "",
    "DIAGNOSIS",
    "---------",
    safeText(prescription?.diagnosis),
    "",
    "SYMPTOMS",
    "--------",
    safeText(prescription?.symptoms, "No symptoms added."),
    "",
    "TREATMENT PLAN",
    "--------------",
    safeText(prescription?.treatmentPlan, "No treatment plan added."),
    "",
    "PATIENT INSTRUCTIONS",
    "--------------------",
    safeText(
      prescription?.patientInstructions || prescription?.clinicalNotes,
      "No patient instructions added."
    ),
    "",
    "MEDICINES",
    "---------",
    medicineLines,
    "",
    "FOLLOW-UP",
    "---------",
    followUpLines,
    "",
    "Generated from Sucura."
  ].join("\n");
};

const copyTextToClipboard = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "-9999px";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Copy failed");
  }
};

const sanitizePdfFileName = (value, fallback = "prescription") => {
  const cleaned = safeText(value, fallback)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || fallback;
};

const ensurePdfSpace = (doc, y, requiredHeight = 24) => {
  if (y + requiredHeight > 278) {
    doc.addPage();
    return 18;
  }

  return y;
};

const addPdfWrappedText = (
  doc,
  text,
  x,
  y,
  maxWidth,
  {
    fontSize = 10,
    lineHeight = 5.3,
    fontStyle = "normal",
    color = [16, 32, 51]
  } = {}
) => {
  doc.setFont("helvetica", fontStyle);
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);

  const lines = doc.splitTextToSize(safeText(text, ""), maxWidth);

  lines.forEach((line) => {
    y = ensurePdfSpace(doc, y, 10);
    doc.text(line, x, y);
    y += lineHeight;
  });

  return y;
};

const addPdfSection = (doc, title, content, y) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const left = 16;
  const boxWidth = pageWidth - 32;
  const bodyLines = doc.splitTextToSize(
    safeText(content, "Not available"),
    boxWidth - 10
  );
  const boxHeight = Math.max(28, 14 + bodyLines.length * 5.4 + 8);

  y = ensurePdfSpace(doc, y, boxHeight + 6);

  doc.setDrawColor(222, 231, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(left, y, boxWidth, boxHeight, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 118, 110);
  doc.text(title.toUpperCase(), left + 5, y + 8);

  let textY = y + 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(16, 32, 51);

  bodyLines.forEach((line) => {
    doc.text(line, left + 5, textY);
    textY += 5.4;
  });

  return y + boxHeight + 8;
};

const addPdfMedicineRow = (doc, medicine, index, y) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const left = 16;
  const boxWidth = pageWidth - 32;
  const instructionLines = doc.splitTextToSize(
    getMedicineInstruction(medicine),
    boxWidth - 72
  );
  const boxHeight = Math.max(25, 16 + instructionLines.length * 5.2);

  y = ensurePdfSpace(doc, y, boxHeight + 6);

  doc.setDrawColor(222, 231, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(left, y, boxWidth, boxHeight, 3, 3, "FD");

  doc.setFillColor(233, 248, 245);
  doc.circle(left + 8, y + 10, 4.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 118, 110);
  doc.text(String(index + 1), left + 6.8, y + 12);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(16, 32, 51);
  doc.text(getMedicineName(medicine), left + 18, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(82, 98, 122);

  let instructionY = y + 15;

  instructionLines.forEach((line) => {
    doc.text(line, left + 18, instructionY);
    instructionY += 5.2;
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(16, 32, 51);
  doc.text(safeText(medicine.dosage, "Dosage"), pageWidth - 55, y + 9);
  doc.text(safeText(medicine.duration, "Duration"), pageWidth - 55, y + 17);

  return y + boxHeight + 7;
};

const addPdfFooter = (doc) => {
  const totalPages = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);

    doc.setDrawColor(222, 231, 240);
    doc.line(16, 284, pageWidth - 16, 284);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(123, 135, 152);
    doc.text("This is a patient copy generated from Sucura.", 16, 290);
    doc.text(`Page ${page} of ${totalPages}`, pageWidth - 34, 290);
  }
};

const downloadPrescriptionPdf = (prescription, activeProfileName) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const left = 16;
  let y = 18;

  const medicines = Array.isArray(prescription?.medicines)
    ? prescription.medicines
    : [];

  const followUps = Array.isArray(prescription?.followUps)
    ? prescription.followUps
    : [];

  doc.setFillColor(15, 118, 110);
  doc.rect(0, 0, pageWidth, 34, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("Sucura Prescription", left, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Patient copy generated from Sucura", left, 23);

  y = 46;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(16, 32, 51);
  doc.text(safeText(prescription?.diagnosis, "Prescription"), left, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(82, 98, 122);

  const doctorLine = `${safeText(prescription?.doctorName)} - ${safeText(
    prescription?.specialization,
    "General Physician"
  )}`;
  doc.text(doctorLine, left, y + 7);

  const statusText = safeText(prescription?.status, "Active");

  doc.setFillColor(220, 252, 231);
  doc.roundedRect(pageWidth - 48, y - 8, 32, 10, 5, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(22, 101, 52);
  doc.text(statusText, pageWidth - 40, y - 1.5);

  y += 18;

  doc.setDrawColor(222, 231, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(left, y, pageWidth - 32, 42, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(16, 32, 51);
  doc.text("Prescription Details", left + 5, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(82, 98, 122);

  doc.text(
    `Prescription ID: ${safeText(prescription?.prescriptionId || prescription?.id)}`,
    left + 5,
    y + 17
  );

  doc.text(
    `Date: ${formatDate(prescription?.date || prescription?.prescriptionDate)}`,
    left + 5,
    y + 25
  );

  doc.text(
    `Patient: ${safeText(activeProfileName, "Selected patient")}`,
    left + 5,
    y + 33
  );

  const clinicLines = doc.splitTextToSize(
    `Clinic: ${safeText(prescription?.clinicName || prescription?.clinic)}`,
    78
  );

  const locationLines = doc.splitTextToSize(
    `Location: ${safeText(prescription?.location)}`,
    78
  );

  clinicLines.slice(0, 2).forEach((line, index) => {
    doc.text(line, pageWidth / 2, y + 17 + index * 6);
  });

  locationLines.slice(0, 2).forEach((line, index) => {
    doc.text(line, pageWidth / 2, y + 30 + index * 6);
  });

  y += 52;

  y = addPdfSection(
    doc,
    "Symptoms",
    safeText(prescription?.symptoms, "No symptoms added."),
    y
  );

  y = addPdfSection(
    doc,
    "Treatment Plan",
    safeText(prescription?.treatmentPlan, "No treatment plan added."),
    y
  );

  y = addPdfSection(
    doc,
    "Patient Instructions",
    safeText(
      prescription?.patientInstructions || prescription?.clinicalNotes,
      "No patient instructions added."
    ),
    y
  );

  y = ensurePdfSpace(doc, y, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(16, 32, 51);
  doc.text("Medicines", left, y);
  y += 9;

  if (medicines.length === 0) {
    y = addPdfWrappedText(doc, "No medicines added.", left, y, pageWidth - 32);
    y += 5;
  } else {
    medicines.forEach((medicine, index) => {
      y = addPdfMedicineRow(doc, medicine, index, y);
    });
  }

  y = ensurePdfSpace(doc, y, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(16, 32, 51);
  doc.text("Follow-up", left, y);
  y += 9;

  if (followUps.length === 0) {
    y = addPdfWrappedText(
      doc,
      "No follow-up scheduled.",
      left,
      y,
      pageWidth - 32
    );
  } else {
    followUps.forEach((followUp) => {
      y = ensurePdfSpace(doc, y, 25);

      doc.setDrawColor(222, 231, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(left, y, pageWidth - 32, 21, 3, 3, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(16, 32, 51);
      doc.text(
        safeText(followUp.task, "Follow-up consultation"),
        left + 5,
        y + 8
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(82, 98, 122);
      doc.text(
        formatDate(followUp.date || followUp.followUpDate),
        left + 5,
        y + 15
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 118, 110);
      doc.text(
        safeText(followUp.status, "Scheduled"),
        pageWidth - 45,
        y + 12
      );

      y += 27;
    });
  }

  addPdfFooter(doc);

  const fileName = `prescription-${safeText(
    prescription?.prescriptionId || prescription?.id,
    Date.now()
  )}-${sanitizePdfFileName(prescription?.diagnosis)}.pdf`;

  doc.save(fileName);
};

const Prescriptions = () => {
  const profileContext = useProfile();
  const selectedProfile = profileContext?.selectedProfile || null;

  const [prescriptions, setPrescriptions] = useState([]);
  const [summary, setSummary] = useState({
    totalCount: 0,
    activeCount: 0,
    pastCount: 0
  });

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailsLoadingId, setDetailsLoadingId] = useState(null);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  const profileId = useMemo(() => getProfileId(selectedProfile), [selectedProfile]);
  const profileType = useMemo(() => getProfileType(selectedProfile), [selectedProfile]);
  const profileName = useMemo(
    () => getProfileName(selectedProfile),
    [selectedProfile]
  );

  const showToast = useCallback((message) => {
    setToast(message);

    window.setTimeout(() => {
      setToast("");
    }, 2600);
  }, []);

  const loadPrescriptions = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const data = await getPatientPrescriptions({
          profileId,
          profileType
        });

        const list = Array.isArray(data?.prescriptions)
          ? data.prescriptions
          : [];

        setPrescriptions(list);

        setSummary({
          totalCount: data?.totalCount ?? list.length,
          activeCount:
            data?.activeCount ??
            list.filter((item) => normalizeStatus(item.status) === "ACTIVE")
              .length,
          pastCount:
            data?.pastCount ??
            list.filter((item) => normalizeStatus(item.status) === "PAST")
              .length
        });
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load prescriptions. Please try again.";

        setPrescriptions([]);
        setSummary({
          totalCount: 0,
          activeCount: 0,
          pastCount: 0
        });
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [profileId, profileType]
  );

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  const filteredPrescriptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return prescriptions.filter((prescription) => {
      const status = normalizeStatus(prescription.status);
      const statusMatched = filter === "ALL" || status === filter;

      if (!statusMatched) {
        return false;
      }

      if (!query) {
        return true;
      }

      const medicines = Array.isArray(prescription.medicines)
        ? prescription.medicines
        : [];

      const medicineMatched = medicines.some((medicine) => {
        return [
          medicine.name,
          medicine.medicineName,
          medicine.dosage,
          medicine.duration,
          medicine.instruction,
          medicine.timing,
          medicine.info
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      });

      const normalFields = [
        prescription.doctorName,
        prescription.specialization,
        prescription.clinic,
        prescription.clinicName,
        prescription.location,
        prescription.diagnosis,
        prescription.symptoms,
        prescription.treatmentPlan,
        prescription.clinicalNotes,
        prescription.patientInstructions,
        prescription.date
      ];

      return (
        medicineMatched ||
        normalFields
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      );
    });
  }, [filter, prescriptions, search]);

  const latestPrescription = useMemo(() => {
    return (
      prescriptions.find((item) => normalizeStatus(item.status) === "ACTIVE") ||
      prescriptions[0] ||
      null
    );
  }, [prescriptions]);

  const hasSearchOrFilter = search.trim() || filter !== "ALL";

  const handleRefresh = () => {
    loadPrescriptions({ silent: true });
  };

  const handleViewDetails = async (prescription) => {
    const prescriptionId = prescription.prescriptionId || prescription.id;

    setSelectedPrescription(prescription);

    if (!prescriptionId) {
      return;
    }

    try {
      setDetailsLoadingId(prescriptionId);

      const details = await getPatientPrescriptionById(prescriptionId);
      setSelectedPrescription(details);
    } catch {
      showToast("Latest details could not be loaded. Showing available data.");
    } finally {
      setDetailsLoadingId(null);
    }
  };

  const handleCopySummary = async (prescription) => {
    try {
      await copyTextToClipboard(buildCopyText(prescription));
      showToast("Prescription summary copied.");
    } catch {
      showToast("Unable to copy prescription summary.");
    }
  };

  const handlePdfClick = (prescription) => {
    try {
      downloadPrescriptionPdf(prescription, profileName);
      showToast("PDF downloaded.");
    } catch {
      showToast("Unable to download PDF.");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setFilter("ALL");
  };

  return (
    <div className="rxp-page">
      <div className="rxp-shell">
        <section className="rxp-title-card">
          <div className="rxp-title-left">
            <span className="rxp-kicker">Medical vault</span>
            <h1>Prescriptions</h1>
            <p>
              Doctor-created prescriptions, medicines, treatment advice and
              follow-up details in one place.
            </p>

            <div className="rxp-profile-row">
              <span className="rxp-profile-chip">{profileName}</span>
              {profileType && <span className="rxp-soft-chip">{profileType}</span>}
              {profileId && (
                <span className="rxp-soft-chip">Profile ID: {profileId}</span>
              )}
            </div>
          </div>

          <button
            type="button"
            className="rxp-refresh-btn"
            onClick={handleRefresh}
            disabled={loading || refreshing}
          >
            <FiRefreshCw className={refreshing ? "rxp-spin" : ""} />
            <span>{refreshing ? "Refreshing" : "Refresh"}</span>
          </button>
        </section>

        <section className="rxp-stats-grid">
          <article className="rxp-stat-card">
            <span>Total prescriptions</span>
            <strong>{summary.totalCount}</strong>
          </article>

          <article className="rxp-stat-card">
            <span>Active</span>
            <strong>{summary.activeCount}</strong>
          </article>

          <article className="rxp-stat-card">
            <span>Past</span>
            <strong>{summary.pastCount}</strong>
          </article>
        </section>

        <section className="rxp-toolbar">
          <div className="rxp-search-box">
            <FiSearch />
            <input
              type="text"
              value={search}
              placeholder="Search by diagnosis, doctor, clinic or medicine"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="rxp-filter-row">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={
                  filter === item.value
                    ? "rxp-filter-btn rxp-filter-active"
                    : "rxp-filter-btn"
                }
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <section className="rxp-state-card">
            <div className="rxp-loader" />
            <h2>Loading prescriptions</h2>
            <p>Please wait while we fetch prescription records.</p>
          </section>
        ) : error ? (
          <section className="rxp-state-card rxp-error-card">
            <FiAlertCircle />
            <h2>Unable to load prescriptions</h2>
            <p>{error}</p>
            <button type="button" onClick={() => loadPrescriptions()}>
              Try again
            </button>
          </section>
        ) : (
          <>
            {latestPrescription && (
              <section className="rxp-latest-card">
                <div>
                  <span className="rxp-kicker">Latest prescription</span>
                  <h2>{safeText(latestPrescription.diagnosis, "Prescription")}</h2>
                  <p>
                    {safeText(latestPrescription.doctorName)} •{" "}
                    {safeText(
                      latestPrescription.specialization,
                      "General Physician"
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  className="rxp-outline-btn"
                  onClick={() => handleViewDetails(latestPrescription)}
                >
                  <FiEye />
                  <span>View latest</span>
                </button>
              </section>
            )}

            <section className="rxp-list-head">
              <div>
                <h2>Prescription history</h2>
                <p>
                  Showing {filteredPrescriptions.length} of{" "}
                  {prescriptions.length} prescriptions.
                </p>
              </div>

              {hasSearchOrFilter && (
                <button
                  type="button"
                  className="rxp-clear-btn"
                  onClick={resetFilters}
                >
                  Clear filters
                </button>
              )}
            </section>

            {filteredPrescriptions.length === 0 ? (
              <section className="rxp-state-card">
                <FiFileText />
                <h2>No prescriptions found</h2>
                <p>
                  {hasSearchOrFilter
                    ? "Try changing your search or selected filter."
                    : "No prescription has been added for this profile yet."}
                </p>
              </section>
            ) : (
              <section className="rxp-card-grid">
                {filteredPrescriptions.map((prescription) => {
                  const prescriptionId =
                    prescription.prescriptionId || prescription.id;

                  const status = normalizeStatus(prescription.status);

                  const medicines = Array.isArray(prescription.medicines)
                    ? prescription.medicines
                    : [];

                  return (
                    <article className="rxp-prescription-card" key={prescriptionId}>
                      <div className="rxp-card-header">
                        <div>
                          <h3>
                            {safeText(prescription.diagnosis, "Prescription")}
                          </h3>
                          <p>
                            {safeText(prescription.doctorName)} •{" "}
                            {safeText(
                              prescription.specialization,
                              "General Physician"
                            )}
                          </p>
                        </div>

                        <span
                          className={
                            status === "ACTIVE"
                              ? "rxp-status rxp-status-active"
                              : "rxp-status rxp-status-past"
                          }
                        >
                          {safeText(prescription.status)}
                        </span>
                      </div>

                      <div className="rxp-meta-row">
                        <span>
                          <FiCalendar />
                          {formatDate(
                            prescription.date || prescription.prescriptionDate
                          )}
                        </span>

                        <span>
                          <FiMapPin />
                          {safeText(
                            prescription.clinicName || prescription.clinic
                          )}
                        </span>
                      </div>

                      <div className="rxp-info-box">
                        <span>Symptoms</span>
                        <p>
                          {safeText(
                            prescription.symptoms,
                            "No symptoms added."
                          )}
                        </p>
                      </div>

                      <div className="rxp-medicine-block">
                        <div className="rxp-medicine-title">
                          <FiPackage />
                          <span>
                            {medicines.length} medicine
                            {medicines.length === 1 ? "" : "s"}
                          </span>
                        </div>

                        {medicines.length > 0 ? (
                          medicines.slice(0, 2).map((medicine, index) => (
                            <div
                              className="rxp-medicine-preview"
                              key={medicine.id || index}
                            >
                              <strong>{getMedicineName(medicine)}</strong>
                              <span>
                                {safeText(medicine.dosage, "Dosage")} •{" "}
                                {safeText(medicine.duration, "Duration")}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="rxp-empty-small">
                            No medicines added.
                          </p>
                        )}
                      </div>

                      <div className="rxp-action-row">
                        <button
                          type="button"
                          className="rxp-primary-btn"
                          onClick={() => handleViewDetails(prescription)}
                        >
                          <FiEye />
                          <span>
                            {detailsLoadingId === prescriptionId
                              ? "Opening..."
                              : "View details"}
                          </span>
                        </button>

                        <button
                          type="button"
                          className="rxp-secondary-btn"
                          onClick={() => handleCopySummary(prescription)}
                        >
                          <FiClipboard />
                          <span>Copy</span>
                        </button>

                        <button
                          type="button"
                          className="rxp-secondary-btn"
                          onClick={() => handlePdfClick(prescription)}
                        >
                          <FiFileText />
                          <span>PDF</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </>
        )}
      </div>

      {selectedPrescription && (
        <div
          className="rxp-modal-backdrop"
          onClick={() => setSelectedPrescription(null)}
        >
          <section
            className="rxp-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="rxp-modal-header">
              <div>
                <span className="rxp-kicker">Prescription details</span>
                <h2>{safeText(selectedPrescription.diagnosis, "Prescription")}</h2>
                <p>
                  {safeText(selectedPrescription.doctorName)} •{" "}
                  {safeText(
                    selectedPrescription.specialization,
                    "General Physician"
                  )}
                </p>
              </div>

              <button
                type="button"
                className="rxp-modal-close"
                aria-label="Close prescription details"
                onClick={() => setSelectedPrescription(null)}
              >
                <FiX />
              </button>
            </header>

            <div className="rxp-modal-body">
              <div className="rxp-detail-grid">
                <div>
                  <span>Date</span>
                  <strong>
                    {formatDate(
                      selectedPrescription.date ||
                        selectedPrescription.prescriptionDate
                    )}
                  </strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>{safeText(selectedPrescription.status)}</strong>
                </div>

                <div>
                  <span>Clinic</span>
                  <strong>
                    {safeText(
                      selectedPrescription.clinicName ||
                        selectedPrescription.clinic
                    )}
                  </strong>
                </div>

                <div>
                  <span>Medicines</span>
                  <strong>
                    {Array.isArray(selectedPrescription.medicines)
                      ? selectedPrescription.medicines.length
                      : 0}
                  </strong>
                </div>
              </div>

              <section className="rxp-modal-section">
                <h3>Symptoms</h3>
                <p>
                  {safeText(
                    selectedPrescription.symptoms,
                    "No symptoms added."
                  )}
                </p>
              </section>

              <section className="rxp-modal-section">
                <h3>Treatment plan</h3>
                <p>
                  {safeText(
                    selectedPrescription.treatmentPlan,
                    "No treatment plan added."
                  )}
                </p>
              </section>

              <section className="rxp-modal-section">
                <h3>Patient instructions</h3>
                <p>
                  {safeText(
                    selectedPrescription.patientInstructions ||
                      selectedPrescription.clinicalNotes,
                    "No patient instructions added."
                  )}
                </p>
              </section>

              <section className="rxp-modal-section">
                <h3>Medicines</h3>

                {Array.isArray(selectedPrescription.medicines) &&
                selectedPrescription.medicines.length > 0 ? (
                  <div className="rxp-medicine-list">
                    {selectedPrescription.medicines.map((medicine, index) => (
                      <div
                        className="rxp-medicine-row"
                        key={medicine.id || index}
                      >
                        <span className="rxp-medicine-number">{index + 1}</span>

                        <div className="rxp-medicine-main">
                          <strong>{getMedicineName(medicine)}</strong>
                          <p>{getMedicineInstruction(medicine)}</p>
                        </div>

                        <div className="rxp-medicine-tags">
                          <span>{safeText(medicine.dosage, "Dosage")}</span>
                          <span>{safeText(medicine.duration, "Duration")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No medicines added.</p>
                )}
              </section>

              <section className="rxp-modal-section">
                <h3>Follow-up</h3>

                {Array.isArray(selectedPrescription.followUps) &&
                selectedPrescription.followUps.length > 0 ? (
                  <div className="rxp-followup-list">
                    {selectedPrescription.followUps.map((followUp, index) => (
                      <div className="rxp-followup-row" key={index}>
                        <div>
                          <strong>
                            {safeText(
                              followUp.task,
                              "Follow-up consultation"
                            )}
                          </strong>
                          <span>
                            {formatDate(
                              followUp.date || followUp.followUpDate
                            )}
                          </span>
                        </div>

                        <em>{safeText(followUp.status, "Scheduled")}</em>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No follow-up scheduled.</p>
                )}
              </section>

              <div className="rxp-record-row">
                <span>
                  Prescription ID:{" "}
                  {selectedPrescription.prescriptionId ||
                    selectedPrescription.id}
                </span>

                {selectedPrescription.doctorPatientVisitId && (
                  <span>Visit ID: {selectedPrescription.doctorPatientVisitId}</span>
                )}

                {selectedPrescription.patientPublicAppointmentId && (
                  <span>
                    Appointment ID:{" "}
                    {selectedPrescription.patientPublicAppointmentId}
                  </span>
                )}
              </div>
            </div>

            <footer className="rxp-modal-footer">
              <button
                type="button"
                className="rxp-secondary-btn"
                onClick={() => handleCopySummary(selectedPrescription)}
              >
                <FiClipboard />
                <span>Copy summary</span>
              </button>

              <button
                type="button"
                className="rxp-secondary-btn"
                onClick={() => handlePdfClick(selectedPrescription)}
              >
                <FiFileText />
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                className="rxp-primary-btn"
                onClick={() => setSelectedPrescription(null)}
              >
                Done
              </button>
            </footer>
          </section>
        </div>
      )}

      {toast && (
        <div className="rxp-toast">
          <FiCheckCircle />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};

export default Prescriptions;