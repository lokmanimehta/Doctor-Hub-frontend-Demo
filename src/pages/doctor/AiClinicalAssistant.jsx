import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FiActivity,
  FiAlertTriangle,
  FiCalendar,
  FiCheck,
  FiClipboard,
  FiClock,
  FiCpu,
  FiEdit3,
  FiFileText,
  FiMic,
  FiMicOff,
  FiRefreshCw,
  FiSend,
  FiShield,
  FiUploadCloud,
  FiUser,
  FiX
} from "react-icons/fi";
import "./AiClinicalAssistant.css";

const AI_ACTIONS = [
  {
    id: "summary",
    title: "Patient Summary",
    description: "Review history, consultations and clinical risk indicators.",
    icon: FiActivity
  },
  {
    id: "prescription",
    title: "Prescription Draft",
    description: "Prepare a doctor-reviewable prescription suggestion.",
    icon: FiClipboard
  },
  {
    id: "appointment",
    title: "Book Appointment",
    description: "Prepare a follow-up appointment draft for this patient.",
    icon: FiCalendar
  },
  {
    id: "visit",
    title: "Create Visit",
    description: "Prepare a structured consultation record.",
    icon: FiUser
  },
  {
    id: "note",
    title: "Doctor Note",
    description: "Convert an instruction into a private clinical note.",
    icon: FiEdit3
  },
  {
    id: "report",
    title: "Medical Report",
    description: "Prepare report metadata before uploading the document.",
    icon: FiUploadCloud
  }
];

const DEMO_MEDICINES = [
  {
    id: "medicine-paracetamol",
    medicineName: "Paracetamol 500 mg",
    dosage: "1 tablet when required",
    duration: "Up to 3 days",
    instruction: "Take after food",
    reason:
      "Demo suggestion for symptomatic fever or body-pain support. Doctor verification is required."
  },
  {
    id: "medicine-cetirizine",
    medicineName: "Cetirizine 10 mg",
    dosage: "1 tablet once daily",
    duration: "3 days",
    instruction: "Preferably at night",
    reason:
      "Demo suggestion for allergy-like symptoms. Review sedation risk and patient history."
  },
  {
    id: "medicine-ors",
    medicineName: "Oral Rehydration Solution",
    dosage: "As clinically required",
    duration: "During symptomatic period",
    instruction: "Use according to product directions",
    reason:
      "Demo supportive-care suggestion where oral hydration may be clinically appropriate."
  }
];

const REPORT_TYPES = [
  { value: "BLOOD_TEST", label: "Blood Test" },
  { value: "X_RAY", label: "X-Ray" },
  { value: "MRI", label: "MRI" },
  { value: "CT_SCAN", label: "CT Scan" },
  { value: "ECG", label: "ECG" },
  { value: "ULTRASOUND", label: "Ultrasound" },
  { value: "OTHER", label: "Other" }
];

const delay = (milliseconds) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });

const getDateInputValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDateTimeInputValue = (date = new Date()) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${getDateInputValue(date)}T${hours}:${minutes}`;
};

const getTomorrowDateValue = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getDateInputValue(tomorrow);
};

const normalizeText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const hasMeaningfulValue = (value) => {
  const normalizedValue = normalizeText(value).toLowerCase();

  return Boolean(
    normalizedValue &&
      normalizedValue !== "n/a" &&
      normalizedValue !== "none" &&
      normalizedValue !== "not available"
  );
};

const formatClinicalDate = (value, includeTime = false) => {
  if (!value) return "Date unavailable";

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  if (includeTime) {
    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const AiClinicalAssistant = ({
  patient,
  visits = [],
  prescriptions = [],
  reports = [],
  appointments = [],
  doctorNotes = [],
  backendAiEnabled = false,
  onOpenPrescription,
  onOpenAppointment,
  onOpenVisit,
  onOpenDoctorNote,
  onOpenReport
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAction, setActiveAction] = useState("overview");

  const [command, setCommand] = useState("");
  const [commandMessage, setCommandMessage] = useState("");

  const [generationState, setGenerationState] = useState("idle");
  const [generationMessage, setGenerationMessage] = useState("");
  const [summaryGeneratedAt, setSummaryGeneratedAt] = useState(null);

  const [isListening, setIsListening] = useState(false);

  const [prescriptionForm, setPrescriptionForm] = useState(() => ({
    symptoms: patient?.symptoms || "",
    duration: "",
    vitals: "",
    examinationFindings: "",
    provisionalDiagnosis: "",
    additionalNotes: ""
  }));

  const [selectedMedicineIds, setSelectedMedicineIds] = useState([]);

  const [appointmentForm, setAppointmentForm] = useState(() => ({
    appointmentDate: getTomorrowDateValue(),
    appointmentTime: "10:00",
    reason: "Follow-up consultation",
    notes: ""
  }));

  const [visitForm, setVisitForm] = useState(() => ({
    visitDate: getDateTimeInputValue(),
    chiefComplaint: patient?.symptoms || "",
    doctorNotes: ""
  }));

  const [noteForm, setNoteForm] = useState({
    title: "Clinical follow-up note",
    content: ""
  });

  const [reportForm, setReportForm] = useState(() => ({
    reportName: "",
    reportType: "BLOOD_TEST",
    reportDate: getDateInputValue(),
    labName: "",
    notes: ""
  }));

  const recognitionRef = useRef(null);
  const simulationIdRef = useRef(0);

  const voiceSupported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const patientName = patient?.fullName || "Selected Patient";

  const recordCounts = useMemo(
    () => [
      { label: "Visits", value: visits.length },
      { label: "Prescriptions", value: prescriptions.length },
      { label: "Reports", value: reports.length },
      { label: "Appointments", value: appointments.length }
    ],
    [
      appointments.length,
      prescriptions.length,
      reports.length,
      visits.length
    ]
  );

  const clinicalSummary = useMemo(() => {
    const latestVisit = visits[0] || null;
    const latestPrescription = prescriptions[0] || null;
    const latestReport = reports[0] || null;
    const latestAppointment = appointments[0] || null;
    const latestDoctorNote = doctorNotes[0] || null;

    const timeline = [];

    if (latestVisit) {
      timeline.push({
        id: `visit-${latestVisit.id || "latest"}`,
        label: "Latest Consultation",
        value:
          latestVisit.chiefComplaint ||
          "Consultation record is available.",
        date: formatClinicalDate(latestVisit.visitDate, true)
      });
    }

    if (latestPrescription) {
      timeline.push({
        id: `prescription-${latestPrescription.id || "latest"}`,
        label: "Latest Prescription",
        value:
          latestPrescription.diagnosis ||
          "Prescription record is available.",
        date: formatClinicalDate(
          latestPrescription.prescriptionDate,
          false
        )
      });
    }

    if (latestReport) {
      timeline.push({
        id: `report-${latestReport.id || "latest"}`,
        label: "Latest Medical Report",
        value:
          latestReport.reportName ||
          "Medical report record is available.",
        date: formatClinicalDate(latestReport.reportDate, false)
      });
    }

    if (latestAppointment) {
      timeline.push({
        id: `appointment-${latestAppointment.id || "latest"}`,
        label: "Latest Appointment",
        value:
          latestAppointment.status ||
          "Appointment record is available.",
        date: formatClinicalDate(
          latestAppointment.appointmentDateTime,
          true
        )
      });
    }

    if (latestDoctorNote) {
      timeline.push({
        id: `note-${latestDoctorNote.id || "latest"}`,
        label: "Latest Doctor Note",
        value:
          latestDoctorNote.title ||
          "Doctor note record is available.",
        date: formatClinicalDate(
          latestDoctorNote.updatedAt ||
            latestDoctorNote.createdAt,
          true
        )
      });
    }

    const reviewIndicators = [];

    if (patient?.isCritical) {
      reviewIndicators.push("Patient is marked as critical.");
    }

    if (hasMeaningfulValue(patient?.allergies)) {
      reviewIndicators.push(
        `Allergy review required: ${normalizeText(
          patient.allergies
        )}`
      );
    } else {
      reviewIndicators.push(
        "Allergy information has not been recorded."
      );
    }

    if (hasMeaningfulValue(patient?.chronicConditions)) {
      reviewIndicators.push(
        `Chronic conditions: ${normalizeText(
          patient.chronicConditions
        )}`
      );
    }

    if (!hasMeaningfulValue(patient?.medications)) {
      reviewIndicators.push(
        "Current medication reconciliation is incomplete."
      );
    }

    if (reports.length === 0) {
      reviewIndicators.push(
        "No medical reports are available in the current record."
      );
    }

    const demographicParts = [
      patient?.age !== null && patient?.age !== undefined
        ? `${patient.age} years`
        : "Age unavailable",
      patient?.gender || "Gender unavailable",
      patient?.bloodGroup
        ? `Blood group ${patient.bloodGroup}`
        : "Blood group unavailable"
    ];

    return {
      demographicText: demographicParts.join(" • "),
      medicalHistory: hasMeaningfulValue(patient?.medicalHistory)
        ? normalizeText(patient.medicalHistory)
        : "No detailed medical history has been recorded.",
      allergies: hasMeaningfulValue(patient?.allergies)
        ? normalizeText(patient.allergies)
        : "Not recorded",
      chronicConditions: hasMeaningfulValue(
        patient?.chronicConditions
      )
        ? normalizeText(patient.chronicConditions)
        : "Not recorded",
      currentMedicines: hasMeaningfulValue(patient?.medications)
        ? normalizeText(patient.medications)
        : "Not recorded",
      timeline,
      reviewIndicators,
      followUpMessage:
        appointments.length > 0
          ? "Review the latest appointment status before creating another follow-up."
          : "No appointment is present in the currently loaded timeline."
    };
  }, [
    appointments,
    doctorNotes,
    patient,
    prescriptions,
    reports,
    visits
  ]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (
        event.key === "Escape" &&
        generationState !== "generating"
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [generationState, isOpen]);

  useEffect(() => {
    if (!voiceSupported || typeof window === "undefined") {
      return undefined;
    }

    const SpeechRecognitionApi =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognitionApi) return undefined;

    const recognition = new SpeechRecognitionApi();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onstart = () => {
      setIsListening(true);
      setCommandMessage("");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setCommandMessage(
        "Voice input could not be captured. Please type the command."
      );
    };

    recognition.onresult = (event) => {
      let transcript = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        transcript += event.results[index][0].transcript;
      }

      setCommand(transcript.trim());
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current = null;

      try {
        recognition.stop();
      } catch {
        // Recognition may already be stopped.
      }
    };
  }, [voiceSupported]);

  const resetGenerationState = () => {
    simulationIdRef.current += 1;
    setGenerationState("idle");
    setGenerationMessage("");
  };

  const runSimulation = async (messages) => {
    const currentSimulationId =
      simulationIdRef.current + 1;

    simulationIdRef.current = currentSimulationId;
    setGenerationState("generating");

    for (const message of messages) {
      if (
        simulationIdRef.current !== currentSimulationId
      ) {
        return false;
      }

      setGenerationMessage(message);
      await delay(430);
    }

    if (
      simulationIdRef.current !== currentSimulationId
    ) {
      return false;
    }

    setGenerationState("ready");
    setGenerationMessage(
      "Draft prepared for doctor verification."
    );

    return true;
  };

  const handleOpen = () => {
    const patientSymptoms = patient?.symptoms || "";

    setPrescriptionForm((previous) => ({
      ...previous,
      symptoms:
        previous.symptoms || patientSymptoms
    }));

    setVisitForm((previous) => ({
      ...previous,
      chiefComplaint:
        previous.chiefComplaint || patientSymptoms
    }));

    setCommand("");
    setCommandMessage("");
    setActiveAction("overview");
    resetGenerationState();
    setIsOpen(true);
  };

  const handleClose = () => {
    if (generationState === "generating") return;

    simulationIdRef.current += 1;
    setIsOpen(false);
  };

  const handleSelectAction = (actionId) => {
    setActiveAction(actionId);
    setCommandMessage("");
    resetGenerationState();
  };

  const startVoiceInput = () => {
    if (!recognitionRef.current) {
      setCommandMessage(
        "Voice input is not supported in this browser."
      );
      return;
    }

    try {
      recognitionRef.current.start();
    } catch {
      setCommandMessage(
        "Voice recognition is already active or temporarily unavailable."
      );
    }
  };

  const stopVoiceInput = () => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
    } catch {
      // Recognition may already be stopped.
    }
  };

  const handleGenerateSummary = async () => {
    const completed = await runSimulation([
      "Reviewing patient profile...",
      "Reviewing previous consultations...",
      "Checking prescriptions and reports...",
      "Preparing clinical review indicators..."
    ]);

    if (completed) {
      setSummaryGeneratedAt(new Date());
    }
  };

  const handleGeneratePrescription = async () => {
    if (!prescriptionForm.symptoms.trim()) {
      setCommandMessage(
        "Enter the patient's current symptoms before generating suggestions."
      );
      return;
    }

    const completed = await runSimulation([
      "Reviewing current symptoms...",
      "Checking recorded allergies...",
      "Checking current medicines...",
      "Preparing doctor-reviewable suggestions..."
    ]);

    if (!completed) return;

    setSelectedMedicineIds(
      DEMO_MEDICINES.map((medicine) => medicine.id)
    );
  };

  const toggleMedicineSelection = (medicineId) => {
    setSelectedMedicineIds((previous) => {
      if (previous.includes(medicineId)) {
        return previous.filter(
          (selectedId) => selectedId !== medicineId
        );
      }

      return [...previous, medicineId];
    });
  };

  const handleApplyPrescription = () => {
    const selectedMedicines = DEMO_MEDICINES.filter(
      (medicine) =>
        selectedMedicineIds.includes(medicine.id)
    ).map((medicine) => ({
      medicineName: medicine.medicineName,
      dosage: medicine.dosage,
      duration: medicine.duration,
      instruction: medicine.instruction
    }));

    onOpenPrescription?.({
      source: "AI_DEMO",
      symptoms: prescriptionForm.symptoms.trim(),
      diagnosis:
        prescriptionForm.provisionalDiagnosis.trim() ||
        "Doctor review required",
      treatmentPlan: [
        prescriptionForm.duration
          ? `Symptom duration: ${prescriptionForm.duration}`
          : "",
        prescriptionForm.vitals
          ? `Vitals: ${prescriptionForm.vitals}`
          : "",
        prescriptionForm.examinationFindings
          ? `Examination findings: ${prescriptionForm.examinationFindings}`
          : ""
      ]
        .filter(Boolean)
        .join("\n"),
      clinicalNotes:
        prescriptionForm.additionalNotes.trim(),
      medicines:
        selectedMedicines.length > 0
          ? selectedMedicines
          : [
              {
                medicineName: "",
                dosage: "",
                duration: "",
                instruction: ""
              }
            ]
    });

    setIsOpen(false);
  };

  const handleApplyAppointment = () => {
    if (
      !appointmentForm.appointmentDate ||
      !appointmentForm.appointmentTime
    ) {
      setCommandMessage(
        "Appointment date and preferred time are required."
      );
      return;
    }

    const appointmentDateTime = new Date(
      `${appointmentForm.appointmentDate}T${appointmentForm.appointmentTime}`
    ).getTime();

    if (Number.isNaN(appointmentDateTime)) {
      setCommandMessage(
        "Please select a valid appointment date and time."
      );
      return;
    }

    onOpenAppointment?.({
      source: "AI_DEMO",
      appointmentDateTime,
      notes: [
        appointmentForm.reason.trim(),
        appointmentForm.notes.trim()
      ]
        .filter(Boolean)
        .join(" — "),
      isCritical: Boolean(patient?.isCritical),
      doctorClinicId:
        patient?.doctorClinicId || null
    });

    setIsOpen(false);
  };

  const handleApplyVisit = () => {
    if (
      !visitForm.visitDate ||
      !visitForm.chiefComplaint.trim()
    ) {
      setCommandMessage(
        "Visit date and chief complaint are required."
      );
      return;
    }

    const visitDate = new Date(
      visitForm.visitDate
    ).getTime();

    if (Number.isNaN(visitDate)) {
      setCommandMessage(
        "Please select a valid visit date and time."
      );
      return;
    }

    onOpenVisit?.({
      source: "AI_DEMO",
      visitDate,
      chiefComplaint:
        visitForm.chiefComplaint.trim(),
      doctorNotes:
        visitForm.doctorNotes.trim() ||
        "AI-prepared visit draft. Doctor verification required."
    });

    setIsOpen(false);
  };

  const handleApplyNote = () => {
    if (
      !noteForm.title.trim() ||
      !noteForm.content.trim()
    ) {
      setCommandMessage(
        "Doctor note title and content are required."
      );
      return;
    }

    onOpenDoctorNote?.({
      source: "AI_DEMO",
      title: noteForm.title.trim(),
      content: noteForm.content.trim()
    });

    setIsOpen(false);
  };

  const handleApplyReport = () => {
    if (!reportForm.reportName.trim()) {
      setCommandMessage("Report name is required.");
      return;
    }

    onOpenReport?.({
      source: "AI_DEMO",
      reportName: reportForm.reportName.trim(),
      reportType: reportForm.reportType,
      reportDate: reportForm.reportDate,
      labName: reportForm.labName.trim(),
      notes: reportForm.notes.trim()
    });

    setIsOpen(false);
  };

  const handleCommandSubmit = (event) => {
    event.preventDefault();

    const normalizedCommand =
      command.trim().toLowerCase();

    if (!normalizedCommand) {
      setCommandMessage(
        "Enter a command for the assistant."
      );
      return;
    }

    if (
      normalizedCommand.includes("summary") ||
      normalizedCommand.includes("summar")
    ) {
      handleSelectAction("summary");
      setCommandMessage(
        "Patient summary workspace opened."
      );
    } else if (
      normalizedCommand.includes("prescription") ||
      normalizedCommand.includes("medicine")
    ) {
      handleSelectAction("prescription");
      setCommandMessage(
        "Prescription drafting workspace opened."
      );
    } else if (
      normalizedCommand.includes("appointment") ||
      normalizedCommand.includes("book")
    ) {
      handleSelectAction("appointment");
      setCommandMessage(
        "Appointment drafting workspace opened."
      );
    } else if (
      normalizedCommand.includes("visit")
    ) {
      handleSelectAction("visit");
      setCommandMessage(
        "Visit drafting workspace opened."
      );
    } else if (
      normalizedCommand.includes("note") ||
      normalizedCommand.includes("remark")
    ) {
      setNoteForm((previous) => ({
        ...previous,
        content: command.trim()
      }));
      handleSelectAction("note");
      setCommandMessage(
        "Doctor-note workspace opened."
      );
    } else if (
      normalizedCommand.includes("report") ||
      normalizedCommand.includes("lab")
    ) {
      handleSelectAction("report");
      setCommandMessage(
        "Medical-report workspace opened."
      );
    } else {
      setCommandMessage(
        "Use a command containing summary, prescription, appointment, visit, note or report."
      );
    }

    setCommand("");
  };

  const renderOverview = () => (
    <div className="aiw-content-stack">
      <div className="aiw-page-heading">
        <div>
          <span className="aiw-eyebrow">
            Patient-specific workspace
          </span>
          <h3>How can Clinical AI assist?</h3>
          <p>
            Choose an action. Every generated result remains a
            draft until the doctor verifies and saves it.
          </p>
        </div>
      </div>

      <div className="aiw-action-grid">
        {AI_ACTIONS.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.id}
              type="button"
              className="aiw-action-card"
              onClick={() =>
                handleSelectAction(action.id)
              }
            >
              <span className="aiw-action-icon">
                <Icon />
              </span>

              <span className="aiw-action-copy">
                <strong>{action.title}</strong>
                <small>{action.description}</small>
              </span>

              <span className="aiw-action-arrow">
                →
              </span>
            </button>
          );
        })}
      </div>

      <div className="aiw-policy-card">
        <FiShield />

        <div>
          <strong>
            Doctor-controlled clinical workflow
          </strong>
          <p>
            This frontend demo never saves generated
            clinical information automatically.
          </p>
        </div>
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="aiw-content-stack">
      <div className="aiw-page-heading aiw-page-heading-actions">
        <div>
          <span className="aiw-eyebrow">
            Clinical overview
          </span>
          <h3>AI Patient Summary</h3>
          <p>
            Prepared from the patient data currently
            loaded in the doctor's workspace.
          </p>
        </div>

        <button
          type="button"
          className="aiw-primary-button"
          onClick={handleGenerateSummary}
          disabled={
            generationState === "generating"
          }
        >
          <FiRefreshCw
            className={
              generationState === "generating"
                ? "aiw-spin"
                : ""
            }
          />

          {generationState === "generating"
            ? "Analysing..."
            : "Generate Summary"}
        </button>
      </div>

      {generationState === "generating" && (
        <div className="aiw-processing-card">
          <span className="aiw-processing-icon">
            <FiCpu />
          </span>

          <div>
            <strong>
              Clinical analysis in progress
            </strong>
            <p>{generationMessage}</p>
          </div>
        </div>
      )}

      {generationState === "ready" && (
        <>
          <div className="aiw-summary-header">
            <div>
              <strong>{patientName}</strong>
              <span>
                {clinicalSummary.demographicText}
              </span>
            </div>

            <span className="aiw-generated-badge">
              <FiCheck />
              Generated{" "}
              {summaryGeneratedAt
                ? summaryGeneratedAt.toLocaleTimeString(
                    "en-IN",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true
                    }
                  )
                : ""}
            </span>
          </div>

          <div className="aiw-summary-grid">
            <section className="aiw-summary-card">
              <h4>Medical Context</h4>

              <dl className="aiw-context-list">
                <div>
                  <dt>Medical history</dt>
                  <dd>
                    {clinicalSummary.medicalHistory}
                  </dd>
                </div>

                <div>
                  <dt>Allergies</dt>
                  <dd>
                    {clinicalSummary.allergies}
                  </dd>
                </div>

                <div>
                  <dt>Chronic conditions</dt>
                  <dd>
                    {
                      clinicalSummary.chronicConditions
                    }
                  </dd>
                </div>

                <div>
                  <dt>Current medicines</dt>
                  <dd>
                    {
                      clinicalSummary.currentMedicines
                    }
                  </dd>
                </div>
              </dl>
            </section>

            <section className="aiw-summary-card">
              <h4>Recent Clinical Timeline</h4>

              {clinicalSummary.timeline.length ===
              0 ? (
                <p className="aiw-empty-text">
                  No previous clinical activity was
                  found.
                </p>
              ) : (
                <div className="aiw-timeline">
                  {clinicalSummary.timeline.map(
                    (timelineItem) => (
                      <div
                        key={timelineItem.id}
                        className="aiw-timeline-item"
                      >
                        <span />

                        <div>
                          <strong>
                            {timelineItem.label}
                          </strong>
                          <p>
                            {timelineItem.value}
                          </p>
                          <small>
                            {timelineItem.date}
                          </small>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>
          </div>

          <section className="aiw-risk-card">
            <div className="aiw-risk-heading">
              <FiAlertTriangle />

              <div>
                <strong>
                  Review Indicators
                </strong>
                <p>
                  These are reminders for doctor
                  verification, not confirmed
                  findings.
                </p>
              </div>
            </div>

            <div className="aiw-risk-list">
              {clinicalSummary.reviewIndicators.map(
                (indicator) => (
                  <span key={indicator}>
                    {indicator}
                  </span>
                )
              )}
            </div>
          </section>

          <section className="aiw-followup-card">
            <FiCalendar />

            <div>
              <strong>Follow-up Context</strong>
              <p>
                {clinicalSummary.followUpMessage}
              </p>
            </div>
          </section>
        </>
      )}

      {generationState === "idle" && (
        <div className="aiw-empty-workspace">
          <span>
            <FiActivity />
          </span>
          <h4>No summary generated</h4>
          <p>
            Click Generate Summary to simulate
            patient-record analysis.
          </p>
        </div>
      )}
    </div>
  );

  const renderPrescription = () => (
    <div className="aiw-content-stack">
      <div className="aiw-page-heading">
        <div>
          <span className="aiw-eyebrow">
            Prescription support
          </span>
          <h3>Prepare Prescription Draft</h3>
          <p>
            Enter current clinical information.
            Suggested medicines remain editable and
            require doctor verification.
          </p>
        </div>
      </div>

      <div className="aiw-form-grid two">
        <label className="aiw-field aiw-field-wide">
          <span>Current Symptoms</span>
          <textarea
            rows="4"
            placeholder="Example: Fever, sore throat and body pain"
            value={prescriptionForm.symptoms}
            onChange={(event) =>
              setPrescriptionForm((previous) => ({
                ...previous,
                symptoms: event.target.value
              }))
            }
          />
        </label>

        <label className="aiw-field">
          <span>Symptom Duration</span>
          <input
            type="text"
            placeholder="Example: 3 days"
            value={prescriptionForm.duration}
            onChange={(event) =>
              setPrescriptionForm((previous) => ({
                ...previous,
                duration: event.target.value
              }))
            }
          />
        </label>

        <label className="aiw-field">
          <span>Vitals</span>
          <input
            type="text"
            placeholder="Example: Temp 101°F, SpO₂ 98%"
            value={prescriptionForm.vitals}
            onChange={(event) =>
              setPrescriptionForm((previous) => ({
                ...previous,
                vitals: event.target.value
              }))
            }
          />
        </label>

        <label className="aiw-field aiw-field-wide">
          <span>Examination Findings</span>
          <textarea
            rows="3"
            placeholder="Enter relevant examination findings"
            value={
              prescriptionForm.examinationFindings
            }
            onChange={(event) =>
              setPrescriptionForm((previous) => ({
                ...previous,
                examinationFindings:
                  event.target.value
              }))
            }
          />
        </label>

        <label className="aiw-field aiw-field-wide">
          <span>Provisional Diagnosis</span>
          <input
            type="text"
            placeholder="Doctor-entered provisional diagnosis"
            value={
              prescriptionForm.provisionalDiagnosis
            }
            onChange={(event) =>
              setPrescriptionForm((previous) => ({
                ...previous,
                provisionalDiagnosis:
                  event.target.value
              }))
            }
          />
        </label>

        <label className="aiw-field aiw-field-wide">
          <span>Additional Clinical Notes</span>
          <textarea
            rows="3"
            placeholder="Add clinical context for the draft"
            value={
              prescriptionForm.additionalNotes
            }
            onChange={(event) =>
              setPrescriptionForm((previous) => ({
                ...previous,
                additionalNotes:
                  event.target.value
              }))
            }
          />
        </label>
      </div>

      <div className="aiw-form-footer">
        <button
          type="button"
          className="aiw-primary-button"
          onClick={handleGeneratePrescription}
          disabled={
            generationState === "generating"
          }
        >
          <FiCpu
            className={
              generationState === "generating"
                ? "aiw-spin"
                : ""
            }
          />
          {generationState === "generating"
            ? "Preparing Draft..."
            : "Generate Suggestions"}
        </button>
      </div>

      {generationState === "generating" && (
        <div className="aiw-processing-card">
          <span className="aiw-processing-icon">
            <FiCpu />
          </span>

          <div>
            <strong>
              Preparing prescription support
            </strong>
            <p>{generationMessage}</p>
          </div>
        </div>
      )}

      {selectedMedicineIds.length > 0 && (
        <section className="aiw-medicine-section">
          <div className="aiw-section-heading">
            <div>
              <h4>Suggested Medicines</h4>
              <p>
                Select only clinically appropriate
                items. The normal prescription form
                remains editable.
              </p>
            </div>

            <span>
              {selectedMedicineIds.length} selected
            </span>
          </div>

          <div className="aiw-medicine-list">
            {DEMO_MEDICINES.map((medicine) => {
              const selected =
                selectedMedicineIds.includes(
                  medicine.id
                );

              return (
                <button
                  key={medicine.id}
                  type="button"
                  className={`aiw-medicine-card ${
                    selected ? "selected" : ""
                  }`}
                  onClick={() =>
                    toggleMedicineSelection(
                      medicine.id
                    )
                  }
                >
                  <span className="aiw-medicine-check">
                    {selected && <FiCheck />}
                  </span>

                  <span className="aiw-medicine-copy">
                    <strong>
                      {medicine.medicineName}
                    </strong>
                    <span>
                      {medicine.dosage} •{" "}
                      {medicine.duration}
                    </span>
                    <small>
                      {medicine.instruction}
                    </small>
                    <p>{medicine.reason}</p>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="aiw-review-banner">
            <FiShield />

            <div>
              <strong>
                Doctor verification is mandatory
              </strong>
              <p>
                Verify medicine, dosage, duration,
                interactions, contraindications and
                patient-specific risk before saving.
              </p>
            </div>
          </div>

          <div className="aiw-form-footer">
            <button
              type="button"
              className="aiw-primary-button"
              onClick={handleApplyPrescription}
            >
              <FiClipboard />
              Review in Prescription Form
            </button>
          </div>
        </section>
      )}
    </div>
  );

  const renderAppointment = () => (
    <div className="aiw-content-stack">
      <div className="aiw-page-heading">
        <div>
          <span className="aiw-eyebrow">
            Appointment assistance
          </span>
          <h3>Prepare Follow-up Appointment</h3>
          <p>
            This draft will open inside the existing
            appointment form for clinic and slot
            verification.
          </p>
        </div>
      </div>

      <div className="aiw-form-grid two">
        <label className="aiw-field">
          <span>Appointment Date</span>
          <input
            type="date"
            value={
              appointmentForm.appointmentDate
            }
            onChange={(event) =>
              setAppointmentForm((previous) => ({
                ...previous,
                appointmentDate:
                  event.target.value
              }))
            }
          />
        </label>

        <label className="aiw-field">
          <span>Preferred Time</span>
          <input
            type="time"
            value={
              appointmentForm.appointmentTime
            }
            onChange={(event) =>
              setAppointmentForm((previous) => ({
                ...previous,
                appointmentTime:
                  event.target.value
              }))
            }
          />
        </label>

        <label className="aiw-field aiw-field-wide">
          <span>Appointment Reason</span>
          <input
            type="text"
            value={appointmentForm.reason}
            onChange={(event) =>
              setAppointmentForm((previous) => ({
                ...previous,
                reason: event.target.value
              }))
            }
          />
        </label>

        <label className="aiw-field aiw-field-wide">
          <span>Additional Notes</span>
          <textarea
            rows="5"
            value={appointmentForm.notes}
            onChange={(event) =>
              setAppointmentForm((previous) => ({
                ...previous,
                notes: event.target.value
              }))
            }
            placeholder="Add instructions for the appointment"
          />
        </label>
      </div>

      <div className="aiw-form-footer">
        <button
          type="button"
          className="aiw-primary-button"
          onClick={handleApplyAppointment}
        >
          <FiCalendar />
          Review Available Slots
        </button>
      </div>
    </div>
  );

  const renderVisit = () => (
    <div className="aiw-content-stack">
      <div className="aiw-page-heading">
        <div>
          <span className="aiw-eyebrow">
            Consultation record
          </span>
          <h3>Prepare Visit Draft</h3>
          <p>
            Create structured consultation details
            before opening the normal visit form.
          </p>
        </div>
      </div>

      <div className="aiw-form-grid">
        <label className="aiw-field">
          <span>Visit Date and Time</span>
          <input
            type="datetime-local"
            value={visitForm.visitDate}
            onChange={(event) =>
              setVisitForm((previous) => ({
                ...previous,
                visitDate: event.target.value
              }))
            }
          />
        </label>

        <label className="aiw-field">
          <span>Chief Complaint</span>
          <input
            type="text"
            value={visitForm.chiefComplaint}
            onChange={(event) =>
              setVisitForm((previous) => ({
                ...previous,
                chiefComplaint:
                  event.target.value
              }))
            }
            placeholder="Main clinical complaint"
          />
        </label>

        <label className="aiw-field">
          <span>Doctor Notes</span>
          <textarea
            rows="8"
            value={visitForm.doctorNotes}
            onChange={(event) =>
              setVisitForm((previous) => ({
                ...previous,
                doctorNotes:
                  event.target.value
              }))
            }
            placeholder="Clinical findings, advice and observations"
          />
        </label>
      </div>

      <div className="aiw-form-footer">
        <button
          type="button"
          className="aiw-primary-button"
          onClick={handleApplyVisit}
        >
          <FiUser />
          Review in Visit Form
        </button>
      </div>
    </div>
  );

  const renderNote = () => (
    <div className="aiw-content-stack">
      <div className="aiw-page-heading">
        <div>
          <span className="aiw-eyebrow">
            Private doctor record
          </span>
          <h3>Prepare Doctor Note</h3>
          <p>
            Convert clinical instructions into a
            structured private note.
          </p>
        </div>
      </div>

      <div className="aiw-form-grid">
        <label className="aiw-field">
          <span>Note Title</span>
          <input
            type="text"
            value={noteForm.title}
            onChange={(event) =>
              setNoteForm((previous) => ({
                ...previous,
                title: event.target.value
              }))
            }
          />
        </label>

        <label className="aiw-field">
          <span>Note Content</span>
          <textarea
            rows="9"
            value={noteForm.content}
            onChange={(event) =>
              setNoteForm((previous) => ({
                ...previous,
                content: event.target.value
              }))
            }
            placeholder="Example: Monitor blood pressure twice daily for seven days"
          />
        </label>
      </div>

      <div className="aiw-form-footer">
        <button
          type="button"
          className="aiw-primary-button"
          onClick={handleApplyNote}
        >
          <FiEdit3 />
          Review in Doctor Notes
        </button>
      </div>
    </div>
  );

  const renderReport = () => (
    <div className="aiw-content-stack">
      <div className="aiw-page-heading">
        <div>
          <span className="aiw-eyebrow">
            Medical document
          </span>
          <h3>Prepare Report Upload</h3>
          <p>
            Clinical AI prepares report metadata only.
            The original PDF or image must still be
            uploaded.
          </p>
        </div>
      </div>

      <div className="aiw-form-grid two">
        <label className="aiw-field aiw-field-wide">
          <span>Report Name</span>
          <input
            type="text"
            value={reportForm.reportName}
            onChange={(event) =>
              setReportForm((previous) => ({
                ...previous,
                reportName:
                  event.target.value
              }))
            }
            placeholder="Example: Complete Blood Count"
          />
        </label>

        <label className="aiw-field">
          <span>Report Type</span>
          <select
            value={reportForm.reportType}
            onChange={(event) =>
              setReportForm((previous) => ({
                ...previous,
                reportType:
                  event.target.value
              }))
            }
          >
            {REPORT_TYPES.map((reportType) => (
              <option
                key={reportType.value}
                value={reportType.value}
              >
                {reportType.label}
              </option>
            ))}
          </select>
        </label>

        <label className="aiw-field">
          <span>Report Date</span>
          <input
            type="date"
            value={reportForm.reportDate}
            onChange={(event) =>
              setReportForm((previous) => ({
                ...previous,
                reportDate:
                  event.target.value
              }))
            }
          />
        </label>

        <label className="aiw-field aiw-field-wide">
          <span>Lab or Source Name</span>
          <input
            type="text"
            value={reportForm.labName}
            onChange={(event) =>
              setReportForm((previous) => ({
                ...previous,
                labName: event.target.value
              }))
            }
            placeholder="Lab, hospital or diagnostic centre"
          />
        </label>

        <label className="aiw-field aiw-field-wide">
          <span>Clinical Context</span>
          <textarea
            rows="5"
            value={reportForm.notes}
            onChange={(event) =>
              setReportForm((previous) => ({
                ...previous,
                notes: event.target.value
              }))
            }
            placeholder="Reason or observation related to the report"
          />
        </label>
      </div>

      <div className="aiw-policy-card">
        <FiFileText />

        <div>
          <strong>
            Original report file required
          </strong>
          <p>
            The normal upload form will open with
            these details prefilled.
          </p>
        </div>
      </div>

      <div className="aiw-form-footer">
        <button
          type="button"
          className="aiw-primary-button"
          onClick={handleApplyReport}
        >
          <FiUploadCloud />
          Open Report Upload
        </button>
      </div>
    </div>
  );

  const renderActiveContent = () => {
    if (activeAction === "summary") {
      return renderSummary();
    }

    if (activeAction === "prescription") {
      return renderPrescription();
    }

    if (activeAction === "appointment") {
      return renderAppointment();
    }

    if (activeAction === "visit") {
      return renderVisit();
    }

    if (activeAction === "note") {
      return renderNote();
    }

    if (activeAction === "report") {
      return renderReport();
    }

    return renderOverview();
  };

  return (
    <>
      <section
        className="aiw-entry-card"
        aria-label="Clinical AI workspace"
      >
        <div className="aiw-entry-main">
          <span className="aiw-entry-icon">
            <FiCpu />
          </span>

          <div className="aiw-entry-copy">
            <div className="aiw-entry-title-row">
              <span className="aiw-eyebrow">
                Clinical AI Workspace
              </span>

              <span
                className={`aiw-mode-badge ${
                  backendAiEnabled
                    ? "connected"
                    : "demo"
                }`}
              >
                {backendAiEnabled
                  ? "AI Connected"
                  : "Interactive Demo"}
              </span>
            </div>

            <h2>AI-assisted patient workflow</h2>

            <p>
              Generate patient summaries and prepare
              doctor-reviewable prescription,
              appointment, visit, note and report
              drafts.
            </p>
          </div>
        </div>

        <div className="aiw-entry-side">
          <div className="aiw-entry-metrics">
            {recordCounts.map((record) => (
              <div key={record.label}>
                <strong>{record.value}</strong>
                <span>{record.label}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="aiw-open-button"
            onClick={handleOpen}
          >
            <FiCpu />
            Open Clinical AI
          </button>
        </div>
      </section>

      {isOpen && (
        <div
          className="aiw-overlay"
          onMouseDown={handleClose}
        >
          <aside
            className="aiw-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="aiw-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="aiw-drawer-header">
              <div className="aiw-brand-block">
                <span className="aiw-brand-icon">
                  <FiCpu />
                </span>

                <div>
                  <div className="aiw-title-row">
                    <h2 id="aiw-title">
                      Clinical AI Assistant
                    </h2>

                    <span
                      className={`aiw-mode-badge ${
                        backendAiEnabled
                          ? "connected"
                          : "demo"
                      }`}
                    >
                      {backendAiEnabled
                        ? "AI Connected"
                        : "Demo Mode"}
                    </span>
                  </div>

                  <p>
                    {patientName} • Patient ID{" "}
                    {patient?.id || "N/A"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="aiw-close-button"
                onClick={handleClose}
                disabled={
                  generationState === "generating"
                }
                aria-label="Close Clinical AI Assistant"
              >
                <FiX />
              </button>
            </header>

            <div className="aiw-drawer-layout">
              <nav
                className="aiw-navigation"
                aria-label="Clinical AI actions"
              >
                <button
                  type="button"
                  className={
                    activeAction === "overview"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    handleSelectAction("overview")
                  }
                >
                  <FiCpu />
                  <span>Overview</span>
                </button>

                {AI_ACTIONS.map((action) => {
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.id}
                      type="button"
                      className={
                        activeAction === action.id
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        handleSelectAction(
                          action.id
                        )
                      }
                    >
                      <Icon />
                      <span>{action.title}</span>
                    </button>
                  );
                })}
              </nav>

              <main className="aiw-main-content">
                {renderActiveContent()}
              </main>
            </div>

            <footer className="aiw-command-footer">
              <form
                className="aiw-command-form"
                onSubmit={handleCommandSubmit}
              >
                <div className="aiw-command-input-wrap">
                  <FiCpu className="aiw-command-leading-icon" />

                  <input
                    type="text"
                    value={command}
                    onChange={(event) =>
                      setCommand(event.target.value)
                    }
                    placeholder='Try: "Book a follow-up appointment"'
                    aria-label="Clinical AI command"
                  />

                  {voiceSupported && (
                    <button
                      type="button"
                      className={`aiw-voice-button ${
                        isListening ? "active" : ""
                      }`}
                      onClick={
                        isListening
                          ? stopVoiceInput
                          : startVoiceInput
                      }
                      aria-label={
                        isListening
                          ? "Stop voice input"
                          : "Start voice input"
                      }
                    >
                      {isListening ? (
                        <FiMicOff />
                      ) : (
                        <FiMic />
                      )}
                    </button>
                  )}

                  <button
                    type="submit"
                    className="aiw-send-button"
                    aria-label="Run Clinical AI command"
                  >
                    <FiSend />
                  </button>
                </div>

                <div className="aiw-command-meta">
                  <span>
                    <FiShield />
                    Draft-only actions
                  </span>

                  <span>
                    <FiClock />
                    No backend AI call in demo mode
                  </span>
                </div>

                {commandMessage && (
                  <p
                    className="aiw-command-message"
                    role="alert"
                  >
                    {commandMessage}
                  </p>
                )}
              </form>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
};

export default AiClinicalAssistant;