import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { NotificationProvider } from "./context/NotificationProvider";
import { AuthProvider } from "./context/AuthProvider";
import { ProfileProvider } from "./context/ProfileProvider";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <NotificationProvider>
        <ProfileProvider>
          <App />
        </ProfileProvider>
      </NotificationProvider>
    </BrowserRouter>
  </AuthProvider>
);