import React from "react";
import {
  Navigate,
  Route,
  Routes
} from "react-router-dom";

import DoctorLayout from "../components/layout/DoctorLayout";
import ProtectedRoute from "./ProtectedRoute";

import DoctorFeedback from "../pages/doctor/DoctorFeedback";
import DoctorDashboard from "../pages/doctor/DoctorDashboard";
import Appointments from "../pages/doctor/Appointments";
import Patients from "../pages/doctor/Patients";
import PatientDetails from "../pages/doctor/PatientDetails";
import AddPatient from "../pages/doctor/AddPatient";
import Availability from "../pages/doctor/Availability";
import DoctorProfile from "../pages/doctor/Profile";
import Notifications from "../pages/doctor/Notifications";
import Labs from "../pages/doctor/Labs";
import ProfileViews from "../pages/doctor/ProfileViews";

const DoctorRoutes = () => {
  return (
    <Routes>
      <Route
        path="/doctor"
        element={
          <ProtectedRoute
            allowedRoles={["DOCTOR"]}
          >
            <DoctorLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <Navigate
              to="dashboard"
              replace
            />
          }
        />

        <Route
          path="dashboard"
          element={<DoctorDashboard />}
        />

        <Route
          path="appointments"
          element={<Appointments />}
        />

        <Route
          path="patients"
          element={<Patients />}
        />

        <Route
          path="patients/:patientId"
          element={<PatientDetails />}
        />

        <Route
          path="add-patient"
          element={<AddPatient />}
        />

        <Route
          path="availability"
          element={<Availability />}
        />

        <Route
          path="profile"
          element={<DoctorProfile />}
        />

        <Route
          path="profile-views"
          element={<ProfileViews />}
        />

        <Route
          path="notifications"
          element={<Notifications />}
        />

        <Route
          path="labs"
          element={<Labs />}
        />

        <Route
          path="feedback"
          element={<DoctorFeedback />}
        />
      </Route>
    </Routes>
  );
};

export default DoctorRoutes;