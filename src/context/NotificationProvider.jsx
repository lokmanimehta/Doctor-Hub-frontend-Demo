import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { NotificationContext } from "./NotificationContext";
import { AuthContext } from "./AuthContext";
import {
  getDoctorNotifications,
  getDoctorUnreadNotificationCount
} from "../services/doctorService";

const NOTIFICATION_PAGE_SIZE = 20;
const UNREAD_COUNT_REFRESH_MS = 30000;
const TOAST_HIDE_MS = 4000;

const EMPTY_TOAST = {
  visible: false,
  title: "",
  message: "",
  targetRoute: ""
};

export const NotificationProvider = ({ children }) => {
  const { currentUser, authLoading, isAuthenticated } = useContext(AuthContext);

  const [unreadCountState, setUnreadCountState] = useState(0);
  const [notificationsErrorState, setNotificationsErrorState] = useState("");
  const [toastState, setToastState] = useState(EMPTY_TOAST);

  const lastKnownUnreadCountRef = useRef(0);
  const lastToastNotificationIdRef = useRef(null);
  const isInitialLoadDoneRef = useRef(false);
  const toastTimerRef = useRef(null);

  const canUseDoctorNotifications =
    !authLoading &&
    isAuthenticated &&
    currentUser &&
    currentUser.role === "DOCTOR";

  const hideToast = useCallback(() => {
    setToastState(EMPTY_TOAST);
  }, []);

  const showToast = useCallback((latestNotification) => {
    if (!latestNotification?.id) return;

    setToastState({
      visible: true,
      title: latestNotification.title || "Doctor update",
      message: latestNotification.message || "You have a new notification.",
      targetRoute: latestNotification.targetRoute || "/doctor/notifications"
    });

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setToastState(EMPTY_TOAST);
    }, TOAST_HIDE_MS);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!canUseDoctorNotifications) {
      return 0;
    }

    try {
      const response = await getDoctorUnreadNotificationCount();
      const nextUnreadCount = Number(response?.unreadCount ?? 0);

      setUnreadCountState(nextUnreadCount);
      setNotificationsErrorState("");
      lastKnownUnreadCountRef.current = nextUnreadCount;

      return nextUnreadCount;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to refresh unread count right now.";

      setNotificationsErrorState(message);
      return 0;
    }
  }, [canUseDoctorNotifications]);

  const checkForNewNotifications = useCallback(
    async ({ silent = false } = {}) => {
      if (!canUseDoctorNotifications) {
        return { unreadCount: 0, latestNotification: null };
      }

      try {
        const unreadResponse = await getDoctorUnreadNotificationCount();
        const nextUnreadCount = Number(unreadResponse?.unreadCount ?? 0);
        const previousUnreadCount = lastKnownUnreadCountRef.current;

        setUnreadCountState(nextUnreadCount);
        setNotificationsErrorState("");

        const shouldInspectLatest =
          nextUnreadCount > 0 &&
          (!isInitialLoadDoneRef.current || nextUnreadCount > previousUnreadCount);

        if (!shouldInspectLatest) {
          lastKnownUnreadCountRef.current = nextUnreadCount;
          isInitialLoadDoneRef.current = true;
          return { unreadCount: nextUnreadCount, latestNotification: null };
        }

        const latestResponse = await getDoctorNotifications({
          page: 0,
          size: NOTIFICATION_PAGE_SIZE
        });

        const latestContent = Array.isArray(latestResponse?.content)
          ? latestResponse.content
          : [];

        const latestNotification = latestContent[0] || null;
        const latestNotificationId = latestNotification?.id ?? null;

        const shouldShowToast =
          !silent &&
          isInitialLoadDoneRef.current &&
          latestNotificationId &&
          latestNotificationId !== lastToastNotificationIdRef.current;

        if (latestNotificationId) {
          lastToastNotificationIdRef.current = latestNotificationId;
        }

        if (shouldShowToast && latestNotification) {
          showToast(latestNotification);
        }

        lastKnownUnreadCountRef.current = nextUnreadCount;
        isInitialLoadDoneRef.current = true;

        return {
          unreadCount: nextUnreadCount,
          latestNotification
        };
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Unable to check notifications right now.";

        setNotificationsErrorState(message);
        return { unreadCount: 0, latestNotification: null };
      }
    },
    [canUseDoctorNotifications, showToast]
  );

  const handleNotificationActionSuccess = useCallback(
    async ({ showToastOnNew = true } = {}) => {
      if (!canUseDoctorNotifications) return;
      await checkForNewNotifications({ silent: !showToastOnNew });
    },
    [canUseDoctorNotifications, checkForNewNotifications]
  );

  useEffect(() => {
    if (!canUseDoctorNotifications) {
      lastKnownUnreadCountRef.current = 0;
      lastToastNotificationIdRef.current = null;
      isInitialLoadDoneRef.current = false;

      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }

      return;
    }

    const timeoutId = setTimeout(() => {
      checkForNewNotifications({ silent: true }).catch(() => {});
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [canUseDoctorNotifications, checkForNewNotifications]);

  useEffect(() => {
    if (!canUseDoctorNotifications) return;

    const intervalId = setInterval(() => {
      checkForNewNotifications({ silent: false }).catch(() => {});
    }, UNREAD_COUNT_REFRESH_MS);

    return () => clearInterval(intervalId);
  }, [canUseDoctorNotifications, checkForNewNotifications]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      unreadCount: canUseDoctorNotifications ? unreadCountState : 0,
      notificationsError: canUseDoctorNotifications ? notificationsErrorState : "",
      fetchUnreadCount,
      checkForNewNotifications,
      handleNotificationActionSuccess,
      toast: canUseDoctorNotifications ? toastState : EMPTY_TOAST,
      hideToast
    }),
    [
      canUseDoctorNotifications,
      unreadCountState,
      notificationsErrorState,
      fetchUnreadCount,
      checkForNewNotifications,
      handleNotificationActionSuccess,
      toastState,
      hideToast
    ]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};