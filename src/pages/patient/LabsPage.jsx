import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LabsPage.css";
import { useProfile } from "../../context/useProfile";
import {
  cancelPatientLabBooking,
  createPatientLabBooking,
  getPatientLabBookings,
  getPatientProfile,
  getPublicLabs,
  getPublicLabTests
} from "../../services/patientService";

const TIME_SLOTS = [
  "07:00 AM - 08:00 AM",
  "08:00 AM - 09:00 AM",
  "09:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "05:00 PM - 06:00 PM"
];

const POPULAR_SEARCHES = ["CBC", "Thyroid", "Diabetes", "X-Ray", "MRI", "ECG"];

const getDateByOffset = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date;
};

const formatDateForApi = (offsetDays) => {
  return getDateByOffset(offsetDays).toISOString().slice(0, 10);
};

const formatDateLabel = (offsetDays) => {
  return getDateByOffset(offsetDays).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short"
  });
};

const formatMoney = (value) => {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
};

const getLabLocation = (lab) => {
  return [lab?.area, lab?.city, lab?.state].filter(Boolean).join(", ") || "Location not updated";
};

const getLabAddress = (lab) => {
  return [
    lab?.addressLine1,
    lab?.addressLine2,
    lab?.area,
    lab?.city,
    lab?.state,
    lab?.pincode
  ]
    .filter(Boolean)
    .join(", ");
};

const getProfileName = (profile) => {
  return profile?.fullName || profile?.name || profile?.patientName || "Selected Patient";
};

const getSelectedProfileType = (profile) => {
  const explicitType =
    profile?.type || profile?.profileType || profile?.patientProfileType;

  if (explicitType) {
    return String(explicitType).toUpperCase();
  }

  const relation = String(profile?.relation || "").toLowerCase();

  if (relation && relation !== "self") {
    return "FAMILY";
  }

  return "SELF";
};

const getMinimumPrice = (tests) => {
  if (!Array.isArray(tests) || tests.length === 0) {
    return null;
  }

  const prices = tests
    .map((test) => Number(test.price || 0))
    .filter((price) => price > 0);

  if (prices.length === 0) {
    return null;
  }

  return Math.min(...prices);
};

const doesLabProvideTest = (lab, test) => {
  const services = (lab?.services || []).map((item) =>
    String(item || "").toLowerCase()
  );

  if (services.length === 0) {
    return true;
  }

  const serviceType = String(test?.serviceType || "").toLowerCase();
  const category = String(test?.category || "").toLowerCase();
  const testName = String(test?.testName || "").toLowerCase();

  return services.some((service) => {
    return (
      serviceType === service ||
      category === service ||
      serviceType.includes(service) ||
      category.includes(service) ||
      testName.includes(service)
    );
  });
};

const ToggleSwitch = ({ id, checked, onChange }) => {
  return (
    <label className="labs-pro-switch" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={onChange} />
      <span />
    </label>
  );
};

const LabsPage = () => {
  const navigate = useNavigate();
  const { selectedProfile } = useProfile();

  const [labs, setLabs] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [bookingHistoryLoading, setBookingHistoryLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  const [search, setSearch] = useState("");
  const [activeService, setActiveService] = useState("ALL");
  const [priceRange, setPriceRange] = useState(8000);
  const [homePickupFilter, setHomePickupFilter] = useState(false);

  const [selectedLab, setSelectedLab] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("tests");
  const [modalSearch, setModalSearch] = useState("");

  const [selectedTests, setSelectedTests] = useState([]);
  const [homePickup, setHomePickup] = useState(true);
  const [selectedDateOffset, setSelectedDateOffset] = useState(1);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[1]);
  const [pickupAddress, setPickupAddress] = useState("");
  const [patientNote, setPatientNote] = useState("");

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTargetBooking, setCancelTargetBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const fetchLabsAndTests = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");

      const [labsResponse, testsResponse] = await Promise.all([
        getPublicLabs(),
        getPublicLabTests()
      ]);

      setLabs(Array.isArray(labsResponse) ? labsResponse : []);
      setLabTests(Array.isArray(testsResponse) ? testsResponse : []);
    } catch (error) {
      console.error("Failed to load labs/tests", error);
      setPageError(
        error.response?.data?.message ||
        "Unable to load diagnostic labs right now."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      setBookingHistoryLoading(true);

      const response = await getPatientLabBookings();
      setBookings(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Failed to load lab bookings", error);
      setBookings([]);
    } finally {
      setBookingHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLabsAndTests();
    fetchBookings();
  }, [fetchLabsAndTests, fetchBookings]);

  useEffect(() => {
    if (!modalOpen && !cancelModalOpen) {
      document.body.style.overflow = "unset";
      return undefined;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [modalOpen, cancelModalOpen]);

  useEffect(() => {
    if (!homePickup) {
      setPickupAddress("");
    }
  }, [homePickup]);

  const serviceOptions = useMemo(() => {
    const serviceSet = new Set();

    labs.forEach((lab) => {
      (lab.services || []).forEach((service) => {
        if (service) serviceSet.add(service);
      });
    });

    labTests.forEach((test) => {
      if (test.serviceType) serviceSet.add(test.serviceType);
    });

    return ["ALL", ...Array.from(serviceSet).sort((a, b) => a.localeCompare(b))];
  }, [labs, labTests]);

  const labTestMap = useMemo(() => {
    const map = new Map();

    labs.forEach((lab) => {
      const testsForLab = labTests.filter((test) => doesLabProvideTest(lab, test));
      map.set(lab.id, testsForLab);
    });

    return map;
  }, [labs, labTests]);

  const filteredLabs = useMemo(() => {
    const q = search.trim().toLowerCase();

    return labs.filter((lab) => {
      const testsForLab = labTestMap.get(lab.id) || [];
      const minimumPrice = getMinimumPrice(testsForLab) || 0;

      const searchable = [
        lab.name,
        lab.area,
        lab.city,
        lab.state,
        lab.pincode,
        lab.contactNumber,
        ...(lab.services || []),
        ...testsForLab.map((test) => test.testName),
        ...testsForLab.map((test) => test.serviceType),
        ...testsForLab.map((test) => test.category)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchSearch = q ? searchable.includes(q) : true;

      const matchService =
        activeService === "ALL"
          ? true
          : (lab.services || []).some(
            (service) =>
              String(service).toLowerCase() === activeService.toLowerCase()
          ) ||
          testsForLab.some((test) => {
            const serviceType = String(test.serviceType || "").toLowerCase();
            const category = String(test.category || "").toLowerCase();
            const selected = activeService.toLowerCase();

            return serviceType === selected || category.includes(selected);
          });

      const matchPrice = minimumPrice <= Number(priceRange);
      const matchPickup = homePickupFilter ? true : true;

      return matchSearch && matchService && matchPrice && matchPickup;
    });
  }, [labs, labTestMap, search, activeService, priceRange, homePickupFilter]);

  const selectedLabTests = useMemo(() => {
    if (!selectedLab) {
      return [];
    }

    const testsForLab = labTestMap.get(selectedLab.id) || [];
    const q = modalSearch.trim().toLowerCase();

    if (!q) {
      return testsForLab;
    }

    return testsForLab.filter((test) => {
      const searchable = [
        test.testName,
        test.testCode,
        test.category,
        test.serviceType
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [selectedLab, labTestMap, modalSearch]);

  const selectedTestObjects = useMemo(() => {
    return labTests.filter((test) => selectedTests.includes(test.id));
  }, [labTests, selectedTests]);

  const subtotal = useMemo(() => {
    return selectedTestObjects.reduce(
      (total, test) => total + Number(test.price || 0),
      0
    );
  }, [selectedTestObjects]);

  const gst = Math.round(subtotal * 0.05);
  const serviceCharge = subtotal > 0 ? 50 : 0;
  const pickupFee = homePickup && subtotal > 0 ? 120 : 0;
  const grandTotal = subtotal + gst + serviceCharge + pickupFee;

  const resolveBookingProfile = async () => {
    if (!selectedProfile) {
      throw new Error("Please select patient profile first.");
    }

    const profileType = getSelectedProfileType(selectedProfile);

    if (profileType === "SELF") {
      const profile = await getPatientProfile();

      if (!profile?.id) {
        throw new Error("Please complete your patient profile before booking.");
      }

      return {
        patientProfileId: profile.id,
        patientProfileType: "SELF"
      };
    }

    if (!selectedProfile.id) {
      throw new Error("Selected family member profile is invalid.");
    }

    return {
      patientProfileId: selectedProfile.id,
      patientProfileType: "FAMILY"
    };
  };

  const openLabModal = (lab) => {
    setSelectedLab(lab);
    setModalOpen(true);
    setActiveTab("tests");
    setModalSearch("");
    setSelectedTests([]);
    setHomePickup(true);
    setSelectedDateOffset(1);
    setSelectedTimeSlot(TIME_SLOTS[1]);
    setPickupAddress("");
    setPatientNote("");
    setBookingMessage("");
    setBookingSuccess(null);
  };

  const closeLabModal = () => {
    if (bookingLoading) return;

    setSelectedLab(null);
    setModalOpen(false);
    setActiveTab("tests");
    setModalSearch("");
    setSelectedTests([]);
    setHomePickup(true);
    setPickupAddress("");
    setPatientNote("");
    setBookingMessage("");
    setBookingSuccess(null);
  };

  const resetFilters = () => {
    setSearch("");
    setActiveService("ALL");
    setPriceRange(8000);
    setHomePickupFilter(false);
  };

  const toggleTest = (testId) => {
    setSelectedTests((prev) => {
      if (prev.includes(testId)) {
        return prev.filter((id) => id !== testId);
      }

      return [...prev, testId];
    });
  };

  const handleConfirmBooking = async () => {
    if (!selectedLab?.id) {
      setBookingMessage("Please select a lab first.");
      return;
    }

    if (!selectedProfile) {
      setBookingMessage("Please select patient profile first.");
      navigate("/patient/profile");
      return;
    }

    if (selectedTests.length === 0) {
      setBookingMessage("Please select at least one test.");
      return;
    }

    if (homePickup && !pickupAddress.trim()) {
      setBookingMessage("Pickup address is required for home sample pickup.");
      return;
    }

    try {
      setBookingLoading(true);
      setBookingMessage("");
      setBookingSuccess(null);

      const bookingProfile = await resolveBookingProfile();

      const payload = {
        labId: selectedLab.id,
        patientProfileId: bookingProfile.patientProfileId,
        patientProfileType: bookingProfile.patientProfileType,
        testIds: selectedTests,
        homePickup,
        preferredDate: formatDateForApi(selectedDateOffset),
        preferredTimeSlot: selectedTimeSlot,
        pickupAddress: homePickup ? pickupAddress.trim() : null,
        patientNote: patientNote.trim() || "Booked from patient labs page"
      };

      const response = await createPatientLabBooking(payload);

      setBookingSuccess(response);
      setBookingMessage("Lab booking confirmed successfully.");
      await fetchBookings();
    } catch (error) {
      console.error("Lab booking failed", error);

      setBookingMessage(
        error.response?.data?.message ||
        error.message ||
        "Unable to book lab test. Please try again."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const openCancelModal = (booking) => {
    setCancelTargetBooking(booking);
    setCancelReason("");
    setCancelError("");
    setCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    if (cancelLoading) return;

    setCancelModalOpen(false);
    setCancelTargetBooking(null);
    setCancelReason("");
    setCancelError("");
  };

  const handleSubmitCancelBooking = async () => {
    if (!cancelTargetBooking?.id) {
      setCancelError("Booking not found. Please refresh and try again.");
      return;
    }

    if (!cancelReason.trim()) {
      setCancelError("Please enter cancellation reason.");
      return;
    }

    if (cancelReason.trim().length < 3) {
      setCancelError("Cancellation reason is too short.");
      return;
    }

    try {
      setCancelLoading(true);
      setCancelError("");

      await cancelPatientLabBooking(cancelTargetBooking.id, {
        reason: cancelReason.trim()
      });

      await fetchBookings();
      closeCancelModal();
    } catch (error) {
      console.error("Cancel booking failed", error);
      setCancelError(
        error.response?.data?.message ||
        "Unable to cancel booking. Please try again."
      );
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="labs-pro-page">
      <section className="labs-pro-hero">
        <div className="labs-pro-hero-left">
          <span className="labs-pro-eyebrow">Verified diagnostic partners</span>
          <h1>Book lab tests with trusted diagnostic centers</h1>
          <p>
            Select platform-approved labs, choose required tests, schedule home
            pickup, and manage your diagnostic bookings with a clean patient-first
            flow.
          </p>

          <div className="labs-pro-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search labs, tests, city, service..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button type="button" onClick={() => setSearch("")}>
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="labs-pro-hero-stats">
          <div>
            <strong>{labs.length}</strong>
            <span>Approved Labs</span>
          </div>
          <div>
            <strong>{labTests.length}</strong>
            <span>Active Tests</span>
          </div>
          <div>
            <strong>{bookings.length}</strong>
            <span>Your Bookings</span>
          </div>
        </div>
      </section>

      <section className="labs-pro-popular">
        <span>Popular searches</span>
        {POPULAR_SEARCHES.map((item) => (
          <button type="button" key={item} onClick={() => setSearch(item)}>
            {item}
          </button>
        ))}
      </section>

      <section className="labs-pro-layout">
        <aside className="labs-pro-filter">
          <div className="labs-pro-filter-head">
            <h3>Filters</h3>
            <button type="button" onClick={resetFilters}>
              Reset
            </button>
          </div>

          <div className="labs-pro-field">
            <label>Service Type</label>
            <select
              value={activeService}
              onChange={(event) => setActiveService(event.target.value)}
            >
              {serviceOptions.map((service) => (
                <option value={service} key={service}>
                  {service === "ALL" ? "All Services" : service}
                </option>
              ))}
            </select>
          </div>

          <div className="labs-pro-field">
            <label>Starting price up to</label>
            <input
              type="range"
              min="0"
              max="8000"
              step="100"
              value={priceRange}
              onChange={(event) => setPriceRange(event.target.value)}
            />
            <div className="labs-pro-range-row">
              <span>₹0</span>
              <strong>{formatMoney(priceRange)}</strong>
            </div>
          </div>

          <div className="labs-pro-pickup-filter">
            <div>
              <strong>Home pickup</strong>
              <p>Show labs supporting sample pickup.</p>
            </div>

            <ToggleSwitch
              id="homePickupFilter"
              checked={homePickupFilter}
              onChange={() => setHomePickupFilter((prev) => !prev)}
            />
          </div>

          <div className="labs-pro-profile-card">
            <span>Selected Patient</span>

            {selectedProfile ? (
              <>
                <strong>{getProfileName(selectedProfile)}</strong>
                <p>
                  {selectedProfile.relation || "Self"} •{" "}
                  {selectedProfile.gender || "Gender not set"}
                </p>
              </>
            ) : (
              <>
                <strong>No profile selected</strong>
                <p>Select a patient profile before booking.</p>
                <button type="button" onClick={() => navigate("/patient/profile")}>
                  Select Profile
                </button>
              </>
            )}
          </div>
        </aside>

        <main className="labs-pro-main">
          <div className="labs-pro-section-head">
            <div>
              <h2>Available Labs</h2>
              <p>{filteredLabs.length} verified labs found</p>
            </div>

            <button type="button" onClick={fetchLabsAndTests}>
              Refresh
            </button>
          </div>

          {loading && <div className="labs-pro-state">Loading diagnostic labs...</div>}

          {!loading && pageError && (
            <div className="labs-pro-state error">{pageError}</div>
          )}

          {!loading && !pageError && filteredLabs.length === 0 && (
            <div className="labs-pro-state">
              No labs found. Try changing filters or search.
            </div>
          )}

          {!loading && !pageError && filteredLabs.length > 0 && (
            <div className="labs-pro-grid">
              {filteredLabs.map((lab) => {
                const testsForLab = labTestMap.get(lab.id) || [];
                const minPrice = getMinimumPrice(testsForLab);

                return (
                  <article className="labs-pro-card" key={lab.id}>
                    <div className="labs-pro-card-top">
                      <div className="labs-pro-icon">🧪</div>

                      <div>
                        <h3>{lab.name}</h3>
                        <p>{getLabLocation(lab)}</p>
                      </div>

                      <span className="labs-pro-badge">Verified</span>
                    </div>

                    <div className="labs-pro-metrics">
                      <div>
                        <span>Tests</span>
                        <strong>{testsForLab.length || labTests.length}</strong>
                      </div>
                      <div>
                        <span>Starting</span>
                        <strong>{minPrice ? formatMoney(minPrice) : "N/A"}</strong>
                      </div>
                      <div>
                        <span>Pickup</span>
                        <strong>Available</strong>
                      </div>
                    </div>

                    <p className="labs-pro-address">{getLabAddress(lab)}</p>

                    <div className="labs-pro-service-pills">
                      {(lab.services || []).slice(0, 6).map((service) => (
                        <span key={service}>{service}</span>
                      ))}
                      {(lab.services || []).length > 6 && (
                        <span>+{lab.services.length - 6} more</span>
                      )}
                    </div>

                    <div className="labs-pro-card-actions">
                      <a href={`tel:${lab.contactNumber || ""}`}>Call Lab</a>
                      <button type="button" onClick={() => openLabModal(lab)}>
                        Book Tests
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <section className="labs-pro-bookings">
            <div className="labs-pro-section-head compact">
              <div>
                <h2>My Lab Bookings</h2>
                <p>Recent diagnostic bookings from your account.</p>
              </div>

              <button type="button" onClick={fetchBookings}>
                Refresh
              </button>
            </div>

            {bookingHistoryLoading && (
              <div className="labs-pro-state">Loading your bookings...</div>
            )}

            {!bookingHistoryLoading && bookings.length === 0 && (
              <div className="labs-pro-state">No lab bookings found yet.</div>
            )}

            {!bookingHistoryLoading && bookings.length > 0 && (
              <div className="labs-pro-booking-grid">
                {bookings.slice(0, 6).map((booking) => (
                  <div className="labs-pro-booking-card" key={booking.id}>
                    <div>
                      <span className={`labs-pro-status ${String(booking.status || "").toLowerCase()}`}>
                        {booking.status}
                      </span>
                      <h3>{booking.labName}</h3>
                      <p>
                        {booking.patientName} • {booking.relation || "Self"}
                      </p>
                    </div>

                    <div className="labs-pro-booking-tests">
                      {(booking.tests || []).slice(0, 2).map((test) => (
                        <span key={test.id}>{test.testName}</span>
                      ))}
                      {(booking.tests || []).length > 2 && (
                        <span>+{booking.tests.length - 2} more</span>
                      )}
                    </div>

                    <div className="labs-pro-booking-footer">
                      <strong>{formatMoney(booking.totalAmount)}</strong>
                      {booking.status !== "CANCELLED" && (
                        <button
                          type="button"
                          onClick={() => openCancelModal(booking)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </section>

      {modalOpen && selectedLab && (
        <div className="labs-pro-modal-overlay">
          <div className="labs-pro-modal">
            <header className="labs-pro-modal-header">
              <div>
                <span>Platform Verified Lab</span>
                <h2>{selectedLab.name}</h2>
                <p>{getLabAddress(selectedLab)}</p>
              </div>

              <div className="labs-pro-modal-actions">
                {selectedLab.contactNumber && (
                  <a href={`tel:${selectedLab.contactNumber}`}>Call Lab</a>
                )}
                <button type="button" onClick={closeLabModal}>
                  ×
                </button>
              </div>
            </header>

            {bookingSuccess ? (
              <div className="labs-pro-success-panel">
                <div className="labs-pro-success-icon">✓</div>
                <h3>Lab booking confirmed</h3>
                <p>
                  Booking #{bookingSuccess.id} has been created successfully for{" "}
                  {bookingSuccess.labName}.
                </p>

                <div className="labs-pro-success-grid">
                  <div>
                    <span>Status</span>
                    <strong>{bookingSuccess.status}</strong>
                  </div>
                  <div>
                    <span>Total</span>
                    <strong>{formatMoney(bookingSuccess.totalAmount)}</strong>
                  </div>
                  <div>
                    <span>Collection</span>
                    <strong>{bookingSuccess.collectionType}</strong>
                  </div>
                </div>

                <button type="button" onClick={closeLabModal}>
                  Done
                </button>
              </div>
            ) : (
              <>
                <nav className="labs-pro-tabs">
                  <button
                    type="button"
                    className={activeTab === "tests" ? "active" : ""}
                    onClick={() => setActiveTab("tests")}
                  >
                    Available Tests
                  </button>
                  <button
                    type="button"
                    className={activeTab === "details" ? "active" : ""}
                    onClick={() => setActiveTab("details")}
                  >
                    Booking Details
                  </button>
                  <button
                    type="button"
                    className={activeTab === "about" ? "active" : ""}
                    onClick={() => setActiveTab("about")}
                  >
                    About Lab
                  </button>
                  <button
                    type="button"
                    className={activeTab === "bookings" ? "active" : ""}
                    onClick={() => setActiveTab("bookings")}
                  >
                    My Bookings
                  </button>
                </nav>

                <div className="labs-pro-modal-body">
                  <section className="labs-pro-modal-main">
                    {activeTab === "tests" && (
                      <div className="labs-pro-panel">
                        <div className="labs-pro-panel-head">
                          <div>
                            <h3>Select Tests</h3>
                            <p>{selectedTests.length} selected</p>
                          </div>

                          {selectedTests.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedTests([])}
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        <div className="labs-pro-modal-search">
                          <span>⌕</span>
                          <input
                            type="text"
                            placeholder="Search test name, code, category..."
                            value={modalSearch}
                            onChange={(event) => setModalSearch(event.target.value)}
                          />
                        </div>

                        <div className="labs-pro-test-list">
                          {selectedLabTests.length === 0 && (
                            <div className="labs-pro-state">No tests found.</div>
                          )}

                          {selectedLabTests.map((test) => {
                            const checked = selectedTests.includes(test.id);

                            return (
                              <button
                                type="button"
                                key={test.id}
                                className={`labs-pro-test-row ${checked ? "selected" : ""
                                  }`}
                                onClick={() => toggleTest(test.id)}
                              >
                                <span className="labs-pro-check">
                                  {checked ? "✓" : ""}
                                </span>

                                <span className="labs-pro-test-info">
                                  <strong>{test.testName}</strong>
                                  <small>
                                    {test.testCode || "TEST"} •{" "}
                                    {test.category || test.serviceType || "Lab Test"}
                                  </small>
                                </span>

                                <strong className="labs-pro-test-price">
                                  {formatMoney(test.price)}
                                </strong>
                              </button>
                            );
                          })}
                        </div>

                        <div className="labs-pro-next-row">
                          <button
                            type="button"
                            onClick={() => setActiveTab("details")}
                          >
                            Continue to Booking Details
                          </button>
                        </div>
                      </div>
                    )}

                    {activeTab === "details" && (
                      <div className="labs-pro-panel">
                        <div className="labs-pro-panel-head">
                          <div>
                            <h3>Booking Details</h3>
                            <p>Choose date, time and collection preference.</p>
                          </div>
                        </div>

                        <div className="labs-pro-form-grid">
                          <label>
                            <span>Preferred Date</span>
                            <select
                              value={selectedDateOffset}
                              onChange={(event) =>
                                setSelectedDateOffset(Number(event.target.value))
                              }
                            >
                              {[1, 2, 3, 4, 5, 6, 7].map((offset) => (
                                <option key={offset} value={offset}>
                                  {formatDateLabel(offset)}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label>
                            <span>Preferred Time</span>
                            <select
                              value={selectedTimeSlot}
                              onChange={(event) =>
                                setSelectedTimeSlot(event.target.value)
                              }
                            >
                              {TIME_SLOTS.map((slot) => (
                                <option key={slot} value={slot}>
                                  {slot}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <div className="labs-pro-pickup-card">
                          <div>
                            <strong>Home Sample Pickup</strong>
                            <p>Technician will collect sample from your address.</p>
                          </div>

                          <ToggleSwitch
                            id="homePickup"
                            checked={homePickup}
                            onChange={() => setHomePickup((prev) => !prev)}
                          />
                        </div>

                        {homePickup && (
                          <label className="labs-pro-textarea-field">
                            <span>Pickup Address</span>
                            <textarea
                              rows="4"
                              value={pickupAddress}
                              onChange={(event) => setPickupAddress(event.target.value)}
                              placeholder="Flat no, building, street, area, landmark..."
                            />
                          </label>
                        )}

                        <label className="labs-pro-textarea-field">
                          <span>Patient Note</span>
                          <textarea
                            rows="3"
                            value={patientNote}
                            onChange={(event) => setPatientNote(event.target.value)}
                            placeholder="Any instruction for lab technician..."
                          />
                        </label>

                        <div className="labs-pro-patient-box">
                          <span>Selected Patient</span>

                          {selectedProfile ? (
                            <>
                              <strong>{getProfileName(selectedProfile)}</strong>
                              <p>
                                {selectedProfile.relation || "Self"} •{" "}
                                {selectedProfile.gender || "Gender not set"}
                              </p>
                            </>
                          ) : (
                            <>
                              <strong>No patient profile selected</strong>
                              <button
                                type="button"
                                onClick={() => navigate("/patient/profile")}
                              >
                                Select Profile
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === "about" && (
                      <div className="labs-pro-panel">
                        <div className="labs-pro-panel-head">
                          <div>
                            <h3>About {selectedLab.name}</h3>
                            <p>Platform approved diagnostic partner.</p>
                          </div>
                        </div>

                        <div className="labs-pro-about">
                          <p>
                            {selectedLab.name} is available on Doctor’s Hub for
                            verified diagnostic services, home sample collection,
                            and transparent test pricing.
                          </p>

                          <div>
                            <strong>Address</strong>
                            <span>{getLabAddress(selectedLab)}</span>
                          </div>

                          <div>
                            <strong>Contact</strong>
                            <span>{selectedLab.contactNumber || "Not updated"}</span>
                          </div>

                          <div>
                            <strong>Services</strong>
                            <span>
                              {(selectedLab.services || []).join(", ") ||
                                "Diagnostic services"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "bookings" && (
                      <div className="labs-pro-panel">
                        <div className="labs-pro-panel-head">
                          <div>
                            <h3>My Lab Bookings</h3>
                            <p>Bookings created from your patient account.</p>
                          </div>
                        </div>

                        <div className="labs-pro-modal-bookings">
                          {bookings.length === 0 && (
                            <div className="labs-pro-state">
                              No lab bookings found yet.
                            </div>
                          )}

                          {bookings.map((booking) => (
                            <div
                              className="labs-pro-modal-booking"
                              key={booking.id}
                            >
                              <div>
                                <span className={`labs-pro-status ${String(booking.status || "").toLowerCase()}`}>
                                  {booking.status}
                                </span>
                                <h4>{booking.labName}</h4>
                                <p>
                                  {booking.preferredDate || "Date not selected"} •{" "}
                                  {booking.preferredTimeSlot || "Slot not selected"}
                                </p>
                              </div>

                              <strong>{formatMoney(booking.totalAmount)}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>

                  <aside className="labs-pro-summary">
                    <h3>Bill Summary</h3>

                    <div className="labs-pro-summary-patient">
                      <span>Booking For</span>
                      {selectedProfile ? (
                        <>
                          <strong>{getProfileName(selectedProfile)}</strong>
                          <p>
                            {selectedProfile.relation || "Self"} •{" "}
                            {selectedProfile.gender || "Gender not set"}
                          </p>
                        </>
                      ) : (
                        <>
                          <strong>No profile selected</strong>
                          <p>Select profile before booking.</p>
                        </>
                      )}
                    </div>

                    <div className="labs-pro-summary-tests">
                      <span>Selected Tests</span>

                      {selectedTestObjects.length === 0 ? (
                        <p>No tests selected yet.</p>
                      ) : (
                        selectedTestObjects.map((test) => (
                          <div key={test.id}>
                            <small>{test.testName}</small>
                            <strong>{formatMoney(test.price)}</strong>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="labs-pro-bill-line">
                      <span>Subtotal</span>
                      <strong>{formatMoney(subtotal)}</strong>
                    </div>

                    <div className="labs-pro-bill-line">
                      <span>GST 5%</span>
                      <strong>{formatMoney(gst)}</strong>
                    </div>

                    <div className="labs-pro-bill-line">
                      <span>Service Charge</span>
                      <strong>{formatMoney(serviceCharge)}</strong>
                    </div>

                    <div className="labs-pro-bill-line">
                      <span>Pickup Fee</span>
                      <strong>{formatMoney(pickupFee)}</strong>
                    </div>

                    <div className="labs-pro-total">
                      <span>Total Payable</span>
                      <strong>{formatMoney(grandTotal)}</strong>
                    </div>

                    {bookingMessage && (
                      <div
                        className={`labs-pro-message ${bookingMessage.toLowerCase().includes("success")
                            ? "success"
                            : "error"
                          }`}
                      >
                        {bookingMessage}
                      </div>
                    )}

                    <button
                      type="button"
                      className="labs-pro-confirm"
                      onClick={handleConfirmBooking}
                      disabled={bookingLoading || selectedTests.length === 0}
                    >
                      {bookingLoading ? "Booking..." : "Book Lab Test"}
                    </button>

                    <p className="labs-pro-note">
                      Backend calculates final bill from selected test IDs.
                    </p>
                  </aside>
                </div>
              </>
            )}


          </div>
        </div>
      )}


      {cancelModalOpen && cancelTargetBooking && (
        <div className="labs-cancel-modal-overlay">
          <div className="labs-cancel-modal" role="dialog" aria-modal="true">
            <div className="labs-cancel-modal-icon">!</div>

            <h3>Cancel lab booking?</h3>

            <p>
              You are cancelling booking for{" "}
              <strong>{cancelTargetBooking.labName}</strong>. Please add a reason so
              the support/lab team can understand the cancellation.
            </p>

            <div className="labs-cancel-booking-summary">
              <div>
                <span>Patient</span>
                <strong>{cancelTargetBooking.patientName}</strong>
              </div>

              <div>
                <span>Total</span>
                <strong>{formatMoney(cancelTargetBooking.totalAmount)}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{cancelTargetBooking.status}</strong>
              </div>
            </div>

            <label className="labs-cancel-reason-field">
              <span>Cancellation Reason</span>
              <textarea
                rows="4"
                value={cancelReason}
                maxLength={500}
                placeholder="Example: Booked by mistake, schedule changed, selected wrong test..."
                onChange={(event) => {
                  setCancelReason(event.target.value);
                  setCancelError("");
                }}
              />
              <small>{cancelReason.length}/500 characters</small>
            </label>

            {cancelError && (
              <div className="labs-cancel-error">{cancelError}</div>
            )}

            <div className="labs-cancel-actions">
              <button
                type="button"
                className="labs-cancel-secondary"
                onClick={closeCancelModal}
                disabled={cancelLoading}
              >
                Keep Booking
              </button>

              <button
                type="button"
                className="labs-cancel-danger"
                onClick={handleSubmitCancelBooking}
                disabled={cancelLoading}
              >
                {cancelLoading ? "Cancelling..." : "Cancel Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabsPage;