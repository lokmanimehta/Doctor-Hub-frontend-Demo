import React, { useEffect, useMemo, useState } from "react";
import "./Labs.css";
import {
  createDoctorLab,
  getMyLabs,
  getSystemLabs,
} from "../../services/doctorService";

const SERVICE_OPTIONS = ["All", "Blood", "ECG", "X-Ray", "Urine", "Imaging"];

const SERVICE_SUGGESTIONS = [
  "Blood",
  "ECG",
  "X-Ray",
  "Urine",
  "Imaging",
  "Ultrasound",
  "CT Scan",
  "MRI",
  "Pathology",
  "Cardiac",
  "Thyroid",
  "Diabetes",
  "Liver Function",
  "Kidney Function",
  "Hormone Test",
];

const INITIAL_FORM = {
  name: "",
  contactNumber: "",
  addressLine1: "",
  addressLine2: "",
  area: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
};

const normalize = (value) => (value || "").toString().trim().toLowerCase();

const formatAddressLine = (lab) => {
  const parts = [lab?.area, lab?.city, lab?.state, lab?.pincode].filter(Boolean);
  return parts.length ? parts.join(", ") : "Address not available";
};

const formatFullAddress = (lab) => {
  const parts = [
    lab?.addressLine1,
    lab?.addressLine2,
    lab?.area,
    lab?.city,
    lab?.state,
    lab?.pincode,
    lab?.landmark ? `Landmark: ${lab.landmark}` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "Full address not available";
};

const formatDateTime = (timestamp) => {
  if (!timestamp) return "N/A";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleString();
};

const Labs = () => {
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [systemLabs, setSystemLabs] = useState([]);
  const [myLabs, setMyLabs] = useState([]);

  const [searchText, setSearchText] = useState("");
  const [serviceFilter, setServiceFilter] = useState("All");

  const [showAddLabModal, setShowAddLabModal] = useState(false);
  const [labForm, setLabForm] = useState(INITIAL_FORM);
  const [selectedServices, setSelectedServices] = useState([]);
  const [serviceInput, setServiceInput] = useState("");
  const [labFormError, setLabFormError] = useState("");
  const [savingLab, setSavingLab] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [openSystemLabId, setOpenSystemLabId] = useState(null);
  const [openMyLabId, setOpenMyLabId] = useState(null);

  useEffect(() => {
    const loadLabsData = async () => {
      try {
        setLoading(true);
        setPageError("");

        const [systemLabsResponse, myLabsResponse] = await Promise.all([
          getSystemLabs(),
          getMyLabs(),
        ]);

        setSystemLabs(Array.isArray(systemLabsResponse) ? systemLabsResponse : []);
        setMyLabs(Array.isArray(myLabsResponse) ? myLabsResponse : []);
      } catch (error) {
        console.error("Failed to load labs page:", error);
        setPageError(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to load labs module right now."
        );
      } finally {
        setLoading(false);
      }
    };

    loadLabsData();
  }, []);

  useEffect(() => {
    if (!showAddLabModal) {
      document.body.style.overflow = "auto";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showAddLabModal]);

  const handleResetFilters = () => {
    setSearchText("");
    setServiceFilter("All");
  };

  const filteredSystemLabs = useMemo(() => {
    return systemLabs.filter((lab) => {
      const matchesSearch =
        normalize(lab?.name).includes(normalize(searchText)) ||
        normalize(lab?.area).includes(normalize(searchText)) ||
        normalize(lab?.city).includes(normalize(searchText)) ||
        normalize(lab?.state).includes(normalize(searchText));

      const services = Array.isArray(lab?.services) ? lab.services : [];
      const matchesService =
        serviceFilter === "All" || services.includes(serviceFilter);

      return matchesSearch && matchesService;
    });
  }, [systemLabs, searchText, serviceFilter]);

  const filteredMyLabs = useMemo(() => {
    return myLabs.filter((lab) => {
      const matchesSearch =
        normalize(lab?.name).includes(normalize(searchText)) ||
        normalize(lab?.area).includes(normalize(searchText)) ||
        normalize(lab?.city).includes(normalize(searchText)) ||
        normalize(lab?.state).includes(normalize(searchText));

      const services = Array.isArray(lab?.services) ? lab.services : [];
      const matchesService =
        serviceFilter === "All" || services.includes(serviceFilter);

      return matchesSearch && matchesService;
    });
  }, [myLabs, searchText, serviceFilter]);

  const filteredServiceSuggestions = useMemo(() => {
    const available = SERVICE_SUGGESTIONS.filter(
      (item) =>
        normalize(item).includes(normalize(serviceInput)) &&
        !selectedServices.includes(item)
    );

    return available.slice(0, 8);
  }, [serviceInput, selectedServices]);

  const openAddLabModal = () => {
    setLabForm(INITIAL_FORM);
    setSelectedServices([]);
    setServiceInput("");
    setLabFormError("");
    setSuccessMessage("");
    setShowAddLabModal(true);
  };

  const closeAddLabModal = () => {
    if (savingLab) return;
    setShowAddLabModal(false);
    setLabFormError("");
  };

  const handleLabFormChange = (field, value) => {
    setLabForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addServiceTag = (service) => {
    const trimmed = service.trim();
    if (!trimmed) return;
    if (selectedServices.includes(trimmed)) return;

    setSelectedServices((prev) => [...prev, trimmed]);
    setServiceInput("");
  };

  const removeServiceTag = (service) => {
    setSelectedServices((prev) => prev.filter((item) => item !== service));
  };

  const handleServiceInputKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addServiceTag(serviceInput);
    }

    if (e.key === "Backspace" && !serviceInput && selectedServices.length > 0) {
      removeServiceTag(selectedServices[selectedServices.length - 1]);
    }
  };

  const saveDoctorLab = async () => {
    try {
      setSavingLab(true);
      setLabFormError("");
      setSuccessMessage("");

      const payload = {
        name: labForm.name.trim(),
        contactNumber: labForm.contactNumber.trim(),
        addressLine1: labForm.addressLine1.trim(),
        addressLine2: labForm.addressLine2.trim(),
        area: labForm.area.trim(),
        city: labForm.city.trim(),
        state: labForm.state.trim(),
        pincode: labForm.pincode.trim(),
        landmark: labForm.landmark.trim(),
        services: selectedServices,
      };

      const savedLab = await createDoctorLab(payload);

      setMyLabs((prev) => [savedLab, ...prev]);
      setSuccessMessage("Lab added successfully.");
      setShowAddLabModal(false);
      setLabForm(INITIAL_FORM);
      setSelectedServices([]);
      setServiceInput("");
    } catch (error) {
      console.error("Failed to save doctor lab:", error);
      setLabFormError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save lab."
      );
    } finally {
      setSavingLab(false);
    }
  };

  const toggleSystemLab = (labId) => {
    setOpenSystemLabId((prev) => (prev === labId ? null : labId));
  };

  const toggleMyLab = (labId) => {
    setOpenMyLabId((prev) => (prev === labId ? null : labId));
  };

  const systemLabsCount = systemLabs.length;
  const myLabsCount = myLabs.length;

  return (
    <div className="labs-page">
      <div className="labs-shell">
        <div className="labs-hero">
          <div className="labs-hero__content">
            <p className="labs-hero__eyebrow">Doctor Labs</p>
            <h1>Labs & Diagnostics</h1>
            <p className="labs-hero__description">
              Review verified labs, manage your own trusted labs, and keep your
              diagnostics workflow clean and organized.
            </p>
          </div>

          <div className="labs-hero__actions">
            <button className="labs-btn labs-btn--primary" onClick={openAddLabModal}>
              + Add My Lab
            </button>
          </div>
        </div>

        <div className="labs-stats">
          <div className="labs-stat-card">
            <span className="labs-stat-card__label">System Verified Labs</span>
            <strong>{systemLabsCount}</strong>
          </div>

          <div className="labs-stat-card">
            <span className="labs-stat-card__label">My Labs</span>
            <strong>{myLabsCount}</strong>
          </div>
        </div>

        <div className="labs-toolbar">
          <div className="labs-search">
            <span className="labs-search__icon">⌕</span>
            <input
              type="text"
              placeholder="Search lab name, area, city or state"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className="labs-toolbar__filters">
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
            >
              {SERVICE_OPTIONS.map((service) => (
                <option key={service} value={service}>
                  {service === "All" ? "All Services" : service}
                </option>
              ))}
            </select>

            <button className="labs-btn labs-btn--secondary" onClick={handleResetFilters}>
              Reset
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="labs-alert labs-alert--success">{successMessage}</div>
        )}

        {pageError && (
          <div className="labs-alert labs-alert--error">{pageError}</div>
        )}

        {loading ? (
          <div className="labs-loading-card">Loading labs module...</div>
        ) : (
          <>
            <section className="labs-section">
              <div className="labs-section__header">
                <div>
                  <h2>Recommended Labs</h2>
                  <p>System-verified labs available on the platform</p>
                </div>
                <span className="labs-section__count">{filteredSystemLabs.length} shown</span>
              </div>

              {filteredSystemLabs.length === 0 ? (
                <div className="labs-empty-card">
                  No verified labs matched your current filters.
                </div>
              ) : (
                <div className="labs-grid">
                  {filteredSystemLabs.map((lab) => {
                    const isOpen = openSystemLabId === lab.id;

                    return (
                      <article
                        className={`lab-card ${isOpen ? "lab-card--expanded" : ""}`}
                        key={lab.id}
                      >
                        <button
                          type="button"
                          className="lab-card__clickable"
                          onClick={() => toggleSystemLab(lab.id)}
                        >
                          <div className="lab-card__top">
                            <div className="lab-card__icon lab-card__icon--verified">✚</div>

                            <div className="lab-card__main">
                              <div className="lab-card__title-row">
                                <h3>{lab.name}</h3>
                                <span className="lab-badge lab-badge--verified">
                                  System Verified
                                </span>
                              </div>

                              <p className="lab-card__meta">{formatAddressLine(lab)}</p>

                              {lab.contactNumber && (
                                <p className="lab-card__contact">Contact: {lab.contactNumber}</p>
                              )}
                            </div>

                            <span className={`lab-card__chevron ${isOpen ? "open" : ""}`}>
                              ▾
                            </span>
                          </div>

                          <div className="lab-card__services">
                            {(lab.services || []).map((service) => (
                              <span className="service-chip" key={`${lab.id}-${service}`}>
                                {service}
                              </span>
                            ))}
                          </div>

                          <div className="lab-card__footer">
                            <div>
                              <p className="lab-card__footer-label">Payment</p>
                              <strong className="lab-card__footer-value">Online via Platform</strong>
                            </div>
                          </div>
                        </button>

                        {isOpen && (
                          <div className="lab-card__details">
                            <div className="lab-card__details-grid">
                              <div className="lab-card__detail-block">
                                <span className="lab-card__detail-label">Full Address</span>
                                <p>{formatFullAddress(lab)}</p>
                              </div>

                              <div className="lab-card__detail-block">
                                <span className="lab-card__detail-label">Contact</span>
                                <p>{lab.contactNumber || "Not available"}</p>
                              </div>

                              <div className="lab-card__detail-block">
                                <span className="lab-card__detail-label">Created</span>
                                <p>{formatDateTime(lab.createdAt)}</p>
                              </div>

                              <div className="lab-card__detail-block">
                                <span className="lab-card__detail-label">Services</span>
                                <p>{(lab.services || []).join(", ") || "No services"}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="labs-section">
              <div className="labs-section__header">
                <div>
                  <h2>My Added Labs</h2>
                  <p>Labs visible only inside your doctor workflow</p>
                </div>
                <span className="labs-section__count">{filteredMyLabs.length} shown</span>
              </div>

              {filteredMyLabs.length === 0 ? (
                <div className="labs-empty-card">
                  You have not added any custom labs yet.
                </div>
              ) : (
                <div className="labs-grid">
                  {filteredMyLabs.map((lab) => {
                    const isOpen = openMyLabId === lab.id;

                    return (
                      <article
                        className={`lab-card ${isOpen ? "lab-card--expanded" : ""}`}
                        key={lab.id}
                      >
                        <button
                          type="button"
                          className="lab-card__clickable"
                          onClick={() => toggleMyLab(lab.id)}
                        >
                          <div className="lab-card__top">
                            <div className="lab-card__icon lab-card__icon--custom">⌁</div>

                            <div className="lab-card__main">
                              <div className="lab-card__title-row">
                                <h3>{lab.name}</h3>
                                <span className="lab-badge lab-badge--custom">
                                  Doctor Added
                                </span>
                              </div>

                              <p className="lab-card__meta">{formatAddressLine(lab)}</p>

                              {lab.contactNumber && (
                                <p className="lab-card__contact">Contact: {lab.contactNumber}</p>
                              )}
                            </div>

                            <span className={`lab-card__chevron ${isOpen ? "open" : ""}`}>
                              ▾
                            </span>
                          </div>

                          <div className="lab-card__services">
                            {(lab.services || []).map((service) => (
                              <span className="service-chip" key={`${lab.id}-${service}`}>
                                {service}
                              </span>
                            ))}
                          </div>

                          <div className="lab-card__footer">
                            <div>
                              <p className="lab-card__footer-label">Payment</p>
                              <strong className="lab-card__footer-value">Offline / Direct</strong>
                            </div>
                          </div>
                        </button>

                        {isOpen && (
                          <div className="lab-card__details">
                            <div className="lab-card__details-grid">
                              <div className="lab-card__detail-block">
                                <span className="lab-card__detail-label">Full Address</span>
                                <p>{formatFullAddress(lab)}</p>
                              </div>

                              <div className="lab-card__detail-block">
                                <span className="lab-card__detail-label">Contact</span>
                                <p>{lab.contactNumber || "Not available"}</p>
                              </div>

                              <div className="lab-card__detail-block">
                                <span className="lab-card__detail-label">Created</span>
                                <p>{formatDateTime(lab.createdAt)}</p>
                              </div>

                              <div className="lab-card__detail-block">
                                <span className="lab-card__detail-label">Services</span>
                                <p>{(lab.services || []).join(", ") || "No services"}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="labs-info-strip">
              <div className="labs-info-strip__card">
                <h3>Workflow note</h3>
                <p>
                  Use this page to review labs, compare services, and maintain your
                  own trusted lab list. Actual patient-specific booking should happen
                  from Patient Details so the correct clinical context remains attached.
                </p>
              </div>
            </section>
          </>
        )}

        {showAddLabModal && (
          <div className="labs-modal-overlay" onClick={closeAddLabModal}>
            <div className="labs-modal" onClick={(e) => e.stopPropagation()}>
              <div className="labs-modal__header">
                <div>
                  <p className="labs-modal__eyebrow">Doctor Added Lab</p>
                  <h3>Add My Lab</h3>
                  <p>Add a local lab that you want to use inside your workflow.</p>
                </div>

                <button
                  type="button"
                  className="labs-modal__close"
                  onClick={closeAddLabModal}
                  disabled={savingLab}
                >
                  ×
                </button>
              </div>

              {labFormError && (
                <div className="labs-alert labs-alert--error labs-alert--compact">
                  {labFormError}
                </div>
              )}

              <div className="labs-modal__body">
                <div className="labs-form-grid">
                  <div className="labs-form-field">
                    <label>Lab Name</label>
                    <input
                      type="text"
                      value={labForm.name}
                      onChange={(e) => handleLabFormChange("name", e.target.value)}
                      placeholder="Enter lab name"
                    />
                  </div>

                  <div className="labs-form-field">
                    <label>Contact Number</label>
                    <input
                      type="text"
                      value={labForm.contactNumber}
                      onChange={(e) => handleLabFormChange("contactNumber", e.target.value)}
                      placeholder="Enter contact number"
                    />
                  </div>

                  <div className="labs-form-field labs-form-field--full">
                    <label>Address Line 1</label>
                    <input
                      type="text"
                      value={labForm.addressLine1}
                      onChange={(e) => handleLabFormChange("addressLine1", e.target.value)}
                      placeholder="Address line 1"
                    />
                  </div>

                  <div className="labs-form-field labs-form-field--full">
                    <label>Address Line 2</label>
                    <input
                      type="text"
                      value={labForm.addressLine2}
                      onChange={(e) => handleLabFormChange("addressLine2", e.target.value)}
                      placeholder="Address line 2"
                    />
                  </div>

                  <div className="labs-form-field">
                    <label>Area</label>
                    <input
                      type="text"
                      value={labForm.area}
                      onChange={(e) => handleLabFormChange("area", e.target.value)}
                      placeholder="Area"
                    />
                  </div>

                  <div className="labs-form-field">
                    <label>City</label>
                    <input
                      type="text"
                      value={labForm.city}
                      onChange={(e) => handleLabFormChange("city", e.target.value)}
                      placeholder="City"
                    />
                  </div>

                  <div className="labs-form-field">
                    <label>State</label>
                    <input
                      type="text"
                      value={labForm.state}
                      onChange={(e) => handleLabFormChange("state", e.target.value)}
                      placeholder="State"
                    />
                  </div>

                  <div className="labs-form-field">
                    <label>Pincode</label>
                    <input
                      type="text"
                      value={labForm.pincode}
                      onChange={(e) => handleLabFormChange("pincode", e.target.value)}
                      placeholder="Pincode"
                    />
                  </div>

                  <div className="labs-form-field labs-form-field--full">
                    <label>Landmark</label>
                    <input
                      type="text"
                      value={labForm.landmark}
                      onChange={(e) => handleLabFormChange("landmark", e.target.value)}
                      placeholder="Landmark"
                    />
                  </div>

                  <div className="labs-form-field labs-form-field--full">
                    <label>Services</label>

                    <div className="labs-tags-input">
                      {selectedServices.map((service) => (
                        <span className="labs-tag" key={service}>
                          {service}
                          <button
                            type="button"
                            className="labs-tag__remove"
                            onClick={() => removeServiceTag(service)}
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      <input
                        type="text"
                        value={serviceInput}
                        onChange={(e) => setServiceInput(e.target.value)}
                        onKeyDown={handleServiceInputKeyDown}
                        placeholder="Type service and press Enter"
                      />
                    </div>

                    {filteredServiceSuggestions.length > 0 && (
                      <div className="labs-suggestions">
                        {filteredServiceSuggestions.map((service) => (
                          <button
                            type="button"
                            key={service}
                            className="labs-suggestion-chip"
                            onClick={() => addServiceTag(service)}
                          >
                            {service}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="labs-modal__footer">
                <button
                  type="button"
                  className="labs-btn labs-btn--secondary"
                  onClick={closeAddLabModal}
                  disabled={savingLab}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="labs-btn labs-btn--primary"
                  onClick={saveDoctorLab}
                  disabled={savingLab}
                >
                  {savingLab ? "Saving..." : "Save Lab"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Labs;