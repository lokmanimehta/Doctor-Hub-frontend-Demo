import React, { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Availability.css";
import {
  getDoctorAvailabilityClinics,
  getDoctorDayAvailability,
  blockDoctorAvailabilityDay,
  unblockDoctorAvailabilityDay,
  blockDoctorAvailabilitySlot,
  unblockDoctorAvailabilitySlot
} from "../../services/doctorService";

const formatDateToApi = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (date) => {
  if (!date) return "";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const getStatusLabel = (status) => {
  if (status === "AVAILABLE") return "Available";
  if (status === "BLOCKED") return "Blocked";
  if (status === "BOOKED") return "Booked";
  if (status === "PAST") return "Past";
  return "Unknown";
};

const Availability = () => {
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [dayData, setDayData] = useState(null);

  const [loadingClinics, setLoadingClinics] = useState(true);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [pageError, setPageError] = useState("");
  const [toast, setToast] = useState(null);

  const apiDate = useMemo(() => formatDateToApi(selectedDate), [selectedDate]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });

    window.clearTimeout(window.__availabilityToastTimer);
    window.__availabilityToastTimer = window.setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const loadClinics = async () => {
    try {
      setLoadingClinics(true);
      setPageError("");

      const response = await getDoctorAvailabilityClinics();
      const clinicList = Array.isArray(response) ? response : [];

      setClinics(clinicList);

      if (clinicList.length > 0) {
        const primaryClinic =
          clinicList.find((clinic) => clinic?.isPrimary) || clinicList[0];
        setSelectedClinic(String(primaryClinic.id));
      } else {
        setSelectedClinic("");
      }
    } catch (err) {
      setPageError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load doctor clinics."
      );
    } finally {
      setLoadingClinics(false);
    }
  };

  const loadAvailability = async (clinicId, dateValue) => {
    if (!clinicId || !dateValue) {
      setDayData(null);
      return;
    }

    try {
      setLoadingAvailability(true);
      setPageError("");

      const response = await getDoctorDayAvailability(Number(clinicId), dateValue);
      setDayData(response || null);
    } catch (err) {
      setDayData(null);
      setPageError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load availability for selected date."
      );
    } finally {
      setLoadingAvailability(false);
    }
  };

  useEffect(() => {
    loadClinics();

    return () => {
      window.clearTimeout(window.__availabilityToastTimer);
    };
  }, []);

  useEffect(() => {
    if (selectedClinic && apiDate) {
      loadAvailability(selectedClinic, apiDate);
    }
  }, [selectedClinic, apiDate]);

  const selectedClinicDetails = useMemo(() => {
    return clinics.find((clinic) => String(clinic.id) === String(selectedClinic)) || null;
  }, [clinics, selectedClinic]);

  const editableSlots = useMemo(() => {
    if (!Array.isArray(dayData?.slots)) return [];
    return dayData.slots.filter(
      (slot) => slot?.status !== "BOOKED" && slot?.status !== "PAST"
    );
  }, [dayData]);

  const isFullDayBlocked = useMemo(() => {
    if (!editableSlots.length) return false;
    return editableSlots.every((slot) => slot?.status === "BLOCKED");
  }, [editableSlots]);

  const summaryStats = useMemo(() => {
    const slots = Array.isArray(dayData?.slots) ? dayData.slots : [];

    return {
      total: slots.length,
      available: slots.filter((slot) => slot.status === "AVAILABLE").length,
      blocked: slots.filter((slot) => slot.status === "BLOCKED").length,
      booked: slots.filter((slot) => slot.status === "BOOKED").length
    };
  }, [dayData]);

  const refreshAvailability = async () => {
    if (!selectedClinic || !apiDate) return;
    await loadAvailability(selectedClinic, apiDate);
  };

  const handleFullDayToggle = async () => {
    if (!selectedClinic || !apiDate || actionLoading) return;

    try {
      setActionLoading(true);

      const payload = {
        clinicId: Number(selectedClinic),
        date: apiDate
      };

      if (isFullDayBlocked) {
        await unblockDoctorAvailabilityDay(payload);
        showToast("Day unblocked successfully.", "success");
      } else {
        await blockDoctorAvailabilityDay(payload);
        showToast("Full day blocked successfully.", "warning");
      }

      await refreshAvailability();
    } catch (err) {
      showToast(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update day availability.",
        "warning"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleSlotToggle = async (slot) => {
    if (!slot || !slot.canToggle || actionLoading) return;

    try {
      setActionLoading(true);

      const payload = {
        clinicId: Number(selectedClinic),
        date: apiDate,
        startTime: slot.startTime,
        endTime: slot.endTime
      };

      if (slot.status === "AVAILABLE") {
        await blockDoctorAvailabilitySlot(payload);
        showToast(`${slot.displayTime} blocked successfully.`, "warning");
      } else if (slot.status === "BLOCKED") {
        await unblockDoctorAvailabilitySlot(payload);
        showToast(`${slot.displayTime} is available now.`, "success");
      }

      await refreshAvailability();
    } catch (err) {
      showToast(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update slot availability.",
        "warning"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const getSlotClassName = (slot) => {
    const status = slot?.status?.toLowerCase();

    if (status === "available") {
      return "availability-slot availability-slot--available";
    }

    if (status === "blocked") {
      return "availability-slot availability-slot--blocked";
    }

    if (status === "booked") {
      return "availability-slot availability-slot--booked";
    }

    if (status === "past") {
      return "availability-slot availability-slot--past";
    }

    return "availability-slot";
  };

  return (
    <div className="availability-page">
      <div className="availability-shell">
        <div className="availability-hero">
          <div className="availability-hero__content">
            <p className="availability-hero__eyebrow">Doctor Availability</p>
            <h1 className="availability-hero__title">Manage Daily Schedule</h1>
            <p className="availability-hero__subtitle">
              Select a clinic and date to view slots. Tap available slots to block
              them, or tap blocked slots to make them available again.
            </p>
          </div>
        </div>

        <div className="availability-panel availability-panel--filters">
          <div className="availability-field">
            <label htmlFor="availability-clinic">Clinic</label>
            <select
              id="availability-clinic"
              value={selectedClinic}
              onChange={(e) => setSelectedClinic(e.target.value)}
              disabled={loadingClinics || actionLoading}
            >
              <option value="">
                {loadingClinics ? "Loading clinics..." : "Select clinic"}
              </option>

              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.clinicName}
                  {clinic.city ? ` - ${clinic.city}` : ""}
                  {clinic.isPrimary ? " (Primary)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="availability-field">
            <label htmlFor="availability-date">Date</label>
            <DatePicker
              id="availability-date"
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="yyyy-MM-dd"
              className="availability-datepicker"
              minDate={new Date()}
              showPopperArrow={false}
              disabled={actionLoading}
              placeholderText="Choose date"
            />
          </div>
        </div>

        {pageError && (
          <div className="availability-panel availability-feedback availability-feedback--error">
            <p>{pageError}</p>
          </div>
        )}

        {!pageError && loadingAvailability && (
          <div className="availability-panel availability-feedback">
            <div className="availability-loader" />
            <p>Loading availability...</p>
          </div>
        )}

        {!pageError && !loadingAvailability && selectedClinic && dayData && (
          <>
            <div className="availability-panel availability-panel--overview">
              <div className="availability-overview__top">
                <div>
                  <p className="availability-overview__label">Selected Clinic</p>
                  <h2 className="availability-overview__clinic">
                    {dayData.clinicName || selectedClinicDetails?.clinicName || "N/A"}
                  </h2>
                  <p className="availability-overview__date">
                    {formatDisplayDate(selectedDate)} • {dayData.dayOfWeek || "N/A"}
                  </p>
                </div>

                <button
                  type="button"
                  className={`availability-day-button ${
                    isFullDayBlocked
                      ? "availability-day-button--unblock"
                      : "availability-day-button--block"
                  }`}
                  onClick={handleFullDayToggle}
                  disabled={
                    actionLoading ||
                    !Array.isArray(dayData?.slots) ||
                    dayData.slots.length === 0
                  }
                >
                  {actionLoading
                    ? "Please wait..."
                    : isFullDayBlocked
                    ? "Unblock Full Day"
                    : "Block Full Day"}
                </button>
              </div>

              <div className="availability-stats">
                <div className="availability-stat-card">
                  <span>Total Slots</span>
                  <strong>{summaryStats.total}</strong>
                </div>

                <div className="availability-stat-card availability-stat-card--available">
                  <span>Available</span>
                  <strong>{summaryStats.available}</strong>
                </div>

                <div className="availability-stat-card availability-stat-card--blocked">
                  <span>Blocked</span>
                  <strong>{summaryStats.blocked}</strong>
                </div>

                <div className="availability-stat-card availability-stat-card--booked">
                  <span>Booked</span>
                  <strong>{summaryStats.booked}</strong>
                </div>
              </div>
            </div>

            <div className="availability-panel availability-panel--legend">
              <div className="availability-legend-item">
                <span className="availability-legend-dot availability-legend-dot--available" />
                <span>Available</span>
              </div>

              <div className="availability-legend-item">
                <span className="availability-legend-dot availability-legend-dot--blocked" />
                <span>Blocked</span>
              </div>

              <div className="availability-legend-item">
                <span className="availability-legend-dot availability-legend-dot--booked" />
                <span>Booked</span>
              </div>

              <div className="availability-legend-item">
                <span className="availability-legend-dot availability-legend-dot--past" />
                <span>Past</span>
              </div>
            </div>

            <div className="availability-panel availability-panel--slots">
              <div className="availability-section-header">
                <div>
                  <h3>Time Slots</h3>
                  <p>
                    Doctor can directly manage slot availability from here.
                  </p>
                </div>
              </div>

              {!dayData.slots || dayData.slots.length === 0 ? (
                <div className="availability-empty-state">
                  <h3>No schedule found</h3>
                  <p>
                    No weekly availability is configured for this clinic on the
                    selected day.
                  </p>
                </div>
              ) : (
                <div className="availability-slots-grid">
                  {dayData.slots.map((slot) => (
                    <button
                      key={`${slot.startTime}-${slot.endTime}`}
                      type="button"
                      className={getSlotClassName(slot)}
                      onClick={() => handleSlotToggle(slot)}
                      disabled={!slot.canToggle || actionLoading}
                    >
                      <span className="availability-slot__time">
                        {slot.displayTime}
                      </span>
                      <span className="availability-slot__status">
                        {getStatusLabel(slot.status)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {!pageError &&
          !loadingAvailability &&
          !selectedClinic &&
          !loadingClinics && (
            <div className="availability-panel availability-empty-state">
              <h3>No clinic found</h3>
              <p>
                Please add at least one active clinic in doctor profile before
                managing availability.
              </p>
            </div>
          )}
      </div>

      {toast && (
        <div
          className={`availability-toast ${
            toast.type === "warning"
              ? "availability-toast--warning"
              : "availability-toast--success"
          }`}
        >
          <div className="availability-toast__content">
            <span className="availability-toast__icon">
              {toast.type === "warning" ? "⚠️" : "✅"}
            </span>
            <p>{toast.message}</p>
            <button
              type="button"
              className="availability-toast__close"
              onClick={() => setToast(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Availability;