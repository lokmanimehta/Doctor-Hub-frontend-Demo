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


const Icon = ({ name, size = 18 }) => {
  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.8-3.8" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.8 2.8 8.2 7 10 4.2-1.8 7-5.2 7-10V6l-7-3Z" />
        <path d="m9.2 12 1.9 1.9 3.9-4.2" />
      </>
    ),
    lab: (
      <>
        <path d="M9 3h6" />
        <path d="M10 3v5.2L5.8 16a3 3 0 0 0 2.6 4.5h7.2a3 3 0 0 0 2.6-4.5L14 8.2V3" />
        <path d="M8.1 15h7.8" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </>
    ),
    map: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    phone: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
    ),
    refresh: (
      <>
        <path d="M20 11a8 8 0 1 0-2.3 5.7" />
        <path d="M20 4v7h-7" />
      </>
    ),
    filter: (
      <>
        <path d="M4 6h16M7 12h10M10 18h4" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v11h14V10M9 21v-7h6v7" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    arrow: <path d="m9 18 6-6-6-6" />,
    receipt: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
    alert: (
      <>
        <path d="M10.3 4.2 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    )
  };

  return (
    <svg
      className="labs-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.lab}
    </svg>
  );
};

const getLabInitials = (name) => {
  const words = String(name || "Lab")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("") || "LB";
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
      <div className="labs-pro-shell">
        <section className="labs-pro-overview" aria-labelledby="labs-page-title">
          <div className="labs-pro-overview-copy">
            <div className="labs-pro-kicker">
              <Icon name="shield" size={16} />
              <span>Verified diagnostic network</span>
            </div>

            <h1 id="labs-page-title">Find and book diagnostic tests</h1>
            <p>
              Compare approved laboratories, review available tests, and schedule
              either a home sample pickup or a direct lab visit.
            </p>
          </div>

          <div className="labs-pro-overview-stats" aria-label="Lab statistics">
            <div className="labs-pro-stat">
              <span>Approved labs</span>
              <strong>{labs.length}</strong>
            </div>
            <div className="labs-pro-stat">
              <span>Available tests</span>
              <strong>{labTests.length}</strong>
            </div>
            <div className="labs-pro-stat">
              <span>Your bookings</span>
              <strong>{bookings.length}</strong>
            </div>
          </div>

          <div className="labs-pro-discovery">
            <label className="labs-pro-search" htmlFor="lab-search">
              <Icon name="search" size={19} />
              <input
                id="lab-search"
                type="search"
                placeholder="Search by lab, test, service, or location"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="labs-pro-search-clear"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  Clear
                </button>
              )}
            </label>

            <div className="labs-pro-popular" aria-label="Popular test searches">
              <span>Quick search</span>
              <div>
                {POPULAR_SEARCHES.map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={search === item ? "active" : ""}
                    onClick={() => setSearch(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="labs-pro-layout">
          <aside className="labs-pro-filter" aria-label="Lab filters">
            <div className="labs-pro-filter-head">
              <div>
                <span className="labs-pro-section-label">Refine results</span>
                <h2>Filters</h2>
              </div>
              <button type="button" onClick={resetFilters}>
                Reset
              </button>
            </div>

            <div className="labs-pro-field">
              <label htmlFor="service-filter">Service type</label>
              <select
                id="service-filter"
                value={activeService}
                onChange={(event) => setActiveService(event.target.value)}
              >
                {serviceOptions.map((service) => (
                  <option value={service} key={service}>
                    {service === "ALL" ? "All services" : service}
                  </option>
                ))}
              </select>
            </div>

            <div className="labs-pro-field labs-pro-price-field">
              <div className="labs-pro-field-heading">
                <label htmlFor="price-filter">Starting price</label>
                <strong>{formatMoney(priceRange)}</strong>
              </div>
              <input
                id="price-filter"
                type="range"
                min="0"
                max="8000"
                step="100"
                value={priceRange}
                onChange={(event) => setPriceRange(event.target.value)}
                aria-valuetext={`Up to ${formatMoney(priceRange)}`}
              />
              <div className="labs-pro-range-row">
                <span>₹0</span>
                <span>₹8,000</span>
              </div>
            </div>

            <div className="labs-pro-pickup-filter">
              <div className="labs-pro-pickup-icon">
                <Icon name="home" size={18} />
              </div>
              <div className="labs-pro-pickup-copy">
                <strong>Home pickup</strong>
                <p>Prioritise labs offering sample collection at home.</p>
              </div>
              <ToggleSwitch
                id="homePickupFilter"
                checked={homePickupFilter}
                onChange={() => setHomePickupFilter((prev) => !prev)}
              />
            </div>

            <div className="labs-pro-profile-card">
              <div className="labs-pro-profile-icon">
                <Icon name="user" size={18} />
              </div>
              <div>
                <span>Booking for</span>
                {selectedProfile ? (
                  <>
                    <strong>{getProfileName(selectedProfile)}</strong>
                    <p>
                      {selectedProfile.relation || "Self"} ·{" "}
                      {selectedProfile.gender || "Gender not set"}
                    </p>
                  </>
                ) : (
                  <>
                    <strong>No profile selected</strong>
                    <p>Select a patient profile before booking.</p>
                    <button
                      type="button"
                      onClick={() => navigate("/patient/profile")}
                    >
                      Select profile
                    </button>
                  </>
                )}
              </div>
            </div>
          </aside>

          <main className="labs-pro-main">
            <div className="labs-pro-section-head">
              <div>
                <span className="labs-pro-section-label">Diagnostic partners</span>
                <h2>Available labs</h2>
                <p>{filteredLabs.length} verified labs match your selection.</p>
              </div>

              <button
                type="button"
                className="labs-pro-refresh"
                onClick={fetchLabsAndTests}
                disabled={loading}
              >
                <Icon name="refresh" size={17} />
                <span>{loading ? "Refreshing" : "Refresh"}</span>
              </button>
            </div>

            {loading && (
              <div className="labs-pro-state">
                <div className="labs-pro-state-icon">
                  <Icon name="lab" size={21} />
                </div>
                <div>
                  <strong>Loading diagnostic labs</strong>
                  <p>Please wait while the latest availability is fetched.</p>
                </div>
              </div>
            )}

            {!loading && pageError && (
              <div className="labs-pro-state error">
                <div className="labs-pro-state-icon">
                  <Icon name="alert" size={21} />
                </div>
                <div>
                  <strong>Unable to load labs</strong>
                  <p>{pageError}</p>
                </div>
              </div>
            )}

            {!loading && !pageError && filteredLabs.length === 0 && (
              <div className="labs-pro-state">
                <div className="labs-pro-state-icon">
                  <Icon name="search" size={21} />
                </div>
                <div>
                  <strong>No matching labs found</strong>
                  <p>Try a different search term or reset the filters.</p>
                </div>
              </div>
            )}

            {!loading && !pageError && filteredLabs.length > 0 && (
              <div className="labs-pro-grid">
                {filteredLabs.map((lab) => {
                  const testsForLab = labTestMap.get(lab.id) || [];
                  const minPrice = getMinimumPrice(testsForLab);

                  return (
                    <article className="labs-pro-card" key={lab.id}>
                      <div className="labs-pro-card-head">
                        <div className="labs-pro-lab-mark" aria-hidden="true">
                          {getLabInitials(lab.name)}
                        </div>

                        <div className="labs-pro-card-title">
                          <div className="labs-pro-card-name-row">
                            <h3>{lab.name}</h3>
                            <span className="labs-pro-badge">
                              <Icon name="check" size={13} />
                              Verified
                            </span>
                          </div>
                          <p>
                            <Icon name="map" size={15} />
                            <span>{getLabLocation(lab)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="labs-pro-card-details">
                        <div>
                          <span>Tests listed</span>
                          <strong>{testsForLab.length || labTests.length}</strong>
                        </div>
                        <div>
                          <span>Starting from</span>
                          <strong>{minPrice ? formatMoney(minPrice) : "Not listed"}</strong>
                        </div>
                        <div>
                          <span>Collection</span>
                          <strong>Lab or home</strong>
                        </div>
                      </div>

                      <div className="labs-pro-address">
                        <Icon name="map" size={16} />
                        <p>{getLabAddress(lab) || "Address not updated"}</p>
                      </div>

                      <div className="labs-pro-service-pills">
                        {(lab.services || []).slice(0, 4).map((service) => (
                          <span key={service}>{service}</span>
                        ))}
                        {(lab.services || []).length > 4 && (
                          <span>+{lab.services.length - 4} more</span>
                        )}
                        {(lab.services || []).length === 0 && (
                          <span>Diagnostic services</span>
                        )}
                      </div>

                      <div className="labs-pro-card-actions">
                        <a
                          href={`tel:${lab.contactNumber || ""}`}
                          className={!lab.contactNumber ? "disabled" : ""}
                          onClick={(event) => {
                            if (!lab.contactNumber) event.preventDefault();
                          }}
                          aria-disabled={!lab.contactNumber}
                        >
                          <Icon name="phone" size={17} />
                          Call lab
                        </a>
                        <button type="button" onClick={() => openLabModal(lab)}>
                          Book tests
                          <Icon name="arrow" size={17} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <section className="labs-pro-bookings" aria-labelledby="lab-bookings-title">
              <div className="labs-pro-section-head compact">
                <div>
                  <span className="labs-pro-section-label">Booking history</span>
                  <h2 id="lab-bookings-title">My lab bookings</h2>
                  <p>Track your recent test bookings and their current status.</p>
                </div>

                <button
                  type="button"
                  className="labs-pro-refresh"
                  onClick={fetchBookings}
                  disabled={bookingHistoryLoading}
                >
                  <Icon name="refresh" size={17} />
                  <span>{bookingHistoryLoading ? "Refreshing" : "Refresh"}</span>
                </button>
              </div>

              {bookingHistoryLoading && (
                <div className="labs-pro-state">
                  <div className="labs-pro-state-icon">
                    <Icon name="calendar" size={21} />
                  </div>
                  <div>
                    <strong>Loading your bookings</strong>
                    <p>Your latest booking history is being fetched.</p>
                  </div>
                </div>
              )}

              {!bookingHistoryLoading && bookings.length === 0 && (
                <div className="labs-pro-state">
                  <div className="labs-pro-state-icon">
                    <Icon name="receipt" size={21} />
                  </div>
                  <div>
                    <strong>No lab bookings yet</strong>
                    <p>Your confirmed test bookings will appear here.</p>
                  </div>
                </div>
              )}

              {!bookingHistoryLoading && bookings.length > 0 && (
                <div className="labs-pro-booking-grid">
                  {bookings.slice(0, 6).map((booking) => (
                    <article className="labs-pro-booking-card" key={booking.id}>
                      <div className="labs-pro-booking-top">
                        <span
                          className={`labs-pro-status ${String(
                            booking.status || ""
                          ).toLowerCase()}`}
                        >
                          {booking.status}
                        </span>
                        <strong>{formatMoney(booking.totalAmount)}</strong>
                      </div>

                      <h3>{booking.labName}</h3>
                      <p className="labs-pro-booking-patient">
                        <Icon name="user" size={15} />
                        <span>
                          {booking.patientName} · {booking.relation || "Self"}
                        </span>
                      </p>

                      <div className="labs-pro-booking-tests">
                        {(booking.tests || []).slice(0, 2).map((test) => (
                          <span key={test.id}>{test.testName}</span>
                        ))}
                        {(booking.tests || []).length > 2 && (
                          <span>+{booking.tests.length - 2} more</span>
                        )}
                      </div>

                      <div className="labs-pro-booking-footer">
                        <div>
                          <span>Preferred schedule</span>
                          <strong>
                            {booking.preferredDate || "Date pending"}
                          </strong>
                        </div>
                        {booking.status !== "CANCELLED" && (
                          <button
                            type="button"
                            onClick={() => openCancelModal(booking)}
                          >
                            Cancel booking
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </main>
        </section>
      </div>

      {modalOpen && selectedLab && (
        <div className="labs-pro-modal-overlay">
          <div
            className="labs-pro-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lab-modal-title"
          >
            <header className="labs-pro-modal-header">
              <div className="labs-pro-modal-lab">
                <div className="labs-pro-lab-mark" aria-hidden="true">
                  {getLabInitials(selectedLab.name)}
                </div>
                <div>
                  <span className="labs-pro-modal-eyebrow">
                    <Icon name="shield" size={14} />
                    Platform verified lab
                  </span>
                  <h2 id="lab-modal-title">{selectedLab.name}</h2>
                  <p>{getLabAddress(selectedLab) || "Address not updated"}</p>
                </div>
              </div>

              <div className="labs-pro-modal-actions">
                {selectedLab.contactNumber && (
                  <a href={`tel:${selectedLab.contactNumber}`}>
                    <Icon name="phone" size={16} />
                    <span>Call lab</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={closeLabModal}
                  aria-label="Close lab booking"
                >
                  <Icon name="close" size={20} />
                </button>
              </div>
            </header>

            {bookingSuccess ? (
              <div className="labs-pro-success-panel">
                <div className="labs-pro-success-icon">
                  <Icon name="check" size={30} />
                </div>
                <span className="labs-pro-section-label">Booking confirmed</span>
                <h3>Your lab booking is ready</h3>
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
                    <span>Total amount</span>
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
                <nav className="labs-pro-tabs" aria-label="Lab booking sections">
                  <button
                    type="button"
                    className={activeTab === "tests" ? "active" : ""}
                    onClick={() => setActiveTab("tests")}
                  >
                    Tests
                  </button>
                  <button
                    type="button"
                    className={activeTab === "details" ? "active" : ""}
                    onClick={() => setActiveTab("details")}
                  >
                    Booking details
                  </button>
                  <button
                    type="button"
                    className={activeTab === "about" ? "active" : ""}
                    onClick={() => setActiveTab("about")}
                  >
                    About lab
                  </button>
                  <button
                    type="button"
                    className={activeTab === "bookings" ? "active" : ""}
                    onClick={() => setActiveTab("bookings")}
                  >
                    My bookings
                  </button>
                </nav>

                <div className="labs-pro-modal-body">
                  <section className="labs-pro-modal-main">
                    {activeTab === "tests" && (
                      <div className="labs-pro-panel">
                        <div className="labs-pro-panel-head">
                          <div>
                            <span className="labs-pro-section-label">Step 1</span>
                            <h3>Select tests</h3>
                            <p>{selectedTests.length} tests selected.</p>
                          </div>

                          {selectedTests.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedTests([])}
                            >
                              Clear selection
                            </button>
                          )}
                        </div>

                        <label className="labs-pro-modal-search">
                          <Icon name="search" size={18} />
                          <input
                            type="search"
                            placeholder="Search by test name, code, or category"
                            value={modalSearch}
                            onChange={(event) => setModalSearch(event.target.value)}
                          />
                        </label>

                        <div className="labs-pro-test-list">
                          {selectedLabTests.length === 0 && (
                            <div className="labs-pro-state compact-state">
                              <div className="labs-pro-state-icon">
                                <Icon name="search" size={19} />
                              </div>
                              <div>
                                <strong>No tests found</strong>
                                <p>Try another test name or category.</p>
                              </div>
                            </div>
                          )}

                          {selectedLabTests.map((test) => {
                            const checked = selectedTests.includes(test.id);

                            return (
                              <button
                                type="button"
                                key={test.id}
                                className={`labs-pro-test-row ${
                                  checked ? "selected" : ""
                                }`}
                                onClick={() => toggleTest(test.id)}
                                aria-pressed={checked}
                              >
                                <span className="labs-pro-check">
                                  {checked && <Icon name="check" size={15} />}
                                </span>

                                <span className="labs-pro-test-info">
                                  <strong>{test.testName}</strong>
                                  <small>
                                    {test.testCode || "TEST"} ·{" "}
                                    {test.category || test.serviceType || "Lab test"}
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
                            Continue to booking details
                            <Icon name="arrow" size={17} />
                          </button>
                        </div>
                      </div>
                    )}

                    {activeTab === "details" && (
                      <div className="labs-pro-panel">
                        <div className="labs-pro-panel-head">
                          <div>
                            <span className="labs-pro-section-label">Step 2</span>
                            <h3>Booking details</h3>
                            <p>Choose your preferred schedule and collection type.</p>
                          </div>
                        </div>

                        <div className="labs-pro-form-grid">
                          <label>
                            <span>Preferred date</span>
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
                            <span>Preferred time</span>
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
                          <div className="labs-pro-pickup-icon">
                            <Icon name="home" size={19} />
                          </div>
                          <div>
                            <strong>Home sample pickup</strong>
                            <p>A technician will collect the sample at your address.</p>
                          </div>
                          <ToggleSwitch
                            id="homePickup"
                            checked={homePickup}
                            onChange={() => setHomePickup((prev) => !prev)}
                          />
                        </div>

                        {homePickup && (
                          <label className="labs-pro-textarea-field">
                            <span>Pickup address</span>
                            <textarea
                              rows="4"
                              value={pickupAddress}
                              onChange={(event) => setPickupAddress(event.target.value)}
                              placeholder="Flat, building, street, area, and nearby landmark"
                            />
                          </label>
                        )}

                        <label className="labs-pro-textarea-field">
                          <span>Note for the lab</span>
                          <textarea
                            rows="3"
                            value={patientNote}
                            onChange={(event) => setPatientNote(event.target.value)}
                            placeholder="Add any preparation details or instructions"
                          />
                        </label>

                        <div className="labs-pro-patient-box">
                          <div className="labs-pro-profile-icon">
                            <Icon name="user" size={18} />
                          </div>
                          <div>
                            <span>Selected patient</span>
                            {selectedProfile ? (
                              <>
                                <strong>{getProfileName(selectedProfile)}</strong>
                                <p>
                                  {selectedProfile.relation || "Self"} ·{" "}
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
                                  Select profile
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "about" && (
                      <div className="labs-pro-panel">
                        <div className="labs-pro-panel-head">
                          <div>
                            <span className="labs-pro-section-label">Lab information</span>
                            <h3>About {selectedLab.name}</h3>
                            <p>Verified details provided by the diagnostic partner.</p>
                          </div>
                        </div>

                        <div className="labs-pro-about">
                          <p>
                            {selectedLab.name} is listed on Sucura for verified
                            diagnostic services, transparent pricing, and supported
                            sample collection options.
                          </p>

                          <dl>
                            <div>
                              <dt>Address</dt>
                              <dd>{getLabAddress(selectedLab) || "Not updated"}</dd>
                            </div>
                            <div>
                              <dt>Contact</dt>
                              <dd>{selectedLab.contactNumber || "Not updated"}</dd>
                            </div>
                            <div>
                              <dt>Services</dt>
                              <dd>
                                {(selectedLab.services || []).join(", ") ||
                                  "Diagnostic services"}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                    )}

                    {activeTab === "bookings" && (
                      <div className="labs-pro-panel">
                        <div className="labs-pro-panel-head">
                          <div>
                            <span className="labs-pro-section-label">History</span>
                            <h3>My lab bookings</h3>
                            <p>Bookings created from your patient account.</p>
                          </div>
                        </div>

                        <div className="labs-pro-modal-bookings">
                          {bookings.length === 0 && (
                            <div className="labs-pro-state compact-state">
                              <div className="labs-pro-state-icon">
                                <Icon name="receipt" size={19} />
                              </div>
                              <div>
                                <strong>No bookings found</strong>
                                <p>Your future lab bookings will appear here.</p>
                              </div>
                            </div>
                          )}

                          {bookings.map((booking) => (
                            <div className="labs-pro-modal-booking" key={booking.id}>
                              <div>
                                <span
                                  className={`labs-pro-status ${String(
                                    booking.status || ""
                                  ).toLowerCase()}`}
                                >
                                  {booking.status}
                                </span>
                                <h4>{booking.labName}</h4>
                                <p>
                                  {booking.preferredDate || "Date not selected"} ·{" "}
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
                    <div className="labs-pro-summary-title">
                      <div className="labs-pro-summary-icon">
                        <Icon name="receipt" size={19} />
                      </div>
                      <div>
                        <span>Order overview</span>
                        <h3>Bill summary</h3>
                      </div>
                    </div>

                    <div className="labs-pro-summary-patient">
                      <span>Booking for</span>
                      {selectedProfile ? (
                        <>
                          <strong>{getProfileName(selectedProfile)}</strong>
                          <p>
                            {selectedProfile.relation || "Self"} ·{" "}
                            {selectedProfile.gender || "Gender not set"}
                          </p>
                        </>
                      ) : (
                        <>
                          <strong>No profile selected</strong>
                          <p>Select a patient profile before booking.</p>
                        </>
                      )}
                    </div>

                    <div className="labs-pro-summary-tests">
                      <span>Selected tests</span>
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

                    <div className="labs-pro-bill-lines">
                      <div className="labs-pro-bill-line">
                        <span>Subtotal</span>
                        <strong>{formatMoney(subtotal)}</strong>
                      </div>
                      <div className="labs-pro-bill-line">
                        <span>GST 5%</span>
                        <strong>{formatMoney(gst)}</strong>
                      </div>
                      <div className="labs-pro-bill-line">
                        <span>Service charge</span>
                        <strong>{formatMoney(serviceCharge)}</strong>
                      </div>
                      <div className="labs-pro-bill-line">
                        <span>Pickup fee</span>
                        <strong>{formatMoney(pickupFee)}</strong>
                      </div>
                    </div>

                    <div className="labs-pro-total">
                      <span>Total payable</span>
                      <strong>{formatMoney(grandTotal)}</strong>
                    </div>

                    {bookingMessage && (
                      <div
                        className={`labs-pro-message ${
                          bookingMessage.toLowerCase().includes("success")
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
                      {bookingLoading ? "Confirming booking..." : "Confirm booking"}
                    </button>

                    <p className="labs-pro-note">
                      Final pricing is validated by the server using selected test IDs.
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
          <div
            className="labs-cancel-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-booking-title"
          >
            <div className="labs-cancel-modal-head">
              <div className="labs-cancel-modal-icon">
                <Icon name="alert" size={22} />
              </div>
              <div>
                <span className="labs-pro-section-label">Cancellation</span>
                <h3 id="cancel-booking-title">Cancel lab booking?</h3>
              </div>
            </div>

            <p className="labs-cancel-description">
              You are cancelling the booking for{" "}
              <strong>{cancelTargetBooking.labName}</strong>. Add a short reason
              so the lab team has the correct context.
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
              <span>Cancellation reason</span>
              <textarea
                rows="4"
                value={cancelReason}
                maxLength={500}
                placeholder="Example: Schedule changed or the wrong test was selected"
                onChange={(event) => {
                  setCancelReason(event.target.value);
                  setCancelError("");
                }}
              />
              <small>{cancelReason.length}/500 characters</small>
            </label>

            {cancelError && <div className="labs-cancel-error">{cancelError}</div>}

            <div className="labs-cancel-actions">
              <button
                type="button"
                className="labs-cancel-secondary"
                onClick={closeCancelModal}
                disabled={cancelLoading}
              >
                Keep booking
              </button>
              <button
                type="button"
                className="labs-cancel-danger"
                onClick={handleSubmitCancelBooking}
                disabled={cancelLoading}
              >
                {cancelLoading ? "Cancelling..." : "Cancel booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabsPage;
