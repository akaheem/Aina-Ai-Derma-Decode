const admin = require("firebase-admin");
const { ERROR_CODES, SEVERITY, logError } = require("./logger");

/**
 * Rate limiting utility for AinaAi Cloud Functions
 * Enforces per-user quotas to prevent abuse and manage API costs
 */

// When running the Functions emulator without the Firestore emulator (Java not
// installed), skip Firestore-backed rate limiting so the local demo doesn't
// hang trying to reach production Firestore.
const SKIP_FIRESTORE = process.env.YOUCAM_SKIP_FIRESTORE === "true";

// Rate limit configuration
const RATE_LIMITS = {
  // Max analyses per user per day (24 hours)
  ANALYSES_PER_DAY: 10,
  // Max outfits tried on per user per day
  OUTFITS_PER_DAY: 20,
  // Time window in milliseconds (24 hours)
  TIME_WINDOW_MS: 24 * 60 * 60 * 1000,
};

/**
 * Check if user has exceeded rate limit for analyses
 * @param {string} userId - Firebase user ID
 * @returns {Promise<{allowed: boolean, remaining: number, resetTime: Date}>}
 */
async function checkAnalysisRateLimit(userId) {
  if (SKIP_FIRESTORE) {
    return { allowed: true, remaining: RATE_LIMITS.ANALYSES_PER_DAY, resetTime: null };
  }
  try {
    const db = admin.firestore();
    const userDocRef = db.collection("users").doc(userId);
    const userDoc = await userDocRef.get();

    const now = Date.now();
    const userData = userDoc.data() || {};
    const lastAnalysisTime = userData.lastAnalysisTime?.toMillis?.() || 0;
    const analysisCount = userData.analysisCount || 0;

    // Reset counter if 24 hours have passed
    if (now - lastAnalysisTime > RATE_LIMITS.TIME_WINDOW_MS) {
      await userDocRef.set(
        {
          analysisCount: 0,
          lastAnalysisTime: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        allowed: true,
        remaining: RATE_LIMITS.ANALYSES_PER_DAY,
        resetTime: new Date(now + RATE_LIMITS.TIME_WINDOW_MS),
      };
    }

    // Check if limit exceeded
    const isAllowed = analysisCount < RATE_LIMITS.ANALYSES_PER_DAY;
    const remaining = Math.max(0, RATE_LIMITS.ANALYSES_PER_DAY - analysisCount);
    const resetTime = new Date(lastAnalysisTime + RATE_LIMITS.TIME_WINDOW_MS);

    return {
      allowed: isAllowed,
      remaining,
      resetTime,
    };
  } catch (error) {
    console.error("[Rate Limiting] Error checking analysis limit:", error);
    // On error, allow the request but log it
    return {
      allowed: true,
      remaining: -1, // Indicates we couldn't determine limit
      resetTime: null,
    };
  }
}

/**
 * Check if user has exceeded rate limit for outfit try-ons
 * @param {string} userId - Firebase user ID
 * @returns {Promise<{allowed: boolean, remaining: number, resetTime: Date}>}
 */
async function checkOutfitRateLimit(userId) {
  try {
    const db = admin.firestore();
    const userDocRef = db.collection("users").doc(userId);
    const userDoc = await userDocRef.get();

    const now = Date.now();
    const userData = userDoc.data() || {};
    const lastOutfitTime = userData.lastOutfitTime?.toMillis?.() || 0;
    const outfitCount = userData.outfitCount || 0;

    // Reset counter if 24 hours have passed
    if (now - lastOutfitTime > RATE_LIMITS.TIME_WINDOW_MS) {
      await userDocRef.set(
        {
          outfitCount: 0,
          lastOutfitTime: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        allowed: true,
        remaining: RATE_LIMITS.OUTFITS_PER_DAY,
        resetTime: new Date(now + RATE_LIMITS.TIME_WINDOW_MS),
      };
    }

    // Check if limit exceeded
    const isAllowed = outfitCount < RATE_LIMITS.OUTFITS_PER_DAY;
    const remaining = Math.max(0, RATE_LIMITS.OUTFITS_PER_DAY - outfitCount);
    const resetTime = new Date(lastOutfitTime + RATE_LIMITS.TIME_WINDOW_MS);

    return {
      allowed: isAllowed,
      remaining,
      resetTime,
    };
  } catch (error) {
    console.error("[Rate Limiting] Error checking outfit limit:", error);
    // On error, allow the request but log it
    return {
      allowed: true,
      remaining: -1,
      resetTime: null,
    };
  }
}

/**
 * Increment analysis counter for user
 * @param {string} userId - Firebase user ID
 * @returns {Promise<void>}
 */
async function incrementAnalysisCount(userId) {
  if (SKIP_FIRESTORE) {
    return;
  }
  try {
    const db = admin.firestore();
    await db.collection("users").doc(userId).set(
      {
        analysisCount: admin.firestore.FieldValue.increment(1),
        lastAnalysisTime: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("[Rate Limiting] Error incrementing analysis count:", error);
  }
}

/**
 * Increment outfit counter for user
 * @param {string} userId - Firebase user ID
 * @returns {Promise<void>}
 */
async function incrementOutfitCount(userId) {
  try {
    const db = admin.firestore();
    await db.collection("users").doc(userId).set(
      {
        outfitCount: admin.firestore.FieldValue.increment(1),
        lastOutfitTime: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("[Rate Limiting] Error incrementing outfit count:", error);
  }
}

module.exports = {
  checkAnalysisRateLimit,
  checkOutfitRateLimit,
  incrementAnalysisCount,
  incrementOutfitCount,
  RATE_LIMITS,
};
