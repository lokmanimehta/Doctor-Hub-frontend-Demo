import { useState } from "react";
import { ProfileContext } from "./ProfileContext";

export const ProfileProvider = ({ children }) => {
  const [selectedProfile, setSelectedProfile] = useState(() => {
    const storedProfile = localStorage.getItem("selectedProfile");
    return storedProfile ? JSON.parse(storedProfile) : null;
  });

  const selectProfile = (profile) => {
    localStorage.setItem("selectedProfile", JSON.stringify(profile));
    setSelectedProfile(profile);
  };

  const clearProfile = () => {
    localStorage.removeItem("selectedProfile");
    setSelectedProfile(null);
  };

  return (
    <ProfileContext.Provider
      value={{
        selectedProfile,
        selectProfile,
        clearProfile
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};