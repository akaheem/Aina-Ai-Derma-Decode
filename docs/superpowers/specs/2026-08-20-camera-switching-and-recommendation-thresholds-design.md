# Design — Camera switching + recommendation thresholds

**Date:** 2026-08-20
**Status:** Approved (both parts) — pending written-spec review
**Scope:** Two independent behavior changes to the live AinaAi / DermaDecode Analyze flow.

## Problem

Two issues reported from real use on the live app (`aina-ai-derma-decode.web.app`):

1. **Camera has no way to switch lens/facing.** The live-capture modal opens the
   front camera and offers no control to flip to the rear camera, or to pick a
   different lens (e.g. ultra-wide vs wide) on devices that expose several.

2. **Recommendations are too lenient.** A face with visible pores, oiliness, and
   pimples (overall ~70, pores ~84) was told "Your skin looks great — keep up
   your routine" and shown **no** ingredient suggestions. Expected: a
   below-par per-concern score (e.g. pores below ~90) should surface targeted
   guidance.

Both are confirmed against current `main` (commit `3bc51f1`), not stale memory.

---

## Part 1 — Adaptive camera switching

### Goal
Add a control to the capture modal to switch between available cameras
(front⇄back) and, where the device exposes them, individual lenses. Degrade
gracefully across the mixed device base (Android / iOS / desktop). **No new
runtime dependencies.**

### Affected files
- `src/components/CameraCapture.jsx` — switch controls, stream-restart, mirror rule.
- `src/utils/cameraDevices.js` *(new)* — pure/near-pure device helpers, unit-testable.
- `src/index.css` — a few `lk-cam-*` classes for the switch UI.

### Behavior

**Device enumeration.** After the first successful `getUserMedia` (permission
granted — labels are empty before that), call
`navigator.mediaDevices.enumerateDevices()` and keep the `videoinput` entries.
Re-enumerate on device changes is out of scope (static list per session).

**Two controls, each shown only when meaningful:**

- **Front/back flip** — an icon button (reuse `RefreshCw` / camera-flip icon).
  Shown whenever more than one `videoinput` exists. Toggles the requested
  `facingMode` between `"user"` and `"environment"`, then restarts the stream.
- **Lens / camera picker** — a compact chip row (mobile) or the same control
  listing named devices. Shown only when the current side exposes more than one
  device (e.g. Android main + ultra-wide, or multiple desktop webcams).
  Selecting an entry restarts the stream pinned to that exact `deviceId`.

**Stream restart helper.** stop current tracks → `getUserMedia` with the new
constraint (`facingMode` or `{ deviceId: { exact } }`) → reattach to the
`<video>` element → resume the face-detection loop. Reuses the existing
`stopStream` and unmount teardown so no camera track is ever leaked.

**Mirroring rule.** The selfie mirror (`scaleX(-1)`) applies **only to the
front camera**. The rear camera renders un-mirrored. The capture canvas already
draws true-orientation (un-mirrored) and stays that way. The face-detection
overlay mapping's `mirrored` flag follows the same front-only rule.

**Auto-capture scope.** `FaceDetector` auto-capture (align→countdown) stays tied
to the **front** camera, since the oval face-guide assumes a selfie. On the rear
camera the modal uses the manual **Capture** button only; the hint text reflects
this.

### Graceful degradation (per "mixed / not sure")
- **Android Chrome** — each physical lens is a separate `videoinput`: full lens
  picker + flip.
- **iOS Safari** — front/back flip works; the lens picker does not appear
  (iOS does not expose separate rear lenses to the web). No empty/broken control.
- **Desktop** — picker lists connected webcams; flip hidden when only one camera.

### Failure handling
If a switch fails (e.g. `OverconstrainedError` because a requested lens is
unavailable), fall back to the previous working stream and keep the modal alive
— do **not** drop to the full-screen error state. The error screen remains only
for the initial "no camera / permission denied" cases already handled by
`friendlyCameraError`.

### Non-goals (Part 1)
- Re-enumerating on hot-plug / `devicechange`.
- Torch/zoom/exposure controls.
- Changing the auto-capture algorithm or the oval geometry.

---

## Part 2 — Recommendation logic overhaul

### Goal
Surface real, targeted guidance whenever a per-concern **health** score is below
par, across all 14 concerns the API returns — and only say "your skin looks
great" when it genuinely is.

Score semantics (already established, verified in backend `youcamClient.js`):
`ui_score` is a **health** score, higher = better; `severity = 100 - ui_score`.

### Affected files
- `src/components/SkinAnalysisResults.jsx` — the `IngredientGuidance` component
  (tiering, key mapping, lifestyle-card branch).
- `src/data/ingredients.js` — new topical concern entries + a parallel
  lifestyle-guidance map.

### The three current bugs (all in `IngredientGuidance`)
1. **Cutoff too low** — `consider()` ignores anything with `severity < 50`
   (i.e. health > 50), so pores at health 84 never surface.
2. **`pore` (and 7 others) unmapped** — `INGREDIENT_KEY` maps only 6 of 14
   concerns; pores/texture/age-spots/radiance/firmness/eye-bags/eyelids have no
   entry, so even a low score shows nothing.
3. **Dead tier logic** — code requests a `"medium"` ingredient list that does
   not exist in the DB, silently always falling back to `high`.

### Fix (a): Tiered thresholds (health-score based)

| Health score | Tier | Treatment |
|---|---|---|
| **< 75** | ⚠️ Needs attention | Prominent card, full ingredient/guidance list |
| **75–89** | 🔎 Room to improve | Lighter card, ingredient tips |
| **90+** | ✓ Great | Not listed as a concern |

- Concerns are sorted worst-first (lowest health first), so "needs attention"
  cards sit above "room to improve".
- The "✨ Your skin looks great!" message shows **only when every covered
  concern is 90+** (today it shows whenever nothing is below health 50).
- This maps the reported example correctly: pores 84 → "Room to improve" with
  suggestions; oiliness/acne if low → their own cards.

### Fix (b): Full 14-concern coverage (choice: "1 and 3")

**Real topical ingredients (11 concerns).** Extend `ingredientMap` with entries
for **pores, texture, age spots, radiance, firmness**, joining the existing
wrinkles, redness, oiliness, acne, dark circles, and dryness (moisture). Each
entry keeps the existing shape: `{ name, benefit, how, avoid }` per ingredient,
with a `high` ingredient list of ~3 items. The full list renders for both the
"needs attention" and "room to improve" tiers; the tier changes only emphasis
and header copy (see Fix c), not which ingredients are shown.

**Honest lifestyle guidance (3 concerns).** **Eye bags, upper-eyelid droop, and
lower-eyelid droop** have little genuine topical answer. They render as a
distinct card type driven by a new `lifestyleGuidance` map:
`{ note: string, tips: string[] }` — e.g. sleep/elevation, cold compress,
caffeine for temporary puffiness, and "a dermatologist can discuss options" for
persistent cases. No pretend "serum fixes this."

### Fix (c): Data-model + render changes

**`src/data/ingredients.js`:**
- Add the 5 new topical concerns to `ingredientMap` (same `{ name, benefit,
  how, avoid }` shape, `high` list of ~3 ingredients each).
- Add a parallel export `lifestyleGuidance` keyed by the 3 procedural concerns.
- Keep `ingredientMap` and `getIngredientGuidance` **backward compatible** —
  do not remove or rename existing keys. Verify other consumers
  (`RoutineBuilder.jsx`, and the `utils/*_GUIDE.js` docs) still resolve.

**`IngredientGuidance` (in `SkinAnalysisResults.jsx`):**
- Replace `INGREDIENT_KEY` with a complete map covering all 14 API concern keys,
  routing each to either a topical ingredient key or a lifestyle key.
- Replace the `severity < 50` gate with the tiered health thresholds above.
- Add a second render branch: topical concerns render the existing
  ingredient-list card; lifestyle concerns render the `note + tips` card.
- Tier controls emphasis (⚠️ vs 🔎) and the concern header copy
  ("needs attention" vs "to monitor"/"room to improve").

### Non-goals (Part 2)
- Changing the overall headline score/band (a ~70 overall already reads
  "Monitor"/amber correctly).
- Product/brand recommendations, affiliate links, or routine building.
- Medical claims beyond "consider seeing a professional".

---

## Testing & verification
- `npm run build` succeeds.
- `npm run lint` (oxlint) — 0 new errors; rules-of-hooks respected in
  `CameraCapture.jsx` and `IngredientGuidance`.
- Pure helpers in `cameraDevices.js` covered by a dependency-free
  `node:assert` throwaway script (project has `"type":"module"`, no test runner)
  — mirrors the approach used for `faceGuide.js`.
- Manual device checklist: front/back flip on a phone; lens picker where
  present; mirror correctness front vs rear; rear falls back to manual capture;
  recommendation tiers render for a known low-pore result and the
  "all great" empty state only when every concern ≥ 90.

## Rollout
Frontend-only. Existing deploy path unchanged: `npm run build` →
`firebase deploy --only hosting`. No backend, env, or API-contract changes.
The user commits and deploys themselves.
