import React, { useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "./AuthContext";
import { restoreUserSession } from "../services/authService";

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    if (hasBootstrapped.current) return;
    hasBootstrapped.current = true;

    const bootstrapAuth = async () => {
      try {
        const restoredUser = await restoreUserSession();
        setCurrentUser(restoredUser || null);
      } catch (error) {
        console.error("Auth restore failed:", error);
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const value = useMemo(() => {
    return {
      currentUser,
      setCurrentUser,
      authLoading,
      isAuthenticated: !!currentUser
    };
  }, [currentUser, authLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};