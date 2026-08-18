# Live Camera Capture + Rose Derma Consistency Polish — Design

**Date:** 2026-08-19
**App:** Aina Ai Derma Decode (`C:\skin\ainai-app`) — React 19 + Vite 8 + Tailwind v4, plain JSX.
**Status:** Approved design (pending user review of this spec).

---

## 1. Goal

Two deliverables:

1. **Theme consistency** across the Upload, Camera (new), Results, and History/Comparison
   surfaces, plus loading/error/empty states — all matching the existing **Rose Derma**
   editorial theme used by the landing/home and dashboard.
2. **Live camera capture** with a face-shaped oval guide overlay, feeding the captured
   photo into the **existing** skin-analysis pipeline.

## 2. Reality check (findings from exploration)

- **The live theme is warm rose/pink ("Rose Derma"), NOT dark teal/navy.** There is no
  teal/navy/dark theme anywhere in `src/`. The `.dark` class toggled by
  `ThemeContext.jsx` has no matching CSS — it is a dead no-op. User confirmed: match the
  existing Rose Derma theme.
- Theme tokens live in `src/index.css` `:root`: `--bg:#fdf3f3`, `--text:#2e1f24`,
  `--muted:#6b5157`, `--accent:#e8607d`, `--accent-soft:#fbe0e6`, `--card:#fffdfb`,
  `--button-bg:#2e1f24`, `--button-text:#fffdfb`, `--border-soft:rgba(46,31,36,0.1)`,
  `--green:#17c964`. Fonts: Inter + Source Serif 4. Component classes are `lk-*`.
- **Most target surfaces are already themed.** `Dashboard.jsx` (frosted header, pill
  tabs), `UploadSection.jsx` (`lk-panel`, `lk-dropzone`, `lk-btn-primary`),
  `LoadingSpinner.jsx`, `AnalysisHistory.jsx`, `ComparisonView.jsx`,
  `SkinAnalysisResults.jsx`, `SkinHealthScore.jsx`, and `ErrorDisplay.jsx` all use the
  tokens. `index.css` styles bare `input/textarea/select` globally.
- The hardcoded hex values in results/history are the **intentional traffic-light
  severity palette** (high concern = rose `#a83452`, medium = amber `#8a5410/#d98324`,
  low/good = green `#0f7a37/#17a34a`). These are semantic and are KEPT, not flattened.
- **Consequence:** Part 1 is a *consistency audit/polish*, not a reskin. Effort
  concentrates on Part 2 (camera).
- The current file-upload flow does **not** use Firebase Storage. `UploadSection` →
  `compressImage()` → `useSkinAnalysis().analyze(file)` → `SkinAnalysisContext` reads the
  file as base64 and POSTs to the Vercel backend (`VITE_ANALYZE_API_URL`) with the
  Firebase ID token, falling back to the Firebase callable in dev.
- No test runner is installed (no vitest/jest). No `prop-types` dependency.

## 3. Decisions (confirmed with user)

| Decision | Choice |
|---|---|
| Theme direction | Match existing **Rose Derma** (audit/polish, no reskin) |
| Capture mechanism | **Auto-capture where `window.FaceDetector` exists**; **manual Capture fallback** everywhere else (iOS Safari, Firefox). Zero new runtime deps. |
| Auto-capture handoff | Align ~1s → freeze frame → **~2s "Using photo…" countdown with Retake escape** → auto-proceed to analysis |
| Camera UI | **Focused modal** (near-fullscreen), best oval-centering UX (default; not explicitly picked by user — re-confirm at review if inline preferred) |
| Props typing | **JSDoc** (matches project; PropTypes would be a new dep) |
| Integration target | The **existing** compress→analyze pipeline (NOT Firebase Storage) |
| Tests | Manual device checklist + `build`/`lint`. Optional: add vitest for pure `faceGuide.js` only if user wants it. |

## 4. Architecture

### New files
- **`src/components/CameraCapture.jsx`** — self-contained modal component.
  - Props (JSDoc-typed):
    - `onCapture: (file: File) => void` — called with the captured JPEG `File`; parent
      routes it through the existing pipeline.
    - `onClose: () => void` — dismiss the modal / "Switch to Upload".
    - `autoAnalyze?: boolean` (default true) — whether an auto-capture proceeds straight
      to analysis after the countdown.
  - Owns: `MediaStream` (in a ref), `<video>`, offscreen `<canvas>`, oval SVG overlay,
    detection loop, capture/retake/preview state, error state.
- **`src/utils/faceGuide.js`** — pure, dependency-free, JSDoc-documented:
  - `isNativeFaceDetectorSupported(): boolean`
  - `createDetector(): FaceDetector | null`
  - `evaluateFace(faceBox, ovalRect): { status, hint }` where
    `status ∈ {'none','closer','back','offcenter','good'}`. "good" requires the face box
    centered within tolerance AND its height ~65–85% of the oval height (fills the oval
    WITH margin) — chosen to satisfy YouCam's `error_src_face_too_small` and
    `error_src_face_out_of_bound` constraints (see youcam-s2s-api-contract).
  - Isolated so geometry is unit-testable without a camera.

### Modified files
- **`src/components/UploadSection.jsx`**
  - Add a **"Take Photo"** button next to the existing dropzone/upload (secondary style).
  - State `showCamera`. When true, render `<CameraCapture onCapture={handleCaptured}
    onClose={() => setShowCamera(false)} />`.
  - `handleCaptured(file)` calls the existing `processFile(file)` (same compression path).
    For camera captures we also auto-invoke `analyze()` after compression completes so the
    captured photo "flows into analysis" without a second tap. File-upload behaviour is
    unchanged (still requires the explicit "Analyze skin" click).
- **`src/index.css`**
  - Add `.lk-modal` (fixed overlay, scrim, flex-center, `z-index` above header 40),
    `.lk-modal-card` (rounded, `var(--card)`, max-width, responsive full-height on mobile),
    and `.lk-btn-secondary` (extract the bordered-button pattern already inlined in
    `UploadSection`/`Dashboard`). Camera-specific bits: `.lk-cam-video`, `.lk-cam-oval`
    (border color transitions to `var(--green)` on "good"), `.lk-cam-hint`.

### Consistency-audit targets (Part 1)
Grep every reachable component for off-token colors/radii; fix only genuine drift. Known
review points, in priority order:
1. `ErrorDisplay.jsx`, `AnalysisHistory.jsx` empty/error states — confirm rose scrim
   colors match tokens (they largely do).
2. `ComparisonView.jsx`, `SkinHealthScore.jsx`, `SkinAnalysisResults.jsx` — keep severity
   palette; verify surfaces/borders/radii use tokens.
3. `TrendChart.jsx`, `ReportExport.jsx` (Recharts colors → align series to accent/severity).
4. Responsiveness spot-check at 320 / 768 / 1024 / 1280 px for each surface + the modal.

## 5. Camera flow (detail)

```
[Upload panel]
  ├─ "Take Photo" tapped → showCamera = true
  └─ <CameraCapture> mounts
        │
        ├─ getUserMedia({ video: { facingMode: "user" }, audio: false })
        │     ├─ success → live <video> (mirrored), oval overlay drawn
        │     └─ error (denied/none) → error card + "Upload a file instead" (calls onClose)
        │
        ├─ if isNativeFaceDetectorSupported():
        │     loop ~6fps: detect → evaluateFace → update hint + oval color
        │        status 'good' held ~1s → freeze frame → 2s countdown (Retake cancels)
        │        countdown elapses → capture() → onCapture(file) → close modal
        │
        ├─ else (manual): static hints; user taps [Capture] when aligned
        │        → still preview → [Use Photo] → onCapture(file) | [Retake] → live
        │
        └─ controls always: [Capture] [Retake] [Switch to Upload]
             capture(): draw current video frame to <canvas> (un-mirrored) →
                        canvas.toBlob('image/jpeg', 0.92) → new File([blob], 'camera.jpg')
```

**Oval overlay:** an SVG sized to the container via `viewBox` + `preserveAspectRatio`, so
it scales with the video on any screen. A full-rect semi-transparent plum fill
(`rgba(46,31,36,0.6)`) with an elliptical cut-out via `mask`; ellipse stroke = white,
transitions to `var(--green)` when `status==='good'`. Instruction text below the video
in `.lk-cam-hint` (`var(--muted)`), driven by `evaluateFace().hint` (auto) or static copy
(manual): "Center your face inside the oval" / "Move closer or farther until your face
fills the oval".

**Mirroring:** `<video>` shown mirrored (`transform: scaleX(-1)`) for natural selfie
framing; the capture canvas draws **un-mirrored** so the saved/analyzed image is true
orientation (YouCam analyzes the real image, not the mirror).

## 6. Lifecycle & error handling

- Stream kept in `streamRef`. A single `stopStream()` helper runs
  `streamRef.current?.getTracks().forEach(t => t.stop())` and clears the ref + video
  `srcObject`.
- Called on: component unmount (cleanup in `useEffect`), `onClose`/"Switch to Upload",
  and right after a successful capture (no need to keep the camera hot during analysis).
- Detection loop cancelled via `cancelAnimationFrame`/`clearInterval` + an `active` ref
  guard so no callback fires after unmount.
- Permission denied (`NotAllowedError`), no device (`NotFoundError`), or in-use
  (`NotReadableError`) → distinct friendly message in an in-modal rose error card, each
  offering "Upload a file instead".
- Auto-capture never fires without a held-good state, so it can't grab a blank/blurred
  frame; the countdown gives a human override before any YouCam credit is spent.

## 7. Integration (same pipeline as file upload)

Captured `File` → `UploadSection.processFile()` (existing: validates type/size, generates
preview, `compressImage()` to ≤2MB JPEG) → `useSkinAnalysis().analyze(compressedFile)` →
`SkinAnalysisContext` (base64 → POST to Vercel backend w/ Firebase ID token, or dev
callable). Results render in the existing `SkinAnalysisResults` panel via shared context.
**No new network path, no Firebase Storage, no backend change.**

## 8. Responsiveness

- Modal: full-viewport sheet on mobile (≤640px) with safe-area padding; centered card
  (max-w ~480px) on desktop. Video container `width:100%`, aspect kept; oval SVG scales
  via viewBox. Buttons min 48×48px touch targets (existing convention).
- Audit each surface at 320 / 768 / 1024 / 1280 px.

## 9. Out of scope / non-goals

- No external face-detection library (MediaPipe/BlazeFace). Auto-capture is
  progressive-enhancement only; manual capture is the universal guarantee.
- No re-theme to a new color system. No Firebase Storage introduction.
- No changes to the YouCam backend or the analysis contract.
- Orphan legacy pages (BrandDashboard, ContentHub, SkinInsights, etc.) are NOT reachable
  from `App.jsx` and are excluded from the audit.

## 10. Verification

- `npm run build` → exit 0; `npm run lint` → 0 errors.
- Manual device checklist:
  - Chrome/Android: auto-capture fires when centered; hints update; countdown + Retake work.
  - iOS Safari: manual Capture works; oval scales; no auto path errors.
  - Permission denied: friendly error + file-upload fallback.
  - Stream stops (verify camera indicator light off) on close/capture/unmount/tab-switch.
  - Captured photo produces a real analysis result identical to file upload.
  - Theme cohesive across Upload/Camera/Results/History at all breakpoints.

## 11. New dependencies / config

- **None** required at runtime. Uses `navigator.mediaDevices.getUserMedia`, `<canvas>`,
  optional `window.FaceDetector`, plus already-installed `browser-image-compression` and
  `lucide-react` (Camera icon).
- Camera requires a **secure context** (HTTPS or localhost). Production is HTTPS
  (Firebase Hosting) and dev is localhost — both satisfy this. No config change.
- Optional (only if user opts in): add `vitest` as a devDependency to unit-test
  `faceGuide.js` geometry.
