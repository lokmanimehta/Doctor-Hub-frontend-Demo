import { patientDummyData } from "../utils/patientDummyData";
import { prescriptionsDummyData } from "../utils/prescriptionsDummyData";

// ✅ Get all patients
export const getPatients = async () => {
  return patientDummyData;
};

// ✅ Get patient by ID
export const getPatientById = async (id) => {
  return patientDummyData.find(p => p.id == id);
};

// ✅ Get prescriptions for patient
export const getPatientPrescriptions = async (id) => {
  const patient = patientDummyData.find(x => x.id == id);

  if (!patient) return [];

  return prescriptionsDummyData.filter(
    p => p.patient.name === patient.full_name
  );
};