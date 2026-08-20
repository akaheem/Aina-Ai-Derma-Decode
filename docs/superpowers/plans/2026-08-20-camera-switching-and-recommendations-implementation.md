# Camera Switching and Recommendations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add adaptive camera selection and accurate tiered guidance for every skin-analysis concern.

**Architecture:** Keep browser-camera operations in `CameraCapture.jsx`, with a small pure `cameraDevices.js` helper for constraint construction and stream-derived device labels. Extend the current results data mapping and guidance database without changing the YouCam backend or API response shape.

**Tech Stack:** React 19, Vite 8, native MediaDevices APIs, existing Lucide icons, CSS custom properties, Node `assert`; no new runtime dependencies.

## Global Constraints

- No new runtime dependencies.
- The user commits and deploys; do not create commits or push.
- JSDoc for public component/helper APIs; no PropTypes.
- Use existing `lk-*` styling and Rose Derma CSS tokens in `src/index.css`.
- Front preview is mirrored; rear preview is not. Captured images remain raw/unmirrored.
- FaceDetector auto-capture is front-camera only; rear camera always has manual Capture.
- Display guidance at health `< 75` (Needs attention) and `75–89` (Room to improve); hide only health `>= 90`.
- Cover all 14 YouCam concerns; use honest lifestyle/professional guidance rather than topical claims for eye bags and upper/lower eyelid droop.
- Verify `npm run build` and `npm run lint`; perform targeted Node assert tests for pure helper logic.

---

### Task 1: Implement robust camera device helpers

**Files:**
- Create: `src/utils/cameraDevices.js`
- Test: `src/utils/cameraDevices.test.mjs` (temporary Node assert script, remove after validation)

**Produces:**
- `buildFacingModeConstraints(facingMode): MediaStreamConstraints` with `audio: false`, square 1280 ideals, and `video.facingMode.ideal`.
- `buildDeviceConstraints(deviceId): MediaStreamConstraints` with `audio: false`, square 1280 ideals, and exact `video.deviceId`.
- `getStreamFacingMode(stream): "user"|"environment"` from active video-track settings, defaulting to `"user"`.
- `getActiveDeviceId(stream): string|null` from active video-track settings.
- `labelCamera(device, index): string` using the browser label when available, otherwise `Camera ${index + 1}`.

**Steps:**
- [ ] Write Node assert cases for both constraints, stream-setting fallbacks, and labels.
- [ ] Run `node src/utils/cameraDevices.test.mjs`; it must fail before helpers exist.
- [ ] Implement the small pure helpers with JSDoc and no browser-global reads.
- [ ] Re-run the test; it must pass.
- [ ] Remove the temporary test script.

### Task 2: Add camera switch UI styles

**Files:**
- Modify: `src/index.css` near existing `.lk-cam-*` rules.

**Produces:**
- `.lk-cam-tools` responsive tool row.
- `.lk-cam-tool-button` circular accessible control consistent with Rose Derma.
- `.lk-cam-device-picker` and `.lk-cam-device-chip` for a compact horizontal camera list.
- Front/rear preview classes or modifier support, without overriding frozen-image orientation.

**Steps:**
- [ ] Add styles using existing `--card`, `--bg`, `--text`, `--accent-soft`, `--button-bg`, `--button-text`, and `--border-soft` tokens.
- [ ] Ensure chips remain horizontally usable on narrow screens and touch targets are at least 44px.
- [ ] Run `npm run lint` to ensure no repository lint regressions.

### Task 3: Integrate adaptive camera switching

**Files:**
- Modify: `src/components/CameraCapture.jsx`
- Modify: `src/utils/faceGuide.js` only if needed (it already accepts `mirrored = true`; preserve that public interface).

**Consumes:** Task 1 helper exports and Task 2 CSS classes.

**Behavior:**
- Start with the user/front camera using the exact existing quality ideals.
- After first camera permission, enumerate `videoinput` devices and remember them.
- Derive selected facing mode and device ID from the returned stream track settings, not labels.
- Show a flip button only if more than one camera is exposed. On flip, request the opposite `facingMode`; if it fails, preserve/reacquire the previous stream and leave a concise in-modal status message.
- Show picker chips only when multiple video devices are exposed. Chips request the exact selected `deviceId`; labels use `labelCamera` fallback names.
- Do not stop the working old stream until a replacement stream is acquired. On success, attach the replacement, stop old tracks, update state, clear any pending auto-detection timer, and play the new video.
- Track and clean up replacement streams if component unmounts during an asynchronous switch.
- Mirror only `facingMode === "user"`; pass the same boolean to `mapFaceBoxToOverlay`.
- Keep FaceDetector auto-capture only for the front camera. Rear camera shows manual Capture and an explanatory hint.
- Disable camera controls while switching; use an aria-live status for switching/fallback feedback.

**Steps:**
- [ ] Add imports and state/refs for device list, active facing mode/device ID, switch busy state, and switch feedback.
- [ ] Factor stream attach/request/restart paths so the initial request and switch requests consistently set `audio:false`, current stream ref, HTML video `srcObject`, and `play()`.
- [ ] Enumerate devices only after initial permission; update device state post-switch as labels may now be available.
- [ ] Add the flip and picker controls to the live phase; preserve Capture, Retake, Use photo, upload, escape, and close behavior.
- [ ] Update mirror style/class and face-mapping argument; update hint and detector loop condition for rear/manual mode.
- [ ] Run `npm run build` and `npm run lint`.

### Task 4: Expand guidance data for all concerns

**Files:**
- Modify: `src/data/ingredients.js`

**Produces:**
- Backward-compatible `ingredientMap` and `getIngredientGuidance` for existing keys.
- New topical entries for `pores`, `texture`, `age_spots`, `radiance`, and `firmness`, each with 2–3 `{ name, benefit, how, avoid }` items grounded in ordinary non-prescriptive skin-care guidance.
- `lifestyleGuidance` export keyed by `eye_bags`, `droopy_upper_eyelid`, and `droopy_lower_eyelid`, each containing a concise `note` and `tips` array. Tips must avoid medical diagnosis or a false topical cure; persistent concerns direct users to a dermatologist/professional.

**Steps:**
- [ ] Preserve all existing exports and existing ingredient entries.
- [ ] Add topical entries in the current database shape.
- [ ] Add lifestyle guidance with honest wording and no unsupported treatment claims.
- [ ] Search current consumers of `getIngredientGuidance` and verify their existing keys still resolve.

### Task 5: Replace recommendation threshold and rendering logic

**Files:**
- Modify: `src/components/SkinAnalysisResults.jsx`

**Consumes:** `ingredientMap`/`getIngredientGuidance` and `lifestyleGuidance` from Task 4.

**Behavior:**
- Keep score semantics explicit: `uiScore` is health (higher is better); derive health from structured `uiScore`, and for legacy flat values derive health as `100 - severity`.
- Map all API concern keys: `wrinkle`, `firmness`, `texture`, `pore`, `oiliness`, `acne`, `redness`, `age_spot`, `radiance`, `moisture`, `dark_circle_v2`, `eye_bag`, `droopy_upper_eyelid`, `droopy_lower_eyelid`.
- Map `moisture` to the existing dryness guidance using low moisture health; map singular API keys to database plural keys as needed.
- Render every recognized concern with health `< 90`; `<75` uses `Needs attention`/warning emphasis and `75–89` uses `Room to improve`/monitor emphasis.
- Sort ascending health (worst first). Do not claim all is great unless no recognized concern is below 90.
- Topical cards retain the established ingredient/avoid structure and use the appropriate tier label. Lifestyle cards render note and tips, with no `Recommended ingredients` label and no invalid avoid section.
- Do not alter the overall score headline band or backend payload contract.

**Steps:**
- [ ] Add complete API-to-guidance key metadata and a `guidanceTierFromHealth` helper.
- [ ] Refactor `IngredientGuidance` concern collection to derive health correctly for structured and legacy data; include only health `<90`.
- [ ] Render a topical or lifestyle card based on the mapped guidance type, retaining keyboard accordion behavior and valid ARIA.
- [ ] Verify a pore health score of 84 becomes Room to improve with pore guidance; verify overall health 90+ on all recognized concerns alone shows the all-great empty state.
- [ ] Run `npm run build` and `npm run lint`.

### Task 6: Verify behavior and review the full diff

**Files:**
- No production files expected unless review finds a defect.

**Steps:**
- [ ] Run `npm run build` and `npm run lint` from the app root.
- [ ] Run temporary Node assert helper checks if not already covered by Task 1.
- [ ] Review the entire diff for: no new dependency, no secret exposure, all 14 concern mappings, correct `<75`/`75–89`/`>=90` boundaries, front-only mirroring and auto-capture, no leaked media tracks after switch failure/unmount.
- [ ] Manually verify on a physical phone when available: front→rear→front, any exposed lens chips, rear manual capture, and front auto-capture.
- [ ] Leave all changes uncommitted for the user to inspect, commit, and deploy.
