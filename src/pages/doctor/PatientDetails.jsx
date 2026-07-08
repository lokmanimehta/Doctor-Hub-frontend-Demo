import React, { useState, useEffect } from "react";
import "./PatientDetails.css";
import AddVisitModal from "./AddVisitModal";
import AddPrescriptionModal from "./AddPrescriptionModal";
import AddReportModal from "./AddReportModal";
import AddAppointmentModal from "./AddAppointmentModal";
import LabOrderModal from "./LabOrderModal";
import AiClinicalAssistant from "./AiClinicalAssistant";
import {
  useParams,
  useNavigate,
  useSearchParams
} from "react-router-dom";
import {
  getPatientById,
  getPatientPrescriptions,
  getPatientVisits,
  createPatientVisit,
  updatePatientVisit,
  createPatientPrescription,
  updatePatientPrescription,
  getAiPrescriptionAccess,
  deletePatientPrescription,
  getPatientMedicalReports,
  createPatientMedicalReport,
  deletePatientMedicalReport,
  createPatientDoctorNote,
  getPatientDoctorNotes,
  updatePatientDoctorNote,
  updatePatientDoctorNotePinStatus,
  deletePatientDoctorNote,
  getPatientAppointments,
  createPatientAppointment,
  updatePatientAppointment,
  cancelPatientAppointment,
  getSystemLabs,
  getMyLabs,
  getLabTestCatalog,
  createPatientLabOrder,
  getPatientLabOrders,
  updatePatientLabOrderStatus,
  cancelPatientLabOrder
} from "../../services/doctorService";

const PatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("visits");

  const [aiAccess, setAiAccess] = useState({
    aiPrescriptionEnabled: false
  });

  const [doctorNotes, setDoctorNotes] = useState([]);
  const [doctorNotesLoading, setDoctorNotesLoading] = useState(false);
  const [doctorNoteSaving, setDoctorNoteSaving] = useState(false);
  const [
    doctorNoteActionLoadingId,
    setDoctorNoteActionLoadingId
  ] = useState(null);

  const [showVisitModal, setShowVisitModal] = useState(false);
  const [
    showPrescriptionModal,
    setShowPrescriptionModal
  ] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAppointment, setShowAppointment] = useState(false);

  const [
    showDeleteNoteConfirm,
    setShowDeleteNoteConfirm
  ] = useState(false);

  const [deletingNoteId, setDeletingNoteId] = useState(null);
  const [openVisitId, setOpenVisitId] = useState(null);
  const [openPrescriptionId, setOpenPrescriptionId] = useState(null);
  const [openReportId, setOpenReportId] = useState(null);
  const [openAppointmentId, setOpenAppointmentId] = useState(null);

  const [editingVisit, setEditingVisit] = useState(null);
  const [editingPrescription, setEditingPrescription] = useState(null);

  const [showLabModal, setShowLabModal] = useState(false);
  const [labOrders, setLabOrders] = useState([]);
  const [labOrdersLoading, setLabOrdersLoading] = useState(false);
  const [
    labOrderActionLoading,
    setLabOrderActionLoading
  ] = useState(false);

  const [systemLabs, setSystemLabs] = useState([]);
  const [myLabs, setMyLabs] = useState([]);
  const [labTestCatalog, setLabTestCatalog] = useState([]);
  const [openLabOrderId, setOpenLabOrderId] = useState(null);

  const [
    showCancelLabOrderConfirm,
    setShowCancelLabOrderConfirm
  ] = useState(false);

  const [
    cancellingLabOrderId,
    setCancellingLabOrderId
  ] = useState(null);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [
    showDoctorNoteForm,
    setShowDoctorNoteForm
  ] = useState(false);

  const [doctorNoteTitle, setDoctorNoteTitle] = useState("");
  const [doctorNoteContent, setDoctorNoteContent] = useState("");

  const [visits, setVisits] = useState([]);
  const [reports, setReports] = useState([]);
  const [aiReportPrefill, setAiReportPrefill] = useState(null);

  const [
    defaultLinkedVisitId,
    setDefaultLinkedVisitId
  ] = useState(null);

  const [
    defaultLinkedPrescriptionId,
    setDefaultLinkedPrescriptionId
  ] = useState(null);

  const [
    prefillAppointmentData,
    setPrefillAppointmentData
  ] = useState(null);

  const [
    reportActionLoading,
    setReportActionLoading
  ] = useState(false);

  const [showFollowUpPrompt, setShowFollowUpPrompt] = useState(false);

  const [
    pendingFollowUpAppointmentData,
    setPendingFollowUpAppointmentData
  ] = useState(null);

  const [
    showDeleteReportConfirm,
    setShowDeleteReportConfirm
  ] = useState(false);

  const [deletingReportId, setDeletingReportId] = useState(null);
  const [editingDoctorNote, setEditingDoctorNote] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [editingAppointment, setEditingAppointment] = useState(null);

  const [
    showCancelAppointmentConfirm,
    setShowCancelAppointmentConfirm
  ] = useState(false);

  const [
    cancellingAppointmentId,
    setCancellingAppointmentId
  ] = useState(null);

  const [
    appointmentActionLoading,
    setAppointmentActionLoading
  ] = useState(false);

  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [
    deletingPrescriptionId,
    setDeletingPrescriptionId
  ] = useState(null);

  const [deleteLoading, setDeleteLoading] = useState(false);

  const formatDateTimeValue = (timestamp) => {
    if (!timestamp) return "N/A";

    const parsedDate = new Date(timestamp);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleString();
  };

  const renderValue = (value) => {
    if (value === null || value === undefined) {
      return "N/A";
    }

    if (
      typeof value === "string" &&
      value.trim() === ""
    ) {
      return "N/A";
    }

    return value;
  };

  const handleDeletePrescription = (prescriptionId) => {
    setDeletingPrescriptionId(prescriptionId);
    setShowDeleteConfirm(true);
  };

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    const highlightId = searchParams.get("highlight");
    const linkedVisitId = searchParams.get("linkedVisitId");
    const linkedPrescriptionId = searchParams.get(
      "linkedPrescriptionId"
    );

    if (requestedTab) {
      setActiveTab(requestedTab);
    }

    if (linkedVisitId) {
      const parsedLinkedVisitId = Number(linkedVisitId);

      if (!Number.isNaN(parsedLinkedVisitId)) {
        setDefaultLinkedVisitId(parsedLinkedVisitId);
      } else {
        setDefaultLinkedVisitId(null);
      }
    } else {
      setDefaultLinkedVisitId(null);
    }

    if (linkedPrescriptionId) {
      const parsedLinkedPrescriptionId = Number(
        linkedPrescriptionId
      );

      if (!Number.isNaN(parsedLinkedPrescriptionId)) {
        setDefaultLinkedPrescriptionId(
          parsedLinkedPrescriptionId
        );
      } else {
        setDefaultLinkedPrescriptionId(null);
      }
    } else {
      setDefaultLinkedPrescriptionId(null);
    }

    if (!highlightId) return;

    const parsedHighlightId = Number(highlightId);

    if (!Number.isNaN(parsedHighlightId)) {
      if (requestedTab === "visits") {
        setOpenVisitId(parsedHighlightId);
      }

      if (requestedTab === "prescriptions") {
        setOpenPrescriptionId(parsedHighlightId);
      }

      if (requestedTab === "reports") {
        setOpenReportId(parsedHighlightId);
      }

      if (requestedTab === "appointments") {
        setOpenAppointmentId(parsedHighlightId);
      }

      if (requestedTab === "lab-orders") {
        setOpenLabOrderId(parsedHighlightId);
      }
    }
  }, [searchParams]);

  const confirmDeletePrescription = async () => {
    if (!deletingPrescriptionId) return;

    try {
      setDeleteLoading(true);

      await deletePatientPrescription(
        deletingPrescriptionId
      );

      setPrescriptions((previous) =>
        previous.filter(
          (item) =>
            item.id !== deletingPrescriptionId
        )
      );

      if (
        openPrescriptionId ===
        deletingPrescriptionId
      ) {
        setOpenPrescriptionId(null);
      }

      setShowDeleteConfirm(false);
      setDeletingPrescriptionId(null);
    } catch (error) {
      console.error(
        "Failed to delete prescription:",
        error
      );

      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to delete prescription"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDeletePrescription = () => {
    if (deleteLoading) return;

    setShowDeleteConfirm(false);
    setDeletingPrescriptionId(null);
  };

  const getPatientInitials = (fullName) => {
    return (fullName || "NA")
      .split(" ")
      .filter(Boolean)
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setDoctorNotesLoading(true);
        setLabOrdersLoading(true);
        setPageError("");

        const patientResponse = await getPatientById(
          patientId
        );

        const routePatientId = Number(patientId);
        const loadedPatientId = Number(
          patientResponse?.id
        );

        if (
          !Number.isInteger(routePatientId) ||
          !Number.isInteger(loadedPatientId) ||
          routePatientId !== loadedPatientId
        ) {
          throw new Error(
            `Patient route mismatch. Expected patient ${routePatientId}, received ${loadedPatientId}.`
          );
        }

        const prescriptionResponse =
          await getPatientPrescriptions(patientId);

        const visitResponse = await getPatientVisits(
          patientId
        );

        const reportResponse =
          await getPatientMedicalReports(patientId);

        const noteResponse =
          await getPatientDoctorNotes(patientId);

        const appointmentResponse =
          await getPatientAppointments(patientId);

        const labOrdersResponse =
          await getPatientLabOrders(patientId);

        const systemLabsResponse =
          await getSystemLabs();

        const myLabsResponse = await getMyLabs();

        const labTestCatalogResponse =
          await getLabTestCatalog();

        const aiAccessResponse =
          await getAiPrescriptionAccess();

        setPatient(patientResponse);
        setPrescriptions(prescriptionResponse || []);
        setVisits(visitResponse || []);
        setReports(reportResponse || []);
        setDoctorNotes(noteResponse || []);
        setAppointments(appointmentResponse || []);
        setLabOrders(labOrdersResponse || []);
        setSystemLabs(systemLabsResponse || []);
        setMyLabs(myLabsResponse || []);
        setLabTestCatalog(
          labTestCatalogResponse || []
        );

        setAiAccess(
          aiAccessResponse || {
            aiPrescriptionEnabled: false
          }
        );
      } catch (error) {
        console.error(
          "Failed to load patient details:",
          error
        );

        setPageError(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to load patient details."
        );
      } finally {
        setLoading(false);
        setDoctorNotesLoading(false);
        setLabOrdersLoading(false);
      }
    };

    loadData();
  }, [patientId]);

  const handleSavePrescription = async (
    prescriptionPayload
  ) => {
    try {
      if (editingPrescription?.id) {
        const updatedPrescription =
          await updatePatientPrescription(
            editingPrescription.id,
            prescriptionPayload
          );

        setPrescriptions((previous) =>
          previous.map((item) =>
            item.id === editingPrescription.id
              ? updatedPrescription
              : item
          )
        );

        setShowPrescriptionModal(false);
        setEditingPrescription(null);
        return;
      }

      const savedPrescription =
        await createPatientPrescription(
          patientId,
          prescriptionPayload
        );

      setPrescriptions((previous) => [
        savedPrescription,
        ...previous
      ]);

      setDefaultLinkedPrescriptionId(
        savedPrescription?.id ?? null
      );

      setShowPrescriptionModal(false);
      setEditingPrescription(null);

      if (prescriptionPayload?.followUpDate) {
        setPendingFollowUpAppointmentData({
          appointmentDateTime:
            prescriptionPayload.followUpDate,
          notes:
            prescriptionPayload.followUpType || "",
          isCritical: Boolean(
            patient?.isCritical
          ),
          doctorClinicId:
            patient?.doctorClinicId || null
        });

        setShowFollowUpPrompt(true);
      }
    } catch (error) {
      console.error(
        "Failed to save prescription:",
        error
      );

      throw error;
    }
  };

  const handleConfirmFollowUpAppointment = () => {
    if (!pendingFollowUpAppointmentData) return;

    setPrefillAppointmentData(
      pendingFollowUpAppointmentData
    );

    setPendingFollowUpAppointmentData(null);
    setShowFollowUpPrompt(false);
    setEditingAppointment(null);
    setShowAppointment(true);
  };

  const handleCancelFollowUpAppointmentPrompt = () => {
    setPendingFollowUpAppointmentData(null);
    setShowFollowUpPrompt(false);
  };

  const handleEditPrescription = (
    prescription
  ) => {
    setEditingPrescription(prescription);
    setShowPrescriptionModal(true);
  };

  const handleAddVisit = async (
    visitPayload
  ) => {
    try {
      if (editingVisit?.id) {
        const updatedVisit =
          await updatePatientVisit(
            editingVisit.id,
            visitPayload
          );

        setVisits((previous) =>
          previous.map((item) =>
            item.id === editingVisit.id
              ? updatedVisit
              : item
          )
        );

        if (
          openVisitId === editingVisit.id
        ) {
          setOpenVisitId(updatedVisit.id);
        }

        setEditingVisit(null);
        return;
      }

      const savedVisit =
        await createPatientVisit(
          patientId,
          visitPayload
        );

      setVisits((previous) => [
        savedVisit,
        ...previous
      ]);
    } catch (error) {
      console.error(
        "Failed to save visit:",
        error
      );

      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save visit"
      );
    }
  };

  const handleEditVisit = (visit) => {
    setEditingVisit(visit);
    setShowVisitModal(true);
  };

  const handleAddReports = async (
    reportPayload
  ) => {
    try {
      setReportActionLoading(true);

      const savedReport =
        await createPatientMedicalReport(
          patientId,
          reportPayload
        );

      setReports((previous) => [
        savedReport,
        ...previous
      ]);

      setShowReportModal(false);
      setAiReportPrefill(null);
    } catch (error) {
      console.error(
        "Failed to upload report:",
        error
      );

      throw error;
    } finally {
      setReportActionLoading(false);
    }
  };

  const handleDeleteReport = (reportId) => {
    setDeletingReportId(reportId);
    setShowDeleteReportConfirm(true);
  };

  const cancelDeleteReport = () => {
    if (reportActionLoading) return;

    setShowDeleteReportConfirm(false);
    setDeletingReportId(null);
  };

  const confirmDeleteReport = async () => {
    if (!deletingReportId) return;

    try {
      setReportActionLoading(true);

      await deletePatientMedicalReport(
        deletingReportId
      );

      setReports((previous) =>
        previous.filter(
          (item) =>
            item.id !== deletingReportId
        )
      );

      if (openReportId === deletingReportId) {
        setOpenReportId(null);
      }

      setShowDeleteReportConfirm(false);
      setDeletingReportId(null);
    } catch (error) {
      console.error(
        "Failed to delete report:",
        error
      );

      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to delete report"
      );
    } finally {
      setReportActionLoading(false);
    }
  };

  const formatDateValue = (timestamp) => {
    if (!timestamp) return "N/A";

    const parsedDate = new Date(timestamp);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleDateString();
  };

  const formatFileSize = (bytes) => {
    if (
      bytes === null ||
      bytes === undefined ||
      Number.isNaN(bytes)
    ) {
      return "N/A";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  };

  const getLinkedVisitDisplay = (report) => {
    if (!report?.visitId) {
      return "Not linked";
    }

    const linkedVisit = visits.find(
      (visit) =>
        visit.id === report.visitId
    );

    if (!linkedVisit) {
      return `Linked visit ID: ${report.visitId}`;
    }

    const visitDateText =
      linkedVisit.visitDate
        ? new Date(
            linkedVisit.visitDate
          ).toLocaleString()
        : "Unknown date";

    return `${visitDateText} - ${
      linkedVisit.chiefComplaint || "Visit"
    }`;
  };

  const getLinkedPrescriptionDisplay = (
    report
  ) => {
    if (!report?.prescriptionId) {
      return "Not linked";
    }

    const linkedPrescription =
      prescriptions.find(
        (prescription) =>
          prescription.id ===
          report.prescriptionId
      );

    if (!linkedPrescription) {
      return `Linked prescription ID: ${report.prescriptionId}`;
    }

    const prescriptionDateText =
      linkedPrescription.prescriptionDate
        ? new Date(
            linkedPrescription.prescriptionDate
          ).toLocaleDateString()
        : "Unknown date";

    return `${prescriptionDateText} - ${
      linkedPrescription.diagnosis ||
      "Prescription"
    }`;
  };

  const handleAddAppointment = async (
    appointmentPayload
  ) => {
    try {
      let savedAppointment;

      if (editingAppointment?.id) {
        savedAppointment =
          await updatePatientAppointment(
            editingAppointment.id,
            appointmentPayload
          );

        setAppointments((previous) =>
          previous.map((item) =>
            item.id === editingAppointment.id
              ? savedAppointment
              : item
          )
        );
      } else {
        savedAppointment =
          await createPatientAppointment(
            patientId,
            appointmentPayload
          );

        setAppointments((previous) => [
          savedAppointment,
          ...previous
        ]);
      }

      setShowAppointment(false);
      setEditingAppointment(null);
      setPrefillAppointmentData(null);
    } catch (error) {
      console.error(
        "Failed to save appointment:",
        error
      );

      throw error;
    }
  };

  const handleEditAppointment = (
    appointment
  ) => {
    setPrefillAppointmentData(null);
    setEditingAppointment(appointment);
    setShowAppointment(true);
  };

  const handleCancelAppointment = (
    appointmentId
  ) => {
    setCancellingAppointmentId(appointmentId);
    setShowCancelAppointmentConfirm(true);
  };

  const confirmCancelAppointment = async () => {
    if (!cancellingAppointmentId) return;

    try {
      setAppointmentActionLoading(true);

      const updatedAppointment =
        await cancelPatientAppointment(
          cancellingAppointmentId
        );

      setAppointments((previous) =>
        previous.map((item) =>
          item.id === cancellingAppointmentId
            ? updatedAppointment
            : item
        )
      );

      setShowCancelAppointmentConfirm(false);
      setCancellingAppointmentId(null);
    } catch (error) {
      console.error(
        "Failed to cancel appointment:",
        error
      );

      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to cancel appointment"
      );
    } finally {
      setAppointmentActionLoading(false);
    }
  };

  const cancelCancelAppointment = () => {
    if (appointmentActionLoading) return;

    setShowCancelAppointmentConfirm(false);
    setCancellingAppointmentId(null);
  };

  const handleCreateLabOrder = async (
    payload
  ) => {
    try {
      setLabOrderActionLoading(true);

      const savedLabOrder =
        await createPatientLabOrder(
          patientId,
          payload
        );

      setLabOrders((previous) => [
        savedLabOrder,
        ...previous
      ]);

      setOpenLabOrderId(
        savedLabOrder?.id || null
      );

      setActiveTab("lab-orders");
      setShowLabModal(false);
    } catch (error) {
      console.error(
        "Failed to create lab order:",
        error
      );

      throw error;
    } finally {
      setLabOrderActionLoading(false);
    }
  };

  const handleUpdateLabOrderStatus = async (
    labOrderId,
    status
  ) => {
    try {
      setLabOrderActionLoading(true);

      const updatedOrder =
        await updatePatientLabOrderStatus(
          labOrderId,
          { status }
        );

      setLabOrders((previous) =>
        previous.map((item) =>
          item.id === labOrderId
            ? updatedOrder
            : item
        )
      );
    } catch (error) {
      console.error(
        "Failed to update lab order status:",
        error
      );

      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update lab order status"
      );
    } finally {
      setLabOrderActionLoading(false);
    }
  };

  const handleCancelLabOrder = (
    labOrderId
  ) => {
    setCancellingLabOrderId(labOrderId);
    setShowCancelLabOrderConfirm(true);
  };

  const confirmCancelLabOrder = async () => {
    if (!cancellingLabOrderId) return;

    try {
      setLabOrderActionLoading(true);

      await cancelPatientLabOrder(
        cancellingLabOrderId
      );

      setLabOrders((previous) =>
        previous.map((item) =>
          item.id === cancellingLabOrderId
            ? {
                ...item,
                status: "CANCELLED"
              }
            : item
        )
      );

      setShowCancelLabOrderConfirm(false);
      setCancellingLabOrderId(null);
    } catch (error) {
      console.error(
        "Failed to cancel lab order:",
        error
      );

      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to cancel lab order"
      );
    } finally {
      setLabOrderActionLoading(false);
    }
  };

  const cancelCancelLabOrder = () => {
    if (labOrderActionLoading) return;

    setShowCancelLabOrderConfirm(false);
    setCancellingLabOrderId(null);
  };

  const getLinkedLabVisitDisplay = (
    order
  ) => {
    if (!order?.visitId) {
      return "Not linked";
    }

    const linkedVisit = visits.find(
      (visit) =>
        visit.id === order.visitId
    );

    if (!linkedVisit) {
      return `Linked visit ID: ${order.visitId}`;
    }

    const visitDateText =
      linkedVisit.visitDate
        ? new Date(
            linkedVisit.visitDate
          ).toLocaleString()
        : "Unknown date";

    return `${visitDateText} - ${
      linkedVisit.chiefComplaint || "Visit"
    }`;
  };

  const getLinkedLabPrescriptionDisplay = (
    order
  ) => {
    if (!order?.prescriptionId) {
      return "Not linked";
    }

    const linkedPrescription =
      prescriptions.find(
        (prescription) =>
          prescription.id ===
          order.prescriptionId
      );

    if (!linkedPrescription) {
      return `Linked prescription ID: ${order.prescriptionId}`;
    }

    const prescriptionDateText =
      linkedPrescription.prescriptionDate
        ? new Date(
            linkedPrescription.prescriptionDate
          ).toLocaleDateString()
        : "Unknown date";

    return `${prescriptionDateText} - ${
      linkedPrescription.diagnosis ||
      "Prescription"
    }`;
  };

  const handleSaveDoctorNote = async () => {
    if (!doctorNoteContent.trim()) return;

    try {
      setDoctorNoteSaving(true);

      const payload = {
        title: doctorNoteTitle.trim(),
        content: doctorNoteContent.trim()
      };

      if (editingDoctorNote?.id) {
        const updatedNote =
          await updatePatientDoctorNote(
            editingDoctorNote.id,
            payload
          );

        setDoctorNotes((previous) =>
          previous.map((note) =>
            note.id === editingDoctorNote.id
              ? updatedNote
              : note
          )
        );
      } else {
        const savedNote =
          await createPatientDoctorNote(
            patientId,
            payload
          );

        setDoctorNotes((previous) => [
          savedNote,
          ...previous
        ]);
      }

      setDoctorNoteTitle("");
      setDoctorNoteContent("");
      setEditingDoctorNote(null);
      setShowDoctorNoteForm(false);
    } catch (error) {
      console.error(
        "Failed to save doctor note:",
        error
      );

      alert(
        error?.response?.data?.message ||
          error?.response?.data?.content ||
          error?.message ||
          "Unable to save doctor note"
      );
    } finally {
      setDoctorNoteSaving(false);
    }
  };

  const handleTogglePin = async (
    noteId,
    currentPinnedValue
  ) => {
    try {
      setDoctorNoteActionLoadingId(noteId);

      const updatedNote =
        await updatePatientDoctorNotePinStatus(
          noteId,
          !currentPinnedValue
        );

      setDoctorNotes((previous) => {
        const updatedList = previous.map(
          (note) =>
            note.id === noteId
              ? updatedNote
              : note
        );

        return updatedList.sort((first, second) => {
          if (
            first.isPinned !== second.isPinned
          ) {
            return first.isPinned ? -1 : 1;
          }

          return (
            (second.createdAt || 0) -
            (first.createdAt || 0)
          );
        });
      });
    } catch (error) {
      console.error(
        "Failed to update pin status:",
        error
      );

      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update note pin status"
      );
    } finally {
      setDoctorNoteActionLoadingId(null);
    }
  };

  const handleCancelDoctorNoteForm = () => {
    if (doctorNoteSaving) return;

    setShowDoctorNoteForm(false);
    setDoctorNoteTitle("");
    setDoctorNoteContent("");
    setEditingDoctorNote(null);
  };

  const confirmDeleteDoctorNote = async () => {
    if (!deletingNoteId) return;

    try {
      setDoctorNoteActionLoadingId(
        deletingNoteId
      );

      await deletePatientDoctorNote(
        deletingNoteId
      );

      setDoctorNotes((previous) =>
        previous.filter(
          (note) =>
            note.id !== deletingNoteId
        )
      );

      setShowDeleteNoteConfirm(false);
      setDeletingNoteId(null);
    } catch (error) {
      console.error(
        "Failed to delete doctor note:",
        error
      );

      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to delete doctor note"
      );
    } finally {
      setDoctorNoteActionLoadingId(null);
    }
  };

  const handleEditDoctorNote = (note) => {
    setEditingDoctorNote(note);
    setDoctorNoteTitle(note.title || "");
    setDoctorNoteContent(note.content || "");
    setShowDoctorNoteForm(true);
  };

  const cancelDeleteDoctorNote = () => {
    if (doctorNoteActionLoadingId) return;

    setShowDeleteNoteConfirm(false);
    setDeletingNoteId(null);
  };

  const handleAiPrescriptionDraft = (
    draftData
  ) => {
    setEditingPrescription({
      source: "AI_DEMO",
      symptoms: draftData?.symptoms || "",
      diagnosis: draftData?.diagnosis || "",
      treatmentPlan:
        draftData?.treatmentPlan || "",
      clinicalNotes:
        draftData?.clinicalNotes || "",
      followUpType: "Visit Review",
      followUpDate: null,
      notifyPatient: true,
      visitId:
        defaultLinkedVisitId || null,
      medicines:
        Array.isArray(
          draftData?.medicines
        ) &&
        draftData.medicines.length > 0
          ? draftData.medicines
          : [
              {
                medicineName: "",
                dosage: "",
                duration: "",
                instruction: ""
              }
            ]
    });

    setShowPrescriptionModal(true);
  };

  const handleAiAppointmentDraft = (
    draftData
  ) => {
    setEditingAppointment(null);

    setPrefillAppointmentData({
      source: "AI_DEMO",
      appointmentDateTime:
        draftData?.appointmentDateTime ||
        null,
      notes: draftData?.notes || "",
      isCritical: Boolean(
        draftData?.isCritical
      ),
      doctorClinicId:
        draftData?.doctorClinicId ||
        patient?.doctorClinicId ||
        null
    });

    setShowAppointment(true);
  };

  const handleAiVisitDraft = (
    draftData
  ) => {
    setEditingVisit({
      source: "AI_DEMO",
      visitDate:
        draftData?.visitDate ||
        Date.now(),
      chiefComplaint:
        draftData?.chiefComplaint || "",
      doctorNotes:
        draftData?.doctorNotes || ""
    });

    setShowVisitModal(true);
  };

  const handleAiDoctorNoteDraft = (
    draftData
  ) => {
    setActiveTab("doctor-notes");
    setEditingDoctorNote(null);
    setDoctorNoteTitle(
      draftData?.title || ""
    );
    setDoctorNoteContent(
      draftData?.content || ""
    );
    setShowDoctorNoteForm(true);
  };

  const handleAiReportDraft = (
    draftData
  ) => {
    setAiReportPrefill({
      source: "AI_DEMO",
      reportName:
        draftData?.reportName || "",
      reportType:
        draftData?.reportType ||
        "BLOOD_TEST",
      reportDate:
        draftData?.reportDate || "",
      labName:
        draftData?.labName || "",
      notes: draftData?.notes || ""
    });

    setShowReportModal(true);
  };

  if (loading) {
    return (
      <div className="patient-details-page">
        <div className="page-state-card">
          <div className="loading">
            Loading patient details...
          </div>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="patient-details-page">
        <div className="details-top-nav">
          <button
            type="button"
            className="back-link-btn"
            onClick={() =>
              navigate("/doctor/patients")
            }
          >
            ← Back to Patients
          </button>
        </div>

        <div className="page-state-card">
          <div className="error-state">
            <h3>Unable to load patient</h3>
            <p>{pageError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="patient-details-page">
        <div className="page-state-card">
          <div className="empty-state">
            Patient data not found.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-details-page">
      <div className="details-top-nav">
        <button
          type="button"
          className="back-link-btn"
          onClick={() =>
            navigate("/doctor/patients")
          }
        >
          ← Back to Patients
        </button>
      </div>

      <div className="details-main-container">
        <aside className="patient-summary">
          <div className="avatar">
            {getPatientInitials(
              patient.fullName
            )}
          </div>

          <h3>
            {patient.fullName || "N/A"}
          </h3>

          <div className="summary-subtext">
            <span className="summary-subtext-id">
              Patient ID:{" "}
              {renderValue(patient.id)}
            </span>
          </div>

          <div className="summary-badges">
            <span
              className={`summary-badge ${
                patient.isCritical
                  ? "summary-badge-critical"
                  : "summary-badge-normal"
              }`}
            >
              {patient.isCritical
                ? "Critical"
                : "Stable"}
            </span>

            <span
              className={`summary-badge ${
                patient.isActive
                  ? "summary-badge-active"
                  : "summary-badge-archived"
              }`}
            >
              {patient.isActive
                ? "Active"
                : "Archived"}
            </span>
          </div>

          <div className="patient-info-list">
            <div className="info-item">
              <span className="info-label">
                DOB
              </span>

              <span className="info-value">
                {renderValue(
                  patient.dateOfBirth
                )}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">
                Age
              </span>

              <span className="info-value">
                {patient.age !== null &&
                patient.age !== undefined
                  ? `${patient.age} Yrs`
                  : "N/A"}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">
                Gender
              </span>

              <span className="info-value">
                {renderValue(patient.gender)}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">
                Phone
              </span>

              <span className="info-value">
                {renderValue(patient.phone)}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">
                Email
              </span>

              <span className="info-value">
                {renderValue(patient.email)}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">
                Clinic
              </span>

              <span className="info-value">
                {renderValue(
                  patient.clinicName
                )}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">
                Blood Group
              </span>

              <span className="info-value">
                {renderValue(
                  patient.bloodGroup
                )}
              </span>
            </div>
          </div>
        </aside>

        <section className="patient-records">
          <div className="overview-grid">
            <div className="overview-card overview-card-primary">
              <div className="overview-card-head">
                <div>
                  <p className="section-eyebrow">
                    Patient Overview
                  </p>

                  <h2>
                    Basic Medical Information
                  </h2>

                  <p className="section-subtext">
                    This section shows the core patient
                    details entered by the doctor during
                    patient creation.
                  </p>
                </div>
              </div>

              <div className="overview-details-grid">
                <div className="detail-block detail-block-wide">
                  <span className="detail-label">
                    Symptoms / Complaint
                  </span>

                  <p className="detail-value detail-value-long">
                    {renderValue(
                      patient.symptoms
                    )}
                  </p>
                </div>

                <div className="detail-block detail-block-wide">
                  <span className="detail-label">
                    Medical History
                  </span>

                  <p className="detail-value detail-value-long">
                    {renderValue(
                      patient.medicalHistory
                    )}
                  </p>
                </div>

                <div className="detail-block">
                  <span className="detail-label">
                    Allergies
                  </span>

                  <p className="detail-value detail-value-long">
                    {renderValue(
                      patient.allergies
                    )}
                  </p>
                </div>

                <div className="detail-block">
                  <span className="detail-label">
                    Chronic Conditions
                  </span>

                  <p className="detail-value detail-value-long">
                    {renderValue(
                      patient.chronicConditions
                    )}
                  </p>
                </div>

                <div className="detail-block">
                  <span className="detail-label">
                    Surgeries
                  </span>

                  <p className="detail-value detail-value-long">
                    {renderValue(
                      patient.surgeries
                    )}
                  </p>
                </div>

                <div className="detail-block">
                  <span className="detail-label">
                    Medications
                  </span>

                  <p className="detail-value detail-value-long">
                    {renderValue(
                      patient.medications
                    )}
                  </p>
                </div>

                <div className="detail-block">
                  <span className="detail-label">
                    Emergency Contact Name
                  </span>

                  <p className="detail-value">
                    {renderValue(
                      patient.emergencyContactName
                    )}
                  </p>
                </div>

                <div className="detail-block">
                  <span className="detail-label">
                    Emergency Contact Phone
                  </span>

                  <p className="detail-value">
                    {renderValue(
                      patient.emergencyContactPhone
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="overview-card overview-card-secondary">
              <div className="overview-card-head">
                <div>
                  <p className="section-eyebrow">
                    Profile Snapshot
                  </p>

                  <h2>Quick Status</h2>
                </div>
              </div>

              <div className="snapshot-grid">
                <div className="snapshot-item">
                  <span className="snapshot-label">
                    Profile State
                  </span>

                  <span className="snapshot-value">
                    {patient.isActive
                      ? "Active Record"
                      : "Archived Record"}
                  </span>
                </div>

                <div className="snapshot-item">
                  <span className="snapshot-label">
                    Critical Flag
                  </span>

                  <span className="snapshot-value">
                    {patient.isCritical
                      ? "Marked Critical"
                      : "Not Critical"}
                  </span>
                </div>

                <div className="snapshot-item">
                  <span className="snapshot-label">
                    Created On
                  </span>

                  <span className="snapshot-value">
                    {renderValue(
                      patient.createdAt
                    )}
                  </span>
                </div>

                <div className="snapshot-item">
                  <span className="snapshot-label">
                    Last Updated
                  </span>

                  <span className="snapshot-value">
                    {renderValue(
                      patient.updatedAt
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <AiClinicalAssistant
            patient={patient}
            visits={visits}
            prescriptions={prescriptions}
            reports={reports}
            appointments={appointments}
            doctorNotes={doctorNotes}
            backendAiEnabled={Boolean(
              aiAccess?.aiPrescriptionEnabled
            )}
            onOpenPrescription={
              handleAiPrescriptionDraft
            }
            onOpenAppointment={
              handleAiAppointmentDraft
            }
            onOpenVisit={
              handleAiVisitDraft
            }
            onOpenDoctorNote={
              handleAiDoctorNoteDraft
            }
            onOpenReport={
              handleAiReportDraft
            }
          />

          <div className="patient-tabs">
            {[
              "visits",
              "prescriptions",
              "reports",
              "appointments",
              "lab-orders",
              "doctor-notes"
            ].map((tab) => (
              <button
                type="button"
                key={tab}
                className={
                  activeTab === tab
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTab(tab)
                }
              >
                {tab === "doctor-notes"
                  ? "DOCTOR NOTES"
                  : tab === "lab-orders"
                    ? "LAB ORDERS"
                    : tab.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {activeTab === "visits" && (
              <>
                <div className="tab-header">
                  <h3>Visit History</h3>

                  <button
                    type="button"
                    className="add-btn"
                    onClick={() => {
                      setEditingVisit(null);
                      setShowVisitModal(true);
                    }}
                  >
                    + Add New Visit
                  </button>
                </div>

                {visits.length === 0 ? (
                  <div className="empty-state">
                    No visit history available yet.
                  </div>
                ) : (
                  visits.map((visit) => (
                    <div
                      key={visit.id}
                      className={`record-card ${
                        openVisitId === visit.id
                          ? "record-card-highlight"
                          : ""
                      }`}
                      onClick={() =>
                        setOpenVisitId(
                          openVisitId === visit.id
                            ? null
                            : visit.id
                        )
                      }
                    >
                      <div className="prescription-card-top">
                        <div className="prescription-card-left">
                          <span className="record-date">
                            {visit.visitDate
                              ? new Date(
                                  visit.visitDate
                                ).toLocaleString()
                              : "N/A"}
                          </span>

                          <p>
                            <strong>
                              Chief Complaint:
                            </strong>{" "}
                            {visit.chiefComplaint ||
                              "N/A"}
                          </p>
                        </div>

                        <div
                          className="prescription-card-actions"
                          onClick={(event) =>
                            event.stopPropagation()
                          }
                        >
                          <button
                            type="button"
                            className="prescription-edit-btn"
                            onClick={() =>
                              handleEditVisit(visit)
                            }
                          >
                            Edit
                          </button>
                        </div>
                      </div>

                      {openVisitId === visit.id && (
                        <p>
                          <strong>
                            Doctor Notes:
                          </strong>{" "}
                          {visit.doctorNotes ||
                            "N/A"}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === "prescriptions" && (
              <>
                <div className="tab-header">
                  <h3>Active Prescriptions</h3>

                  <button
                    type="button"
                    className="add-btn"
                    onClick={() => {
                      setEditingPrescription(
                        null
                      );
                      setShowPrescriptionModal(
                        true
                      );
                    }}
                  >
                    + New Prescription
                  </button>
                </div>

                {prescriptions.length === 0 ? (
                  <div className="empty-state">
                    No prescriptions added yet.
                  </div>
                ) : (
                  <div className="prescription-records-list">
                    {prescriptions.map(
                      (prescription) => {
                        const isOpen =
                          openPrescriptionId ===
                          prescription.id;

                        return (
                          <div
                            key={
                              prescription.id
                            }
                            className={`record-card ${
                              isOpen
                                ? "record-card-highlight"
                                : ""
                            }`}
                            onClick={() =>
                              setOpenPrescriptionId(
                                isOpen
                                  ? null
                                  : prescription.id
                              )
                            }
                          >
                            <div className="prescription-card-top">
                              <div className="prescription-card-left">
                                <div className="prescription-top-row">
                                  <span className="record-date">
                                    {prescription.prescriptionDate
                                      ? new Date(
                                          prescription.prescriptionDate
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </span>

                                  <span className="prescription-status-badge">
                                    {prescription.followUpDate
                                      ? "Follow-up Set"
                                      : "Saved"}
                                  </span>
                                </div>

                                <h4>
                                  {prescription.diagnosis ||
                                    "Untitled Prescription"}
                                </h4>

                                <p className="prescription-subtext">
                                  <strong>
                                    Doctor:
                                  </strong>{" "}
                                  You
                                </p>

                                {prescription.symptoms && (
                                  <p className="prescription-subtext">
                                    <strong>
                                      Symptoms:
                                    </strong>{" "}
                                    {
                                      prescription.symptoms
                                    }
                                  </p>
                                )}
                              </div>

                              <div className="prescription-card-actions">
                                <button
                                  type="button"
                                  className="prescription-edit-btn"
                                  onClick={(
                                    event
                                  ) => {
                                    event.stopPropagation();

                                    handleEditPrescription(
                                      prescription
                                    );
                                  }}
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="prescription-delete-btn"
                                  onClick={(
                                    event
                                  ) => {
                                    event.stopPropagation();

                                    handleDeletePrescription(
                                      prescription.id
                                    );
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>

                            {isOpen && (
                              <div
                                className="prescription-expanded-content"
                                onClick={(
                                  event
                                ) =>
                                  event.stopPropagation()
                                }
                              >
                                {prescription.treatmentPlan && (
                                  <div className="prescription-section-block">
                                    <span className="prescription-section-label">
                                      Treatment Plan
                                    </span>

                                    <p>
                                      {
                                        prescription.treatmentPlan
                                      }
                                    </p>
                                  </div>
                                )}

                                {prescription.clinicalNotes && (
                                  <div className="prescription-section-block">
                                    <span className="prescription-section-label">
                                      Clinical Notes
                                    </span>

                                    <p>
                                      {
                                        prescription.clinicalNotes
                                      }
                                    </p>
                                  </div>
                                )}

                                <div className="prescription-section-block">
                                  <span className="prescription-section-label">
                                    Medicine Details
                                  </span>

                                  {prescription.medicines &&
                                  prescription
                                    .medicines
                                    .length > 0 ? (
                                    <div className="prescription-medicine-list">
                                      {prescription.medicines.map(
                                        (
                                          medicine,
                                          index
                                        ) => (
                                          <div
                                            key={`${prescription.id}-medicine-${index}`}
                                            className="prescription-medicine-card"
                                          >
                                            <div className="prescription-medicine-top">
                                              <h5>
                                                {medicine.medicineName ||
                                                  "Medicine"}
                                              </h5>

                                              <span className="prescription-dose-badge">
                                                {medicine.dosage ||
                                                  "-"}
                                              </span>
                                            </div>

                                            <div className="prescription-medicine-meta">
                                              <p>
                                                <strong>
                                                  Duration:
                                                </strong>{" "}
                                                {medicine.duration ||
                                                  "-"}
                                              </p>

                                              <p>
                                                <strong>
                                                  Instruction:
                                                </strong>{" "}
                                                {medicine.instruction ||
                                                  "-"}
                                              </p>
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  ) : (
                                    <p className="prescription-empty-text">
                                      No medicines
                                      added.
                                    </p>
                                  )}
                                </div>

                                {(prescription.followUpType ||
                                  prescription.followUpDate) && (
                                  <div className="prescription-section-block">
                                    <span className="prescription-section-label">
                                      Follow-up
                                    </span>

                                    <div className="prescription-followup-grid">
                                      <div className="prescription-followup-item">
                                        <span className="followup-item-label">
                                          Type
                                        </span>

                                        <p>
                                          {prescription.followUpType ||
                                            "Not specified"}
                                        </p>
                                      </div>

                                      <div className="prescription-followup-item">
                                        <span className="followup-item-label">
                                          Date
                                        </span>

                                        <p>
                                          {prescription.followUpDate
                                            ? new Date(
                                                prescription.followUpDate
                                              ).toLocaleDateString()
                                            : "Not scheduled"}
                                        </p>
                                      </div>

                                      <div className="prescription-followup-item">
                                        <span className="followup-item-label">
                                          Notify Patient
                                        </span>

                                        <p>
                                          {prescription.notifyPatient
                                            ? "Yes"
                                            : "No"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === "reports" && (
              <>
                <div className="tab-header">
                  <h3>Medical Reports</h3>

                  <button
                    type="button"
                    className="add-btn"
                    onClick={() => {
                      setAiReportPrefill(null);
                      setShowReportModal(true);
                    }}
                  >
                    + Upload Report
                  </button>
                </div>

                {reports.length === 0 ? (
                  <div className="empty-state">
                    No medical reports uploaded yet.
                  </div>
                ) : (
                  <div className="report-records-list">
                    {reports.map((report) => {
                      const isOpen =
                        openReportId === report.id;

                      return (
                        <div
                          key={report.id}
                          className={`record-card ${
                            isOpen
                              ? "record-card-highlight"
                              : ""
                          }`}
                          onClick={() =>
                            setOpenReportId(
                              isOpen
                                ? null
                                : report.id
                            )
                          }
                        >
                          <div className="report-card-top">
                            <div className="report-card-left">
                              <div className="report-top-row">
                                <span className="record-date">
                                  {formatDateValue(
                                    report.reportDate
                                  )}
                                </span>

                                <span className="report-status-badge">
                                  {report.reviewStatus ||
                                    "REVIEWED"}
                                </span>
                              </div>

                              <h4>
                                {report.reportName ||
                                  "Medical Report"}
                              </h4>

                              <p className="report-subtext">
                                <strong>
                                  Type:
                                </strong>{" "}
                                {renderValue(
                                  report.reportType
                                )}
                              </p>

                              <p className="report-subtext">
                                <strong>
                                  Lab:
                                </strong>{" "}
                                {renderValue(
                                  report.labName
                                )}
                              </p>
                            </div>

                            <div
                              className="report-card-actions"
                              onClick={(
                                event
                              ) =>
                                event.stopPropagation()
                              }
                            >
                              {report.fileUrl && (
                                <a
                                  href={
                                    report.fileUrl
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="report-view-btn"
                                >
                                  View File
                                </a>
                              )}

                              <button
                                type="button"
                                className="report-delete-btn"
                                onClick={() =>
                                  handleDeleteReport(
                                    report.id
                                  )
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          {isOpen && (
                            <div
                              className="report-expanded-content"
                              onClick={(
                                event
                              ) =>
                                event.stopPropagation()
                              }
                            >
                              <div className="report-section-block">
                                <span className="report-section-label">
                                  File Information
                                </span>

                                <div className="report-meta-grid">
                                  <div className="report-meta-item">
                                    <span className="report-meta-label">
                                      Original File
                                    </span>

                                    <p>
                                      {renderValue(
                                        report.originalFileName
                                      )}
                                    </p>
                                  </div>

                                  <div className="report-meta-item">
                                    <span className="report-meta-label">
                                      Stored File
                                    </span>

                                    <p>
                                      {renderValue(
                                        report.storedFileName
                                      )}
                                    </p>
                                  </div>

                                  <div className="report-meta-item">
                                    <span className="report-meta-label">
                                      Content Type
                                    </span>

                                    <p>
                                      {renderValue(
                                        report.fileContentType
                                      )}
                                    </p>
                                  </div>

                                  <div className="report-meta-item">
                                    <span className="report-meta-label">
                                      File Size
                                    </span>

                                    <p>
                                      {formatFileSize(
                                        report.fileSizeBytes
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="report-section-block">
                                <span className="report-section-label">
                                  Clinical Linkage
                                </span>

                                <div className="report-meta-grid">
                                  <div className="report-meta-item">
                                    <span className="report-meta-label">
                                      Linked Visit
                                    </span>

                                    <p>
                                      {getLinkedVisitDisplay(
                                        report
                                      )}
                                    </p>
                                  </div>

                                  <div className="report-meta-item">
                                    <span className="report-meta-label">
                                      Linked Prescription
                                    </span>

                                    <p>
                                      {getLinkedPrescriptionDisplay(
                                        report
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="report-section-block">
                                <span className="report-section-label">
                                  Review Information
                                </span>

                                <div className="report-meta-grid">
                                  <div className="report-meta-item">
                                    <span className="report-meta-label">
                                      Review Status
                                    </span>

                                    <p>
                                      {renderValue(
                                        report.reviewStatus
                                      )}
                                    </p>
                                  </div>

                                  <div className="report-meta-item">
                                    <span className="report-meta-label">
                                      Reviewed On
                                    </span>

                                    <p>
                                      {formatDateValue(
                                        report.reviewedAt
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="report-section-block">
                                <span className="report-section-label">
                                  Doctor Notes
                                </span>

                                <p>
                                  {renderValue(
                                    report.notes
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {activeTab === "appointments" && (
              <>
                <div className="tab-header">
                  <h3>Appointments</h3>

                  <button
                    type="button"
                    className="add-btn"
                    onClick={() => {
                      setEditingAppointment(
                        null
                      );

                      setPrefillAppointmentData(
                        null
                      );

                      setShowAppointment(true);
                    }}
                  >
                    + Schedule Appointment
                  </button>
                </div>

                {appointments.length === 0 ? (
                  <div className="empty-state">
                    No appointments scheduled yet.
                  </div>
                ) : (
                  <div className="appointments-list">
                    {appointments.map(
                      (appointment) => {
                        const isOpen =
                          openAppointmentId ===
                          appointment.id;

                        return (
                          <div
                            key={
                              appointment.id
                            }
                            className={`record-card ${
                              isOpen
                                ? "record-card-highlight"
                                : ""
                            }`}
                            onClick={() =>
                              setOpenAppointmentId(
                                isOpen
                                  ? null
                                  : appointment.id
                              )
                            }
                          >
                            <div className="appointment-card-top">
                              <div className="appointment-card-left">
                                <div className="appointment-top-row">
                                  <span className="record-date">
                                    {formatDateTimeValue(
                                      appointment.appointmentDateTime
                                    )}
                                  </span>

                                  <span
                                    className={`appointment-status-badge ${
                                      appointment.status
                                        ?.toLowerCase()
                                        .replace(
                                          "_",
                                          "-"
                                        ) || ""
                                    }`}
                                  >
                                    {appointment.status ||
                                      "N/A"}
                                  </span>
                                </div>

                                <h4>
                                  {appointment.clinicName ||
                                    "Clinic Not Available"}
                                </h4>

                                {appointment.isCritical && (
                                  <span className="appointment-critical-badge">
                                    Critical
                                    Appointment
                                  </span>
                                )}

                                <p className="appointment-subtext">
                                  <strong>
                                    Clinic:
                                  </strong>{" "}
                                  {appointment.clinicName ||
                                    "N/A"}
                                </p>
                              </div>

                              <div
                                className="appointment-card-actions"
                                onClick={(
                                  event
                                ) =>
                                  event.stopPropagation()
                                }
                              >
                                {appointment.status ===
                                  "SCHEDULED" && (
                                  <>
                                    <button
                                      type="button"
                                      className="appointment-edit-btn"
                                      onClick={() =>
                                        handleEditAppointment(
                                          appointment
                                        )
                                      }
                                    >
                                      Edit
                                    </button>

                                    <button
                                      type="button"
                                      className="appointment-cancel-btn"
                                      onClick={() =>
                                        handleCancelAppointment(
                                          appointment.id
                                        )
                                      }
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {isOpen && (
                              <div
                                className="appointment-expanded-content"
                                onClick={(
                                  event
                                ) =>
                                  event.stopPropagation()
                                }
                              >
                                <div className="appointment-details-grid">
                                  <div className="appointment-detail-item">
                                    <span>
                                      Status
                                    </span>

                                    <p>
                                      {appointment.status ||
                                        "N/A"}
                                    </p>
                                  </div>

                                  <div className="appointment-detail-item">
                                    <span>
                                      Critical
                                    </span>

                                    <p>
                                      {appointment.isCritical
                                        ? "Yes"
                                        : "No"}
                                    </p>
                                  </div>

                                  <div className="appointment-detail-item">
                                    <span>
                                      Created
                                    </span>

                                    <p>
                                      {formatDateTimeValue(
                                        appointment.createdAt
                                      )}
                                    </p>
                                  </div>

                                  <div className="appointment-detail-item">
                                    <span>
                                      Updated
                                    </span>

                                    <p>
                                      {formatDateTimeValue(
                                        appointment.updatedAt
                                      )}
                                    </p>
                                  </div>
                                </div>

                                {appointment.notes && (
                                  <div className="appointment-notes">
                                    <span>
                                      Notes
                                    </span>

                                    <p>
                                      {
                                        appointment.notes
                                      }
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === "lab-orders" && (
              <>
                <div className="tab-header">
                  <h3>Lab Orders</h3>

                  <button
                    type="button"
                    className="add-btn"
                    onClick={() =>
                      setShowLabModal(true)
                    }
                  >
                    + Order Lab Test
                  </button>
                </div>

                {labOrdersLoading ? (
                  <div className="empty-state">
                    Loading lab orders...
                  </div>
                ) : labOrders.length === 0 ? (
                  <div className="empty-state">
                    No lab orders created yet.
                  </div>
                ) : (
                  <div className="appointments-list">
                    {labOrders.map((order) => {
                      const isOpen =
                        openLabOrderId === order.id;

                      const isCancelled =
                        order.status ===
                        "CANCELLED";

                      return (
                        <div
                          key={order.id}
                          className={`record-card ${
                            isOpen
                              ? "record-card-highlight"
                              : ""
                          }`}
                          onClick={() =>
                            setOpenLabOrderId(
                              isOpen
                                ? null
                                : order.id
                            )
                          }
                        >
                          <div className="appointment-card-top">
                            <div className="appointment-card-left">
                              <div className="appointment-top-row">
                                <span className="record-date">
                                  {formatDateTimeValue(
                                    order.createdAt
                                  )}
                                </span>

                                <span className="appointment-status-badge">
                                  {order.status ||
                                    "CREATED"}
                                </span>
                              </div>

                              <h4>
                                {order.labName ||
                                  "Lab Order"}
                              </h4>

                              <p className="appointment-subtext">
                                <strong>
                                  Source:
                                </strong>{" "}
                                {order.labSourceType ||
                                  "N/A"}
                              </p>

                              <p className="appointment-subtext">
                                <strong>
                                  Collection:
                                </strong>{" "}
                                {order.collectionType ||
                                  "N/A"}
                              </p>

                              <p className="appointment-subtext">
                                <strong>
                                  Priority:
                                </strong>{" "}
                                {order.priority ||
                                  "N/A"}
                              </p>
                            </div>

                            <div
                              className="appointment-card-actions"
                              onClick={(
                                event
                              ) =>
                                event.stopPropagation()
                              }
                            >
                              {!isCancelled && (
                                <>
                                  <button
                                    type="button"
                                    className="appointment-edit-btn"
                                    onClick={() =>
                                      handleUpdateLabOrderStatus(
                                        order.id,
                                        "SENT_TO_LAB"
                                      )
                                    }
                                    disabled={
                                      labOrderActionLoading
                                    }
                                  >
                                    Send to Lab
                                  </button>

                                  <button
                                    type="button"
                                    className="appointment-edit-btn"
                                    onClick={() =>
                                      handleUpdateLabOrderStatus(
                                        order.id,
                                        "SAMPLE_COLLECTED"
                                      )
                                    }
                                    disabled={
                                      labOrderActionLoading
                                    }
                                  >
                                    Sample Collected
                                  </button>

                                  <button
                                    type="button"
                                    className="appointment-cancel-btn"
                                    onClick={() =>
                                      handleCancelLabOrder(
                                        order.id
                                      )
                                    }
                                    disabled={
                                      labOrderActionLoading
                                    }
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {isOpen && (
                            <div
                              className="appointment-expanded-content"
                              onClick={(
                                event
                              ) =>
                                event.stopPropagation()
                              }
                            >
                              <div className="appointment-details-grid">
                                <div className="appointment-detail-item">
                                  <span>
                                    Payment Mode
                                  </span>

                                  <p>
                                    {order.paymentMode ||
                                      "N/A"}
                                  </p>
                                </div>

                                <div className="appointment-detail-item">
                                  <span>
                                    Clinic
                                  </span>

                                  <p>
                                    {order.doctorClinicName ||
                                      "N/A"}
                                  </p>
                                </div>

                                <div className="appointment-detail-item">
                                  <span>
                                    Linked Visit
                                  </span>

                                  <p>
                                    {getLinkedLabVisitDisplay(
                                      order
                                    )}
                                  </p>
                                </div>

                                <div className="appointment-detail-item">
                                  <span>
                                    Linked
                                    Prescription
                                  </span>

                                  <p>
                                    {getLinkedLabPrescriptionDisplay(
                                      order
                                    )}
                                  </p>
                                </div>
                              </div>

                              {order.notes && (
                                <div className="appointment-notes">
                                  <span>
                                    Notes
                                  </span>

                                  <p>
                                    {order.notes}
                                  </p>
                                </div>
                              )}

                              {order.tests?.length >
                                0 && (
                                <div className="appointment-notes">
                                  <span>
                                    Selected Tests
                                  </span>

                                  <div className="labs-preview-chips">
                                    {order.tests.map(
                                      (test) => (
                                        <span
                                          key={
                                            test.id
                                          }
                                          className="service-chip"
                                        >
                                          {
                                            test.testName
                                          }{" "}
                                          • ₹
                                          {test.price}
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {activeTab === "doctor-notes" && (
              <>
                <div className="tab-header doctor-notes-header">
                  <div>
                    <h3>
                      Doctor Private Notes
                    </h3>

                    <p className="doctor-notes-subtext">
                      Visible only to you. Use this
                      for your personal clinical
                      observations.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="add-btn"
                    onClick={() =>
                      setShowDoctorNoteForm(
                        (previous) =>
                          !previous
                      )
                    }
                    disabled={
                      doctorNoteSaving
                    }
                  >
                    {showDoctorNoteForm
                      ? editingDoctorNote
                        ? "Close Edit Form"
                        : "Close Form"
                      : "+ Add Note"}
                  </button>
                </div>

                {showDoctorNoteForm && (
                  <div className="doctor-note-form-card">
                    <div className="doctor-note-form-group">
                      <label>
                        Note Title
                      </label>

                      <input
                        type="text"
                        placeholder="Eg. Follow-up reminder"
                        value={
                          doctorNoteTitle
                        }
                        onChange={(event) =>
                          setDoctorNoteTitle(
                            event.target.value
                          )
                        }
                        maxLength={200}
                        disabled={
                          doctorNoteSaving
                        }
                      />
                    </div>

                    <div className="doctor-note-form-group">
                      <label>
                        Doctor Note
                      </label>

                      <textarea
                        rows="5"
                        placeholder="Write your private note about this patient."
                        value={
                          doctorNoteContent
                        }
                        onChange={(event) =>
                          setDoctorNoteContent(
                            event.target.value
                          )
                        }
                        maxLength={3000}
                        disabled={
                          doctorNoteSaving
                        }
                      />
                    </div>

                    <div className="doctor-note-form-actions">
                      <button
                        type="button"
                        className="doctor-note-cancel-btn"
                        onClick={
                          handleCancelDoctorNoteForm
                        }
                        disabled={
                          doctorNoteSaving
                        }
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="doctor-note-save-btn"
                        onClick={
                          handleSaveDoctorNote
                        }
                        disabled={
                          doctorNoteSaving ||
                          !doctorNoteContent.trim()
                        }
                      >
                        {doctorNoteSaving
                          ? editingDoctorNote
                            ? "Updating..."
                            : "Saving..."
                          : editingDoctorNote
                            ? "Update Note"
                            : "Save Note"}
                      </button>
                    </div>
                  </div>
                )}

                {doctorNotesLoading ? (
                  <div className="empty-state">
                    Loading doctor notes...
                  </div>
                ) : doctorNotes.length === 0 ? (
                  <div className="empty-state">
                    No private doctor notes added yet.
                  </div>
                ) : (
                  <div className="doctor-notes-list">
                    {doctorNotes.map((note) => {
                      const isActionLoading =
                        doctorNoteActionLoadingId ===
                        note.id;

                      return (
                        <div
                          key={note.id}
                          className={`doctor-note-card ${
                            note.isPinned
                              ? "pinned"
                              : ""
                          }`}
                        >
                          <div className="doctor-note-top">
                            <div className="doctor-note-meta">
                              <span className="doctor-note-date">
                                {formatDateTimeValue(
                                  note.createdAt
                                )}
                              </span>

                              {note.isPinned && (
                                <span className="doctor-note-pin-badge">
                                  Pinned
                                </span>
                              )}
                            </div>

                            <div className="doctor-note-actions">
                              <button
                                type="button"
                                className="doctor-note-action-btn"
                                onClick={() =>
                                  handleTogglePin(
                                    note.id,
                                    note.isPinned
                                  )
                                }
                                disabled={
                                  isActionLoading
                                }
                              >
                                {isActionLoading
                                  ? "Please wait..."
                                  : note.isPinned
                                    ? "Unpin"
                                    : "Pin"}
                              </button>

                              <button
                                type="button"
                                className="doctor-note-action-btn"
                                onClick={() =>
                                  handleEditDoctorNote(
                                    note
                                  )
                                }
                                disabled={
                                  isActionLoading
                                }
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="doctor-note-action-btn delete"
                                onClick={() => {
                                  setDeletingNoteId(
                                    note.id
                                  );

                                  setShowDeleteNoteConfirm(
                                    true
                                  );
                                }}
                                disabled={
                                  isActionLoading
                                }
                              >
                                {isActionLoading
                                  ? "Please wait..."
                                  : "Delete"}
                              </button>
                            </div>
                          </div>

                          <h4>
                            {note.title ||
                              "Untitled Note"}
                          </h4>

                          <p>
                            {note.content ||
                              "N/A"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {showVisitModal && (
        <AddVisitModal
          onClose={() => {
            setShowVisitModal(false);
            setEditingVisit(null);
          }}
          onSave={handleAddVisit}
          editingData={editingVisit}
        />
      )}

      {showPrescriptionModal && (
        <AddPrescriptionModal
          onClose={() => {
            setShowPrescriptionModal(false);
            setEditingPrescription(null);
          }}
          onSave={handleSavePrescription}
          editingData={editingPrescription}
          aiEnabled={
            Boolean(
              aiAccess?.aiPrescriptionEnabled
            ) ||
            editingPrescription?.source ===
              "AI_DEMO"
          }
          visits={visits}
          defaultVisitId={
            defaultLinkedVisitId
          }
        />
      )}

      {showReportModal && (
        <AddReportModal
          onClose={() => {
            setShowReportModal(false);
            setAiReportPrefill(null);
          }}
          onSave={handleAddReports}
          saving={reportActionLoading}
          visits={visits}
          prescriptions={prescriptions}
          defaultVisitId={
            defaultLinkedVisitId
          }
          defaultPrescriptionId={
            defaultLinkedPrescriptionId
          }
          prefillData={aiReportPrefill}
        />
      )}

      {showAppointment && (
        <AddAppointmentModal
          onClose={() => {
            setShowAppointment(false);
            setEditingAppointment(null);
            setPrefillAppointmentData(null);
          }}
          onSave={handleAddAppointment}
          patient={patient}
          editingAppointment={
            editingAppointment
          }
          prefillAppointmentData={
            prefillAppointmentData
          }
        />
      )}

      {showLabModal && (
        <LabOrderModal
          onClose={() =>
            setShowLabModal(false)
          }
          onSave={handleCreateLabOrder}
          patient={patient}
          systemLabs={systemLabs}
          myLabs={myLabs}
          labTestCatalog={
            labTestCatalog
          }
          visits={visits}
          prescriptions={prescriptions}
          saving={
            labOrderActionLoading
          }
        />
      )}

      {showDeleteConfirm && (
        <div
          className="delete-confirm-overlay"
          onClick={
            cancelDeletePrescription
          }
        >
          <div
            className="delete-confirm-card"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="delete-confirm-header">
              <h3>
                Delete Prescription?
              </h3>

              <p>
                This prescription will be removed
                from the active list. Please
                confirm before continuing.
              </p>
            </div>

            <div className="delete-confirm-actions">
              <button
                type="button"
                className="delete-confirm-cancel-btn"
                onClick={
                  cancelDeletePrescription
                }
                disabled={deleteLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-confirm-delete-btn"
                onClick={
                  confirmDeletePrescription
                }
                disabled={deleteLoading}
              >
                {deleteLoading
                  ? "Deleting..."
                  : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteReportConfirm && (
        <div
          className="delete-confirm-overlay"
          onClick={cancelDeleteReport}
        >
          <div
            className="delete-confirm-card"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="delete-confirm-header">
              <h3>
                Delete Medical Report?
              </h3>

              <p>
                This report will be removed from
                the active list. The current
                action is a soft delete.
              </p>
            </div>

            <div className="delete-confirm-actions">
              <button
                type="button"
                className="delete-confirm-cancel-btn"
                onClick={
                  cancelDeleteReport
                }
                disabled={
                  reportActionLoading
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-confirm-delete-btn"
                onClick={
                  confirmDeleteReport
                }
                disabled={
                  reportActionLoading
                }
              >
                {reportActionLoading
                  ? "Deleting..."
                  : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelLabOrderConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-card">
            <div className="delete-confirm-header">
              <h3>Cancel Lab Order</h3>

              <p>
                Are you sure you want to cancel
                this lab order?
              </p>
            </div>

            <div className="delete-confirm-actions">
              <button
                type="button"
                className="delete-confirm-cancel-btn"
                onClick={
                  cancelCancelLabOrder
                }
                disabled={
                  labOrderActionLoading
                }
              >
                Keep Order
              </button>

              <button
                type="button"
                className="delete-confirm-delete-btn"
                onClick={
                  confirmCancelLabOrder
                }
                disabled={
                  labOrderActionLoading
                }
              >
                {labOrderActionLoading
                  ? "Cancelling..."
                  : "Cancel Lab Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteNoteConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <h3>Delete Note?</h3>

            <p>
              This action cannot be undone.
            </p>

            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-cancel"
                onClick={
                  cancelDeleteDoctorNote
                }
                disabled={
                  Boolean(
                    doctorNoteActionLoadingId
                  )
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirm-delete"
                onClick={
                  confirmDeleteDoctorNote
                }
                disabled={
                  Boolean(
                    doctorNoteActionLoadingId
                  )
                }
              >
                {doctorNoteActionLoadingId
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelAppointmentConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-card">
            <div className="delete-confirm-header">
              <h3>
                Cancel Appointment
              </h3>

              <p>
                Are you sure you want to cancel
                this appointment?
              </p>
            </div>

            <div className="delete-confirm-actions">
              <button
                type="button"
                className="delete-confirm-cancel-btn"
                onClick={
                  cancelCancelAppointment
                }
                disabled={
                  appointmentActionLoading
                }
              >
                Keep Appointment
              </button>

              <button
                type="button"
                className="delete-confirm-delete-btn"
                onClick={
                  confirmCancelAppointment
                }
                disabled={
                  appointmentActionLoading
                }
              >
                {appointmentActionLoading
                  ? "Cancelling..."
                  : "Cancel Appointment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showFollowUpPrompt && (
        <div
          className="delete-confirm-overlay"
          onClick={
            handleCancelFollowUpAppointmentPrompt
          }
        >
          <div
            className="delete-confirm-card"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="delete-confirm-header">
              <h3>
                Schedule Follow-up Appointment?
              </h3>

              <p>
                Prescription saved successfully.
                Do you want to schedule the
                follow-up appointment now?
              </p>
            </div>

            <div className="delete-confirm-actions">
              <button
                type="button"
                className="delete-confirm-cancel-btn"
                onClick={
                  handleCancelFollowUpAppointmentPrompt
                }
              >
                Not Now
              </button>

              <button
                type="button"
                className="delete-confirm-delete-btn"
                onClick={
                  handleConfirmFollowUpAppointment
                }
              >
                Yes, Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetails;