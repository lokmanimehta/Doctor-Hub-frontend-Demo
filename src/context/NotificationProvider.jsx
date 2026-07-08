import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { NotificationContext } from "./NotificationContext";
import { AuthContext } from "./AuthContext";

import {
  getDoctorNotifications,
  getDoctorUnreadNotificationCount
} from "../services/doctorService";

import {
  getPatientNotifications,
  getPatientUnreadNotificationCount,
  markAllPatientNotificationsAsRead
} from "../services/patientService";

const NOTIFICATION_PAGE_SIZE = 20;
const UNREAD_COUNT_REFRESH_MS = 10000;
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

  // IMPORTANT: manually cleared count should not come back immediately from polling
  const forceClearedUnreadRef = useRef(false);

  const currentRole = currentUser?.role || "";

  const canUseNotifications =
    !authLoading &&
    isAuthenticated &&
    Boolean(currentUser) &&
    (currentRole === "DOCTOR" || currentRole === "PATIENT");

  const notificationHomeRoute =
    currentRole === "DOCTOR"
      ? "/doctor/notifications"
      : "/patient/notifications";

  const resetNotificationState = useCallback(() => {
    setUnreadCountState(0);
    setNotificationsErrorState("");
    setToastState(EMPTY_TOAST);

    lastKnownUnreadCountRef.current = 0;
    lastToastNotificationIdRef.current = null;
    isInitialLoadDoneRef.current = false;
    forceClearedUnreadRef.current = false;

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, []);

  const clearUnreadCountLocally = useCallback(() => {
    forceClearedUnreadRef.current = true;
    setUnreadCountState(0);
    lastKnownUnreadCountRef.current = 0;
  }, []);

  const markAllPatientNotificationsReadAndClear = useCallback(async () => {
    forceClearedUnreadRef.current = true;
    setUnreadCountState(0);
    lastKnownUnreadCountRef.current = 0;

    if (currentRole !== "PATIENT") {
      return;
    }

    try {
      await markAllPatientNotificationsAsRead();
      setUnreadCountState(0);
      lastKnownUnreadCountRef.current = 0;
    } catch (error) {
      console.error("Unable to mark patient notifications as read:", error);
    }
  }, [currentRole]);

  const fetchUnreadApi = useCallback(async () => {
    if (currentRole === "DOCTOR") {
      return getDoctorUnreadNotificationCount();
    }

    if (currentRole === "PATIENT") {
      return getPatientUnreadNotificationCount();
    }

    return { unreadCount: 0 };
  }, [currentRole]);

  const fetchLatestApi = useCallback(
    async (params = {}) => {
      if (currentRole === "DOCTOR") {
        return getDoctorNotifications(params);
      }

      if (currentRole === "PATIENT") {
        return getPatientNotifications(params);
      }

      return { content: [] };
    },
    [currentRole]
  );

  const hideToast = useCallback(() => {
    setToastState(EMPTY_TOAST);
  }, []);

  const showToast = useCallback(
    (latestNotification) => {
      if (!latestNotification?.id) return;

      setToastState({
        visible: true,
        title:
          latestNotification.title ||
          (currentRole === "DOCTOR" ? "Doctor update" : "Patient update"),
        message: latestNotification.message || "You have a new notification.",
        targetRoute: latestNotification.targetRoute || notificationHomeRoute
      });

      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = setTimeout(() => {
        setToastState(EMPTY_TOAST);
      }, TOAST_HIDE_MS);
    },
    [currentRole, notificationHomeRoute]
  );

  const fetchUnreadCount = useCallback(async () => {
    if (!canUseNotifications) {
      return 0;
    }

    try {
      const response = await fetchUnreadApi();
      const nextUnreadCount = Number(response?.unreadCount ?? 0);

      if (forceClearedUnreadRef.current && currentRole === "PATIENT") {
        setUnreadCountState(0);
        lastKnownUnreadCountRef.current = 0;
        return 0;
      }

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
  }, [canUseNotifications, currentRole, fetchUnreadApi]);

  const checkForNewNotifications = useCallback(
    async ({ silent = false } = {}) => {
      if (!canUseNotifications) {
        return {
          unreadCount: 0,
          latestNotification: null
        };
      }

      try {
        const unreadResponse = await fetchUnreadApi();
        let nextUnreadCount = Number(unreadResponse?.unreadCount ?? 0);

        if (forceClearedUnreadRef.current && currentRole === "PATIENT") {
          nextUnreadCount = 0;
        }

        const previousUnreadCount = lastKnownUnreadCountRef.current;

        setUnreadCountState(nextUnreadCount);
        setNotificationsErrorState("");

        const shouldInspectLatest =
          nextUnreadCount > 0 &&
          (!isInitialLoadDoneRef.current ||
            nextUnreadCount > previousUnreadCount);

        if (!shouldInspectLatest) {
          lastKnownUnreadCountRef.current = nextUnreadCount;
          isInitialLoadDoneRef.current = true;

          return {
            unreadCount: nextUnreadCount,
            latestNotification: null
          };
        }

        const latestResponse = await fetchLatestApi({
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

        return {
          unreadCount: 0,
          latestNotification: null
        };
      }
    },
    [
      canUseNotifications,
      currentRole,
      fetchLatestApi,
      fetchUnreadApi,
      showToast
    ]
  );

  const decrementUnreadCountLocally = useCallback(() => {
    setUnreadCountState((previousCount) => {
      const nextCount = Math.max(
        0,
        Number(previousCount || 0) - 1
      );

      lastKnownUnreadCountRef.current = nextCount;

      return nextCount;
    });
  }, []);

  const handleNotificationActionSuccess = useCallback(
    async ({ showToastOnNew = true } = {}) => {
      if (!canUseNotifications) {
        resetNotificationState();
        return;
      }

      await checkForNewNotifications({
        silent: !showToastOnNew
      });
    },
    [canUseNotifications, checkForNewNotifications, resetNotificationState]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!canUseNotifications) {
        resetNotificationState();
        return;
      }

      checkForNewNotifications({ silent: true }).catch(() => { });
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [
    canUseNotifications,
    currentRole,
    checkForNewNotifications,
    resetNotificationState
  ]);

  useEffect(() => {
    if (!canUseNotifications) return undefined;

    const intervalId = setInterval(() => {
      checkForNewNotifications({ silent: false }).catch(() => { });
    }, UNREAD_COUNT_REFRESH_MS);

    return () => clearInterval(intervalId);
  }, [canUseNotifications, checkForNewNotifications]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      unreadCount: canUseNotifications ? unreadCountState : 0,
      notificationsError: canUseNotifications ? notificationsErrorState : "",
      fetchUnreadCount,
      checkForNewNotifications,
      handleNotificationActionSuccess,
      decrementUnreadCountLocally,
      clearUnreadCountLocally,
      markAllPatientNotificationsReadAndClear,
      toast: canUseNotifications ? toastState : EMPTY_TOAST,
      hideToast,
      notificationHomeRoute
    }),
    [
      canUseNotifications,
      unreadCountState,
      notificationsErrorState,
      fetchUnreadCount,
      checkForNewNotifications,
      handleNotificationActionSuccess,
      decrementUnreadCountLocally,
      clearUnreadCountLocally,
      markAllPatientNotificationsReadAndClear,
      toastState,
      hideToast,
      notificationHomeRoute
    ]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};