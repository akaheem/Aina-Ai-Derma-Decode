/**
 * GET /api/health — tiny liveness probe so you can confirm the deploy works
 * before wiring the frontend. Returns 200 and reports whether the YouCam
 * credentials are configured (booleans only — never the values themselves).
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
  res.status(200).json({
    ok: true,
    service: "ainaai-youcam-backend",
    hasApiKey: Boolean(process.env.YOUCAM_API_KEY),
    hasSecretKey: Boolean(process.env.YOUCAM_SECRET_KEY),
    projectId: process.env.FIREBASE_PROJECT_ID || "aina-ai-derma-decode",
  });
};
