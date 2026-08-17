const admin = require("firebase-admin");
const { logError, ERROR_CODES, SEVERITY } = require("./logger");
const { logAudit, AUDIT_ACTIONS, AUDIT_RESULT } = require("./auditLog");

/**
 * Privacy Manager for GDPR/CCPA Compliance
 * Handles user data export, deletion, and privacy management
 */

/**
 * Export all user data as JSON (GDPR Article 20 - Data Portability)
 * @param {string} userId - User ID requesting data export
 * @returns {Promise<Object>} All user data organized by collection
 */
async function exportUserData(userId) {
  const db = admin.firestore();
  const exportData = {
    exportDate: new Date().toISOString(),
    userId,
    collections: {},
  };

  try {
    // Collections to export
    const collectionsToExport = ["users", "analyses", "outfits"];

    for (const collectionName of collectionsToExport) {
      const snapshot = await db
        .collection(collectionName)
        .where("userId", "==", userId)
        .get();

      exportData.collections[collectionName] = snapshot.docs.map((doc) => ({
        documentId: doc.id,
        ...doc.data(),
        // Convert timestamps to ISO strings
        ...(doc.data().timestamp && {
          timestamp: doc.data().timestamp.toDate?.().toISOString() || doc.data().timestamp,
        }),
      }));
    }

    // Log audit trail
    await logAudit({
      userId,
      action: AUDIT_ACTIONS.DATA_EXPORT,
      result: AUDIT_RESULT.SUCCESS,
      metadata: {
        recordsExported: Object.values(exportData.collections).reduce(
          (sum, arr) => sum + arr.length,
          0
        ),
      },
    });

    console.log(`[Privacy] Data export completed for user ${userId}`);
    return exportData;
  } catch (error) {
    console.error("[Privacy] Error exporting user data:", error);

    await logError({
      userId,
      errorCode: ERROR_CODES.FIRESTORE_ERROR,
      message: "Failed to export user data",
      context: "exportUserData",
      severity: SEVERITY.HIGH,
      error,
    });

    throw error;
  }
}

/**
 * Delete all user data (GDPR Article 17 - Right to be Forgotten)
 * CAUTION: This is a destructive operation and cannot be undone
 * @param {string} userId - User ID requesting deletion
 * @param {string} adminUserId - Admin user ID authorizing deletion (for audit trail)
 * @returns {Promise<Object>} Deletion summary
 */
async function deleteAllUserData(userId, adminUserId = null) {
  const db = admin.firestore();
  const deletionSummary = {
    userId,
    deletionDate: new Date().toISOString(),
    collectionsDeleted: {},
    totalDocumentsDeleted: 0,
  };

  try {
    // Collections to delete
    const collectionsToDelete = ["analyses", "outfits", "users"];

    for (const collectionName of collectionsToDelete) {
      const snapshot = await db
        .collection(collectionName)
        .where("userId", "==", userId)
        .get();

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      deletionSummary.collectionsDeleted[collectionName] = snapshot.docs.length;
      deletionSummary.totalDocumentsDeleted += snapshot.docs.length;
    }

    // Delete user storage files
    try {
      const bucket = admin.storage().bucket();
      const files = await bucket.getFiles({ prefix: `user_photos/${userId}` });
      if (files[0] && files[0].length > 0) {
        await bucket.deleteFiles({ prefix: `user_photos/${userId}` });
        deletionSummary.filesDeleted = files[0].length;
      }
    } catch (storageError) {
      console.warn("[Privacy] Storage deletion error (non-critical):", storageError.message);
    }

    // Log audit trail with high severity
    await logAudit({
      userId,
      action: AUDIT_ACTIONS.DATA_DELETION,
      result: AUDIT_RESULT.SUCCESS,
      metadata: {
        totalDocumentsDeleted: deletionSummary.totalDocumentsDeleted,
        collectionsDeleted: deletionSummary.collectionsDeleted,
        authorizedBy: adminUserId || "user_request",
      },
    });

    // Delete auth account
    try {
      await admin.auth().deleteUser(userId);
      deletionSummary.authAccountDeleted = true;
    } catch (authError) {
      console.warn("[Privacy] Auth deletion error:", authError.message);
      deletionSummary.authAccountDeleted = false;
    }

    console.log(`[Privacy] Complete data deletion for user ${userId}:`, deletionSummary);
    return deletionSummary;
  } catch (error) {
    console.error("[Privacy] Error deleting user data:", error);

    await logError({
      userId,
      errorCode: ERROR_CODES.FIRESTORE_ERROR,
      message: "Failed to delete user data",
      context: "deleteAllUserData",
      severity: SEVERITY.HIGH,
      error,
      metadata: { partialDeletion: deletionSummary },
    });

    throw error;
  }
}

/**
 * Get user privacy settings
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Privacy settings
 */
async function getPrivacySettings(userId) {
  try {
    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return {
        userId,
        dataCollection: true,
        marketingEmails: true,
        analyticsTracking: true,
        thirdPartySharing: false,
      };
    }

    const userData = userDoc.data();
    return {
      userId,
      dataCollection: userData.dataCollection !== false,
      marketingEmails: userData.marketingEmails !== false,
      analyticsTracking: userData.analyticsTracking !== false,
      thirdPartySharing: userData.thirdPartySharing === true,
    };
  } catch (error) {
    console.error("[Privacy] Error fetching privacy settings:", error);
    throw error;
  }
}

/**
 * Update user privacy settings
 * @param {string} userId - User ID
 * @param {Object} settings - Privacy settings to update
 * @returns {Promise<Object>} Updated privacy settings
 */
async function updatePrivacySettings(userId, settings) {
  try {
    const db = admin.firestore();

    const updatedSettings = {
      dataCollection: settings.dataCollection !== false,
      marketingEmails: settings.marketingEmails !== false,
      analyticsTracking: settings.analyticsTracking !== false,
      thirdPartySharing: settings.thirdPartySharing === true,
      settingsUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("users").doc(userId).set(updatedSettings, { merge: true });

    await logAudit({
      userId,
      action: AUDIT_ACTIONS.PRIVACY_SETTINGS_UPDATED,
      result: AUDIT_RESULT.SUCCESS,
      metadata: { newSettings: updatedSettings },
    });

    console.log(`[Privacy] Settings updated for user ${userId}`);
    return updatedSettings;
  } catch (error) {
    console.error("[Privacy] Error updating privacy settings:", error);
    throw error;
  }
}

/**
 * Record consent to data processing (GDPR/CCPA)
 * @param {string} userId - User ID
 * @param {string} consentType - Type of consent (e.g., 'analytics', 'marketing', 'data_processing')
 * @param {boolean} granted - Whether consent was granted
 * @returns {Promise<Object>} Consent record
 */
async function recordConsent(userId, consentType, granted) {
  try {
    const db = admin.firestore();

    const consentRecord = {
      userId,
      consentType,
      granted,
      recordedAt: admin.firestore.FieldValue.serverTimestamp(),
      userAgent: "server", // Will be overridden by client
      ipAddress: "unknown", // Will be captured by client
    };

    const docRef = await db.collection("user_consents").add(consentRecord);

    await logAudit({
      userId,
      action: granted ? AUDIT_ACTIONS.CONSENT_GIVEN : AUDIT_ACTIONS.CONSENT_WITHDRAWN,
      result: AUDIT_RESULT.SUCCESS,
      metadata: { consentType },
    });

    console.log(`[Privacy] Consent recorded: ${userId} - ${consentType}: ${granted}`);
    return { id: docRef.id, ...consentRecord };
  } catch (error) {
    console.error("[Privacy] Error recording consent:", error);
    throw error;
  }
}

module.exports = {
  exportUserData,
  deleteAllUserData,
  getPrivacySettings,
  updatePrivacySettings,
  recordConsent,
};
