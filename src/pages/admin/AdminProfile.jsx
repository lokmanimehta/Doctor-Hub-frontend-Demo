import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import {
  getAdminProfile,
  updateAdminProfile,
  uploadAdminProfileImage
} from "../../services/adminService";
import "./AdminProfile.css";

const AdminProfile = () => {
  const { currentUser, setCurrentUser } = useContext(AuthContext);

  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const initials = useMemo(() => {
    const name = fullName || profile?.fullName || currentUser?.fullName || "A";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [fullName, profile?.fullName, currentUser?.fullName]);

  const profileImageSrc = imagePreview || profile?.profileImageUrl || "";

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    window.clearTimeout(showMessage.timer);
    showMessage.timer = window.setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3500);
  };

  const syncCurrentUser = (updatedProfile) => {
    if (!updatedProfile) return;

    const updatedUser = {
      ...(currentUser || {}),
      userId: updatedProfile.userId,
      fullName: updatedProfile.fullName,
      email: updatedProfile.email,
      mobile: updatedProfile.mobile,
      role: updatedProfile.role,
      username: updatedProfile.username,
      isVerified: updatedProfile.verified,
      profileImageUrl: updatedProfile.profileImageUrl
    };

    setCurrentUser(updatedUser);
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      const response = await getAdminProfile();
      const data = response?.data;

      if (!data) {
        throw new Error("Admin profile data not found");
      }

      setProfile(data);
      setFullName(data.fullName || "");
      setMobile(data.mobile || "");
      setImagePreview("");
      setSelectedImageFile(null);
      syncCurrentUser(data);
    } catch (error) {
      showMessage(error.message || "Failed to load admin profile", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateForm = () => {
    const trimmedName = fullName.trim();
    const trimmedMobile = mobile.trim();

    if (!trimmedName) {
      showMessage("Full name is required", "error");
      return false;
    }

    if (trimmedName.length < 2) {
      showMessage("Full name must be at least 2 characters", "error");
      return false;
    }

    if (!/^[0-9]{10}$/.test(trimmedMobile)) {
      showMessage("Mobile number must be exactly 10 digits", "error");
      return false;
    }

    if (selectedImageFile) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

      if (!allowedTypes.includes(selectedImageFile.type)) {
        showMessage("Only JPG, JPEG, PNG, and WEBP images are allowed", "error");
        return false;
      }

      const maxSize = 5 * 1024 * 1024;

      if (selectedImageFile.size > maxSize) {
        showMessage("Profile image cannot exceed 5 MB", "error");
        return false;
      }
    }

    return true;
  };

  const handleChooseImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      showMessage("Only JPG, JPEG, PNG, and WEBP images are allowed", "error");
      event.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      showMessage("Profile image cannot exceed 5 MB", "error");
      event.target.value = "";
      return;
    }

    setSelectedImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveSelectedImage = () => {
    setSelectedImageFile(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);
      setMessage("");
      setMessageType("");

      const profileResponse = await updateAdminProfile({
        fullName: fullName.trim(),
        mobile: mobile.trim()
      });

      let updatedProfile = profileResponse?.data;

      if (selectedImageFile) {
        const imageResponse = await uploadAdminProfileImage(selectedImageFile);
        updatedProfile = imageResponse?.data;
      }

      if (!updatedProfile) {
        throw new Error("Updated admin profile data not returned");
      }

      setProfile(updatedProfile);
      setFullName(updatedProfile.fullName || "");
      setMobile(updatedProfile.mobile || "");
      setSelectedImageFile(null);
      setImagePreview("");
      syncCurrentUser(updatedProfile);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      showMessage("Admin profile updated successfully", "success");
    } catch (error) {
      showMessage(error.message || "Failed to update admin profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const formatCreatedAt = (value) => {
    if (!value) return "Not available";

    const rawValue = String(value);

    if (rawValue.length === 14) {
      const year = rawValue.slice(0, 4);
      const month = rawValue.slice(4, 6);
      const day = rawValue.slice(6, 8);

      return `${day}/${month}/${year}`;
    }

    const date = new Date(Number(value));

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <section className="admin-profile-page">
        <div className="admin-profile-shell">
          <div className="admin-profile-loading-card">
            <div className="admin-profile-loader" />
            <p>Loading admin profile...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-profile-page">
      <div className="admin-profile-shell">
        <div className="admin-profile-header">
          <div>
            <p className="admin-profile-eyebrow">Admin Account</p>
            <h1>Profile Settings</h1>
            <p className="admin-profile-subtitle">
              Manage your admin identity, contact details, and profile photo.
            </p>
          </div>

          <button
            type="button"
            className="admin-profile-refresh-btn"
            onClick={loadProfile}
            disabled={saving}
          >
            Refresh
          </button>
        </div>

        {message && (
          <div className={`admin-profile-alert ${messageType}`}>
            {message}
          </div>
        )}

        <div className="admin-profile-grid">
          <aside className="admin-profile-summary-card">
            <div className="admin-profile-avatar-wrap">
              {profileImageSrc ? (
                <img
                  src={profileImageSrc}
                  alt="Admin profile"
                  className="admin-profile-avatar-img"
                />
              ) : (
                <div className="admin-profile-avatar-fallback">
                  {initials}
                </div>
              )}
            </div>

            <h2>{profile?.fullName || "Admin"}</h2>
            <p>{profile?.email || "No email available"}</p>

            <div className="admin-profile-status-list">
              <span className="admin-profile-pill role">
                {profile?.role || "ADMIN"}
              </span>

              <span className={`admin-profile-pill ${profile?.active ? "good" : "bad"}`}>
                {profile?.active ? "Active" : "Inactive"}
              </span>

              <span className={`admin-profile-pill ${profile?.blocked ? "bad" : "good"}`}>
                {profile?.blocked ? "Blocked" : "Not Blocked"}
              </span>
            </div>

            <div className="admin-profile-meta">
              <div>
                <span>User ID</span>
                <strong>{profile?.userId || "-"}</strong>
              </div>

              <div>
                <span>Created</span>
                <strong>{formatCreatedAt(profile?.createdAt)}</strong>
              </div>
            </div>
          </aside>

          <form className="admin-profile-form-card" onSubmit={handleSubmit}>
            <div className="admin-profile-form-section">
              <div className="admin-profile-section-title">
                <h3>Profile Photo</h3>
                <p>Upload a clear square image. JPG, PNG, or WEBP up to 5 MB.</p>
              </div>

              <div className="admin-profile-photo-row">
                <div className="admin-profile-photo-preview">
                  {profileImageSrc ? (
                    <img src={profileImageSrc} alt="Selected admin" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                <div className="admin-profile-photo-actions">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="admin-profile-file-input"
                  />

                  <div className="admin-profile-photo-btn-row">
                    <button
                      type="button"
                      className="admin-profile-secondary-btn"
                      onClick={handleChooseImage}
                      disabled={saving}
                    >
                      Choose Image
                    </button>

                    {selectedImageFile && (
                      <button
                        type="button"
                        className="admin-profile-ghost-btn"
                        onClick={handleRemoveSelectedImage}
                        disabled={saving}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {selectedImageFile && (
                    <p className="admin-profile-file-name">
                      Selected: {selectedImageFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="admin-profile-form-section">
              <div className="admin-profile-section-title">
                <h3>Basic Information</h3>
                <p>Email and role are protected account fields.</p>
              </div>

              <div className="admin-profile-fields">
                <div className="admin-profile-field">
                  <label htmlFor="adminFullName">Full Name</label>
                  <input
                    id="adminFullName"
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Enter full name"
                    disabled={saving}
                  />
                </div>

                <div className="admin-profile-field">
                  <label htmlFor="adminMobile">Mobile Number</label>
                  <input
                    id="adminMobile"
                    type="tel"
                    value={mobile}
                    onChange={(event) => {
                      const value = event.target.value.replace(/\D/g, "").slice(0, 10);
                      setMobile(value);
                    }}
                    placeholder="10 digit mobile number"
                    disabled={saving}
                  />
                </div>

                <div className="admin-profile-field">
                  <label htmlFor="adminEmail">Email Address</label>
                  <input
                    id="adminEmail"
                    type="email"
                    value={profile?.email || ""}
                    disabled
                    readOnly
                  />
                </div>

                <div className="admin-profile-field">
                  <label htmlFor="adminRole">Role</label>
                  <input
                    id="adminRole"
                    type="text"
                    value={profile?.role || "ADMIN"}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="admin-profile-actions">
              <button
                type="button"
                className="admin-profile-secondary-btn"
                onClick={loadProfile}
                disabled={saving}
              >
                Reset
              </button>

              <button
                type="submit"
                className="admin-profile-primary-btn"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default AdminProfile;