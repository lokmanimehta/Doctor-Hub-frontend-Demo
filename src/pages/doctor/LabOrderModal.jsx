import React, { useMemo, useState } from "react";
import "./LabOrderModal.css";

const LAB_SOURCE_OPTIONS = [
  { value: "SYSTEM_VERIFIED", label: "System Verified Labs" },
  { value: "DOCTOR_ADDED", label: "My Added Labs" },
];

const COLLECTION_OPTIONS = [
  { value: "HOME_PICKUP", label: "Home Pickup" },
  { value: "CLINIC_VISIT", label: "Clinic Visit" },
];

const PRIORITY_OPTIONS = [
  { value: "NORMAL", label: "Normal" },
  { value: "URGENT", label: "Urgent" },
];

const normalize = (value) => (value || "").toString().trim().toLowerCase();

const formatLabAddress = (lab) => {
  const parts = [lab?.area, lab?.city, lab?.state].filter(Boolean);
  return parts.length ? parts.join(", ") : "Address not available";
};

const formatVisitOption = (visit) => {
  const visitDate = visit?.visitDate
    ? new Date(visit.visitDate).toLocaleString()
    : "Unknown date";

  return `${visitDate} - ${visit?.chiefComplaint || "Visit"}`;
};

const formatPrescriptionOption = (prescription) => {
  const prescriptionDate = prescription?.prescriptionDate
    ? new Date(prescription.prescriptionDate).toLocaleDateString()
    : "Unknown date";

  return `${prescriptionDate} - ${prescription?.diagnosis || "Prescription"}`;
};

const LabOrderModal = ({
  onClose,
  onSave,
  patient,
  systemLabs = [],
  myLabs = [],
  labTestCatalog = [],
  visits = [],
  prescriptions = [],
  saving = false,
}) => {
  const [labSourceType, setLabSourceType] = useState("SYSTEM_VERIFIED");
  const [selectedSystemLabId, setSelectedSystemLabId] = useState("");
  const [selectedDoctorLabId, setSelectedDoctorLabId] = useState("");
  const [selectedVisitId, setSelectedVisitId] = useState("");
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState("");
  const [selectedTests, setSelectedTests] = useState([]);
  const [collectionType, setCollectionType] = useState("HOME_PICKUP");
  const [priority, setPriority] = useState("NORMAL");
  const [notes, setNotes] = useState("");
  const [labSearch, setLabSearch] = useState("");
  const [testSearch, setTestSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [formError, setFormError] = useState("");

  const currentLabs = useMemo(() => {
    const source = labSourceType === "SYSTEM_VERIFIED" ? systemLabs : myLabs;

    return source.filter((lab) => {
      const matchesSearch =
        normalize(lab?.name).includes(normalize(labSearch)) ||
        normalize(lab?.city).includes(normalize(labSearch)) ||
        normalize(lab?.area).includes(normalize(labSearch)) ||
        normalize(lab?.state).includes(normalize(labSearch));

      return matchesSearch;
    });
  }, [labSourceType, systemLabs, myLabs, labSearch]);

  const selectedLab = useMemo(() => {
    if (labSourceType === "SYSTEM_VERIFIED") {
      return (
        systemLabs.find((lab) => String(lab.id) === String(selectedSystemLabId)) || null
      );
    }

    return myLabs.find((lab) => String(lab.id) === String(selectedDoctorLabId)) || null;
  }, [labSourceType, selectedSystemLabId, selectedDoctorLabId, systemLabs, myLabs]);

  const selectedLabServices = useMemo(() => {
    if (!selectedLab?.services || !Array.isArray(selectedLab.services)) {
      return [];
    }

    return selectedLab.services
      .map((service) => service?.trim())
      .filter(Boolean);
  }, [selectedLab]);

  const labScopedCatalog = useMemo(() => {
    if (!selectedLab || selectedLabServices.length === 0) {
      return [];
    }

    return labTestCatalog.filter((test) =>
      selectedLabServices.some(
        (service) => normalize(service) === normalize(test?.serviceType)
      )
    );
  }, [selectedLab, selectedLabServices, labTestCatalog]);

  const availableServiceTypes = useMemo(() => {
    const set = new Set();

    for (const test of labScopedCatalog) {
      if (test?.serviceType) {
        set.add(test.serviceType);
      }
    }

    return ["ALL", ...Array.from(set)];
  }, [labScopedCatalog]);

  const filteredTests = useMemo(() => {
    return labScopedCatalog.filter((test) => {
      const matchesSearch =
        normalize(test?.testName).includes(normalize(testSearch)) ||
        normalize(test?.testCode).includes(normalize(testSearch)) ||
        normalize(test?.category).includes(normalize(testSearch)) ||
        normalize(test?.serviceType).includes(normalize(testSearch));

      const matchesService =
        serviceFilter === "ALL" || test?.serviceType === serviceFilter;

      return matchesSearch && matchesService;
    });
  }, [labScopedCatalog, testSearch, serviceFilter]);

  const groupedTests = useMemo(() => {
    const groups = {};

    for (const test of filteredTests) {
      const key = test?.serviceType || "Other";

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(test);
    }

    return groups;
  }, [filteredTests]);

  const selectedTestsPreview = useMemo(() => {
    return labTestCatalog.filter((test) => selectedTests.includes(test.id));
  }, [labTestCatalog, selectedTests]);

  const toggleTestSelection = (testId) => {
    setSelectedTests((prev) => {
      if (prev.includes(testId)) {
        return prev.filter((id) => id !== testId);
      }

      return [...prev, testId];
    });
  };

  const handleChangeSource = (value) => {
    setLabSourceType(value);
    setSelectedSystemLabId("");
    setSelectedDoctorLabId("");
    setSelectedTests([]);
    setServiceFilter("ALL");
    setTestSearch("");
    setFormError("");
  };

  const handleSelectLab = (labId) => {
    if (labSourceType === "SYSTEM_VERIFIED") {
      setSelectedSystemLabId(String(labId));
    } else {
      setSelectedDoctorLabId(String(labId));
    }

    setSelectedTests([]);
    setServiceFilter("ALL");
    setTestSearch("");
    setFormError("");
  };

  const handleSubmit = async () => {
    try {
      setFormError("");

      if (labSourceType === "SYSTEM_VERIFIED" && !selectedSystemLabId) {
        setFormError("Please select a system verified lab.");
        return;
      }

      if (labSourceType === "DOCTOR_ADDED" && !selectedDoctorLabId) {
        setFormError("Please select one of your added labs.");
        return;
      }

      if (selectedTests.length === 0) {
        setFormError("Please select at least one diagnostic test.");
        return;
      }

      const payload = {
        doctorClinicId: patient?.doctorClinicId || null,
        visitId: selectedVisitId ? Number(selectedVisitId) : null,
        prescriptionId: selectedPrescriptionId ? Number(selectedPrescriptionId) : null,
        labSourceType,
        systemLabId:
          labSourceType === "SYSTEM_VERIFIED"
            ? Number(selectedSystemLabId)
            : null,
        doctorLabId:
          labSourceType === "DOCTOR_ADDED"
            ? Number(selectedDoctorLabId)
            : null,
        collectionType,
        priority,
        notes: notes.trim(),
        tests: selectedTests.map((testId) => ({
          labTestCatalogId: testId,
        })),
      };

      await onSave(payload);
    } catch (error) {
      console.error("Failed to submit lab order:", error);
      setFormError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to create lab order."
      );
    }
  };

  return (
    <div className="lab-order-modal-overlay" onClick={saving ? undefined : onClose}>
      <div className="lab-order-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lab-order-modal__header">
          <div>
            <p className="lab-order-modal__eyebrow">Patient Lab Order</p>
            <h3>Order Lab Test</h3>
            <p className="lab-order-modal__subtext">
              Create a lab order for <strong>{patient?.fullName || "this patient"}</strong>.
            </p>
          </div>

          <button
            className="lab-order-modal__close"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </button>
        </div>

        <div className="lab-order-modal__patient-strip">
          <div className="lab-order-pill">
            <span>Patient</span>
            <strong>{patient?.fullName || "N/A"}</strong>
          </div>

          <div className="lab-order-pill">
            <span>Clinic</span>
            <strong>{patient?.clinicName || "N/A"}</strong>
          </div>

          <div className="lab-order-pill">
            <span>Critical</span>
            <strong>{patient?.isCritical ? "Yes" : "No"}</strong>
          </div>
        </div>

        {formError && (
          <div className="lab-order-alert lab-order-alert--error">
            {formError}
          </div>
        )}

        <div className="lab-order-modal__body">
          <div className="lab-order-layout">
            <div className="lab-order-panel">
              <div className="lab-order-section">
                <h4>1. Select Lab Source</h4>

                <div className="lab-order-segmented">
                  {LAB_SOURCE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`lab-order-segmented__btn ${
                        labSourceType === option.value ? "active" : ""
                      }`}
                      onClick={() => handleChangeSource(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lab-order-section">
                <div className="lab-order-section__top">
                  <h4>2. Choose Lab</h4>
                  <span>{currentLabs.length} labs</span>
                </div>

                <div className="lab-order-search">
                  <input
                    type="text"
                    placeholder="Search lab by name or location"
                    value={labSearch}
                    onChange={(e) => setLabSearch(e.target.value)}
                  />
                </div>

                <div className="lab-order-labs-list">
                  {currentLabs.length === 0 ? (
                    <div className="lab-order-empty">
                      No labs available for current selection.
                    </div>
                  ) : (
                    currentLabs.map((lab) => {
                      const isSelected =
                        labSourceType === "SYSTEM_VERIFIED"
                          ? String(selectedSystemLabId) === String(lab.id)
                          : String(selectedDoctorLabId) === String(lab.id);

                      return (
                        <button
                          type="button"
                          key={lab.id}
                          className={`lab-order-lab-card ${isSelected ? "selected" : ""}`}
                          onClick={() => handleSelectLab(lab.id)}
                        >
                          <div className="lab-order-lab-card__top">
                            <h5>{lab.name}</h5>
                            <span
                              className={`lab-order-badge ${
                                labSourceType === "SYSTEM_VERIFIED" ? "verified" : "custom"
                              }`}
                            >
                              {labSourceType === "SYSTEM_VERIFIED"
                                ? "Verified"
                                : "Doctor Added"}
                            </span>
                          </div>

                          <p>{formatLabAddress(lab)}</p>

                          {lab.contactNumber && (
                            <p className="lab-order-lab-card__contact">
                              Contact: {lab.contactNumber}
                            </p>
                          )}

                          {lab.services?.length > 0 && (
                            <div className="lab-order-chip-list">
                              {lab.services.map((service) => (
                                <span key={`${lab.id}-${service}`} className="lab-order-chip">
                                  {service}
                                </span>
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="lab-order-section">
                <h4>3. Clinical Linking</h4>

                <div className="lab-order-field-grid">
                  <div className="lab-order-field">
                    <label>Linked Visit (Optional)</label>
                    <select
                      value={selectedVisitId}
                      onChange={(e) => setSelectedVisitId(e.target.value)}
                    >
                      <option value="">No linked visit</option>
                      {visits.map((visit) => (
                        <option key={visit.id} value={visit.id}>
                          {formatVisitOption(visit)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="lab-order-field">
                    <label>Linked Prescription (Optional)</label>
                    <select
                      value={selectedPrescriptionId}
                      onChange={(e) => setSelectedPrescriptionId(e.target.value)}
                    >
                      <option value="">No linked prescription</option>
                      {prescriptions.map((prescription) => (
                        <option key={prescription.id} value={prescription.id}>
                          {formatPrescriptionOption(prescription)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="lab-order-panel">
              <div className="lab-order-section">
                <div className="lab-order-section__top">
                  <h4>4. Select Tests</h4>
                  <span>{selectedTests.length} selected</span>
                </div>

                {!selectedLab ? (
                  <div className="lab-order-empty">
                    Please select a lab first to see allowed tests.
                  </div>
                ) : (
                  <>
                    <div className="lab-order-selected-services">
                      <span className="lab-order-selected-services__label">
                        Allowed Services
                      </span>

                      <div className="lab-order-chip-list">
                        {selectedLabServices.map((service) => (
                          <span key={service} className="lab-order-chip">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="lab-order-tools">
                      <input
                        type="text"
                        placeholder="Search test name, code or category"
                        value={testSearch}
                        onChange={(e) => setTestSearch(e.target.value)}
                      />

                      <select
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                      >
                        {availableServiceTypes.map((service) => (
                          <option key={service} value={service}>
                            {service === "ALL" ? "All Services" : service}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="lab-order-tests-list">
                      {Object.keys(groupedTests).length === 0 ? (
                        <div className="lab-order-empty">
                          No tests matched the selected lab services.
                        </div>
                      ) : (
                        Object.entries(groupedTests).map(([groupName, tests]) => (
                          <div key={groupName} className="lab-order-test-group">
                            <div className="lab-order-test-group__header">
                              <h5>{groupName}</h5>
                              <span>{tests.length}</span>
                            </div>

                            <div className="lab-order-test-items">
                              {tests.map((test) => {
                                const checked = selectedTests.includes(test.id);

                                return (
                                  <label
                                    key={test.id}
                                    className={`lab-order-test-item ${checked ? "selected" : ""}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleTestSelection(test.id)}
                                    />

                                    <div className="lab-order-test-item__content">
                                      <strong>{test.testName}</strong>
                                      <span>
                                        {test.category}
                                        {test.testCode ? ` • ${test.testCode}` : ""}
                                      </span>
                                    </div>

                                    <div className="lab-order-test-item__price">
                                      ₹{test.price}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="lab-order-section">
                <h4>5. Order Details</h4>

                <div className="lab-order-field-grid">
                  <div className="lab-order-field">
                    <label>Collection Type</label>
                    <select
                      value={collectionType}
                      onChange={(e) => setCollectionType(e.target.value)}
                    >
                      {COLLECTION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="lab-order-field">
                    <label>Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      {PRIORITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="lab-order-field">
                  <label>Notes</label>
                  <textarea
                    rows="4"
                    placeholder="Clinical instructions, fasting note, urgency details..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={2000}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lab-order-summary">
            <div className="lab-order-summary__block">
              <span>Selected Lab</span>
              <strong>{selectedLab?.name || "Not selected"}</strong>
            </div>

            <div className="lab-order-summary__block">
              <span>Tests</span>
              <strong>{selectedTests.length}</strong>
            </div>

            <div className="lab-order-summary__block">
              <span>Payment Mode</span>
              <strong>
                {labSourceType === "SYSTEM_VERIFIED" ? "ONLINE" : "OFFLINE"}
              </strong>
            </div>
          </div>

          {selectedTestsPreview.length > 0 && (
            <div className="lab-order-selected-preview">
              {selectedTestsPreview.map((test) => (
                <span key={test.id} className="lab-order-chip">
                  {test.testName} • ₹{test.price}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="lab-order-modal__footer">
          <button
            type="button"
            className="lab-order-btn lab-order-btn--secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="lab-order-btn lab-order-btn--primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Creating Order..." : "Create Lab Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabOrderModal;