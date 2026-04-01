
// src/data/prescriptionsData.js

export const prescriptionsDummyData = [
  {
    id: 1,
    doctor: {
      name: "Dr. Aisha Khan",
      specialization: "Cardiologist",
      clinic: "City Heart Hospital",
      image: "https://i.pravatar.cc/150?u=aisha"
    },
    patient: {
      name: "Rahul Sharma",
      age: 32,
      gender: "Male"
    },
    appointment: {
      date: "2026-02-24",
      time: "10:00 AM",
      status: "ACTIVE"
    },
    diagnosis: "Hypertension",
    medicines: [
      {
        name: "Telmisartan 40mg",
        dosage: "1-0-0",
        duration: "30 Days",
        instruction: "Before Breakfast"
      },
      {
        name: "Amlodipine 5mg",
        dosage: "0-0-1",
        duration: "30 Days",
        instruction: "After Dinner"
      }
    ],
    notes: "Reduce salt intake. Daily walking recommended.",
    createdAt: "2026-02-24T10:00:00Z"
  }
];