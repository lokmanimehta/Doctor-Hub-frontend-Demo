// import React from "react";
// import { Routes, Route } from "react-router-dom";

// /* PUBLIC PAGES */
// import Home from "./pages/public/Home";
// import LoginPage from "./pages/auth/LoginPage";
// import SignupPage from "./pages/auth/SignupPage";
// import AboutUs from "./pages/public/About";    // New
// import ContactUs from "./pages/public/Contact"; // New
// import Blogs from "./pages/public/blogs";       // New

// /* ADMIN PAGES */
// import AdminDashboard from "./pages/admin/AdminDashboard";
// import DoctorsManagement from "./pages/admin/DoctorsManagement";
// import Doctors from "./pages/admin/Doctors";
// import DoctorDetails from "./pages/admin/DoctorDetails";
// import Users from "./pages/admin/Users";
// import Hospitals from "./pages/admin/Hospitals";
// import Labs from "./pages/admin/Labs";
// import AdminAppointments from "./pages/admin/Appointments";
// import SystemLogs from "./pages/admin/SystemLogs";
// import PendingVerifications from "./pages/admin/PendingVerifications";
// import AdminProfile from "./pages/admin/AdminProfile";

// /* DOCTOR PAGES */
// import DoctorDashboard from "./pages/doctor/DoctorDashboard";
// import Appointments from "./pages/doctor/Appointments";
// import DoctorAppointmentView from "./pages/doctor/DoctorAppointmentView";
// import Patients from "./pages/doctor/Patients";
// import PatientDetails from "./pages/doctor/PatientDetails";
// import DoctorNotifications from "./pages/doctor/Notifications";
// import Availability from "./pages/doctor/Availability";
// import Profile from "./pages/doctor/Profile";

// /* PATIENT PAGES */
// import PatientDashboard from "./pages/patient/Dashboard";

// /* LAYOUTS */
// import AdminLayout from "./components/layout/AdminLayout";
// import DoctorLayout from "./components/layout/DoctorLayout";
// import PatientLayout from "./components/layout/PatientLayout";

// /* ROUTES PROTECTION */
// import ProtectedRoute from "./routes/ProtectedRoute";

// function App() {
//   return (
//     <Routes>
//       {/* --- PUBLIC ROUTES --- */}
//       <Route path="/" element={<Home />} />
//       <Route path="/login" element={<LoginPage />} />
//       <Route path="/signup" element={<SignupPage />} />
      
//       {/* New Informational Routes */}
//       <Route path="/about" element={<AboutUs />} />
//       <Route path="/contact" element={<ContactUs />} />
//       <Route path="/blogs" element={<Blogs />} />

//       {/* --- ADMIN ROUTES --- */}
//       <Route
//         path="/admin/*"
//         element={
//           <ProtectedRoute role="ADMIN">
//             <AdminLayout />
//           </ProtectedRoute>
//         }
//       >
//         <Route path="dashboard" element={<AdminDashboard />} />
//         <Route path="doctors-management" element={<DoctorsManagement />} />
//         <Route path="doctors" element={<Doctors />} />
//         <Route path="doctors/:id" element={<DoctorDetails />} />
//         <Route path="verify-doctors" element={<PendingVerifications />} />
//         <Route path="users" element={<Users />} />
//         <Route path="hospitals" element={<Hospitals />} />
//         <Route path="labs" element={<Labs />} />
//         <Route path="appointments" element={<AdminAppointments />} />
//         <Route path="profile" element={<AdminProfile />} />
//         <Route path="system-logs" element={<SystemLogs />} />
//       </Route>

//       {/* --- DOCTOR ROUTES --- */}
//       <Route
//         path="/doctor/*"
//         element={
//           <ProtectedRoute role="DOCTOR">
//             <DoctorLayout />
//           </ProtectedRoute>
//         }
//       >
//         <Route path="dashboard" element={<DoctorDashboard />} />
//         <Route path="appointments" element={<Appointments />} />
//         <Route path="appointments/:id" element={<DoctorAppointmentView />} />
//         <Route path="patients" element={<Patients />} />
//         <Route path="patients/:patientId" element={<PatientDetails />} />
//         <Route path="notifications" element={<DoctorNotifications />} />
//         <Route path="availability" element={<Availability />} />
//         <Route path="profile" element={<Profile />} />
//       </Route>

//       {/* --- PATIENT ROUTES --- */}
//       <Route
//         path="/patient/*"
//         element={
//           <ProtectedRoute role="PATIENT">
//             <PatientLayout />
//           </ProtectedRoute>
//         }
//       >
//         <Route path="dashboard" element={<PatientDashboard />} />
//       </Route>

//       {/* --- FALLBACK --- */}
//       {/* Redirects any unknown URL back to Home */}
//       <Route path="*" element={<Home />} />
//     </Routes>
//   );
// }

// export default App;





import React from "react";
import { Routes, Route } from "react-router-dom";

/* PUBLIC PAGES */
import Home from "./pages/public/Home";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import AboutUs from "./pages/public/About";
import ContactUs from "./pages/public/Contact";
import Blogs from "./pages/public/blogs";
import AllServicesPage from "./pages/public/AllServicesPage";
import "./styles/global.css";
import CareCoordinator from "./pages/public/CareCoordinator";
import Insurance from "./pages/public/Insurance";
/* ADMIN PAGES */
import AdminDashboard from "./pages/admin/AdminDashboard";
import DoctorsManagement from "./pages/admin/DoctorsManagement";
import Doctors from "./pages/admin/Doctors";
import Labs from "./pages/admin/Labs";
import AdminAppointments from "./pages/admin/Appointments";
import SystemLogs from "./pages/admin/SystemLogs";
import PendingVerifications from "./pages/admin/PendingVerifications";
import AdminProfile from "./pages/admin/AdminProfile";

/* DOCTOR PAGES */
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import Appointments from "./pages/doctor/Appointments";
import DoctorAppointmentView from "./pages/doctor/DoctorAppointmentView";
import Patients from "./pages/doctor/Patients";
import PatientDetails from "./pages/doctor/PatientDetails";
import AddPatient from "./pages/doctor/AddPatient"; // ✅ New Import Added
import DoctorNotifications from "./pages/doctor/Notifications";
import Availability from "./pages/doctor/Availability";
import Profile from "./pages/doctor/Profile";

/* PATIENT PAGES */
import PatientDashboard from "./pages/patient/Dashboard";
import PatientProfile from "./pages/patient/PatientProfile"; // ✅ Add this import


/* LAYOUTS */
import AdminLayout from "./components/layout/AdminLayout";
import DoctorLayout from "./components/layout/DoctorLayout";
import PatientLayout from "./components/layout/PatientLayout";
import PatientAppointments from "./pages/patient/MyAppointments";
import Prescriptions from "./pages/patient/Prescriptions";
import Labreports from "./pages/patient/Labreports";
import Notifications from "./pages/patient/notifications";
import Feedback from "./pages/patient/Feedback";
import Help from "./pages/patient/Help";
import MedicalRecords from "./pages/patient/MedicalRecords";
import FindDoctors from "./pages/patient/FindDoctors";
import MyDoctors from "./pages/patient/MyDoctors";
import Doctorprofile from "./pages/patient/Doctorprofile";
import PendingDoctorModal from "./pages/admin/PendingDoctorModal";
import UserManagement from "./pages/admin/UserManagement";
import HospitalsModule from "./pages/admin/HospitalsModule";
import LabsModule from "./pages/doctor/Labs";
import FeedbackPage from "./pages/admin/FeedbackPage";
import AdsManagement from "./pages/admin/AdsManagement";
import Hospitals from "./pages/patient/Hospitals";
import LabsPage from "./pages/patient/LabsPage";


function App() {
  return (
    <Routes>
      {/* --- PUBLIC ROUTES --- */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/contact" element={<ContactUs />} />
      <Route path="/blogs" element={<Blogs />} />
      <Route path="/all-services" element={<AllServicesPage />} />
      <Route path="/care-coordinator" element={<CareCoordinator />} />
<Route path="/insurance" element={<Insurance />} />

      {/* --- ADMIN ROUTES --- */}
      <Route path="/admin/*" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="doctors-management" element={<DoctorsManagement />} />
        <Route path="doctors" element={<Doctors />} />
        <Route path="doctors/:id" element={<PendingDoctorModal />} />
        <Route path="verify-doctors" element={<PendingVerifications />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="hospitals" element={<HospitalsModule />} />
        <Route path="labs" element={<Labs />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="system-logs" element={<SystemLogs />} />
        <Route path="ads-management" element={<AdsManagement />} />
        <Route path="feedback" element={<FeedbackPage />} />
        
      </Route>

      {/* --- DOCTOR ROUTES --- */}
      <Route path="/doctor/*" element={<DoctorLayout />}>
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="appointments/:id" element={<DoctorAppointmentView />} />
        <Route path="patients" element={<Patients />} />
        <Route path="patients/:patientId" element={<PatientDetails />} />
        <Route path="add-patient" element={<AddPatient />} /> {/* ✅ New Route Added */}
        <Route path="notifications" element={<DoctorNotifications />} />
        <Route path="availability" element={<Availability />} />
        <Route path="profile" element={<Profile />} />
        <Route path="Labs" element={<LabsModule />} />
      </Route>

      {/* --- PATIENT ROUTES --- */}
     
/* --- PATIENT ROUTES --- */
<Route path="/patient/*" element={<PatientLayout />}>
  {/* Index route: Taaki sirf /patient likhne par bhi dashboard khule */}
  <Route index element={<PatientDashboard />} /> 
  <Route path="dashboard" element={<PatientDashboard />} />
  <Route path="profile" element={<PatientProfile />} />
  <Route path="appointments" element={<PatientAppointments />} />
  
  {/* Baaki saare routes jo sidebar mein hain unka path yahan define karna zaroori hai */}
    <Route path="finddoctors" element={<FindDoctors/>} />

  <Route path="mydoctors" element={<MyDoctors/>} />
   <Route path="hospitals" element={<Hospitals/>} />
<Route path="doctorsprofile/:id" element={<Doctorprofile />} />
<Route path="labs" element={<LabsPage />} />
  <Route path="records" element={<MedicalRecords/>} />
  <Route path="prescriptions" element={<Prescriptions/>} />
  <Route path="lab-reports" element={<Labreports/>} />
  <Route path="notifications" element={<Notifications/>} />
  <Route path="feedback" element={<Feedback/>} />
  <Route path="help" element={<Help/>} />
</Route>

      {/* --- FALLBACK --- */}
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

export default App;