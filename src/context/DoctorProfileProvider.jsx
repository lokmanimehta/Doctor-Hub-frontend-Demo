import React, { useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { DoctorProfileContext } from "./DoctorProfileContext";
import { getDoctorProfile } from "../services/doctorService";

export const DoctorProfileProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);

  const [doctorProfile, setDoctorProfile] = useState(null);
  const [doctorProfileLoading, setDoctorProfileLoading] = useState(false);

  const clearDoctorProfile = useCallback(() => {
    setDoctorProfile(null);
  }, []);

  const refreshDoctorProfile = useCallback(async () => {
    if (!currentUser || currentUser.role !== "DOCTOR") {
      setDoctorProfile(null);
      return;
    }

    try {
      setDoctorProfileLoading(true);
      const profileData = await getDoctorProfile();
      setDoctorProfile(profileData);
    } catch (error) {
      console.error("Failed to fetch doctor profile", error);
      setDoctorProfile(null);
    } finally {
      setDoctorProfileLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    refreshDoctorProfile();
  }, [refreshDoctorProfile]);

  return (
    <DoctorProfileContext.Provider
      value={{
        doctorProfile,
        setDoctorProfile,
        doctorProfileLoading,
        refreshDoctorProfile,
        clearDoctorProfile
      }}
    >
      {children}
    </DoctorProfileContext.Provider>
  );
};