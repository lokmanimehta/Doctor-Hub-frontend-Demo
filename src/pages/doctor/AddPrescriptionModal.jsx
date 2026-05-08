import React, { useEffect, useMemo, useRef, useState } from "react";
import "./AddPrescriptionModal.css";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const speechSupported = !!SpeechRecognition;

const DEFAULT_MEDICINE = {
  medicineName: "",
  dosage: "",
  duration: "",
  instruction: ""
};

const formatDateForInput = (value) => {
  if (!value) return "";

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "";

  const date = new Date(parsed);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().split("T")[0];
};

const normalizeMedicinesFromEdit = (editingData) => {
  if (!editingData?.medicines || editingData.medicines.length === 0) {
    return [{ ...DEFAULT_MEDICINE }];
  }

  return editingData.medicines.map((med) => ({
    medicineName: med.medicineName || med.name || "",
    dosage: med.dosage || "",
    duration: med.duration || "",
    instruction: med.instruction || ""
  }));
};

const AddPrescriptionModal = ({
  onClose,
  onSave,
  editingData = null,
  aiEnabled = false,
  visits = [],
  defaultVisitId = null
}) => {
  const [symptoms, setSymptoms] = useState(editingData?.symptoms || "");
  const [diagnosis, setDiagnosis] = useState(editingData?.diagnosis || "");
  const [treatmentPlan, setTreatmentPlan] = useState(
    editingData?.treatmentPlan || ""
  );
const initialVisitId = editingData?.visitId ?? defaultVisitId ?? "";

const [visitId, setVisitId] = useState(initialVisitId);
  const [clinicalNotes, setClinicalNotes] = useState(
    editingData?.clinicalNotes || ""
  );
  const [followUpType, setFollowUpType] = useState(
    editingData?.followUpType || "Visit Review"
  );
  const [followUpDate, setFollowUpDate] = useState(
    formatDateForInput(editingData?.followUpDate)
  );
  const [notifyPatient, setNotifyPatient] = useState(
    editingData?.notifyPatient !== undefined ? editingData.notifyPatient : true
  );

  const [medicines, setMedicines] = useState(
    normalizeMedicinesFromEdit(editingData)
  );

  const [voiceTranscript, setVoiceTranscript] = useState(
    editingData?.voiceTranscript || ""
  );
  const [aiSuggestions, setAiSuggestions] = useState(
    editingData?.aiSuggestions || []
  );
  const [isListening, setIsListening] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const [error, setError] = useState("");
  const [aiToast, setAiToast] = useState("");

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef(editingData?.voiceTranscript || "");

  const followUpOptions = useMemo(
    () => [
      "Visit Review",
      "Lab Test",
      "Refill Reminder",
      "Doctor Follow-up Call"
    ],
    []
  );  


  const suggestedMedicines = useMemo(
    () => [
      {
        medicineName: "Paracetamol 650mg",
        dosage: "1-1-1",
        duration: "3 Days",
        instruction: "After meal",
        note: "Helpful for fever and body ache in common cases."
      },
      {
        medicineName: "Pantoprazole 40mg",
        dosage: "1-0-0",
        duration: "5 Days",
        instruction: "30 min before breakfast",
        note: "Used when gastric protection support is needed."
      },
      {
        medicineName: "Cetirizine 10mg",
        dosage: "0-0-1",
        duration: "5 Days",
        instruction: "At night",
        note: "Can support allergy or throat irritation symptoms."
      }
    ],
    []
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (!aiEnabled || !speechSupported) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onstart = () => {
      setIsListening(true);
      setError("");
    };

    recognition.onend = () => {
      setIsListening(false);
      setVoiceTranscript(finalTranscriptRef.current.trim());
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setError(`Voice recognition error: ${event.error}`);
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscriptChunk = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscriptChunk += transcriptPiece + " ";
        } else {
          interimTranscript += transcriptPiece + " ";
        }
      }

      if (finalTranscriptChunk) {
        finalTranscriptRef.current += finalTranscriptChunk;
      }

      setVoiceTranscript(
        `${finalTranscriptRef.current}${interimTranscript}`.trim()
      );
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [aiEnabled]);

  const showAiToast = (message) => {
    setAiToast(message);
    setTimeout(() => {
      setAiToast("");
    }, 2500);
  };

  const startListening = () => {
    if (!aiEnabled) return;

    if (!recognitionRef.current) {
      setError("Voice recognition is not supported in this browser.");
      return;
    }

    try {
      finalTranscriptRef.current = voiceTranscript ? `${voiceTranscript} ` : "";
      recognitionRef.current.start();
    } catch {
      setError("Voice recognition is already active or unavailable.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleAddMedicine = () => {
    setMedicines((prev) => [...prev, { ...DEFAULT_MEDICINE }]);
  };

  const handleRemoveMedicine = (index) => {
    setMedicines((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleMedicineChange = (index, field, value) => {
    setMedicines((prev) =>
      prev.map((med, i) => (i === index ? { ...med, [field]: value } : med))
    );
  };

  const validateMedicines = () => {
    if (medicines.length === 0) return false;

    return medicines.every(
      (med) =>
        med.medicineName.trim() &&
        med.dosage.trim() &&
        med.duration.trim() &&
        med.instruction.trim()
    );
  };

  const handleGenerateSmartSuggestions = () => {
    if (!aiEnabled) return;

    setIsGeneratingAi(true);
    setError("");

    setTimeout(() => {
      const diagnosisText = diagnosis.toLowerCase();
      const suggestions = [];

      if (diagnosisText.includes("diabetes")) {
        suggestions.push({
          id: Date.now() + 1,
          title: "AI Safety Check",
          text: "Please review sugar history and current antidiabetic medicines before finalizing treatment."
        });
      }

      if (diagnosisText.includes("fever")) {
        suggestions.push({
          id: Date.now() + 2,
          title: "AI Supportive Guidance",
          text: "Hydration, temperature monitoring, and symptomatic support may be considered based on patient condition."
        });
      }

      if (diagnosisText.includes("hypertension")) {
        suggestions.push({
          id: Date.now() + 3,
          title: "AI Drug Review",
          text: "Check current BP medicines to avoid duplicate antihypertensive combinations."
        });
      }

      if (suggestions.length === 0) {
        suggestions.push({
          id: Date.now() + 4,
          title: "AI General Review",
          text: "Review allergies, chronic conditions, recent visits, and current medicines before confirming the prescription."
        });
      }

      setAiSuggestions(suggestions);
      setIsGeneratingAi(false);
      showAiToast("AI suggestions refreshed");
    }, 1000);
  };

  const handleApplySuggestionMedicine = (medicineData) => {
    setMedicines((prev) => [
      ...prev,
      {
        medicineName: medicineData.medicineName,
        dosage: medicineData.dosage,
        duration: medicineData.duration,
        instruction: medicineData.instruction
      }
    ]);

    showAiToast(`${medicineData.medicineName} added`);
  };

  const handleSave = async () => {
    setError("");

    if (!diagnosis.trim()) {
      setError("Diagnosis is required");
      return;
    }

    if (!validateMedicines()) {
      setError("Each medicine must have name, dosage, duration, and instruction");
      return;
    }

    const payload = {
      symptoms: symptoms.trim() || null,
      diagnosis: diagnosis.trim(),
      treatmentPlan: treatmentPlan.trim() || null,
      clinicalNotes: clinicalNotes.trim() || null,
      followUpDate: followUpDate ? new Date(followUpDate).getTime() : null,
      followUpType: followUpType.trim() || null,
      notifyPatient,
      visitId: visitId ? Number(visitId) : null,
      medicines: medicines.map((med) => ({
        medicineName: med.medicineName.trim(),
        dosage: med.dosage.trim(),
        duration: med.duration.trim(),
        instruction: med.instruction.trim()
      }))
    };

    try {
      await onSave(payload);
    } catch (saveError) {
      setError(
        saveError?.response?.data?.message ||
          saveError?.message ||
          "Unable to save prescription"
      );
    }
  };

  return (
    <div className="prescription-modal-overlay" onClick={onClose}>
      <div
        className="prescription-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="prescription-modal-header">
          <div>
            <h3>{editingData ? "Edit Prescription" : "Create Prescription"}</h3>
            <p>
              Manual prescription entry with optional AI assist when available.
            </p>
          </div>

          <button
            type="button"
            className="prescription-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {error && <div className="prescription-error-box">{error}</div>}
        {aiToast && <div className="prescription-ai-toast">{aiToast}</div>}

        <div className="prescription-modal-body">
          {aiEnabled && (
            <div className="prescription-section-card">
              <div className="prescription-section-head">
                <div>
                  <h4>AI Assist</h4>
                  <span className="prescription-section-subtext">
                    Optional helper tools for faster drafting
                  </span>
                </div>
                <span className="prescription-badge prescription-badge-ai">
                  AI Enabled
                </span>
              </div>

              <div className="prescription-ai-tools">
                {speechSupported ? (
                  <>
                    <button
                      type="button"
                      className="prescription-secondary-btn"
                      onClick={startListening}
                      disabled={isListening}
                    >
                      {isListening ? "Listening..." : "Start Voice"}
                    </button>

                    <button
                      type="button"
                      className="prescription-secondary-btn ghost"
                      onClick={stopListening}
                      disabled={!isListening}
                    >
                      Stop Voice
                    </button>
                  </>
                ) : (
                  <div className="prescription-muted-box">
                    Voice recognition browser me support nahi karta. Chrome me test karo.
                  </div>
                )}

                <button
                  type="button"
                  className="prescription-secondary-btn"
                  onClick={handleGenerateSmartSuggestions}
                  disabled={isGeneratingAi}
                >
                  {isGeneratingAi ? "Checking..." : "Generate Suggestions"}
                </button>
              </div>

              <label>Voice Transcript</label>
              <textarea
                rows="4"
                placeholder="Doctor voice transcript will appear here..."
                value={voiceTranscript}
                onChange={(e) => setVoiceTranscript(e.target.value)}
              />

              <div className="prescription-ai-grid">
                <div className="prescription-ai-panel">
                  <h5>AI Suggestions</h5>
                  {aiSuggestions.length === 0 ? (
                    <div className="prescription-muted-box">
                      No AI suggestions generated yet.
                    </div>
                  ) : (
                    <div className="prescription-ai-list">
                      {aiSuggestions.map((item) => (
                        <div key={item.id} className="prescription-ai-item">
                          <strong>{item.title}</strong>
                          <p>{item.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="prescription-ai-panel">
                  <h5>Quick Suggested Medicines</h5>
                  <div className="prescription-suggested-list">
                    {suggestedMedicines.map((med, index) => (
                      <div key={index} className="prescription-suggested-card">
                        <div className="prescription-suggested-top">
                          <strong>{med.medicineName}</strong>
                          <span>{med.dosage}</span>
                        </div>
                        <p>{med.note}</p>
                        <button
                          type="button"
                          className="prescription-link-btn"
                          onClick={() => handleApplySuggestionMedicine(med)}
                        >
                          Add to Prescription
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="prescription-section-card">
            <div className="prescription-section-head">
              <div>
                <h4>Clinical Summary</h4>
                <span className="prescription-section-subtext">
                  Main prescription information
                </span>
              </div>
              <span className="prescription-badge">Required</span>
            </div>
             <div className="prescription-form-group">
  <label>Link Visit (Optional)</label>
  <select
    value={visitId}
    onChange={(e) => setVisitId(e.target.value)}
  >
    <option value="">Not linked to a visit</option>
    {visits.map((visit) => (
      <option key={visit.id} value={visit.id}>
        {new Date(visit.visitDate).toLocaleDateString()} - {visit.chiefComplaint || "Visit"}
      </option>
    ))}
  </select>
</div>
            <label>Symptoms</label>
            <input
              type="text"
              placeholder="Enter symptoms"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />

            <label>Diagnosis</label>
            <input
              type="text"
              placeholder="Enter diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
            />

            <label>Treatment Plan</label>
            <textarea
              rows="3"
              placeholder="Describe treatment plan"
              value={treatmentPlan}
              onChange={(e) => setTreatmentPlan(e.target.value)}
            />

            <label>Clinical Notes</label>
            <textarea
              rows="3"
              placeholder="Write clinical notes"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
            />
          </div>

          <div className="prescription-section-card">
            <div className="prescription-section-head">
              <div>
                <h4>Medicines</h4>
                <span className="prescription-section-subtext">
                  Add medicine, dosage, duration and instruction
                </span>
              </div>
              <span className="prescription-badge">Doctor Final Review</span>
            </div>

            <div className="prescription-medicine-list">
              {medicines.map((med, index) => (
                <div key={index} className="prescription-medicine-card">
                  <div className="prescription-medicine-header">
                    <h5>Medicine {index + 1}</h5>
                    <button
                      type="button"
                      className="prescription-remove-btn"
                      onClick={() => handleRemoveMedicine(index)}
                      disabled={medicines.length === 1}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="prescription-medicine-grid">
                    <input
                      type="text"
                      placeholder="Medicine Name"
                      value={med.medicineName}
                      onChange={(e) =>
                        handleMedicineChange(
                          index,
                          "medicineName",
                          e.target.value
                        )
                      }
                    />
                    <input
                      type="text"
                      placeholder="Dosage"
                      value={med.dosage}
                      onChange={(e) =>
                        handleMedicineChange(index, "dosage", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      placeholder="Duration"
                      value={med.duration}
                      onChange={(e) =>
                        handleMedicineChange(index, "duration", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      placeholder="Instruction"
                      value={med.instruction}
                      onChange={(e) =>
                        handleMedicineChange(
                          index,
                          "instruction",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="prescription-add-medicine-btn"
              onClick={handleAddMedicine}
            >
              + Add Another Medicine
            </button>
          </div>

          <div className="prescription-section-card">
            <div className="prescription-section-head">
              <div>
                <h4>Follow-up</h4>
                <span className="prescription-section-subtext">
                  Optional patient reminder and review date
                </span>
              </div>
              <span className="prescription-badge prescription-badge-warn">
                Optional
              </span>
            </div>
             
            <div className="prescription-followup-grid">
              <div>
                <label>Follow-up Type</label>
                <select
                  value={followUpType}
                  onChange={(e) => setFollowUpType(e.target.value)}
                >
                  {followUpOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Follow-up Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>
            </div>

            <label className="prescription-checkbox-row">
              <input
                type="checkbox"
                checked={notifyPatient}
                onChange={(e) => setNotifyPatient(e.target.checked)}
              />
              <span>Send notification to patient</span>
            </label>
          </div>
        </div>

        <div className="prescription-modal-footer">
          <button
            type="button"
            className="prescription-cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="prescription-save-btn"
            onClick={handleSave}
          >
            {editingData ? "Update Prescription" : "Save Prescription"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPrescriptionModal;