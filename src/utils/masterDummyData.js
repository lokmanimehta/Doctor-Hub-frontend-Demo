// PATIENTS
export const patients = [
  {
    id: "P-101",
    doctor_id: 1,
    hospital_id: 1,
    hospital_name: "City Care Hospital",
    full_name: "Rahul Sharma",
    age: 32,
    gender: "Male",
    complaint: "Chest Pain",
    is_critical: true
  },
  {
    id: "P-102",
    doctor_id: 1,
    hospital_id: 2,
    hospital_name: "Sunrise Multispeciality",
    full_name: "Priya Singh",
    age: 26,
    gender: "Female",
    complaint: "Fever & Cold",
    is_critical: false
  },
  {
    id: "P-103",
    doctor_id: 1,
    hospital_id: 3,
    hospital_name: "Green Valley Clinic",
    full_name: "Amit Verma",
    age: 45,
    gender: "Male",
    complaint: "Diabetes Follow-up",
    is_critical: false
  },
  {
    id: "P-104",
    doctor_id: 1,
    hospital_id: 1,
    hospital_name: "City Care Hospital",
    full_name: "Neha Kapoor",
    age: 38,
    gender: "Female",
    complaint: "Severe Migraine",
    is_critical: true
  },
  {
    id: "P-105",
    doctor_id: 1,
    hospital_id: 2,
    hospital_name: "Sunrise Multispeciality",
    full_name: "Rohan Mehta",
    age: 29,
    gender: "Male",
    complaint: "Back Pain",
    is_critical: false
  }
];


// PRESCRIPTIONS (FIXED)
export const prescriptions = [
  {
    id: 1,
    patientId: "P-101",   // ✅ RELATION FIX
    doctorName: "Dr. Aisha Khan",
    specialization: "Cardiologist",
    clinic: "City Heart Hospital",
    date: "2026-02-24",
    status: "ACTIVE",
    diagnosis: "Hypertension",
    medicines: [
      {
        name: "Telmisartan 40mg",
        dosage: "1-0-0",
        duration: "30 Days",
        instruction: "Before Breakfast"
      }
    ],
    notes: "Reduce salt intake"
  },
  {
    id: 2,
    patientId: "P-101",
    doctorName: "Dr. Sameer Verma",
    specialization: "General Physician",
    clinic: "Apex Clinic",
    date: "2026-01-10",
    status: "PAST",
    diagnosis: "Viral Fever",
    medicines: [
      {
        name: "Paracetamol",
        dosage: "1-1-1",
        duration: "5 Days",
        instruction: "After Meal"
      }
    ],
    notes: "Take rest"
  }
];