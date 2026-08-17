const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { logError, ERROR_CODES, SEVERITY, formatErrorResponse } = require("./utils/logger");
const { validateImage, validateMimeType, validateFileSize, validateDimensions } = require("./utils/validation");
const { checkAnalysisRateLimit, incrementAnalysisCount, checkOutfitRateLimit, incrementOutfitCount } = require("./utils/rateLimiter");
const { retryPolling, retryWithBackoff } = require("./utils/retry");
const { logAudit, AUDIT_ACTIONS, AUDIT_RESULT } = require("./utils/auditLog");
const { analyzeSkinImage } = require("./utils/youcamClient");
const { resolveImageBuffer, buildAnalysisData } = require("./utils/analysisCore");

admin.initializeApp();

// Perfect Corp / YouCam S2S credentials (server-side secrets — never logged).
const YOUCAM_API_KEY = process.env.YOUCAM_API_KEY;
const YOUCAM_SECRET_KEY = process.env.YOUCAM_SECRET_KEY;

// Emulator mode: when running against the Functions emulator without the other
// emulators (Firestore/Storage need Java), skip Firestore writes so a pure-
// Functions local demo still works end-to-end.
const SKIP_FIRESTORE = process.env.YOUCAM_SKIP_FIRESTORE === "true";

/**
 * The Perfect Corp / YouCam S2S skin-analysis flow (RSA auth handshake, S3
 * file upload, task create/poll, and result-zip parsing) lives in
 * ./utils/youcamClient.js. The Firebase-free glue (image decode + response
 * shaping) lives in ./utils/analysisCore.js so it can be tested directly
 * against the real API along the exact deployed path. analyzeSkin below adds
 * auth, rate-limiting, Firestore persistence and error mapping around it.
 */


/**
 * Cloud Function: Analyze Skin
 * Enhanced with comprehensive error handling, input validation, rate limiting, and retry logic
 *
 * Features:
 * - Input validation (required fields)
 * - Rate limiting (max 10 analyses per user per day)
 * - Retry logic with exponential backoff for transient failures
 * - Detailed error logging to Firestore
 * - User-friendly error messages
 */
exports.analyzeSkin = functions.https.onCall(async (data, context) => {
  const db = admin.firestore();

  // 1. Authentication check
  if (!context.auth) {
    await logError({
      userId: "unauthenticated",
      errorCode: ERROR_CODES.UNAUTHENTICATED,
      message: "User not authenticated",
      context: "analyzeSkin",
      severity: SEVERITY.LOW,
    });

    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to analyze skin. Please sign in and try again."
    );
  }

  const userId = context.auth.uid;
  // Preferred path: the client sends the image bytes as a base64 data URI or
  // raw base64 (imageData). This avoids any dependency on Firebase Storage,
  // and the bytes go straight to YouCam's own upload endpoint.
  // Legacy/cloud path: imageUrl (a download URL) is fetched server-side.
  const { imageData, imageUrl, imageMetadata } = data;

  // 2. Input validation
  if (!imageData && !imageUrl) {
    await logError({
      userId,
      errorCode: ERROR_CODES.INVALID_IMAGE_MIME,
      message: "No image provided (imageData or imageUrl required)",
      context: "analyzeSkin",
      severity: SEVERITY.LOW,
      metadata: { receivedData: Object.keys(data || {}) },
    });

    throw new functions.https.HttpsError(
      "invalid-argument",
      "An image is required. Please upload a photo and try again."
    );
  }

  if (!YOUCAM_API_KEY || !YOUCAM_SECRET_KEY) {
    await logError({
      userId,
      errorCode: ERROR_CODES.MISSING_API_KEY,
      message: "YouCam credentials not configured",
      context: "analyzeSkin",
      severity: SEVERITY.HIGH,
    });
    throw new functions.https.HttpsError(
      "internal",
      "System configuration error. Please contact support."
    );
  }

  // 3. Rate limit check
  try {
    const rateLimitCheck = await checkAnalysisRateLimit(userId);

    if (!rateLimitCheck.allowed) {
      const resetTime = rateLimitCheck.resetTime?.toISOString() || "unknown";
      await logError({
        userId,
        errorCode: ERROR_CODES.QUOTA_EXCEEDED,
        message: "User exceeded daily analysis quota",
        context: "analyzeSkin",
        severity: SEVERITY.LOW,
        metadata: {
          remaining: rateLimitCheck.remaining,
          resetTime,
          limit: 10,
        },
      });

      throw new functions.https.HttpsError(
        "resource-exhausted",
        `You've reached your daily limit of 10 analyses. Try again tomorrow or upgrade your account.`
      );
    }

    console.log(`[Rate Limit] User ${userId} has ${rateLimitCheck.remaining} analyses remaining today`);
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    // Log but don't block on rate limit check errors (e.g. Firestore off locally)
    console.error("[Rate Limit Check] Error:", error.message);
  }

  // 4. Resolve the image bytes into a Buffer
  let resolved;
  try {
    resolved = await resolveImageBuffer({ imageData, imageUrl, imageMetadata });
  } catch (error) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Could not read the uploaded image. Please try a different photo."
    );
  }
  const { imageBuffer, contentType, fileName } = resolved;

  // 5. Run the real Perfect Corp / YouCam skin analysis
  try {
    console.log(`[analyzeSkin] Starting skin analysis for user ${userId} (${imageBuffer.length} bytes)`);

    const result = await analyzeSkinImage({
      apiKey: YOUCAM_API_KEY,
      secretKey: YOUCAM_SECRET_KEY,
      imageBuffer,
      contentType,
      fileName,
    });

    // Shape into the payload the frontend consumes (+ legacy flat fields).
    const analysisData = buildAnalysisData(result);

    // 6. Persist to Firestore (skipped in Functions-only local mode).
    let analysisId = null;
    if (!SKIP_FIRESTORE) {
      try {
        // Don't store the heavy base64 blobs in Firestore — persist scores only.
        const { baseImage, masks, ...persistable } = analysisData;
        const analysisRef = await db.collection("analyses").add({
          userId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          analysis: persistable,
          taskId: result.taskId,
          status: "completed",
        });
        analysisId = analysisRef.id;
        console.log(`[Firestore] Analysis saved: ${analysisId}`);
        await incrementAnalysisCount(userId);
      } catch (firestoreError) {
        // In local/emulator demos Firestore may be unavailable; don't fail the
        // whole analysis just because persistence failed.
        console.error("[Firestore] Save failed (continuing):", firestoreError.message);
        await logError({
          userId,
          errorCode: ERROR_CODES.FIRESTORE_ERROR,
          message: "Failed to save analysis to Firestore (non-fatal)",
          context: "analyzeSkin",
          severity: SEVERITY.MEDIUM,
          error: firestoreError,
        });
      }
    } else {
      console.log("[analyzeSkin] SKIP_FIRESTORE set — not persisting analysis.");
    }

    return {
      success: true,
      analysisId,
      analysis: analysisData,
    };
  } catch (error) {
    console.error("[analyzeSkin] Error:", error.message);

    // Map errors to user-friendly messages.
    let userMessage = "Skin analysis failed. Please try again.";
    let httpsErrorCode = "internal";

    // YouCam surfaces specific face-quality error codes — translate them.
    const yc = error.youcamError || "";
    if (yc.includes("face_too_small")) {
      userMessage = "Your face is too small in the photo. Move closer or crop tighter, then try again.";
      httpsErrorCode = "invalid-argument";
    } else if (yc.includes("face_out_of_bound")) {
      userMessage = "Your face is cut off at the edge. Center your whole face in the frame and try again.";
      httpsErrorCode = "invalid-argument";
    } else if (yc.includes("no_face") || yc.includes("face_not_detected")) {
      userMessage = "We couldn't detect a face. Please use a clear, front-facing photo.";
      httpsErrorCode = "invalid-argument";
    } else if (yc) {
      userMessage = "We couldn't analyze this photo. Please use a clear, well-lit, front-facing selfie.";
      httpsErrorCode = "invalid-argument";
    } else if (error.message?.includes("auth")) {
      userMessage = "System configuration error. Please contact support.";
      httpsErrorCode = "internal";
    } else if (error.message?.includes("timed out") || error.message?.includes("timeout")) {
      userMessage = "Analysis took too long. Please try again in a moment.";
      httpsErrorCode = "deadline-exceeded";
    }

    await logError({
      userId,
      errorCode: ERROR_CODES.INTERNAL_ERROR,
      message: userMessage,
      context: "analyzeSkin",
      severity: SEVERITY.MEDIUM,
      error,
      metadata: { originalError: error.message, youcamError: yc || undefined },
    });

    throw new functions.https.HttpsError(httpsErrorCode, userMessage);
  }
});

/**
 * Cloud Function: Try On Apparel
 * Enhanced with comprehensive error handling, rate limiting, and retry logic
 */
exports.tryOnApparel = functions.https.onCall(async (data, context) => {
  const db = admin.firestore();

  // 1. Authentication check
  if (!context.auth) {
    await logError({
      userId: "unauthenticated",
      errorCode: ERROR_CODES.UNAUTHENTICATED,
      message: "User not authenticated",
      context: "tryOnApparel",
      severity: SEVERITY.LOW,
    });

    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to try on apparel. Please sign in and try again."
    );
  }

  const userId = context.auth.uid;
  const { userPhotoUrl, clothingImageUrl, clothingInfo } = data;

  // 2. Input validation
  if (!userPhotoUrl || !clothingImageUrl) {
    await logError({
      userId,
      errorCode: ERROR_CODES.INVALID_IMAGE_MIME,
      message: "Missing required image URLs",
      context: "tryOnApparel",
      severity: SEVERITY.LOW,
      metadata: { hasUserPhoto: !!userPhotoUrl, hasClothingImage: !!clothingImageUrl },
    });

    throw new functions.https.HttpsError(
      "invalid-argument",
      "Both user photo and clothing image are required."
    );
  }

  // 3. Rate limit check
  try {
    const rateLimitCheck = await checkOutfitRateLimit(userId);

    if (!rateLimitCheck.allowed) {
      const resetTime = rateLimitCheck.resetTime?.toISOString() || "unknown";
      await logError({
        userId,
        errorCode: ERROR_CODES.QUOTA_EXCEEDED,
        message: "User exceeded daily outfit try-on quota",
        context: "tryOnApparel",
        severity: SEVERITY.LOW,
        metadata: {
          remaining: rateLimitCheck.remaining,
          resetTime,
          limit: 20,
        },
      });

      throw new functions.https.HttpsError(
        "resource-exhausted",
        `You've reached your daily limit of 20 outfit try-ons. Try again tomorrow.`
      );
    }

    console.log(`[Rate Limit] User ${userId} has ${rateLimitCheck.remaining} outfit tries remaining today`);
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    console.error("[Rate Limit Check] Error:", error.message);
  }

  // 4. Apparel try-on is a separate Perfect Corp endpoint that is not wired up
  // in this build (the skin-analysis flow is the focus). Fail clearly instead
  // of calling the removed generic helper.
  try {
    console.log(`[tryOnApparel] Requested by user ${userId} — feature not enabled in this build`);

    throw new functions.https.HttpsError(
      "unimplemented",
      "Virtual apparel try-on isn't available in this build yet. Skin analysis is fully supported."
    );

    // eslint-disable-next-line no-unreachable
    const result = null;
    const vtoData = result.data.result;

    // 5. Save to Firestore
    try {
      const outfitRef = await db.collection("outfits").add({
        userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userPhotoUrl,
        clothingImageUrl,
        clothingInfo,
        vtoResult: vtoData,
        taskId: result.data.task_id,
        status: "completed",
      });

      console.log(`[Firestore] Outfit saved: ${outfitRef.id}`);

      // Increment user's outfit count for rate limiting
      await incrementOutfitCount(userId);

      return {
        success: true,
        outfitId: outfitRef.id,
        result: vtoData,
      };
    } catch (firestoreError) {
      await logError({
        userId,
        errorCode: ERROR_CODES.FIRESTORE_ERROR,
        message: "Failed to save outfit try-on to Firestore",
        context: "tryOnApparel",
        severity: SEVERITY.HIGH,
        error: firestoreError,
      });

      throw new functions.https.HttpsError(
        "internal",
        "Try-on completed but failed to save results. Please try again."
      );
    }
  } catch (error) {
    console.error("[tryOnApparel] Error:", error.message);

    // Map errors to user-friendly messages
    let userMessage = "Apparel try-on failed. Please try again.";
    let httpsErrorCode = "internal";

    if (error.message?.includes("timeout") || error.message?.includes("TIMEOUT")) {
      userMessage = "Try-on took too long. Please try again later.";
      httpsErrorCode = "deadline-exceeded";
    } else if (error.message?.includes("rate limit")) {
      userMessage = "API rate limited. Please wait a moment and try again.";
      httpsErrorCode = "resource-exhausted";
    } else if (error.message?.includes("invalid")) {
      userMessage = "Invalid image. Please ensure both photos are clear and in JPG or PNG format.";
      httpsErrorCode = "invalid-argument";
    }

    // Log the error
    await logError({
      userId,
      errorCode: ERROR_CODES.INTERNAL_ERROR,
      message: userMessage,
      context: "tryOnApparel",
      severity: SEVERITY.MEDIUM,
      error,
      metadata: { originalError: error.message },
    });

    throw new functions.https.HttpsError(httpsErrorCode, userMessage);
  }
});

/**
 * Cloud Function: Get Analysis History
 * Enhanced with error handling and logging
 */
exports.getAnalysisHistory = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    await logError({
      userId: "unauthenticated",
      errorCode: ERROR_CODES.UNAUTHENTICATED,
      message: "Unauthenticated request to getAnalysisHistory",
      context: "getAnalysisHistory",
      severity: SEVERITY.LOW,
    });

    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to view your history."
    );
  }

  const userId = context.auth.uid;

  try {
    const db = admin.firestore();
    const snapshot = await db
      .collection("analyses")
      .where("userId", "==", userId)
      .orderBy("timestamp", "desc")
      .limit(20)
      .get();

    const analyses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || new Date(),
    }));

    console.log(`[getAnalysisHistory] Retrieved ${analyses.length} analyses for user ${userId}`);

    return { success: true, analyses };
  } catch (error) {
    console.error("[getAnalysisHistory] Error:", error.message);

    await logError({
      userId,
      errorCode: ERROR_CODES.FIRESTORE_ERROR,
      message: "Failed to fetch analysis history",
      context: "getAnalysisHistory",
      severity: SEVERITY.MEDIUM,
      error,
    });

    throw new functions.https.HttpsError(
      "internal",
      "Failed to fetch your analysis history. Please try again."
    );
  }
});

/**
 * Cloud Function: Get Outfit History
 * Enhanced with error handling and logging
 */
exports.getOutfitHistory = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    await logError({
      userId: "unauthenticated",
      errorCode: ERROR_CODES.UNAUTHENTICATED,
      message: "Unauthenticated request to getOutfitHistory",
      context: "getOutfitHistory",
      severity: SEVERITY.LOW,
    });

    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to view your history."
    );
  }

  const userId = context.auth.uid;

  try {
    const db = admin.firestore();
    const snapshot = await db
      .collection("outfits")
      .where("userId", "==", userId)
      .orderBy("timestamp", "desc")
      .limit(20)
      .get();

    const outfits = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || new Date(),
    }));

    console.log(`[getOutfitHistory] Retrieved ${outfits.length} outfits for user ${userId}`);

    return { success: true, outfits };
  } catch (error) {
    console.error("[getOutfitHistory] Error:", error.message);

    await logError({
      userId,
      errorCode: ERROR_CODES.FIRESTORE_ERROR,
      message: "Failed to fetch outfit history",
      context: "getOutfitHistory",
      severity: SEVERITY.MEDIUM,
      error,
    });

    throw new functions.https.HttpsError(
      "internal",
      "Failed to fetch your outfit history. Please try again."
    );
  }
});

// Import all privacy and compliance functions
const privacyFunctions = require("./privacyFunctions");
exports.exportMyData = privacyFunctions.exportMyData;
exports.requestDataDeletion = privacyFunctions.requestDataDeletion;
exports.getPrivacySettings = privacyFunctions.getPrivacySettings;
exports.updatePrivacySettings = privacyFunctions.updatePrivacySettings;
exports.recordConsent = privacyFunctions.recordConsent;
exports.getAuditLogs = privacyFunctions.getAuditLogs;
exports.pingHealthCheck = privacyFunctions.pingHealthCheck;
exports.sendOTP = privacyFunctions.sendOTP;
exports.verifyOTP = privacyFunctions.verifyOTP;
