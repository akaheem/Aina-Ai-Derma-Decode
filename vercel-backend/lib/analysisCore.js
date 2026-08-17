const { analyzeSkinImage } = require("./youcamClient");

/**
 * Pure, Firebase-free core of the skin-analysis flow.
 *
 * Copied VERBATIM from functions/utils/analysisCore.js so the Vercel function
 * runs the EXACT path the (now-retired) Cloud Function used. Keep in sync.
 */

/**
 * Resolve the supported image inputs into raw bytes.
 * Preferred: base64 `imageData` (data URI or bare base64) — no Storage needed.
 * Fallback: `imageUrl` fetched server-side (Node global fetch).
 * Throws a plain Error on failure (caller maps it to a friendly message).
 */
async function resolveImageBuffer({ imageData, imageUrl, imageMetadata } = {}) {
  let imageBuffer;
  let contentType = imageMetadata?.type || "image/jpeg";

  if (imageData) {
    // Accept "data:image/jpeg;base64,XXXX" or bare base64
    const m = /^data:(image\/[a-zA-Z+.-]+);base64,(.*)$/s.exec(imageData);
    if (m) {
      contentType = m[1];
      imageBuffer = Buffer.from(m[2], "base64");
    } else {
      imageBuffer = Buffer.from(imageData, "base64");
    }
  } else if (imageUrl) {
    const imgResp = await fetch(imageUrl);
    if (!imgResp.ok) throw new Error(`fetch imageUrl failed (${imgResp.status})`);
    contentType = imgResp.headers.get("content-type") || contentType;
    imageBuffer = Buffer.from(await imgResp.arrayBuffer());
  } else {
    throw new Error("no image provided");
  }

  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error("decoded image is empty");
  }

  const fileName =
    (imageMetadata?.name && String(imageMetadata.name).replace(/[^\w.-]/g, "_")) ||
    (contentType.includes("png") ? "face.png" : "face.jpg");

  return { imageBuffer, contentType, fileName };
}

/**
 * Shape the raw youcamClient result into the payload the frontend consumes.
 * Adds legacy flat severity fields (higher = worse) for older components.
 * Pure.
 */
function buildAnalysisData(result) {
  const sev = (k) => result.scores?.[k]?.severity ?? 0;
  return {
    scores: result.scores,
    overall: result.overall,
    skinAge: result.skinAge,
    baseImage: result.baseImage,
    masks: result.masks,
    // legacy flat fields (severity 0-100, higher = worse)
    wrinkles: sev("wrinkle"),
    redness: sev("redness"),
    oiliness: sev("oiliness"),
    acne: sev("acne"),
    dark_circles: sev("dark_circle_v2"),
  };
}

/**
 * Full analysis core: raw inputs → YouCam → shaped analysisData.
 * No Firebase dependencies, so this is the exact path exercised by both a local
 * test and the deployed handler.
 */
async function runSkinAnalysis({ imageData, imageUrl, imageMetadata, apiKey, secretKey }) {
  const { imageBuffer, contentType, fileName } = await resolveImageBuffer({ imageData, imageUrl, imageMetadata });
  const result = await analyzeSkinImage({ apiKey, secretKey, imageBuffer, contentType, fileName });
  return { analysisData: buildAnalysisData(result), taskId: result.taskId, byteLength: imageBuffer.length };
}

module.exports = { resolveImageBuffer, buildAnalysisData, runSkinAnalysis };
