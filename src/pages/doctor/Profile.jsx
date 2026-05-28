import React, { useState, useEffect, useMemo, useRef } from "react";

import "./Profile.css";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  getDoctorProfile,
  updateDoctorProfile,
  deleteDoctorDocument
} from "../../services/doctorService";
import defaultDoctorAvatar from "../../assets/images/avtar.png";
/* =========================================================
   PROFILE COMPLETION CALCULATION
     ========================================================= */
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const TIME_OPTIONS = [
  "12:00 AM", "12:30 AM",
  "01:00 AM", "01:30 AM",
  "02:00 AM", "02:30 AM",
  "03:00 AM", "03:30 AM",
  "04:00 AM", "04:30 AM",
  "05:00 AM", "05:30 AM",
  "06:00 AM", "06:30 AM",
  "07:00 AM", "07:30 AM",
  "08:00 AM", "08:30 AM",
  "09:00 AM", "09:30 AM",
  "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM",
  "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM",
  "07:00 PM", "07:30 PM",
  "08:00 PM", "08:30 PM",
  "09:00 PM", "09:30 PM",
  "10:00 PM", "10:30 PM",
  "11:00 PM", "11:30 PM"
];
const calculateProfileCompletion = (form = {}, files = {}) => {
  const hasValue = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  };



  const hasValidClinicBasic =
    Array.isArray(form.clinics) &&
    form.clinics.some(
      (clinic) =>
        hasValue(clinic?.clinicName) &&
        hasValue(clinic?.clinicAddress) &&
        hasValue(clinic?.city) &&
        hasValue(clinic?.consultationFee)
    );

  const hasValidClinicAvailability =
    Array.isArray(form.clinics) &&
    form.clinics.some(
      (clinic) =>
        Array.isArray(clinic?.availability) &&
        clinic.availability.some(
          (slot) =>
            Array.isArray(slot?.days) && slot.days.length > 0 &&
            hasValue(slot?.startTime) &&
            hasValue(slot?.endTime)
        )
    );

  const hasValidVisitingBasic =
    Array.isArray(form.visitingPositions) &&
    form.visitingPositions.some(
      (vp) =>
        hasValue(vp?.location) &&
        hasValue(vp?.city) &&
        hasValue(vp?.fees)
    );

  const hasValidVisitingAvailability =
    Array.isArray(form.visitingPositions) &&
    form.visitingPositions.some(
      (vp) =>
        Array.isArray(vp?.availability) &&
        vp.availability.some(
          (slot) =>
            Array.isArray(slot?.days) && slot.days.length > 0 &&
            hasValue(slot?.startTime) &&
            hasValue(slot?.endTime)
        )
    );

  const hasGovtId =
    (Array.isArray(files?.govtIds) &&
      files.govtIds.some((id) => hasValue(id?.type) && hasValue(id?.file))) ||
    (Array.isArray(form?.govtIds) && form.govtIds.length > 0);

  const hasCertificate =
    (Array.isArray(files?.certificates) &&
      files.certificates.some(
        (cert) => hasValue(cert?.title) && hasValue(cert?.file)
      )) ||
    (Array.isArray(form?.certificates) && form.certificates.length > 0);

  const hasProfileImage =
    hasValue(form.profilePic) || hasValue(form.profilePictureUrl);

  const hasSignature =
    hasValue(files?.signature) ||
    hasValue(form?.signature?.fileUrl) ||
    hasValue(form?.signature?.fileName) ||
    hasValue(form?.signature);



  let score = 0;

  // BASIC INFO = 30
  if (hasValue(form.fullName)) score += 5;
  if (hasValue(form.email)) score += 5;
  if (hasValue(form.mobile)) score += 5;
  if (hasValue(form.gender)) score += 5;
  if (hasValue(form.description)) score += 5;
  if (hasProfileImage) score += 5;

  // PROFESSIONAL INFO = 30
  if (Array.isArray(form.specializations) && form.specializations.length > 0) score += 7;
  if (Array.isArray(form.degrees) && form.degrees.length > 0) score += 7;
  if (hasValue(form.experienceYears)) score += 6;
  if (hasValue(form.councilName)) score += 4;
  if (hasValue(form.registrationNumber)) score += 3;
  if (hasValue(form.registrationYear)) score += 3;

  // PRACTICE INFO = 20
  if (hasValidClinicBasic) score += 8;
  if (hasValidClinicAvailability) score += 6;
  if (hasValidVisitingBasic) score += 3;
  if (hasValidVisitingAvailability) score += 3;

  // DOCUMENTS = 20
  if (hasSignature) score += 6;
  if (hasGovtId) score += 7;
  if (hasCertificate) score += 7;

  if (score > 100) return 100;
  if (score < 0) return 0;
  return score;
};

/* =========================================================
   EMPTY STRUCTURES
   ========================================================= */

const EMPTY_CLINIC = {
  clinicName: "",
  clinicAddress: "",
  consultationFee: "",
  city: "",
  state: "",
  pincode: "",
  contactNumber: "",
  landmark: "",
  isPrimary: false,
  availability: [{ days: [], startTime: "", endTime: "" }],
};

const EMPTY_VISITING = {
  location: "",
  fees: "",
  city: "",
  state: "",
  pincode: "",
  designation: "",
  departmentName: "",
  startDate: "",
  endDate: "",
  currentlyActive: true,
  availability: [{ days: [], startTime: "", endTime: "" }],
};

const EMPTY_FILES = {
  signature: null,
  govtIds: [{ type: "", file: null }],
  certificates: [{ title: "", file: null }],
};

/* =========================================================
   HELPERS
   ========================================================= */

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const getSafeDoctorImage = (url) => {
  if (!url || typeof url !== "string") return defaultDoctorAvatar;

  if (url.includes("localhost:8080")) {
    return defaultDoctorAvatar;
  }

  return url;
};

const getDocumentUploadErrorMessage = (err) => {
  const backendMessage = normalizeErrorMessage(err);

  if (
    backendMessage?.toLowerCase().includes("maximum upload size") ||
    backendMessage?.toLowerCase().includes("max upload size") ||
    backendMessage?.toLowerCase().includes("too large") ||
    backendMessage?.toLowerCase().includes("size")
  ) {
    return "File size must be less than 10 MB";
  }

  if (err?.message === "Network Error") {
    return "Upload failed. Please check if the file is less than 10 MB and try again.";
  }

  return backendMessage || "Document upload failed";
};
const normalizeErrorMessage = (err) => {
  if (!err) return "Something went wrong";

  if (typeof err === "string") return err;

  if (err.response?.data?.message && typeof err.response.data.message === "string") {
    return err.response.data.message;
  }

  if (err.response?.data?.error && typeof err.response.data.error === "string") {
    return err.response.data.error;
  }

  if (err.message && typeof err.message === "string") return err.message;

  if (typeof err === "object") {
    const values = Object.values(err);
    if (values.length > 0) {
      if (typeof values[0] === "string") return values[0];

      if (typeof values[0] === "object" && values[0] !== null) {
        const nestedValues = Object.values(values[0]);
        if (nestedValues.length > 0 && typeof nestedValues[0] === "string") {
          return nestedValues[0];
        }
      }
    }
  }

  return "Something went wrong";
};

const toInputDateValue = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(Number(timestamp));
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fromInputDateToTimestamp = (value) => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const normalizeDayForBackend = (day) => {
  if (!day) return "";
  return day.trim().toUpperCase();
};

const normalizeTimeForBackend = (time) => {
  if (!time) return "";
  return time.length === 5 ? `${time}:00` : time;
};
const roundTimeToNearest15Min = (value) => {
  if (!value || !value.includes(":")) return value;

  const [hourStr, minuteStr] = value.split(":");
  let hours = Number(hourStr);
  let minutes = Number(minuteStr);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value;
  }

  const totalMinutes = hours * 60 + minutes;
  const roundedTotalMinutes = Math.round(totalMinutes / 15) * 15;

  const normalizedHours = Math.floor(roundedTotalMinutes / 60) % 24;
  const normalizedMinutes = roundedTotalMinutes % 60;

  return `${String(normalizedHours).padStart(2, "0")}:${String(
    normalizedMinutes
  ).padStart(2, "0")}`;
};

const isEndTimeAfterStartTime = (startTime, endTime) => {
  if (!startTime || !endTime) return true;
  const convertToMinutes = (time) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  return convertToMinutes(endTime) > convertToMinutes(startTime);
};
const hasOverlappingSlots = (availability = []) => {
  const convertToMinutes = (time) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  for (let i = 0; i < availability.length; i++) {
    for (let j = i + 1; j < availability.length; j++) {
      const slotA = availability[i];
      const slotB = availability[j];

      const commonDays = slotA.days.filter((day) =>
        slotB.days.includes(day)
      );

      if (commonDays.length === 0) continue;

      const aStart = convertToMinutes(slotA.startTime);
      const aEnd = convertToMinutes(slotA.endTime);

      const bStart = convertToMinutes(slotB.startTime);
      const bEnd = convertToMinutes(slotB.endTime);

      const overlaps = aStart < bEnd && bStart < aEnd;

      if (overlaps) {
        return true;
      }
    }
  }

  return false;
};

const mapApiClinicToUi = (clinic = {}) => {
  const groupedAvailability = {};

  if (Array.isArray(clinic.availabilitySlots)) {
    clinic.availabilitySlots.forEach((slot) => {
      const startTime = slot.startTime ? slot.startTime.substring(0, 5) : "";
      const endTime = slot.endTime ? slot.endTime.substring(0, 5) : "";

      const key = `${startTime}_${endTime}`;

      if (!groupedAvailability[key]) {
        groupedAvailability[key] = {
          days: [],
          startTime,
          endTime,
        };
      }

      const day = slot.dayOfWeek
        ? slot.dayOfWeek.charAt(0).toUpperCase() +
          slot.dayOfWeek.slice(1).toLowerCase()
        : "";

      if (day && !groupedAvailability[key].days.includes(day)) {
        groupedAvailability[key].days.push(day);
      }
    });
  }

  return {
    id: clinic.id || null,
    clinicName: clinic.clinicName || "",
    clinicAddress: clinic.addressLine1 || "",
    consultationFee:
      clinic.consultationFee !== undefined && clinic.consultationFee !== null
        ? String(clinic.consultationFee)
        : "",
    city: clinic.city || "",
    state: clinic.state || "",
    pincode: clinic.pincode || "",
    contactNumber: clinic.contactNumber || "",
    landmark: clinic.landmark || "",
    isPrimary: clinic.isPrimary || false,
    availability:
      Object.values(groupedAvailability).length > 0
        ? Object.values(groupedAvailability)
        : [{ days: [], startTime: "", endTime: "" }],
  };
};

const isPreviewImage = (contentType = "", fileUrl = "") => {
  const normalized = (contentType || "").toLowerCase();
  if (
    normalized.includes("image/jpeg") ||
    normalized.includes("image/jpg") ||
    normalized.includes("image/png") ||
    normalized.includes("image/webp")
  ) {
    return true;
  }

  const lowerUrl = (fileUrl || "").toLowerCase();
  return (
    lowerUrl.endsWith(".jpg") ||
    lowerUrl.endsWith(".jpeg") ||
    lowerUrl.endsWith(".png") ||
    lowerUrl.endsWith(".webp")
  );
};

const isPreviewPdf = (contentType = "", fileUrl = "") => {
  const normalized = (contentType || "").toLowerCase();
  if (normalized.includes("application/pdf")) {
    return true;
  }

  return (fileUrl || "").toLowerCase().endsWith(".pdf");
};
const mapApiVisitingToUi = (vp = {}) => {
  return {
    id: vp.id || null,
    location: vp.institutionName || "",
    fees: vp.consultationFee !== undefined && vp.consultationFee !== null ? String(vp.consultationFee) : "",
    city: vp.city || "",
    state: vp.state || "",
    pincode: vp.pincode || "",
    designation: vp.designation || "",
    departmentName: vp.departmentName || "",
    startDate: toInputDateValue(vp.startDate),
    endDate: toInputDateValue(vp.endDate),
    currentlyActive: true,
    availability:
      Array.isArray(vp.availabilitySlots) && vp.availabilitySlots.length > 0
        ? vp.availabilitySlots.map((slot) => ({
          id: slot.id || null,
          days: [slot.dayOfWeek],
          startTime: slot.startTime ? slot.startTime.substring(0, 5) : "",
          endTime: slot.endTime ? slot.endTime.substring(0, 5) : "",
        }))
        : [{ days: [], startTime: "", endTime: "" }],
  };
};

const mapStoredUserToForm = (storedUser = {}) => {
  return {
    fullName: storedUser.fullName || "",
    email: storedUser.email || "",
    mobile: storedUser.mobile || storedUser.phone || "",
    description: storedUser.description || storedUser.about || "",
    experienceYears:
      storedUser.experienceYears !== undefined &&
        storedUser.experienceYears !== null
        ? String(storedUser.experienceYears)
        : storedUser.experience !== undefined &&
          storedUser.experience !== null
          ? String(storedUser.experience)
          : "",
    gender: storedUser.gender || "",
    councilName: storedUser.councilName || "",
    registrationNumber: storedUser.registrationNumber || "",
    registrationYear:
      storedUser.registrationYear !== undefined &&
        storedUser.registrationYear !== null
        ? String(storedUser.registrationYear)
        : "",
    profilePictureUrl: getSafeDoctorImage(storedUser.profilePictureUrl),
    specializations: toArray(
      storedUser.specializations || storedUser.specialization
    ),
    degrees: toArray(storedUser.degrees || storedUser.credentials),
    profilePic: storedUser.profilePic || null,
    clinics:
      Array.isArray(storedUser.clinics) && storedUser.clinics.length > 0
        ? storedUser.clinics
        : [{ ...EMPTY_CLINIC }],
    visitingPositions:
      Array.isArray(storedUser.visitingPositions) &&
        storedUser.visitingPositions.length > 0
        ? storedUser.visitingPositions
        : [],
    govtIds: Array.isArray(storedUser.govtIds) ? storedUser.govtIds : [],
    certificates: Array.isArray(storedUser.certificates) ? storedUser.certificates : [],
    signature: storedUser.signature || null,
  };
};

const mapApiResponseToForm = (apiData = {}, previousForm = null) => {
  return {
    fullName: apiData.fullName || "",
    email: apiData.email || "",
    mobile: apiData.mobile || "",
    description: apiData.description || "",
    experienceYears:
      apiData.experienceYears !== undefined && apiData.experienceYears !== null
        ? String(apiData.experienceYears)
        : "",
    gender: apiData.gender || "",
    councilName: apiData.councilName || "",
    registrationNumber: apiData.registrationNumber || "",
    registrationYear:
      apiData.registrationYear !== undefined && apiData.registrationYear !== null
        ? String(apiData.registrationYear)
        : "",
    profilePictureUrl: getSafeDoctorImage(apiData.profilePictureUrl),
    specializations: Array.isArray(apiData.specializations)
      ? apiData.specializations
      : [],
    degrees: Array.isArray(apiData.degrees) ? apiData.degrees : [],
    profilePic: previousForm?.profilePic || null,
    clinics:
      Array.isArray(apiData.clinics) && apiData.clinics.length > 0
        ? apiData.clinics.map(mapApiClinicToUi)
        : previousForm?.clinics && previousForm.clinics.length > 0
          ? previousForm.clinics
          : [{ ...EMPTY_CLINIC }],
    visitingPositions:
      Array.isArray(apiData.visitingPositions) && apiData.visitingPositions.length > 0
        ? apiData.visitingPositions.map(mapApiVisitingToUi)
        : previousForm?.visitingPositions || [],
    govtIds: Array.isArray(apiData.govtIds) ? apiData.govtIds : [],
    certificates: Array.isArray(apiData.certificates) ? apiData.certificates : [],
    signature: apiData.signature || null,
  };
};

const buildClinicPayload = (clinics = []) => {
  const uniqueClinics = new Set();

  return clinics
    .filter((clinic) => {
      const isValid =
        clinic &&
        clinic.clinicName?.trim() &&
        clinic.clinicAddress?.trim() &&
        clinic.city?.trim() &&
        clinic.consultationFee?.toString().trim();

      if (!isValid) return false;

      const key =
        clinic.clinicName.trim().toLowerCase() +
        "_" +
        clinic.city.trim().toLowerCase();

      if (uniqueClinics.has(key)) return false;

      uniqueClinics.add(key);
      return true;
    })
    .map((clinic) => ({
      id: clinic.id || null,
      clinicName: clinic.clinicName?.trim() || null,
      addressLine1: clinic.clinicAddress?.trim() || null,
      addressLine2: null,
      area: null,
      city: clinic.city?.trim() || null,
      state: clinic.state?.trim() || null,
      pincode: clinic.pincode ? clinic.pincode.replace(/\D/g, "").trim() : null,
      landmark: clinic.landmark?.trim() || null,
      contactNumber: clinic.contactNumber?.trim() || null,
      consultationFee:
        clinic.consultationFee !== "" && clinic.consultationFee !== null
          ? Number(clinic.consultationFee)
          : null,
      isPrimary: clinic.isPrimary === true,
      isActive: true,
      availabilitySlots: Array.isArray(clinic.availability)
        ? clinic.availability
          .filter(
            (slot) =>
              slot &&
              slot.days?.length > 0 &&
              slot.startTime?.trim() &&
              slot.endTime?.trim()
          )
          .flatMap((slot) =>
            slot.days.map((day) => ({
              dayOfWeek: normalizeDayForBackend(day),
              startTime: normalizeTimeForBackend(slot.startTime),
              endTime: normalizeTimeForBackend(slot.endTime),
              slotDurationMinutes: 15,
              maxPatientsPerSlot: 4,
              isActive: true,
            }))
          )
        : [],
    }));
};

const buildVisitingPayload = (visitingPositions = []) => {
  return visitingPositions
    .filter(
      (vp) =>
        vp &&
        (vp.location?.trim() ||
          vp.designation?.trim() ||
          vp.city?.trim() ||
          vp.fees?.toString().trim())
    )
    .map((vp) => ({
      institutionName: vp.location?.trim() || "Unknown Hospital",
      designation: vp.designation?.trim() || "Visiting Consultant",
      departmentName: vp.departmentName?.trim() || null,

      addressLine1: vp.location?.trim() || null,
      addressLine2: null,
      area: null,
      city: vp.city?.trim() || null,
      state: vp.state?.trim() || null,
      pincode: vp.pincode ? vp.pincode.replace(/\D/g, "").trim() : null,
      consultationFee:
        vp.fees !== "" && vp.fees !== null && vp.fees !== undefined
          ? Number(vp.fees)
          : null,
      startDate: vp.startDate ? fromInputDateToTimestamp(vp.startDate) : null,
      endDate: vp.endDate ? fromInputDateToTimestamp(vp.endDate) : null,
      currentlyActive: true,
      notes: null,
      isActive: true,
      availabilitySlots: Array.isArray(vp.availability)
        ? vp.availability
          .filter(
            (slot) =>
              slot &&
              slot.days?.length > 0 &&
              slot.startTime?.trim() &&
              slot.endTime?.trim()
          )
          .flatMap((slot) =>
            slot.days.map((day) => ({
              dayOfWeek: normalizeDayForBackend(day),
              startTime: normalizeTimeForBackend(slot.startTime),
              endTime: normalizeTimeForBackend(slot.endTime),
              slotDurationMinutes: 30,
              isActive: true,
            }))
          )
        : [],
    }));

};

/* =========================================================
   COMPONENT
   ========================================================= */

const DoctorProfile = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("currentUser")) || {};

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [specializationsInput, setSpecializationsInput] = useState("");
  const [degreesInput, setDegreesInput] = useState("");

  const [form, setForm] = useState(() => mapStoredUserToForm(storedUser));

  const [files, setFiles] = useState(EMPTY_FILES);
  const [allStates, setAllStates] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState({});
  const cityDebounceRef = useRef(null);
  const [popup, setPopup] = useState({
    show: false,
    type: "",
    message: "",
  });

  const completionForm = useMemo(() => {
    return {
      ...form,
      profilePic: form.profilePic || form.profilePictureUrl,
    };
  }, [form]);

  const profileCompletion = calculateProfileCompletion(completionForm, files);
  const isProfileComplete = profileCompletion >= 80;
  const isVerified = storedUser.adminApproved === true;

  /* =========================================================
     POPUP
     ========================================================= */
  const [previewModal, setPreviewModal] = useState({
    open: false,
    fileUrl: "",
    fileName: "",
    contentType: "",
    title: "",
  });
  const openDocumentPreview = (doc) => {
    if (!doc?.fileUrl) {
      showPopup("error", "Preview file not available");
      return;
    }

    setPreviewModal({
      open: true,
      fileUrl: doc.fileUrl,
      fileName: doc.fileName || "Document Preview",
      contentType: doc.contentType || "",
      title: doc.documentLabel || doc.fileName || "Document Preview",
    });
  };

  const closeDocumentPreview = () => {
    setPreviewModal({
      open: false,
      fileUrl: "",
      fileName: "",
      contentType: "",
      title: "",
    });
  };

  const handleDeleteUploadedDocument = async ({
    documentId,
    category,
    successMessage,
  }) => {
    try {
      await deleteDoctorDocument(documentId);

      setForm((prev) => {
        if (category === "signature") {
          return {
            ...prev,
            signature: null,
          };
        }

        return {
          ...prev,
          [category]: Array.isArray(prev[category])
            ? prev[category].filter((item) => item.id !== documentId)
            : prev[category],
        };
      });

      if (previewModal.open && documentId) {
        closeDocumentPreview();
      }

      showPopup("success", successMessage);
    } catch (err) {
      showPopup("error", getDocumentUploadErrorMessage(err));
    }
  };
  const showPopup = (type, message) => {
    setPopup({
      show: true,
      type,
      message,
    });
  };

  useEffect(() => {
    if (popup.show) {
      const timer = setTimeout(() => {
        setPopup((prev) => ({ ...prev, show: false }));
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [popup.show]);

  /* =========================================================
     LOAD PROFILE
     ========================================================= */

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        setLoadingProfile(true);

        const data = await getDoctorProfile();

        setForm((prev) => mapApiResponseToForm(data, prev));
        setSpecializationsInput((data.specializations || []).join(", "));
        setDegreesInput((data.degrees || []).join(", "));

        const latestStoredUser =
          JSON.parse(localStorage.getItem("currentUser")) || {};

        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            ...latestStoredUser,
            fullName: data.fullName || "",
            email: data.email || "",
            mobile: data.mobile || "",
            phone: data.mobile || "",
            description: data.description || "",
            about: data.description || "",
            experienceYears:
              data.experienceYears !== undefined && data.experienceYears !== null
                ? data.experienceYears
                : "",
            experience:
              data.experienceYears !== undefined && data.experienceYears !== null
                ? data.experienceYears
                : "",
            gender: data.gender || "",
            councilName: data.councilName || "",
            registrationNumber: data.registrationNumber || "",
            registrationYear:
              data.registrationYear !== undefined &&
                data.registrationYear !== null
                ? data.registrationYear
                : "",
            profilePictureUrl: data.profilePictureUrl || "",
            specializations: data.specializations || [],
            specialization: data.specializations || [],
            degrees: data.degrees || [],
            credentials: data.degrees || [],
            govtIds: data.govtIds || [],
            certificates: data.certificates || [],
            signature: data.signature || null,
          })
        );

        window.dispatchEvent(new Event("storage"));
      } catch (err) {
        showPopup(
          "error",
          normalizeErrorMessage(err) || "Failed to load profile"
        );

      } finally {
        setLoadingProfile(false);
      }
    };

    fetchDoctorProfile();
  }, []);

  useEffect(() => {
    api.get("/locations/states").then(res => setAllStates(res.data)).catch(() => { });
  }, []);
  const handleCitySearch = (value, key) => {
    clearTimeout(cityDebounceRef.current);
    if (value.length >= 1) {
      cityDebounceRef.current = setTimeout(async () => {
        try {
          const res = await api.get(`/locations/cities?query=${value}`);
          setCitySuggestions(prev => ({ ...prev, [key]: res.data }));
        } catch {

          // city search failed silently
        }
      }, 300);
    } else {
      setCitySuggestions(prev => ({ ...prev, [key]: [] }));
    }
  };
  /* =========================================================
     FORM BASIC HANDLERS
     ========================================================= */

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const parseCommaSeparatedInput = (value) => {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };
  useEffect(() => {
    return () => {
      if (form.profilePic?.startsWith("blob:")) {
        URL.revokeObjectURL(form.profilePic);
      }
    };
  }, [form.profilePic]);
  /* =========================================================
     PROFILE IMAGE HANDLERS
     ========================================================= */

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setForm((prev) => ({
      ...prev,
      profilePic: previewUrl,
    }));


    try {
      setUploadingProfileImage(true);

      const imageFormData = new FormData();
      imageFormData.append("file", file);

      const res = await api.post("/doctor/profile/image", imageFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const fileUrl = res?.data?.profilePictureUrl || "";

      if (!fileUrl) {
        throw new Error("Image upload response did not return file URL");
      }

      setForm((prev) => ({
        ...prev,
        profilePic: fileUrl,
        profilePictureUrl: fileUrl,
      }));

      showPopup("success", "Profile image uploaded successfully");
    } catch (err) {
      setForm((prev) => ({
        ...prev,
        profilePic: prev.profilePictureUrl || null,
      }));
      showPopup(
        "error",
        normalizeErrorMessage(err) ||
        "Image upload backend not ready or upload failed"
      );
    } finally {
      setUploadingProfileImage(false);
    }
  };

  /* =========================================================
     FILE HANDLERS
     ========================================================= */

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const sizeError = validateDocumentFileSize(file);

    if (sizeError) {
      e.target.value = "";
      showPopup("error", sizeError);
      return;
    }

    setFiles((prev) => ({
      ...prev,
      [e.target.name]: file,
    }));
  };

  const handleFileArrayChange = (index, e, category) => {
    const newArr = [...files[category]];

    if (e.target.type === "file") {
      const file = e.target.files[0] || null;

      if (file) {
        const sizeError = validateDocumentFileSize(file);

        if (sizeError) {
          e.target.value = "";
          showPopup("error", sizeError);
          return;
        }
      }

      newArr[index].file = file;
    } else {
      const field = category === "govtIds" ? "type" : "title";
      newArr[index][field] = e.target.value;
    }

    setFiles((prev) => ({
      ...prev,
      [category]: newArr,
    }));
  };

  /* =========================================================
     CLINIC HANDLERS
     ========================================================= */

  const addClinic = () => {
    setForm((prev) => ({
      ...prev,
      clinics: [...prev.clinics, { ...EMPTY_CLINIC }],
    }));
  };

  const removeClinic = (index) => {
    const newClinics = [...form.clinics];
    newClinics.splice(index, 1);

    setForm((prev) => ({
      ...prev,
      clinics: newClinics.length > 0 ? newClinics : [{ ...EMPTY_CLINIC }],
    }));
  };

  const handleClinicChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const newClinics = [...form.clinics];
    newClinics[index][name] = type === "checkbox" ? checked : value;

    setForm((prev) => ({
      ...prev,
      clinics: newClinics,
    }));
  };

  const addAvailability = (clinicIndex) => {
    const newClinics = [...form.clinics];
    newClinics[clinicIndex].availability.push({
      days: [],
      startTime: "",
      endTime: "",
    });

    setForm((prev) => ({
      ...prev,
      clinics: newClinics,
    }));
  };

  const handleAvailabilityChange = (clinicIndex, index, e) => {
    const { name, value } = e.target;
    const newClinics = [...form.clinics];

    let nextValue = value;

    if (name === "startTime" || name === "endTime") {
      nextValue = roundTimeToNearest15Min(value);
    }

    newClinics[clinicIndex].availability[index][name] = nextValue;

    const currentSlot = newClinics[clinicIndex].availability[index];
    const startTime = currentSlot.startTime;
    const endTime = currentSlot.endTime;

    if (
      startTime &&
      endTime &&
      !isEndTimeAfterStartTime(startTime, endTime)
    ) {
      showPopup("error", "Clinic end time must be greater than start time");
      return;
    }

    setForm((prev) => ({
      ...prev,
      clinics: newClinics,
    }));
  };

  const removeAvailability = (clinicIndex, index) => {
    const newClinics = [...form.clinics];
    newClinics[clinicIndex].availability.splice(index, 1);

    if (newClinics[clinicIndex].availability.length === 0) {
      newClinics[clinicIndex].availability.push({
        days: [],
        startTime: "",
        endTime: "",
      });
    }

    setForm((prev) => ({
      ...prev,
      clinics: newClinics,
    }));
  };

  /* =========================================================
     VISITING HANDLERS
     ========================================================= */

  const addVisiting = () => {
    setForm((prev) => ({
      ...prev,
      visitingPositions: [...prev.visitingPositions, { ...EMPTY_VISITING }],
    }));
  };

  const removeVisiting = (index) => {
    const newPositions = [...form.visitingPositions];
    newPositions.splice(index, 1);

    setForm((prev) => ({
      ...prev,
      visitingPositions: newPositions,
    }));
  };

  const handleVisitingChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const newPositions = [...form.visitingPositions];

    newPositions[index][name] = type === "checkbox" ? checked : value;

    if (name === "currentlyActive" && checked) {
      newPositions[index].endDate = "";
    }

    setForm((prev) => ({
      ...prev,
      visitingPositions: newPositions,
    }));
  };

  const addVisitingAvailability = (vpIndex) => {
    const newPositions = [...form.visitingPositions];
    newPositions[vpIndex].availability.push({
      days: [],
      startTime: "",
      endTime: "",
    });

    setForm((prev) => ({
      ...prev,
      visitingPositions: newPositions,
    }));
  };

  const handleVisitingAvailabilityChange = (vpIndex, index, e) => {
    const { name, value } = e.target;
    const newPositions = [...form.visitingPositions];

    let nextValue = value;

    if (name === "startTime" || name === "endTime") {
      nextValue = roundTimeToNearest15Min(value);
    }

    newPositions[vpIndex].availability[index][name] = nextValue;

    const currentSlot = newPositions[vpIndex].availability[index];
    const startTime = currentSlot.startTime;
    const endTime = currentSlot.endTime;

    if (
      startTime &&
      endTime &&
      !isEndTimeAfterStartTime(startTime, endTime)
    ) {
      showPopup("error", "Visiting end time must be greater than start time");
      return;
    }

    setForm((prev) => ({
      ...prev,
      visitingPositions: newPositions,
    }));
  };
  const removeVisitingAvailability = (vpIndex, index) => {
    const newPositions = [...form.visitingPositions];
    newPositions[vpIndex].availability.splice(index, 1);

    if (newPositions[vpIndex].availability.length === 0) {
      newPositions[vpIndex].availability.push({
        days: [],
        startTime: "",
        endTime: "",
      });
    }

    setForm((prev) => ({
      ...prev,
      visitingPositions: newPositions,
    }));
  };

  /* =========================================================
     DOCUMENT HANDLERS
     ========================================================= */

  const addGovtId = () => {
    setFiles((prev) => ({
      ...prev,
      govtIds: [...prev.govtIds, { type: "", file: null }],
    }));
  };

  const removeGovtId = (index) => {
    const newGovtIds = [...files.govtIds];
    newGovtIds.splice(index, 1);

    setFiles((prev) => ({
      ...prev,
      govtIds: newGovtIds.length > 0 ? newGovtIds : [{ type: "", file: null }],
    }));
  };

  const addCert = () => {
    setFiles((prev) => ({
      ...prev,
      certificates: [...prev.certificates, { title: "", file: null }],
    }));
  };

  const removeCert = (index) => {
    const newCerts = [...files.certificates];
    newCerts.splice(index, 1);

    setFiles((prev) => ({
      ...prev,
      certificates: newCerts.length > 0 ? newCerts : [{ title: "", file: null }],
    }));
  };

  /* =========================================================
     DOCUMENT UPLOAD HELPERS
     ========================================================= */
  const MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  const getReadableFileSizeLimitText = () => {
    return "File should be less than 10 MB";
  };

  const validateDocumentFileSize = (file) => {
    if (!file) return null;

    if (file.size > MAX_DOCUMENT_FILE_SIZE) {
      return "File size must be less than 10 MB";
    }

    return null;
  };
  const uploadSingleDocument = async ({
    file,
    documentType,
    documentLabel,
    documentNumber,
    issuingAuthority,
    issueDate,
    expiryDate,
    isPrimary,
  }) => {
    const sizeError = validateDocumentFileSize(file);
    if (sizeError) {
      throw new Error(sizeError);
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);

    if (documentLabel) formData.append("documentLabel", documentLabel);
    if (documentNumber) formData.append("documentNumber", documentNumber);
    if (issuingAuthority) formData.append("issuingAuthority", issuingAuthority);
    if (issueDate) formData.append("issueDate", issueDate);
    if (expiryDate) formData.append("expiryDate", expiryDate);
    if (isPrimary !== undefined && isPrimary !== null) {
      formData.append("isPrimary", String(isPrimary));
    }

    return api.post("/doctor/profile/documents", formData);
  };

  const uploadAllDocuments = async () => {
    const uploadPromises = [];

    // Signature
    if (files.signature instanceof File) {
      uploadPromises.push(
        uploadSingleDocument({
          file: files.signature,
          documentType: "SIGNATURE",
          isPrimary: true,
        })
      );
    }

    // Govt IDs
    for (const item of files.govtIds || []) {
      if (item?.file instanceof File && item?.type) {
        uploadPromises.push(
          uploadSingleDocument({
            file: item.file,
            documentType: "GOVT_ID",
            documentLabel: item.type,
            isPrimary: true,
          })
        );
      }
    }

    // Certificates
    for (const item of files.certificates || []) {
      if (item?.file instanceof File && item?.title) {
        uploadPromises.push(
          uploadSingleDocument({
            file: item.file,
            documentType: "OTHER_CERTIFICATE",
            documentLabel: item.title,
            isPrimary: false,
          })
        );
      }
    }

    if (uploadPromises.length > 0) {
      await Promise.all(uploadPromises);
    }
  };

  /* =========================================================
     SAVE PROFILE
     ========================================================= */

  const handleSubmit = async (e) => {
    const safeProfilePictureUrl =
      typeof form.profilePictureUrl === "string" &&
        form.profilePictureUrl.length <= 500
        ? form.profilePictureUrl
        : null;
    e.preventDefault();
    const selectedPrimaryClinics = form.clinics.filter(
      (clinic) => clinic.isPrimary === true
    );

    if (selectedPrimaryClinics.length > 1) {
      showPopup("error", "Only one primary clinic is allowed");
      return;
    }
    const parsedSpecializations = parseCommaSeparatedInput(specializationsInput);
    const parsedDegrees = parseCommaSeparatedInput(degreesInput);

    if (!form.fullName.trim()) {
      showPopup("error", "Full Name is required");
      return;
    }

    if (!form.email.trim()) {
      showPopup("error", "Email is required");
      return;
    }

    if (!form.mobile.trim()) {
      showPopup("error", "Mobile number is required");
      return;
    }

    if (parsedSpecializations.length === 0) {
      showPopup("error", "At least one specialization is required");
      return;
    }

    if (parsedDegrees.length === 0) {
      showPopup("error", "At least one degree is required");
      return;
    }
    for (const clinic of form.clinics || []) {
      if (clinic?.pincode) {
        const cleanPincode = clinic.pincode.replace(/\D/g, "").trim();
        if (cleanPincode.length !== 6) {
          showPopup("error", "Clinic pincode must be exactly 6 digits");
          return;
        }
      }
    }

    for (const vp of form.visitingPositions || []) {
      if (vp?.pincode) {
        const cleanPincode = vp.pincode.replace(/\D/g, "").trim();
        if (cleanPincode.length !== 6) {
          showPopup("error", "Visiting pincode must be exactly 6 digits");
          return;
        }
      }
    }

    for (const clinic of form.clinics) {
      if (hasOverlappingSlots(clinic.availability)) {
        showPopup(
          "error",
          "Clinic availability slots cannot overlap"
        );
        return;
      }
    }
    for (const vp of form.visitingPositions || []) {
      const hasAnyData =
        vp?.location?.trim() ||
        vp?.designation?.trim() ||
        vp?.city?.trim() ||
        vp?.fees?.toString().trim();

      if (hasAnyData) {
        if (!vp.location || !vp.location.trim()) {
          showPopup("error", "Visiting hospital name is required");
          return;
        }

        if (!vp.designation || !vp.designation.trim()) {
          showPopup("error", "Designation is required");
          return;
        }
      }
    }
    for (const vp of form.visitingPositions || []) {
      const hasAnyVisitingData =
        vp?.location?.trim() ||
        vp?.designation?.trim() ||
        vp?.city?.trim() ||
        vp?.fees?.toString().trim();

      if (hasAnyVisitingData) {
        if (!vp.location || !vp.location.trim()) {
          showPopup("error", "Visiting hospital name is required");
          return;
        }
      }
    }

    const latestStoredUser =
      JSON.parse(localStorage.getItem("currentUser")) || {};
    const oldEmail = latestStoredUser.email || "";

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      mobile: form.mobile.trim(),
      description: form.description.trim() || null,
      experienceYears:
        form.experienceYears !== "" ? Number(form.experienceYears) : null,
      gender: form.gender || null,
      councilName: form.councilName.trim() || null,
      registrationNumber: form.registrationNumber.trim() || null,
      registrationYear:
        form.registrationYear !== "" ? Number(form.registrationYear) : null,
      profilePictureUrl: safeProfilePictureUrl || null,
      specializations: parsedSpecializations,
      degrees: parsedDegrees,
      clinics: buildClinicPayload(form.clinics),
      visitingPositions: buildVisitingPayload(form.visitingPositions),

    };
    

    try {
      setSavingProfile(true);

      const updated = await updateDoctorProfile(payload);

      await uploadAllDocuments();

      const refreshedProfile = await getDoctorProfile();

      setForm((prev) => mapApiResponseToForm(refreshedProfile, prev));
      setSpecializationsInput((refreshedProfile.specializations || []).join(", "));
      setDegreesInput((refreshedProfile.degrees || []).join(", "));

      const updatedUserData = {
        ...latestStoredUser,
        fullName: refreshedProfile.fullName || updated.fullName || "",
        email: refreshedProfile.email || updated.email || "",
        mobile: refreshedProfile.mobile || updated.mobile || "",
        phone: refreshedProfile.mobile || updated.mobile || "",
        description: refreshedProfile.description || updated.description || "",
        about: refreshedProfile.description || updated.description || "",
        experienceYears:
          refreshedProfile.experienceYears !== undefined &&
            refreshedProfile.experienceYears !== null
            ? refreshedProfile.experienceYears
            : "",
        experience:
          refreshedProfile.experienceYears !== undefined &&
            refreshedProfile.experienceYears !== null
            ? refreshedProfile.experienceYears
            : "",
        gender: refreshedProfile.gender || updated.gender || "",
        councilName: refreshedProfile.councilName || updated.councilName || "",
        registrationNumber:
          refreshedProfile.registrationNumber || updated.registrationNumber || "",
        registrationYear:
          refreshedProfile.registrationYear !== undefined &&
            refreshedProfile.registrationYear !== null
            ? refreshedProfile.registrationYear
            : "",
        profilePictureUrl:
          refreshedProfile.profilePictureUrl || updated.profilePictureUrl || "",
        specializations:
          refreshedProfile.specializations || updated.specializations || [],
        specialization:
          refreshedProfile.specializations || updated.specializations || [],
        degrees: refreshedProfile.degrees || updated.degrees || [],
        clinics: refreshedProfile.clinics || [],
        visitingPositions: refreshedProfile.visitingPositions || [],
        credentials: refreshedProfile.degrees || updated.degrees || [],
        govtIds: refreshedProfile.govtIds || [],
        certificates: refreshedProfile.certificates || [],
        signature: refreshedProfile.signature || null,

      };

      localStorage.setItem("currentUser", JSON.stringify(updatedUserData));
      window.dispatchEvent(new Event("storage"));

      setFiles(EMPTY_FILES);

      showPopup("success", "Profile updated successfully!");
      setIsEditing(false);

      if (
        oldEmail &&
        updated.email &&
        oldEmail.toLowerCase() !== updated.email.toLowerCase()
      ) {
        setTimeout(() => {
          sessionStorage.removeItem("accessToken");
          sessionStorage.removeItem("refreshToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("currentUser");
          localStorage.removeItem("selectedProfile");
          navigate("/login");
        }, 1500);
        return;
      }
    } catch (err) {
      showPopup(
        "error",
        getDocumentUploadErrorMessage(err)
      );

    } finally {
      setSavingProfile(false);
    }
  };
  /* =========================================================
     DERIVED VALUES
     ========================================================= */

  const profilePreviewImage =
    form.profilePic || getSafeDoctorImage(form.profilePictureUrl);

  if (loadingProfile) {
    return (
      <div className="doctor-profile-page">
        <div className="section">
          <h4>Loading profile...</h4>
          <p className="profile-subtext">
            Please wait while we fetch your doctor profile.
          </p>
        </div>
      </div>
    );
  }


  /* =========================================================
    UI
    ========================================================= */

  return (
    <div className="doctor-profile-page">
      <div className="profile-top-header">


        {!isEditing && (
          <button
            className="edit-profile-btn"
            onClick={() => {
              setIsEditing(true);
              setSpecializationsInput(form.specializations?.join(", ") || "");
              setDegreesInput(form.degrees?.join(", ") || "");
            }}
          >
            Edit Profile
          </button>
        )}
      </div>

      {isEditing ? (
        <form className="profile-form" onSubmit={handleSubmit}>
          {/* PROFILE IMAGE SECTION */}
          <div className="section photo-upload-section">
            <h4>Profile Picture</h4>

            <div className="photo-upload-container">
              <div className="photo-preview">
                {profilePreviewImage ? (
                  <img
                    src={profilePreviewImage}
                    alt="Profile"
                    className="avatar-img"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = defaultDoctorAvatar;
                    }}
                  />
                ) : (
                  <span className="default-avatar">👨‍⚕️</span>
                )}
              </div>

              <div className="photo-input-group">
                <label className="custom-file-upload">
                  {uploadingProfileImage ? "Uploading..." : "Choose Photo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* BASIC INFORMATION */}
          <div className="section">
            <h4>Basic Information</h4>

            <div className="input-grid">
              <div>
                <label>Full Name *</label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Gender</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div className="input-grid">
              <div>
                <label>Specializations *</label>
                <input
                  name="specializationsInput"
                  value={specializationsInput}
                  placeholder="e.g. Cardiology, General Physician"
                  onChange={(e) => setSpecializationsInput(e.target.value)}
                  required
                />
                <p className="subtext">
                  Can Add Multiple specializations by using comma.
                </p>
              </div>

              <div>
                <label>Degrees *</label>
                <input
                  name="degreesInput"
                  value={degreesInput}
                  placeholder="e.g. MBBS, MD"
                  onChange={(e) => setDegreesInput(e.target.value)}
                  required
                />
                <p className="subtext">
                  Can Add  Multiple degrees by using comma.
                </p>
              </div>
            </div>

            <div className="input-grid">
              <div>
                <label>Experience (Years)</label>
                <input
                  type="number"
                  name="experienceYears"
                  value={form.experienceYears}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              <div>
                <label>Mobile Number *</label>
                <input
                  name="mobile"
                  value={form.mobile}
                  placeholder="Enter 10-digit mobile number"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-grid">
              <div>
                <label>Email Address *</label>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Medical Council Name</label>
                <input
                  name="councilName"
                  value={form.councilName}
                  placeholder="Enter your Medical Council"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="input-grid">
              <div>
                <label>Registration Number</label>
                <input
                  name="registrationNumber"
                  value={form.registrationNumber}
                  placeholder="Registration number"
                  onChange={handleChange}
                />
              </div>

              <div>
                <label>Registration Year</label>
                <input
                  type="number"
                  name="registrationYear"
                  value={form.registrationYear}
                  placeholder="YYYY"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label>About Me</label>
              <textarea
                name="description"
                value={form.description}
                placeholder="Brief about your medical career..."
                onChange={handleChange}
              />
            </div>
          </div>

          {/* CLINIC LOCATIONS */}
          <div className="section">
            <h4>Clinic Information</h4>

            {form.clinics.map((clinic, index) => (
              <div key={index} className="multi-entry-block">
                <div className="entry-header">
                  <p className="entry-tag">Clinic #{index + 1}</p>
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeClinic(index)}
                  >
                    Remove Clinic
                  </button>
                </div>

                <div className="form-field">
                  <label>Clinic Name</label>
                  <input
                    name="clinicName"
                    value={clinic.clinicName}
                    onChange={(e) => handleClinicChange(index, e)}
                  />
                </div>

                <label>Clinic Address</label>
                <textarea
                  name="clinicAddress"
                  value={clinic.clinicAddress}
                  onChange={(e) => handleClinicChange(index, e)}
                />
                <label>Clinic Contact Number</label>
                <input
                  type="text"
                  name="contactNumber"
                  value={clinic.contactNumber}
                  onChange={(e) => handleClinicChange(index, e)}
                  placeholder="Enter 10-digit clinic contact number"
                  maxLength={10}
                />
                <label>City *</label>
                <div className="relative-field">
                  <input
                    type="text"
                    name="city"
                    value={clinic.city}
                    autoComplete="off"
                    placeholder="Type city name..."
                    onChange={(e) => {
                      handleClinicChange(index, e);
                      handleCitySearch(e.target.value, `clinic_${index}`);
                    }}
                    onBlur={() => setTimeout(() => setCitySuggestions(prev => ({ ...prev, [`clinic_${index}`]: [] })), 200)}
                  />
                  {citySuggestions[`clinic_${index}`]?.length > 0 && (
                    <div className="city-dropdown">
                      {citySuggestions[`clinic_${index}`].map(city => (
                        <div
                          key={city.id}
                          className="city-dropdown-item"
                          onMouseDown={() => {
                            handleClinicChange(index, { target: { name: "city", value: city.name } });
                            if (city.state?.name) {
                              handleClinicChange(index, { target: { name: "state", value: city.state.name } });
                            }
                            setCitySuggestions(prev => ({ ...prev, [`clinic_${index}`]: [] }));
                          }}
                        >
                          {city.name}
                          {city.state && <span className="city-dropdown-state">{city.state.name}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <label>State</label>
                <select
                  name="state"
                  value={clinic.state}
                  onChange={(e) => handleClinicChange(index, e)}
                >
                  <option value="">Select State</option>
                  {allStates.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>

                <label>Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={clinic.pincode}
                  onChange={(e) => handleClinicChange(index, e)}
                  placeholder="Enter 6-digit pincode"
                  maxLength={6}
                />
                <label>Landmark</label>
                <input
                  type="text"
                  name="landmark"
                  value={clinic.landmark || ""}
                  onChange={(e) => handleClinicChange(index, e)}
                  placeholder="Enter nearby landmark"
                />

                <label>Consultation Fee (₹)</label>
                <input
                  type="number"
                  name="consultationFee"
                  value={clinic.consultationFee}
                  onChange={(e) => handleClinicChange(index, e)}
                />

                <p className="sub-label-header">Availability</p>

                {clinic.availability.map((slot, i) => (
                  <div key={i} className="availability-row">
                    <div>
                      <label>Select Days</label>

                      <div className="days-checkbox-group">
                        {DAYS.map((day) => (
                          <label key={day} className="day-checkbox">
                            <input
                              type="checkbox"
                              checked={slot.days?.includes(day)}
                              onChange={(e) => {
                                const updatedDays = e.target.checked
                                  ? [...(slot.days || []), day]
                                  : (slot.days || []).filter((d) => d !== day);

                                handleAvailabilityChange(index, i, {
                                  target: {
                                    name: "days",
                                    value: updatedDays,
                                  },
                                });
                              }}
                            />

                            <span>{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="time-field">
                      <label>Start Time</label>
                      <input
                        type="time"
                        name="startTime"
                        value={slot.startTime}
                        onChange={(e) => handleAvailabilityChange(index, i, e)}
                        className="time-input"
                        step="900"
                      />
                    </div>

                    <div className="time-field">
                      <label>End Time</label>
                      <input
                        type="time"
                        name="endTime"
                        value={slot.endTime}
                        onChange={(e) => handleAvailabilityChange(index, i, e)}
                        className="time-input"
                        step="900"
                      />
                    </div>
                    <div className="availability-remove-wrap">
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeAvailability(index, i)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="add-more-btn"
                  onClick={() => addAvailability(index)}
                >
                  + Add Time Slot
                </button>
              </div>
            ))}

            <button type="button" className="add-more-btn" onClick={addClinic}>
              + Add Another Clinic
            </button>
          </div>

          {/* VISITING FACULTY */}
          <div className="section">
            <h4>Visiting Faculty Info</h4>

            {form.visitingPositions.map((vp, index) => (
              <div key={index} className="multi-entry-block">
                <div className="entry-header">
                  <p className="entry-tag">Visiting Location #{index + 1}</p>
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeVisiting(index)}
                  >
                    Remove Visiting
                  </button>
                </div>

                <div className="input-grid-basic">
                  <div>
                    <label>Visiting Location</label>
                    <input
                      name="location"
                      value={vp.location}
                      placeholder="Hospital Name"
                      onChange={(e) => handleVisitingChange(index, e)}
                    />
                  </div>
                  <div>
                    <label>City</label>
                    <div className="relative-field">
                      <input
                        type="text"
                        name="city"
                        value={vp.city}
                        autoComplete="off"
                        placeholder="Type city name..."
                        onChange={(e) => {
                          handleVisitingChange(index, e);
                          handleCitySearch(e.target.value, `visiting_${index}`);
                        }}
                        onBlur={() => setTimeout(() => setCitySuggestions(prev => ({ ...prev, [`visiting_${index}`]: [] })), 200)}
                      />
                      {citySuggestions[`visiting_${index}`]?.length > 0 && (
                        <div className="city-dropdown">
                          {citySuggestions[`visiting_${index}`].map(city => (
                            <div
                              key={city.id}
                              className="city-dropdown-item"
                              onMouseDown={() => {
                                handleVisitingChange(index, { target: { name: "city", value: city.name } });
                                if (city.state?.name) {
                                  handleVisitingChange(index, { target: { name: "state", value: city.state.name } });
                                }
                                setCitySuggestions(prev => ({ ...prev, [`visiting_${index}`]: [] }));
                              }}
                            >
                              {city.name}
                              {city.state && <span className="city-dropdown-state">{city.state.name}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label>State</label>
                    <select
                      name="state"
                      value={vp.state}
                      onChange={(e) => handleVisitingChange(index, e)}
                    >
                      <option value="">Select State</option>
                      {allStates.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Designation</label>
                    <input
                      name="designation"
                      value={vp.designation}
                      onChange={(e) => handleVisitingChange(index, e)}
                      placeholder="e.g. Visiting Consultant"
                    />
                  </div>
                  <div>
                    <label>Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={vp.pincode}
                      onChange={(e) => handleVisitingChange(index, e)}
                      placeholder="Enter 6-digit pincode"
                      maxLength={6}
                    />
                  </div>
                  <div>
                    <label>Fee (₹)</label>
                    <input
                      type="number"
                      name="fees"
                      value={vp.fees}
                      onChange={(e) => handleVisitingChange(index, e)}
                    />
                  </div>
                  <div className="visiting-meta-row">
                    <div className="visiting-meta-field">
                      <label className="visiting-meta-label">Start Date</label>
                      <input
                        type="date"
                        name="startDate"
                        value={vp.startDate || ""}
                        onChange={(e) => handleVisitingChange(index, e)}
                        className="visiting-meta-input"
                      />
                      <p className="visiting-meta-hint">
                        When you started practicing here.
                      </p>
                    </div>

                    <div className="visiting-meta-toggle-wrap">
                      <label className="visiting-toggle-card">
                        <input
                          type="checkbox"
                          checked={!!vp.currentlyActive}
                          onChange={(e) =>
                            handleVisitingChange(index, {
                              target: {
                                name: "currentlyActive",
                                type: "checkbox",
                                checked: e.target.checked,
                                value: e.target.checked,
                              },
                            })
                          }
                        />

                        <span className="visiting-toggle-check">
                          {vp.currentlyActive && <span className="visiting-toggle-tick">✓</span>}
                        </span>

                        <div className="visiting-toggle-copy">
                          <span className="visiting-toggle-title">Currently practicing here</span>
                          <span className="visiting-toggle-subtitle">
                            Mark this as your active hospital.
                          </span>
                        </div>
                      </label>
                    </div>

                    <div className="visiting-meta-field">
                      <label className="visiting-meta-label">End Date</label>
                      <input
                        type="date"
                        name="endDate"
                        value={vp.endDate || ""}
                        onChange={(e) => handleVisitingChange(index, e)}
                        className="visiting-meta-input"
                        disabled={!!vp.currentlyActive}
                      />
                      <p className="visiting-meta-hint">
                        {vp.currentlyActive
                          ? "Disabled because this is marked as your current hospital."
                          : "When you stopped practicing here."}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="sub-label-header">Availability</p>

                {(vp.availability || []).map((slot, i) => (
                  <div key={i} className="availability-row">
                    <div>
                      <label>Select Days</label>

                      <div className="days-checkbox-group">
                        {DAYS.map((day) => (
                          <label key={day} className="day-checkbox">
                            <input
                              type="checkbox"
                              checked={slot.days?.includes(day)}
                              onChange={(e) => {
                                const updatedDays = e.target.checked
                                  ? [...(slot.days || []), day]
                                  : (slot.days || []).filter((d) => d !== day);

                                handleVisitingAvailabilityChange(index, i, {
                                  target: {
                                    name: "days",
                                    value: updatedDays,
                                  },
                                });
                              }}
                            />

                            <span>{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="time-field">
                      <label>Start Time</label>
                      <input
                        type="time"
                        name="startTime"
                        value={slot.startTime}
                        onChange={(e) => handleVisitingAvailabilityChange(index, i, e)}
                        className="time-input"
                        step="900"
                      />
                    </div>

                    <div className="time-field">
                      <label>End Time</label>
                      <input
                        type="time"
                        name="endTime"
                        value={slot.endTime}
                        onChange={(e) => handleVisitingAvailabilityChange(index, i, e)}
                        className="time-input"
                        step="900"
                      />
                    </div>
                    <div className="availability-remove-wrap">
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeVisitingAvailability(index, i)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="add-more-btn"
                  onClick={() => addVisitingAvailability(index)}
                >
                  + Add Time Slot
                </button>
              </div>
            ))}

            <button
              type="button"
              className="add-more-btn"
              onClick={addVisiting}
            >
              + Add Visiting Hospital
            </button>
          </div>

          {/* VERIFICATION & DOCUMENTS */}
          <div className="section">
            <h4>Professional Verification Documents</h4>

            {/* ================= GOVT IDS ================= */}
            <p className="sub-label-header">Government Identity Proofs</p>

            {form.govtIds?.length > 0 && (
              <div className="uploaded-doc-section">
                <p className="subtext">Already uploaded Govt IDs</p>

                {[...new Map(
                  form.govtIds.map((doc) => [doc.id ?? `${doc.documentLabel}-${doc.fileName}`, doc])
                ).values()].map((doc) => (
                  <div key={doc.id} className="uploaded-doc-card">
                    <div className="uploaded-doc-main">
                      <div className="uploaded-doc-meta">
                        <p className="uploaded-doc-title">
                          {doc.documentLabel || "Government ID"}
                        </p>

                        <p className="uploaded-doc-file">
                          {doc.fileName || "Uploaded file"}
                        </p>

                        <div className="uploaded-doc-badges">
                          {doc.documentType && (
                            <span className="uploaded-doc-badge">
                              {doc.documentType.replaceAll("_", " ")}
                            </span>
                          )}

                          {doc.isPrimary && (
                            <span className="uploaded-doc-badge primary">
                              Primary
                            </span>
                          )}

                          {doc.verificationStatus && (
                            <span className="uploaded-doc-badge status">
                              {doc.verificationStatus.replaceAll("_", " ")}
                            </span>
                          )}
                        </div>
                      </div>


                      <div className="uploaded-doc-actions">
                        <button
                          type="button"
                          className="uploaded-doc-link"
                          onClick={() => openDocumentPreview(doc)}
                        >
                          Preview
                        </button>

                        <button
                          type="button"
                          className="uploaded-doc-delete"
                          onClick={() =>
                            handleDeleteUploadedDocument({
                              documentId: doc.id,
                              category: "govtIds",
                              successMessage: "Government ID deleted successfully",
                            })
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {files.govtIds.map((item, index) => (
              <div key={index} className="file-row">
                <select
                  value={item.type}
                  onChange={(e) => handleFileArrayChange(index, e, "govtIds")}
                >
                  <option value="">Select ID Type</option>
                  <option value="AADHAAR">Aadhaar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="VOTER_ID">Voter ID</option>
                  <option value="DRIVING_LICENSE">Driving License</option>
                  <option value="OTHER">Other Govt ID</option>
                </select>

                <input
                  type="file"
                  onChange={(e) => handleFileArrayChange(index, e, "govtIds")}
                />

                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeGovtId(index)}
                >
                  ❌
                </button>
                <p className="file-helper-text">
                  {getReadableFileSizeLimitText()}
                </p>
              </div>

            ))}

            <button type="button" className="add-more-btn" onClick={addGovtId}>
              + Add Another ID
            </button>

            {/* ================= CERTIFICATES ================= */}
            <p className="sub-label-header">Certificates (Degree/Registration)</p>

            {form.certificates?.length > 0 && (
              <div className="uploaded-doc-section">
                <p className="subtext">Already uploaded Certificates</p>

                {[...new Map(
                  form.certificates.map((doc) => [doc.id ?? `${doc.documentLabel}-${doc.fileName}`, doc])
                ).values()].map((doc) => (
                  <div key={doc.id} className="uploaded-doc-card">
                    <div className="uploaded-doc-main">
                      <div className="uploaded-doc-meta">
                        <p className="uploaded-doc-title">
                          {doc.documentLabel || "Certificate"}
                        </p>

                        <p className="uploaded-doc-file">
                          {doc.fileName || "Uploaded file"}
                        </p>

                        <div className="uploaded-doc-badges">
                          {doc.documentType && (
                            <span className="uploaded-doc-badge">
                              {doc.documentType.replaceAll("_", " ")}
                            </span>
                          )}

                          {doc.isPrimary && (
                            <span className="uploaded-doc-badge primary">
                              Primary
                            </span>
                          )}

                          {doc.verificationStatus && (
                            <span className="uploaded-doc-badge status">
                              {doc.verificationStatus.replaceAll("_", " ")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="uploaded-doc-actions">
                        <button
                          type="button"
                          className="uploaded-doc-link"
                          onClick={() => openDocumentPreview(doc)}
                        >
                          Preview
                        </button>

                        <button
                          type="button"
                          className="uploaded-doc-delete"
                          onClick={() =>
                            handleDeleteUploadedDocument({
                              documentId: doc.id,
                              category: "certificates",
                              successMessage: "Certificate deleted successfully",
                            })
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {files.certificates.map((item, index) => (
              <div key={index} className="file-row">
                <input
                  placeholder="Name (e.g. MBBS, MD, Fellowship)"
                  value={item.title}
                  onChange={(e) => handleFileArrayChange(index, e, "certificates")}
                />

                <input
                  type="file"
                  onChange={(e) => handleFileArrayChange(index, e, "certificates")}
                />

                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeCert(index)}
                >
                  ❌
                </button>
                <p className="file-helper-text">
                  {getReadableFileSizeLimitText()}
                </p>
              </div>
            ))}

            <button type="button" className="add-more-btn" onClick={addCert}>
              + Add More Certificates
            </button>

            {/* ================= SIGNATURE ================= */}
            <div className="signature-box">
              <label>Digital Signature</label>

              {form.signature?.fileUrl && (
                <div className="uploaded-doc-section signature-uploaded-section">
                  <p className="subtext">Already uploaded Signature</p>

                  <div className="uploaded-doc-card">
                    <div className="uploaded-doc-main">
                      <div className="uploaded-doc-meta">
                        <p className="uploaded-doc-title">
                          {form.signature.documentLabel || "Digital Signature"}
                        </p>

                        <p className="uploaded-doc-file">
                          {form.signature.fileName || "Uploaded signature file"}
                        </p>

                        <div className="uploaded-doc-badges">
                          {form.signature.documentType && (
                            <span className="uploaded-doc-badge">
                              {form.signature.documentType.replaceAll("_", " ")}
                            </span>
                          )}

                          {form.signature.isPrimary && (
                            <span className="uploaded-doc-badge primary">
                              Primary
                            </span>
                          )}

                          {form.signature.verificationStatus && (
                            <span className="uploaded-doc-badge status">
                              {form.signature.verificationStatus.replaceAll("_", " ")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="uploaded-doc-actions">
                        <button
                          type="button"
                          className="uploaded-doc-link"
                          onClick={() => openDocumentPreview(form.signature)}
                        >
                          Preview
                        </button>

                        <button
                          type="button"
                          className="uploaded-doc-delete"
                          onClick={() =>
                            handleDeleteUploadedDocument({
                              documentId: form.signature.id,
                              category: "signature",
                              successMessage: "Signature deleted successfully",
                            })
                          }
                        >
                          Delete
                        </button>
                      </div>
                      <p className="file-helper-text">
                        {getReadableFileSizeLimitText()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <input type="file" name="signature" onChange={handleFileChange} />

              <p className="subtext">
                Upload image of signature on white background.
              </p>
            </div>
          </div>

          <div className="form-buttons-fixed">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-btn"
              disabled={savingProfile}
            >
              {savingProfile ? "Saving..." : "Save & Update Profile"}
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-view-container">
          <div className="view-card">
            <div className="doctor-header-top">
              <div className="view-avatar">
                <img
                  src={profilePreviewImage}
                  alt="Dr."
                  className="avatar-img"
                />
              </div>

              <div className="view-title-group">
                <h3>
                  {form.fullName}
                  {isVerified && (
                    <span className="verified-check">✔ Verified</span>
                  )}
                </h3>

                <p className="view-spec">
                  {form.specializations.length > 0
                    ? form.specializations.join(", ")
                    : "No specialization added"}
                </p>

                <div className="view-tags">
                  <span>
                    {form.experienceYears
                      ? `${form.experienceYears} Years Experience`
                      : "Experience not added"}
                  </span>
                  <span>{form.gender || "Gender not added"}</span>
                  <span>⭐ 4.8 Rating</span>
                </div>
              </div>
            </div>

            <div className="view-about">
              <h4>About</h4>
              <p>
                {form.description ||
                  "Experienced physician dedicated to patient care..."}
              </p>
            </div>

            <div className="view-about">
              <h4>Degrees</h4>
              <p>
                {form.degrees.length > 0
                  ? form.degrees.join(", ")
                  : "No degrees added"}
              </p>
            </div>
          </div>

          <div className="view-grid">
            <div className="view-card info-sub-card">
              <h4>Contact & Verification</h4>
              <div className="detail-row">
                📧 <strong>Email:</strong> {form.email || "-"}
              </div>
              <div className="detail-row">
                📞 <strong>Phone:</strong> {form.mobile || "-"}
              </div>
              <hr
                style={{
                  border: "0",
                  borderTop: "1px dashed #eee",
                  margin: "15px 0",
                }}
              />
              <div className="detail-row">
                <strong>Council:</strong> {form.councilName || "-"}
              </div>
              <div className="detail-row">
                <strong>Reg No:</strong> {form.registrationNumber || "-"}
              </div>
              <div className="detail-row">
                <strong>Year:</strong> {form.registrationYear || "-"}
              </div>
            </div>

            <div className="view-card info-sub-card">
              <h4>Clinics ({form.clinics.length})</h4>
              {form.clinics.map((clinic, index) => (
                <div key={index} className="clinic-item">
                  <span className="fee-tag">
                    {clinic.consultationFee
                      ? `₹${clinic.consultationFee}`
                      : "₹0"}
                  </span>
                  <strong>{clinic.clinicName || "Clinic name not added"}</strong>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {clinic.clinicAddress || "Clinic address not added"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    Contact: {clinic.contactNumber || "-"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    Landmark: {clinic.landmark || "-"}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      marginTop: "5px",
                      color: "#10b981",
                    }}
                  >
                    ✔ CLINIC CERTIFIED
                  </div>
                </div>
              ))}
            </div>

            <div className="view-card info-sub-card">
              <h4>Visiting Positions</h4>
              {form.visitingPositions.length > 0 ? (
                form.visitingPositions.map((vp, index) => (
                  <div key={index} className="clinic-item">
                    <strong>{vp.location || "Location not added"}</strong>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Fee: ₹{vp.fees || 0}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Start Date: {vp.startDate || "-"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      End Date: {vp.endDate || (vp.currentlyActive ? "Currently Active" : "-")}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#10b981",
                        marginTop: "5px",
                      }}
                    >
                      HOSPITAL ENDORSED
                    </div>
                  </div>
                ))
              ) : (
                <p className="subtext">No positions added.</p>
              )}
            </div>
          </div>

          <div className="status-bar">
            ✔{" "}
            {isProfileComplete
              ? "Your profile is ready for patients"
              : "Complete your profile to go live"}{" "}
            | Completion: {profileCompletion}%
          </div>
        </div>
      )}

      {popup.show && (
        <div className={`popup ${popup.type}`}>
          <div className="popup-content">
            <p>{popup.message}</p>
            <button onClick={() => setPopup({ ...popup, show: false })}>
              OK
            </button>
          </div>
        </div>
      )}
      {previewModal.open && (
        <div className="doc-preview-overlay" onClick={closeDocumentPreview}>
          <div
            className="doc-preview-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="doc-preview-header">
              <div className="doc-preview-header-text">
                <h5>{previewModal.title || "Document Preview"}</h5>
                <p>{previewModal.fileName || "Preview file"}</p>
              </div>

              <button
                type="button"
                className="doc-preview-close"
                onClick={closeDocumentPreview}
              >
                ✕
              </button>
            </div>

            <div className="doc-preview-body">
              {isPreviewImage(previewModal.contentType, previewModal.fileUrl) ? (
                <img
                  src={previewModal.fileUrl}
                  alt={previewModal.fileName || "Document Preview"}
                  className="doc-preview-image"
                />
              ) : isPreviewPdf(previewModal.contentType, previewModal.fileUrl) ? (
                <iframe
                  src={previewModal.fileUrl}
                  title={previewModal.fileName || "PDF Preview"}
                  className="doc-preview-frame"
                />
              ) : (
                <div className="doc-preview-fallback">
                  <p>Preview is not supported for this file type.</p>
                  <a
                    href={previewModal.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="doc-preview-open-new"
                  >
                    Open in new tab
                  </a>
                </div>
              )}
            </div>

            <div className="doc-preview-footer">
              <a
                href={previewModal.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="doc-preview-secondary-btn"
              >
                Open in new tab
              </a>

              <button
                type="button"
                className="doc-preview-primary-btn"
                onClick={closeDocumentPreview}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorProfile;