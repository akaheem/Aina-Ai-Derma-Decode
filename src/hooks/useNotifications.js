import React, { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

/**
 * Notification System Hook
 * Manages reminders, tips, education, and routine notifications
 * Users can opt-in/out of different notification types and frequencies
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({
    frequency: "weekly", // "daily", "weekly", "none"
    types: {
      reminders: true,
      tips: true,
      education: true,
      routine: true,
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Fetch user's notification settings
  const fetchSettings = useCallback(async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, "notificationSettings"),
        where("userId", "==", user.uid)
      );
      const snapshot = await getDocs(q);

      if (snapshot.docs.length > 0) {
        setSettings(snapshot.docs[0].data().settings);
      }
    } catch (err) {
      console.error("Error fetching notification settings:", err);
    }
  }, [user]);

  // Fetch unread notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);

      const notifs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));

      setNotifications(notifs);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Save notification settings
  const updateSettings = useCallback(
    async (newSettings) => {
      if (!user) return;

      try {
        const q = query(
          collection(db, "notificationSettings"),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(q);

        if (snapshot.docs.length > 0) {
          await updateDoc(doc(db, "notificationSettings", snapshot.docs[0].id), {
            settings: newSettings,
            updatedAt: Timestamp.now(),
          });
        } else {
          await addDoc(collection(db, "notificationSettings"), {
            userId: user.uid,
            settings: newSettings,
            createdAt: Timestamp.now(),
          });
        }

        setSettings(newSettings);
      } catch (err) {
        console.error("Error updating notification settings:", err);
        setError(err.message || "Failed to update settings");
      }
    },
    [user]
  );

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId) => {
      try {
        await updateDoc(doc(db, "notifications", notificationId), {
          read: true,
          readAt: Timestamp.now(),
        });

        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    },
    []
  );

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId) => {
      try {
        await updateDoc(doc(db, "notifications", notificationId), {
          deleted: true,
          deletedAt: Timestamp.now(),
        });

        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      } catch (err) {
        console.error("Error deleting notification:", err);
      }
    },
    []
  );

  useEffect(() => {
    fetchSettings();
    fetchNotifications();
  }, [user, fetchSettings, fetchNotifications]);

  return {
    notifications,
    settings,
    loading,
    error,
    fetchNotifications,
    updateSettings,
    markAsRead,
    deleteNotification,
  };
}

/**
 * Generate notifications based on user activity
 * Called by backend Cloud Functions or triggered client-side
 */
export const notificationTemplates = {
  weeklyReminder: {
    title: "Time for a skin check!",
    body: "It's been 7 days. Let's see how your skin is doing.",
    icon: "🔍",
    type: "reminders",
  },
  educationTip: {
    title: "Did you know?",
    body: "Retinol takes 12 weeks to show results. Keep going!",
    icon: "💡",
    type: "education",
  },
  weeklyTip: {
    title: "Weekly skincare tip",
    body: "Always patch test new products first to avoid irritation.",
    icon: "✨",
    type: "tips",
  },
  routineReminder: {
    title: "Morning routine time!",
    body: "2 min investment for healthy skin. Let's do this!",
    icon: "🌅",
    type: "routine",
  },
  consistencyMilestone: {
    title: "You're crushing it!",
    body: "10+ analyses completed. Consistency is the key to results.",
    icon: "💪",
    type: "reminders",
  },
};
