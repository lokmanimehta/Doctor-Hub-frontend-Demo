import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import AdminNotificationContext from "./AdminNotificationContext";
import { getAdminUnreadNotificationCount } from "../services/adminService";

const AdminNotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const response =
        await getAdminUnreadNotificationCount();

      const count = Number(
        response?.unreadCount ?? 0
      );

      setUnreadCount(
        Number.isFinite(count) && count >= 0
          ? count
          : 0
      );
    } catch (error) {
      console.error(
        "Unable to load admin notification count:",
        error
      );
    }
  }, []);

  useEffect(() => {
    /*
     * setTimeout use kiya hai taaki effect body ke andar
     * direct state update lint error na aaye.
     */
    const initialLoadTimer = window.setTimeout(() => {
      void refreshUnreadCount();
    }, 0);

    const intervalId = window.setInterval(() => {
      void refreshUnreadCount();
    }, 15000);

    const handleNotificationChanged = () => {
      void refreshUnreadCount();
    };

    window.addEventListener(
      "admin-notifications-changed",
      handleNotificationChanged
    );

    return () => {
      window.clearTimeout(initialLoadTimer);
      window.clearInterval(intervalId);

      window.removeEventListener(
        "admin-notifications-changed",
        handleNotificationChanged
      );
    };
  }, [refreshUnreadCount]);

  const contextValue = useMemo(
    () => ({
      unreadCount,
      refreshUnreadCount
    }),
    [unreadCount, refreshUnreadCount]
  );

  return (
    <AdminNotificationContext.Provider
      value={contextValue}
    >
      {children}
    </AdminNotificationContext.Provider>
  );
};

export default AdminNotificationProvider;