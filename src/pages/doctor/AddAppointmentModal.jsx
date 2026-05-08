import React, { useEffect, useMemo, useState } from "react";
import "./AddAppointmentModal.css";
import {
  getDoctorProfile,
  getDoctorDayAvailability
} from "../../services/doctorService";

const formatDateToInput = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatTimeToHHmm = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
};

const buildTimestampFromDateAndTime = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) return null;

  const combined = new Date(`${dateValue}T${timeValue}`);
  if (Number.isNaN(combined.getTime())) return null;

  return combined.getTime();
};

const AddAppointmentModal = ({
  onClose,
  onSave,
  patient,
  editingAppointment,
  prefillAppointmentData = null
}) => {
  const [appointmentDate, setAppointmentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  const [selectedClinicId, setSelectedClinicId] = useState("");
  const [clinics, setClinics] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(false);

  const [dayAvailability, setDayAvailability] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotTime, setSelectedSlotTime] = useState("");

  const sourceAppointment = editingAppointment || prefillAppointmentData || null;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    if (sourceAppointment?.appointmentDateTime) {
      setAppointmentDate(formatDateToInput(sourceAppointment.appointmentDateTime));
      setSelectedSlotTime(formatTimeToHHmm(sourceAppointment.appointmentDateTime));
      setNotes(sourceAppointment.notes || "");
      setIsCritical(Boolean(sourceAppointment.isCritical));
    } else {
      setAppointmentDate("");
      setSelectedSlotTime("");
      setNotes("");
      setIsCritical(false);
    }
  }, [sourceAppointment]);

  useEffect(() => {
    const loadClinics = async () => {
      if (patient?.doctorClinicId) {
        setSelectedClinicId(String(patient.doctorClinicId));
        return;
      }

      try {
        setLoadingClinics(true);
        setError("");

        const doctorProfile = await getDoctorProfile();

        const activeClinics = Array.isArray(doctorProfile?.clinics)
          ? doctorProfile.clinics.filter((clinic) => clinic?.isActive !== false)
          : [];

        setClinics(activeClinics);

        if (editingAppointment?.doctorClinicId) {
          setSelectedClinicId(String(editingAppointment.doctorClinicId));
        } else if (prefillAppointmentData?.doctorClinicId) {
          setSelectedClinicId(String(prefillAppointmentData.doctorClinicId));
        } else if (activeClinics.length === 1) {
          setSelectedClinicId(String(activeClinics[0].id));
        } else {
          setSelectedClinicId("");
        }
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load doctor clinics"
        );
      } finally {
        setLoadingClinics(false);
      }
    };

    loadClinics();
  }, [patient, editingAppointment, prefillAppointmentData]);

  useEffect(() => {
    const loadDayAvailability = async () => {
      if (!selectedClinicId || !appointmentDate) {
        setDayAvailability(null);
        return;
      }

      try {
        setLoadingSlots(true);
        setError("");

        const response = await getDoctorDayAvailability(
          Number(selectedClinicId),
          appointmentDate
        );

        setDayAvailability(response || null);
      } catch (err) {
        setDayAvailability(null);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load available slots"
        );
      } finally {
        setLoadingSlots(false);
      }
    };

    loadDayAvailability();
  }, [selectedClinicId, appointmentDate]);

  const selectedClinicName = useMemo(() => {
    if (patient?.doctorClinicId) {
      return patient?.clinicName || "Assigned Clinic";
    }

    const matchedClinic = clinics.find(
      (clinic) => String(clinic.id) === String(selectedClinicId)
    );

    return matchedClinic?.clinicName || "";
  }, [patient, clinics, selectedClinicId]);

  const slotOptions = useMemo(() => {
    const apiSlots = Array.isArray(dayAvailability?.slots) ? dayAvailability.slots : [];

    if (
      editingAppointment?.appointmentDateTime &&
      appointmentDate === formatDateToInput(editingAppointment.appointmentDateTime)
    ) {
      const existingTime = formatTimeToHHmm(editingAppointment.appointmentDateTime);

      const alreadyPresent = apiSlots.some((slot) => slot.startTime === existingTime);

      if (!alreadyPresent && existingTime) {
        return [
          {
            startTime: existingTime,
            endTime: "",
            displayTime: new Date(editingAppointment.appointmentDateTime).toLocaleTimeString(
              "en-IN",
              {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
              }
            ),
            status: "BOOKED",
            canToggle: true,
            isEditingCurrentSlot: true
          },
          ...apiSlots
        ];
      }
    }

    return apiSlots;
  }, [dayAvailability, editingAppointment, appointmentDate]);

  const availableOrSelectableSlots = useMemo(() => {
    return slotOptions.filter((slot) => {
      if (slot?.isEditingCurrentSlot) return true;
      return slot?.status === "AVAILABLE";
    });
  }, [slotOptions]);

  const handleSave = async () => {
    try {
      setError("");

      if (!appointmentDate) {
        setError("Appointment date is required");
        return;
      }

      const resolvedClinicId = patient?.doctorClinicId || selectedClinicId;

      if (!resolvedClinicId) {
        setError("Please select clinic for this appointment.");
        return;
      }

      if (!selectedSlotTime) {
        setError("Please select an appointment slot.");
        return;
      }

      const appointmentDateTime = buildTimestampFromDateAndTime(
        appointmentDate,
        selectedSlotTime
      );

      if (!appointmentDateTime) {
        setError("Invalid appointment date or slot");
        return;
      }

      if (appointmentDateTime < Date.now()) {
        setError("Appointment date and time cannot be in the past");
        return;
      }

      const payload = {
        appointmentDateTime,
        doctorClinicId: Number(resolvedClinicId),
        isCritical,
        notes: notes.trim()
      };

      setSaving(true);
      await onSave(payload);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save appointment"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="appt-modal-overlay" onClick={onClose}>
      <div className="appt-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="appt-modal-close"
          onClick={onClose}
          disabled={saving}
          aria-label="Close appointment modal"
        >
          ×
        </button>

        <div className="appt-modal-header">
          <div className="appt-modal-header-left">
            <p className="appt-modal-eyebrow">Patient Appointment</p>
            <h3>
              {editingAppointment ? "Edit Appointment" : "Schedule New Appointment"}
            </h3>
          </div>

          <p className="appt-modal-subtext">
            {patient?.fullName
              ? `Create a clinic-based appointment for ${patient.fullName}.`
              : "Create a clinic-based appointment for this patient."}
          </p>
        </div>

        {error && <div className="appt-modal-error">{error}</div>}

        <div className="appt-modal-body">
          <div className="appt-form-group">
            <label>Patient</label>
            <div className="appt-readonly-box">
              {patient?.fullName || "N/A"}
            </div>
          </div>

          <div className="appt-form-grid appt-form-grid--top">
            <div className="appt-form-group">
              <label>Appointment Date</label>
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => {
                  setAppointmentDate(e.target.value);
                  if (
                    !editingAppointment ||
                    e.target.value !==
                      formatDateToInput(editingAppointment.appointmentDateTime)
                  ) {
                    setSelectedSlotTime("");
                  }
                }}
                disabled={saving}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="appt-form-group">
              <label>Clinic</label>

              {patient?.doctorClinicId ? (
                <>
                  <div className="appt-readonly-box">
                    {patient?.clinicName || "N/A"}
                  </div>
                  <p className="appt-readonly-subtext">
                    Appointment will be scheduled in patient&apos;s assigned clinic.
                  </p>
                </>
              ) : (
                <>
                  <select
                    value={selectedClinicId}
                    onChange={(e) => {
                      setSelectedClinicId(e.target.value);
                      setSelectedSlotTime("");
                    }}
                    disabled={saving || loadingClinics}
                  >
                    <option value="">
                      {loadingClinics ? "Loading clinics..." : "Select clinic"}
                    </option>

                    {clinics.map((clinic) => (
                      <option key={clinic.id} value={clinic.id}>
                        {clinic.clinicName}
                      </option>
                    ))}
                  </select>

                  <p className="appt-readonly-subtext">
                    Patient has no assigned clinic. Please choose one for this appointment.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="appt-form-group">
            <div className="appt-slot-header">
              <div>
                <label>Select Slot</label>
                <p className="appt-slot-subtext">
                  Available slots are loaded from doctor availability for selected clinic and date.
                </p>
              </div>

              {selectedClinicName && (
                <span className="appt-clinic-pill">{selectedClinicName}</span>
              )}
            </div>

            {loadingSlots ? (
              <div className="appt-slot-state">Loading slots...</div>
            ) : !appointmentDate ? (
              <div className="appt-slot-state">Please choose a date first.</div>
            ) : !selectedClinicId && !patient?.doctorClinicId ? (
              <div className="appt-slot-state">Please select clinic first.</div>
            ) : availableOrSelectableSlots.length === 0 ? (
              <div className="appt-slot-state">
                No available slots found for selected clinic and date.
              </div>
            ) : (
              <div className="appt-slot-grid">
                {availableOrSelectableSlots.map((slot) => {
                  const isSelected = selectedSlotTime === slot.startTime;

                  return (
                    <button
                      key={`${slot.startTime}-${slot.endTime || "edit-current"}`}
                      type="button"
                      className={`appt-slot-chip ${
                        isSelected ? "appt-slot-chip--active" : ""
                      } ${
                        slot.isEditingCurrentSlot
                          ? "appt-slot-chip--editing"
                          : ""
                      }`}
                      onClick={() => setSelectedSlotTime(slot.startTime)}
                      disabled={saving}
                    >
                      <span className="appt-slot-chip__time">
                        {slot.displayTime}
                      </span>

                      <span className="appt-slot-chip__meta">
                        {slot.isEditingCurrentSlot ? "Current Slot" : "Available"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="appt-form-group">
            <label className="appt-checkbox-row">
              <input
                type="checkbox"
                checked={isCritical}
                onChange={(e) => setIsCritical(e.target.checked)}
                disabled={saving}
                className="appt-checkbox-input"
              />
              <div className="appt-checkbox-content">
                <span className="appt-checkbox-title">
                  Mark as Critical Appointment
                </span>
                <span className="appt-checkbox-subtext">
                  Use this when this appointment needs urgent attention.
                </span>
              </div>
            </label>
          </div>

          <div className="appt-form-group">
            <label>Notes (Optional)</label>
            <textarea
              placeholder="Add short appointment notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <div className="appt-modal-actions">
          <button
            type="button"
            className="appt-modal-btn appt-modal-btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="appt-modal-btn appt-modal-btn-primary"
            onClick={handleSave}
            disabled={saving || loadingClinics || loadingSlots}
          >
            {saving
              ? "Saving..."
              : editingAppointment
              ? "Update Appointment"
              : "Save Appointment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddAppointmentModal;