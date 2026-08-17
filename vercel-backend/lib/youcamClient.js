const crypto = require("crypto");
const AdmZip = require("adm-zip");

/**
 * Perfect Corp / YouCam Server-to-Server (S2S) API client.
 *
 * Implements the real, verified auth + skin-analysis flow:
 *   1. RSA handshake  -> POST /client/auth       -> short-lived access_token
 *   2. Request upload -> POST /file/skin-analysis -> file_id + presigned S3 PUT
 *   3. PUT image bytes to S3
 *   4. Create task    -> POST /task/skin-analysis (action-level dst_actions)
 *   5. Poll           -> GET  /task/skin-analysis?task_id=...
 *   6. Download result .zip (presigned S3) and unpack score_info.json + masks
 *
 * The access_token is cached in-process until shortly before it expires so we
 * don't run the RSA handshake on every call.
 *
 * Credentials (server-side secrets, never logged):
 *   YOUCAM_API_KEY    = client_id (sk-...)
 *   YOUCAM_SECRET_KEY = RSA PUBLIC key body (MIG..., base64 DER) used to encrypt
 *                       the id_token. Wrapped into PEM at runtime.
 *
 * NOTE: This file is copied VERBATIM from functions/utils/youcamClient.js — it
 * is pure Node.js (node:crypto, adm-zip, global fetch) with ZERO Firebase deps,
 * so it runs unchanged on Vercel's Node runtime. Keep the two copies in sync.
 */

const API_BASE = "https://yce-api-01.perfectcorp.com/s2s/v1.0";

// Concerns this API key is licensed for (verified empirically). `dark_circle`
// is NOT available on this key — use `dark_circle_v2`.
const DEFAULT_ACTIONS = [
  "wrinkle", "redness", "oiliness", "age_spot", "radiance", "moisture",
  "dark_circle_v2", "eye_bag", "firmness", "texture", "acne", "pore",
  "droopy_upper_eyelid", "droopy_lower_eyelid",
];

// ---- token cache (module scope; survives warm invocations) ----------------
let cachedToken = null;
let cachedTokenExpiry = 0; // epoch ms

function buildPublicKeyPem(secretKeyBody) {
  if (secretKeyBody.includes("BEGIN")) return secretKeyBody;
  const body = secretKeyBody.replace(/\s+/g, "").match(/.{1,64}/g).join("\n");
  return `-----BEGIN PUBLIC KEY-----\n${body}\n-----END PUBLIC KEY-----\n`;
}

/**
 * Run the RSA handshake and return a fresh access_token.
 * id_token = base64( RSA_PKCS1( "client_id=<key>&timestamp=<now_ms>" , publicKey ) )
 */
async function authenticate(apiKey, secretKeyBody) {
  const pem = buildPublicKeyPem(secretKeyBody);
  const timestamp = Date.now();
  const idToken = crypto
    .publicEncrypt(
      { key: pem, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(`client_id=${apiKey}&timestamp=${timestamp}`, "utf8")
    )
    .toString("base64");

  const resp = await fetch(`${API_BASE}/client/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: apiKey, id_token: idToken }),
  });
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`YouCam auth failed (${resp.status}): ${text}`);
  }
  const json = JSON.parse(text);
  const token = json?.result?.access_token;
  if (!token) throw new Error(`YouCam auth: no access_token in response`);
  return token;
}

/**
 * Return a valid access_token, using the in-process cache when possible.
 * Perfect Corp tokens are short-lived; we refresh ~2 min before assumed expiry.
 */
async function getAccessToken(apiKey, secretKeyBody) {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiry) return cachedToken;
  const token = await authenticate(apiKey, secretKeyBody);
  cachedToken = token;
  // Assume ~10 min validity; refresh 2 min early. Conservative.
  cachedTokenExpiry = now + 8 * 60 * 1000;
  return token;
}

/**
 * Request an upload URL, then PUT the image bytes to it.
 * @returns {string} file_id to reference in the task payload
 */
async function uploadImage(token, imageBuffer, contentType, fileName) {
  const reqResp = await fetch(`${API_BASE}/file/skin-analysis`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ files: [{ content_type: contentType, file_name: fileName }] }),
  });
  const reqText = await reqResp.text();
  if (!reqResp.ok) throw new Error(`YouCam upload-url failed (${reqResp.status}): ${reqText}`);

  const info = JSON.parse(reqText)?.result?.files?.[0];
  const put = info?.requests?.[0];
  if (!info?.file_id || !put?.url) {
    throw new Error(`YouCam upload-url: malformed response`);
  }

  const putResp = await fetch(put.url, {
    method: put.method || "PUT",
    headers: put.headers || { "Content-Type": contentType },
    body: imageBuffer,
  });
  if (!putResp.ok) {
    const t = await putResp.text();
    throw new Error(`YouCam S3 PUT failed (${putResp.status}): ${t}`);
  }
  return info.file_id;
}

/**
 * Create a skin-analysis task. dst_actions go at the ACTION level (not params).
 * @returns {string} task_id
 */
async function createTask(token, fileId, actions) {
  const body = {
    request_id: 1,
    payload: {
      file_sets: { src_ids: [fileId] },
      actions: [{ id: 1, dst_actions: actions }],
    },
  };
  const resp = await fetch(`${API_BASE}/task/skin-analysis`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`YouCam create-task failed (${resp.status}): ${text}`);
  const taskId = JSON.parse(text)?.result?.task_id;
  if (!taskId) throw new Error(`YouCam create-task: no task_id`);
  return taskId;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Poll the task until it succeeds or errors.
 * @returns {string} presigned URL of the result .zip
 */
async function pollTask(token, taskId, { maxWaitMs = 120000, intervalMs = 2000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const resp = await fetch(
      `${API_BASE}/task/skin-analysis?task_id=${encodeURIComponent(taskId)}`,
      { method: "GET", headers: { "Authorization": `Bearer ${token}` } }
    );
    const text = await resp.text();
    if (!resp.ok) throw new Error(`YouCam poll failed (${resp.status}): ${text}`);
    const result = JSON.parse(text)?.result;
    const status = result?.status;

    if (status === "success") {
      const url = result?.results?.[0]?.data?.[0]?.url;
      if (!url) throw new Error(`YouCam poll: success but no result url`);
      return url;
    }
    if (status === "error" || status === "failed") {
      // Surface the API's own error code (e.g. error_src_face_too_small) so the
      // caller can map it to a user-friendly message.
      const err = new Error(`YouCam analysis error: ${result?.error || "unknown"}`);
      err.youcamError = result?.error || "unknown";
      throw err;
    }
    await sleep(intervalMs);
  }
  throw new Error(`YouCam poll: timed out after ${maxWaitMs}ms`);
}

/**
 * Download the result .zip and unpack it into structured scores + images.
 * Returns:
 *   {
 *     scores: { <concern>: { rawScore, uiScore, severity } , ... },
 *     overall: number,          // all.score
 *     skinAge: number|null,
 *     baseImage: "data:image/jpeg;base64,...",  // normalized face (resize_image)
 *     masks: { <concern>: "data:image/png;base64,..." }
 *   }
 * NOTE: severity is INVERTED from ui_score (higher ui_score = healthier skin),
 * so severity = 100 - uiScore for the traffic-light UI.
 */
async function fetchAndParseResult(zipUrl) {
  const resp = await fetch(zipUrl);
  if (!resp.ok) throw new Error(`YouCam result download failed (${resp.status})`);
  const zipBuffer = Buffer.from(await resp.arrayBuffer());

  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();

  let scoreInfo = null;
  const maskBuffers = {}; // filename -> Buffer
  let baseImageBuffer = null;

  for (const e of entries) {
    if (e.isDirectory) continue;
    const base = e.entryName.split("/").pop();
    if (base === "score_info.json") {
      scoreInfo = JSON.parse(e.getData().toString("utf8"));
    } else if (base === "resize_image.jpg") {
      baseImageBuffer = e.getData();
    } else if (base.endsWith("_output.png")) {
      maskBuffers[base] = e.getData();
    }
  }
  if (!scoreInfo) throw new Error(`YouCam result: score_info.json missing`);

  const scores = {};
  const masks = {};
  for (const [concern, val] of Object.entries(scoreInfo)) {
    // skip meta keys
    if (concern === "all" || concern === "resize_image" || concern === "skin_age") continue;
    if (typeof val !== "object" || val.ui_score === undefined) continue;

    const uiScore = Math.round(val.ui_score);
    scores[concern] = {
      rawScore: val.raw_score,
      uiScore,
      severity: Math.max(0, Math.min(100, 100 - uiScore)), // invert: high = concern
    };
    const maskName = val.output_mask_name;
    if (maskName && maskBuffers[maskName]) {
      masks[concern] = `data:image/png;base64,${maskBuffers[maskName].toString("base64")}`;
    }
  }

  return {
    scores,
    overall: scoreInfo?.all?.score ?? null,
    skinAge: scoreInfo?.skin_age ?? null,
    baseImage: baseImageBuffer
      ? `data:image/jpeg;base64,${baseImageBuffer.toString("base64")}`
      : null,
    masks,
  };
}

/**
 * Full end-to-end skin analysis.
 * @param {object} args
 * @param {string} args.apiKey
 * @param {string} args.secretKey  RSA public key body
 * @param {Buffer} args.imageBuffer
 * @param {string} [args.contentType="image/jpeg"]
 * @param {string} [args.fileName="face.jpg"]
 * @param {string[]} [args.actions]  dst_actions (defaults to all licensed)
 * @returns parsed result (see fetchAndParseResult)
 */
async function analyzeSkinImage({
  apiKey,
  secretKey,
  imageBuffer,
  contentType = "image/jpeg",
  fileName = "face.jpg",
  actions = DEFAULT_ACTIONS,
}) {
  const token = await getAccessToken(apiKey, secretKey);
  const fileId = await uploadImage(token, imageBuffer, contentType, fileName);
  const taskId = await createTask(token, fileId, actions);
  const zipUrl = await pollTask(token, taskId);
  const parsed = await fetchAndParseResult(zipUrl);
  return { ...parsed, taskId };
}

module.exports = {
  analyzeSkinImage,
  DEFAULT_ACTIONS,
  // exported for targeted testing:
  getAccessToken,
  fetchAndParseResult,
};
