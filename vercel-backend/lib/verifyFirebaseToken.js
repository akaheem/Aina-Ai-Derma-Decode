const crypto = require("crypto");

/**
 * Verify a Firebase Authentication ID token WITHOUT the firebase-admin SDK
 * (and therefore without a service-account private key).
 *
 * Firebase ID tokens are ordinary RS256 JWTs signed by Google. The public
 * signing certificates are published, unauthenticated, at a well-known Google
 * endpoint keyed by the token's `kid`. We:
 *   1. parse the JWT header/payload (base64url),
 *   2. confirm alg === "RS256",
 *   3. fetch (and cache) Google's public x509 certs, pick the one matching `kid`,
 *   4. verify the RSA-SHA256 signature over `header.payload`,
 *   5. validate the standard Firebase claims (iss, aud, exp, iat, sub).
 *
 * This keeps the whole backend dependency-light (pure node:crypto + global
 * fetch) and means deploying only requires the two YouCam secrets as env vars —
 * no Firebase service account to generate or paste in.
 *
 * Reference: https://firebase.google.com/docs/auth/admin/verify-id-tokens
 */

const CERT_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

// ---- cert cache (module scope; survives warm invocations) ------------------
let cachedCerts = null;
let cachedCertsExpiry = 0; // epoch ms

/** base64url → Buffer */
function b64urlToBuffer(str) {
  return Buffer.from(str, "base64url");
}

/** Fetch Google's token-signing certs, honoring the response's max-age cache. */
async function getGoogleCerts() {
  const now = Date.now();
  if (cachedCerts && now < cachedCertsExpiry) return cachedCerts;

  const resp = await fetch(CERT_URL);
  if (!resp.ok) throw new Error(`Failed to fetch Google certs (${resp.status})`);
  const certs = await resp.json(); // { "<kid>": "-----BEGIN CERTIFICATE-----...", ... }

  // Respect Cache-Control: max-age so we don't refetch on every request but
  // still rotate before the certs expire. Default to 1 hour if unparseable.
  let maxAgeMs = 60 * 60 * 1000;
  const cc = resp.headers.get("cache-control") || "";
  const m = /max-age=(\d+)/.exec(cc);
  if (m) maxAgeMs = Math.max(60_000, parseInt(m[1], 10) * 1000 - 60_000); // refresh 1 min early

  cachedCerts = certs;
  cachedCertsExpiry = now + maxAgeMs;
  return certs;
}

/**
 * Verify a Firebase ID token for the given project.
 * @param {string} idToken  the raw JWT from the client (Authorization: Bearer)
 * @param {string} projectId  Firebase project id (aud / iss suffix)
 * @returns {Promise<{uid: string, email?: string, claims: object}>}
 * @throws {Error} with a short message if the token is missing/invalid/expired
 */
async function verifyFirebaseIdToken(idToken, projectId) {
  if (!idToken || typeof idToken !== "string") throw new Error("missing token");

  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("malformed token");
  const [headerB64, payloadB64, signatureB64] = parts;

  let header, payload;
  try {
    header = JSON.parse(b64urlToBuffer(headerB64).toString("utf8"));
    payload = JSON.parse(b64urlToBuffer(payloadB64).toString("utf8"));
  } catch {
    throw new Error("undecodable token");
  }

  if (header.alg !== "RS256") throw new Error("unexpected token alg");
  if (!header.kid) throw new Error("token missing kid");

  // ---- signature verification -------------------------------------------
  const certs = await getGoogleCerts();
  const cert = certs[header.kid];
  if (!cert) throw new Error("no matching signing cert (kid)");

  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(`${headerB64}.${payloadB64}`);
  verifier.end();
  const ok = verifier.verify(cert, b64urlToBuffer(signatureB64));
  if (!ok) throw new Error("bad token signature");

  // ---- claim validation --------------------------------------------------
  const nowSec = Math.floor(Date.now() / 1000);
  const skew = 60; // allow 1 min clock skew

  if (typeof payload.exp !== "number" || payload.exp < nowSec - skew) {
    throw new Error("token expired");
  }
  if (typeof payload.iat !== "number" || payload.iat > nowSec + skew) {
    throw new Error("token issued in the future");
  }
  if (payload.aud !== projectId) throw new Error("wrong audience");
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error("wrong issuer");
  }
  if (!payload.sub || typeof payload.sub !== "string") {
    throw new Error("token missing subject");
  }

  return { uid: payload.sub, email: payload.email, claims: payload };
}

module.exports = { verifyFirebaseIdToken };
