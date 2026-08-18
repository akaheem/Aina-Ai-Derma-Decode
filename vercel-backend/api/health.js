/**
 * GET /api/health — tiny liveness probe so you can confirm the deploy works
 * before wiring the frontend. Reports whether the YouCam credentials are
 * configured.
 *
 * SECURITY: this NEVER returns a credential value. It returns only:
 *   - booleans (is the var set?)
 *   - the *names* of env vars we recognize (names are not secrets)
 *   - the character length of each expected var (a length is not a value; it's
 *     just enough to catch "set but empty" or "accidentally wrapped in quotes")
 *   - which Vercel environment served this request (VERCEL_ENV)
 * The `?debug=1` fields are diagnostic and can be removed once creds are live.
 */
const ALLOWED_ORIGINS = new Set([
  "https://aina-ai-derma-decode.web.app",
  "https://aina-ai-derma-decode.firebaseapp.com",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:3000",
]);

module.exports = (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");

  const apiKey = process.env.YOUCAM_API_KEY;
  const secretKey = process.env.YOUCAM_SECRET_KEY;

  const body = {
    ok: true,
    service: "ainaai-youcam-backend",
    hasApiKey: Boolean(apiKey),
    hasSecretKey: Boolean(secretKey),
    projectId: process.env.FIREBASE_PROJECT_ID || "aina-ai-derma-decode",
  };

  // Names-only diagnostics (safe): helps pinpoint a name typo or wrong scope.
  const url = new URL(req.url, "http://x");
  if (url.searchParams.get("debug") === "1") {
    body.debug = {
      // Which environment actually served this response.
      vercelEnv: process.env.VERCEL_ENV || null,
      // Did FIREBASE_PROJECT_ID come from a real env var, or the code default?
      firebaseProjectIdFromEnv: Boolean(process.env.FIREBASE_PROJECT_ID),
      // Lengths only — never the values. 0/undefined ⇒ missing or empty.
      apiKeyLen: apiKey ? apiKey.length : 0,
      secretKeyLen: secretKey ? secretKey.length : 0,
      // Every env var NAME we can see that looks related (NOT the values).
      // If you see e.g. "YOUCAM_APIKEY" here, that's a typo in the dashboard.
      relatedNames: Object.keys(process.env)
        .filter((k) => /YOUCAM|PERFECT|FIREBASE/i.test(k))
        .sort(),
    };
  }

  res.status(200).json(body);
};
