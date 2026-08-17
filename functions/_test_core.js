/*
 * Verifies the EXACT deployed core path: base64 data URI in → runSkinAnalysis →
 * shaped analysisData out, against the live YouCam API. Prints only shape and
 * scores; never secrets. Run from functions/. Throwaway.
 */
require("dotenv").config();
const fs = require("fs");
const { runSkinAnalysis } = require("./utils/analysisCore.js");

(async () => {
  const bytes = fs.readFileSync("C:/skin/_face_test.jpg");
  // Encode exactly like the browser's FileReader.readAsDataURL does.
  const imageData = `data:image/jpeg;base64,${bytes.toString("base64")}`;
  console.log(`Sending base64 data URI (${imageData.length} chars, ${bytes.length} raw bytes)...`);

  const t0 = Date.now();
  const { analysisData, taskId, byteLength } = await runSkinAnalysis({
    imageData,
    imageMetadata: { name: "selfie.jpg", type: "image/jpeg", size: bytes.length },
    apiKey: process.env.YOUCAM_API_KEY,
    secretKey: process.env.YOUCAM_SECRET_KEY,
  });

  console.log(`\nDone in ${Date.now() - t0}ms. taskId=${taskId} decodedBytes=${byteLength}`);
  console.log(`overall=${analysisData.overall}  skinAge=${analysisData.skinAge}`);
  console.log(`baseImage: ${analysisData.baseImage ? analysisData.baseImage.slice(0, 30) + "… (" + analysisData.baseImage.length + " chars)" : "MISSING"}`);
  console.log(`scores: ${Object.keys(analysisData.scores || {}).length} concerns, masks: ${Object.keys(analysisData.masks || {}).length}`);
  console.log(`legacy flat: wrinkles=${analysisData.wrinkles} redness=${analysisData.redness} oiliness=${analysisData.oiliness} acne=${analysisData.acne} dark_circles=${analysisData.dark_circles}`);

  // Assert the shape the frontend depends on.
  const problems = [];
  if (!analysisData.scores || Object.keys(analysisData.scores).length < 10) problems.push("too few scores");
  if (!analysisData.baseImage || !analysisData.baseImage.startsWith("data:image/")) problems.push("baseImage not a data URI");
  if (!analysisData.masks || Object.keys(analysisData.masks).length < 10) problems.push("too few masks");
  const anyMask = Object.values(analysisData.masks || {})[0];
  if (anyMask && !anyMask.startsWith("data:image/png")) problems.push("mask not a png data URI");
  const w = analysisData.scores?.wrinkle;
  if (!w || typeof w.uiScore !== "number" || typeof w.severity !== "number") problems.push("wrinkle score missing uiScore/severity");

  if (problems.length) {
    console.error("\nSHAPE PROBLEMS:", problems.join("; "));
    process.exit(1);
  }
  console.log("\n✓ Deployed core path produces the exact shape the frontend consumes.");
})().catch((e) => {
  console.error("FAILED:", e.message, e.youcamError ? `(youcam: ${e.youcamError})` : "");
  process.exit(1);
});
