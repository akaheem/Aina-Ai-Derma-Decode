const { runSkinAnalysis } = require("../lib/analysisCore");
const { verifyFirebaseIdToken } = require("../lib/verifyFirebaseToken");

/**
 * POST /api/analyze  — the YouCam skin-analysis backend, on Vercel.
 *
 * This replaces the Firebase Cloud Function `analyzeSkin` (which required the
 * paid Blaze plan). The frontend stays on Firebase Hosting at the unchanged
 * primary link and calls THIS endpoint cross-origin.
 *
 * Security model:
 *   - The YouCam API key + RSA secret live ONLY in this server's env vars
 *     (YOUCAM_API_KEY / YOUCAM_SECRET_KEY) — never shipped to the browser.
 *   - The caller must present a valid Firebase ID token (Authorization:
 *     Bearer <token>), verified here against Google's public certs. So only
 *     logged-in users can spend a YouCam analysis, exactly as before.
 *
 * Request  body: { imageData: "data:image/...;base64,...", imageMetadata?: {...} }
 * Response body: { success: true, analysis: {...}, meta?: { trimmedMasks } }
 */

// Origins allowed to call this API (the Firebase-hosted frontend + local dev).
const ALLOWED_ORIGINS = new Set([
  "https://aina-ai-derma-decode.web.app",
  "https://aina-ai-derma-decode.firebaseapp.com",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:3000",
]);

// Firebase project whose ID tokens we accept (public value; overridable).
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "aina-ai-derma-decode";

// Vercel serverless response bodies are capped at 4.5 MB. Keep headroom.
const RESPONSE_BUDGET_BYTES = 4 * 1024 * 1024;

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
}

/**
 * Keep the JSON response under Vercel's size cap. The analyzed base image +
 * scores are the core payload; heatmap masks are optional eye-candy, so when
 * the payload is too big we drop the LEAST-severe masks first (they're the
 * least interesting to show), then the base image only as a last resort.
 */
function fitResponseWithinBudget(analysisData, maxBytes) {
  const scores = analysisData.scores || {};
  const masks = { ...(analysisData.masks || {}) };
  const data = { ...analysisData, masks };

  const size = () =>
    Buffer.byteLength(JSON.stringify({ success: true, analysis: data }), "utf8");

  if (size() <= maxBytes) return { analysisData: data, trimmedMasks: 0, droppedBase: false };

  const leastSevereFirst = Object.keys(masks).sort(
    (a, b) => (scores[a]?.severity ?? 0) - (scores[b]?.severity ?? 0)
  );

  let trimmedMasks = 0;
  for (const key of leastSevereFirst) {
    if (size() <= maxBytes) break;
    delete masks[key];
    trimmedMasks++;
  }

  let droppedBase = false;
  if (size() > maxBytes && data.baseImage) {
    data.baseImage = null;
    droppedBase = true;
  }

  return { analysisData: data, trimmedMasks, droppedBase };
}

/**
 * Map a raw error into { status, code, message } with the SAME friendly copy
 * the old Cloud Function produced, so the frontend's error handling is
 * unchanged.
 */
function mapError(error) {
  const yc = error.youcamError || "";
  if (yc.includes("face_too_small")) {
    return { status: 400, code: "invalid-argument", message: "Your face is too small in the photo. Move closer or crop tighter, then try again." };
  }
  if (yc.includes("face_out_of_bound")) {
    return { status: 400, code: "invalid-argument", message: "Your face is cut off at the edge. Center your whole face in the frame and try again." };
  }
  if (yc.includes("no_face") || yc.includes("face_not_detected")) {
    return { status: 400, code: "invalid-argument", message: "We couldn't detect a face. Please use a clear, front-facing photo." };
  }
  if (yc) {
    return { status: 400, code: "invalid-argument", message: "We couldn't analyze this photo. Please use a clear, well-lit, front-facing selfie." };
  }
  if (error.message?.includes("auth")) {
    return { status: 500, code: "internal", message: "System configuration error. Please contact support." };
  }
  if (error.message?.includes("timed out") || error.message?.includes("timeout")) {
    return { status: 504, code: "deadline-exceeded", message: "Analysis took too long. Please try again in a moment." };
  }
  return { status: 500, code: "internal", message: "Skin analysis failed. Please try again." };
}

module.exports = async (req, res) => {
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ success: false, code: "method-not-allowed", message: "Use POST." });
    return;
  }

  // 1. Authentication — verify the Firebase ID token.
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  try {
    await verifyFirebaseIdToken(token, FIREBASE_PROJECT_ID);
  } catch (err) {
    console.error("[analyze] auth rejected:", err.message);
    res.status(401).json({
      success: false,
      code: "unauthenticated",
      message: "You must be logged in to analyze skin. Please sign in and try again.",
    });
    return;
  }

  // 2. Server config — credentials must be present (never logged).
  const apiKey = process.env.YOUCAM_API_KEY;
  const secretKey = process.env.YOUCAM_SECRET_KEY;
  if (!apiKey || !secretKey) {
    console.error("[analyze] YouCam credentials not configured");
    res.status(500).json({ success: false, code: "internal", message: "System configuration error. Please contact support." });
    return;
  }

  // 3. Input — Vercel auto-parses JSON bodies for the Node runtime.
  const body = typeof req.body === "string" ? safeJson(req.body) : req.body || {};
  const { imageData, imageUrl, imageMetadata } = body;
  if (!imageData && !imageUrl) {
    res.status(400).json({ success: false, code: "invalid-argument", message: "An image is required. Please upload a photo and try again." });
    return;
  }

  // 4. Run the analysis (same core the Cloud Function used).
  try {
    const { analysisData } = await runSkinAnalysis({ imageData, imageUrl, imageMetadata, apiKey, secretKey });
    const { analysisData: fitted, trimmedMasks, droppedBase } = fitResponseWithinBudget(analysisData, RESPONSE_BUDGET_BYTES);
    if (trimmedMasks || droppedBase) {
      console.log(`[analyze] response trimmed to fit budget (masks dropped: ${trimmedMasks}, base dropped: ${droppedBase})`);
    }
    res.status(200).json({
      success: true,
      analysisId: null, // no Firestore persistence on this host
      analysis: fitted,
      meta: { trimmedMasks },
    });
  } catch (error) {
    console.error("[analyze] error:", error.message);
    const { status, code, message } = mapError(error);
    res.status(status).json({ success: false, code, message });
  }
};

function safeJson(str) {
  try { return JSON.parse(str); } catch { return {}; }
}
