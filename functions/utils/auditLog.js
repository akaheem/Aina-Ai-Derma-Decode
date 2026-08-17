const admin = require("firebase-admin");
const { SEVERITY } = require("./logger");

/**
 * Audit Logging Utility for AinaAi
 * Tracks all sensitive user actions for compliance and security monitoring
 * GDPR-compliant audit trail with automatic retention policy
 */

// Audit log actions
const AUDIT_ACTIONS = {
  // Authentication
  USER_LOGIN: "USER_LOGIN",
  USER_LOGOUT: "USER_LOGOUT",
  USER_SIGNUP: "USER_SIGNUP",
  PASSWORD_CHANGE: "PASSWORD_CHANGE",
  PASSWORD_RESET: "PASSWORD_RESET",

  // Data operations
  SKIN_ANALYSIS: "SKIN_ANALYSIS",
  OUTFIT_TRYON: "OUTFIT_TRYON",
  DATA_EXPORT: "DATA_EXPORT",
  DATA_DELETION: "DATA_DELETION",

  // Privacy/Account
  PRIVACY_SETTINGS_UPDATED: "PRIVACY_SETTINGS_UPDATED",
  CONSENT_GIVEN: "CONSENT_GIVEN",
  CONSENT_WITHDRAWN: "CONSENT_WITHDRAWN",

  // Admin actions
  ADMIN_USER_LOOKUP: "ADMIN_USER_LOOKUP",
  ADMIN_DELETE_USER: "ADMIN_DELETE_USER",
};

// Audit result statuses
const AUDIT_RESULT = {
  SUCCESS: "SUCCESS",
  FAILURE: "FAILURE",
  PARTIAL: "PARTIAL",
};

// Retention period in milliseconds (90 days)
const AUDIT_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Log an audit event
 * @param {Object} auditInfo - Audit information
 * @param {string} auditInfo.userId - User ID performing action
 * @param {string} auditInfo.action - Action being performed (from AUDIT_ACTIONS)
 * @param {string} auditInfo.result - Result of action (SUCCESS/FAILURE/PARTIAL)
 * @param {Object} auditInfo.metadata - Additional context (dataSize, itemIds, etc.)
 * @param {string} auditInfo.ipAddress - User's IP address (if available)
 * @param {string} auditInfo.userAgent - User agent string
 * @returns {Promise<string>} Document ID of audit log entry
 */
async function logAudit(auditInfo) {
  try {
    const {
      userId,
      action,
      result = AUDIT_RESULT.SUCCESS,
      metadata = {},
      ipAddress = "unknown",
      userAgent = "unknown",
    } = auditInfo;

    // Validate required fields
    if (!userId || !action) {
      console.error("[Audit] Missing required fields:", { userId, action });
      return null;
    }

    const db = admin.firestore();
    const auditEntry = {
      userId,
      action,
      result,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata,
      ipAddress,
      userAgent,
      // TTL field for auto-deletion (Firebase will handle via TTL policy)
      expireAt: new Date(Date.now() + AUDIT_RETENTION_MS),
    };

    const docRef = await db.collection("audit_logs").add(auditEntry);

    console.log(`[AUDIT] ${action} by ${userId}: ${result}`, metadata);

    return docRef.id;
  } catch (error) {
    console.error("[Audit] Failed to log audit event:", error.message);
    // Don't throw - auditing should not break main flow
    return null;
  }
}

/**
 * Get audit logs for a specific user (admin query)
 * @param {string} userId - User ID to query
 * @param {number} limitDays - Number of days to look back (default 30)
 * @param {number} limit - Max documents to return (default 100)
 * @returns {Promise<Array>} Audit log entries
 */
async function getUserAuditLogs(userId, limitDays = 30, limit = 100) {
  try {
    const db = admin.firestore();
    const startDate = new Date(Date.now() - limitDays * 24 * 60 * 60 * 1000);

    const snapshot = await db
      .collection("audit_logs")
      .where("userId", "==", userId)
      .where("timestamp", ">=", startDate)
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || new Date(),
      expireAt: doc.data().expireAt?.toDate?.() || new Date(),
    }));
  } catch (error) {
    console.error("[Audit] Error fetching user audit logs:", error.message);
    throw error;
  }
}

/**
 * Get audit logs by action type (admin query)
 * @param {string} action - Action to filter by
 * @param {number} limitDays - Number of days to look back
 * @param {number} limit - Max documents to return
 * @returns {Promise<Array>} Audit log entries
 */
async function getAuditLogsByAction(action, limitDays = 7, limit = 100) {
  try {
    const db = admin.firestore();
    const startDate = new Date(Date.now() - limitDays * 24 * 60 * 60 * 1000);

    const snapshot = await db
      .collection("audit_logs")
      .where("action", "==", action)
      .where("timestamp", ">=", startDate)
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || new Date(),
    }));
  } catch (error) {
    console.error("[Audit] Error fetching audit logs by action:", error.message);
    throw error;
  }
}

/**
 * Clean up expired audit logs (called by Cloud Scheduler)
 * Firestore TTL policy will handle auto-deletion, but this ensures compliance
 * @returns {Promise<number>} Number of documents deleted
 */
async function cleanupExpiredAuditLogs() {
  try {
    const db = admin.firestore();
    const now = new Date();

    // Query for expired logs
    const snapshot = await db
      .collection("audit_logs")
      .where("expireAt", "<=", now)
      .limit(1000) // Process in batches
      .get();

    // Delete in batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    if (snapshot.docs.length > 0) {
      await batch.commit();
      console.log(`[Audit] Cleaned up ${snapshot.docs.length} expired audit logs`);
    }

    return snapshot.docs.length;
  } catch (error) {
    console.error("[Audit] Error cleaning up audit logs:", error.message);
    throw error;
  }
}

module.exports = {
  logAudit,
  getUserAuditLogs,
  getAuditLogsByAction,
  cleanupExpiredAuditLogs,
  AUDIT_ACTIONS,
  AUDIT_RESULT,
  AUDIT_RETENTION_MS,
};
