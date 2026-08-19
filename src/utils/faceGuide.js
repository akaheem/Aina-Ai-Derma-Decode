/**
 * faceGuide.js — pure helpers for the camera face-guide overlay.
 *
 * No React, no DOM dependencies beyond the optional `window.FaceDetector`
 * feature detection, so the geometry is trivially unit-testable.
 *
 * Coordinate spaces:
 * - "intrinsic": the video's real pixel frame (videoWidth x videoHeight).
 * - "display":  pixels inside the on-screen video container. The <video> is
 *   CSS-mirrored (scaleX(-1)) and object-fit: cover, so mapping requires
 *   cover-crop math plus a horizontal mirror.
 * - "fraction": normalized [0..1] of the container. evaluateFace() works in
 *   this space, which makes it resolution-independent.
 */

/**
 * The oval guide, as fractions of the video container's box.
 * Must stay in sync with the <ellipse> in CameraCapture.jsx
 * (cx=50 cy=44 rx=27 ry=36 on a 0..100 viewBox => x=.23 y=.08 w=.54 h=.72).
 */
export const DEFAULT_OVAL = { x: 0.23, y: 0.08, width: 0.54, height: 0.72 };

/** How far the face center may sit from the oval center, as a share of the oval. */
const CENTER_X_TOLERANCE = 0.2;
const CENTER_Y_TOLERANCE = 0.25;

/** Face height as a share of oval height considered "filling the oval with margin".
 *  Chosen so the captured frame satisfies YouCam's error_src_face_too_small /
 *  error_src_face_out_of_bound constraints. */
const MIN_FILL = 0.65;
const MAX_FILL = 0.85;

/**
 * Whether the browser exposes the native Shape Detection API.
 * Only Chrome/Edge on Android/desktop do; iOS Safari and Firefox do not,
 * which is why CameraCapture always keeps a manual Capture fallback.
 * @returns {boolean}
 */
export function isNativeFaceDetectorSupported() {
  return (
    typeof window !== "undefined" &&
    typeof window.FaceDetector === "function"
  );
}

/**
 * Create a single-face, fast-mode FaceDetector, or null when unsupported.
 * @returns {FaceDetector | null}
 */
export function createDetector() {
  if (!isNativeFaceDetectorSupported()) return null;
  try {
    return new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
  } catch {
    return null;
  }
}

/**
 * Map a face bounding box from the video's intrinsic pixel space to the
 * overlay's fraction space, assuming the video is displayed with
 * object-fit: cover and (optionally) horizontally mirrored.
 *
 * @param {{x: number, y: number, width: number, height: number}} faceBox - intrinsic-space box (e.g. DOMRect from FaceDetector)
 * @param {number} videoW - video.videoWidth
 * @param {number} videoH - video.videoHeight
 * @param {number} containerW - displayed container width in CSS px
 * @param {number} containerH - displayed container height in CSS px
 * @param {boolean} [mirrored=true] - whether the preview is CSS-mirrored (selfie view)
 * @returns {{x: number, y: number, width: number, height: number}} fraction-space box
 */
export function mapFaceBoxToOverlay(faceBox, videoW, videoH, containerW, containerH, mirrored = true) {
  if (!faceBox || !videoW || !videoH || !containerW || !containerH) return null;

  const scale = Math.max(containerW / videoW, containerH / videoH);

  // Size is unaffected by cover-crop centering or mirroring.
  const width = (faceBox.width * scale) / containerW;
  const height = (faceBox.height * scale) / containerH;

  // Center of the box in intrinsic px, then cover-mapped into display px.
  const centerDisplayX = (faceBox.x + faceBox.width / 2 - videoW / 2) * scale + containerW / 2;
  const centerDisplayY = (faceBox.y + faceBox.height / 2 - videoH / 2) * scale + containerH / 2;

  const x = mirrored ? 1 - centerDisplayX / containerW : centerDisplayX / containerW;
  const y = centerDisplayY / containerH;

  return { x: x - width / 2, y: y - height / 2, width, height };
}

/**
 * Grade a face box (fraction space) against the oval guide.
 *
 * @param {{x: number, y: number, width: number, height: number} | null} faceBox - fraction-space face box, or null when no face was detected
 * @param {{x: number, y: number, width: number, height: number}} [oval] - fraction-space oval rect (DEFAULT_OVAL)
 * @returns {{status: 'none'|'closer'|'back'|'offcenter'|'good', hint: string}}
 */
export function evaluateFace(faceBox, oval = DEFAULT_OVAL) {
  if (!faceBox) {
    return { status: "none", hint: "Center your face inside the oval" };
  }

  const faceCx = faceBox.x + faceBox.width / 2;
  const faceCy = faceBox.y + faceBox.height / 2;
  const ovalCx = oval.x + oval.width / 2;
  const ovalCy = oval.y + oval.height / 2;

  const offsetX = Math.abs(faceCx - ovalCx) / oval.width;
  const offsetY = Math.abs(faceCy - ovalCy) / oval.height;
  const fill = faceBox.height / oval.height;

  if (offsetX > CENTER_X_TOLERANCE || offsetY > CENTER_Y_TOLERANCE) {
    return { status: "offcenter", hint: "Center your face inside the oval" };
  }
  if (fill < MIN_FILL) {
    return { status: "closer", hint: "Move closer until your face fills the oval" };
  }
  if (fill > MAX_FILL) {
    return { status: "back", hint: "Move back slightly — your face is too close" };
  }
  return { status: "good", hint: "Hold still…" };
}
