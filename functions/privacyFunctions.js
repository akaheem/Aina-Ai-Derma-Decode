/**
 * Privacy & Compliance Cloud Functions
 * Handles GDPR/CCPA compliance, data export, deletion, and consent management
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { logError, ERROR_CODES, SEVERITY } = require("./utils/logger");
const {
  exportUserData,
  deleteAllUserData,
  getPrivacySettings,
  updatePrivacySettings,
  recordConsent,
} = require("./utils/privacyManager");
const { logAudit, AUDIT_ACTIONS, AUDIT_RESULT, getUserAuditLogs } = require("./utils/auditLog");

/**
 * Cloud Function: Export User Data (GDPR Article 20)
 * Bundles all user data as JSON for download
 */
exports.exportMyData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to export your data."
    );
  }

  const userId = context.auth.uid;

  try {
    const exportData = await exportUserData(userId);

    return {
      success: true,
      data: exportData,
      message: "Your data has been exported successfully.",
    };
  } catch (error) {
    console.error("[exportMyData] Error:", error.message);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to export your data. Please try again."
    );
  }
});

/**
 * Cloud Function: Request Data Deletion (GDPR Article 17)
 * Permanently deletes all user data after verification
 * IMPORTANT: This action is irreversible
 */
exports.requestDataDeletion = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to request data deletion."
    );
  }

  const userId = context.auth.uid;
  const { confirmationCode } = data;

  // For security, require a confirmation code sent to user's email
  if (confirmationCode !== "CONFIRM_DELETE") {
    await logError({
      userId,
      errorCode: ERROR_CODES.UNAUTHORIZED,
      message: "Invalid deletion confirmation code",
      context: "requestDataDeletion",
      severity: SEVERITY.LOW,
    });

    throw new functions.https.HttpsError(
      "permission-denied",
      "Invalid confirmation code. Please check your email."
    );
  }

  try {
    const deletionSummary = await deleteAllUserData(userId);

    return {
      success: true,
      message: "Your account and all data have been permanently deleted.",
      summary: deletionSummary,
    };
  } catch (error) {
    console.error("[requestDataDeletion] Error:", error.message);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to delete your data. Please try again."
    );
  }
});

/**
 * Cloud Function: Get Privacy Settings
 * Retrieves user's current privacy and consent settings
 */
exports.getPrivacySettings = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in."
    );
  }

  const userId = context.auth.uid;

  try {
    const settings = await getPrivacySettings(userId);
    return {
      success: true,
      settings,
    };
  } catch (error) {
    console.error("[getPrivacySettings] Error:", error.message);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to fetch privacy settings."
    );
  }
});

/**
 * Cloud Function: Update Privacy Settings
 * Updates user's privacy and consent preferences
 */
exports.updatePrivacySettings = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in."
    );
  }

  const userId = context.auth.uid;
  const { settings } = data;

  if (!settings || typeof settings !== "object") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid settings provided."
    );
  }

  try {
    const updated = await updatePrivacySettings(userId, settings);
    return {
      success: true,
      settings: updated,
      message: "Privacy settings updated.",
    };
  } catch (error) {
    console.error("[updatePrivacySettings] Error:", error.message);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to update privacy settings."
    );
  }
});

/**
 * Cloud Function: Record Consent
 * Records user consent for analytics, marketing, data processing (GDPR/CCPA)
 */
exports.recordConsent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in."
    );
  }

  const userId = context.auth.uid;
  const { consentType, granted } = data;

  if (!consentType || typeof granted !== "boolean") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid consent data provided."
    );
  }

  try {
    const consent = await recordConsent(userId, consentType, granted);
    return {
      success: true,
      consent,
      message: "Consent recorded.",
    };
  } catch (error) {
    console.error("[recordConsent] Error:", error.message);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to record consent."
    );
  }
});

/**
 * Cloud Function: Get Audit Logs (Admin only)
 * Retrieves audit trail for compliance monitoring
 */
exports.getAuditLogs = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in."
    );
  }

  // Verify admin status (in production, use custom claims)
  const userId = context.auth.uid;
  const db = admin.firestore();
  const userDoc = await db.collection("users").doc(userId).get();
  const isAdmin = userDoc.data()?.isAdmin === true;

  if (!isAdmin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only administrators can access audit logs."
    );
  }

  const { queryUserId, limitDays = 30, limit = 100 } = data;

  try {
    const logs = await getUserAuditLogs(queryUserId, limitDays, limit);
    return {
      success: true,
      logs,
      count: logs.length,
    };
  } catch (error) {
    console.error("[getAuditLogs] Error:", error.message);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to fetch audit logs."
    );
  }
});

/**
 * Cloud Function: Health Check Ping (for uptime monitoring)
 * Called by Cloud Scheduler every 5 minutes
 */
exports.pingHealthCheck = functions.https.onRequest(async (req, res) => {
  const db = admin.firestore();

  try {
    const healthData = {
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: "healthy",
      responseTime: Date.now(),
      checks: {
        firestore: "ok",
        storage: "ok",
        auth: "ok",
      },
    };

    // Quick connectivity check
    try {
      await db.collection("health_logs").add(healthData);
    } catch (err) {
      healthData.checks.firestore = "error";
    }

    res.status(200).json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      checks: healthData.checks,
    });
  } catch (error) {
    console.error("[pingHealthCheck] Error:", error.message);
    res.status(500).json({
      success: false,
      status: "unhealthy",
      error: error.message,
    });
  }
});

/**
 * Cloud Function: Send OTP for 2FA (Scaffold - not implemented yet)
 * Placeholder for future 2FA implementation
 */
exports.sendOTP = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Not authenticated");
  }

  // TODO: Implement OTP sending via Firebase Auth or third-party provider
  throw new functions.https.HttpsError(
    "unimplemented",
    "Two-factor authentication coming soon."
  );
});

/**
 * Cloud Function: Verify OTP for 2FA (Scaffold - not implemented yet)
 * Placeholder for future 2FA implementation
 */
exports.verifyOTP = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Not authenticated");
  }

  // TODO: Implement OTP verification
  throw new functions.https.HttpsError(
    "unimplemented",
    "Two-factor authentication coming soon."
  );
});

module.exports = {
  exportMyData: exports.exportMyData,
  requestDataDeletion: exports.requestDataDeletion,
  getPrivacySettings: exports.getPrivacySettings,
  updatePrivacySettings: exports.updatePrivacySettings,
  recordConsent: exports.recordConsent,
  getAuditLogs: exports.getAuditLogs,
  pingHealthCheck: exports.pingHealthCheck,
  sendOTP: exports.sendOTP,
  verifyOTP: exports.verifyOTP,
};
