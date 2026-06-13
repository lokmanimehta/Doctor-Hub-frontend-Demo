import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiAlertCircle,
  FiCalendar,
  FiCamera,
  FiCheckCircle,
  FiEdit2,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiShield,
  FiTrash2,
  FiUploadCloud,
  FiUser,
  FiUsers,
  FiX
} from "react-icons/fi";

import "./PatientProfile.css";
import { useProfile } from "../../context/useProfile";
import {
  addFamilyMember,
  deleteFamilyMember,
  getFamilyMembers,
  getPatientProfile,
  getPatientProfiles,
  requestPatientEmailOtp,
  updateFamilyMember,
  updatePatientAddress,
  updatePatientContact,
  updatePatientPassword,
  updatePatientProfile,
  uploadPatientProfileImage,
  verifyPatientEmailOtp
} from "../../services/patientService";

const emptyProfileForm = {
  fullName: "",
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  allergies: "",
  chronicConditions: "",
  medicalHistory: "",
  currentMedications: "",
  emergencyContactName: "",
  emergencyContactPhone: ""
};

const emptyContactForm = {
  mobile: "",
  newEmail: "",
  otp: ""
};

const emptyAddressForm = {
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: ""
};

const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
};

const emptyMemberForm = {
  id: null,
  fullName: "",
  relation: "",
  gender: "",
  dateOfBirth: "",
  bloodGroup: "",
  mobileNumber: ""
};

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const relations = [
  "Mother",
  "Father",
  "Brother",
  "Sister",
  "Spouse",
  "Son",
  "Daughter",
  "Grandfather",
  "Grandmother",
  "Other"
];

const mapProfileToForm = (data) => ({
  fullName: data?.fullName || "",
  dateOfBirth: data?.dateOfBirth || "",
  gender: data?.gender || "",
  bloodGroup: data?.bloodGroup || "",
  allergies: data?.allergies || "",
  chronicConditions: data?.chronicConditions || "",
  medicalHistory: data?.medicalHistory || "",
  currentMedications: data?.currentMedications || "",
  emergencyContactName: data?.emergencyContactName || "",
  emergencyContactPhone: data?.emergencyContactPhone || ""
});

const mapContactToForm = (data) => ({
  mobile: data?.mobile || "",
  newEmail: "",
  otp: ""
});

const mapAddressToForm = (data) => ({
  addressLine1: data?.addressLine1 || "",
  addressLine2: data?.addressLine2 || "",
  city: data?.city || "",
  state: data?.state || "",
  pincode: data?.pincode || ""
});

const PatientProfile = () => {
  const navigate = useNavigate();
  const imageInputRef = useRef(null);
  const { selectedProfile, selectProfile } = useProfile();

  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [contactForm, setContactForm] = useState(emptyContactForm);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [profiles, setProfiles] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingMember, setSavingMember] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [showPasswordPanel, setShowPasswordPanel] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberForm, setMemberForm] = useState(emptyMemberForm);

  const [message, setMessage] = useState({
    type: "",
    text: ""
  });

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });

    window.setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 3500);
  }, []);

  const loadPatientProfilePage = useCallback(async () => {
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const [profileResponse, profilesResponse, familyResponse] =
        await Promise.all([
          getPatientProfile(),
          getPatientProfiles(),
          getFamilyMembers()
        ]);

      setProfile(profileResponse);
      setProfileForm(mapProfileToForm(profileResponse));
      setContactForm(mapContactToForm(profileResponse));
      setAddressForm(mapAddressToForm(profileResponse));
      setProfiles(profilesResponse?.profiles || []);
      setFamilyMembers(Array.isArray(familyResponse) ? familyResponse : []);
    } catch (error) {
      showMessage("error", error.message || "Failed to load patient profile");
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    loadPatientProfilePage();
  }, [loadPatientProfilePage]);

  useEffect(() => {
    if (!loading && profiles.length > 0) {
      const exists = selectedProfile
        ? profiles.some(
            (item) =>
              String(item.id) === String(selectedProfile.id) &&
              item.type === selectedProfile.type
          )
        : false;

      if (!exists) {
        const self = profiles.find((item) => item.type === "SELF");
        if (self) selectProfile(self);
      }
    }
  }, [loading, profiles, selectedProfile, selectProfile]);

  useEffect(() => {
    document.body.style.overflow = showMemberModal ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showMemberModal]);

  const selectedKey = selectedProfile
    ? `${selectedProfile.type}-${selectedProfile.id}`
    : "";

  const selectedProfileFromList = useMemo(() => {
    if (!selectedProfile || profiles.length === 0) return null;

    return profiles.find(
      (item) =>
        String(item.id) === String(selectedProfile.id) &&
        item.type === selectedProfile.type
    );
  }, [profiles, selectedProfile]);

  const activeBookingProfile =
    selectedProfileFromList ||
    profiles.find((item) => item.type === "SELF") ||
    null;

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;

    const birthDate = new Date(dateOfBirth);
    if (Number.isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age -= 1;
    }

    return age >= 0 ? age : null;
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === "") return "Not added";
    return value;
  };

  const updateLocalCurrentUser = (updatedProfile) => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("currentUser")) || {};
      const updatedUser = {
        ...storedUser,
        fullName: updatedProfile?.fullName || storedUser.fullName,
        email: updatedProfile?.email || storedUser.email,
        mobile: updatedProfile?.mobile || storedUser.mobile
      };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    } catch {
      // Ignore local storage sync failure.
    }
  };

  const handleProfileInputChange = (field, value) => {
    setProfileForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContactInputChange = (field, value) => {
    setContactForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressInputChange = (field, value) => {
    setAddressForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordInputChange = (field, value) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    if (!profileForm.fullName.trim()) {
      showMessage("error", "Full name is required");
      return;
    }

    if (
      profileForm.emergencyContactPhone &&
      !/^[6-9]\d{9}$/.test(profileForm.emergencyContactPhone)
    ) {
      showMessage("error", "Emergency phone must be a valid 10-digit number");
      return;
    }

    try {
      setSavingProfile(true);

      const payload = {
        fullName: profileForm.fullName.trim(),
        dateOfBirth: profileForm.dateOfBirth || null,
        gender: profileForm.gender || "",
        bloodGroup: profileForm.bloodGroup || "",
        allergies: profileForm.allergies?.trim() || null,
        chronicConditions: profileForm.chronicConditions?.trim() || null,
        medicalHistory: profileForm.medicalHistory?.trim() || null,
        currentMedications: profileForm.currentMedications?.trim() || null,
        emergencyContactName: profileForm.emergencyContactName?.trim() || null,
        emergencyContactPhone: profileForm.emergencyContactPhone?.trim() || ""
      };

      const updatedProfile = await updatePatientProfile(payload);

      setProfile(updatedProfile);
      setProfileForm(mapProfileToForm(updatedProfile));
      updateLocalCurrentUser(updatedProfile);
      setIsEditingProfile(false);

      const profilesResponse = await getPatientProfiles();
      setProfiles(profilesResponse?.profiles || []);

      showMessage("success", "Profile updated successfully");
    } catch (error) {
      showMessage("error", error.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();

    if (!/^[6-9]\d{9}$/.test(contactForm.mobile)) {
      showMessage("error", "Mobile number must be a valid 10-digit number");
      return;
    }

    try {
      setSavingContact(true);

      const updatedProfile = await updatePatientContact({
        mobile: contactForm.mobile.trim()
      });

      setProfile(updatedProfile);
      setContactForm(mapContactToForm(updatedProfile));
      updateLocalCurrentUser(updatedProfile);
      setIsEditingContact(false);

      showMessage("success", "Contact number updated successfully");
    } catch (error) {
      showMessage("error", error.message || "Failed to update contact");
    } finally {
      setSavingContact(false);
    }
  };

  const handleRequestEmailOtp = async () => {
    if (!contactForm.newEmail.trim()) {
      showMessage("error", "New email is required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.newEmail.trim())) {
      showMessage("error", "Enter a valid email address");
      return;
    }

    try {
      setSendingEmailOtp(true);

      await requestPatientEmailOtp({
        newEmail: contactForm.newEmail.trim()
      });

      setEmailOtpSent(true);
      showMessage("success", "OTP sent to your new email");
    } catch (error) {
      showMessage("error", error.message || "Failed to send email OTP");
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!/^\d{6}$/.test(contactForm.otp)) {
      showMessage("error", "OTP must be 6 digits");
      return;
    }

    try {
      setVerifyingEmailOtp(true);

      const updatedProfile = await verifyPatientEmailOtp({
        otp: contactForm.otp.trim()
      });

      setProfile(updatedProfile);
      setContactForm(mapContactToForm(updatedProfile));
      updateLocalCurrentUser(updatedProfile);
      setEmailOtpSent(false);

      showMessage(
        "success",
        "Email updated successfully. Please login again if session expires."
      );
    } catch (error) {
      showMessage("error", error.message || "Failed to verify email OTP");
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  const handleAddressSubmit = async (event) => {
    event.preventDefault();

    if (addressForm.pincode && !/^\d{6}$/.test(addressForm.pincode)) {
      showMessage("error", "Pincode must be 6 digits");
      return;
    }

    try {
      setSavingAddress(true);

      const updatedProfile = await updatePatientAddress({
        addressLine1: addressForm.addressLine1.trim(),
        addressLine2: addressForm.addressLine2.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        pincode: addressForm.pincode.trim()
      });

      setProfile(updatedProfile);
      setAddressForm(mapAddressToForm(updatedProfile));
      setIsEditingAddress(false);

      showMessage("success", "Address updated successfully");
    } catch (error) {
      showMessage("error", error.message || "Failed to update address");
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showMessage("error", "Current and new password are required");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage("error", "New password and confirm password do not match");
      return;
    }

    if (
      !/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@#$%^&+=!]).{8,}$/.test(
        passwordForm.newPassword
      )
    ) {
      showMessage(
        "error",
        "Password must contain uppercase, lowercase, number and special character"
      );
      return;
    }

    try {
      setSavingPassword(true);

      await updatePatientPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setPasswordForm(emptyPasswordForm);
      setShowPasswordPanel(false);

      showMessage(
        "success",
        "Password updated successfully. Please login again if required."
      );
    } catch (error) {
      showMessage("error", error.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleForgotCurrentPassword = () => {
    showMessage(
      "success",
      "Use Forgot Password on login page to reset password with OTP"
    );

    window.setTimeout(() => {
      navigate("/login");
    }, 800);
  };

  const handleImageFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showMessage("error", "Only JPG, PNG, or WEBP images are allowed");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage("error", "Image size must be less than 5MB");
      event.target.value = "";
      return;
    }

    try {
      setUploadingImage(true);

      const updatedProfile = await uploadPatientProfileImage(file);

      setProfile(updatedProfile);
      setProfileForm(mapProfileToForm(updatedProfile));
      showMessage("success", "Profile image uploaded successfully");
    } catch (error) {
      showMessage("error", error.message || "Failed to upload profile image");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const openAddMemberModal = () => {
    setMemberForm(emptyMemberForm);
    setShowMemberModal(true);
  };

  const openEditMemberModal = (member) => {
    setMemberForm({
      id: member.id,
      fullName: member.fullName || "",
      relation: member.relation || "",
      gender: member.gender || "",
      dateOfBirth: member.dateOfBirth || "",
      bloodGroup: member.bloodGroup || "",
      mobileNumber: member.mobileNumber || ""
    });

    setShowMemberModal(true);
  };

  const closeMemberModal = () => {
    if (savingMember) return;
    setShowMemberModal(false);
    setMemberForm(emptyMemberForm);
  };

  const handleMemberInputChange = (field, value) => {
    setMemberForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const validateMemberForm = () => {
    if (!memberForm.fullName.trim()) return "Family member name is required";
    if (!memberForm.relation) return "Relation is required";
    if (!memberForm.gender) return "Gender is required";
    if (!memberForm.dateOfBirth) return "Date of birth is required";

    const dob = new Date(memberForm.dateOfBirth);
    const today = new Date();

    if (dob > today) return "Date of birth cannot be in future";

    if (
      memberForm.mobileNumber &&
      !/^[6-9]\d{9}$/.test(memberForm.mobileNumber)
    ) {
      return "Mobile number must be a valid 10-digit Indian number";
    }

    return "";
  };

  const handleMemberSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateMemberForm();
    if (validationError) {
      showMessage("error", validationError);
      return;
    }

    const payload = {
      fullName: memberForm.fullName.trim(),
      relation: memberForm.relation,
      gender: memberForm.gender,
      dateOfBirth: memberForm.dateOfBirth,
      bloodGroup: memberForm.bloodGroup || "",
      mobileNumber: memberForm.mobileNumber?.trim() || ""
    };

    try {
      setSavingMember(true);

      if (memberForm.id) {
        await updateFamilyMember(memberForm.id, payload);
        showMessage("success", "Family member updated successfully");
      } else {
        await addFamilyMember(payload);
        showMessage("success", "Family member added successfully");
      }

      await refreshProfilesAndMembers();
      closeMemberModal();
    } catch (error) {
      showMessage("error", error.message || "Failed to save family member");
    } finally {
      setSavingMember(false);
    }
  };

  const handleDeleteMember = async (member) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${member.fullName}?`
    );

    if (!confirmed) return;

    try {
      setDeletingMemberId(member.id);

      await deleteFamilyMember(member.id);

      const deletedSelected =
        selectedProfile &&
        selectedProfile.type === "FAMILY" &&
        String(selectedProfile.id) === String(member.id);

      await refreshProfilesAndMembers();

      if (deletedSelected) {
        const profilesResponse = await getPatientProfiles();
        const self = profilesResponse?.profiles?.find(
          (item) => item.type === "SELF"
        );
        if (self) selectProfile(self);
      }

      showMessage("success", "Family member deleted successfully");
    } catch (error) {
      showMessage("error", error.message || "Failed to delete family member");
    } finally {
      setDeletingMemberId(null);
    }
  };

  const refreshProfilesAndMembers = async () => {
    const [profilesResponse, familyResponse] = await Promise.all([
      getPatientProfiles(),
      getFamilyMembers()
    ]);

    setProfiles(profilesResponse?.profiles || []);
    setFamilyMembers(Array.isArray(familyResponse) ? familyResponse : []);
  };

  const handleSelectBookingProfile = (item) => {
    selectProfile(item);
    showMessage("success", `${item.fullName} selected for booking`);
  };

  const selfAge = calculateAge(profile?.dateOfBirth);

  if (loading) {
    return (
      <div className="patient-profile-page">
        <div className="pp-shell">
          <div className="pp-skeleton pp-skeleton-hero" />
          <div className="pp-skeleton-grid">
            <div className="pp-skeleton" />
            <div className="pp-skeleton" />
            <div className="pp-skeleton" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-profile-page">
      <div className="pp-shell">
        {message.text && (
          <div className={`pp-toast pp-toast-${message.type}`}>
            {message.type === "success" ? <FiCheckCircle /> : <FiAlertCircle />}
            <span>{message.text}</span>
          </div>
        )}

        <section className="pp-hero-card">
          <div className="pp-hero-left">
            <div className="pp-avatar-wrap">
              {profile?.profileImageUrl ? (
                <img
                  src={profile.profileImageUrl}
                  alt={profile?.fullName || "Patient"}
                  className="pp-avatar-img"
                />
              ) : (
                <div className="pp-avatar">
                  {profile?.fullName?.charAt(0)?.toUpperCase() || "P"}
                </div>
              )}

              <button
                type="button"
                className="pp-camera-btn"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImage}
                title="Upload profile image"
              >
                <FiCamera />
              </button>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="pp-hidden-file"
                onChange={handleImageFileChange}
              />
            </div>

            <div>
              <p className="pp-eyebrow">Patient profile</p>
              <h1>{profile?.fullName || "Patient"}</h1>

              <div className="pp-hero-meta">
                <span>
                  <FiMail /> {formatValue(profile?.email)}
                </span>
                <span>
                  <FiPhone /> {formatValue(profile?.mobile)}
                </span>
              </div>

              <button
                type="button"
                className="pp-link-btn pp-upload-link"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImage}
              >
                <FiUploadCloud />
                {uploadingImage ? "Uploading image..." : "Upload profile photo"}
              </button>
            </div>
          </div>

          <div className="pp-hero-actions">
            <button
              type="button"
              className="pp-secondary-btn"
              onClick={loadPatientProfilePage}
            >
              <FiRefreshCw /> Refresh
            </button>

            <button
              type="button"
              className="pp-primary-btn"
              onClick={() => setIsEditingProfile((prev) => !prev)}
            >
              {isEditingProfile ? <FiX /> : <FiEdit2 />}
              {isEditingProfile ? "Cancel Edit" : "Edit Profile"}
            </button>
          </div>
        </section>

        <section className="pp-booking-card">
          <div className="pp-card-heading">
            <div>
              <p className="pp-eyebrow">Current booking profile</p>
              <h2>{activeBookingProfile?.fullName || "No profile selected"}</h2>
              <p>
                This selected profile will be used while booking doctor
                appointments.
              </p>
            </div>

            <div className="pp-selected-pill">
              <FiCheckCircle />
              Selected
            </div>
          </div>

          {activeBookingProfile && (
            <div className="pp-selected-profile-box">
              <div className="pp-mini-avatar">
                {activeBookingProfile.fullName?.charAt(0)?.toUpperCase() || "P"}
              </div>

              <div>
                <h3>{activeBookingProfile.fullName}</h3>
                <p>
                  {activeBookingProfile.relation || "Self"}
                  {activeBookingProfile.gender
                    ? ` • ${activeBookingProfile.gender}`
                    : ""}
                </p>
              </div>
            </div>
          )}
        </section>

        <div className="pp-main-grid">
          <section className="pp-panel">
            <div className="pp-panel-header">
              <div>
                <p className="pp-eyebrow">Medical identity</p>
                <h2>My Profile</h2>
              </div>
            </div>

            {!isEditingProfile ? (
              <div className="pp-info-grid">
                <InfoItem
                  icon={<FiCalendar />}
                  label="Date of birth"
                  value={formatValue(profile?.dateOfBirth)}
                />
                <InfoItem
                  icon={<FiUser />}
                  label="Age"
                  value={selfAge !== null ? `${selfAge} years` : "Not added"}
                />
                <InfoItem
                  icon={<FiUser />}
                  label="Gender"
                  value={formatValue(profile?.gender)}
                />
                <InfoItem
                  icon={<FiActivity />}
                  label="Blood group"
                  value={formatValue(profile?.bloodGroup)}
                />
                <InfoItem
                  icon={<FiAlertCircle />}
                  label="Allergies"
                  value={formatValue(profile?.allergies)}
                  large
                />
                <InfoItem
                  icon={<FiActivity />}
                  label="Chronic conditions"
                  value={formatValue(profile?.chronicConditions)}
                  large
                />
                <InfoItem
                  icon={<FiActivity />}
                  label="Current medications"
                  value={formatValue(profile?.currentMedications)}
                  large
                />
                <InfoItem
                  icon={<FiAlertCircle />}
                  label="Medical history"
                  value={formatValue(profile?.medicalHistory)}
                  large
                />
                <InfoItem
                  icon={<FiPhone />}
                  label="Emergency contact"
                  value={
                    profile?.emergencyContactName || profile?.emergencyContactPhone
                      ? `${profile?.emergencyContactName || "Contact"}${
                          profile?.emergencyContactPhone
                            ? ` • ${profile.emergencyContactPhone}`
                            : ""
                        }`
                      : "Not added"
                  }
                  large
                />
              </div>
            ) : (
              <form className="pp-form" onSubmit={handleProfileSubmit}>
                <div className="pp-form-grid">
                  <Field label="Full name" required>
                    <input
                      type="text"
                      value={profileForm.fullName}
                      onChange={(event) =>
                        handleProfileInputChange("fullName", event.target.value)
                      }
                      placeholder="Enter full name"
                    />
                  </Field>

                  <Field label="Date of birth">
                    <input
                      type="date"
                      value={profileForm.dateOfBirth}
                      onChange={(event) =>
                        handleProfileInputChange(
                          "dateOfBirth",
                          event.target.value
                        )
                      }
                    />
                  </Field>

                  <Field label="Gender">
                    <select
                      value={profileForm.gender}
                      onChange={(event) =>
                        handleProfileInputChange("gender", event.target.value)
                      }
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </Field>

                  <Field label="Blood group">
                    <select
                      value={profileForm.bloodGroup}
                      onChange={(event) =>
                        handleProfileInputChange("bloodGroup", event.target.value)
                      }
                    >
                      <option value="">Select blood group</option>
                      {bloodGroups.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Allergies" wide>
                    <textarea
                      value={profileForm.allergies}
                      onChange={(event) =>
                        handleProfileInputChange("allergies", event.target.value)
                      }
                      placeholder="Example: Dust allergy, medicine allergy"
                    />
                  </Field>

                  <Field label="Chronic conditions" wide>
                    <textarea
                      value={profileForm.chronicConditions}
                      onChange={(event) =>
                        handleProfileInputChange(
                          "chronicConditions",
                          event.target.value
                        )
                      }
                      placeholder="Example: Diabetes, BP, asthma"
                    />
                  </Field>

                  <Field label="Current medications" wide>
                    <textarea
                      value={profileForm.currentMedications}
                      onChange={(event) =>
                        handleProfileInputChange(
                          "currentMedications",
                          event.target.value
                        )
                      }
                      placeholder="Medicines currently being taken"
                    />
                  </Field>

                  <Field label="Medical history" wide>
                    <textarea
                      value={profileForm.medicalHistory}
                      onChange={(event) =>
                        handleProfileInputChange(
                          "medicalHistory",
                          event.target.value
                        )
                      }
                      placeholder="Past surgeries, major illnesses, important notes"
                    />
                  </Field>

                  <Field label="Emergency contact name">
                    <input
                      type="text"
                      value={profileForm.emergencyContactName}
                      onChange={(event) =>
                        handleProfileInputChange(
                          "emergencyContactName",
                          event.target.value
                        )
                      }
                      placeholder="Emergency contact name"
                    />
                  </Field>

                  <Field label="Emergency contact phone">
                    <input
                      type="tel"
                      value={profileForm.emergencyContactPhone}
                      onChange={(event) =>
                        handleProfileInputChange(
                          "emergencyContactPhone",
                          event.target.value
                        )
                      }
                      placeholder="10-digit phone number"
                      maxLength={10}
                    />
                  </Field>
                </div>

                <div className="pp-form-actions">
                  <button
                    type="button"
                    className="pp-secondary-btn"
                    onClick={() => {
                      setProfileForm(mapProfileToForm(profile));
                      setIsEditingProfile(false);
                    }}
                    disabled={savingProfile}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="pp-primary-btn"
                    disabled={savingProfile}
                  >
                    <FiSave />
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            )}
          </section>

          <aside className="pp-side-panel">
            <div className="pp-panel-header">
              <div>
                <p className="pp-eyebrow">Family access</p>
                <h2>Profiles</h2>
              </div>

              <button
                type="button"
                className="pp-icon-btn"
                onClick={openAddMemberModal}
                title="Add family member"
              >
                <FiPlus />
              </button>
            </div>

            <div className="pp-profile-list">
              {profiles.map((item) => {
                const itemKey = `${item.type}-${item.id}`;
                const isSelected = itemKey === selectedKey;

                return (
                  <div
                    key={itemKey}
                    className={`pp-profile-card ${
                      isSelected ? "pp-profile-card-active" : ""
                    }`}
                  >
                    <div className="pp-profile-card-main">
                      <div className="pp-mini-avatar">
                        {item.fullName?.charAt(0)?.toUpperCase() || "P"}
                      </div>

                      <div>
                        <h3>{item.fullName}</h3>
                        <p>
                          {item.relation || "Self"}
                          {item.gender ? ` • ${item.gender}` : ""}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={
                        isSelected
                          ? "pp-selected-btn"
                          : "pp-select-profile-btn"
                      }
                      onClick={() => handleSelectBookingProfile(item)}
                    >
                      {isSelected ? "Selected" : "Select"}
                    </button>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>

        <div className="pp-settings-grid">
          <section className="pp-panel">
            <div className="pp-panel-header">
              <div>
                <p className="pp-eyebrow">Contact info</p>
                <h2>Phone & Email</h2>
                <p className="pp-panel-subtitle">
                  Manage mobile number and verify a new email using OTP.
                </p>
              </div>

              <button
                type="button"
                className="pp-secondary-btn"
                onClick={() => setIsEditingContact((prev) => !prev)}
              >
                {isEditingContact ? <FiX /> : <FiEdit2 />}
                {isEditingContact ? "Cancel" : "Edit"}
              </button>
            </div>

            {!isEditingContact ? (
              <div className="pp-info-grid pp-single-card-grid">
                <InfoItem
                  icon={<FiPhone />}
                  label="Mobile number"
                  value={formatValue(profile?.mobile)}
                />
                <InfoItem
                  icon={<FiMail />}
                  label="Email address"
                  value={formatValue(profile?.email)}
                />
              </div>
            ) : (
              <div className="pp-form">
                <form onSubmit={handleContactSubmit}>
                  <div className="pp-form-grid">
                    <Field label="Mobile number" required>
                      <input
                        type="tel"
                        value={contactForm.mobile}
                        onChange={(event) =>
                          handleContactInputChange("mobile", event.target.value)
                        }
                        placeholder="10-digit mobile number"
                        maxLength={10}
                      />
                    </Field>
                  </div>

                  <div className="pp-form-actions">
                    <button
                      type="submit"
                      className="pp-primary-btn"
                      disabled={savingContact}
                    >
                      <FiSave />
                      {savingContact ? "Saving..." : "Save Mobile"}
                    </button>
                  </div>
                </form>

                <div className="pp-divider" />

                <div className="pp-email-update-box">
                  <div className="pp-mini-heading">
                    <FiShield />
                    <div>
                      <h3>Update email with OTP</h3>
                      <p>OTP will be sent to your new email address.</p>
                    </div>
                  </div>

                  <div className="pp-form-grid">
                    <Field label="New email address">
                      <input
                        type="email"
                        value={contactForm.newEmail}
                        onChange={(event) =>
                          handleContactInputChange("newEmail", event.target.value)
                        }
                        placeholder="Enter new email"
                      />
                    </Field>

                    <Field label="OTP">
                      <input
                        type="tel"
                        value={contactForm.otp}
                        onChange={(event) =>
                          handleContactInputChange(
                            "otp",
                            event.target.value.replace(/\D/g, "")
                          )
                        }
                        placeholder="6-digit OTP"
                        maxLength={6}
                        disabled={!emailOtpSent}
                      />
                    </Field>
                  </div>

                  <div className="pp-form-actions">
                    <button
                      type="button"
                      className="pp-secondary-btn"
                      onClick={handleRequestEmailOtp}
                      disabled={sendingEmailOtp}
                    >
                      <FiMail />
                      {sendingEmailOtp
                        ? "Sending..."
                        : emailOtpSent
                        ? "Resend OTP"
                        : "Send OTP"}
                    </button>

                    <button
                      type="button"
                      className="pp-primary-btn"
                      onClick={handleVerifyEmailOtp}
                      disabled={!emailOtpSent || verifyingEmailOtp}
                    >
                      <FiCheckCircle />
                      {verifyingEmailOtp ? "Verifying..." : "Verify & Update"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="pp-panel">
            <div className="pp-panel-header">
              <div>
                <p className="pp-eyebrow">Address</p>
                <h2>Location Details</h2>
                <p className="pp-panel-subtitle">
                  Useful for home services, lab collection and support.
                </p>
              </div>

              <button
                type="button"
                className="pp-secondary-btn"
                onClick={() => setIsEditingAddress((prev) => !prev)}
              >
                {isEditingAddress ? <FiX /> : <FiEdit2 />}
                {isEditingAddress ? "Cancel" : "Edit"}
              </button>
            </div>

            {!isEditingAddress ? (
              <div className="pp-info-grid pp-single-card-grid">
                <InfoItem
                  icon={<FiMapPin />}
                  label="Address"
                  value={
                    profile?.addressLine1 || profile?.addressLine2
                      ? `${profile?.addressLine1 || ""}${
                          profile?.addressLine2
                            ? `, ${profile.addressLine2}`
                            : ""
                        }`
                      : "Not added"
                  }
                  large
                />
                <InfoItem
                  icon={<FiMapPin />}
                  label="City / State"
                  value={
                    profile?.city || profile?.state
                      ? `${profile?.city || "Not added"}${
                          profile?.state ? `, ${profile.state}` : ""
                        }`
                      : "Not added"
                  }
                />
                <InfoItem
                  icon={<FiMapPin />}
                  label="Pincode"
                  value={formatValue(profile?.pincode)}
                />
              </div>
            ) : (
              <form className="pp-form" onSubmit={handleAddressSubmit}>
                <div className="pp-form-grid">
                  <Field label="Address line 1" wide>
                    <input
                      type="text"
                      value={addressForm.addressLine1}
                      onChange={(event) =>
                        handleAddressInputChange(
                          "addressLine1",
                          event.target.value
                        )
                      }
                      placeholder="House no, building, street"
                    />
                  </Field>

                  <Field label="Address line 2" wide>
                    <input
                      type="text"
                      value={addressForm.addressLine2}
                      onChange={(event) =>
                        handleAddressInputChange(
                          "addressLine2",
                          event.target.value
                        )
                      }
                      placeholder="Area, landmark"
                    />
                  </Field>

                  <Field label="City">
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(event) =>
                        handleAddressInputChange("city", event.target.value)
                      }
                      placeholder="City"
                    />
                  </Field>

                  <Field label="State">
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(event) =>
                        handleAddressInputChange("state", event.target.value)
                      }
                      placeholder="State"
                    />
                  </Field>

                  <Field label="Pincode">
                    <input
                      type="tel"
                      value={addressForm.pincode}
                      onChange={(event) =>
                        handleAddressInputChange(
                          "pincode",
                          event.target.value.replace(/\D/g, "")
                        )
                      }
                      placeholder="6-digit pincode"
                      maxLength={6}
                    />
                  </Field>
                </div>

                <div className="pp-form-actions">
                  <button
                    type="submit"
                    className="pp-primary-btn"
                    disabled={savingAddress}
                  >
                    <FiSave />
                    {savingAddress ? "Saving..." : "Save Address"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>

        <section className="pp-panel pp-security-panel">
          <div className="pp-panel-header">
            <div>
              <p className="pp-eyebrow">Security</p>
              <h2>Password</h2>
              <p className="pp-panel-subtitle">
                Change password using current password, or use forgot password
                if you do not remember it.
              </p>
            </div>

            <button
              type="button"
              className="pp-secondary-btn"
              onClick={() => setShowPasswordPanel((prev) => !prev)}
            >
              {showPasswordPanel ? <FiX /> : <FiLock />}
              {showPasswordPanel ? "Close" : "Change Password"}
            </button>
          </div>

          {showPasswordPanel && (
            <form className="pp-form" onSubmit={handlePasswordSubmit}>
              <div className="pp-form-grid">
                <Field label="Current password" required>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) =>
                      handlePasswordInputChange(
                        "currentPassword",
                        event.target.value
                      )
                    }
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                </Field>

                <Field label="New password" required>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      handlePasswordInputChange("newPassword", event.target.value)
                    }
                    placeholder="New strong password"
                    autoComplete="new-password"
                  />
                </Field>

                <Field label="Confirm password" required>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) =>
                      handlePasswordInputChange(
                        "confirmPassword",
                        event.target.value
                      )
                    }
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                </Field>
              </div>

              <div className="pp-password-note">
                <FiAlertCircle />
                <span>
                  Password must contain uppercase, lowercase, number and special
                  character.
                </span>
              </div>

              <div className="pp-form-actions pp-between-actions">
                <button
                  type="button"
                  className="pp-link-btn"
                  onClick={handleForgotCurrentPassword}
                >
                  Forgot current password?
                </button>

                <button
                  type="submit"
                  className="pp-primary-btn"
                  disabled={savingPassword}
                >
                  <FiSave />
                  {savingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="pp-panel pp-family-panel">
          <div className="pp-panel-header">
            <div>
              <p className="pp-eyebrow">Managed members</p>
              <h2>Family Members</h2>
              <p className="pp-panel-subtitle">
                Add or manage family profiles used during appointment booking.
              </p>
            </div>

            <button
              type="button"
              className="pp-primary-btn"
              onClick={openAddMemberModal}
            >
              <FiPlus />
              Add Member
            </button>
          </div>

          {familyMembers.length === 0 ? (
            <div className="pp-empty-state">
              <FiUsers />
              <h3>No family members added</h3>
              <p>You can add family members and book appointments for them.</p>
              <button
                type="button"
                className="pp-primary-btn"
                onClick={openAddMemberModal}
              >
                <FiPlus />
                Add First Member
              </button>
            </div>
          ) : (
            <div className="pp-family-grid">
              {familyMembers.map((member) => (
                <div key={member.id} className="pp-family-card">
                  <div className="pp-family-top">
                    <div className="pp-mini-avatar">
                      {member.fullName?.charAt(0)?.toUpperCase() || "F"}
                    </div>

                    <div>
                      <h3>{member.fullName}</h3>
                      <p>
                        {member.relation} • {member.gender}
                      </p>
                    </div>
                  </div>

                  <div className="pp-family-details">
                    <span>DOB: {formatValue(member.dateOfBirth)}</span>
                    <span>
                      Age:{" "}
                      {calculateAge(member.dateOfBirth) !== null
                        ? `${calculateAge(member.dateOfBirth)} years`
                        : "Not added"}
                    </span>
                    <span>Blood: {formatValue(member.bloodGroup)}</span>
                    <span>Mobile: {formatValue(member.mobileNumber)}</span>
                  </div>

                  <div className="pp-family-actions">
                    <button
                      type="button"
                      className="pp-secondary-btn"
                      onClick={() => openEditMemberModal(member)}
                    >
                      <FiEdit2 />
                      Edit
                    </button>

                    <button
                      type="button"
                      className="pp-danger-btn"
                      onClick={() => handleDeleteMember(member)}
                      disabled={deletingMemberId === member.id}
                    >
                      <FiTrash2 />
                      {deletingMemberId === member.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {showMemberModal && (
        <div className="pp-modal-overlay" onClick={closeMemberModal}>
          <div className="pp-modal" onClick={(event) => event.stopPropagation()}>
            <div className="pp-modal-header">
              <div>
                <p className="pp-eyebrow">Family member</p>
                <h2>{memberForm.id ? "Edit Member" : "Add Member"}</h2>
              </div>

              <button
                type="button"
                className="pp-icon-btn"
                onClick={closeMemberModal}
                disabled={savingMember}
              >
                <FiX />
              </button>
            </div>

            <form className="pp-form" onSubmit={handleMemberSubmit}>
              <div className="pp-form-grid pp-member-form-grid">
                <Field label="Full name" required>
                  <input
                    type="text"
                    value={memberForm.fullName}
                    onChange={(event) =>
                      handleMemberInputChange("fullName", event.target.value)
                    }
                    placeholder="Enter member name"
                  />
                </Field>

                <Field label="Relation" required>
                  <select
                    value={memberForm.relation}
                    onChange={(event) =>
                      handleMemberInputChange("relation", event.target.value)
                    }
                  >
                    <option value="">Select relation</option>
                    {relations.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Gender" required>
                  <select
                    value={memberForm.gender}
                    onChange={(event) =>
                      handleMemberInputChange("gender", event.target.value)
                    }
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>

                <Field label="Date of birth" required>
                  <input
                    type="date"
                    value={memberForm.dateOfBirth}
                    onChange={(event) =>
                      handleMemberInputChange("dateOfBirth", event.target.value)
                    }
                  />
                </Field>

                <Field label="Blood group">
                  <select
                    value={memberForm.bloodGroup}
                    onChange={(event) =>
                      handleMemberInputChange("bloodGroup", event.target.value)
                    }
                  >
                    <option value="">Select blood group</option>
                    {bloodGroups.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Mobile number">
                  <input
                    type="tel"
                    value={memberForm.mobileNumber}
                    onChange={(event) =>
                      handleMemberInputChange("mobileNumber", event.target.value)
                    }
                    placeholder="Optional 10-digit mobile number"
                    maxLength={10}
                  />
                </Field>
              </div>

              <div className="pp-modal-info">
                <FiAlertCircle />
                <span>
                  This member will appear in booking profile selection after save.
                </span>
              </div>

              <div className="pp-form-actions">
                <button
                  type="button"
                  className="pp-secondary-btn"
                  onClick={closeMemberModal}
                  disabled={savingMember}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="pp-primary-btn"
                  disabled={savingMember}
                >
                  <FiSave />
                  {savingMember
                    ? "Saving..."
                    : memberForm.id
                    ? "Update Member"
                    : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoItem = ({ icon, label, value, large }) => {
  return (
    <div className={`pp-info-item ${large ? "pp-info-item-wide" : ""}`}>
      <div className="pp-info-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
};

const Field = ({ label, required, wide, children }) => {
  return (
    <label className={`pp-field ${wide ? "pp-field-wide" : ""}`}>
      <span>
        {label} {required && <b>*</b>}
      </span>
      {children}
    </label>
  );
};

export default PatientProfile;