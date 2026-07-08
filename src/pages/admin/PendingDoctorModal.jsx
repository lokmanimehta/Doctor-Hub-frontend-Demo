import React, {
  useEffect,
  useMemo,
  useState
} from "react";

import "./PendingDoctorModal.css";

import {
  getAdminDoctorDocumentContent
} from "../../services/adminService";

const getApiErrorMessage = (
  error,
  fallback = "Unable to complete this action."
) => {
  const data = error?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data?.message) {
    return data.message;
  }

  if (data?.reason) {
    return data.reason;
  }

  if (data && typeof data === "object") {
    const validationMessage = Object.values(data).find(
      (value) => typeof value === "string" && value.trim()
    );

    if (validationMessage) {
      return validationMessage;
    }
  }

  if (error?.message) {
    return error.message;
  }

  return fallback;
};

const getBlobErrorMessage = async (
  error,
  fallback
) => {
  const responseData = error?.response?.data;

  if (responseData instanceof Blob) {
    try {
      const text = await responseData.text();
      const parsed = JSON.parse(text);

      return (
        parsed?.message ||
        parsed?.reason ||
        fallback
      );
    } catch {
      return fallback;
    }
  }

  return getApiErrorMessage(error, fallback);
};

const humanize = (value) => {
  if (!value) {
    return "Not provided";
  }

  return String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatFee = (value) => {
  if (value == null || Number.isNaN(Number(value))) {
    return "Not provided";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value));
};

const formatDate = (value, includeTime = false) => {
  if (value == null || value === "") {
    return "Not available";
  }

  const rawValue = String(value);

  if (/^\d{14}$/.test(rawValue)) {
    const parsedDate = new Date(
      Number(rawValue.slice(0, 4)),
      Number(rawValue.slice(4, 6)) - 1,
      Number(rawValue.slice(6, 8)),
      Number(rawValue.slice(8, 10)),
      Number(rawValue.slice(10, 12)),
      Number(rawValue.slice(12, 14))
    );

    if (!Number.isNaN(parsedDate.getTime())) {
      return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        ...(includeTime
          ? {
              hour: "2-digit",
              minute: "2-digit"
            }
          : {})
      }).format(parsedDate);
    }
  }

  const parsedDate = new Date(Number(value));

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit"
        }
      : {})
  }).format(parsedDate);
};

const formatFileSize = (bytes) => {
  const numericBytes = Number(bytes);

  if (!Number.isFinite(numericBytes) || numericBytes <= 0) {
    return "Size unavailable";
  }

  if (numericBytes < 1024) {
    return `${numericBytes} B`;
  }

  if (numericBytes < 1024 * 1024) {
    return `${(numericBytes / 1024).toFixed(1)} KB`;
  }

  return `${(
    numericBytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
};

const getInitials = (name) => {
  if (!name?.trim()) {
    return "DR";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const resolveProfileImageUrl = (url) => {
  if (!url || typeof url !== "string") {
    return "";
  }

  const normalizedUrl = url.trim();

  if (!normalizedUrl || normalizedUrl.startsWith("/src/")) {
    return "";
  }

  if (
    normalizedUrl.startsWith("http://") ||
    normalizedUrl.startsWith("https://") ||
    normalizedUrl.startsWith("blob:") ||
    normalizedUrl.startsWith("data:")
  ) {
    return normalizedUrl;
  }

  if (normalizedUrl.startsWith("/uploads/")) {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL ||
      "http://localhost:8080/api";

    return `${apiBaseUrl
      .replace(/\/+$/, "")
      .replace(/\/api$/i, "")}${normalizedUrl}`;
  }

  return "";
};

const buildAddress = (item) =>
  [
    item?.addressLine1,
    item?.addressLine2,
    item?.area,
    item?.city,
    item?.state,
    item?.pincode
  ]
    .filter(Boolean)
    .join(", ") || "Address not provided";

const documentLabelMap = {
  PROFILE_IMAGE: "Profile image",
  SIGNATURE: "Doctor signature",
  GOVT_ID: "Government identification",
  MEDICAL_REGISTRATION: "Medical registration",
  DEGREE_CERTIFICATE: "Degree certificate",
  EXPERIENCE_CERTIFICATE: "Experience certificate",
  OTHER_CERTIFICATE: "Other certificate"
};

const DataItem = ({ label, value, full = false }) => (
  <div
    className={`pdm-data-item ${
      full ? "pdm-data-item-full" : ""
    }`}
  >
    <dt>{label}</dt>

    <dd
      className={
        value == null ||
        value === "" ||
        value === "Not provided"
          ? "pdm-value-muted"
          : ""
      }
    >
      {value == null || value === ""
        ? "Not provided"
        : value}
    </dd>
  </div>
);

const StatusBadge = ({ status }) => (
  <span
    className={`pdm-status-badge pdm-status-${String(
      status || "pending"
    ).toLowerCase()}`}
  >
    {humanize(status || "UNDER_REVIEW")}
  </span>
);

const PendingDoctorModal = ({
  doctor,
  onClose,
  onVerify,
  onReject
}) => {
  const [rejectReason, setRejectReason] = useState("");
  const [confirmationType, setConfirmationType] =
    useState(null);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [actionError, setActionError] = useState("");
  const [modalNotice, setModalNotice] = useState("");

  const [imageFailed, setImageFailed] = useState(false);

  const [loadingDocumentId, setLoadingDocumentId] =
    useState(null);

  const [documentError, setDocumentError] =
    useState("");

  const [documentPreview, setDocumentPreview] =
    useState(null);

  const doctorProfileId = doctor?.doctorProfileId;

  const profileImageUrl = resolveProfileImageUrl(
    doctor?.profileImageUrl
  );

  useEffect(() => {
    setRejectReason("");
    setConfirmationType(null);
    setActionError("");
    setModalNotice("");
    setImageFailed(false);
    setDocumentError("");
  }, [doctorProfileId]);

  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key !== "Escape" || actionLoading) {
        return;
      }

      if (documentPreview) {
        setDocumentPreview(null);
        return;
      }

      if (confirmationType) {
        setConfirmationType(null);
        return;
      }

      onClose();
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [
    actionLoading,
    confirmationType,
    documentPreview,
    onClose
  ]);

  useEffect(
    () => () => {
      if (documentPreview?.url) {
        URL.revokeObjectURL(documentPreview.url);
      }
    },
    [documentPreview]
  );

  const activeDocuments = useMemo(
    () =>
      (Array.isArray(doctor?.documents)
        ? doctor.documents
        : []
      ).filter(
        (documentItem) =>
          documentItem?.active !== false &&
          documentItem?.documentType !== "PROFILE_IMAGE"
      ),
    [doctor?.documents]
  );

  const requirements = useMemo(() => {
    const documentTypes = new Set(
      activeDocuments.map(
        (documentItem) => documentItem.documentType
      )
    );

    const hasRegistrationDocument =
      documentTypes.has("MEDICAL_REGISTRATION") ||
      documentTypes.has("GOVT_ID");

    const hasProfessionalCertificate =
      documentTypes.has("DEGREE_CERTIFICATE") ||
      documentTypes.has("EXPERIENCE_CERTIFICATE") ||
      documentTypes.has("OTHER_CERTIFICATE");

    return [
      {
        label: "Profile submitted for review",
        complete:
          doctor?.verificationStatus === "UNDER_REVIEW"
      },
      {
        label: "Account is active and unblocked",
        complete:
          doctor?.accountStatus === "ACTIVE" &&
          doctor?.blocked !== true
      },
      {
        label: "Medical registration provided",
        complete: Boolean(
          doctor?.registrationNumber?.trim()
        )
      },
      {
        label: "Specialization provided",
        complete:
          Array.isArray(doctor?.specializations) &&
          doctor.specializations.length > 0
      },
      {
        label: "Qualification provided",
        complete:
          Array.isArray(doctor?.degrees) &&
          doctor.degrees.length > 0
      },
      {
        label: "Doctor signature uploaded",
        complete: documentTypes.has("SIGNATURE")
      },
      {
        label: "Identity or registration document",
        complete: hasRegistrationDocument
      },
      {
        label: "Professional certificate uploaded",
        complete: hasProfessionalCertificate
      },
      {
        label: "No profile changes after submission",
        complete:
          doctor?.hasUnsubmittedReviewChanges !== true
      }
    ];
  }, [activeDocuments, doctor]);

  const failedRequirements = requirements.filter(
    (requirement) => !requirement.complete
  );

  const canVerify =
    failedRequirements.length === 0 &&
    !actionLoading;

  const canReject =
    doctor?.verificationStatus === "UNDER_REVIEW" &&
    doctor?.hasUnsubmittedReviewChanges !== true &&
    !actionLoading;

  const handleClose = () => {
    if (actionLoading) {
      return;
    }

    onClose();
  };

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  const requestVerification = () => {
    setActionError("");

    if (!canVerify) {
      setActionError(
        "This profile does not currently meet all verification requirements."
      );
      return;
    }

    setConfirmationType("VERIFY");
  };

  const requestRejection = () => {
    setActionError("");

    const normalizedReason = rejectReason.trim();

    if (normalizedReason.length < 10) {
      setActionError(
        "Enter a clear rejection reason of at least 10 characters."
      );
      return;
    }

    if (normalizedReason.length > 1000) {
      setActionError(
        "Rejection reason cannot exceed 1000 characters."
      );
      return;
    }

    if (!canReject) {
      setActionError(
        "This submission changed after review. Ask the doctor to resubmit the latest profile."
      );
      return;
    }

    setConfirmationType("REJECT");
  };

  const executeDecision = async () => {
    if (!confirmationType || actionLoading) {
      return;
    }

    setActionLoading(true);
    setActionError("");

    try {
      if (confirmationType === "VERIFY") {
        await onVerify(doctorProfileId);

        setModalNotice(
          "Doctor verified successfully."
        );
      } else {
        await onReject(
          doctorProfileId,
          rejectReason.trim()
        );

        setModalNotice(
          "Doctor verification request rejected."
        );
      }

      setConfirmationType(null);

      window.setTimeout(() => {
        onClose();
      }, 850);
    } catch (error) {
      setConfirmationType(null);

      setActionError(
        getApiErrorMessage(
          error,
          "Unable to update doctor verification."
        )
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDocument = async (
    documentItem
  ) => {
    if (
      !documentItem?.id ||
      loadingDocumentId ||
      actionLoading
    ) {
      return;
    }

    setDocumentError("");
    setLoadingDocumentId(documentItem.id);

    try {
      const response =
        await getAdminDoctorDocumentContent(
          doctorProfileId,
          documentItem.id
        );

      if (documentPreview?.url) {
        URL.revokeObjectURL(documentPreview.url);
      }

      const objectUrl = URL.createObjectURL(
        response.blob
      );

      setDocumentPreview({
        url: objectUrl,
        fileName:
          response.fileName ||
          documentItem.fileName ||
          "Doctor document",
        contentType:
          response.contentType ||
          documentItem.contentType ||
          response.blob?.type ||
          "application/octet-stream"
      });
    } catch (error) {
      setDocumentError(
        await getBlobErrorMessage(
          error,
          "Unable to securely load this document."
        )
      );
    } finally {
      setLoadingDocumentId(null);
    }
  };

  const closeDocumentPreview = () => {
    if (documentPreview?.url) {
      URL.revokeObjectURL(documentPreview.url);
    }

    setDocumentPreview(null);
  };

  if (!doctor) {
    return null;
  }

  return (
    <div
      className="pdm-overlay"
      onMouseDown={handleOverlayClick}
    >
      <section
        className="pdm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdm-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="pdm-header">
          <div className="pdm-header-identity">
            {profileImageUrl && !imageFailed ? (
              <img
                className="pdm-avatar"
                src={profileImageUrl}
                alt={doctor.fullName || "Doctor"}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="pdm-avatar pdm-avatar-fallback">
                {getInitials(doctor.fullName)}
              </div>
            )}

            <div className="pdm-header-copy">
              <div className="pdm-header-title-row">
                <h2 id="pdm-title">
                  {doctor.fullName || "Doctor profile"}
                </h2>

                <StatusBadge
                  status={doctor.verificationStatus}
                />
              </div>

              <p>
                {doctor.specializations?.join(", ") ||
                  "Specialization not provided"}
              </p>

              <div className="pdm-header-meta">
                <span>
                  Profile ID: {doctor.doctorProfileId}
                </span>

                <span aria-hidden="true">•</span>

                <span>
                  Submitted{" "}
                  {formatDate(
                    doctor.reviewSubmittedAt,
                    true
                  )}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="pdm-close-button"
            onClick={handleClose}
            disabled={actionLoading}
            aria-label="Close doctor verification"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="m6 6 12 12M18 6 6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="pdm-content">
          <div className="pdm-main-column">
            {doctor.hasUnsubmittedReviewChanges === true && (
              <div className="pdm-critical-banner">
                <div className="pdm-banner-symbol">!</div>

                <div>
                  <strong>
                    Profile changed after submission
                  </strong>

                  <p>
                    The doctor updated this profile after it
                    was submitted. Ask the doctor to submit
                    the latest profile again before taking a
                    decision.
                  </p>
                </div>
              </div>
            )}

            <section className="pdm-section">
              <div className="pdm-section-heading">
                <div>
                  <span>Profile overview</span>
                  <h3>Personal information</h3>
                </div>
              </div>

              <dl className="pdm-data-grid">
                <DataItem
                  label="Full name"
                  value={doctor.fullName}
                />

                <DataItem
                  label="Username"
                  value={doctor.username}
                />

                <DataItem
                  label="Email address"
                  value={doctor.email}
                />

                <DataItem
                  label="Mobile number"
                  value={doctor.mobile}
                />

                <DataItem
                  label="Gender"
                  value={humanize(doctor.gender)}
                />

                <DataItem
                  label="Account status"
                  value={humanize(
                    doctor.accountStatus
                  )}
                />

                <DataItem
                  label="Joined"
                  value={formatDate(doctor.joinedAt)}
                />

                <DataItem
                  label="Profile updated"
                  value={formatDate(
                    doctor.lastProfileUpdatedAt,
                    true
                  )}
                />

                <DataItem
                  label="Professional summary"
                  value={
                    doctor.description ||
                    "Professional summary not provided"
                  }
                  full
                />
              </dl>
            </section>

            <section className="pdm-section">
              <div className="pdm-section-heading">
                <div>
                  <span>Credentials</span>
                  <h3>Professional information</h3>
                </div>
              </div>

              <dl className="pdm-data-grid">
                <DataItem
                  label="Experience"
                  value={
                    doctor.experienceYears != null
                      ? `${doctor.experienceYears} years`
                      : "Not provided"
                  }
                />

                <DataItem
                  label="Consultation fee"
                  value={formatFee(
                    doctor.consultationFee
                  )}
                />

                <DataItem
                  label="Medical council"
                  value={doctor.councilName}
                />

                <DataItem
                  label="Registration number"
                  value={doctor.registrationNumber}
                />

                <DataItem
                  label="Registration year"
                  value={doctor.registrationYear}
                />

                <DataItem
                  label="Total appointments"
                  value={doctor.totalAppointments ?? 0}
                />

                <DataItem
                  label="Total patients"
                  value={doctor.totalPatients ?? 0}
                />
              </dl>

              <div className="pdm-tag-group">
                <div>
                  <span className="pdm-tag-label">
                    Specializations
                  </span>

                  <div className="pdm-tags">
                    {doctor.specializations?.length ? (
                      doctor.specializations.map(
                        (specialization) => (
                          <span
                            className="pdm-tag"
                            key={specialization}
                          >
                            {specialization}
                          </span>
                        )
                      )
                    ) : (
                      <span className="pdm-empty-inline">
                        No specialization provided
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="pdm-tag-label">
                    Qualifications
                  </span>

                  <div className="pdm-tags">
                    {doctor.degrees?.length ? (
                      doctor.degrees.map((degree) => (
                        <span
                          className="pdm-tag pdm-tag-neutral"
                          key={degree}
                        >
                          {degree}
                        </span>
                      ))
                    ) : (
                      <span className="pdm-empty-inline">
                        No qualification provided
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="pdm-section">
              <div className="pdm-section-heading">
                <div>
                  <span>Practice locations</span>
                  <h3>Clinics</h3>
                </div>

                <strong>
                  {doctor.clinics?.length || 0}
                </strong>
              </div>

              {doctor.clinics?.length ? (
                <div className="pdm-practice-list">
                  {doctor.clinics.map((clinic) => (
                    <article
                      className="pdm-practice-card"
                      key={clinic.id}
                    >
                      <div className="pdm-practice-header">
                        <div>
                          <h4>
                            {clinic.clinicName ||
                              "Unnamed clinic"}
                          </h4>

                          <p>{buildAddress(clinic)}</p>
                        </div>

                        {clinic.primary === true && (
                          <span className="pdm-primary-badge">
                            Primary
                          </span>
                        )}
                      </div>

                      <dl className="pdm-practice-meta">
                        <div>
                          <dt>Contact</dt>
                          <dd>
                            {clinic.contactNumber ||
                              "Not provided"}
                          </dd>
                        </div>

                        <div>
                          <dt>Consultation</dt>
                          <dd>
                            {formatFee(
                              clinic.consultationFee
                            )}
                          </dd>
                        </div>

                        <div>
                          <dt>Availability</dt>
                          <dd>
                            {clinic.availabilitySlots
                              ?.length || 0}{" "}
                            configured slot(s)
                          </dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="pdm-empty-section">
                  No clinic information provided.
                </div>
              )}
            </section>

            {doctor.visitingPositions?.length > 0 && (
              <section className="pdm-section">
                <div className="pdm-section-heading">
                  <div>
                    <span>Affiliations</span>
                    <h3>Visiting positions</h3>
                  </div>

                  <strong>
                    {doctor.visitingPositions.length}
                  </strong>
                </div>

                <div className="pdm-practice-list">
                  {doctor.visitingPositions.map(
                    (position) => (
                      <article
                        className="pdm-practice-card"
                        key={position.id}
                      >
                        <div className="pdm-practice-header">
                          <div>
                            <h4>
                              {position.institutionName}
                            </h4>

                            <p>
                              {[
                                position.designation,
                                position.departmentName
                              ]
                                .filter(Boolean)
                                .join(" • ") ||
                                "Position details not provided"}
                            </p>
                          </div>

                          {position.currentlyActive ===
                            true && (
                            <span className="pdm-active-badge">
                              Active
                            </span>
                          )}
                        </div>

                        <p className="pdm-address-line">
                          {buildAddress(position)}
                        </p>
                      </article>
                    )
                  )}
                </div>
              </section>
            )}
          </div>

          <aside className="pdm-side-column">
            <section className="pdm-side-panel">
              <div className="pdm-side-heading">
                <div>
                  <span>Decision readiness</span>
                  <h3>Verification checklist</h3>
                </div>

                <span
                  className={`pdm-readiness-score ${
                    failedRequirements.length === 0
                      ? "pdm-readiness-complete"
                      : ""
                  }`}
                >
                  {requirements.length -
                    failedRequirements.length}
                  /{requirements.length}
                </span>
              </div>

              <div className="pdm-checklist">
                {requirements.map((requirement) => (
                  <div
                    className={`pdm-check-item ${
                      requirement.complete
                        ? "pdm-check-complete"
                        : "pdm-check-missing"
                    }`}
                    key={requirement.label}
                  >
                    <span className="pdm-check-symbol">
                      {requirement.complete ? "✓" : "!"}
                    </span>

                    <span>{requirement.label}</span>
                  </div>
                ))}
              </div>

              {failedRequirements.length > 0 && (
                <p className="pdm-readiness-note">
                  Verification is disabled until all required
                  information and documents are available.
                </p>
              )}
            </section>

            <section className="pdm-side-panel">
              <div className="pdm-side-heading">
                <div>
                  <span>Secure review</span>
                  <h3>Professional documents</h3>
                </div>

                <span className="pdm-document-count">
                  {activeDocuments.length}
                </span>
              </div>

              {documentError && (
                <div
                  className="pdm-document-error"
                  role="alert"
                >
                  {documentError}
                </div>
              )}

              {activeDocuments.length > 0 ? (
                <div className="pdm-document-list">
                  {activeDocuments.map(
                    (documentItem) => {
                      const isLoading =
                        loadingDocumentId ===
                        documentItem.id;

                      return (
                        <article
                          className="pdm-document-card"
                          key={documentItem.id}
                        >
                          <div className="pdm-document-icon">
                            <svg
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                d="M7 3h7l4 4v14H7V3Zm7 0v5h5M10 13h5m-5 4h5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>

                          <div className="pdm-document-copy">
                            <strong>
                              {documentItem.documentLabel ||
                                documentLabelMap[
                                  documentItem
                                    .documentType
                                ] ||
                                humanize(
                                  documentItem.documentType
                                )}
                            </strong>

                            <span>
                              {documentItem.fileName ||
                                "Document file"}
                            </span>

                            <div className="pdm-document-meta">
                              <span>
                                {formatFileSize(
                                  documentItem.fileSizeBytes
                                )}
                              </span>

                              <span aria-hidden="true">
                                •
                              </span>

                              <StatusBadge
                                status={
                                  documentItem
                                    .verificationStatus
                                }
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleViewDocument(
                                documentItem
                              )
                            }
                            disabled={
                              Boolean(
                                loadingDocumentId
                              ) || actionLoading
                            }
                          >
                            {isLoading
                              ? "Opening..."
                              : "View"}
                          </button>
                        </article>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="pdm-empty-section">
                  No active professional documents found.
                </div>
              )}

              <div className="pdm-security-note">
                Documents are loaded through an authenticated
                admin endpoint and are not exposed through
                public upload URLs.
              </div>
            </section>
          </aside>
        </div>

        <footer className="pdm-footer">
          <div className="pdm-rejection-area">
            <label htmlFor="pdm-rejection-reason">
              Rejection reason
              <span>Required only when rejecting</span>
            </label>

            <div className="pdm-rejection-input-row">
              <textarea
                id="pdm-rejection-reason"
                value={rejectReason}
                onChange={(event) => {
                  setRejectReason(event.target.value);
                  setActionError("");
                }}
                maxLength={1000}
                placeholder="Explain clearly what the doctor must correct before resubmitting..."
                disabled={actionLoading}
              />

              <span className="pdm-character-count">
                {rejectReason.length}/1000
              </span>
            </div>
          </div>

          {actionError && (
            <div
              className="pdm-action-error"
              role="alert"
            >
              <span>!</span>
              <p>{actionError}</p>
            </div>
          )}

          <div className="pdm-footer-actions">
            <button
              type="button"
              className="pdm-button pdm-button-secondary"
              onClick={handleClose}
              disabled={actionLoading}
            >
              Close
            </button>

            <button
              type="button"
              className="pdm-button pdm-button-danger"
              onClick={requestRejection}
              disabled={!canReject}
            >
              Reject profile
            </button>

            <button
              type="button"
              className="pdm-button pdm-button-primary"
              onClick={requestVerification}
              disabled={!canVerify}
            >
              Verify doctor
            </button>
          </div>
        </footer>

        {modalNotice && (
          <div
            className="pdm-success-toast"
            role="status"
          >
            <span>✓</span>
            {modalNotice}
          </div>
        )}
      </section>

      {confirmationType && (
        <div
          className="pdm-confirm-overlay"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <section
            className="pdm-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="pdm-confirm-title"
          >
            <div
              className={`pdm-confirm-icon ${
                confirmationType === "REJECT"
                  ? "pdm-confirm-icon-danger"
                  : ""
              }`}
            >
              {confirmationType === "VERIFY" ? "✓" : "!"}
            </div>

            <h3 id="pdm-confirm-title">
              {confirmationType === "VERIFY"
                ? "Verify this doctor?"
                : "Reject this verification request?"}
            </h3>

            <p>
              {confirmationType === "VERIFY"
                ? "The doctor will be marked as professionally verified and active documents will be approved."
                : "The doctor will receive the rejection reason and must update and resubmit the profile."}
            </p>

            {confirmationType === "REJECT" && (
              <div className="pdm-confirm-reason">
                {rejectReason.trim()}
              </div>
            )}

            <div className="pdm-confirm-actions">
              <button
                type="button"
                className="pdm-button pdm-button-secondary"
                onClick={() =>
                  setConfirmationType(null)
                }
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                className={`pdm-button ${
                  confirmationType === "VERIFY"
                    ? "pdm-button-primary"
                    : "pdm-button-danger-solid"
                }`}
                onClick={executeDecision}
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Processing..."
                  : confirmationType === "VERIFY"
                    ? "Confirm verification"
                    : "Confirm rejection"}
              </button>
            </div>
          </section>
        </div>
      )}

      {documentPreview && (
        <div
          className="pdm-document-viewer-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDocumentPreview();
            }
          }}
        >
          <section
            className="pdm-document-viewer"
            role="dialog"
            aria-modal="true"
            aria-label="Doctor document preview"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>Secure document preview</span>
                <h3>{documentPreview.fileName}</h3>
              </div>

              <button
                type="button"
                onClick={closeDocumentPreview}
                aria-label="Close document preview"
              >
                ×
              </button>
            </header>

            <div className="pdm-document-viewer-content">
              {documentPreview.contentType.startsWith(
                "image/"
              ) ? (
                <img
                  src={documentPreview.url}
                  alt={documentPreview.fileName}
                />
              ) : (
                <iframe
                  src={documentPreview.url}
                  title={documentPreview.fileName}
                />
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default PendingDoctorModal;