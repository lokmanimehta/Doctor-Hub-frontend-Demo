import React from "react";
import { Navigate, Route } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import PatientLayout from "../components/layout/PatientLayout";

import PatientProfile from "../pages/patient/PatientProfile";
import Dashboard from "../pages/patient/Dashboard";
import FindDoctors from "../pages/patient/FindDoctors";
import Hospitals from "../pages/patient/Hospitals";
import MyAppointments from "../pages/patient/MyAppointments";
import MyDoctors from "../pages/patient/MyDoctors";
import MedicalRecords from "../pages/patient/MedicalRecords";
import Prescriptions from "../pages/patient/Prescriptions";
import LabsPage from "../pages/patient/LabsPage";
import Labreports from "../pages/patient/Labreports";
import PatientNotifications from "../pages/patient/notifications";
import Feedback from "../pages/patient/Feedback";
import Help from "../pages/patient/Help";

const PatientRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["PATIENT"]} />}>
    <Route path="/patient" element={<PatientLayout />}>
      <Route
        index
        element={<Navigate to="dashboard" replace />}
      />

      <Route
        path="dashboard"
        element={<Dashboard />}
      />

      <Route
        path="profile"
        element={<PatientProfile />}
      />

      <Route
        path="find-doctors"
        element={<FindDoctors />}
      />

      <Route
        path="finddoctors"
        element={<FindDoctors />}
      />

      <Route
        path="hospitals"
        element={<Hospitals />}
      />

      <Route
        path="hospital"
        element={<Hospitals />}
      />

      <Route
        path="appointments"
        element={<MyAppointments />}
      />

      <Route
        path="mydoctors"
        element={<MyDoctors />}
      />

      <Route
        path="past-consultations"
        element={<MyDoctors />}
      />

      <Route
        path="medical-records"
        element={<MedicalRecords />}
      />

      <Route
        path="records"
        element={<MedicalRecords />}
      />

      <Route
        path="prescriptions"
        element={<Prescriptions />}
      />

      <Route
        path="labs"
        element={<LabsPage />}
      />

      <Route
        path="lab-reports"
        element={<Labreports />}
      />

      <Route
        path="notifications"
        element={<PatientNotifications />}
      />

      <Route
        path="feedback"
        element={<Feedback />}
      />

      <Route
        path="help"
        element={<Help />}
      />
    </Route>
  </Route>
);

export default PatientRoutes;