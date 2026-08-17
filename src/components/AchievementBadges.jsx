import React, { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

/**
 * Achievement Badges Component
 * Displays unlocked badges with dates
 * Badges earned through user actions and milestones
 */
export function AchievementBadges() {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const badgeDefinitions = {
    weekStreak: {
      id: "weekStreak",
      name: "Week Streak",
      description: "Analyzed skin 7 days in a row",
      icon: "🔥",
      color: "bg-orange-50 border-orange-200",
      iconColor: "text-orange-600",
    },
    improvementMaster: {
      id: "improvementMaster",
      name: "Improvement Master",
      description: "One metric improved 50%+",
      icon: "📈",
      color: "bg-green-50 border-green-200",
      iconColor: "text-green-600",
    },
    consistency: {
      id: "consistency",
      name: "Consistency",
      description: "10+ analyses completed",
      icon: "✨",
      color: "bg-purple-50 border-purple-200",
      iconColor: "text-purple-600",
    },
    routineFollower: {
      id: "routineFollower",
      name: "Routine Follower",
      description: "Followed generated routine for 30 days",
      icon: "🎯",
      color: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-600",
    },
  };

  // Fetch user's badges
  const fetchBadges = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    try {
      const q = query(
        collection(db, "achievementBadges"),
        where("userId", "==", user.uid)
      );
      const snapshot = await getDocs(q);

      const userBadges = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        unlockedAt: doc.data().unlockedAt?.toDate?.() || new Date(),
      }));

      setBadges(userBadges);
    } catch (err) {
      console.error("Error fetching badges:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Unlock a badge
  const unlockBadge = useCallback(
    async (badgeId, metadata = {}) => {
      if (!user) return;

      try {
        // Check if badge is already unlocked
        const existing = badges.find((b) => b.badgeId === badgeId);
        if (existing) return;

        // Add badge to Firestore
        await addDoc(collection(db, "achievementBadges"), {
          userId: user.uid,
          badgeId,
          unlockedAt: Timestamp.now(),
          metadata,
        });

        // Refresh badges
        fetchBadges();
      } catch (err) {
        console.error("Error unlocking badge:", err);
      }
    },
    [user, badges, fetchBadges]
  );

  useEffect(() => {
    fetchBadges();
  }, [user, fetchBadges]);

  if (loading) {
    return <div className="text-gray-500 text-center py-4">Loading badges...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold mb-6 text-gray-800">Achievement Badges</h3>

      {badges.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Complete milestones to unlock achievement badges!
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {badges.map((badge) => {
            const definition = badgeDefinitions[badge.badgeId];
            if (!definition) return null;

            return (
              <div
                key={badge.id}
                className={`border-2 rounded-lg p-4 text-center transition hover:shadow-md ${definition.color}`}
              >
                <div className={`text-4xl mb-2 ${definition.iconColor}`}>
                  {definition.icon}
                </div>
                <h4 className="font-semibold text-sm text-gray-800">
                  {definition.name}
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  {definition.description}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(badge.unlockedAt).toLocaleDateString()}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Share Button */}
      {badges.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => {
              const badgeNames = badges
                .map((b) => badgeDefinitions[b.badgeId]?.name)
                .join(", ");
              const text = `I've earned amazing achievement badges on AinaAi: ${badgeNames}! 🏆`;
              if (navigator.share) {
                navigator.share({ title: "My AinaAi Badges", text });
              } else {
                // Fallback: copy to clipboard
                navigator.clipboard.writeText(text);
                alert("Badge text copied to clipboard!");
              }
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
          >
            Share My Badges
          </button>
        </div>
      )}
    </div>
  );
}

export const badgeDefinitions = Object.values({
  weekStreak: {
    id: "weekStreak",
    name: "Week Streak",
    description: "Analyzed skin 7 days in a row",
    icon: "🔥",
  },
  improvementMaster: {
    id: "improvementMaster",
    name: "Improvement Master",
    description: "One metric improved 50%+",
    icon: "📈",
  },
  consistency: {
    id: "consistency",
    name: "Consistency",
    description: "10+ analyses completed",
    icon: "✨",
  },
  routineFollower: {
    id: "routineFollower",
    name: "Routine Follower",
    description: "Followed generated routine for 30 days",
    icon: "🎯",
  },
});
