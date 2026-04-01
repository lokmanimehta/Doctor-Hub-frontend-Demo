import React, { useState, useEffect } from "react";
import "./AddPrescriptionModal.css";

const AddPrescriptionModal = ({ patientId, onClose, onSave, editingData }) => {
  const [diagnosis, setDiagnosis] = useState(editingData?.diagnosis || "");
  const [medicines, setMedicines] = useState(
    editingData?.medicines || [
      { name: "", dosage: "", duration: "", instruction: "" },
    ]
  );
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  const handleAddMedicine = () => {
    setMedicines([
      ...medicines,
      { name: "", dosage: "", duration: "", instruction: "" },
    ]);
  };

  const handleRemoveMedicine = (index) => {
    const updated = medicines.filter((_, i) => i !== index);
    setMedicines(updated);
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleSave = () => {
    if (!diagnosis || medicines.length === 0) {
      setError("Diagnosis and medicines are required");
      return;
    }

    const newPrescription = {
      id: editingData ? editingData.id : Date.now(),
      patientId,
      date: new Date().toISOString().split("T")[0],
      diagnosis,
      doctorName: "You",
      medicines,
    };

    onSave(newPrescription, !!editingData);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>{editingData ? "Edit Prescription" : "Add Prescription"}</h3>

        {error && <p className="error-text">{error}</p>}

        <label>Diagnosis</label>
        <input
          type="text"
          placeholder="Enter diagnosis (e.g. Fever, Diabetes)"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
        />

        <label>Medicine Details</label>
        {medicines.map((med, index) => (
          <div key={index} className="medicine-group">
            <input
              type="text"
              placeholder="Medicine Name"
              value={med.name}
              onChange={(e) => handleMedicineChange(index, "name", e.target.value)}
            />
            <input
              type="text"
              placeholder="Dosage"
              value={med.dosage}
              onChange={(e) => handleMedicineChange(index, "dosage", e.target.value)}
            />
            <input
              type="text"
              placeholder="Duration"
              value={med.duration}
              onChange={(e) => handleMedicineChange(index, "duration", e.target.value)}
            />
            <input
  type="text"
  placeholder="Instruction (after meal etc)"
  value={med.instruction}
  onChange={(e) =>
    handleMedicineChange(index, "instruction", e.target.value)
  }
/>
            <button type="button" onClick={() => handleRemoveMedicine(index)}>
              Remove
            </button>
          </div>
        ))}

        <button className="add-medicine-btn" onClick={handleAddMedicine}>
          + Add Another Medicine
        </button>

        {/* Action buttons ek hi line me fixed width ke saath */}
        <div className="modal-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="save-btn" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPrescriptionModal;