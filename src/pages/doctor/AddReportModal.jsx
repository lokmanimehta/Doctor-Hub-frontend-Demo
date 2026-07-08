import React, {
  useEffect,
  useMemo,
  useState
} from "react";
import "./AddReportModal.css";

const AddReportModal = ({
  onClose,
  onSave,
  saving = false,
  visits = [],
  prescriptions = [],
  defaultVisitId = null,
  defaultPrescriptionId = null,
  prefillData = null
}) => {
  const initialVisitId =
    defaultVisitId ?? "";

  const initialPrescriptionId =
    defaultPrescriptionId ?? "";

  /*
   * AI data direct initial state me load hoga.
   * Yahan useEffect me setState use nahi kiya,
   * isliye react-hooks/set-state-in-effect error nahi aayega.
   */
  const [reportName, setReportName] =
    useState(
      () => prefillData?.reportName || ""
    );

  const [reportType, setReportType] =
    useState(
      () =>
        prefillData?.reportType ||
        "BLOOD_TEST"
    );

  const [reportDate, setReportDate] =
    useState(
      () => prefillData?.reportDate || ""
    );

  const [labName, setLabName] =
    useState(
      () => prefillData?.labName || ""
    );

  const [notes, setNotes] =
    useState(
      () => prefillData?.notes || ""
    );

  const [file, setFile] = useState(null);

  const [visitId, setVisitId] =
    useState(initialVisitId);

  const [
    prescriptionId,
    setPrescriptionId
  ] = useState(initialPrescriptionId);

  const [formError, setFormError] =
    useState("");

  const MAX_FILE_SIZE_BYTES =
    10 * 1024 * 1024;

  const isAiPrefilled =
    prefillData?.source === "AI_DEMO";

  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleEscapeKey = (event) => {
      if (
        event.key === "Escape" &&
        !saving
      ) {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleEscapeKey
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        handleEscapeKey
      );
    };
  }, [onClose, saving]);

  const maxDate = useMemo(() => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();

    const month = String(
      currentDate.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      currentDate.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }, []);

  const handleFileChange = (event) => {
    const selectedFile =
      event.target.files?.[0] || null;

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp"
    ];

    if (
      !allowedTypes.includes(
        selectedFile.type
      )
    ) {
      setFormError(
        "Only PDF, JPG, JPEG, PNG, and WEBP files are allowed."
      );

      setFile(null);
      event.target.value = "";
      return;
    }

    if (
      selectedFile.size >
      MAX_FILE_SIZE_BYTES
    ) {
      setFormError(
        "File size cannot exceed 10 MB."
      );

      setFile(null);
      event.target.value = "";
      return;
    }

    setFormError("");
    setFile(selectedFile);
  };

  const handleSubmit = async () => {
    setFormError("");

    if (!reportName.trim()) {
      setFormError(
        "Report name is required."
      );
      return;
    }

    if (!reportDate) {
      setFormError(
        "Report date is required."
      );
      return;
    }

    if (!file) {
      setFormError(
        "Please upload a report file."
      );
      return;
    }

    if (
      file.size >
      MAX_FILE_SIZE_BYTES
    ) {
      setFormError(
        "File size cannot exceed 10 MB."
      );
      return;
    }

    const selectedDate =
      new Date(`${reportDate}T00:00:00`);

    if (
      Number.isNaN(
        selectedDate.getTime()
      )
    ) {
      setFormError(
        "Please select a valid report date."
      );
      return;
    }

    const currentDate = new Date();
    currentDate.setHours(23, 59, 59, 999);

    if (selectedDate > currentDate) {
      setFormError(
        "Report date cannot be in the future."
      );
      return;
    }

    const payload = {
      reportName: reportName.trim(),
      reportType: reportType.trim(),
      reportDate:
        selectedDate.getTime(),
      labName: labName.trim(),
      notes: notes.trim(),
      visitId: visitId
        ? Number(visitId)
        : null,
      prescriptionId: prescriptionId
        ? Number(prescriptionId)
        : null,
      file
    };

    try {
      await onSave(payload);
    } catch (error) {
      setFormError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to upload report."
      );
    }
  };

  return (
    <div
      className="report-modal-overlay"
      onClick={
        !saving ? onClose : undefined
      }
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div
        className="report-modal-card"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="report-modal-header">
          <div>
            <p className="report-modal-eyebrow">
              Medical Reports
            </p>

            <h3 id="report-modal-title">
              Upload New Report
            </h3>

            <p className="report-modal-subtext">
              Add a clinical report for this
              patient with clean metadata and
              file attachment.
            </p>
          </div>
        </div>

        {isAiPrefilled && (
          <div
            style={{
              margin: "0 0 18px",
              padding: "13px 15px",
              border:
                "1px solid #99f6e4",
              borderRadius: "12px",
              background: "#f0fdfa",
              color: "#115e59"
            }}
          >
            <strong
              style={{
                display: "block",
                fontSize: "13px",
                marginBottom: "4px"
              }}
            >
              Clinical AI draft loaded
            </strong>

            <p
              style={{
                margin: 0,
                fontSize: "12px",
                lineHeight: "1.5"
              }}
            >
              Report details are prefilled.
              Verify all fields and upload the
              original report file before saving.
            </p>
          </div>
        )}

        {formError && (
          <div className="report-modal-error">
            {formError}
          </div>
        )}

        <div className="report-modal-form">
          <div className="report-form-group">
            <label htmlFor="reportName">
              Report Name
            </label>

            <input
              id="reportName"
              type="text"
              placeholder="Eg. Blood Test Report"
              value={reportName}
              onChange={(event) =>
                setReportName(
                  event.target.value
                )
              }
              disabled={saving}
            />
          </div>

          <div className="report-form-grid">
            <div className="report-form-group">
              <label htmlFor="reportType">
                Report Type
              </label>

              <select
                id="reportType"
                value={reportType}
                onChange={(event) =>
                  setReportType(
                    event.target.value
                  )
                }
                disabled={saving}
              >
                <option value="BLOOD_TEST">
                  Blood Test
                </option>

                <option value="X_RAY">
                  X-Ray
                </option>

                <option value="MRI">
                  MRI
                </option>

                <option value="CT_SCAN">
                  CT Scan
                </option>

                <option value="ECG">
                  ECG
                </option>

                <option value="ULTRASOUND">
                  Ultrasound
                </option>

                <option value="OTHER">
                  Other
                </option>
              </select>
            </div>

            <div className="report-form-group">
              <label htmlFor="reportDate">
                Report Date
              </label>

              <input
                id="reportDate"
                type="date"
                max={maxDate}
                value={reportDate}
                onChange={(event) =>
                  setReportDate(
                    event.target.value
                  )
                }
                disabled={saving}
              />
            </div>
          </div>

          <div className="report-form-grid">
            <div className="report-form-group">
              <label htmlFor="linkedVisit">
                Link Visit (Optional)
              </label>

              <select
                id="linkedVisit"
                value={visitId}
                onChange={(event) =>
                  setVisitId(
                    event.target.value
                  )
                }
                disabled={saving}
              >
                <option value="">
                  Not linked
                </option>

                {visits.map((visit) => (
                  <option
                    key={visit.id}
                    value={visit.id}
                  >
                    {visit.visitDate
                      ? new Date(
                          visit.visitDate
                        ).toLocaleDateString()
                      : "Unknown date"}{" "}
                    -{" "}
                    {visit.chiefComplaint ||
                      "Visit"}
                  </option>
                ))}
              </select>
            </div>

            <div className="report-form-group">
              <label htmlFor="linkedPrescription">
                Link Prescription (Optional)
              </label>

              <select
                id="linkedPrescription"
                value={prescriptionId}
                onChange={(event) =>
                  setPrescriptionId(
                    event.target.value
                  )
                }
                disabled={saving}
              >
                <option value="">
                  Not linked
                </option>

                {prescriptions.map(
                  (prescription) => (
                    <option
                      key={prescription.id}
                      value={prescription.id}
                    >
                      {prescription.prescriptionDate
                        ? new Date(
                            prescription.prescriptionDate
                          ).toLocaleDateString()
                        : "Unknown date"}{" "}
                      -{" "}
                      {prescription.diagnosis ||
                        "Prescription"}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="report-form-group">
            <label htmlFor="labName">
              Lab / Source Name
            </label>

            <input
              id="labName"
              type="text"
              placeholder="Eg. Bharat Labs, Thyrocare, Metropolis"
              value={labName}
              onChange={(event) =>
                setLabName(
                  event.target.value
                )
              }
              disabled={saving}
            />
          </div>

          <div className="report-form-group">
            <label htmlFor="reportFile">
              Upload File
            </label>

            <input
              id="reportFile"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              disabled={saving}
            />

            <p className="report-file-helper-text">
              Supported files: PDF, JPG,
              JPEG, PNG, WEBP. Maximum size:
              10 MB.
            </p>

            {file && (
              <div className="report-file-preview">
                <span className="report-file-name">
                  {file.name}
                </span>

                <span className="report-file-size">
                  {(
                    file.size / 1024
                  ).toFixed(1)}{" "}
                  KB
                </span>
              </div>
            )}
          </div>

          <div className="report-form-group">
            <label htmlFor="notes">
              Doctor Notes
            </label>

            <textarea
              id="notes"
              rows="5"
              placeholder="Add optional remarks about this report..."
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
              disabled={saving}
            />
          </div>
        </div>

        <div className="report-modal-actions">
          <button
            type="button"
            className="report-cancel-btn"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="report-save-btn"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving
              ? "Uploading..."
              : "Upload Report"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddReportModal;